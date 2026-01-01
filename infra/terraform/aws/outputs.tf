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

output "ecr_repo_urls" {
  value = {
    backend  = aws_ecr_repository.rag_backend.repository_url
    rag_app  = aws_ecr_repository.rag_app.repository_url
    frontend = aws_ecr_repository.rag_frontend.repository_url
  }
  description = "ECR repository URLs"
}
