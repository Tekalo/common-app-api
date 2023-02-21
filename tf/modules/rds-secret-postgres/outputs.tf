output "secret_arn" {
  value       = aws_secretsmanager_secret.main.arn
  description = "ARN of database secret"
}
