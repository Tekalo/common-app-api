
resource "aws_ecr_repository" "api" {
  name                 = "capp/api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Set a repository policy allowing prod to pull from this repo. We'll use this to promote
# the image during prod deployment.
resource "aws_ecr_repository_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowProdPull",
            "Effect": "Allow",
            "Principal": {
              "AWS": "arn:aws:iam::${module.env_defns.envs["prod"].aws_account_id}:root"
            },
            "Action": [
                "ecr:BatchGetImage",
                "ecr:GetDownloadUrlForLayer"
            ]
        }
    ]
}
EOF
}

output "ecr_repository_arn" {
  value = aws_ecr_repository.api.arn
}
