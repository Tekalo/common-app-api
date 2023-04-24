variable env {
  type = string
  description = "Environment name"
}

variable ecs_cluster {
  type = string
}

variable service_name {
  type = string
}

variable min_capacity {
  type = number
  default = 1
}

variable max_capacity {
  type = number
  default = 1
}

variable "metrics" {
  description = "Autoscaling metrics configuration"
  type = map(
      object({
        target                  = string
        disable_scale_in        = optional(bool, false)
        scale_in_cooldown       = optional(number, 120)
        scale_out_cooldown      = optional(number, 120)

        predefined_metric       = optional(object({
          type                  = string
          resource_label        = optional(string, null)
        }), null)
        custom_metric_type      = optional(object({
          metric_name           = string
          namespace             = string
          statistic             = optional(string, "Average")
          unit                  = optional(string, null)
        }), null)
      })
    )
  default = null
  validation {
    condition     = var.metrics == null || try(length(var.metrics) > 0, true)
    error_message = "The 'metrics' block must have one or more metrics"
  }
}
