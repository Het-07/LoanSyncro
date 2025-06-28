# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-users"

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # User attributes
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = "Your verification code is {####}. Please use this code to confirm your LoanSyncro account."
    email_subject        = "Your LoanSyncro Verification Code"
  }

  schema {
    attribute_data_type = "String"
    name                = "custom:isInitialized"
    required            = false
    mutable             = true
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Add custom attributes for user_id if needed
  schema {
    attribute_data_type = "String"
    name                = "custom:user_id"
    required            = false
    mutable             = true
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-user-pool"
    Service = "Authentication"
  })
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name         = "${local.name_prefix}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  # Token validity
  access_token_validity  = 24
  id_token_validity      = 24
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Enable OAuth flows for API Gateway authorizer
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["phone", "email", "openid", "profile", "aws.cognito.signin.user.admin"]
  supported_identity_providers         = ["COGNITO"]
  
  # Update callback and logout URLs to match Amplify domain
  callback_urls = [
    "http://localhost:3000/",
    "https://${local.name_prefix}.amplifyapp.com/",
    "https://${var.custom_domain}/" # Include custom domain if set
  ]
  
  logout_urls = [
    "http://localhost:3000/",
    "https://${local.name_prefix}.amplifyapp.com/",
    "https://${var.custom_domain}/" # Include custom domain if set
  ]

  # Ensure tokens include custom attributes
  read_attributes = ["email", "name", "custom:user_id"]
  write_attributes = ["email", "name", "custom:user_id"]

  depends_on = [aws_cognito_user_pool.main]
}

# Cognito User Pool Domain (optional, for Hosted UI)
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.name_prefix}-domain"
  user_pool_id = aws_cognito_user_pool.main.id
}