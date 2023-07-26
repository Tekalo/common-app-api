# Variables shared between environments that manage an auth0 tenant (dev and prod)

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
