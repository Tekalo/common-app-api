data "aws_security_group" "db_security_group" {
  id = var.db_security_group_id
}

data "aws_db_subnet_group" "main_subnet_group" {
  name = var.db_subnet_name
}

resource "aws_kms_key" "main" {
  description         = "Key for all CAPP ${var.env} data"
  enable_key_rotation = var.env == "prod"
}

resource "aws_kms_alias" "main" {
  name          = "alias/capp-${var.env}"
  target_key_id = aws_kms_key.main.key_id
}

resource "aws_rds_cluster" "main" {
  cluster_identifier_prefix = "capp-${var.env}"

  engine                 = "aurora-postgresql"
  engine_mode            = "provisioned"
  engine_version         = "14.6"
  database_name          = "capp"
  master_username        = var.db_username
  master_password        = var.db_password
  vpc_security_group_ids = [data.aws_security_group.db_security_group.id]

  final_snapshot_identifier = "capp-${var.env}-final"

  kms_key_id        = aws_kms_key.main.arn
  storage_encrypted = true

  db_subnet_group_name = data.aws_db_subnet_group.main_subnet_group.name
  serverlessv2_scaling_configuration {
    max_capacity = 1.0
    min_capacity = 0.5
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_rds_cluster_instance" "instance0" {
  cluster_identifier   = aws_rds_cluster.main.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.main.engine
  engine_version       = aws_rds_cluster.main.engine_version
  db_subnet_group_name = data.aws_db_subnet_group.main_subnet_group.name

  lifecycle {
    create_before_destroy = true
  }
}

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

resource "aws_ecs_service" "api" {
  name                              = "capp-api"
  cluster                           = var.ecs_cluster
  task_definition                   = aws_ecs_task_definition.api.arn
  desired_count                     = 1
  health_check_grace_period_seconds = 30
  enable_ecs_managed_tags           = true
  propagate_tags                    = "SERVICE"

  # Preserve the existing containers until new ones are deemed healthy
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  # Rollback to the current stable version in case of a failure during deploy
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "capp-api"
    container_port   = var.api_port
  }

  # Per https://github.com/hashicorp/terraform-provider-aws/issues/22823, the default
  # capacity provider strategy on the cluster leads to a cycle of needing to recreate the service
  # to null out the strategy (since we do not specify a strategy ourselves, there is a discrepency between 
  # terraform spec and what is already in AWS)
  # If https://github.com/hashicorp/terraform-provider-aws/issues/26533 is ever resolved, we
  # could explicitly set the strategy to be the default strategy, which would be acceptable.
  lifecycle {
    ignore_changes = [
      capacity_provider_strategy
    ]
  }
}

data "aws_region" "current" {}

resource "aws_ecs_task_definition" "api" {
  family = "capp-${var.env}-api"

  depends_on = [aws_iam_role_policy.execution_role, aws_iam_role_policy_attachment.default_execution_role]

  execution_role_arn = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "capp-api"
      image     = "${var.image}"
      memory    = 256
      essential = true
      portMappings = [
        {
          containerPort = var.api_port
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "api"
        }
      }
      secrets = [{
        name      = "DATABASE_SECRET"
        valueFrom = module.rds-secret.secret_arn
      }]

      environment = [{
        name  = "APP_ENV"
        value = "${var.env}"
        }, {
        name  = "PORT"
        value = tostring(var.api_port)
      }]
    }
  ])
}

resource "aws_ecs_task_definition" "cli" {
  family = "capp-${var.env}-cli"

  depends_on = [aws_iam_role_policy.execution_role, aws_iam_role_policy_attachment.default_execution_role]

  execution_role_arn = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "capp-cli"
      image     = "${var.cli_image}"
      memory    = 512
      essential = true
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "cli"
        }
      }
      secrets = [{
        name      = "DATABASE_SECRET"
        valueFrom = module.rds-secret.secret_arn
      }]
    },
  ])
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "CAPP/${var.env}/Api"
  retention_in_days = 90
}

resource "aws_lb_target_group" "api" {
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.main.id
  health_check {
    healthy_threshold = 2
    interval          = 10
    timeout           = 5
    path              = "/health"
    protocol          = "HTTP"
    matcher           = "200-299"
  }
  deregistration_delay = 30
}

data "aws_vpc" "main" {
  id = var.vpc_id
}

data "aws_route53_zone" "main" {
  zone_id = var.dns_zone_id
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = data.aws_lb_listener.main443.arn

  condition {
    host_header {
      values = ["capp-api.${data.aws_route53_zone.main.name}"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

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

data "aws_lb" "main" {
  arn = var.load_balancer_arn
}

data "aws_lb_listener" "main443" {
  load_balancer_arn = data.aws_lb.main.arn
  port              = 443
}

resource "aws_route53_record" "api" {
  zone_id = var.dns_zone_id
  name    = "capp-api.${data.aws_route53_zone.main.name}"
  type    = "A"
  alias {
    name                   = data.aws_lb.main.dns_name
    zone_id                = data.aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

module "rds-secret" {
  source = "../rds-secret-postgres"

  function_name = "capp-${var.env}-rds"
  initial_secret = {
    "engine"   = "postgres"
    "host"     = aws_rds_cluster.main.endpoint
    "username" = var.db_username
    "password" = var.db_password
    "dbname"   = aws_rds_cluster.main.database_name
    "port"     = tostring(aws_rds_cluster.main.port)
  }
  kms_key_id            = aws_kms_key.main.arn
  vpc_subnet_ids        = var.rotation_vpc_subnet_ids
  vpc_security_group_id = var.rotation_vpc_security_group_id

  secret_name        = "projects/capp/${var.env}/db/config"
  secret_description = "RDS database secret for CAPP ${var.env} [${var.db_username}]"
}

resource "aws_iam_role" "ecs_execution_role" {
  name = "capp-${var.env}-ecs-execution-role"
  path = "/projects/capp/${var.env}/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy" "execution_role" {
  name   = "capp-task-execution-role"
  role   = aws_iam_role.ecs_execution_role.id
  policy = data.aws_iam_policy_document.execution_role.json
}

data "aws_iam_policy_document" "execution_role" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [module.rds-secret.secret_arn]
  }

  statement {
    actions   = ["kms:Decrypt"]
    resources = [aws_kms_key.main.arn]
  }
}

resource "aws_iam_role_policy_attachment" "default_execution_role" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
