from rag_system.storage.rate_limiter import InMemoryRateLimiter


def test_rate_limiter_blocks_when_limit_reached():
    limiter = InMemoryRateLimiter(max_requests=2, window_seconds=60)

    first = limiter.allow("client-1")
    second = limiter.allow("client-1")
    third = limiter.allow("client-1")

    assert first.allowed is True
    assert second.allowed is True
    assert third.allowed is False
    assert third.reset_in_seconds >= 1
