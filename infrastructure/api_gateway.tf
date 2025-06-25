# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.name_prefix}-api"
  description = "LoanSyncro REST API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api"
  })
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_method.auth_post,
    aws_api_gateway_method.loans_any,
    aws_api_gateway_method.repayments_any,
    aws_api_gateway_integration.auth_integration,
    aws_api_gateway_integration.loans_integration,
    aws_api_gateway_integration.repayments_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = var.environment

  # Force new deployment on changes
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.auth.id,
      aws_api_gateway_resource.loans.id,
      aws_api_gateway_resource.repayments.id,
      aws_api_gateway_method.auth_post.id,
      aws_api_gateway_method.loans_any.id,
      aws_api_gateway_method.repayments_any.id,
      aws_api_gateway_integration.auth_integration.id,
      aws_api_gateway_integration.loans_integration.id,
      aws_api_gateway_integration.repayments_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auth Resource and Methods
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "auth"
}

resource "aws_api_gateway_method" "auth_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.auth.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.auth.id
  http_method = aws_api_gateway_method.auth_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth_handler.invoke_arn
}

# Loans Resource and Methods
resource "aws_api_gateway_resource" "loans" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "loans"
}

resource "aws_api_gateway_method" "loans_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.loans.id
  http_method   = "ANY"
  authorization = "NONE"  # You can add Cognito authorization here later
}

resource "aws_api_gateway_integration" "loans_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.loans.id
  http_method = aws_api_gateway_method.loans_any.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.loans_handler.invoke_arn
}

# Repayments Resource and Methods
resource "aws_api_gateway_resource" "repayments" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "repayments"
}

resource "aws_api_gateway_method" "repayments_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.repayments.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "repayments_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.repayments.id
  http_method = aws_api_gateway_method.repayments_any.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.repayments_handler.invoke_arn
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "auth_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "loans_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.loans_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "repayments_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.repayments_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
