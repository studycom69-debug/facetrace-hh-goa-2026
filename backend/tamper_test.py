#!/usr/bin/env python3
"""Demonstrate blockchain tampering detection."""
import sys
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from app.modules.blockchain import LocalBlockchain
from app.modules.fingerprint import build_canonical_metadata, metadata_fingerprint
from app.modules.verification import VerificationService


def main():
    with tempfile.TemporaryDirectory() as tmp:
        chain_path = Path(tmp) / "demo_chain.json"
        chain = LocalBlockchain(chain_path)
        service = VerificationService(chain)

        metadata = build_canonical_metadata(
            source_url="https://example.com/original-page",
            candidate_image_url="https://example.com/images/face.jpg",
            source_domain="example.com",
            similarity_score=0.942,
            timestamp="2026-03-01T12:00:00Z",
        )

        data_hash = metadata_fingerprint(metadata)
        block = chain.add_record(data_hash, metadata)

        print("\n" + "-" * 32)
        print("ORIGINAL RECORD")
        print("-" * 32)
        print()
        result = service.verify_block_record(block.block_index, metadata)
        print(f"Stored Hash:\n{result['stored_hash']}\n")
        print(f"Calculated Hash:\n{result['calculated_hash']}\n")
        print(f"STATUS: {result['status']} {'[OK]' if result['verified'] else '[FAIL]'}")

        tampered = dict(metadata)
        tampered["source_url"] = "https://malicious.example.com/fake-page"
        tampered_hash = metadata_fingerprint(tampered)

        print("\n" + "-" * 32)
        print("MODIFIED RECORD")
        print("-" * 32)
        print()
        result2 = service.verify_block_record(block.block_index, tampered)
        print(f"Stored Hash:\n{result2['stored_hash']}\n")
        print(f"Calculated Hash:\n{result2['calculated_hash']}\n")
        print(f"STATUS: {result2['status']} {'[OK]' if result2['verified'] else '[FAIL]'}")
        if not result2["verified"]:
            print("\nTAMPERING DETECTED")

        return 0 if result["verified"] and not result2["verified"] else 1


if __name__ == "__main__":
    sys.exit(main())
