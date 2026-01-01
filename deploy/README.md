# Production Deployment

This folder contains Kubernetes manifests and Terraform infrastructure to deploy the RAG system on AWS and OCI.

## What is included

- `deploy/k8s` Kustomize base + overlays for AWS and OCI
- `deploy/docs` Runbooks and production guidance
- `infra/terraform/aws` EKS + VPC + ECR scaffolding
- `infra/terraform/oci` OKE + VCN scaffolding

## Typical flow

1) Provision infrastructure with Terraform.
2) Build/push images to ECR (AWS) or OCIR (OCI).
3) Update image references and secrets in the Kustomize base.
4) Apply the appropriate Kustomize overlay.
