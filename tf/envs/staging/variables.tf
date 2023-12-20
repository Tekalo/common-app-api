variable "load_test" {
  description = "When true, indicates that we are running a load test against the env"
  type        = bool
  default     = null
}

output "load_test" {
  description = "When true, indicates that we are running a load test against the env"
  value       = var.load_test
}

variable "ses_whitelist" {
  description = "Email addresses SES is permitted to send to only in non-prod environments"
  type        = string
}

variable "bucket_env" {
  type = string
}
