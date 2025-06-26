# Cognito User Pool - FIXED: Enable email verification
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
  username_attributes = ["email"]
  
  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }

  schema {
    attribute_data_type = "String"
    name                = "name"
    required            = true
    mutable             = true
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # FIXED: Email configuration for verification emails
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # FIXED: Auto-verified attributes
  auto_verified_attributes = ["email"]

  # FIXED: Email verification settings
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "LoanSyncro - Verify your email"
    email_message        = "Welcome to LoanSyncro! Your verification code is {####}"
  }

  # FIXED: User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "OFF"  # Set to AUDIT or ENFORCED for production
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-user-pool"
    Service = "Authentication"
  })
}

# Cognito User Pool Client - FIXED: Better configuration
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

  # CORS settings
  supported_identity_providers = ["COGNITO"]
  
  callback_urls = [
    "http://localhost:3000",
    "https://${local.name_prefix}.amplifyapp.com",
    "https://main.${aws_amplify_app.main.default_domain}"
  ]
  
  logout_urls = [
    "http://localhost:3000",
    "https://${local.name_prefix}.amplifyapp.com",
    "https://main.${aws_amplify_app.main.default_domain}"
  ]

  # FIXED: Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"
}

# Cognito Identity Pool
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${local.name_prefix}-identity"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.main.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-identity-pool"
    Service = "Authentication"
  })
}
