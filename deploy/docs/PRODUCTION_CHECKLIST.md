# Production Checklist

Use this checklist before a production rollout.

## Security

- [ ] Replace default secrets in `deploy/k8s/base/secret.yaml`
- [ ] Lock down ingress hostnames and TLS (cert-manager or managed TLS)
- [ ] Restrict API access with auth and WAF (cloud-native where possible)
- [ ] Limit `admin_cidr` in OCI Terraform and security groups in AWS
- [ ] Enable image scanning and only deploy signed or vetted images

## Infrastructure

- [ ] Confirm Kubernetes version compatibility (EKS/OKE)
- [ ] Ensure ingress controller is installed (NGINX or AWS ALB)
- [ ] Use managed databases if you need HA (MongoDB/Redis)
- [ ] Validate storage class names in overlays (gp3 or oci-bv)

## Kubernetes

- [ ] Set resource requests/limits for all services
- [ ] Confirm readiness/liveness probes pass
- [ ] Configure pod disruption budgets for frontend and backend
- [ ] Add `imagePullSecrets` for private registries

## Data & Backups

- [ ] Schedule MongoDB backups (if self-hosted)
- [ ] Snapshot PVCs for ChromaDB and uploads
- [ ] Test restore procedures on a staging cluster

## Observability

- [ ] Enable cluster monitoring (metrics/logs/traces)
- [ ] Set log retention and alerting thresholds
- [ ] Add SLO alerts for latency and error rates

## Performance

- [ ] Load test critical endpoints
- [ ] Tune replicas for backend/front-end
- [ ] Confirm horizontal scaling does not break sticky sessions
