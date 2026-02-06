#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="${ROOT_DIR}/.run"
LOG_DIR="${RUN_DIR}/logs"

info() {
  echo "[INFO] $*"
}

warn() {
  echo "[WARN] $*" >&2
}

error() {
  echo "[ERROR] $*" >&2
}

require_command() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    error "Missing required command: ${cmd}"
    exit 1
  fi
}

ensure_runtime_dirs() {
  mkdir -p "${RUN_DIR}" "${LOG_DIR}"
}

python_bin() {
  if [[ -x "${ROOT_DIR}/.venv/bin/python" ]]; then
    echo "${ROOT_DIR}/.venv/bin/python"
  elif command -v python3 >/dev/null 2>&1; then
    echo "$(command -v python3)"
  elif command -v python >/dev/null 2>&1; then
    echo "$(command -v python)"
  else
    error "No Python runtime found"
    exit 1
  fi
}

pip_bin() {
  if [[ -x "${ROOT_DIR}/.venv/bin/pip" ]]; then
    echo "${ROOT_DIR}/.venv/bin/pip"
  elif command -v pip3 >/dev/null 2>&1; then
    echo "$(command -v pip3)"
  elif command -v pip >/dev/null 2>&1; then
    echo "$(command -v pip)"
  else
    error "No pip runtime found"
    exit 1
  fi
}

compose_cmd() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    error "Neither 'docker compose' nor 'docker-compose' is available"
    exit 1
  fi
}

pid_file() {
  local name="$1"
  echo "${RUN_DIR}/${name}.pid"
}

log_file() {
  local name="$1"
  echo "${LOG_DIR}/${name}.log"
}

is_pid_running() {
  local pid="$1"
  kill -0 "${pid}" >/dev/null 2>&1
}

start_background_cmd() {
  local name="$1"
  local cmd="$2"
  ensure_runtime_dirs

  local pidfile
  pidfile="$(pid_file "${name}")"

  if [[ -f "${pidfile}" ]]; then
    local existing_pid
    existing_pid="$(cat "${pidfile}")"
    if [[ -n "${existing_pid}" ]] && is_pid_running "${existing_pid}"; then
      warn "${name} already running (pid ${existing_pid})"
      return 0
    fi
    rm -f "${pidfile}"
  fi

  local logfile
  logfile="$(log_file "${name}")"

  info "Starting ${name}: ${cmd}"
  (
    cd "${ROOT_DIR}"
    nohup bash -lc "${cmd}" >"${logfile}" 2>&1 &
    echo $! >"${pidfile}"
  )
}

stop_process() {
  local name="$1"
  local pidfile
  pidfile="$(pid_file "${name}")"

  if [[ ! -f "${pidfile}" ]]; then
    warn "${name} is not running (no pid file)"
    return 0
  fi

  local pid
  pid="$(cat "${pidfile}")"

  if [[ -z "${pid}" ]] || ! is_pid_running "${pid}"; then
    warn "${name} pid file exists but process is not running"
    rm -f "${pidfile}"
    return 0
  fi

  info "Stopping ${name} (pid ${pid})"
  kill "${pid}" >/dev/null 2>&1 || true

  local attempts=20
  while (( attempts > 0 )); do
    if ! is_pid_running "${pid}"; then
      rm -f "${pidfile}"
      info "Stopped ${name}"
      return 0
    fi
    sleep 0.25
    attempts=$((attempts - 1))
  done

  warn "Force stopping ${name} (pid ${pid})"
  kill -9 "${pid}" >/dev/null 2>&1 || true
  rm -f "${pidfile}"
}

print_process_status() {
  local name="$1"
  local pidfile
  pidfile="$(pid_file "${name}")"

  if [[ -f "${pidfile}" ]]; then
    local pid
    pid="$(cat "${pidfile}")"
    if [[ -n "${pid}" ]] && is_pid_running "${pid}"; then
      echo "${name}: running (pid ${pid})"
      return 0
    fi
  fi

  echo "${name}: stopped"
}
