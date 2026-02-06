#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

RUN_SETUP="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --setup)
      RUN_SETUP="true"
      shift
      ;;
    -h|--help)
      echo "Usage: scripts/dev-up.sh [--setup]"
      exit 0
      ;;
    *)
      error "Unknown argument: $1"
      exit 1
      ;;
  esac
done

require_command npm

if [[ "${RUN_SETUP}" == "true" ]]; then
  "${SCRIPT_DIR}/setup.sh"
fi

if [[ ! -x "$(python_bin)" ]]; then
  error "Python runtime is not available. Run scripts/setup.sh first."
  exit 1
fi

start_background_cmd "backend" "cd '${ROOT_DIR}/backend' && npm run dev"
start_background_cmd "rag-app" "cd '${ROOT_DIR}' && '$(python_bin)' run.py"
start_background_cmd "frontend" "cd '${ROOT_DIR}/frontend' && npm run dev -- --host 0.0.0.0 --port 3000"

info "Local development services started"
"${SCRIPT_DIR}/dev-status.sh"
info "Logs directory: ${LOG_DIR}"
