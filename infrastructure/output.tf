output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.main.stage_name}"
}

output "api_gateway_stage" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.main.stage_name
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    users      = aws_dynamodb_table.users.name
    loans      = aws_dynamodb_table.loans.name
    repayments = aws_dynamodb_table.repayments.name
  }
}

output "s3_bucket_name" {
  description = "S3 bucket name for storage"
  value       = aws_s3_bucket.storage.bucket
}

output "lambda_functions" {
  description = "Lambda function names"
  value = {
    auth       = aws_lambda_function.auth_handler.function_name
    loans      = aws_lambda_function.loans_handler.function_name
    repayments = aws_lambda_function.repayments_handler.function_name
  }
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.main.key_id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = aws_cognito_identity_pool.main.id
}

output "amplify_app_id" {
  description = "Amplify App ID"
  value       = aws_amplify_app.main.id
}

output "amplify_default_domain" {
  description = "Amplify default domain"
  value       = aws_amplify_app.main.default_domain
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.main.default_domain}"
}

output "debug_info" {
  description = "Debug information for troubleshooting"
  value = {
    api_gateway_id = aws_api_gateway_rest_api.main.id
    region = var.aws_region
    stage = var.environment
    full_api_url = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
  }
}
