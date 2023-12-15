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

variable "kms_key_id" {
  description = "Main KMS key id"
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

variable "task_subnet_ids" {
  type        = list(string)
  description = "Subnet IDs where ECS tasks/services should be assigned when using VPC networking mode"
}

variable "task_security_group" {
  type        = string
  description = "Security Group ID to use for tasks/services in VPC networking mode"
}

variable "alarms_enabled" {
  type        = bool
  description = "Allow cloudwatch alarms to take actions"
  default     = false
}

output "alarms_enabled" {
  description = "Enable cloudwatch alarms to alert PagerDuty"
  value       = var.alarms_enabled
}

variable "pagerduty_integration_url" {
  type    = string
  default = "https://example.com"
}

output "pagerduty_integration_url" {
  description = "Pagerduty url for alerts"
  value       = var.pagerduty_integration_url
}

variable "notify_webhook" {
  type    = string
  default = "http://example.com/"
}

output "notify_webhook" {
  description = "Slack webhook for less urgent alerts"
  value       = var.notify_webhook
}

variable "slack_channel" {
  description = "Slack channel to route alerts to"
  type        = string
  default     = "commonapp-dev-notifications"
}

output "slack_channel" {
  description = "Slack channel to route alerts to"
  value       = var.slack_channel
}

variable "slack_username" {
  description = "Slack username to post alerts as (will use aws account id if not specified)"
  type        = string
  default     = "aws-notifier"
}

output "slack_username" {
  description = "Slack username to post alerts as (will use aws account id if not specified)"
  value       = var.slack_username
}

variable "auth0_zone_id" {
  description = "Hosted Zone Id for Auth0 CNAME record"
  type        = string
}

output "auth0_zone_id" {
  description = "Hosted Zone Id for Auth0 CNAME record"
  value       = var.auth0_zone_id
}

variable "auth0_domain_cname" {
  description = "Auth0 subdomain for CNAME record"
  type        = string
}

output "auth0_domain_cname" {
  description = "Auth0 subdomain for CNAME record"
  value       = var.auth0_domain_cname
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

variable "reply_to_address" {
  description = "Address to use in the Reply-To field of all emails sent by Tekalo"
  type        = string
  nullable    = true
}

variable "web_url" {
  description = "Tekalo web URL, where user will be redirected to after Auth0 password reset"
  type        = string
  nullable    = false
}

variable "ses_whitelist" {
  description = "Email addresses SES is permitted to send to only in non-prod environments"
  type        = string
  default     = null
}

output "ses_whitelist" {
  description = "Email addresses SES is permitted to send to only in non-prod environments"
  value       = var.ses_whitelist
}

variable "uploads_cors_allowed_origins" {
  description = "CORS origins to allow for the upload bucket (use full URL, e.g., https://tekalo.org. Wildcards allowed.)"
  type        = list(string)
  nullable    = true
}

variable "additional_env_vars" {
  description = "Specific environment variables to set for this deployment"
  type        = map(string)
  default     = {}

  # Requiring that variables are "registered" here to help avoid accidental typos
  validation {
    condition     = alltrue([for k, v in var.additional_env_vars : contains(["PRESIGNER_STRATEGY", "AWS_EMAIL_SQS_URL"], k)])
    error_message = "Must be a supported env variable"
  }
}
