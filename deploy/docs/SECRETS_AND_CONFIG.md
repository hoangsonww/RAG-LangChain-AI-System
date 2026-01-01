# Secrets and Config

The Kubernetes base includes a ConfigMap and Secret:

- `deploy/k8s/base/configmap.yaml`
- `deploy/k8s/base/secret.yaml`

## Recommended approach

- Store secrets outside the repo (external secret manager).
- Use CI to inject secrets at deploy time.
- Avoid committing real credentials to Git.

## Example: create secret at deploy time

```
kubectl -n rag-system create secret generic rag-secrets \
  --from-literal=API_TOKEN=change-me \
  --from-literal=MONGO_INITDB_ROOT_USERNAME=admin \
  --from-literal=MONGO_INITDB_ROOT_PASSWORD=change-me \
  --from-literal=MONGO_URI=mongodb://admin:change-me@mongodb:27017/rag_db?authSource=admin
```

If you create the secret manually, remove or ignore `deploy/k8s/base/secret.yaml` to avoid conflicts.

## Config updates

Edit the ConfigMap for env values such as:

- `API_BASE_URL`
- `BACKEND_PORT`
- `FLASK_ENV`
- `MONGO_DB`

Then apply:

```
kubectl apply -k deploy/k8s/overlays/aws
# or
kubectl apply -k deploy/k8s/overlays/oci
```
