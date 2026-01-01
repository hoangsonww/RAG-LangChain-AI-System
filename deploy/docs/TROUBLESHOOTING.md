# Troubleshooting

## Pods stuck in Pending

- Check storage class availability:

```
kubectl get sc
kubectl -n rag-system describe pvc rag-app-data
```

## CrashLoopBackOff

- Inspect logs:

```
kubectl -n rag-system logs deploy/rag-app
kubectl -n rag-system logs deploy/backend
```

- Common causes:
  - Invalid `MONGO_URI`
  - Missing `API_TOKEN`
  - Insufficient memory limits

## Ingress not reachable

- Verify ingress controller and class:

```
kubectl get ingressclass
kubectl -n rag-system describe ingress rag-ingress
```

- Ensure DNS points to the load balancer hostname.

## MongoDB connection failures

- Confirm MongoDB service and credentials:

```
kubectl -n rag-system get svc mongodb
kubectl -n rag-system get secret rag-secrets -o yaml
```

## Slow responses

- Increase resource limits or scale `backend` and `frontend`.
- Consider managed MongoDB/Redis for better IO performance.
