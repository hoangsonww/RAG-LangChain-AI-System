#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

require_command npm

info "Running Python tests"
(cd "${ROOT_DIR}" && pytest -q)

info "Validating backend TypeScript build"
(cd "${ROOT_DIR}/backend" && npm run build)

info "Running frontend typecheck"
(cd "${ROOT_DIR}/frontend" && npm run typecheck)

info "Running frontend production build"
(cd "${ROOT_DIR}/frontend" && npm run build)

info "All tests/checks completed"
