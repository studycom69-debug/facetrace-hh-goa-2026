"""Face detection using OpenCV YuNet."""
from dataclasses import dataclass

import cv2
import numpy as np

from app.modules.model_loader import ensure_models


@dataclass
class DetectedFace:
    bbox: tuple[int, int, int, int]  # x, y, w, h
    confidence: float
    landmarks: np.ndarray


class FaceDetector:
    def __init__(self):
        yunet_path, _ = ensure_models()
        self.detector = cv2.FaceDetectorYN.create(
            yunet_path,
            "",
            (320, 320),
            0.6,
            0.3,
            5000,
        )

    def detect(self, image: np.ndarray) -> list[DetectedFace]:
        if image is None or image.size == 0:
            raise ValueError("Invalid image: empty or unreadable")

        h, w = image.shape[:2]
        self.detector.setInputSize((w, h))
        _, faces = self.detector.detect(image)

        if faces is None:
            return []

        results: list[DetectedFace] = []
        for face in faces:
            x, y, fw, fh = int(face[0]), int(face[1]), int(face[2]), int(face[3])
            confidence = float(face[-1])
            landmarks = face[4:14].reshape(5, 2)
            results.append(
                DetectedFace(
                    bbox=(x, y, fw, fh),
                    confidence=confidence,
                    landmarks=landmarks,
                )
            )
        return results

    def detect_single(self, image: np.ndarray) -> DetectedFace:
        faces = self.detect(image)
        if len(faces) == 0:
            raise ValueError("No face detected in image")
        if len(faces) > 1:
            raise ValueError(
                f"Expected exactly one face, found {len(faces)}. "
                "Please upload an image with a single clear face."
            )
        return faces[0]
