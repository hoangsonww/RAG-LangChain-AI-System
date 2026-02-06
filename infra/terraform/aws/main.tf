provider "aws" {
  region = var.region

  default_tags {
    tags = merge(
      {
        Project = var.project
      },
      var.tags,
    )
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_kms_key" "eks" {
  count                   = var.enable_cluster_encryption ? 1 : 0
  description             = "KMS key for ${var.cluster_name} EKS secrets encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "eks" {
  count         = var.enable_cluster_encryption ? 1 : 0
  name          = "alias/${var.cluster_name}-eks"
  target_key_id = aws_kms_key.eks[0].key_id
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project}-vpc"
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, length(var.private_subnet_cidrs))
  public_subnets  = var.public_subnet_cidrs
  private_subnets = var.private_subnet_cidrs

  enable_nat_gateway     = true
  single_nat_gateway     = false
  enable_dns_hostnames   = true
  one_nat_gateway_per_az = true

  public_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                    = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
  }

  tags = var.tags
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = var.kubernetes_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access  = var.cluster_endpoint_public_access
  cluster_endpoint_private_access = var.cluster_endpoint_private_access
  cluster_enabled_log_types       = var.cluster_enabled_log_types

  cloudwatch_log_group_retention_in_days = var.cluster_log_retention_days

  enable_cluster_creator_admin_permissions = true
  enable_irsa                              = true

  cluster_encryption_config = var.enable_cluster_encryption ? {
    provider_key_arn = aws_kms_key.eks[0].arn
    resources        = ["secrets"]
  } : {}

  cluster_addons = var.cluster_addons

  eks_managed_node_group_defaults = {
    ami_type       = var.node_group_ami_type
    capacity_type  = var.node_group_capacity_type
    disk_size      = var.node_group_disk_size
    instance_types = var.node_group_instance_types
  }

  eks_managed_node_groups = merge(
    {
      default = {
        desired_size = var.node_group_desired_size
        min_size     = var.node_group_min_size
        max_size     = var.node_group_max_size

        labels = {
          workload = "general"
        }
      }
    },
    var.enable_canary_node_group ? {
      canary = {
        instance_types = var.canary_node_group_instance_types
        desired_size   = var.canary_node_group_desired_size
        min_size       = var.canary_node_group_min_size
        max_size       = var.canary_node_group_max_size
        capacity_type  = var.node_group_capacity_type

        labels = {
          workload = "canary"
        }
      }
    } : {},
  )

  tags = var.tags
}

locals {
  ecr_repositories = {
    backend  = "${var.project}/rag-backend"
    rag_app  = "${var.project}/rag-app"
    frontend = "${var.project}/rag-frontend"
  }
}

resource "aws_ecr_repository" "repos" {
  for_each = local.ecr_repositories

  name                 = each.value
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = var.ecr_scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_ecr_lifecycle_policy" "repos" {
  for_each   = aws_ecr_repository.repos
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Retain only recent tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "release", "sha"]
          countType     = "imageCountMoreThan"
          countNumber   = var.ecr_keep_tagged_image_count
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Cleanup untagged images"
        selection = {
          tagStatus   = "untagged"
          countType   = "imageCountMoreThan"
          countNumber = var.ecr_keep_untagged_image_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
