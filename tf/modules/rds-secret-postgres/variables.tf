variable "secret_name" {
  description = "Name of the secret"
  type        = string
}

variable "secret_description" {
  description = "Descriptive name of secret"
  type        = string
}

variable "kms_key_id" {
  description = "ARN of KMS secret"
  type        = string
}

variable "vpc_subnet_ids" {
  description = "VPC Subnets for Lambda function (needs access to database)"
  type        = list(string)
}

variable "vpc_security_group_id" {
  description = "Security Group ID that lambda function can use to access database"
  type        = string
}

variable "function_name" {
  description = "Name to give lambda function"
  type        = string
}

variable "rotation_lambda_arn" {
  description = "Existing rotation lambda to use (must have access to DB and correct KMS key)"
  type        = string
  default     = null
}

variable "initial_secret" {
  description = "Initial database secret value to use"
  type = object({
    engine   = string,
    host     = string,
    username = string,
    password = string,
    dbname   = string,
    port     = string,
  })
}

variable "rotate_after_days" {
  description = "How many days between rotations"
  default     = 30
  type        = number
}
