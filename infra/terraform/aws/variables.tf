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

variable "node_group_desired_size" {
  type        = number
  description = "Desired node count"
  default     = 2
}

variable "node_group_min_size" {
  type        = number
  description = "Minimum node count"
  default     = 1
}

variable "node_group_max_size" {
  type        = number
  description = "Maximum node count"
  default     = 4
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to resources"
  default     = {}
}
