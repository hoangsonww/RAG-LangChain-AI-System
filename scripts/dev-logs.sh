#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

TARGET="${1:-all}"
FOLLOW="${2:-}"

resolve_log_paths() {
  case "${TARGET}" in
    backend)
      echo "$(log_file backend)"
      ;;
    rag-app|rag)
      echo "$(log_file rag-app)"
      ;;
    frontend)
      echo "$(log_file frontend)"
      ;;
    all)
      echo "$(log_file backend) $(log_file rag-app) $(log_file frontend)"
      ;;
    *)
      error "Unknown target: ${TARGET}. Use backend|rag-app|frontend|all"
      exit 1
      ;;
  esac
}

ensure_runtime_dirs
PATHS="$(resolve_log_paths)"

# Ensure tail works even before services are started.
for p in ${PATHS}; do
  touch "${p}"
done

if [[ "${FOLLOW}" == "-f" || "${FOLLOW}" == "--follow" ]]; then
  # shellcheck disable=SC2086
  tail -f ${PATHS}
else
  # shellcheck disable=SC2086
  tail -n 120 ${PATHS}
fi
