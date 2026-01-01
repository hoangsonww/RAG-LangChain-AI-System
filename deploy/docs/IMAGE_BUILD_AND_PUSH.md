# Image Build and Push

This project ships three images:

- Backend API: `backend/Dockerfile`
- RAG app: `Dockerfile.rag`
- Frontend: `frontend/Dockerfile`

## Build locally

```
docker build -t rag-backend:latest backend

docker build -t rag-app:latest -f Dockerfile.rag .

docker build -t rag-frontend:latest frontend
```

## AWS ECR

```
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
ECR_PREFIX=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/rag-system

aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Tag + push
for image in rag-backend rag-app rag-frontend; do
  docker tag ${image}:latest ${ECR_PREFIX}/${image}:latest
  docker push ${ECR_PREFIX}/${image}:latest
done
```

Update the image references in:

- `deploy/k8s/base/backend-deployment.yaml`
- `deploy/k8s/base/rag-app-deployment.yaml`
- `deploy/k8s/base/frontend-deployment.yaml`

## OCI OCIR

```
OCI_REGION=us-ashburn-1
OCI_TENANCY=mytenancy
OCI_USER=myuser
OCIR_PREFIX=${OCI_REGION}.ocir.io/${OCI_TENANCY}/rag-system

# If you use auth tokens, set OCI_AUTH_TOKEN.
docker login ${OCI_REGION}.ocir.io -u ${OCI_TENANCY}/${OCI_USER} -p ${OCI_AUTH_TOKEN}

# Tag + push
for image in rag-backend rag-app rag-frontend; do
  docker tag ${image}:latest ${OCIR_PREFIX}/${image}:latest
  docker push ${OCIR_PREFIX}/${image}:latest
done
```
