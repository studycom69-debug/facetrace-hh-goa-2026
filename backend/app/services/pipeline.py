"""Main pipeline orchestration service."""
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from app.config import MAX_CANDIDATES, SIMILARITY_THRESHOLD, UPLOADS_DIR
from app.modules.blockchain import LocalBlockchain
from app.modules.candidate_downloader import download_image, image_to_thumbnail_base64
from app.modules.candidate_parser import parse_search_response
from app.modules.face_detection import FaceDetector
from app.modules.face_embedding import FaceEmbedder
from app.modules.fingerprint import build_canonical_metadata, metadata_fingerprint
from app.modules.search_provider import get_search_provider
from app.modules.similarity import cosine_similarity, rank_candidates
from app.services.diagnostics import DiagnosticsCollector


class PipelineService:
    def __init__(self, blockchain: LocalBlockchain | None = None):
        self.detector = FaceDetector()
        self.embedder = FaceEmbedder()
        self.search_provider = get_search_provider()
        self.blockchain = blockchain or LocalBlockchain()

    def resolve_input(
        self,
        content: bytes | None = None,
        filename: str = "upload.jpg",
        image_url: str | None = None,
    ) -> tuple[Path, bytes, str | None]:
        """Resolve pipeline input from uploaded bytes or a public image URL."""
        if image_url:
            ok, image, msg = download_image(image_url)
            if not ok or image is None:
                raise ValueError(msg or "Could not download image from URL")
            _, buffer = cv2.imencode(".jpg", image)
            content = buffer.tobytes()
            path = self.save_upload("url_input.jpg", content)
            return path, content, image_url.strip()

        if content is None:
            raise ValueError("No image provided")

        path = self.save_upload(filename, content)
        return path, content, None

    def save_upload(self, filename: str, content: bytes) -> Path:
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        safe_name = f"{uuid.uuid4().hex}_{Path(filename).name}"
        path = UPLOADS_DIR / safe_name
        path.write_bytes(content)
        return path

    def analyze_face(self, image_path: str | Path) -> dict[str, Any]:
        diag = DiagnosticsCollector()
        image = cv2.imread(str(image_path))
        if image is None:
            diag.set_face_detection(False, "Could not read image file")
            return {"success": False, "diagnostics": diag, "error": "Invalid image file"}

        try:
            face = self.detector.detect_single(image)
            diag.set_face_detection(
                True,
                "Single face detected",
                face_count=1,
                confidence=face.confidence,
                bbox=face.bbox,
            )
        except ValueError as e:
            faces = self.detector.detect(image)
            diag.set_face_detection(
                False,
                str(e),
                face_count=len(faces),
            )
            return {"success": False, "diagnostics": diag, "error": str(e)}

        try:
            embedding = self.embedder.embed(image, face)
            fingerprint = self.embedder.embedding_fingerprint(embedding)
            preview = self.embedder.embedding_preview(embedding)
            diag.set_face_embedding(
                True,
                "SFace embedding generated",
                model="OpenCV SFace",
                dimensions=embedding.shape[1],
            )
        except Exception as e:
            diag.set_face_embedding(False, str(e))
            return {"success": False, "diagnostics": diag, "error": str(e)}

        return {
            "success": True,
            "diagnostics": diag,
            "face_detected": True,
            "face_count": 1,
            "model_used": "OpenCV YuNet + SFace",
            "embedding_generated": True,
            "input_fingerprint": fingerprint,
            "embedding_preview": preview,
            "embedding": embedding,
            "image": image,
        }

    def search_web(
        self,
        image_path: str | Path,
        image_bytes: bytes | None = None,
        public_image_url: str | None = None,
    ) -> dict[str, Any]:
        diag = DiagnosticsCollector()
        if public_image_url:
            diag.set_image_submission(True, "Public image URL submitted to search provider")
        else:
            diag.set_image_submission(True, "Image prepared for search provider")

        response = self.search_provider.search(
            str(image_path),
            image_bytes,
            public_image_url=public_image_url,
        )

        diag.set_search_provider(
            response.success,
            response.message,
            provider=response.provider,
            api_status=response.status_code,
            result_count=response.raw_result_count,
        )

        candidates = parse_search_response(response)[:MAX_CANDIDATES]

        return {
            "success": response.success,
            "diagnostics": diag,
            "provider": response.provider,
            "status": "success" if response.success else "failed",
            "result_count": response.raw_result_count,
            "api_status": response.status_code,
            "message": response.message,
            "candidates": candidates,
        }

    def compare_candidates(
        self,
        input_embedding: np.ndarray,
        candidates: list[dict],
        threshold: float = SIMILARITY_THRESHOLD,
    ) -> dict[str, Any]:
        diag = DiagnosticsCollector()
        processed: list[dict] = []

        for candidate in candidates:
            url = candidate.get("candidate_image_url", "")
            ok, image, msg = download_image(url)
            diag.add_candidate_download(url, ok, msg)

            if not ok or image is None:
                candidate["comparison_status"] = "download_failed"
                candidate["similarity_score"] = None
                processed.append(candidate)
                continue

            try:
                face = self.detector.detect_single(image)
                cand_embedding = self.embedder.embed(image, face)
                score = cosine_similarity(input_embedding, cand_embedding)
                candidate["similarity_score"] = round(score, 4)
                candidate["comparison_status"] = "compared"
                candidate["thumbnail_base64"] = image_to_thumbnail_base64(image)
                diag.add_face_comparison(url, True, score, "Face compared successfully")
            except ValueError as e:
                candidate["comparison_status"] = "no_face_detected"
                candidate["similarity_score"] = None
                diag.add_face_comparison(url, False, None, str(e))
            except Exception as e:
                candidate["comparison_status"] = "comparison_failed"
                candidate["similarity_score"] = None
                diag.add_face_comparison(url, False, None, str(e))

            processed.append(candidate)

        ranked = rank_candidates(input_embedding, processed, threshold)
        best = ranked[0] if ranked and ranked[0].get("similarity_score") else None
        compared_count = sum(1 for c in processed if c.get("similarity_score") is not None)
        match_count = sum(
            1
            for c in ranked
            if c.get("similarity_score") is not None and c["similarity_score"] >= threshold
        )

        return {
            "candidates": ranked,
            "best_match": best if best and best.get("similarity_score", 0) >= threshold else None,
            "candidates_analyzed": compared_count,
            "visual_matches": match_count,
            "diagnostics": diag,
        }

    def create_blockchain_record(
        self,
        source_url: str,
        candidate_image_url: str,
        source_domain: str,
        similarity_score: float,
    ) -> dict[str, Any]:
        diag = DiagnosticsCollector()
        metadata = build_canonical_metadata(
            source_url=source_url,
            candidate_image_url=candidate_image_url,
            source_domain=source_domain,
            similarity_score=similarity_score,
        )
        data_hash = metadata_fingerprint(metadata)
        block = self.blockchain.add_record(data_hash, metadata)

        diag.set_blockchain(
            True,
            "Record stored in local tamper-evident blockchain",
            block_index=block.block_index,
            block_hash=block.block_hash,
        )

        return {
            "success": True,
            "record_id": str(uuid.uuid4()),
            "data_hash": data_hash,
            "block_index": block.block_index,
            "block_hash": block.block_hash,
            "previous_hash": block.previous_hash,
            "timestamp": block.timestamp,
            "metadata": metadata,
            "status": "RECORDED",
            "diagnostics": diag,
        }

    def finalize_pipeline(
        self,
        run_id: str,
        face_result: dict[str, Any],
        search_result: dict[str, Any],
        threshold: float = SIMILARITY_THRESHOLD,
        create_record: bool = True,
    ) -> dict[str, Any]:
        """Compare candidates, optionally record on blockchain, and build response."""
        combined_diag = DiagnosticsCollector()
        combined_diag.face_detection = face_result["diagnostics"].face_detection
        combined_diag.face_embedding = face_result["diagnostics"].face_embedding
        combined_diag.image_submission = search_result["diagnostics"].image_submission
        combined_diag.search_provider = search_result["diagnostics"].search_provider

        if not search_result.get("success"):
            return {
                "run_id": run_id,
                "status": "partial",
                "message": search_result.get("message", "Search failed"),
                "face_analysis": self._face_analysis_payload(face_result),
                "search": self._search_payload(search_result, []),
                "summary": self._summary_payload(search_result, [], None, None),
                "diagnostics": combined_diag.build(),
                "threshold": threshold,
            }

        if not search_result.get("candidates"):
            return {
                "run_id": run_id,
                "status": "partial",
                "message": "No publicly indexed visual matches were found.",
                "face_analysis": self._face_analysis_payload(face_result),
                "search": self._search_payload(search_result, [], status="no_results"),
                "summary": self._summary_payload(search_result, [], None, None),
                "diagnostics": combined_diag.build(),
                "threshold": threshold,
            }

        compare_result = self.compare_candidates(
            face_result["embedding"],
            search_result["candidates"],
            threshold,
        )
        combined_diag.candidate_downloads = compare_result["diagnostics"].candidate_downloads
        combined_diag.face_comparisons = compare_result["diagnostics"].face_comparisons

        best = compare_result.get("best_match")
        blockchain_result = None

        if create_record and best:
            blockchain_result = self.create_blockchain_record(
                source_url=best["source_url"],
                candidate_image_url=best["candidate_image_url"],
                source_domain=best["source_domain"],
                similarity_score=best["similarity_score"],
            )
            combined_diag.blockchain = blockchain_result["diagnostics"].blockchain

        status = "completed" if best else "partial"
        message = (
            f"Best visual match: {best['similarity_score']:.1%}"
            if best
            else "No high-confidence visual match was found."
        )

        return {
            "run_id": run_id,
            "status": status,
            "message": message,
            "face_analysis": self._face_analysis_payload(face_result),
            "search": self._search_payload(search_result, compare_result["candidates"]),
            "best_match": best,
            "blockchain": blockchain_result,
            "summary": self._summary_payload(
                search_result,
                compare_result["candidates"],
                compare_result,
                blockchain_result,
            ),
            "diagnostics": combined_diag.build(),
            "threshold": threshold,
        }

    @staticmethod
    def _face_analysis_payload(face_result: dict[str, Any]) -> dict[str, Any]:
        return {
            "face_detected": bool(face_result.get("face_detected")),
            "face_count": face_result.get("face_count", 0),
            "model_used": face_result.get("model_used", "OpenCV YuNet + SFace"),
            "embedding_generated": bool(face_result.get("embedding_generated")),
            "input_fingerprint": face_result.get("input_fingerprint", ""),
            "embedding_preview": face_result.get("embedding_preview", ""),
        }

    @staticmethod
    def _search_payload(
        search_result: dict[str, Any],
        candidates: list[dict],
        status: str | None = None,
    ) -> dict[str, Any]:
        return {
            "provider": search_result["provider"],
            "status": status or search_result["status"],
            "result_count": search_result["result_count"],
            "api_status": search_result["api_status"],
            "message": search_result["message"],
            "candidates": candidates,
        }

    @staticmethod
    def _summary_payload(
        search_result: dict[str, Any],
        candidates: list[dict],
        compare_result: dict[str, Any] | None,
        blockchain_result: dict[str, Any] | None,
    ) -> dict[str, Any]:
        best_score = None
        if compare_result and compare_result.get("best_match"):
            best_score = compare_result["best_match"].get("similarity_score")

        return {
            "candidates_found": search_result.get("result_count", 0),
            "candidates_analyzed": compare_result.get("candidates_analyzed", 0) if compare_result else 0,
            "visual_matches": compare_result.get("visual_matches", 0) if compare_result else 0,
            "best_similarity": best_score,
            "blockchain_recorded": bool(blockchain_result),
            "verification_status": "recorded" if blockchain_result else "pending",
        }

    def run_full_pipeline(
        self,
        image_path: str | Path,
        image_bytes: bytes,
        filename: str,
        create_record: bool = True,
        threshold: float = SIMILARITY_THRESHOLD,
        public_image_url: str | None = None,
    ) -> dict[str, Any]:
        run_id = str(uuid.uuid4())

        face_result = self.analyze_face(image_path)
        if not face_result.get("success"):
            return {
                "run_id": run_id,
                "status": "failed",
                "message": face_result.get("error", "Face analysis failed"),
                "face_analysis": {
                    "face_detected": False,
                    "face_count": 0,
                    "model_used": "OpenCV YuNet + SFace",
                    "embedding_generated": False,
                    "input_fingerprint": "",
                    "embedding_preview": "",
                },
                "diagnostics": face_result["diagnostics"].build(),
                "threshold": threshold,
            }

        search_result = self.search_web(image_path, image_bytes, public_image_url=public_image_url)
        return self.finalize_pipeline(
            run_id,
            face_result,
            search_result,
            threshold=threshold,
            create_record=create_record,
        )
