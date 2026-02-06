#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

REMOVE_VOLUMES="${1:-}"

if [[ "${REMOVE_VOLUMES}" == "--volumes" || "${REMOVE_VOLUMES}" == "-v" ]]; then
  info "Stopping Docker Compose stack and removing volumes"
  (cd "${ROOT_DIR}" && compose_cmd down -v)
else
  info "Stopping Docker Compose stack"
  (cd "${ROOT_DIR}" && compose_cmd down)
fi
