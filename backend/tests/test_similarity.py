"""Unit tests for similarity calculations."""
import numpy as np
import pytest

from app.modules.similarity import rank_candidates


def test_rank_candidates_descending():
    candidates = [
        {"similarity_score": 0.3, "comparison_status": "compared"},
        {"similarity_score": 0.9, "comparison_status": "compared"},
        {"similarity_score": 0.6, "comparison_status": "compared"},
    ]
    ranked = rank_candidates(np.array([]), candidates, threshold=0.45)
    assert ranked[0]["similarity_score"] == 0.9
    assert ranked[0]["rank"] == 1
    assert ranked[1]["rank"] == 2


def test_below_threshold_status():
    candidates = [{"similarity_score": 0.2, "comparison_status": "compared"}]
    ranked = rank_candidates(np.array([]), candidates, threshold=0.45)
    assert ranked[0]["comparison_status"] == "below_threshold"
