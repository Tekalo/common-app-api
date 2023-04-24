# Originally inspired by: https://github.com/techservicesillinois/terraform-aws-ecs-service/blob/main/autoscale.tf

data "aws_partition" "current" {}
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

resource "aws_iam_role" "ecs-autoscale-role" {
  name = format("%s-%s-app-scaling", var.env, var.service_name)

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "application-autoscaling.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "ecs-autoscale" {
  role = aws_iam_role.ecs-autoscale-role.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceAutoscaleRole"
}

resource "aws_appautoscaling_target" "default" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = format("service/%s/%s", var.ecs_cluster, var.service_name)
  role_arn           = aws_iam_role.ecs-autoscale-role.arn
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Target tracking policy
resource "aws_appautoscaling_policy" "default" {
  for_each = var.metrics

  name                = format("ecs-target-%s-%s", var.service_name, lower(each.key))
  policy_type         = "TargetTrackingScaling"
  resource_id         = aws_appautoscaling_target.default.resource_id
  scalable_dimension  = aws_appautoscaling_target.default.scalable_dimension
  service_namespace   = aws_appautoscaling_target.default.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value        = each.value.target
    disable_scale_in    = each.value.disable_scale_in
    scale_in_cooldown   = each.value.scale_in_cooldown
    scale_out_cooldown  = each.value.scale_out_cooldown

    dynamic predefined_metric_specification {
      for_each = each.value.predefined_metric
      iterator = metric

      content {
        predefined_metric_type = metric.value.type
      }
    }

    dynamic customized_metric_specification {
      for_each = each.value.customized_metric
      iterator = metric

      content {
        metric_name   = metric.value.metric_name
        namespace     = metric.value.namespace
        statistic     = metric.value.statistic
        unit          = metric.value.unit

        dynamic dimensions {
          for_each = metric.value.dimensions
          iterator = dim

          content {
            name  = dim.key
            value = dim.value
          }
        }
      }
    }
  }
}

