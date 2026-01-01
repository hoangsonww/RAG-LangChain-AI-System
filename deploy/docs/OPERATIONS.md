# Operations

## Scaling

- `frontend` and `backend` are stateless; scale with replicas.
- `rag-app` mounts a ReadWriteOnce PVC, so keep a single replica unless you externalize ChromaDB and uploads.

Example:

```
kubectl -n rag-system scale deploy/frontend --replicas=3
kubectl -n rag-system scale deploy/backend --replicas=3
```

## Backups

- MongoDB (self-hosted): use `mongodump` and store off-cluster.
- ChromaDB and uploads: snapshot the PVC.

## Upgrades

- Roll out new images by updating the deployment image tags.
- Use `kubectl rollout status` to monitor progress.

## Rollback

```
kubectl -n rag-system rollout undo deploy/backend
kubectl -n rag-system rollout undo deploy/frontend
```
