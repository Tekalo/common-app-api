data "aws_iam_policy_document" "mailer_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "mailer_ses_policy" {
  statement {
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail"
    ]
    effect    = "Allow"
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "ses:FromAddress"
      values   = [var.email_from_address]
    }
  }
  statement {
    sid    = "AllowKMSDecrypt"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
    ]
    resources = [data.aws_kms_key.main.arn]
  }
}

resource "aws_iam_role" "mailer_lambda_role" {
  name               = "capp-${var.env}-lambda-mailer-role"
  assume_role_policy = data.aws_iam_policy_document.mailer_assume_role_policy.json
  inline_policy {
    name   = "lambda_inline_policy"
    policy = data.aws_iam_policy_document.mailer_ses_policy.json
  }
}

resource "aws_iam_role_policy_attachment" "mailer_lambda_policy" {
  role       = aws_iam_role.mailer_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

resource "aws_lambda_function" "mailer" {
  description      = "Handles sending emails for common-app-api"
  function_name    = "capp-${var.env}-email-sender"
  filename         = "email-sender.zip"
  source_code_hash = filebase64sha256("email-sender.zip")
  handler          = "index.handler"
  role             = aws_iam_role.mailer_lambda_role.arn
  runtime          = "nodejs18.x"

  environment {
    variables = {
      SES_FROM_ADDRESS = var.email_from_address
    }
  }
}

resource "aws_lambda_event_source_mapping" "mailer_sqs_source" {
  event_source_arn = aws_sqs_queue.email_sqs_queue.arn
  function_name    = aws_lambda_function.mailer.arn
}

# Create a cloudwatch log group explicitly so we can set a retention policy
resource "aws_cloudwatch_log_group" "mailer_lambda_log" {
  name              = "/aws/lambda/${aws_lambda_function.mailer.function_name}"
  retention_in_days = 30
}
