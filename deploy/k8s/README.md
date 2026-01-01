# Kubernetes Deployment

These manifests provide a production-ready baseline for the RAG system with Kustomize overlays for AWS and OCI.

## Quick start

1) Build and push the container images to your registry:

```
# Example tags (replace with your registry)
rag-backend:latest
rag-app:latest
rag-frontend:latest
```

2) Update image references in:

```
deploy/k8s/base/backend-deployment.yaml
deploy/k8s/base/rag-app-deployment.yaml
deploy/k8s/base/frontend-deployment.yaml
```

3) Update secrets:

```
deploy/k8s/base/secret.yaml
```

4) Apply an overlay:

```
# AWS
kubectl apply -k deploy/k8s/overlays/aws

# OCI
kubectl apply -k deploy/k8s/overlays/oci
```

## Notes

- The base ingress is NGINX-oriented; the AWS overlay configures ALB annotations and requires the AWS Load Balancer Controller.
- MongoDB and Redis are deployed inside the cluster for convenience. For production, use managed services and update `MONGO_URI` accordingly.
- `rag-app` uses a single replica because it mounts a ReadWriteOnce PVC for ChromaDB and uploads.
- If your registry is private, add `imagePullSecrets` to the deployments.
