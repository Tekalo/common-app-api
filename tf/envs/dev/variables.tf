variable "ses_whitelist" {
  description = "Email addresses SES is permitted to send to only in non-prod environments"
  type        = string
}

# output "ses_whitelist" {
#   description = "Email addresses SES is permitted to send to only in non-prod environments"
#   value        = var.ses_whitelist
# }
