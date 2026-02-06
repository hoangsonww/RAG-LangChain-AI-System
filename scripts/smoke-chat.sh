#!/usr/bin/env bash

set -euo pipefail

if ! command -v curl >/dev/null 2>&1; then
  echo "[ERROR] curl is required for smoke-chat.sh" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "[ERROR] jq is required for smoke-chat.sh" >&2
  exit 1
fi

RAG_BASE_URL="${RAG_BASE_URL:-http://localhost:5000}"

SESSION_ID="$(curl -sS -X POST "${RAG_BASE_URL}/api/session" | jq -r '.session_id')"

if [[ -z "${SESSION_ID}" || "${SESSION_ID}" == "null" ]]; then
  echo "[ERROR] Failed to create session" >&2
  exit 1
fi

echo "[INFO] Created session: ${SESSION_ID}"

echo "[INFO] Checking tools endpoint"
curl -sS "${RAG_BASE_URL}/api/tools" | jq '.tools'

echo "[INFO] Sending /api/chat request"
curl -sS -X POST "${RAG_BASE_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Summarize current portfolio opportunities and risks",
    "strategy": "hybrid",
    "session_id": "'"${SESSION_ID}"'"
  }' | jq '{success, session_id, response: .result.response, strategy: .result.strategy, sources: .result.sources | length, api_chain_trace: (.result.api_chain_trace | length)}'

echo "[INFO] Sending /api/chat/completions request"
curl -sS -X POST "${RAG_BASE_URL}/api/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "strategy": "hybrid",
    "session_id": "'"${SESSION_ID}"'",
    "messages": [
      {"role": "user", "content": "Provide a concise portfolio health summary"}
    ]
  }' | jq '{id, model, choices: (.choices | length), metadata_keys: (.metadata | keys)}'

echo "[INFO] Smoke chat completed successfully"
