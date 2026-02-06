#!/usr/bin/env bash

set -euo pipefail

if ! command -v curl >/dev/null 2>&1; then
  echo "[ERROR] curl is required for health-check.sh" >&2
  exit 1
fi

RAG_BASE_URL="${RAG_BASE_URL:-http://localhost:5000}"
BACKEND_BASE_URL="${BACKEND_BASE_URL:-http://localhost:3456}"
FRONTEND_BASE_URL="${FRONTEND_BASE_URL:-http://localhost:3000}"
TMP_OUT="$(mktemp)"
trap 'rm -f "${TMP_OUT}"' EXIT

check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  local code
  code="$(curl -sS -o "${TMP_OUT}" -w '%{http_code}' "${url}")"
  if [[ "${code}" != "${expected}" ]]; then
    echo "[FAIL] ${name} ${url} -> HTTP ${code} (expected ${expected})"
    cat "${TMP_OUT}"
    exit 1
  fi
  echo "[PASS] ${name} ${url} -> HTTP ${code}"
}

check "frontend" "${FRONTEND_BASE_URL}/" 200
check "backend auth" "${BACKEND_BASE_URL}/auth/token" 200
check "rag health" "${RAG_BASE_URL}/health" 200
check "rag livez" "${RAG_BASE_URL}/livez" 200
check "rag readyz" "${RAG_BASE_URL}/readyz" 200
check "rag tools" "${RAG_BASE_URL}/api/tools" 200

echo "Health checks passed."
