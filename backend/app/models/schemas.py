from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class CandidateResult(BaseModel):
    source_url: str
    candidate_image_url: str
    source_domain: str
    similarity_score: Optional[float] = None
    comparison_status: str
    rank: Optional[int] = None
    thumbnail_base64: Optional[str] = None


class DiagnosticsStage(BaseModel):
    success: bool
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class PipelineDiagnostics(BaseModel):
    face_detection: DiagnosticsStage
    face_embedding: DiagnosticsStage
    image_submission: DiagnosticsStage
    search_provider: DiagnosticsStage
    candidate_downloads: list[dict[str, Any]] = Field(default_factory=list)
    face_comparisons: list[dict[str, Any]] = Field(default_factory=list)
    blockchain: Optional[DiagnosticsStage] = None


class FaceAnalysisResult(BaseModel):
    face_detected: bool
    face_count: int
    model_used: str
    embedding_generated: bool
    input_fingerprint: str
    embedding_preview: str


class SearchResult(BaseModel):
    provider: str
    status: str
    result_count: int
    api_status: Optional[int] = None
    message: str
    candidates: list[CandidateResult] = Field(default_factory=list)


class PipelineResponse(BaseModel):
    run_id: str
    status: str
    message: str
    face_analysis: Optional[FaceAnalysisResult] = None
    search: Optional[SearchResult] = None
    best_match: Optional[CandidateResult] = None
    blockchain: Optional[dict[str, Any]] = None
    diagnostics: PipelineDiagnostics


class BlockchainRecordResponse(BaseModel):
    record_id: str
    block_index: int
    data_hash: str
    block_hash: str
    previous_hash: str
    timestamp: str
    metadata: dict[str, Any]
    status: str


class VerificationResponse(BaseModel):
    verified: bool
    status: str
    message: str
    stored_hash: str
    calculated_hash: str
    chain_valid: bool


class RunSummary(BaseModel):
    run_id: str
    timestamp: datetime
    search_status: Optional[str]
    similarity_score: Optional[float]
    block_id: Optional[int]
    verification_status: Optional[str]
    selected_candidate: Optional[str]
