#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

usage() {
  cat <<USAGE
Usage: scripts/setup.sh [--skip-python] [--skip-backend] [--skip-frontend]

Installs dependencies for the full stack:
- Python (.venv + requirements)
- backend (npm ci)
- frontend (npm ci)
USAGE
}

SKIP_PYTHON="false"
SKIP_BACKEND="false"
SKIP_FRONTEND="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-python)
      SKIP_PYTHON="true"
      shift
      ;;
    --skip-backend)
      SKIP_BACKEND="true"
      shift
      ;;
    --skip-frontend)
      SKIP_FRONTEND="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      error "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ "${SKIP_PYTHON}" != "true" ]]; then
  require_command python3
  info "Setting up Python environment"
  if [[ ! -d "${ROOT_DIR}/.venv" ]]; then
    python3 -m venv "${ROOT_DIR}/.venv"
  fi
  "$(python_bin)" -m pip install --upgrade pip
  "$(pip_bin)" install -r "${ROOT_DIR}/requirements.txt"
fi

if [[ "${SKIP_BACKEND}" != "true" ]]; then
  require_command npm
  info "Installing backend dependencies"
  if [[ -f "${ROOT_DIR}/backend/package-lock.json" ]]; then
    (cd "${ROOT_DIR}/backend" && npm ci)
  else
    (cd "${ROOT_DIR}/backend" && npm install)
  fi

  if [[ ! -f "${ROOT_DIR}/backend/.env" && -f "${ROOT_DIR}/backend/.env.example" ]]; then
    info "Creating backend/.env from backend/.env.example"
    cp "${ROOT_DIR}/backend/.env.example" "${ROOT_DIR}/backend/.env"
  fi
fi

if [[ "${SKIP_FRONTEND}" != "true" ]]; then
  require_command npm
  info "Installing frontend dependencies"
  if [[ -f "${ROOT_DIR}/frontend/package-lock.json" ]]; then
    (cd "${ROOT_DIR}/frontend" && npm ci)
  else
    (cd "${ROOT_DIR}/frontend" && npm install)
  fi
fi

info "Setup complete"
