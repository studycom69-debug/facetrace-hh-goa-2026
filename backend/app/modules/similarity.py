"""Face similarity calculations using OpenCV SFace."""
import cv2
import numpy as np

from app.modules.model_loader import ensure_models


def cosine_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """Calculate cosine similarity between two SFace embeddings."""
    _, sface_path = ensure_models()
    recognizer = cv2.FaceRecognizerSF.create(sface_path, "")
    score = recognizer.match(embedding1, embedding2, cv2.FaceRecognizerSF_FR_COSINE)
    return float(score)


def rank_candidates(
    input_embedding: np.ndarray,
    candidates: list[dict],
    threshold: float,
) -> list[dict]:
    """Rank candidates by similarity score descending; retain failed comparisons."""
    scored = [c for c in candidates if c.get("similarity_score") is not None]
    unscored = [c for c in candidates if c.get("similarity_score") is None]
    scored.sort(key=lambda x: x["similarity_score"], reverse=True)
    for i, c in enumerate(scored):
        c["rank"] = i + 1
        if c["similarity_score"] >= threshold:
            c["comparison_status"] = "compared"
        else:
            c["comparison_status"] = "below_threshold"
    for c in unscored:
        c["rank"] = None
    return scored + unscored
