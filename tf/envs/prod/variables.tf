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
