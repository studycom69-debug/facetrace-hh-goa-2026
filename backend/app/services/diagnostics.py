"""Pipeline diagnostics tracking."""
from typing import Any

from app.models.schemas import DiagnosticsStage, PipelineDiagnostics


class DiagnosticsCollector:
    def __init__(self):
        self.face_detection: DiagnosticsStage | None = None
        self.face_embedding: DiagnosticsStage | None = None
        self.image_submission: DiagnosticsStage | None = None
        self.search_provider: DiagnosticsStage | None = None
        self.candidate_downloads: list[dict[str, Any]] = []
        self.face_comparisons: list[dict[str, Any]] = []
        self.blockchain: DiagnosticsStage | None = None

    def set_face_detection(self, success: bool, message: str, **details):
        self.face_detection = DiagnosticsStage(
            success=success, message=message, details=details
        )

    def set_face_embedding(self, success: bool, message: str, **details):
        self.face_embedding = DiagnosticsStage(
            success=success, message=message, details=details
        )

    def set_image_submission(self, success: bool, message: str, **details):
        self.image_submission = DiagnosticsStage(
            success=success, message=message, details=details
        )

    def set_search_provider(self, success: bool, message: str, **details):
        self.search_provider = DiagnosticsStage(
            success=success, message=message, details=details
        )

    def add_candidate_download(self, url: str, success: bool, message: str):
        self.candidate_downloads.append(
            {"url": url, "success": success, "message": message}
        )

    def add_face_comparison(
        self,
        url: str,
        success: bool,
        similarity: float | None,
        message: str,
    ):
        self.face_comparisons.append(
            {
                "url": url,
                "success": success,
                "similarity_score": similarity,
                "message": message,
            }
        )

    def set_blockchain(self, success: bool, message: str, **details):
        self.blockchain = DiagnosticsStage(
            success=success, message=message, details=details
        )

    def build(self) -> PipelineDiagnostics:
        return PipelineDiagnostics(
            face_detection=self.face_detection
            or DiagnosticsStage(success=False, message="Not executed"),
            face_embedding=self.face_embedding
            or DiagnosticsStage(success=False, message="Not executed"),
            image_submission=self.image_submission
            or DiagnosticsStage(success=False, message="Not executed"),
            search_provider=self.search_provider
            or DiagnosticsStage(success=False, message="Not executed"),
            candidate_downloads=self.candidate_downloads,
            face_comparisons=self.face_comparisons,
            blockchain=self.blockchain,
        )

    def to_safe_dict(self) -> dict:
        d = self.build().model_dump()
        # Strip any potential secrets from details
        for key in d:
            if isinstance(d[key], dict) and "details" in str(key):
                if "api_key" in d[key].get("details", {}):
                    del d[key]["details"]["api_key"]
        return d
