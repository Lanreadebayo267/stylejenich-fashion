"""Small, deterministic intent rules for the catalogue-backed concierge."""

import re
from typing import Literal

ChatIntent = Literal["product_metadata", "discovery"]

_METADATA_PATTERNS = (
    r"\bprice\b",
    r"\bcost\b",
    r"\bhow much\b",
    r"\bsize(?:s)?\b",
    r"\bfit(?:s|ting)?\b",
    r"\bin stock\b",
    r"\bstock\b",
    r"\bavailable\b",
    r"\bavailability\b",
    r"\bdeliver(?:y|ies)?\b",
    r"\bshipping\b",
    r"\blead time\b",
    r"\bwhen can i get\b",
)


def classify_intent(message: str) -> ChatIntent:
    """Route product fact questions away from outfit-discovery retrieval."""
    normalized = re.sub(r"[^a-z0-9]+", " ", message.lower()).strip()
    if any(re.search(pattern, normalized) for pattern in _METADATA_PATTERNS):
        return "product_metadata"
    return "discovery"
