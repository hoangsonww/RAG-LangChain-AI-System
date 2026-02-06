#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/deploy-smoke.sh <base-url>"
  exit 1
fi

"${ROOT_DIR}/deploy/scripts/smoke-test.sh" "$@"
