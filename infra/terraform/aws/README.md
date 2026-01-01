# AWS Infrastructure (EKS + ECR)

This Terraform config provisions a VPC, EKS cluster, and ECR repositories for the RAG system.

## Prerequisites

- Terraform 1.5+
- AWS credentials configured (env vars or `~/.aws/credentials`)

## Usage

```
cd infra/terraform/aws
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

After apply:

```
aws eks update-kubeconfig --region <region> --name <cluster_name>
```

Then deploy:

```
kubectl apply -k deploy/k8s/overlays/aws
```

Notes:
- Install the AWS Load Balancer Controller before applying the AWS ingress overlay.
- Update the EKS `cluster_version` if your region does not support 1.29 yet.
