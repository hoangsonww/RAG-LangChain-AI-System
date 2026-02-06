from __future__ import annotations

from typing import Any, Dict, List

import requests
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from rag_system.config import AppSettings

try:
    from loguru import logger
except Exception:  # pragma: no cover - fallback for minimal test envs
    import logging

    logger = logging.getLogger(__name__)


class BackendApiClient:
    """Client for backend routes used by the agentic RAG orchestrator."""

    def __init__(self, settings: AppSettings):
        self._settings = settings
        self._session = requests.Session()
        self._session.headers.update({"Authorization": f"Bearer {settings.api_token}"})

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=3),
        retry=retry_if_exception_type(requests.RequestException),
        reraise=True,
    )
    def _get(
        self, endpoint: str, params: Dict[str, Any] | None = None
    ) -> Dict[str, Any] | List[Any]:
        url = f"{self._settings.api_base_url.rstrip('/')}{endpoint}"
        response = self._session.get(
            url, params=params or {}, timeout=self._settings.api_timeout_seconds
        )
        response.raise_for_status()
        return response.json()

    def _safe_get(
        self, endpoint: str, params: Dict[str, Any] | None = None
    ) -> Dict[str, Any] | List[Any] | None:
        try:
            return self._get(endpoint, params)
        except requests.HTTPError as exc:
            status = exc.response.status_code if exc.response is not None else "unknown"
            if status == 404:
                return None
            raise

    def ping(self) -> Dict[str, Any]:
        payload = self._get("/ping")
        return payload if isinstance(payload, dict) else {"data": payload}

    def is_available(self) -> bool:
        try:
            self.ping()
            return True
        except Exception as exc:  # noqa: BLE001
            logger.warning("Backend API ping failed: {}", exc)
            return False

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=3),
        retry=retry_if_exception_type(requests.RequestException),
        reraise=True,
    )
    def download_documents_zip(self) -> bytes:
        url = f"{self._settings.api_base_url.rstrip('/')}/api/documents/download"
        response = self._session.get(url, timeout=self._settings.api_timeout_seconds)
        response.raise_for_status()
        return response.content

    def team_profile(self, name: str) -> Dict[str, Any] | None:
        result = self._safe_get("/api/team", {"name": name})
        return result if isinstance(result, dict) else None

    def team_insights(self, name: str) -> List[Dict[str, Any]] | None:
        result = self._safe_get("/api/team/insights", {"name": name})
        if isinstance(result, list):
            return [item for item in result if isinstance(item, dict)]
        return None

    def investment_profile(self, company_name: str) -> Dict[str, Any] | None:
        result = self._safe_get("/api/investments", {"company_name": company_name})
        return result if isinstance(result, dict) else None

    def investment_insights(self, company_name: str) -> List[Dict[str, Any]] | None:
        result = self._safe_get(
            "/api/investments/insights", {"company_name": company_name}
        )
        if isinstance(result, list):
            return [item for item in result if isinstance(item, dict)]
        return None

    def sector_profile(self, sector: str) -> Dict[str, Any] | None:
        result = self._safe_get("/api/sectors", {"sector": sector})
        return result if isinstance(result, dict) else None

    def consultations(self, name: str) -> List[Dict[str, Any]] | None:
        result = self._safe_get("/api/consultations", {"name": name})
        if isinstance(result, list):
            return [item for item in result if isinstance(item, dict)]
        return None

    def scrape_page(self, url: str) -> Dict[str, Any] | None:
        result = self._safe_get("/api/scrape", {"url": url})
        return result if isinstance(result, dict) else None

    def run_tool(self, tool: str, **kwargs: Any) -> Any:
        tools = self.available_tools()

        handler = tools.get(tool)
        if handler is None:
            raise ValueError(f"Unsupported backend tool: {tool}")

        return handler(**kwargs)

    def fetch_entity_data(self, entities: Dict[str, List[str]]) -> Dict[str, Any]:
        """Legacy convenience method kept for compatibility."""
        api_data: Dict[str, Any] = {}

        for person in entities.get("persons", [])[:2]:
            profile = self.team_profile(person)
            if profile is not None:
                api_data[f"team_profile:{person}"] = profile

        for company in entities.get("companies", [])[:2]:
            investment = self.investment_profile(company)
            if investment is not None:
                api_data[f"investment_profile:{company}"] = investment

        for sector in entities.get("sectors", [])[:2]:
            info = self.sector_profile(sector)
            if info is not None:
                api_data[f"sector_profile:{sector}"] = info

        return api_data

    def available_tools(self) -> Dict[str, Any]:
        return {
            "team_profile": self.team_profile,
            "team_insights": self.team_insights,
            "investment_profile": self.investment_profile,
            "investment_insights": self.investment_insights,
            "sector_profile": self.sector_profile,
            "consultations": self.consultations,
            "scrape_page": self.scrape_page,
        }

    def tool_names(self) -> List[str]:
        return sorted(self.available_tools().keys())
