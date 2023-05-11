
variable "auth0_email_from_address" {
  description = "Email address to use in From field of all emails sent by auth0"
  type        = string
  nullable    = false
}

variable "env" {
  description = "slug for environment (dev, staging, prod)"
  type        = string
}
