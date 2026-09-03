"""Local tamper-evident simulated blockchain with persistent JSON storage."""
import json
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from app.config import BLOCKCHAIN_PATH
from app.modules.fingerprint import sha256_hash


@dataclass
class Block:
    block_index: int
    timestamp: str
    previous_hash: str
    data_hash: str
    nonce: int
    block_hash: str
    metadata: dict[str, Any]

    def to_dict(self) -> dict:
        return asdict(self)


class LocalBlockchain:
    DIFFICULTY = 2  # leading zeros required in hash

    def __init__(self, ledger_path: Path = BLOCKCHAIN_PATH):
        self.ledger_path = ledger_path
        self.chain: list[Block] = []
        self._load()

    def _load(self):
        if self.ledger_path.exists():
            with open(self.ledger_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.chain = [Block(**b) for b in data.get("chain", [])]
        else:
            self._create_genesis()

    def _save(self):
        self.ledger_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.ledger_path, "w", encoding="utf-8") as f:
            json.dump(
                {"chain": [b.to_dict() for b in self.chain]},
                f,
                indent=2,
            )

    def _create_genesis(self):
        genesis = Block(
            block_index=0,
            timestamp=datetime.utcnow().isoformat() + "Z",
            previous_hash="0" * 64,
            data_hash="0" * 64,
            nonce=0,
            block_hash=self._calculate_block_hash(0, "genesis", "0" * 64, "0" * 64, 0),
            metadata={"type": "genesis"},
        )
        self.chain = [genesis]
        self._save()

    @staticmethod
    def _calculate_block_hash(
        block_index: int,
        timestamp: str,
        previous_hash: str,
        data_hash: str,
        nonce: int,
    ) -> str:
        payload = f"{block_index}{timestamp}{previous_hash}{data_hash}{nonce}"
        return sha256_hash(payload)

    def _mine_block(
        self,
        data_hash: str,
        metadata: dict[str, Any],
    ) -> Block:
        previous = self.chain[-1]
        block_index = previous.block_index + 1
        timestamp = datetime.utcnow().isoformat() + "Z"
        nonce = 0

        while True:
            block_hash = self._calculate_block_hash(
                block_index, timestamp, previous.block_hash, data_hash, nonce
            )
            if block_hash.startswith("0" * self.DIFFICULTY):
                break
            nonce += 1
            if nonce > 1_000_000:
                break

        block = Block(
            block_index=block_index,
            timestamp=timestamp,
            previous_hash=previous.block_hash,
            data_hash=data_hash,
            nonce=nonce,
            block_hash=block_hash,
            metadata=metadata,
        )
        self.chain.append(block)
        self._save()
        return block

    def add_record(self, data_hash: str, metadata: dict[str, Any]) -> Block:
        return self._mine_block(data_hash, metadata)

    def get_block(self, block_index: int) -> Optional[Block]:
        for block in self.chain:
            if block.block_index == block_index:
                return block
        return None

    def get_latest_block(self) -> Block:
        return self.chain[-1]

    def validate_chain(self) -> tuple[bool, str]:
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]

            if current.previous_hash != previous.block_hash:
                return False, f"Chain broken at block {current.block_index}: previous_hash mismatch"

            recalc = self._calculate_block_hash(
                current.block_index,
                current.timestamp,
                current.previous_hash,
                current.data_hash,
                current.nonce,
            )
            if recalc != current.block_hash:
                return False, f"Chain broken at block {current.block_index}: block_hash invalid"

        return True, "Chain integrity valid"

    def find_by_data_hash(self, data_hash: str) -> Optional[Block]:
        for block in self.chain:
            if block.data_hash == data_hash:
                return block
        return None
