# Originally inspired by: https://github.com/techservicesillinois/terraform-aws-ecs-service/blob/main/autoscale.tf

data "aws_partition" "current" {}
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

resource "aws_appautoscaling_target" "default" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = format("service/%s/%s", var.ecs_cluster, var.service_name)
  role_arn           = format("arn:aws:iam::%s:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService", data.aws_caller_identity.current.account_id)
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Scale-down alarm for each metric.

resource "aws_cloudwatch_metric_alarm" "down" {
  for_each = var.metrics

  actions_enabled     = each.value.actions_enabled
  alarm_actions       = [aws_appautoscaling_policy.down[each.key].arn]
  alarm_description   = format("scale-down alarm for %s on %s metric", var.service_name, each.key)
  alarm_name          = format("ecs-%s-%s-down", var.service_name, lower(each.key))
  comparison_operator = each.value.down.comparison_operator
  datapoints_to_alarm = each.value.datapoints_to_alarm
  evaluation_periods  = each.value.evaluation_periods
  metric_name         = each.key
  namespace           = "AWS/ECS"
  period              = each.value.period
  statistic           = each.value.statistic
  threshold           = each.value.down.threshold

  dimensions = {
    ClusterName = var.ecs_cluster
    ServiceName = var.service_name
  }
}

# Scale-up alarm for each metric.

resource "aws_cloudwatch_metric_alarm" "up" {
  for_each = var.metrics

  actions_enabled     = each.value.actions_enabled
  alarm_actions       = [aws_appautoscaling_policy.up[each.key].arn]
  alarm_description   = format("scale-up alarm for %s on %s metric", var.service_name, each.key)
  alarm_name          = format("ecs-%s-%s-up", var.service_name, lower(each.key))
  comparison_operator = each.value.up.comparison_operator
  datapoints_to_alarm = each.value.datapoints_to_alarm
  evaluation_periods  = each.value.evaluation_periods
  metric_name         = each.key
  namespace           = "AWS/ECS"
  period              = each.value.period
  statistic           = each.value.statistic
  threshold           = each.value.up.threshold

  dimensions = {
    ClusterName = var.ecs_cluster
    ServiceName = var.service_name
  }
}

# Scale-down policy for each metric.

resource "aws_appautoscaling_policy" "down" {
  for_each = var.metrics

  name               = format("ecs-%s-%s-down", var.service_name, lower(each.key))
  resource_id        = aws_appautoscaling_target.default.resource_id
  scalable_dimension = aws_appautoscaling_target.default.scalable_dimension
  service_namespace  = aws_appautoscaling_target.default.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = each.value.adjustment_type
    cooldown                = each.value.cooldown
    metric_aggregation_type = each.value.metric_aggregation_type

    step_adjustment {
      metric_interval_lower_bound = each.value.down.metric_interval_lower_bound
      metric_interval_upper_bound = each.value.down.metric_interval_upper_bound
      scaling_adjustment          = each.value.down.scaling_adjustment
    }
  }
}

# Scale-up policy for each metric.

resource "aws_appautoscaling_policy" "up" {
  for_each = var.metrics

  name               = format("ecs-%s-%s-up", var.service_name, lower(each.key))
  resource_id        = aws_appautoscaling_target.default.resource_id
  scalable_dimension = aws_appautoscaling_target.default.scalable_dimension
  service_namespace  = aws_appautoscaling_target.default.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = each.value.adjustment_type
    cooldown                = each.value.cooldown
    metric_aggregation_type = each.value.metric_aggregation_type

    step_adjustment {
      metric_interval_lower_bound = each.value.up.metric_interval_lower_bound
      metric_interval_upper_bound = each.value.up.metric_interval_upper_bound
      scaling_adjustment          = each.value.up.scaling_adjustment
    }
  }
}
