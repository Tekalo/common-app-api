# TODO: this could maybe use terraform remote_state with some other modules to get the actual
# values dynamically

output "envs" {
  description = "Metadata for CAPP environments"
  value       = yamldecode(file("${path.module}/environments.yml"))
}
