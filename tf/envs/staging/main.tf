terraform {
  cloud {
    organization = "schmidtfutures"

    workspaces {
      name = "tekalo-infra-backend-staging"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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

  env        = var.env
  bucket_env = var.bucket_env
}

module "email" {
  source             = "../../modules/email"
  env                = module.envconfig.env
  kms_key            = module.envconfig.kms_main_key
  email_from_address = var.email_from_address
}

module "app" {
  source = "../../modules/app"

  env                  = module.envconfig.env
  bucket_env           = module.envconfig.bucket_env
  kms_key              = module.envconfig.kms_main_key
  api_port             = var.api_port
  dns_zone_id          = module.envconfig.dns_zone_id
  load_balancer_arn    = module.envconfig.load_balancer_arn
  vpc_id               = module.envconfig.vpc_id
  db_subnet_name       = module.envconfig.db_subnet_name
  db_security_group_id = module.envconfig.db_security_group_id
  ecs_cluster          = module.envconfig.ecs_cluster
  ecs_cluster_name     = module.envconfig.ecs_cluster_name
  cert_arn             = module.envconfig.cert_arn
  image                = var.image
  cli_image            = var.cli_image
  auth0_zone_id        = var.auth0_zone_id
  auth0_domain_cname   = var.auth0_domain_cname
  sentry_dsn           = var.sentry_dsn
  load_test            = var.load_test
  web_url              = var.web_url
  email_from_address   = var.email_from_address
  reply_to_address     = var.reply_to_address
  ses_whitelist        = var.ses_whitelist

  rotation_vpc_security_group_id = module.envconfig.database_ingress_security_group_id
  rotation_vpc_subnet_ids        = module.envconfig.private_subnet_ids

  task_security_group = module.envconfig.database_ingress_security_group_id
  task_subnet_ids     = module.envconfig.private_subnet_ids

  uploads_cors_allowed_origins = var.uploads_cors_allowed_origins

  additional_env_vars = {
    # Temporarily enabling this while we role out POST-based uploads.
    "PRESIGNER_STRATEGY" = "both",
    "AWS_EMAIL_SQS_URL"  = "${module.email.email_queue_url}"
  }
}

moved {
  from = module.app.aws_kms_key.main
  to   = module.envconfig.aws_kms_key.main
}

moved {
  from = module.app.aws_kms_alias.main
  to   = module.envconfig.aws_kms_alias.main
}
module "env_defns" {
  source = "../../modules/env_defns"
}

module "autoscaling" {
  source = "../../modules/autoscale"

  env              = module.envconfig.env
  ecs_cluster_name = module.envconfig.ecs_cluster_name
  service_name     = module.app.service_name

  min_capacity = 2
  max_capacity = 10

  metrics = {
    CPUAverage = {
      target = 60
      predefined_metric = [{
        type = "ECSServiceAverageCPUUtilization"
      }]
    }
    MemoryAverage = {
      target = 60
      predefined_metric = [{
        type = "ECSServiceAverageMemoryUtilization"
      }]
    }
    CPUSpike = {
      target = 85
      customized_metric = [{
        metric_name = "CPUUtilization"
        namespace   = "AWS/ECS"
        statistic   = "Maximum"
        unit        = "Percent"
        dimensions = {
          "ClusterName" = module.envconfig.ecs_cluster_name
          "ServiceName" = module.app.service_name
        }
      }]
    }
  }
}

# Dev and staging share an Auth0 tenant, which is configured with a custom domain
# In order to validate that we own the domain, Auth0 requires us to host a CNAME record
# that points back to the Auth0 tenant. This CNAME is currently configured in the dev environment.
# For production, the CNAME is configured in Cloudflare.
