from __future__ import annotations

import threading
import time
from collections import OrderedDict
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple


@dataclass
class CacheEntry:
    value: Dict[str, Any]
    created_at: float


class ResponseCache:
    """Thread-safe in-memory LRU cache for chat responses."""

    def __init__(self, max_size: int = 200, ttl_seconds: int = 900):
        self._max_size = max_size
        self._ttl_seconds = ttl_seconds
        self._data: OrderedDict[Tuple[str, str, str], CacheEntry] = OrderedDict()
        self._lock = threading.RLock()

    def get(self, key: Tuple[str, str, str]) -> Optional[Dict[str, Any]]:
        with self._lock:
            entry = self._data.get(key)
            if entry is None:
                return None

            if (time.time() - entry.created_at) > self._ttl_seconds:
                self._data.pop(key, None)
                return None

            self._data.move_to_end(key)
            return dict(entry.value)

    def set(self, key: Tuple[str, str, str], value: Dict[str, Any]) -> None:
        with self._lock:
            self._data[key] = CacheEntry(value=dict(value), created_at=time.time())
            self._data.move_to_end(key)
            while len(self._data) > self._max_size:
                self._data.popitem(last=False)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()

    def size(self) -> int:
        with self._lock:
            return len(self._data)
