from __future__ import annotations

import hashlib
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from loguru import logger
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from rag_system.clients import BackendApiClient
from rag_system.config import AppSettings
from rag_system.engine import AdvancedRAGEngine, RAGConfig
from rag_system.models import RetrievalStrategy, STRATEGY_DESCRIPTIONS
from rag_system.storage import InMemorySessionStore, ResponseCache


class ChatService:
    """Application service for RAG chat operations."""

    def __init__(self, settings: AppSettings):
        self._settings = settings
        self._session_store = InMemorySessionStore(
            max_messages=settings.max_session_messages
        )
        self._response_cache = ResponseCache(max_size=settings.response_cache_size)
        self._backend_client = BackendApiClient(settings)

        self._engine_lock = threading.Lock()
        self._engine: Optional[AdvancedRAGEngine] = None

    @property
    def session_store(self) -> InMemorySessionStore:
        return self._session_store

    def _cache_key(
        self, session_id: str | None, query: str, strategy: RetrievalStrategy
    ) -> tuple[str, str, str]:
        normalized_query = " ".join(query.lower().split())
        query_hash = hashlib.sha256(normalized_query.encode("utf-8")).hexdigest()
        return (session_id or "anonymous", strategy.value, query_hash)

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    def get_engine(self) -> AdvancedRAGEngine:
        if self._engine is None:
            with self._engine_lock:
                if self._engine is None:
                    logger.info("Initializing RAG engine instance")
                    config = RAGConfig.from_settings(self._settings)
                    self._engine = AdvancedRAGEngine(
                        config=config, backend_client=self._backend_client
                    )
                    self._engine.initialize_from_api()
        return self._engine

    def is_ready(self) -> bool:
        try:
            return self.get_engine().is_ready
        except Exception:
            return False

    def health(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "timestamp": self._now_iso(),
            "app_name": self._settings.app_name,
            "environment": self._settings.environment,
            "rag_engine_initialized": self._engine is not None,
            "rag_engine_ready": self.is_ready(),
            "backend_api_available": self._backend_client.is_available(),
            "active_sessions": self._session_store.count(),
            "response_cache_size": self._response_cache.size(),
        }

    def create_session(self) -> Dict[str, Any]:
        return self._session_store.create_session()

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self._session_store.get_session(session_id)

    def delete_session(self, session_id: str) -> bool:
        return self._session_store.delete_session(session_id)

    def list_sessions(self) -> Dict[str, Any]:
        sessions = self._session_store.list_sessions()
        return {
            "sessions": sessions,
            "total": len(sessions),
        }

    def process_chat(
        self,
        query: str,
        strategy: str = "hybrid",
        session_id: str | None = None,
        use_cache: bool = True,
    ) -> Dict[str, Any]:
        clean_query = (query or "").strip()
        if not clean_query:
            raise ValueError("Query is required")

        if len(clean_query) > self._settings.max_query_chars:
            raise ValueError(
                f"Query exceeds max length ({self._settings.max_query_chars} characters)"
            )

        retrieval_strategy = RetrievalStrategy.from_value(strategy)
        cache_key = self._cache_key(session_id, clean_query, retrieval_strategy)

        if use_cache:
            cached = self._response_cache.get(cache_key)
            if cached is not None:
                cached["metadata"] = {**cached.get("metadata", {}), "cache_hit": True}
                return {
                    "session_id": session_id,
                    "result": cached,
                }

        start = time.perf_counter()
        result = self.get_engine().query(clean_query, strategy=retrieval_strategy)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        result["metadata"] = {
            **result.get("metadata", {}),
            "cache_hit": False,
            "latency_ms": elapsed_ms,
            "timestamp": self._now_iso(),
            "api_chain_calls": len(result.get("api_chain_trace", [])),
        }

        self._response_cache.set(cache_key, result)

        if session_id:
            self._session_store.append_message(
                session_id=session_id,
                query=clean_query,
                response=result["response"],
                strategy=retrieval_strategy.value,
            )

        return {
            "session_id": session_id,
            "result": result,
        }

    def process_openai_completion(
        self,
        messages: list[dict[str, Any]],
        model: str | None = None,
        session_id: str | None = None,
        strategy: str = "hybrid",
    ) -> Dict[str, Any]:
        if not messages:
            raise ValueError("messages is required")

        last_user_message = ""
        for item in reversed(messages):
            if item.get("role") == "user":
                last_user_message = str(item.get("content", "")).strip()
                break

        if not last_user_message:
            raise ValueError("No user message found in messages")

        result = self.process_chat(
            query=last_user_message,
            strategy=strategy,
            session_id=session_id,
        )["result"]

        completion_id = f"chatcmpl-{uuid.uuid4().hex[:24]}"
        created = int(time.time())

        # Approximate token count for compatibility payload.
        completion_tokens = max(1, len(result["response"]) // 4)
        prompt_tokens = max(1, len(last_user_message) // 4)

        return {
            "id": completion_id,
            "object": "chat.completion",
            "created": created,
            "model": model or self._settings.llm_model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": result["response"],
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
            },
            "metadata": {
                "session_id": session_id,
                "strategy": result.get("strategy"),
                "sources": result.get("sources", []),
                "api_data_keys": result.get("api_data_keys", []),
                "api_chain_trace": result.get("api_chain_trace", []),
            },
        }

    def get_strategies(self) -> Dict[str, Any]:
        items = []
        for strategy in RetrievalStrategy:
            items.append(
                {
                    "id": strategy.value,
                    "name": strategy.value.replace("_", " ").title(),
                    "description": STRATEGY_DESCRIPTIONS[strategy],
                }
            )
        return {"strategies": items}

    def system_info(self) -> Dict[str, Any]:
        return {
            "app_name": self._settings.app_name,
            "api_version": self._settings.api_version,
            "environment": self._settings.environment,
            "llm_model": self._settings.llm_model,
            "embedding_model": self._settings.embedding_model,
            "rerank_model": self._settings.rerank_model,
            "max_query_chars": self._settings.max_query_chars,
            "available_strategies": [
                item["id"] for item in self.get_strategies()["strategies"]
            ],
            "backend_tools": self._backend_client.tool_names(),
        }

    def upload_document(self, file_storage: FileStorage) -> Dict[str, Any]:
        if not file_storage or not file_storage.filename:
            raise ValueError("No file selected")

        extension = Path(file_storage.filename).suffix.lower().lstrip(".")
        if extension not in self._settings.allowed_upload_extensions:
            raise ValueError(
                "File type not allowed. "
                f"Allowed: {sorted(self._settings.allowed_upload_extensions)}"
            )

        safe_name = secure_filename(file_storage.filename)
        unique_name = f"{uuid.uuid4().hex[:12]}_{safe_name}"
        target_path = Path(self._settings.upload_folder) / unique_name
        file_storage.save(target_path)

        added_chunks = self.get_engine().ingest_uploaded_file(str(target_path))

        return {
            "filename": safe_name,
            "stored_as": unique_name,
            "added_chunks": added_chunks,
            "message": "File uploaded and indexed successfully.",
        }
