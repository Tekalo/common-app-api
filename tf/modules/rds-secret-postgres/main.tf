resource "aws_secretsmanager_secret" "main" {
  name        = var.secret_name
  description = "${var.secret_description} master database secret"
  kms_key_id  = var.kms_key_id
}

resource "aws_secretsmanager_secret_version" "main" {
  secret_id     = aws_secretsmanager_secret.main.id
  secret_string = jsonencode(var.initial_secret)

  # Once rotation takes over, we don't want terraform inspecting the secret.
  lifecycle {
    ignore_changes = [
      secret_string
    ]
  }
}

resource "aws_serverlessapplicationrepository_cloudformation_stack" "postgres-rotator" {
  name = "${var.function_name}-postgres-rotator"

  # This is the AWS-managed postgres rotation serverless app package:
  # https://serverlessrepo.aws.amazon.com/applications/us-east-1/297356227824/SecretsManagerRDSPostgreSQLRotationSingleUser
  application_id = "arn:aws:serverlessrepo:us-east-1:297356227824:applications/SecretsManagerRDSPostgreSQLRotationSingleUser"
  capabilities = [
    "CAPABILITY_IAM",
    "CAPABILITY_RESOURCE_POLICY",
  ]
  parameters = {
    functionName = "${var.function_name}-postgres-rotator-func"
    endpoint     = "https://secretsmanager.${data.aws_region.current.name}.${data.aws_partition.current.dns_suffix}"
    kmsKeyArn    = var.kms_key_id

    vpcSecurityGroupIds = var.vpc_security_group_id
    vpcSubnetIds        = join(",", var.vpc_subnet_ids)
  }
}

data "aws_partition" "current" {}
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  rotation_lambda_arn = var.rotation_lambda_arn != null ? var.rotation_lambda_arn : aws_serverlessapplicationrepository_cloudformation_stack.postgres-rotator.outputs.RotationLambdaARN
}

resource "aws_secretsmanager_secret_rotation" "main" {
  secret_id           = aws_secretsmanager_secret.main.id
  rotation_lambda_arn = local.rotation_lambda_arn

  rotation_rules {
    automatically_after_days = var.rotate_after_days
  }
}
