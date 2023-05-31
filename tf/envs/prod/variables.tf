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

variable "auth0_from_email_address" {
  description = "Email address to use in From field of all emails sent by auth0"
  type        = string
}

output "auth0_email_access_key_id" {
  description = "AWS Access Key Id for Auth0 SES Email Provider"
  value       = module.auth0_ses.access_key_id
}

output "auth0_email_secret_access_key" {
  description = "AWS Secret Access Key for Auth0 SES Email Provider"
  value       = module.auth0_ses.secret_access_key
  sensitive   = true
}

variable "alarms_enabled" {
  type        = bool
  description = "Allow cloudwatch alarms to take actions"
}

output "alarms_enabled" {
  description = "Enable cloudwatch alarms to alert PagerDuty"
  value       = module.app.alarms_enabled
}

variable "pagerduty_integration_url" {
  description = "Integration url for pagerduty alarms"
}

output "pagerduty_integration_url" {
  description = "Integration url for pagerduty alarms"
  value       = module.app.pagerduty_integration_url
}

variable "notify_webhook" {
  description = "Slack webhook url for non-urgent notifications"
  type        = string
}

output "notify_webhook" {
  description = "Slack webhook url for non-urgent notifications"
  value       = module.app.notify_webhook
}
variable "slack_channel" {
  description = "Slack channel to route alerts to"
  type        = string
  default     = "commonapp-dev-notifications"
}

output "slack_channel" {
  description = "Slack channel to route alerts to"
  value       = module.app.slack_channel
}

variable "slack_username" {
  description = "Slack username to post alerts as (will use aws account id if not specified)"
  type        = string
  default     = "aws-notifier"
}
output "slack_username" {
  description = "Slack username to post alerts as (will use aws account id if not specified)"
  value       = module.app.slack_username
}
