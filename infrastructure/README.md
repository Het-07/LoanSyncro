# 🏗️ LoanSyncro Infrastructure

Complete Infrastructure as Code (IaC) implementation using Terraform for deploying a serverless loan management system on AWS.

## 🎯 Overview

This infrastructure creates a fully serverless, secure, and scalable personal loan management system leveraging AWS cloud services. The architecture follows AWS best practices for security, cost optimization, and operational excellence.

## 🏛️ Architecture Components

### 🔧 Core AWS Services

| Service            | Purpose                                 | Configuration                             |
| ------------------ | --------------------------------------- | ----------------------------------------- |
| **🗄️ DynamoDB**    | NoSQL database for loans and repayments | On-demand billing, point-in-time recovery |
| **🔐 Cognito**     | User authentication and authorization   | User pools with email verification        |
| **⚡ Lambda**      | Serverless API backend                  | Python 3.9, 128MB memory, 30s timeout     |
| **🌐 API Gateway** | RESTful API endpoints                   | CORS enabled, JWT authorizer              |
| **🚀 Amplify**     | Frontend hosting and CI/CD              | GitHub integration, custom domain         |
| **📧 SNS**         | Email notifications                     | Topics for loan and payment alerts        |
| **📊 CloudWatch**  | Monitoring and logging                  | 14-day retention, custom alarms           |
| **🔒 KMS**         | Encryption key management               | Customer-managed keys with rotation       |
| **💾 S3**          | Static file storage                     | Versioning, lifecycle policies            |

## 📁 Infrastructure Files

```
infrastructure/
├── 📄 main.tf              # Core Terraform configuration
├── 📄 variables.tf         # Variable definitions and validation
├── 📄 terraform.tfvars     # Configuration values
├── 📄 security.tf          # IAM roles, policies, and KMS
├── 📄 storage.tf           # DynamoDB tables and S3 buckets
├── 📄 compute.tf           # Lambda functions
├── 📄 api_gateway.tf       # API Gateway configuration
├── 📄 cognito.tf           # User authentication
├── 📄 monitoring.tf        # CloudWatch and SNS
├── 📄 amplify.tf           # Frontend deployment
├── 📄 output.tf            # Output values
├── 📄 lambda_function.py   # Lambda function code
└── 📂 lambda_packages/     # Lambda dependencies
    └── requirements.txt
```

## 🚀 Quick Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.0 installed
- GitHub personal access token (for Amplify)

### 1. Configure Variables

Edit `terraform.tfvars`:

```hcl
# Basic Configuration
aws_region   = "us-east-1"
environment  = "dev"
project_name = "loansyncro"

# GitHub Configuration (for Amplify)
github_repository_url = "https://github.com/your-username/LoanSyncro"
github_branch        = "main"

# Notification Configuration
notification_email = "your-email@example.com"

# Performance Configuration
lambda_timeout       = 30
lambda_memory_size   = 128
log_retention_days   = 14
```

### 2. Set GitHub Token

Store your GitHub personal access token in AWS SSM Parameter Store:

```bash
aws ssm put-parameter \
  --name "/loansyncro/github-token" \
  --value "your-github-token" \
  --type "SecureString" \
  --region us-east-1
```

### 3. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply changes
terraform apply
```

### 4. Verify Deployment

```bash
# Check outputs
terraform output

# Test API endpoint
curl $(terraform output -raw api_gateway_url)/health
```

## 🔧 Detailed Component Configuration

### 🗄️ DynamoDB Tables

#### Loans Table

```hcl
resource "aws_dynamodb_table" "loans" {
  name           = "${local.name_prefix}-loans"
  billing_mode   = "ON_DEMAND"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name     = "user-id-index"
    hash_key = "user_id"
  }

  point_in_time_recovery {
    enabled = true
  }
}
```

#### Repayments Table

```hcl
resource "aws_dynamodb_table" "repayments" {
  name           = "${local.name_prefix}-repayments"
  billing_mode   = "ON_DEMAND"
  hash_key       = "id"

  global_secondary_index {
    name     = "loan-id-index"
    hash_key = "loan_id"
  }
}
```

### ⚡ Lambda Functions

#### API Handler Configuration

```hcl
resource "aws_lambda_function" "api" {
  filename         = "lambda_function.zip"
  function_name    = "${local.name_prefix}-api"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda_function.handler"
  runtime         = "python3.9"
  memory_size     = var.lambda_memory_size
  timeout         = var.lambda_timeout

  environment {
    variables = {
      DYNAMODB_LOANS_TABLE      = aws_dynamodb_table.loans.name
      DYNAMODB_REPAYMENTS_TABLE = aws_dynamodb_table.repayments.name
      COGNITO_USER_POOL_ID      = aws_cognito_user_pool.main.id
      SNS_TOPIC_ARN            = aws_sns_topic.notifications.arn
    }
  }
}
```

### 🌐 API Gateway

#### REST API Configuration

```hcl
resource "aws_api_gateway_rest_api" "main" {
  name = "${local.name_prefix}-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# CORS Configuration
resource "aws_api_gateway_method" "options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
```

### 🔐 Cognito User Pool

#### Authentication Configuration

```hcl
resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-users"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  auto_verified_attributes = ["email"]

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}
```

### 🚀 AWS Amplify

#### Frontend Deployment

```hcl
resource "aws_amplify_app" "main" {
  name       = "${local.name_prefix}-frontend"
  repository = var.github_repository_url

  access_token = data.aws_ssm_parameter.github_token.value

  environment_variables = {
    VITE_API_URL                     = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
    VITE_AWS_REGION                  = var.aws_region
    VITE_COGNITO_USER_POOL_ID        = aws_cognito_user_pool.main.id
    VITE_COGNITO_USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.main.id
    VITE_S3_BUCKET                   = aws_s3_bucket.storage.bucket
  }
}
```

## 🔒 Security Implementation

### 🛡️ IAM Roles and Policies

#### Lambda Execution Role

```hcl
resource "aws_iam_role" "lambda_execution" {
  name = "${local.name_prefix}-lambda-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}
```

#### DynamoDB Access Policy

```hcl
resource "aws_iam_policy" "lambda_dynamodb" {
  name = "${local.name_prefix}-lambda-dynamodb"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.loans.arn,
          aws_dynamodb_table.repayments.arn,
          "${aws_dynamodb_table.loans.arn}/index/*",
          "${aws_dynamodb_table.repayments.arn}/index/*"
        ]
      }
    ]
  })
}
```

### 🔐 KMS Encryption

#### Customer-Managed Key

```hcl
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
}
```

## 📊 Monitoring & Observability

### 📈 CloudWatch Alarms

#### Lambda Error Rate Alarm

```hcl
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.name_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This alarm monitors lambda errors"

  dimensions = {
    FunctionName = aws_lambda_function.api.function_name
  }

  alarm_actions = [aws_sns_topic.notifications.arn]
}
```

#### API Gateway 4XX Errors

```hcl
resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "${local.name_prefix}-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }
}
```

### 📧 SNS Notifications

#### Email Notifications

```hcl
resource "aws_sns_topic" "notifications" {
  name = "${local.name_prefix}-notifications"

  kms_master_key_id = aws_kms_key.main.id
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
    paths: ["infrastructure/**"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Terraform Apply
        run: |
          cd infrastructure
          terraform init
          terraform plan
          terraform apply -auto-approve
```

## 📋 Environment Management

### Multiple Environments

Configure different environments by modifying `terraform.tfvars`:

#### Development

```hcl
environment = "dev"
lambda_memory_size = 128
log_retention_days = 7
```

#### Production

```hcl
environment = "prod"
lambda_memory_size = 256
log_retention_days = 30
```

### Terraform Workspaces

```bash
# Create workspace
terraform workspace new production

# Switch workspace
terraform workspace select production

# List workspaces
terraform workspace list
```

## 💰 Cost Optimization

### 📊 Cost Breakdown

| Service              | Estimated Monthly Cost |
| -------------------- | ---------------------- |
| DynamoDB (On-demand) | $5-15                  |
| Lambda               | $0-5                   |
| API Gateway          | $3-10                  |
| Cognito              | $0-5                   |
| Amplify              | $0-5                   |
| CloudWatch           | $2-8                   |
| **Total**            | **$10-48**             |

### 💡 Cost Optimization Tips

- Use DynamoDB on-demand pricing for variable workloads
- Implement Lambda reserved concurrency for predictable loads
- Enable CloudWatch log retention policies
- Use S3 lifecycle policies for log archival

## 🧪 Testing Infrastructure

### Terraform Validation

```bash
# Format code
terraform fmt

# Validate configuration
terraform validate

# Plan with detailed output
terraform plan -detailed-exitcode
```

### Integration Testing

```bash
# Test API endpoints
curl -X GET $(terraform output -raw api_gateway_url)/health

# Test authentication
curl -X POST $(terraform output -raw api_gateway_url)/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

## 🔧 Troubleshooting

### Common Issues

**Terraform State Lock**

```bash
# Force unlock (use with caution)
terraform force-unlock LOCK_ID
```

**Lambda Function Updates**

```bash
# Force function update
terraform taint aws_lambda_function.api
terraform apply
```

**DynamoDB Throttling**

- Check CloudWatch metrics for throttling
- Consider switching to provisioned billing
- Implement exponential backoff in application

**API Gateway CORS Issues**

- Verify OPTIONS method configuration
- Check Access-Control-Allow-\* headers
- Test with browser developer tools

## 📚 Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Serverless Application Lens](https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)

## 🔍 Output Values

After deployment, access these values:

```bash
# API Gateway URL
terraform output api_gateway_url

# Cognito User Pool ID
terraform output cognito_user_pool_id

# S3 Bucket Name
terraform output s3_bucket_name
```

---

<div align="center">

**🏗️ Infrastructure as Code with Terraform and AWS**

[⬅️ Back to Main README](../README.md)

</div>

- `main.tf` - Core Terraform configuration and providers
- `variables.tf` - All variables and local values
- `security.tf` - KMS encryption, IAM roles, and security policies
- `storage.tf` - DynamoDB tables and S3 buckets
- `compute.tf` - Lambda functions for serverless compute
- `api.tf` - API Gateway configuration and integrations
- `monitoring.tf` - CloudWatch logs, alarms, and SNS alerts
- `outputs.tf` - Important values for other configurations
- `terraform.tfvars` - Configuration values
- `lambda_function.py` - Lambda function handlers

## 🚀 Quick Start

1. **Setup AWS credentials:**
   \`\`\`bash
   aws configure
   \`\`\`

2. **Deploy infrastructure:**
   \`\`\`bash
   cd infrastructure
   terraform init
   terraform plan
   terraform apply
   \`\`\`

3. **Get API Gateway URL:**
   \`\`\`bash
   terraform output api_gateway_url
   \`\`\`

## 🏗️ AWS Well-Architected Framework

This infrastructure follows all 6 pillars:

- ✅ Operational Excellence
- ✅ Security
- ✅ Reliability
- ✅ Performance Efficiency
- ✅ Cost Optimization
- ✅ Sustainability
