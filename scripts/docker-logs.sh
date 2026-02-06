#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

SERVICE="${1:-}"
FOLLOW_FLAG="${2:--f}"

if [[ -n "${SERVICE}" ]]; then
  (cd "${ROOT_DIR}" && compose_cmd logs "${FOLLOW_FLAG}" "${SERVICE}")
else
  (cd "${ROOT_DIR}" && compose_cmd logs "${FOLLOW_FLAG}")
fi
