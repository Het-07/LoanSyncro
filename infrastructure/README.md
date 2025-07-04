# LoanSyncro Infrastructure

This folder contains the Terraform configuration for deploying LoanSyncro to AWS.

## 📁 File Structure

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

## 💰 Cost Estimate

All resources are designed to fit within AWS Free Tier:

- DynamoDB: Pay-per-request (very low cost)
- Lambda: 1M free requests/month
- API Gateway: 1M free calls/month
- S3: 5GB free storage
- CloudWatch: Basic monitoring included

## 🔧 Configuration

Edit `terraform.tfvars` to customize:

- `aws_region` - AWS region for deployment
- `environment` - Environment name (dev/staging/prod)
- `project_name` - Project name for resource naming
