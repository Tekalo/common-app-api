# data "aws_kms_key" "main" {
#   key_id = "alias/capp-${var.env}"
# }
resource "aws_sqs_queue" "email_sqs_queue" {
  name                              = "capp-${var.env}-email-sender"
  message_retention_seconds         = 1209600
  kms_master_key_id                 = var.kms_key_id
  kms_data_key_reuse_period_seconds = 300
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.email_sqs_deadletter_queue.arn
    maxReceiveCount     = 3
  })

  # depends_on = [modules.app.aws_kms_key.main]
}

resource "aws_sqs_queue" "email_sqs_deadletter_queue" {
  name                              = "capp-${var.env}-email-sender-deadletter"
  message_retention_seconds         = 1209600
  kms_master_key_id                 = var.kms_key_id
  kms_data_key_reuse_period_seconds = 300
  # depends_on                        = [modules.app.aws_kms_key.main]
}

output "email_queue_url" {
  description = "URL of the SQS queue that is processed by the email-sender lambda"
  value       = aws_sqs_queue.email_sqs_queue.url
}
