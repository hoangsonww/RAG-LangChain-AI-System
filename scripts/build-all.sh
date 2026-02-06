#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

require_command npm

info "Compiling Python sources"
"$(python_bin)" -m compileall "${ROOT_DIR}/rag_system" "${ROOT_DIR}/run.py"

info "Building backend"
(cd "${ROOT_DIR}/backend" && npm run build)

info "Building frontend"
(cd "${ROOT_DIR}/frontend" && npm run build)

info "Build complete"
