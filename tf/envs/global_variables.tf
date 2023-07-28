# Variables shared by all environments

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

variable "auth0_domain" {
  description = "Auth0 subdomain for CNAME record"
  type        = string
}

output "auth0_domain" {
  description = "Auth0 subdomain for CNAME record"
  value       = module.app.auth0_domain
}

variable "sentry_dsn" {
  description = "DSN for Sentry, where we collect performance monitoring data"
  type        = string
}

output "sentry_dsn" {
  description = "DSN for Sentry, where we collect performance monitoring data"
  value       = module.app.sentry_dsn
}

variable "web_url" {
  description = "Tekalo web URL, where user will be redirected to after Auth0 password reset"
  type        = string
}

variable "email_from_address" {
  description = "Address to use in the From field of all emails sent by Tekalo"
  type        = string
}

variable "reply_to_address" {
  description = "Address to use in the Reply-To field of all emails sent by Tekalo"
  type        = string
}
