"""Unit tests for face detection."""
import cv2
import numpy as np
import pytest

from app.modules.face_detection import FaceDetector
from app.modules.model_loader import ensure_models


@pytest.fixture(scope="module")
def detector():
    ensure_models()
    return FaceDetector()


@pytest.fixture(scope="module")
def sample_face_image():
    """Create a simple test image; real face tests use downloaded sample."""
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    return img


def test_detector_initializes(detector):
    assert detector is not None


def test_no_face_in_blank_image(detector, sample_face_image):
    faces = detector.detect(sample_face_image)
    assert len(faces) == 0


def test_detect_single_raises_on_no_face(detector, sample_face_image):
    with pytest.raises(ValueError, match="No face detected"):
        detector.detect_single(sample_face_image)
