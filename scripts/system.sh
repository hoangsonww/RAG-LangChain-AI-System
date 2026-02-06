#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<USAGE
Usage: scripts/system.sh <command> [args]

Commands:
  setup [flags]              Install Python/backend/frontend dependencies
  dev-up [--setup]           Start backend + rag-app + frontend locally
  dev-down                   Stop local dev processes started by dev-up
  dev-status                 Show local dev process status
  dev-logs [svc] [-f]        Tail logs for backend|rag-app|frontend|all

  build                      Build Python/backend/frontend artifacts
  format                     Format TS/JS/HTML/CSS + Python source (excludes docs)
  test                       Run pytest + backend build + frontend checks
  health                     Run local health endpoint checks
  smoke                      Run chat smoke flow against local rag-app

  docker-up                  Start docker compose stack
  docker-down [--volumes]    Stop docker compose stack
  docker-logs [svc] [-f]     View docker compose logs

  deploy <args...>           Proxy to deploy/scripts/rollout.sh
  deploy-smoke <base-url>    Proxy to deploy/scripts/smoke-test.sh

  clean                      Remove runtime pid/log files and python caches
  help                       Show this help
USAGE
}

cmd="${1:-help}"
shift || true

case "${cmd}" in
  setup)
    "${SCRIPT_DIR}/setup.sh" "$@"
    ;;
  dev-up)
    "${SCRIPT_DIR}/dev-up.sh" "$@"
    ;;
  dev-down)
    "${SCRIPT_DIR}/dev-down.sh" "$@"
    ;;
  dev-status)
    "${SCRIPT_DIR}/dev-status.sh" "$@"
    ;;
  dev-logs)
    "${SCRIPT_DIR}/dev-logs.sh" "$@"
    ;;
  build)
    "${SCRIPT_DIR}/build-all.sh" "$@"
    ;;
  format)
    "${SCRIPT_DIR}/format-all.sh" "$@"
    ;;
  test)
    "${SCRIPT_DIR}/test-all.sh" "$@"
    ;;
  health)
    "${SCRIPT_DIR}/health-check.sh" "$@"
    ;;
  smoke)
    "${SCRIPT_DIR}/smoke-chat.sh" "$@"
    ;;
  docker-up)
    "${SCRIPT_DIR}/docker-up.sh" "$@"
    ;;
  docker-down)
    "${SCRIPT_DIR}/docker-down.sh" "$@"
    ;;
  docker-logs)
    "${SCRIPT_DIR}/docker-logs.sh" "$@"
    ;;
  deploy)
    "${SCRIPT_DIR}/deploy-rollout.sh" "$@"
    ;;
  deploy-smoke)
    "${SCRIPT_DIR}/deploy-smoke.sh" "$@"
    ;;
  clean)
    "${SCRIPT_DIR}/clean.sh" "$@"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown command: ${cmd}" >&2
    usage
    exit 1
    ;;
esac
