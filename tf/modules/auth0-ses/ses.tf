resource "aws_iam_user" "auth0" {
  name = "capp-${var.env}-auth0-email-provider"
  path = "/projects/capp/${var.env}/"
}

resource "aws_iam_access_key" "auth0" {
  user = aws_iam_user.auth0.name
}

resource "aws_iam_user_policy" "auth0_ses" {
  name   = "ses-policy"
  user   = aws_iam_user.auth0.name
  policy = data.aws_iam_policy_document.auth0_ses_policy.json
}

data "aws_iam_policy_document" "auth0_ses_policy" {
  statement {
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "ses:FromAddress"
      values   = [var.auth0_email_from_address]
    }
  }
}

output "access_key_id" {
  description = "AWS Access Key ID for Auth0 SES user"
  value       = aws_iam_access_key.auth0.id
}

output "secret_access_key" {
  description = "AWS Secret Access Key for Auth0 SES user"
  sensitive   = true
  value       = aws_iam_access_key.auth0.secret
}
