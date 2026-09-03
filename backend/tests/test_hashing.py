"""Unit tests for canonical JSON hashing."""
from app.modules.fingerprint import canonical_json, metadata_fingerprint, sha256_hash


def test_canonical_json_sorted_keys():
    data = {"z": 1, "a": 2, "m": 3}
    result = canonical_json(data)
    assert result == '{"a":2,"m":3,"z":1}'


def test_hash_consistency():
    metadata = {
        "source_url": "https://example.com",
        "candidate_image_url": "https://example.com/img.jpg",
        "source_domain": "example.com",
        "similarity_score": 0.942,
        "timestamp": "2026-01-01T00:00:00Z",
    }
    h1 = metadata_fingerprint(metadata)
    h2 = metadata_fingerprint(metadata)
    assert h1 == h2
    assert len(h1) == 64


def test_hash_changes_on_tamper():
    original = {
        "source_url": "https://example.com",
        "candidate_image_url": "https://example.com/img.jpg",
        "source_domain": "example.com",
        "similarity_score": 0.942,
        "timestamp": "2026-01-01T00:00:00Z",
    }
    tampered = dict(original)
    tampered["similarity_score"] = 0.500
    assert metadata_fingerprint(original) != metadata_fingerprint(tampered)


def test_sha256_known_value():
    assert sha256_hash("hello") == "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
