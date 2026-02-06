#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

PRETTIER_BIN="${ROOT_DIR}/backend/node_modules/.bin/prettier"
if [[ ! -x "${PRETTIER_BIN}" ]]; then
  if command -v prettier >/dev/null 2>&1; then
    PRETTIER_BIN="$(command -v prettier)"
  else
    error "Prettier not found. Run scripts/setup.sh (backend deps) first."
    exit 1
  fi
fi

run_black() {
  if [[ -x "${ROOT_DIR}/.venv/bin/black" ]]; then
    "${ROOT_DIR}/.venv/bin/black" "$@"
    return
  fi

  if command -v black >/dev/null 2>&1; then
    black "$@"
    return
  fi

  if command -v python3 >/dev/null 2>&1 && python3 -m black --version >/dev/null 2>&1; then
    python3 -m black "$@"
    return
  fi

  error "Black not found. Run scripts/setup.sh (Python deps) first."
  exit 1
}

WEB_FILES=()
while IFS= read -r file; do
  WEB_FILES+=("${file}")
done < <(
  cd "${ROOT_DIR}" && rg --files \
    -g '*.ts' \
    -g '*.tsx' \
    -g '*.js' \
    -g '*.jsx' \
    -g '*.css' \
    -g '*.html' \
    -g '!**/node_modules/**' \
    -g '!**/dist/**' \
    -g '!**/.venv/**' \
    -g '!**/.git/**' \
    -g '!**/.run/**'
)

if (( ${#WEB_FILES[@]} > 0 )); then
  info "Formatting web assets with Prettier (${#WEB_FILES[@]} files)"
  (
    cd "${ROOT_DIR}"
    "${PRETTIER_BIN}" --write "${WEB_FILES[@]}"
  )
else
  warn "No TS/JS/HTML/CSS files found to format."
fi

PY_FILES=()
while IFS= read -r file; do
  PY_FILES+=("${file}")
done < <(
  cd "${ROOT_DIR}" && rg --files \
    -g '*.py' \
    -g '!**/.venv/**' \
    -g '!**/.git/**' \
    -g '!**/.run/**'
)

if (( ${#PY_FILES[@]} > 0 )); then
  info "Formatting Python sources with Black (${#PY_FILES[@]} files)"
  (
    cd "${ROOT_DIR}"
    run_black "${PY_FILES[@]}"
  )
else
  warn "No Python files found to format."
fi

info "Formatting complete."
