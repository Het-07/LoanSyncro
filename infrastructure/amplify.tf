# Data source to retrieve GitHub token from SSM Parameter Store
data "aws_ssm_parameter" "github_token" {
  name = "/loansyncro/github-token"
}

# Amplify App
resource "aws_amplify_app" "main" {
  name       = "${local.name_prefix}-frontend"
  repository = var.github_repository_url

  # GitHub access token from SSM Parameter Store
  access_token = data.aws_ssm_parameter.github_token.value

  # Build settings
  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - cd frontend
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: frontend/dist
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
  EOT

  # Environment variables for frontend
  environment_variables = {
    VITE_API_URL                     = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
    VITE_AWS_REGION                  = var.aws_region
    VITE_COGNITO_USER_POOL_ID        = aws_cognito_user_pool.main.id
    VITE_COGNITO_USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.main.id
    VITE_COGNITO_IDENTITY_POOL_ID    = aws_cognito_identity_pool.main.id
    VITE_S3_BUCKET                   = aws_s3_bucket.storage.bucket
    VITE_ENVIRONMENT                 = var.environment
  }

  # Custom rules for SPA routing
  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-amplify-app"
    Service = "Frontend"
  })
}

# Amplify Branch
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.main.id
  branch_name = var.github_branch
  framework   = "React"
  stage       = "DEVELOPMENT"

  # Environment variables specific to this branch
  environment_variables = {
    AMPLIFY_DIFF_DEPLOY       = "false"
    AMPLIFY_MONOREPO_APP_ROOT = "frontend"
  }

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-amplify-branch"
    Branch = var.github_branch
  })
}

# Amplify Domain (optional - for custom domain)
resource "aws_amplify_domain_association" "main" {
  count       = var.custom_domain != "" ? 1 : 0
  app_id      = aws_amplify_app.main.id
  domain_name = var.custom_domain

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = var.environment == "prod" ? "" : var.environment
  }
}
