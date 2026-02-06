from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from typing import Any, Dict, Iterable, List, Tuple

try:
    from loguru import logger
except Exception:  # pragma: no cover - fallback for minimal test envs
    import logging

    logger = logging.getLogger(__name__)

from rag_system.clients import BackendApiClient


@dataclass
class PlannedToolCall:
    tool: str
    params: Dict[str, Any]
    reason: str


@dataclass
class ExecutedToolCall:
    tool: str
    params: Dict[str, Any]
    reason: str
    status: str
    error: str | None = None


class AgenticApiOrchestrator:
    """Determines and chains backend API calls to enrich RAG responses."""

    def __init__(self, client: BackendApiClient, max_calls: int = 14):
        self._client = client
        self._max_calls = max_calls

    def execute(
        self,
        query: str,
        entities: Dict[str, List[str]],
        retrieval_context: str = "",
        seed_calls: List[Dict[str, Any]] | None = None,
    ) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
        planned = self._plan_tool_calls(
            query=query, entities=entities, retrieval_context=retrieval_context
        )
        if seed_calls:
            planned = self._merge_seed_calls(seed_calls, planned)

        api_data: Dict[str, Any] = {}
        trace: List[Dict[str, Any]] = []
        index = 0
        while index < len(planned) and len(trace) < self._max_calls:
            tool_call = planned[index]
            index += 1
            key = self._result_key(tool_call.tool, tool_call.params)
            try:
                result = self._client.run_tool(tool_call.tool, **tool_call.params)
                if result is not None:
                    api_data[key] = result
                    trace.append(
                        asdict(
                            ExecutedToolCall(
                                tool=tool_call.tool,
                                params=tool_call.params,
                                reason=tool_call.reason,
                                status="ok",
                            )
                        )
                    )

                    # Chain follow-up calls from responses.
                    follow_ups = self._follow_up_calls(tool_call.tool, result)
                    for item in follow_ups:
                        planned.append(item)
                else:
                    trace.append(
                        asdict(
                            ExecutedToolCall(
                                tool=tool_call.tool,
                                params=tool_call.params,
                                reason=tool_call.reason,
                                status="empty",
                            )
                        )
                    )
            except Exception as exc:  # noqa: BLE001
                logger.debug(
                    "Agentic tool call failed: {} {} -> {}",
                    tool_call.tool,
                    tool_call.params,
                    exc,
                )
                trace.append(
                    asdict(
                        ExecutedToolCall(
                            tool=tool_call.tool,
                            params=tool_call.params,
                            reason=tool_call.reason,
                            status="error",
                            error=str(exc),
                        )
                    )
                )

        return api_data, trace

    def _plan_tool_calls(
        self,
        query: str,
        entities: Dict[str, List[str]],
        retrieval_context: str,
    ) -> List[PlannedToolCall]:
        text = f"{query}\n{retrieval_context}".strip()
        lowered = text.lower()

        persons = self._limit_unique(entities.get("persons", []), 3)
        companies = self._limit_unique(entities.get("companies", []), 3)
        sectors = self._limit_unique(entities.get("sectors", []), 3)
        urls = self._limit_unique(entities.get("urls", []), 1)

        planned: List[PlannedToolCall] = []

        wants_people = any(
            keyword in lowered
            for keyword in ["team", "profile", "who is", "leadership", "partner"]
        )
        wants_investments = any(
            keyword in lowered
            for keyword in ["investment", "portfolio", "company", "invested", "startup"]
        )
        wants_sectors = any(
            keyword in lowered
            for keyword in ["sector", "industry", "vertical", "market"]
        )
        wants_consultations = any(
            keyword in lowered
            for keyword in ["consult", "consultation", "advisor", "advised"]
        )
        wants_scrape = bool(urls) or any(
            keyword in lowered for keyword in ["scrape", "website", "url"]
        )

        for person in persons:
            if (
                wants_people
                or wants_consultations
                or not companies
                or person.lower() in lowered
            ):
                planned.append(
                    PlannedToolCall(
                        tool="team_profile",
                        params={"name": person},
                        reason="person entity detected",
                    )
                )
                planned.append(
                    PlannedToolCall(
                        tool="team_insights",
                        params={"name": person},
                        reason="enrich team profile with insights",
                    )
                )
            if wants_consultations:
                planned.append(
                    PlannedToolCall(
                        tool="consultations",
                        params={"name": person},
                        reason="consultation intent detected",
                    )
                )

        for company in companies:
            if wants_investments or not persons:
                planned.append(
                    PlannedToolCall(
                        tool="investment_profile",
                        params={"company_name": company},
                        reason="company entity detected",
                    )
                )
                planned.append(
                    PlannedToolCall(
                        tool="investment_insights",
                        params={"company_name": company},
                        reason="enrich investment profile with insights",
                    )
                )

        for sector in sectors:
            if wants_sectors or wants_investments:
                planned.append(
                    PlannedToolCall(
                        tool="sector_profile",
                        params={"sector": sector},
                        reason="sector entity/intention detected",
                    )
                )

        if wants_scrape:
            for url in urls:
                planned.append(
                    PlannedToolCall(
                        tool="scrape_page",
                        params={"url": url},
                        reason="url present or scrape intent",
                    )
                )

        if not planned:
            # General fallback: try likely entities anyway.
            for person in persons:
                planned.append(
                    PlannedToolCall(
                        tool="team_profile",
                        params={"name": person},
                        reason="fallback person lookup",
                    )
                )
            for company in companies:
                planned.append(
                    PlannedToolCall(
                        tool="investment_profile",
                        params={"company_name": company},
                        reason="fallback company lookup",
                    )
                )
            for sector in sectors:
                planned.append(
                    PlannedToolCall(
                        tool="sector_profile",
                        params={"sector": sector},
                        reason="fallback sector lookup",
                    )
                )

        return self._dedupe_calls(planned)

    def _follow_up_calls(self, tool: str, result: Any) -> List[PlannedToolCall]:
        follow_ups: List[PlannedToolCall] = []

        if tool == "investment_profile" and isinstance(result, dict):
            sectors = result.get("sectors") or []
            if isinstance(sectors, list):
                for sector in sectors[:2]:
                    if isinstance(sector, str) and sector.strip():
                        follow_ups.append(
                            PlannedToolCall(
                                tool="sector_profile",
                                params={"sector": sector.strip()},
                                reason="derived from investment sectors",
                            )
                        )

        if tool == "sector_profile" and isinstance(result, dict):
            investment_team = result.get("investment_team") or []
            if isinstance(investment_team, list):
                for person in investment_team[:2]:
                    if isinstance(person, str) and person.strip():
                        follow_ups.append(
                            PlannedToolCall(
                                tool="team_profile",
                                params={"name": person.strip()},
                                reason="derived from sector investment_team",
                            )
                        )

        return follow_ups

    @staticmethod
    def _result_key(tool: str, params: Dict[str, Any]) -> str:
        serialized = ",".join(f"{key}={value}" for key, value in sorted(params.items()))
        return f"{tool}({serialized})"

    @staticmethod
    def _limit_unique(items: Iterable[str], limit: int) -> List[str]:
        out: List[str] = []
        seen = set()
        for item in items:
            normalized = item.strip()
            if not normalized:
                continue
            dedupe_key = normalized.lower()
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            out.append(normalized)
            if len(out) >= limit:
                break
        return out

    @staticmethod
    def _dedupe_calls(calls: List[PlannedToolCall]) -> List[PlannedToolCall]:
        out: List[PlannedToolCall] = []
        seen = set()
        for call in calls:
            key = (call.tool, tuple(sorted(call.params.items())))
            if key in seen:
                continue
            seen.add(key)
            out.append(call)
        return out

    def _merge_seed_calls(
        self, seed_calls: List[Dict[str, Any]], planned: List[PlannedToolCall]
    ) -> List[PlannedToolCall]:
        tools = set(self._client.tool_names())
        seeded: List[PlannedToolCall] = []
        for item in seed_calls:
            tool = str(item.get("tool", "")).strip()
            params = item.get("params") or {}
            reason = str(item.get("reason", "llm-planned"))
            if tool not in tools:
                continue
            if not isinstance(params, dict):
                continue
            seeded.append(PlannedToolCall(tool=tool, params=params, reason=reason))
        return self._dedupe_calls(seeded + planned)


def extract_urls(text: str) -> List[str]:
    return re.findall(r"https?://[^\s]+", text)
