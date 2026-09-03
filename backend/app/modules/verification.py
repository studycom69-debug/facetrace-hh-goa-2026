"""Blockchain record verification and tampering detection."""
from typing import Any

from app.modules.blockchain import LocalBlockchain, Block
from app.modules.fingerprint import metadata_fingerprint, canonical_json


class VerificationService:
    def __init__(self, blockchain: LocalBlockchain | None = None):
        self.blockchain = blockchain or LocalBlockchain()

    def verify_metadata(
        self,
        metadata: dict[str, Any],
        stored_data_hash: str,
    ) -> dict[str, Any]:
        calculated_hash = metadata_fingerprint(metadata)
        verified = calculated_hash == stored_data_hash

        return {
            "verified": verified,
            "status": "VERIFIED" if verified else "VERIFICATION FAILED",
            "message": (
                "The current record matches the fingerprint stored on the blockchain."
                if verified
                else "The current record no longer matches the stored fingerprint."
            ),
            "stored_hash": stored_data_hash,
            "calculated_hash": calculated_hash,
        }

    def verify_block_record(
        self,
        block_index: int,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        block = self.blockchain.get_block(block_index)
        if block is None:
            return {
                "verified": False,
                "status": "VERIFICATION FAILED",
                "message": f"Block {block_index} not found in blockchain.",
                "stored_hash": "",
                "calculated_hash": metadata_fingerprint(metadata),
                "chain_valid": False,
            }

        result = self.verify_metadata(metadata, block.data_hash)
        chain_valid, chain_msg = self.blockchain.validate_chain()
        result["chain_valid"] = chain_valid
        result["chain_message"] = chain_msg
        result["block_hash"] = block.block_hash
        result["previous_hash"] = block.previous_hash
        result["block_index"] = block.block_index

        if not chain_valid:
            result["verified"] = False
            result["status"] = "VERIFICATION FAILED"
            result["message"] = f"Chain integrity check failed: {chain_msg}"

        return result

    def verify_record_by_hash(self, data_hash: str, metadata: dict[str, Any]) -> dict[str, Any]:
        block = self.blockchain.find_by_data_hash(data_hash)
        if block is None:
            return {
                "verified": False,
                "status": "VERIFICATION FAILED",
                "message": "No blockchain record found for this fingerprint.",
                "stored_hash": data_hash,
                "calculated_hash": metadata_fingerprint(metadata),
                "chain_valid": False,
            }
        return self.verify_block_record(block.block_index, metadata)
