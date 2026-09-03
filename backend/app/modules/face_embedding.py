"""Face embedding using OpenCV SFace."""
import hashlib

import cv2
import numpy as np

from app.modules.face_detection import DetectedFace, FaceDetector
from app.modules.model_loader import ensure_models


class FaceEmbedder:
    def __init__(self):
        _, sface_path = ensure_models()
        self.recognizer = cv2.FaceRecognizerSF.create(sface_path, "")
        self.detector = FaceDetector()

    def embed(self, image: np.ndarray, face: DetectedFace | None = None) -> np.ndarray:
        if face is None:
            face = self.detector.detect_single(image)

        x, y, w, h = face.bbox
        aligned = self.recognizer.alignCrop(image, face.landmarks.flatten())
        feature = self.recognizer.feature(aligned)
        return feature

    @staticmethod
    def embedding_fingerprint(embedding: np.ndarray) -> str:
        return hashlib.sha256(embedding.tobytes()).hexdigest()

    @staticmethod
    def embedding_preview(embedding: np.ndarray, chars: int = 16) -> str:
        fp = hashlib.sha256(embedding.tobytes()).hexdigest()
        return f"{fp[:chars]}... ({embedding.shape[1]} dims)"
