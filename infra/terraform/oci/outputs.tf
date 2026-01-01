output "cluster_id" {
  value       = oci_containerengine_cluster.oke.id
  description = "OKE cluster OCID"
}

output "node_pool_id" {
  value       = oci_containerengine_node_pool.oke_pool.id
  description = "OKE node pool OCID"
}

output "vcn_id" {
  value       = oci_core_vcn.vcn.id
  description = "VCN OCID"
}
