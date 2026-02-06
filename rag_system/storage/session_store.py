from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class InMemorySessionStore:
    """Thread-safe in-memory session store.

    This can be swapped with Redis/DB in production without changing API handlers.
    """

    def __init__(self, max_messages: int = 100):
        self._max_messages = max_messages
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    def create_session(self) -> Dict[str, Any]:
        session_id = str(uuid.uuid4())
        with self._lock:
            self._sessions[session_id] = {
                "created_at": self._now_iso(),
                "messages": [],
            }
            return {"session_id": session_id, **self._sessions[session_id]}

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            session_data = self._sessions.get(session_id)
            if not session_data:
                return None
            return {
                "created_at": session_data["created_at"],
                "messages": list(session_data["messages"]),
            }

    def append_message(
        self, session_id: str, query: str, response: str, strategy: str
    ) -> None:
        with self._lock:
            if session_id not in self._sessions:
                self._sessions[session_id] = {
                    "created_at": self._now_iso(),
                    "messages": [],
                }
            self._sessions[session_id]["messages"].append(
                {
                    "timestamp": self._now_iso(),
                    "query": query,
                    "response": response,
                    "strategy": strategy,
                }
            )
            if len(self._sessions[session_id]["messages"]) > self._max_messages:
                self._sessions[session_id]["messages"] = self._sessions[session_id][
                    "messages"
                ][-self._max_messages :]

    def delete_session(self, session_id: str) -> bool:
        with self._lock:
            return self._sessions.pop(session_id, None) is not None

    def list_sessions(self) -> List[Dict[str, Any]]:
        with self._lock:
            items = []
            for session_id, data in self._sessions.items():
                items.append(
                    {
                        "session_id": session_id,
                        "created_at": data["created_at"],
                        "message_count": len(data["messages"]),
                    }
                )
            return items

    def count(self) -> int:
        with self._lock:
            return len(self._sessions)
