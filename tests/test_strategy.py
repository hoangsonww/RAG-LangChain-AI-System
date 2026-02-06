from rag_system.models import RetrievalStrategy


def test_from_value_defaults_to_hybrid_for_invalid_values():
    assert RetrievalStrategy.from_value("unknown") is RetrievalStrategy.HYBRID
    assert RetrievalStrategy.from_value(None) is RetrievalStrategy.HYBRID


def test_from_value_parses_valid_value():
    assert RetrievalStrategy.from_value("semantic") is RetrievalStrategy.SEMANTIC
