from rag_system.storage import InMemorySessionStore


def test_create_and_append_session_messages():
    store = InMemorySessionStore(max_messages=2)
    session = store.create_session()

    store.append_message(session["session_id"], "q1", "a1", "hybrid")
    store.append_message(session["session_id"], "q2", "a2", "semantic")
    store.append_message(session["session_id"], "q3", "a3", "semantic")

    session_data = store.get_session(session["session_id"])
    assert session_data is not None
    assert len(session_data["messages"]) == 2
    assert session_data["messages"][0]["query"] == "q2"


def test_delete_session():
    store = InMemorySessionStore()
    session = store.create_session()

    assert store.delete_session(session["session_id"]) is True
    assert store.delete_session(session["session_id"]) is False
