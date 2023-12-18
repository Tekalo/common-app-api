variable "ses_whitelist" {
  description = "Email addresses SES is permitted to send to only in non-prod environments"
  type        = string
}

variable "bucket_env" {
  type = string
}

