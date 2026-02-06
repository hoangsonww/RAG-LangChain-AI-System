#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ $# -lt 3 ]]; then
  echo "Usage: scripts/deploy-rollout.sh <strategy> <cloud> <action> [service]"
  exit 1
fi

"${ROOT_DIR}/deploy/scripts/rollout.sh" "$@"
