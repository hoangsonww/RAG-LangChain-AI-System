from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Deque, Dict


@dataclass
class RateLimitDecision:
    allowed: bool
    remaining: int
    reset_in_seconds: int


class InMemoryRateLimiter:
    """Simple sliding-window limiter for API protection."""

    def __init__(self, max_requests: int, window_seconds: int):
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = threading.RLock()

    def allow(self, key: str) -> RateLimitDecision:
        now = time.time()
        window_start = now - self._window_seconds

        with self._lock:
            queue = self._hits[key]
            while queue and queue[0] < window_start:
                queue.popleft()

            if len(queue) >= self._max_requests:
                reset_in = max(1, int(self._window_seconds - (now - queue[0])))
                return RateLimitDecision(
                    allowed=False, remaining=0, reset_in_seconds=reset_in
                )

            queue.append(now)
            remaining = max(0, self._max_requests - len(queue))
            reset_in = (
                self._window_seconds
                if not queue
                else max(1, int(self._window_seconds - (now - queue[0])))
            )
            return RateLimitDecision(
                allowed=True, remaining=remaining, reset_in_seconds=reset_in
            )
