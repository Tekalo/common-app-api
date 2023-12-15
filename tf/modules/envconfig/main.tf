variable "env" {
  type        = string
  description = "Slug of environment (dev, staging, prod)"
}

data "aws_cloudformation_stack" "vpc" {
  name = "${var.env}-vpc"
}

data "aws_cloudformation_stack" "ecs" {
  name = "${var.env}-ecs-cluster"
}

data "aws_ecs_cluster" "ecs" {
  cluster_name = data.aws_cloudformation_stack.ecs.outputs["Cluster"]
}

output "dns_zone_id" {
  value = data.aws_cloudformation_stack.vpc.outputs["Route53Zone"]
}

output "load_balancer_arn" {
  value = data.aws_cloudformation_stack.vpc.outputs["LoadBalancer"]
}

output "vpc_id" {
  value = data.aws_cloudformation_stack.vpc.outputs["VPC"]
}

output "ecs_cluster" {
  value = data.aws_ecs_cluster.ecs.arn
}

output "ecs_cluster_name" {
  value = data.aws_ecs_cluster.ecs.cluster_name
}

output "private_subnet_ids" {
  description = "Subnet IDs for main private subnet"
  value       = split(",", data.aws_cloudformation_stack.vpc.outputs["PrivateSubnets"])
}

output "database_ingress_security_group_id" {
  description = "Security Group ID for sec group with access to database"
  // Note: we are reusing the LBHostSecurityGroup here because it is the only one that can access
  // the database and has no egress restrictions and inconsequential ingress perms, but in the
  // future we might want to change how this is done. The only current use cases for this are:
  // - the security group for the rotation lambda
  value = data.aws_cloudformation_stack.vpc.outputs["LBHostSecurityGroup"]
}

output "db_subnet_name" {
  value = data.aws_cloudformation_stack.vpc.outputs["PrivateDbSubnet"]
}

output "db_security_group_id" {
  value = data.aws_cloudformation_stack.vpc.outputs["DatabaseSecurityGroup"]
}

output "cert_arn" {
  value = data.aws_cloudformation_stack.vpc.outputs["SslCertArn"]
}

output "env" {
  value = var.env
}

moved {
  from = module.app.aws_kms_key.main
  to   = module.envconfig.aws_kms_key.main
}

moved {
  from = module.app.aws_kms_alias.main
  to   = module.envconfig.aws_kms_alias.main
}

resource "aws_kms_key" "main" {
  description         = "Key for all CAPP ${var.env} data"
  enable_key_rotation = var.env == "prod"

}

resource "aws_kms_alias" "main" {
  name          = "alias/capp-${var.env}"
  target_key_id = aws_kms_key.main.key_id
}

output "kms_main_key" {
  description = "Main KMS Key"
  value = {
    arn    = aws_kms_key.main.arn,
    key_id = aws_kms_key.main.key_id
  }
}
