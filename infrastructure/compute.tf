# Create deployment package for Lambda functions
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"
  
  source {
    content = templatefile("${path.module}/lambda_handler.py", {
      users_table_name      = aws_dynamodb_table.users.name
      loans_table_name      = aws_dynamodb_table.loans.name
      repayments_table_name = aws_dynamodb_table.repayments.name
    })
    filename = "lambda_function.py"
  }
}

# Lambda Function: Authentication Handler
resource "aws_lambda_function" "auth_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.name_prefix}-auth"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "lambda_function.auth_handler"
  runtime          = "python3.9"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      # DynamoDB Tables
      DYNAMODB_USERS_TABLE      = aws_dynamodb_table.users.name
      DYNAMODB_LOANS_TABLE      = aws_dynamodb_table.loans.name
      DYNAMODB_REPAYMENTS_TABLE = aws_dynamodb_table.repayments.name
      
      # S3 Storage
      S3_BUCKET_NAME = aws_s3_bucket.storage.bucket
      
      # Cognito
      COGNITO_USER_POOL_ID        = aws_cognito_user_pool.main.id
      COGNITO_USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.main.id
      COGNITO_IDENTITY_POOL_ID    = aws_cognito_identity_pool.main.id
      
      # Security
      KMS_KEY_ID = aws_kms_key.main.key_id
      
      # SNS
      SNS_TOPIC_ARN = aws_sns_topic.alerts.arn
      
      # General
      AWS_REGION   = var.aws_region
      ENVIRONMENT  = var.environment
      PROJECT_NAME = var.project_name
    }
  }
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  # Security: VPC configuration can be added here if needed
  
  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-auth"
    Function = "Authentication"
  })

  depends_on = [aws_cloudwatch_log_group.auth_logs]
}

# Lambda Function: Loans Handler
resource "aws_lambda_function" "loans_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.name_prefix}-loans"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "lambda_function.loans_handler"
  runtime          = "python3.9"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      # DynamoDB Tables
      DYNAMODB_USERS_TABLE      = aws_dynamodb_table.users.name
      DYNAMODB_LOANS_TABLE      = aws_dynamodb_table.loans.name
      DYNAMODB_REPAYMENTS_TABLE = aws_dynamodb_table.repayments.name
      
      # S3 Storage
      S3_BUCKET_NAME = aws_s3_bucket.storage.bucket
      
      # Cognito
      COGNITO_USER_POOL_ID        = aws_cognito_user_pool.main.id
      COGNITO_USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.main.id
      COGNITO_IDENTITY_POOL_ID    = aws_cognito_identity_pool.main.id
      
      # Security
      KMS_KEY_ID = aws_kms_key.main.key_id
      
      # SNS
      SNS_TOPIC_ARN = aws_sns_topic.alerts.arn
      
      # General
      AWS_REGION   = var.aws_region
      ENVIRONMENT  = var.environment
      PROJECT_NAME = var.project_name
    }
  }
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-loans"
    Function = "LoansManagement"
  })

  depends_on = [aws_cloudwatch_log_group.loans_logs]
}

# Lambda Function: Repayments Handler
resource "aws_lambda_function" "repayments_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.name_prefix}-repayments"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "lambda_function.repayments_handler"
  runtime          = "python3.9"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      # DynamoDB Tables
      DYNAMODB_USERS_TABLE      = aws_dynamodb_table.users.name
      DYNAMODB_LOANS_TABLE      = aws_dynamodb_table.loans.name
      DYNAMODB_REPAYMENTS_TABLE = aws_dynamodb_table.repayments.name
      
      # S3 Storage
      S3_BUCKET_NAME = aws_s3_bucket.storage.bucket
      
      # Cognito
      COGNITO_USER_POOL_ID        = aws_cognito_user_pool.main.id
      COGNITO_USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.main.id
      COGNITO_IDENTITY_POOL_ID    = aws_cognito_identity_pool.main.id
      
      # Security
      KMS_KEY_ID = aws_kms_key.main.key_id
      
      # SNS
      SNS_TOPIC_ARN = aws_sns_topic.alerts.arn
      
      # General
      AWS_REGION   = var.aws_region
      ENVIRONMENT  = var.environment
      PROJECT_NAME = var.project_name
    }
  }
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-repayments"
    Function = "RepaymentsManagement"
  })

  depends_on = [aws_cloudwatch_log_group.repayments_logs]
}
