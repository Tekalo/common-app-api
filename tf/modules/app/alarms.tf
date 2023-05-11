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
  alarm_actions             = [aws_sns_topic.capp_api_alerts.arn]
  ok_actions                = [aws_sns_topic.capp_api_alerts.arn]
  insufficient_data_actions = [aws_sns_topic.capp_api_alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "rds_read_latency" {
  alarm_name                = "capp-${var.env}-rds-read-latency"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  threshold                 = "250"
  period                    = "60"
  evaluation_periods        = "5"
  metric_name               = "ReadLatency"
  namespace                 = "AWS/RDS"
  statistic                 = "Average"
  alarm_description         = "Average RDS Read Latency"
  dimensions = {
    DBInstanceIdentifier    = aws_rds_cluster_instance.instance0.identifier
  }
  actions_enabled           = var.alarms_enabled
  alarm_actions             = [aws_sns_topic.capp_api_alerts.arn]
  ok_actions                = [aws_sns_topic.capp_api_alerts.arn]
  insufficient_data_actions = [aws_sns_topic.capp_api_alerts.arn]
  treat_missing_data        = "notBreaching"
  
}

resource "aws_cloudwatch_metric_alarm" "rds_write_latency" {
  alarm_name                = "capp-${var.env}-rds-write-latency"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  threshold                 = "250"
  period                    = "60"
  evaluation_periods        = "5"
  metric_name               = "WriteLatency"
  namespace                 = "AWS/RDS"
  statistic                 = "Average"
  alarm_description         = "Average RDS Write Latency"
  
  dimensions = {
    DBInstanceIdentifier    = aws_rds_cluster_instance.instance0.identifier
  }

  actions_enabled           = var.alarms_enabled
  alarm_actions             = [aws_sns_topic.capp_api_alerts.arn]
  ok_actions                = [aws_sns_topic.capp_api_alerts.arn]
  insufficient_data_actions = [aws_sns_topic.capp_api_alerts.arn]
  treat_missing_data        = "notBreaching"
}

# Application ELB Target Group
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
  alarm_actions             = [aws_sns_topic.capp_api_alerts.arn]
  ok_actions                = [aws_sns_topic.capp_api_alerts.arn]
  insufficient_data_actions = [aws_sns_topic.capp_api_alerts.arn]
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
  alarm_actions             = [aws_sns_topic.capp_api_alerts.arn]
  ok_actions                = [aws_sns_topic.capp_api_alerts.arn]
  insufficient_data_actions = [aws_sns_topic.capp_api_alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "api_targetgroup_requests_anomaly" {
  alarm_name                = "capp-${var.env}-application-lb-requests"
  comparison_operator       = "LessThanLowerOrGreaterThanUpperThreshold"
  threshold_metric_id       = "exp1"
  evaluation_periods        = "5"
  alarm_description         = "ELB request count anomaly"
  metric_query {
    id                      = "exp1"
    expression              = "ANOMALY_DETECTION_BAND(m1)"
    label                   = "ELB Requests (Expected)"
    return_data             = "true"
  }
  metric_query {
    id                      = "m1"
    return_data             = "true"
    metric {
      metric_name           = "RequestCount"
      namespace             = "AWS/ApplicationELB"
      period                = "60"
      stat                  = "Sum"
      unit                  = "Count"
      dimensions = {
        TargetGroup  = aws_lb_target_group.api.arn_suffix
        LoadBalancer = data.aws_lb.main.arn_suffix
      }
    }
  }

  insufficient_data_actions = [aws_sns_topic.capp_api_notifications.arn]
  alarm_actions             = [aws_sns_topic.capp_api_notifications.arn]
  ok_actions                = [aws_sns_topic.capp_api_notifications.arn]
  treat_missing_data        = "notBreaching"
  actions_enabled           = var.alarms_enabled
}

resource "aws_cloudwatch_metric_alarm" "api_targetgroup_latency" {
  alarm_name                = "capp-${var.env}-application-lb-latency"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  threshold                 = "1"
  period                    = "60"
  evaluation_periods        = "5"
  metric_name               = "TargetResponseTime"
  namespace                 = "AWS/ApplicationELB"
  statistic                 = "Average"
  alarm_description         = "Application Load Balancer request latency"
  dimensions = {
    TargetGroup  = aws_lb_target_group.api.arn_suffix
    LoadBalancer = data.aws_lb.main.arn_suffix
  }

  actions_enabled           = var.alarms_enabled
  alarm_actions             = [aws_sns_topic.capp_api_alerts.arn]
  ok_actions                = [aws_sns_topic.capp_api_alerts.arn]
  insufficient_data_actions = [aws_sns_topic.capp_api_alerts.arn]
  treat_missing_data        = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "api_targetgroup_4XX_errors" {
  alarm_name                = "capp-${var.env}-api-4XX-errors"
  alarm_description         = "API 4xx errors are elevated"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  evaluation_periods        = 5
  period                    = 60
  threshold                 = "50"
  statistic                 = "Average"
  metric_name               = "HTTPCode_Target_4XX_Count"
  namespace                 = "AWS/ApplicationELB"
  
  actions_enabled           = var.alarms_enabled
  alarm_actions             = [aws_sns_topic.capp_api_nofifications.arn]
  ok_actions                = [aws_sns_topic.capp_api_notifications.arn]
  treat_missing_data        = "notBreaching"
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.api.arn_suffix
    LoadBalancer = data.aws_lb.main.arn_suffix
  }
}

# SNS Topics
data "aws_iam_policy_document" "alerts_topic_policy" {
  statement {
    sid = "1"
    principals {
       type = "Service"
       identifiers = ["cloudwatch.amazonaws.com"]
    }
    actions = [ "sns:Publish" ]
    resources = [
      "arn:aws:sns:us-east-1:${data.aws_caller_identity.current.account_id}:${var.env}-api-alerts",
      "arn:aws:sns:us-east-1:${data.aws_caller_identity.current.account_id}:${var.env}-api-notifications"
    ]
  }
}
resource "aws_sns_topic" "capp_api_alerts" {
  name        = "capp-${var.env}-api-alerts"
  tags        = {
    Name      = "capp-${var.env}-api-alerts"
  }
  policy     = data.aws_iam_policy_document.alerts_topic_policy.json
}
# Send lower urgency alarms here
resource "aws_sns_topic" "capp_api_notifications" {
  name        = "capp-${var.env}-api-notifications"
  policy      = data.aws_iam_policy_document.alerts_topic_policy.json
  tags        = {
    Name = "capp-${var.env}-api-notifications"
  }
}

resource "aws_sns_topic_subscription" "pagerduty" {
  topic_arn   = aws_sns_topic.capp_api_alerts.arn
  protocol    = "https"
  endpoint    = var.pagerduty_integration_url
}

module "notify_slack" {
  source  = "terraform-aws-modules/notify-slack/aws"
  version = "~> 5.6"

  create_sns_topic     = false
  lambda_function_name = "capp-${var.env}-api-notify-slack"
  sns_topic_name       = "capp-${var.env}-api-notifications"
  slack_webhook_url    = var.notify_webhook
  slack_channel        = var.slack_channel
  slack_username       = var.slack_username
}