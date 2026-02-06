#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

info "Starting Docker Compose stack"
(cd "${ROOT_DIR}" && compose_cmd up -d)

info "Docker services"
(cd "${ROOT_DIR}" && compose_cmd ps)
