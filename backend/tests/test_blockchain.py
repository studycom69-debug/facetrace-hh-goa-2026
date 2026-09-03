"""Unit tests for blockchain."""
import json
import tempfile
from pathlib import Path

from app.modules.blockchain import LocalBlockchain
from app.modules.fingerprint import metadata_fingerprint


def test_genesis_block_created():
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "chain.json"
        chain = LocalBlockchain(path)
        assert len(chain.chain) == 1
        assert chain.chain[0].block_index == 0


def test_add_block_links_previous():
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "chain.json"
        chain = LocalBlockchain(path)
        metadata = {"source_url": "https://test.com", "similarity_score": 0.9}
        data_hash = metadata_fingerprint(metadata)
        block = chain.add_record(data_hash, metadata)

        assert block.block_index == 1
        assert block.previous_hash == chain.chain[0].block_hash
        assert block.data_hash == data_hash


def test_chain_validation():
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "chain.json"
        chain = LocalBlockchain(path)
        metadata = {"test": "data"}
        chain.add_record(metadata_fingerprint(metadata), metadata)
        valid, msg = chain.validate_chain()
        assert valid is True


def test_persistence():
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "chain.json"
        chain1 = LocalBlockchain(path)
        metadata = {"source_url": "https://persist.com"}
        data_hash = metadata_fingerprint(metadata)
        block = chain1.add_record(data_hash, metadata)

        chain2 = LocalBlockchain(path)
        assert len(chain2.chain) == 2
        assert chain2.chain[-1].data_hash == data_hash
