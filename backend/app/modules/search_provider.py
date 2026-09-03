"""Search provider abstraction for reverse image / public web search."""
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx

from app.config import SERPAPI_KEY


@dataclass
class SearchCandidate:
    source_url: str
    image_url: str
    title: str
    source_domain: str


@dataclass
class SearchResponse:
    success: bool
    provider: str
    status_code: int | None
    message: str
    candidates: list[SearchCandidate]
    raw_result_count: int


class SearchProvider(ABC):
    @abstractmethod
    def search(
        self,
        image_path: str,
        image_bytes: bytes | None = None,
        public_image_url: str | None = None,
    ) -> SearchResponse:
        pass


class SerpApiGoogleLensProvider(SearchProvider):
    """SerpApi Google Lens reverse image search."""

    SEARCH_URL = "https://serpapi.com/search.json"
    UPLOAD_URL = "https://serpapi.com/image"
    MAX_UPLOAD_BYTES = 500 * 1024  # SerpApi limit

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or SERPAPI_KEY

    def _upload_image(self, client: httpx.Client, image_path: str, image_bytes: bytes) -> tuple[bool, str, str]:
        """Upload image to SerpApi Image API; returns (ok, image_id_or_error, message)."""
        if len(image_bytes) > self.MAX_UPLOAD_BYTES:
            return (
                False,
                "",
                f"Image exceeds SerpApi upload limit ({self.MAX_UPLOAD_BYTES // 1024} KB). "
                "Please use a smaller image.",
            )

        filename = Path(image_path).name or "upload.jpg"
        files = {"image": (filename, image_bytes, "image/jpeg")}
        data = {"api_key": self.api_key}

        response = client.post(self.UPLOAD_URL, files=files, data=data)
        if response.status_code == 401:
            return False, "", "Search provider authentication failed."

        if response.status_code != 200:
            return False, "", f"Image upload failed: HTTP {response.status_code}."

        payload = response.json()
        if "error" in payload:
            return False, "", f"Image upload error: {payload['error']}"

        image_id = payload.get("image_id", "")
        if not image_id:
            return False, "", "Image upload did not return an image_id."

        return True, image_id, "Image uploaded to search provider."

    def search(
        self,
        image_path: str,
        image_bytes: bytes | None = None,
        public_image_url: str | None = None,
    ) -> SearchResponse:
        if not self.api_key:
            return SearchResponse(
                success=False,
                provider="SerpApiGoogleLens",
                status_code=None,
                message="Search provider authentication failed: SERPAPI_KEY is not configured.",
                candidates=[],
                raw_result_count=0,
            )

        try:
            with httpx.Client(timeout=90.0) as client:
                if public_image_url:
                    params: dict[str, Any] = {
                        "engine": "google_lens",
                        "api_key": self.api_key,
                        "url": public_image_url,
                    }
                else:
                    if image_bytes is None:
                        with open(image_path, "rb") as f:
                            image_bytes = f.read()

                    ok, image_id, upload_msg = self._upload_image(client, image_path, image_bytes)
                    if not ok:
                        return SearchResponse(
                            success=False,
                            provider="SerpApiGoogleLens",
                            status_code=None,
                            message=upload_msg,
                            candidates=[],
                            raw_result_count=0,
                        )

                    params = {
                        "engine": "google_lens",
                        "api_key": self.api_key,
                        "image_id": image_id,
                    }

                response = client.get(self.SEARCH_URL, params=params)
                status_code = response.status_code

                if status_code == 401:
                    return SearchResponse(
                        success=False,
                        provider="SerpApiGoogleLens",
                        status_code=status_code,
                        message="Search provider authentication failed.",
                        candidates=[],
                        raw_result_count=0,
                    )

                if status_code == 429:
                    return SearchResponse(
                        success=False,
                        provider="SerpApiGoogleLens",
                        status_code=status_code,
                        message="Search provider quota exhausted.",
                        candidates=[],
                        raw_result_count=0,
                    )

                if status_code != 200:
                    return SearchResponse(
                        success=False,
                        provider="SerpApiGoogleLens",
                        status_code=status_code,
                        message=f"Search provider returned HTTP {status_code}.",
                        candidates=[],
                        raw_result_count=0,
                    )

                data = response.json()

                if "error" in data:
                    return SearchResponse(
                        success=False,
                        provider="SerpApiGoogleLens",
                        status_code=status_code,
                        message=f"Search provider error: {data['error']}",
                        candidates=[],
                        raw_result_count=0,
                    )

                candidates = self._parse_results(data)

                if not candidates:
                    return SearchResponse(
                        success=True,
                        provider="SerpApiGoogleLens",
                        status_code=status_code,
                        message="Search provider returned no visual matches.",
                        candidates=[],
                        raw_result_count=0,
                    )

                return SearchResponse(
                    success=True,
                    provider="SerpApiGoogleLens",
                    status_code=status_code,
                    message=f"Found {len(candidates)} visual match candidates.",
                    candidates=candidates,
                    raw_result_count=len(candidates),
                )

        except httpx.TimeoutException:
            return SearchResponse(
                success=False,
                provider="SerpApiGoogleLens",
                status_code=None,
                message="Search provider request timed out.",
                candidates=[],
                raw_result_count=0,
            )
        except Exception as e:
            return SearchResponse(
                success=False,
                provider="SerpApiGoogleLens",
                status_code=None,
                message=f"Search provider request failed: {str(e)}",
                candidates=[],
                raw_result_count=0,
            )

    def _parse_results(self, data: dict) -> list[SearchCandidate]:
        candidates: list[SearchCandidate] = []
        seen_urls: set[str] = set()

        # Visual matches
        for item in data.get("visual_matches", []) or []:
            source_url = item.get("link", "") or item.get("source", "")
            image_url = item.get("thumbnail", "") or item.get("image", "") or source_url
            title = item.get("title", "")
            domain = self._extract_domain(source_url or image_url)

            key = image_url or source_url
            if key and key not in seen_urls:
                seen_urls.add(key)
                candidates.append(
                    SearchCandidate(
                        source_url=source_url or image_url,
                        image_url=image_url or source_url,
                        title=title,
                        source_domain=domain,
                    )
                )

        # Exact matches
        for item in data.get("exact_matches", []) or []:
            source_url = item.get("link", "")
            image_url = item.get("thumbnail", "") or source_url
            title = item.get("title", "")
            domain = self._extract_domain(source_url)

            key = image_url or source_url
            if key and key not in seen_urls:
                seen_urls.add(key)
                candidates.append(
                    SearchCandidate(
                        source_url=source_url,
                        image_url=image_url,
                        title=title,
                        source_domain=domain,
                    )
                )

        return candidates

    @staticmethod
    def _extract_domain(url: str) -> str:
        try:
            parsed = urlparse(url)
            return parsed.netloc or "unknown"
        except Exception:
            return "unknown"




def get_search_provider() -> SearchProvider:
    if SERPAPI_KEY:
        return SerpApiGoogleLensProvider()
    return SerpApiGoogleLensProvider()  # still returns auth error without key
