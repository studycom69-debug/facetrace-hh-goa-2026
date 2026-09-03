"""Parse and normalize search provider results."""
from app.modules.search_provider import SearchCandidate, SearchResponse


def parse_search_response(response: SearchResponse) -> list[dict]:
    """Convert SearchResponse candidates to normalized dicts."""
    results = []
    for i, c in enumerate(response.candidates):
        results.append(
            {
                "source_url": c.source_url,
                "candidate_image_url": c.image_url,
                "source_domain": c.source_domain,
                "title": c.title,
                "similarity_score": None,
                "comparison_status": "pending",
                "rank": None,
            }
        )
    return results
