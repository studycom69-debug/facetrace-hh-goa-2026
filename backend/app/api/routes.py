"""FastAPI route handlers."""
import json
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import SIMILARITY_THRESHOLD
from app.database import get_db
from app.models.db_models import BlockchainRecord, Candidate, Run
from app.models.schemas import VerificationResponse
from app.modules.blockchain import LocalBlockchain
from app.modules.verification import VerificationService
from app.services.diagnostics import DiagnosticsCollector
from app.services.pipeline import PipelineService

router = APIRouter()
_shared_blockchain = LocalBlockchain()
pipeline_service = PipelineService(blockchain=_shared_blockchain)
verification_service = VerificationService(blockchain=_shared_blockchain)


def _persist_run(db: Session, result: dict, filename: str):
    run = Run(
        run_id=result["run_id"],
        timestamp=datetime.utcnow(),
        input_fingerprint=result.get("face_analysis", {}).get("input_fingerprint"),
        face_detected=1 if result.get("face_analysis", {}).get("face_detected") else 0,
        search_status=result.get("search", {}).get("status") if result.get("search") else None,
        selected_candidate=result.get("best_match", {}).get("source_url") if result.get("best_match") else None,
        similarity_score=result.get("best_match", {}).get("similarity_score") if result.get("best_match") else None,
        block_id=result.get("blockchain", {}).get("block_index") if result.get("blockchain") else None,
        verification_status="recorded" if result.get("blockchain") else None,
        diagnostics_json=json.dumps(result.get("diagnostics", {}), default=str),
    )
    db.add(run)

    for c in result.get("search", {}).get("candidates", []):
        db.add(
            Candidate(
                run_id=result["run_id"],
                source_url=c.get("source_url"),
                candidate_image_url=c.get("candidate_image_url"),
                source_domain=c.get("source_domain"),
                similarity_score=c.get("similarity_score"),
                comparison_status=c.get("comparison_status"),
                rank=c.get("rank"),
            )
        )

    if result.get("blockchain"):
        bc = result["blockchain"]
        db.add(
            BlockchainRecord(
                record_id=bc["record_id"],
                run_id=result["run_id"],
                block_index=bc["block_index"],
                data_hash=bc["data_hash"],
                block_hash=bc["block_hash"],
                metadata_json=json.dumps(bc["metadata"]),
                verification_status="recorded",
            )
        )

    db.commit()


async def _read_input(
    file: UploadFile | None,
    image_url: str | None,
) -> tuple[bytes, str, str | None]:
    if file is None and not image_url:
        raise HTTPException(status_code=400, detail="Provide an uploaded image or a public image URL.")

    if image_url:
        try:
            path, content, public_url = pipeline_service.resolve_input(image_url=image_url.strip())
            return content, path.name, public_url
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    content = await file.read()
    return content, file.filename or "upload.jpg", None


@router.get("/health")
def health():
    from app.config import SERPAPI_KEY

    return {
        "status": "healthy",
        "service": "FaceTrace API",
        "search_configured": bool(SERPAPI_KEY),
        "similarity_threshold": SIMILARITY_THRESHOLD,
    }


@router.post("/analyze-face")
async def analyze_face(
    file: UploadFile | None = File(default=None),
    image_url: Optional[str] = Form(default=None),
):
    content, filename, _ = await _read_input(file, image_url)
    path = pipeline_service.save_upload(filename, content)
    result = pipeline_service.analyze_face(path)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Face analysis failed"))
    return {
        "face_detected": result["face_detected"],
        "face_count": result["face_count"],
        "model_used": result["model_used"],
        "embedding_generated": result["embedding_generated"],
        "input_fingerprint": result["input_fingerprint"],
        "diagnostics": result["diagnostics"].build().model_dump(),
    }


@router.post("/search")
async def search(
    file: UploadFile | None = File(default=None),
    image_url: Optional[str] = Form(default=None),
):
    content, filename, public_url = await _read_input(file, image_url)
    path = pipeline_service.save_upload(filename, content)
    result = pipeline_service.search_web(path, content, public_image_url=public_url)
    return {
        "provider": result["provider"],
        "status": result["status"],
        "result_count": result["result_count"],
        "api_status": result["api_status"],
        "message": result["message"],
        "candidates": result["candidates"],
        "diagnostics": result["diagnostics"].build().model_dump(),
    }


@router.post("/compare-and-record")
async def compare_and_record(
    file: UploadFile | None = File(default=None),
    image_url: Optional[str] = Form(default=None),
    run_id: str = Form(...),
    candidates_json: str = Form(...),
    search_json: str = Form(...),
    consent: bool = Form(default=False),
    create_record: bool = Form(default=True),
    threshold: float = Form(default=SIMILARITY_THRESHOLD),
    db: Session = Depends(get_db),
):
    if not consent:
        raise HTTPException(
            status_code=400,
            detail="Consent confirmation is required to process the image.",
        )

    content, filename, public_url = await _read_input(file, image_url)
    path = pipeline_service.save_upload(filename, content)

    face_result = pipeline_service.analyze_face(path)
    if not face_result.get("success"):
        raise HTTPException(status_code=400, detail=face_result.get("error", "Face analysis failed"))

    try:
        candidates = json.loads(candidates_json)
        search_meta = json.loads(search_json)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid candidate or search payload.") from exc

    search_diag = DiagnosticsCollector()
    search_diag.set_image_submission(True, search_meta.get("submission_message", "Image submitted for search"))
    search_diag.set_search_provider(
        search_meta.get("status") == "success",
        search_meta.get("message", ""),
        provider=search_meta.get("provider", "SerpApiGoogleLens"),
        api_status=search_meta.get("api_status"),
        result_count=search_meta.get("result_count", 0),
    )

    search_result = {
        "success": search_meta.get("status") == "success",
        "provider": search_meta.get("provider", "SerpApiGoogleLens"),
        "status": search_meta.get("status", "failed"),
        "result_count": search_meta.get("result_count", 0),
        "api_status": search_meta.get("api_status"),
        "message": search_meta.get("message", ""),
        "candidates": candidates,
        "diagnostics": search_diag,
    }

    result = pipeline_service.finalize_pipeline(
        run_id,
        face_result,
        search_result,
        threshold=threshold,
        create_record=create_record,
    )
    result["diagnostics"] = result["diagnostics"].model_dump() if hasattr(result.get("diagnostics"), "model_dump") else result["diagnostics"]
    _persist_run(db, result, filename)
    return result


@router.post("/run-pipeline")
async def run_pipeline(
    file: UploadFile | None = File(default=None),
    image_url: Optional[str] = Form(default=None),
    consent: bool = Form(default=False),
    create_record: bool = Form(default=True),
    threshold: float = Form(default=SIMILARITY_THRESHOLD),
    db: Session = Depends(get_db),
):
    if not consent:
        raise HTTPException(
            status_code=400,
            detail="Consent confirmation is required to process the image.",
        )

    content, filename, public_url = await _read_input(file, image_url)
    path = pipeline_service.save_upload(filename, content)
    result = pipeline_service.run_full_pipeline(
        path, content, filename, create_record, threshold, public_image_url=public_url
    )

    if hasattr(result.get("diagnostics"), "model_dump"):
        result["diagnostics"] = result["diagnostics"].model_dump()

    _persist_run(db, result, filename)
    return result


@router.post("/blockchain/record")
async def create_blockchain_record(
    source_url: str = Form(...),
    candidate_image_url: str = Form(...),
    source_domain: str = Form(...),
    similarity_score: float = Form(...),
    run_id: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
):
    result = pipeline_service.create_blockchain_record(
        source_url, candidate_image_url, source_domain, similarity_score
    )
    record_id = result["record_id"]
    db.add(
        BlockchainRecord(
            record_id=record_id,
            run_id=run_id,
            block_index=result["block_index"],
            data_hash=result["data_hash"],
            block_hash=result["block_hash"],
            metadata_json=json.dumps(result["metadata"]),
            verification_status="recorded",
        )
    )
    db.commit()
    return {
        "record_id": record_id,
        "data_hash": result["data_hash"],
        "block_index": result["block_index"],
        "block_hash": result["block_hash"],
        "previous_hash": result["previous_hash"],
        "timestamp": result["timestamp"],
        "metadata": result["metadata"],
        "status": "RECORDED",
    }


@router.post("/blockchain/verify")
async def verify_blockchain_record(
    record_id: Optional[str] = Form(default=None),
    block_index: Optional[int] = Form(default=None),
    metadata_json: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
):
    metadata = None
    if metadata_json:
        try:
            metadata = json.loads(metadata_json)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Invalid metadata JSON.") from exc

    if record_id:
        record = db.query(BlockchainRecord).filter(BlockchainRecord.record_id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        metadata = json.loads(record.metadata_json)
        block_index = record.block_index

    if metadata is None or block_index is None:
        raise HTTPException(status_code=400, detail="record_id or metadata_json + block_index required")

    result = verification_service.verify_block_record(block_index, metadata)

    if record_id and result["verified"]:
        record = db.query(BlockchainRecord).filter(BlockchainRecord.record_id == record_id).first()
        if record:
            record.verification_status = "verified"
            db.commit()

    return VerificationResponse(
        verified=result["verified"],
        status=result["status"],
        message=result["message"],
        stored_hash=result["stored_hash"],
        calculated_hash=result["calculated_hash"],
        chain_valid=result.get("chain_valid", False),
    )


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    runs = db.query(Run).order_by(Run.timestamp.desc()).all()
    return [
        {
            "run_id": r.run_id,
            "timestamp": r.timestamp.isoformat() + "Z",
            "search_status": r.search_status,
            "similarity_score": r.similarity_score,
            "block_id": r.block_id,
            "verification_status": r.verification_status,
            "selected_candidate": r.selected_candidate,
        }
        for r in runs
    ]


@router.get("/history/{run_id}")
def get_history_detail(run_id: str, db: Session = Depends(get_db)):
    run = db.query(Run).filter(Run.run_id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    candidates = db.query(Candidate).filter(Candidate.run_id == run_id).all()
    record = db.query(BlockchainRecord).filter(BlockchainRecord.run_id == run_id).first()

    return {
        "run_id": run.run_id,
        "timestamp": run.timestamp.isoformat() + "Z",
        "input_fingerprint": run.input_fingerprint,
        "face_detected": bool(run.face_detected),
        "search_status": run.search_status,
        "similarity_score": run.similarity_score,
        "block_id": run.block_id,
        "verification_status": run.verification_status,
        "selected_candidate": run.selected_candidate,
        "diagnostics": json.loads(run.diagnostics_json) if run.diagnostics_json else None,
        "candidates": [
            {
                "source_url": c.source_url,
                "candidate_image_url": c.candidate_image_url,
                "source_domain": c.source_domain,
                "similarity_score": c.similarity_score,
                "comparison_status": c.comparison_status,
                "rank": c.rank,
            }
            for c in candidates
        ],
        "blockchain_record": {
            "record_id": record.record_id,
            "data_hash": record.data_hash,
            "block_index": record.block_index,
            "block_hash": record.block_hash,
            "metadata": json.loads(record.metadata_json),
        }
        if record
        else None,
    }


@router.get("/records")
def get_records(db: Session = Depends(get_db)):
    records = db.query(BlockchainRecord).order_by(BlockchainRecord.created_at.desc()).all()
    return [
        {
            "record_id": r.record_id,
            "source_url": json.loads(r.metadata_json).get("source_url"),
            "source_domain": json.loads(r.metadata_json).get("source_domain"),
            "data_hash": r.data_hash,
            "block_index": r.block_index,
            "created_at": r.created_at.isoformat() + "Z",
            "verification_status": r.verification_status,
        }
        for r in records
    ]


@router.get("/records/{record_id}")
def get_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(BlockchainRecord).filter(BlockchainRecord.record_id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    metadata = json.loads(record.metadata_json)
    block = pipeline_service.blockchain.get_block(record.block_index)

    return {
        "record_id": record.record_id,
        "run_id": record.run_id,
        "block_index": record.block_index,
        "data_hash": record.data_hash,
        "block_hash": record.block_hash,
        "previous_hash": block.previous_hash if block else "",
        "timestamp": record.created_at.isoformat() + "Z",
        "metadata": metadata,
        "verification_status": record.verification_status,
    }
