from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Set

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """Runtime configuration for the RAG API service."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False
    )

    app_name: str = "RAG AI Portfolio Support"
    api_version: str = "v1"
    environment: str = "development"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 5000
    secret_key: str = "dev-secret-key-change-in-production"

    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5000"]
    )
    max_content_length_mb: int = 16
    upload_folder: str = "uploads"

    api_base_url: str = "https://rag-langchain-ai-system.onrender.com"
    api_token: str = "token"
    api_timeout_seconds: int = 10
    api_gateway_token: str = ""
    enable_gateway_auth: bool = False

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    llm_model: str = "llama2"
    rerank_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k: int = 5
    similarity_threshold: float = 0.7

    enable_reranking: bool = True
    enable_hybrid_search: bool = True

    vector_persist_directory: str = "chroma_db"
    vector_collection_name: str = "rag_documents"

    memory_key: str = "chat_history"
    max_memory_length: int = 10
    max_session_messages: int = 100
    max_query_chars: int = 4000
    response_cache_size: int = 200

    log_dir: str = "logs"
    log_level: str = "INFO"
    log_rotation: str = "500 MB"
    log_retention: str = "10 days"

    websocket_chunk_size: int = 60
    websocket_chunk_delay_seconds: float = 0.03
    enable_rate_limit: bool = True
    rate_limit_requests_per_minute: int = 60

    allowed_upload_extensions: Set[str] = Field(
        default_factory=lambda: {"txt", "pdf", "docx", "md"}
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | List[str]) -> List[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @model_validator(mode="after")
    def validate_auth_configuration(self) -> "AppSettings":
        if self.enable_gateway_auth and not self.api_gateway_token:
            raise ValueError(
                "enable_gateway_auth is true but api_gateway_token is not set"
            )
        return self

    @property
    def max_content_length_bytes(self) -> int:
        return self.max_content_length_mb * 1024 * 1024

    def ensure_directories(self) -> None:
        Path(self.upload_folder).mkdir(parents=True, exist_ok=True)
        Path(self.log_dir).mkdir(parents=True, exist_ok=True)
        Path(self.vector_persist_directory).mkdir(parents=True, exist_ok=True)


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    return AppSettings()
