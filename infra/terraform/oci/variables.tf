variable "tenancy_ocid" {
  type        = string
  description = "OCI tenancy OCID"
}

variable "user_ocid" {
  type        = string
  description = "OCI user OCID"
}

variable "fingerprint" {
  type        = string
  description = "OCI API key fingerprint"
}

variable "private_key_path" {
  type        = string
  description = "Path to OCI API private key"
}

variable "region" {
  type        = string
  description = "OCI region"
  default     = "us-ashburn-1"
}

variable "compartment_ocid" {
  type        = string
  description = "OCI compartment OCID for resources"
}

variable "cluster_name" {
  type        = string
  description = "OKE cluster name"
  default     = "rag-system"
}

variable "kubernetes_version" {
  type        = string
  description = "OKE Kubernetes version"
  default     = "v1.29.1"
}

variable "cluster_endpoint_public_access" {
  type        = bool
  description = "Expose OKE API endpoint publicly"
  default     = true
}

variable "vcn_cidr" {
  type        = string
  description = "VCN CIDR"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type        = string
  description = "Public subnet CIDR"
  default     = "10.0.0.0/24"
}

variable "private_subnet_cidr" {
  type        = string
  description = "Private subnet CIDR"
  default     = "10.0.1.0/24"
}

variable "node_shape" {
  type        = string
  description = "Node shape"
  default     = "VM.Standard.E4.Flex"
}

variable "node_ocpus" {
  type        = number
  description = "OCPUs per node"
  default     = 2
}

variable "node_memory_in_gbs" {
  type        = number
  description = "Memory per node in GB"
  default     = 16
}

variable "node_count" {
  type        = number
  description = "Number of worker nodes"
  default     = 3
}

variable "enable_canary_node_pool" {
  type        = bool
  description = "Create a dedicated node pool for canary/preview workloads"
  default     = true
}

variable "canary_node_count" {
  type        = number
  description = "Node count for canary node pool"
  default     = 1
}

variable "node_image_ocid" {
  type        = string
  description = "OCID for the node image to use in the pool"
}

variable "ssh_public_key_path" {
  type        = string
  description = "Path to SSH public key for node access"
}

variable "admin_cidr" {
  type        = string
  description = "CIDR allowed to access the Kubernetes API and SSH"
  default     = "203.0.113.0/24"
}

variable "tags" {
  type        = map(string)
  description = "Freeform tags for OCI resources"
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
