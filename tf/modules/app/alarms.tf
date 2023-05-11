# RDS
resource "aws_cloudwatch_metric_alarm" "rds_instance0_cpu" {
  alarm_name          = "capp-${var.env}-rds-instance0-cpu"
  alarm_description   = "Average CPU for ${var.env} DB: ${aws_rds_cluster_instance.instance0.identifier}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  period              = 120
  statistic           = "Average"
  threshold           = "85"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  dimensions = {
    DBInstanceIdentifier = aws_rds_cluster_instance.instance0.identifier
  }
  actions_enabled           = var.alarms_enabled
  alarm_actions             = var.alarm_sns_arns
  ok_actions                = var.alarm_sns_arns
  insufficient_data_actions = var.alarm_sns_arns
}

# ALB
resource "aws_cloudwatch_metric_alarm" "api_targetgroup_healthy_hosts_count" {
  alarm_name          = "capp-${var.env}-api-healthy-hosts"
  alarm_description   = "Ensures at least 1 healthy host in the TargetGroup"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 5
  period              = 60
  statistic           = "Minimum"
  threshold           = "1"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  dimensions = {
    TargetGroup  = aws_lb_target_group.api.arn_suffix
    LoadBalancer = data.aws_lb.main.arn_suffix
  }
  actions_enabled           = var.alarms_enabled
  alarm_actions             = var.alarm_sns_arns
  ok_actions                = var.alarm_sns_arns
  insufficient_data_actions = var.alarm_sns_arns
}

resource "aws_cloudwatch_metric_alarm" "api_targetgroup_500_errors" {
  alarm_name          = "capp-${var.env}-api-500-errors"
  alarm_description   = "Checks for the sum of HTTP 500 responses"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  period              = 60
  statistic           = "Sum"
  threshold           = "10"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  dimensions = {
    TargetGroup  = aws_lb_target_group.api.arn_suffix
    LoadBalancer = data.aws_lb.main.arn_suffix
  }
  actions_enabled           = var.alarms_enabled
  alarm_actions             = var.alarm_sns_arns
  ok_actions                = var.alarm_sns_arns
  insufficient_data_actions = var.alarm_sns_arns
}

