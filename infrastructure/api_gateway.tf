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

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-stage"
  })
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_method.loans_any,
    aws_api_gateway_method.repayments_any,
    aws_api_gateway_method.loans_options,
    aws_api_gateway_method.repayments_options,
    aws_api_gateway_integration.loans_integration,
    aws_api_gateway_integration.repayments_integration,
    aws_api_gateway_integration.loans_options_integration,
    aws_api_gateway_integration.repayments_options_integration,
    aws_api_gateway_method.loans_proxy_any,
    aws_api_gateway_method.loans_proxy_options,
    aws_api_gateway_method.repayments_proxy_any,
    aws_api_gateway_method.repayments_proxy_options,
    aws_api_gateway_integration.loans_proxy_integration,
    aws_api_gateway_integration.loans_proxy_options_integration,
    aws_api_gateway_integration.repayments_proxy_integration,
    aws_api_gateway_integration.repayments_proxy_options_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.loans.id,
      aws_api_gateway_resource.repayments.id,
      aws_api_gateway_method.loans_any.id,
      aws_api_gateway_method.repayments_any.id,
      aws_api_gateway_method.loans_options.id,
      aws_api_gateway_method.repayments_options.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Cognito Authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name                   = "${local.name_prefix}-cognito-authorizer"
  rest_api_id            = aws_api_gateway_rest_api.main.id
  type                   = "COGNITO_USER_POOLS"
  identity_source        = "method.request.header.Authorization"
  provider_arns          = [aws_cognito_user_pool.main.arn] # Use the created User Pool ARN

  depends_on = [aws_api_gateway_rest_api.main, aws_cognito_user_pool.main]
}

# IAM Role for API Gateway
resource "aws_iam_role" "api_gateway_role" {
  name = "${local.name_prefix}-api-gateway-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "api_gateway_invoke_lambda" {
  name   = "${local.name_prefix}-api-gateway-policy"
  role   = aws_iam_role.api_gateway_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = [
          aws_lambda_function.loans_handler.arn,
          aws_lambda_function.repayments_handler.arn
        ]
      }
    ]
  })
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
  authorization = "COGNITO"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_resource" "loans_proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.loans.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "loans_proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.loans_proxy.id
  http_method   = "ANY"
  authorization = "COGNITO"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
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
  authorization = "COGNITO"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_resource" "repayments_proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.repayments.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "repayments_proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.repayments_proxy.id
  http_method   = "ANY"
  authorization = "COGNITO"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# CORS Configurations
resource "aws_api_gateway_method" "loans_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.loans.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "loans_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.loans.id
  http_method             = aws_api_gateway_method.loans_options.http_method
  type                    = "MOCK"
  request_templates       = {
    "application/json" = "{\"statusCode\": 200}"
  }
  passthrough_behavior    = "WHEN_NO_MATCH"
}

resource "aws_api_gateway_method_response" "loans_options_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.loans.id
  http_method = aws_api_gateway_method.loans_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "loans_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.loans.id
  http_method = aws_api_gateway_method.loans_options.http_method
  status_code = aws_api_gateway_method_response.loans_options_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_method_response.loans_options_200]
}

resource "aws_api_gateway_method" "repayments_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.repayments.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "repayments_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.repayments.id
  http_method             = aws_api_gateway_method.repayments_options.http_method
  type                    = "MOCK"
  request_templates       = {
    "application/json" = "{\"statusCode\": 200}"
  }
  passthrough_behavior    = "WHEN_NO_MATCH"
}

resource "aws_api_gateway_method_response" "repayments_options_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.repayments.id
  http_method = aws_api_gateway_method.repayments_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "repayments_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.repayments.id
  http_method = aws_api_gateway_method.repayments_options.http_method
  status_code = aws_api_gateway_method_response.repayments_options_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_method_response.repayments_options_200]
}

resource "aws_api_gateway_method" "loans_proxy_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.loans_proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "loans_proxy_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.loans_proxy.id
  http_method             = aws_api_gateway_method.loans_proxy_options.http_method
  type                    = "MOCK"
  request_templates       = {
    "application/json" = "{\"statusCode\": 200}"
  }
  passthrough_behavior    = "WHEN_NO_MATCH"
}

resource "aws_api_gateway_method_response" "loans_proxy_options_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.loans_proxy.id
  http_method = aws_api_gateway_method.loans_proxy_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "loans_proxy_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.loans_proxy.id
  http_method = aws_api_gateway_method.loans_proxy_options.http_method
  status_code = aws_api_gateway_method_response.loans_proxy_options_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_method_response.loans_proxy_options_200]
}

resource "aws_api_gateway_method" "repayments_proxy_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.repayments_proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "repayments_proxy_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.repayments_proxy.id
  http_method             = aws_api_gateway_method.repayments_proxy_options.http_method
  type                    = "MOCK"
  request_templates       = {
    "application/json" = "{\"statusCode\": 200}"
  }
  passthrough_behavior    = "WHEN_NO_MATCH"
}

resource "aws_api_gateway_method_response" "repayments_proxy_options_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.repayments_proxy.id
  http_method = aws_api_gateway_method.repayments_proxy_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "repayments_proxy_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.repayments_proxy.id
  http_method = aws_api_gateway_method.repayments_proxy_options.http_method
  status_code = aws_api_gateway_method_response.repayments_proxy_options_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_method_response.repayments_proxy_options_200]
}

# Lambda Integrations
resource "aws_api_gateway_integration" "loans_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.loans.id
  http_method             = aws_api_gateway_method.loans_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.loans_handler.invoke_arn
}

resource "aws_api_gateway_integration" "repayments_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.repayments.id
  http_method             = aws_api_gateway_method.repayments_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.repayments_handler.invoke_arn
}

resource "aws_api_gateway_integration" "loans_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.loans_proxy.id
  http_method             = aws_api_gateway_method.loans_proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.loans_handler.invoke_arn
}

resource "aws_api_gateway_integration" "repayments_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.repayments_proxy.id
  http_method             = aws_api_gateway_method.repayments_proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.repayments_handler.invoke_arn
}

# Lambda Permissions
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