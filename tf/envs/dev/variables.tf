variable "env" {
  type = string
}

variable "api_port" {
  type = number
}

output "api_port" {
  description = "Port number for API service"
  value       = module.app.api_port
}

variable "image" {
  description = "Docker repository and tag for image"
  type        = string
}

output "image" {
  description = "Image with which this stack has been deployed"
  value       = module.app.image
}

variable "cli_image" {
  description = "Docker repository and tag for cli image"
  type        = string
}

output "cli_image" {
  description = "Image with which we are running ad-hoc CLI commands on"
  value       = module.app.cli_image
}
