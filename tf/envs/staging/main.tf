terraform {
  cloud {
    organization = "schmidtfutures"

    workspaces {
      name = "common-app-infra-backend-staging"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.54"
    }
  }
  required_version = ">= 1.3.9"
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "Staging"
      Project     = "CAPP"
      BillingCode = "TLE-451"
    }
  }
}

module "envconfig" {
  source = "../../modules/envconfig"

  env = var.env
}

module "app" {
  source = "../../modules/app"

  env                  = module.envconfig.env
  api_port             = var.api_port
  dns_zone_id          = module.envconfig.dns_zone_id
  load_balancer_arn    = module.envconfig.load_balancer_arn
  vpc_id               = module.envconfig.vpc_id
  db_subnet_name       = module.envconfig.db_subnet_name
  db_security_group_id = module.envconfig.db_security_group_id
  ecs_cluster          = module.envconfig.ecs_cluster
  cert_arn             = module.envconfig.cert_arn
  image                = var.image
  cli_image            = var.cli_image
  auth0_domain         = var.auth0_domain
  sentry_dsn           = var.sentry_dsn

  rotation_vpc_security_group_id = module.envconfig.database_ingress_security_group_id
  rotation_vpc_subnet_ids        = module.envconfig.private_subnet_ids
}

module "env_defns" {
  source = "../../modules/env_defns"
}

module "autoscaling" {
  source = "../../modules/autoscale"

  env                 = module.envconfig.env
  ecs_cluster         = module.envconfig.ecs_cluster
  service_name        = module.app.service_name

  metrics = {
    CPUUtilization = {
      metric_name             = "CPUUtilization"
      adjustment_type         = "ChangeInCapacity"
      cooldown                = 60
      datapoints_to_alarm     = 1
      evaluation_periods      = 1
      metric_aggregation_type = "Average"
      period                  = 60
      statistic               = "Average"

      down = {
        comparison_operator         = "LessThanThreshold"
        metric_interval_upper_bound = 0
        scaling_adjustment          = -1
        threshold                   = 40
      }

      up = {
        comparison_operator         = "GreaterThanOrEqualToThreshold"
        metric_interval_lower_bound = 1
        scaling_adjustment          = 1
        threshold                   = 70
      }      
    }
  }
}
