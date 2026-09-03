"""Download candidate images for face comparison."""
import base64
from io import BytesIO

import cv2
import httpx
import numpy as np


def download_image(url: str, timeout: float = 15.0) -> tuple[bool, np.ndarray | None, str]:
    """Download an image from URL. Returns (success, image_array, message)."""
    if not url or not url.startswith(("http://", "https://")):
        return False, None, "Invalid or missing URL"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "image/*,*/*",
    }

    try:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            response = client.get(url, headers=headers)

            if response.status_code != 200:
                return False, None, f"HTTP {response.status_code}"

            content_type = response.headers.get("content-type", "")
            data = response.content

            if len(data) < 100:
                return False, None, "Response too small to be an image"

            arr = np.frombuffer(data, dtype=np.uint8)
            image = cv2.imdecode(arr, cv2.IMREAD_COLOR)

            if image is None:
                return False, None, "Could not decode image data"

            return True, image, "Downloaded successfully"

    except httpx.TimeoutException:
        return False, None, "Download timed out"
    except Exception as e:
        return False, None, f"Download failed: {str(e)}"


def image_to_thumbnail_base64(image: np.ndarray, max_size: int = 120) -> str:
    h, w = image.shape[:2]
    scale = min(max_size / w, max_size / h, 1.0)
    if scale < 1.0:
        image = cv2.resize(image, (int(w * scale), int(h * scale)))

    _, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return base64.b64encode(buffer).decode("utf-8")
