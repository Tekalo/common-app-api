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

variable "env" {
  description = "slug for environment (dev, staging, prod)"
  type        = string
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

variable "alarms_enabled" {
  type        = bool
  description = "Allow cloudwatch alarms to take actions"
  default     = false
}

variable "alarm_sns_arns" {
  type        = list(string)
  description = "ARN of the SNS topic to use for alarms"
  default     = []
}

