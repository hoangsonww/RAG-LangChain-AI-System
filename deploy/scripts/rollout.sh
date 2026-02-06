#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<USAGE
Usage:
  deploy/scripts/rollout.sh <strategy> <cloud> <action> [service]

Arguments:
  strategy: rolling | canary | bluegreen
  cloud:    aws | oci
  action:   apply | status | promote | abort | restart
  service:  backend | rag-app | frontend | all (default: all)

Examples:
  deploy/scripts/rollout.sh rolling aws apply
  deploy/scripts/rollout.sh canary aws status
  deploy/scripts/rollout.sh canary aws promote frontend
  deploy/scripts/rollout.sh bluegreen oci abort rag-app
USAGE
}

if [[ $# -lt 3 ]]; then
  usage
  exit 1
fi

STRATEGY="$1"
CLOUD="$2"
ACTION="$3"
SERVICE="${4:-all}"
NAMESPACE="${NAMESPACE:-rag-system}"

case "${STRATEGY}-${CLOUD}" in
  rolling-aws) OVERLAY="deploy/k8s/overlays/aws" ;;
  rolling-oci) OVERLAY="deploy/k8s/overlays/oci" ;;
  canary-aws) OVERLAY="deploy/k8s/overlays/aws-canary" ;;
  canary-oci) OVERLAY="deploy/k8s/overlays/oci-canary" ;;
  bluegreen-aws) OVERLAY="deploy/k8s/overlays/aws-bluegreen" ;;
  bluegreen-oci) OVERLAY="deploy/k8s/overlays/oci-bluegreen" ;;
  *)
    echo "Unsupported strategy/cloud combination: ${STRATEGY}-${CLOUD}" >&2
    exit 1
    ;;
esac

rollout_services=(backend rag-app frontend)
if [[ "${SERVICE}" != "all" ]]; then
  rollout_services=("${SERVICE}")
fi

require_kubectl_argo_rollouts() {
  if ! kubectl argo rollouts version >/dev/null 2>&1; then
    echo "kubectl-argo-rollouts plugin is required for action '${ACTION}'." >&2
    echo "Install: https://argo-rollouts.readthedocs.io/en/stable/installation/#kubectl-plugin-installation" >&2
    exit 1
  fi
}

case "${ACTION}" in
  apply)
    echo "Applying overlay: ${OVERLAY}"
    kubectl apply -k "${OVERLAY}"
    ;;
  status)
    if [[ "${STRATEGY}" == "rolling" ]]; then
      for svc in "${rollout_services[@]}"; do
        kubectl -n "${NAMESPACE}" rollout status "deploy/${svc}"
      done
    else
      require_kubectl_argo_rollouts
      for svc in "${rollout_services[@]}"; do
        kubectl -n "${NAMESPACE}" argo rollouts get rollout "${svc}" --watch=false
      done
    fi
    ;;
  promote)
    if [[ "${STRATEGY}" == "rolling" ]]; then
      echo "Promote is only available for canary/bluegreen strategies." >&2
      exit 1
    fi
    require_kubectl_argo_rollouts
    for svc in "${rollout_services[@]}"; do
      kubectl -n "${NAMESPACE}" argo rollouts promote "${svc}"
    done
    ;;
  abort)
    if [[ "${STRATEGY}" == "rolling" ]]; then
      echo "Abort is only available for canary/bluegreen strategies." >&2
      exit 1
    fi
    require_kubectl_argo_rollouts
    for svc in "${rollout_services[@]}"; do
      kubectl -n "${NAMESPACE}" argo rollouts abort "${svc}"
    done
    ;;
  restart)
    if [[ "${STRATEGY}" == "rolling" ]]; then
      for svc in "${rollout_services[@]}"; do
        kubectl -n "${NAMESPACE}" rollout restart "deploy/${svc}"
      done
    else
      require_kubectl_argo_rollouts
      for svc in "${rollout_services[@]}"; do
        kubectl -n "${NAMESPACE}" argo rollouts restart "${svc}"
      done
    fi
    ;;
  *)
    echo "Unsupported action: ${ACTION}" >&2
    usage
    exit 1
    ;;
esac
