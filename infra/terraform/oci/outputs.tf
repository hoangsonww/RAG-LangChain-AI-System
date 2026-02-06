output "cluster_id" {
  value       = oci_containerengine_cluster.oke.id
  description = "OKE cluster OCID"
}

output "node_pool_id" {
  value       = oci_containerengine_node_pool.oke_pool.id
  description = "Primary OKE node pool OCID"
}

output "canary_node_pool_id" {
  value       = var.enable_canary_node_pool ? oci_containerengine_node_pool.canary_pool[0].id : null
  description = "Canary OKE node pool OCID"
}

output "vcn_id" {
  value       = oci_core_vcn.vcn.id
  description = "VCN OCID"
}

output "public_subnet_id" {
  value       = oci_core_subnet.public.id
  description = "Public subnet OCID"
}

output "private_subnet_id" {
  value       = oci_core_subnet.private.id
  description = "Private subnet OCID"
}
