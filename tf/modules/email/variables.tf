variable "env" {
  description = "slug for environment (dev, staging, prod)"
  type        = string
}

variable "kms_key_id" {
  description = "Main KMS key id"
  type        = string
}
variable "email_from_address" {
  description = "Address to use in the From field of all emails sent by Tekalo"
  type        = string
  nullable    = false
}
