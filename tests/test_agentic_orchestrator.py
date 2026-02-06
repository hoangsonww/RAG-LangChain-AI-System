from rag_system.services.agentic_orchestrator import AgenticApiOrchestrator


class DummyClient:
    def run_tool(self, tool, **kwargs):
        if tool == "investment_profile":
            return {"company_name": kwargs["company_name"], "sectors": ["SaaS"]}
        if tool == "sector_profile":
            return {"sector": kwargs["sector"], "investment_team": ["Scott Varner"]}
        if tool == "team_profile":
            return {"name": kwargs["name"], "role": "Partner"}
        if tool == "team_insights":
            return [{"title": "Insight"}]
        if tool == "investment_insights":
            return [{"title": "Investment Insight"}]
        return {"ok": True}


def test_orchestrator_plans_and_chains_calls():
    orchestrator = AgenticApiOrchestrator(client=DummyClient(), max_calls=10)

    entities = {
        "persons": ["Scott Varner"],
        "companies": ["Acme Cloud"],
        "sectors": [],
        "urls": [],
    }

    api_data, trace = orchestrator.execute(
        query="Tell me about Scott Varner and Acme Cloud investments",
        entities=entities,
        retrieval_context="",
    )

    assert len(trace) > 0
    assert any(item["tool"] == "team_profile" for item in trace)
    assert any(item["tool"] == "investment_profile" for item in trace)
    assert any(key.startswith("sector_profile") for key in api_data)


def test_orchestrator_handles_empty_entities():
    orchestrator = AgenticApiOrchestrator(client=DummyClient(), max_calls=5)

    api_data, trace = orchestrator.execute(
        query="general question with no explicit entity",
        entities={"persons": [], "companies": [], "sectors": [], "urls": []},
        retrieval_context="",
    )

    assert isinstance(api_data, dict)
    assert isinstance(trace, list)
