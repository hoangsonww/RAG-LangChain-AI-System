#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${1:-}"

if [[ -z "${BASE_URL}" ]]; then
  echo "Usage: deploy/scripts/smoke-test.sh <base-url>"
  echo "Example: deploy/scripts/smoke-test.sh https://rag.example.com"
  exit 1
fi

check() {
  local path="$1"
  local expected="${2:-200}"
  local url="${BASE_URL}${path}"

  local code
  code="$(curl -sS -o /tmp/rag-smoke.out -w '%{http_code}' "${url}")"

  if [[ "${code}" != "${expected}" ]]; then
    echo "[FAIL] ${url} -> HTTP ${code} (expected ${expected})"
    cat /tmp/rag-smoke.out
    exit 1
  fi

  echo "[PASS] ${url} -> HTTP ${code}"
}

check "/health" 200
check "/livez" 200
check "/readyz" 200
check "/api/system/info" 200
check "/api/tools" 200

echo "Smoke test completed successfully for ${BASE_URL}."
