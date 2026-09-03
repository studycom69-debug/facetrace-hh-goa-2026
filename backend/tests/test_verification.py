"""Unit tests for verification."""
import tempfile
from pathlib import Path

from app.modules.blockchain import LocalBlockchain
from app.modules.fingerprint import build_canonical_metadata, metadata_fingerprint
from app.modules.verification import VerificationService


def test_verify_original_metadata():
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "chain.json"
        chain = LocalBlockchain(path)
        service = VerificationService(chain)

        metadata = build_canonical_metadata(
            source_url="https://example.com/page",
            candidate_image_url="https://example.com/img.jpg",
            source_domain="example.com",
            similarity_score=0.94,
            timestamp="2026-01-01T00:00:00Z",
        )
        data_hash = metadata_fingerprint(metadata)
        block = chain.add_record(data_hash, metadata)

        result = service.verify_block_record(block.block_index, metadata)
        assert result["verified"] is True
        assert result["status"] == "VERIFIED"


def test_verify_tampered_metadata():
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "chain.json"
        chain = LocalBlockchain(path)
        service = VerificationService(chain)

        metadata = build_canonical_metadata(
            source_url="https://example.com/page",
            candidate_image_url="https://example.com/img.jpg",
            source_domain="example.com",
            similarity_score=0.94,
            timestamp="2026-01-01T00:00:00Z",
        )
        data_hash = metadata_fingerprint(metadata)
        block = chain.add_record(data_hash, metadata)

        tampered = dict(metadata)
        tampered["similarity_score"] = 0.50

        result = service.verify_block_record(block.block_index, tampered)
        assert result["verified"] is False
        assert result["status"] == "VERIFICATION FAILED"
