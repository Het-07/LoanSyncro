# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "auth_logs" {
  name              = "/aws/lambda/${local.name_prefix}-auth"
  retention_in_days = var.log_retention_days
  # kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-auth-logs"
    Function = "Authentication"
  })
}

resource "aws_cloudwatch_log_group" "loans_logs" {
  name              = "/aws/lambda/${local.name_prefix}-loans"
  retention_in_days = var.log_retention_days
  # kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-loans-logs"
    Function = "LoansManagement"
  })
}

resource "aws_cloudwatch_log_group" "repayments_logs" {
  name              = "/aws/lambda/${local.name_prefix}-repayments"
  retention_in_days = var.log_retention_days
  # kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-repayments-logs"
    Function = "RepaymentsManagement"
  })
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email   
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name              = "${local.name_prefix}-alerts"
  kms_master_key_id = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-alerts"
    Purpose = "SystemAlerts"
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.name_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Lambda function errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.auth_handler.function_name
  }

  tags = merge(local.common_tags, {
    Name      = "${local.name_prefix}-lambda-errors"
    AlarmType = "LambdaErrors"
  })
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_errors" {
  alarm_name          = "${local.name_prefix}-api-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "API Gateway 4XX errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }

  tags = merge(local.common_tags, {
    Name      = "${local.name_prefix}-api-errors"
    AlarmType = "APIGatewayErrors"
  })
}
