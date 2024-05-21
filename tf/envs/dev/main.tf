terraform {
  cloud {
    organization = "tekalo"

    workspaces {
      name = "tekalo-infra-backend-dev"
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
      Project     = "Tekalo"
    }
  }
}

module "envconfig" {
  source = "../../modules/envconfig"

  env = var.env
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
  kms_key              = module.envconfig.kms_main_key
  api_port             = var.api_port
  dns_zone_id          = module.envconfig.dns_zone_id
  load_balancer_arn    = module.envconfig.load_balancer_arn
  vpc_id               = module.envconfig.vpc_id
  task_subnet_ids      = module.envconfig.private_subnet_ids
  task_security_group  = module.envconfig.database_ingress_security_group_id
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
  web_url              = var.web_url
  email_from_address   = var.email_from_address
  reply_to_address     = var.reply_to_address
  ses_whitelist        = var.ses_whitelist
  email_queue_arn      = module.email.email_queue_arn

  rotation_vpc_security_group_id = module.envconfig.database_ingress_security_group_id
  rotation_vpc_subnet_ids        = module.envconfig.private_subnet_ids

  uploads_cors_allowed_origins = var.uploads_cors_allowed_origins

  additional_env_vars = {
    "PRESIGNER_STRATEGY" = "post",
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

module "auth0_ses" {
  source                   = "../../modules/auth0-ses"
  auth0_email_from_address = var.auth0_from_email_address
  env                      = module.envconfig.env
}


# DNS for auth0
# Dev and staging share an Auth0 tenant, which is configured with a custom domain.
# In order to validate that we own the domain, Auth0 requires us to host a CNAME record
# that points back to the Auth0 tenant. This CNAME is currently configured in the dev environment (here).
# For production, the CNAME is configured in Cloudflare.
data "aws_route53_zone" "auth0" {
  zone_id = var.auth0_zone_id
}
resource "aws_route53_record" "auth" {
  zone_id = var.auth0_zone_id
  name    = "auth.${data.aws_route53_zone.auth0.name}"
  type    = "CNAME"
  ttl     = "300"
  records = [var.auth0_domain_cname]
}
