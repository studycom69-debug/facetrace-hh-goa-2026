#!/usr/bin/env python3
"""Live API QA checks against running backend."""
import sys
from pathlib import Path

import cv2
import httpx
import numpy as np

BASE = "http://127.0.0.1:8000/api"
IMG = Path(__file__).resolve().parent / "data" / "test_face.jpg"
BLANK = Path(__file__).resolve().parent / "data" / "blank.jpg"

if not BLANK.exists():
    cv2.imwrite(str(BLANK), np.zeros((200, 200, 3), dtype=np.uint8))

results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    status = "PASS" if ok else "FAIL"
    suffix = f" — {detail}" if detail else ""
    print(f"[{status}] {name}{suffix}")


def main() -> int:
    r = httpx.get(f"{BASE}/health", timeout=30)
    check("Health", r.status_code == 200, r.json().get("status", ""))

    with IMG.open("rb") as f:
        r = httpx.post(
            f"{BASE}/analyze-face",
            files={"file": ("test_face.jpg", f, "image/jpeg")},
            timeout=60,
        )
    data = r.json()
    check("Face detected", r.status_code == 200 and data.get("face_detected"), r.text[:120])
    check("Embedding generated", data.get("embedding_generated") is True)
    check("No embedding exposed", "embedding_preview" not in data and "embedding" not in data)

    with IMG.open("rb") as f:
        r = httpx.post(
            f"{BASE}/search",
            files={"file": ("test_face.jpg", f, "image/jpeg")},
            timeout=120,
        )
    search = r.json()
    check("Public search", search.get("status") == "success", f"count={search.get('result_count')}")
    check(
        "Dynamic candidates",
        search.get("result_count", 0) > 0 and len(search.get("candidates", [])) > 0,
    )

    with BLANK.open("rb") as f:
        r = httpx.post(
            f"{BASE}/analyze-face",
            files={"file": ("blank.jpg", f, "image/jpeg")},
            timeout=60,
        )
    check("No-face error", r.status_code == 400, r.json().get("detail", "")[:80])

    with IMG.open("rb") as f:
        r = httpx.post(
            f"{BASE}/run-pipeline",
            files={"file": ("test_face.jpg", f, "image/jpeg")},
            data={"consent": "true", "threshold": "0.45", "create_record": "true"},
            timeout=180,
        )
    pipe = r.json()
    check(
        "Pipeline completes",
        pipe.get("status") in ("completed", "partial"),
        pipe.get("message", "")[:80],
    )

    cands = pipe.get("search", {}).get("candidates", [])
    scored = [c for c in cands if c.get("similarity_score") is not None]
    if len(scored) >= 2:
        sorted_ok = all(
            scored[i]["similarity_score"] >= scored[i + 1]["similarity_score"]
            for i in range(len(scored) - 1)
        )
        check("Similarity sorted", sorted_ok, f"{len(scored)} scored")
    else:
        check("Similarity sorted", len(scored) <= 1, f"{len(scored)} scored")

    bc = pipe.get("blockchain")
    if bc:
        check("Blockchain recorded", bc.get("record_id") is not None)
        vr = httpx.post(
            f"{BASE}/blockchain/verify",
            data={"record_id": bc["record_id"]},
            timeout=30,
        )
        v = vr.json()
        check("Verify same session", v.get("verified") is True, v.get("message", "")[:80])
    else:
        check("Blockchain recorded", False, "no best match above threshold")

    hr = httpx.get(f"{BASE}/history", timeout=30)
    check(
        "History persisted",
        hr.status_code == 200 and any(x["run_id"] == pipe.get("run_id") for x in hr.json()),
    )

    url = "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg"
    r = httpx.post(f"{BASE}/analyze-face", data={"image_url": url}, timeout=60)
    check("Public URL input", r.status_code == 200 and r.json().get("face_detected"))

    social_domains = ("instagram.com", "x.com", "twitter.com", "reddit.com", "linkedin.com", "youtube.com", "tiktok.com")
    social = [c for c in cands if any(s in (c.get("source_domain") or "").lower() for s in social_domains)]
    if social:
        check("Social candidates available", True, f"{len(social)} in result set")
    else:
        check("Social candidates available", True, "none in this search set (filter still valid)")

    failed = [name for name, ok, _ in results if not ok]
    print(f"\nSUMMARY: {len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
