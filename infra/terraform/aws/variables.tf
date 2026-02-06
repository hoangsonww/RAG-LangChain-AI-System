variable "region" {
  type        = string
  description = "AWS region"
  default     = "us-east-1"
}

variable "project" {
  type        = string
  description = "Project prefix for resource names"
  default     = "rag-system"
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name"
  default     = "rag-system"
}

variable "kubernetes_version" {
  type        = string
  description = "Kubernetes version for EKS"
  default     = "1.29"
}

variable "cluster_endpoint_public_access" {
  type        = bool
  description = "Expose the EKS endpoint publicly"
  default     = true
}

variable "cluster_endpoint_private_access" {
  type        = bool
  description = "Expose the EKS endpoint privately"
  default     = true
}

variable "enable_cluster_encryption" {
  type        = bool
  description = "Enable envelope encryption for Kubernetes secrets"
  default     = true
}

variable "cluster_enabled_log_types" {
  type        = list(string)
  description = "Enabled EKS control plane logs"
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

variable "cluster_log_retention_days" {
  type        = number
  description = "CloudWatch retention days for EKS control plane logs"
  default     = 30
}

variable "cluster_addons" {
  type        = map(any)
  description = "EKS addons configuration"
  default = {
    coredns = {
      most_recent = true
      preserve    = true
    }
    kube-proxy = {
      most_recent = true
      preserve    = true
    }
    vpc-cni = {
      most_recent = true
      preserve    = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
      preserve    = true
    }
  }
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "Public subnet CIDRs"
  default     = ["10.0.0.0/20", "10.0.16.0/20", "10.0.32.0/20"]
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "Private subnet CIDRs"
  default     = ["10.0.48.0/20", "10.0.64.0/20", "10.0.80.0/20"]
}

variable "node_group_instance_types" {
  type        = list(string)
  description = "EKS managed node group instance types"
  default     = ["t3.large"]
}

variable "node_group_ami_type" {
  type        = string
  description = "Node group AMI type"
  default     = "AL2_x86_64"
}

variable "node_group_capacity_type" {
  type        = string
  description = "Node group capacity type (ON_DEMAND or SPOT)"
  default     = "ON_DEMAND"
}

variable "node_group_disk_size" {
  type        = number
  description = "Node group root volume size in GiB"
  default     = 100
}

variable "node_group_desired_size" {
  type        = number
  description = "Desired node count"
  default     = 3
}

variable "node_group_min_size" {
  type        = number
  description = "Minimum node count"
  default     = 2
}

variable "node_group_max_size" {
  type        = number
  description = "Maximum node count"
  default     = 10
}

variable "enable_canary_node_group" {
  type        = bool
  description = "Create a dedicated canary node group for progressive deployments"
  default     = true
}

variable "canary_node_group_instance_types" {
  type        = list(string)
  description = "Canary node group instance types"
  default     = ["t3.large"]
}

variable "canary_node_group_desired_size" {
  type        = number
  description = "Desired canary node count"
  default     = 1
}

variable "canary_node_group_min_size" {
  type        = number
  description = "Minimum canary node count"
  default     = 1
}

variable "canary_node_group_max_size" {
  type        = number
  description = "Maximum canary node count"
  default     = 4
}

variable "ecr_scan_on_push" {
  type        = bool
  description = "Enable ECR scan on push"
  default     = true
}

variable "ecr_keep_tagged_image_count" {
  type        = number
  description = "Retained count for tagged images"
  default     = 40
}

variable "ecr_keep_untagged_image_count" {
  type        = number
  description = "Retained count for untagged images"
  default     = 5
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to resources"
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
