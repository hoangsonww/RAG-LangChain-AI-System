#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

info "Cleaning runtime pid/log files"
rm -rf "${RUN_DIR}"

info "Cleaning Python cache"
find "${ROOT_DIR}" -type d -name "__pycache__" -prune -exec rm -rf {} +
find "${ROOT_DIR}" -type f -name "*.pyc" -delete

info "Clean complete"
