"""SHA-256 fingerprint generation with canonical JSON."""
import hashlib
import json
from datetime import datetime
from typing import Any


def canonical_json(data: dict[str, Any]) -> str:
    """Deterministic JSON serialization: sorted keys, consistent separators."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hash(data: str | bytes) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def metadata_fingerprint(metadata: dict[str, Any]) -> str:
    canonical = canonical_json(metadata)
    return sha256_hash(canonical)


def build_canonical_metadata(
    source_url: str,
    candidate_image_url: str,
    source_domain: str,
    similarity_score: float,
    timestamp: str | None = None,
) -> dict[str, Any]:
    return {
        "source_url": source_url,
        "candidate_image_url": candidate_image_url,
        "source_domain": source_domain,
        "similarity_score": round(float(similarity_score), 6),
        "timestamp": timestamp or datetime.utcnow().isoformat() + "Z",
    }
