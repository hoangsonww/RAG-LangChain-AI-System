from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, TYPE_CHECKING

if TYPE_CHECKING:
    from langchain.schema import Document
else:
    try:
        from langchain.schema import Document
    except Exception:  # pragma: no cover - fallback for lightweight test environments
        Document = Any  # type: ignore[misc,assignment]


class RetrievalStrategy(str, Enum):
    """Supported retrieval strategies."""

    SEMANTIC = "semantic"
    HYBRID = "hybrid"
    MULTI_QUERY = "multi_query"
    DECOMPOSED = "decomposed"

    @classmethod
    def from_value(
        cls,
        value: str | None,
        default: "RetrievalStrategy | str" = HYBRID,
    ) -> "RetrievalStrategy":
        if not value:
            return cls(default)
        try:
            return cls(value.strip().lower())
        except ValueError:
            return cls(default)


@dataclass
class RetrievalResult:
    """Result payload for a retrieval operation."""

    documents: List[Document]
    scores: List[float]
    query: str
    strategy: RetrievalStrategy
    metadata: Dict[str, Any] = field(default_factory=dict)


STRATEGY_DESCRIPTIONS = {
    RetrievalStrategy.SEMANTIC: "Pure vector similarity search using embeddings",
    RetrievalStrategy.HYBRID: "Combines semantic and keyword-based (BM25) search",
    RetrievalStrategy.MULTI_QUERY: "Generates query variations for comprehensive retrieval",
    RetrievalStrategy.DECOMPOSED: "Breaks complex queries into simpler sub-queries",
}
