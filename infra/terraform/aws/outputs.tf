output "cluster_name" {
  value       = module.eks.cluster_name
  description = "EKS cluster name"
}

output "cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  description = "EKS cluster endpoint"
}

output "cluster_certificate_authority_data" {
  value       = module.eks.cluster_certificate_authority_data
  description = "Base64 encoded CA data"
}

output "cluster_oidc_provider_arn" {
  value       = module.eks.oidc_provider_arn
  description = "EKS OIDC provider ARN"
}

output "cluster_security_group_id" {
  value       = module.eks.cluster_security_group_id
  description = "Cluster security group ID"
}

output "eks_managed_node_groups" {
  value       = module.eks.eks_managed_node_groups
  description = "Managed node groups metadata (includes canary when enabled)"
}

output "kms_key_arn" {
  value       = var.enable_cluster_encryption ? aws_kms_key.eks[0].arn : null
  description = "KMS key ARN used for secrets encryption"
}

output "ecr_repo_urls" {
  value = {
    backend  = aws_ecr_repository.repos["backend"].repository_url
    rag_app  = aws_ecr_repository.repos["rag_app"].repository_url
    frontend = aws_ecr_repository.repos["frontend"].repository_url
  }
  description = "ECR repository URLs"
}
