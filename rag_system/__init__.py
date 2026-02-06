"""Production RAG system package."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from rag_system.engine import AdvancedRAGEngine, RAGConfig
    from rag_system.models import RetrievalResult, RetrievalStrategy

__all__ = ["AdvancedRAGEngine", "RAGConfig", "RetrievalResult", "RetrievalStrategy"]


def __getattr__(name: str):
    if name in {"AdvancedRAGEngine", "RAGConfig"}:
        from rag_system.engine import AdvancedRAGEngine, RAGConfig

        return {"AdvancedRAGEngine": AdvancedRAGEngine, "RAGConfig": RAGConfig}[name]
    if name in {"RetrievalResult", "RetrievalStrategy"}:
        from rag_system.models import RetrievalResult, RetrievalStrategy

        return {
            "RetrievalResult": RetrievalResult,
            "RetrievalStrategy": RetrievalStrategy,
        }[name]
    raise AttributeError(name)
