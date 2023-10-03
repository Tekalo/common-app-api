terraform {
  cloud {
    organization = "schmidtfutures"

    workspaces {
      name = "common-app-infra-backend-dev"
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
      Environment = "Dev"
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
  ecs_cluster_name     = module.envconfig.ecs_cluster_name
  cert_arn             = module.envconfig.cert_arn
  image                = var.image
  cli_image            = var.cli_image
  auth0_domain         = var.auth0_domain
  sentry_dsn           = var.sentry_dsn
  web_url              = var.web_url
  email_from_address   = var.email_from_address
  reply_to_address     = var.reply_to_address

  rotation_vpc_security_group_id = module.envconfig.database_ingress_security_group_id
  rotation_vpc_subnet_ids        = module.envconfig.private_subnet_ids

  uploads_cors_allowed_origins = var.uploads_cors_allowed_origins

  additional_env_vars = {
    "PRESIGNER_STRATEGY" = "both"
  }
}

module "env_defns" {
  source = "../../modules/env_defns"
}

module "auth0_ses" {
  source                   = "../../modules/auth0-ses"
  auth0_email_from_address = var.auth0_from_email_address
  env                      = module.envconfig.env
}
