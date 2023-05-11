variable "dns_zone_id" {
  type = string
}
variable "load_balancer_arn" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "db_subnet_name" {
  type = string
}

variable "db_security_group_id" {
  type = string
}

variable "ecs_cluster" {
  type = string
}

variable "ecs_cluster_name" {
  type = string
}

variable "env" {
  description = "slug for environment (dev, staging, prod)"
  type        = string
}

variable "api_port" {
  description = "Port number for API service"
  type        = number
}

output "api_port" {
  description = "Port number for API service"
  value       = var.api_port
}

variable "image" {
  description = "Docker repository and tag for image"
  type        = string
}

output "image" {
  description = "Image with which this stack has been deployed"
  value       = jsondecode(aws_ecs_task_definition.api.container_definitions)[0].image
}

variable "db_username" {
  description = "Initial database administrator username"
  type        = string
  sensitive   = true
  default     = "capp_admin"
}

variable "db_password" {
  description = "Initial database administrator password"
  type        = string
  sensitive   = true
  default     = "password"
}

variable "cli_image" {
  description = "Docker repository and tag for cli image"
  type        = string
}

output "cli_image" {
  description = "Image with which we are running ad-hoc CLI commands on"
  value       = jsondecode(aws_ecs_task_definition.cli.container_definitions)[0].image
}

variable "cert_arn" {
  type        = string
  description = "The certificate we will use for the static site"
}

variable "rotation_vpc_subnet_ids" {
  type        = list(string)
  description = "Subnet IDs where RDS rotation lambda should run"
}

variable "rotation_vpc_security_group_id" {
  type        = string
  description = "Security Group ID to use for RDS rotation lambda (must have access to RDS)"
}

variable "alarms_enabled" {
  type        = bool
  description = "Allow cloudwatch alarms to take actions"
  default     = false
}

variable "alarm_sns_arns" {
  type        = list(string)
  description = "ARN of the SNS topic to use for alarms"
  default     = []
}

variable "auth0_domain" {
  description = "Auth0 subdomain for CNAME record"
  type        = string
}

output "auth0_domain" {
  description = "Auth0 subdomain for CNAME record"
  value       = var.auth0_domain
}

variable "sentry_dsn" {
  description = "DSN for Sentry, where we collect performance monitoring data"
  type        = string
}

output "sentry_dsn" {
  description = "DSN for Sentry, where we collect performance monitoring data"
  value       = var.sentry_dsn
}

variable "load_test" {
  description = "When true, indicates that we are running a load test against the env"
  type        = bool
  default     = null
}

output "load_test" {
  description = "When true, indicates that we are running a load test against the env"
  value       = var.load_test
}

variable "email_from_address" {
  description = "Address to use in the From field of all emails sent by Tekalo"
  type        = string
  nullable    = false
}
