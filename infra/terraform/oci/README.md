# OCI Infrastructure (OKE)

This Terraform config provisions a VCN, networking, an OKE cluster, and a node pool for the RAG system.

## Prerequisites

- Terraform 1.5+
- OCI CLI configured and an API key pair

## Usage

```
cd infra/terraform/oci
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

After apply, generate kubeconfig:

```
oci ce cluster create-kubeconfig \
  --cluster-id <cluster_ocid> \
  --file $HOME/.kube/config \
  --region <region> \
  --token-version 2.0.0
```

Then deploy:

```
kubectl apply -k deploy/k8s/overlays/oci
```

Notes:
- Set `node_image_ocid` in `terraform.tfvars` to a compatible OKE node image for your region.
- Update `kubernetes_version` to a version available in your region.
- Tighten `admin_cidr` to your office/VPN IP range for production access.
