#!/usr/bin/env python3
"""Backend pipeline integration test script."""
import os
import sys
import urllib.request
from pathlib import Path

# Add backend to path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv

load_dotenv(BACKEND_DIR.parent / ".env")

TEST_IMAGE = BACKEND_DIR / "data" / "test_face.jpg"
TEST_IMAGE_URL = (
    "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg"
)


def download_test_image():
    TEST_IMAGE.parent.mkdir(parents=True, exist_ok=True)
    if not TEST_IMAGE.exists():
        print(f"Downloading test image to {TEST_IMAGE}...")
        urllib.request.urlretrieve(TEST_IMAGE_URL, TEST_IMAGE)
    return TEST_IMAGE


def run_test(name: str, func) -> bool:
    print(f"\n{'='*50}")
    print(f"TEST: {name}")
    print(f"{'='*50}")
    try:
        result = func()
        status = "PASS" if result else "FAIL"
        print(f"RESULT: {status}")
        return result
    except Exception as e:
        print(f"ERROR: {e}")
        print("RESULT: FAIL")
        return False


def test_face_detection():
    import cv2
    from app.modules.face_detection import FaceDetector
    from app.modules.model_loader import ensure_models

    ensure_models()
    image_path = download_test_image()
    image = cv2.imread(str(image_path))
    detector = FaceDetector()
    faces = detector.detect(image)
    print(f"  Faces detected: {len(faces)}")
    if faces:
        print(f"  Confidence: {faces[0].confidence:.3f}")
    return len(faces) >= 1


def test_face_embedding():
    import cv2
    from app.modules.face_detection import FaceDetector
    from app.modules.face_embedding import FaceEmbedder
    from app.modules.model_loader import ensure_models

    ensure_models()
    image = cv2.imread(str(download_test_image()))
    detector = FaceDetector()
    embedder = FaceEmbedder()
    face = detector.detect_single(image)
    embedding = embedder.embed(image, face)
    fp = embedder.embedding_fingerprint(embedding)
    print(f"  Embedding shape: {embedding.shape}")
    print(f"  Fingerprint: {fp[:16]}...")
    return embedding.shape[1] > 0


def test_search_provider():
    from app.modules.search_provider import get_search_provider

    api_key = os.getenv("SERPAPI_KEY", "")
    if not api_key:
        print("  SERPAPI_KEY not configured — search will report auth failure (expected)")
        provider = get_search_provider()
        result = provider.search(str(download_test_image()))
        print(f"  Message: {result.message}")
        return result.message.startswith("Search provider authentication failed")

    provider = get_search_provider()
    with open(download_test_image(), "rb") as f:
        image_bytes = f.read()
    result = provider.search(str(download_test_image()), image_bytes)
    print(f"  Provider: {result.provider}")
    print(f"  Status: {result.status_code}")
    print(f"  Message: {result.message}")
    print(f"  Results: {result.raw_result_count}")
    return result.success or "no visual matches" in result.message.lower()


def test_candidate_processing():
    import cv2
    import numpy as np
    from app.modules.candidate_downloader import download_image
    from app.modules.face_detection import FaceDetector
    from app.modules.face_embedding import FaceEmbedder
    from app.modules.similarity import cosine_similarity
    from app.modules.model_loader import ensure_models

    ensure_models()
    image = cv2.imread(str(download_test_image()))
    detector = FaceDetector()
    embedder = FaceEmbedder()
    face = detector.detect_single(image)
    emb1 = embedder.embed(image, face)

    # Compare same image to itself (should be high similarity)
    score = cosine_similarity(emb1, emb1)
    print(f"  Self-similarity score: {score:.4f}")
    return score > 0.99


def test_blockchain():
    import tempfile
    from app.modules.blockchain import LocalBlockchain
    from app.modules.fingerprint import build_canonical_metadata, metadata_fingerprint

    with tempfile.TemporaryDirectory() as tmp:
        from pathlib import Path

        chain = LocalBlockchain(Path(tmp) / "test_chain.json")
        metadata = build_canonical_metadata(
            source_url="https://test.example.com",
            candidate_image_url="https://test.example.com/img.jpg",
            source_domain="test.example.com",
            similarity_score=0.85,
        )
        data_hash = metadata_fingerprint(metadata)
        block = chain.add_record(data_hash, metadata)
        print(f"  Block index: {block.block_index}")
        print(f"  Block hash: {block.block_hash[:16]}...")
        valid, msg = chain.validate_chain()
        print(f"  Chain valid: {valid}")
        return valid and block.data_hash == data_hash


def test_verification():
    import tempfile
    from pathlib import Path

    from app.modules.blockchain import LocalBlockchain
    from app.modules.fingerprint import build_canonical_metadata, metadata_fingerprint
    from app.modules.verification import VerificationService

    with tempfile.TemporaryDirectory() as tmp:
        chain = LocalBlockchain(Path(tmp) / "test_chain.json")
        service = VerificationService(chain)
        metadata = build_canonical_metadata(
            source_url="https://verify.example.com",
            candidate_image_url="https://verify.example.com/img.jpg",
            source_domain="verify.example.com",
            similarity_score=0.92,
        )
        data_hash = metadata_fingerprint(metadata)
        block = chain.add_record(data_hash, metadata)

        result = service.verify_block_record(block.block_index, metadata)
        print(f"  Original: {result['status']}")

        tampered = dict(metadata)
        tampered["source_url"] = "https://tampered.example.com"
        result2 = service.verify_block_record(block.block_index, tampered)
        print(f"  Tampered: {result2['status']}")

        return result["verified"] and not result2["verified"]


def main():
    print("FaceTrace Backend Pipeline Tests")
    print("=" * 50)

    tests = [
        ("FACE DETECTION", test_face_detection),
        ("FACE EMBEDDING", test_face_embedding),
        ("SEARCH PROVIDER", test_search_provider),
        ("CANDIDATE PROCESSING", test_candidate_processing),
        ("BLOCKCHAIN", test_blockchain),
        ("VERIFICATION", test_verification),
    ]

    results = []
    for name, func in tests:
        results.append((name, run_test(name, func)))

    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    passed = 0
    for name, ok in results:
        status = "PASS" if ok else "FAIL"
        print(f"  {name}: {status}")
        if ok:
            passed += 1

    print(f"\nTotal: {passed}/{len(results)} passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
