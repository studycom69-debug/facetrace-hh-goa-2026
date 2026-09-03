"""Download OpenCV YuNet and SFace models if missing."""
import urllib.request

from app.config import MODELS_DIR, SFACE_MODEL, SFACE_URL, YUNET_MODEL, YUNET_URL


def ensure_models() -> tuple[str, str]:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    if not YUNET_MODEL.exists():
        urllib.request.urlretrieve(YUNET_URL, YUNET_MODEL)
    if not SFACE_MODEL.exists():
        urllib.request.urlretrieve(SFACE_URL, SFACE_MODEL)
    return str(YUNET_MODEL), str(SFACE_MODEL)
