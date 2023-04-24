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
        metric_name             = string
        actions_enabled         = optional(bool, true)
        adjustment_type         = string
        cooldown                = optional(number, null)
        datapoints_to_alarm     = optional(number, null)
        evaluation_periods      = number
        metric_aggregation_type = string
        period                  = number
        statistic               = string
        # TODO: Validate that either lower or upper bound are non-null.
        down = object({
          comparison_operator         = string
          metric_interval_lower_bound = optional(number, null)
          metric_interval_upper_bound = optional(number, null)
          scaling_adjustment          = number
          threshold                   = number
        })
        # TODO: Validate that either lower or upper bound are non-null.
        up = object({
          comparison_operator         = string
          metric_interval_lower_bound = optional(number, null)
          metric_interval_upper_bound = optional(number, null)
          scaling_adjustment          = number
          threshold                   = number
        })
      })
    )
  default = null
  validation {
    condition     = var.metrics == null || try(length(var.metrics) > 0, true)
    error_message = "The 'metrics' block must have one or more metrics"
  }
}
