# LoanSyncro Infrastructure as Code (IaC)

This document provides an overview of the infrastructure implementation for the LoanSyncro project using Terraform as Infrastructure as Code (IaC).

## 📁 Infrastructure Directory Structure

The infrastructure is organized into the following files:

- `main.tf` - Core Terraform configuration, provider settings, and backend configuration
- `variables.tf` - Variable definitions, validations, and local values
- `security.tf` - Security components including KMS keys and IAM roles/policies
- `storage.tf` - Data storage resources like DynamoDB tables and S3 buckets
- `compute.tf` - Lambda functions for serverless backend implementation
- `api_gateway.tf` - API Gateway configuration for RESTful endpoints
- `cognito.tf` - User authentication and management through AWS Cognito
- `monitoring.tf` - CloudWatch logs, alarms, and SNS notifications
- `amplify.tf` - Frontend deployment configuration using AWS Amplify
- `output.tf` - Output values that can be referenced after deployment

## 🔍 Infrastructure Components Detail

### Core Configuration (main.tf)

The `main.tf` file establishes the Terraform configuration including:

- Provider specifications (AWS, Archive, Random)
- Terraform version requirements
- S3 backend for state management
- AWS region configuration
- Default resource tagging strategy
- Random string generation for unique resource naming

### Variables and Naming (variables.tf)

The `variables.tf` file defines:

- Environment variables (dev, staging, prod) with validation
- AWS region selection
- Project naming conventions
- Standard resource naming prefix using `local.name_prefix`
- Common tags applied to all resources
- Configuration for Lambda functions and log retention

### Security Implementation (security.tf)

Security measures include:

- KMS key for encryption at rest with key rotation
- IAM roles for Lambda execution
- Comprehensive IAM policies with least-privilege permissions for:
  - DynamoDB access
  - S3 object management
  - KMS key usage
  - Cognito user operations
  - CloudWatch logging
  - SNS notification publishing

### Data Storage (storage.tf)

The storage layer includes:

- DynamoDB tables with indexes:
  - `users` table with email-index
  - `loans` table with user-id-index
  - `repayments` table with loan-id-index
- S3 bucket for file storage with:
  - Versioning enabled
  - Server-side encryption using KMS
  - Public access blocked
  - Lifecycle policies for cost optimization

### Serverless Compute (compute.tf)

The application logic is implemented as:

- Lambda functions packaged from Python code:
  - Authentication handler
  - Loans management handler
  - Repayments handler
- Environment variables for configuration
- Resource-based permissions for API Gateway invocation

### API Layer (api_gateway.tf)

The API Gateway configuration includes:

- RESTful API definition
- Resource paths for different endpoints
- Methods for HTTP verbs
- Integration with Lambda functions
- CORS configuration
- Cognito authorizer for authentication
- Deployment and stage management

### User Authentication (cognito.tf)

User management is handled by:

- Cognito User Pool with secure password policies
- Email verification setup
- Custom attributes for user data
- Account recovery settings
- User pool client configuration
- Identity provider settings

### Monitoring and Alerting (monitoring.tf)

Operational visibility is provided by:

- CloudWatch Log Groups for each Lambda function
- Log retention policies
- SNS Topic for alerts
- CloudWatch Alarms for error monitoring
- Performance metrics tracking

### Frontend Hosting (amplify.tf)

The frontend application is deployed via:

- AWS Amplify application configuration
- GitHub repository integration
- Environment variables for frontend configuration
- Custom domain association (optional)
- Branch deployment settings

### Deployment Outputs (output.tf)

Important information is exported as:

- API Gateway endpoint URL
- DynamoDB table names
- S3 bucket name
- Lambda function references
- Cognito user pool IDs
- Amplify application URL

## 🔐 Security Features

The infrastructure implements multiple security best practices:

- Encryption at rest for all data stores using KMS
- IAM roles following least privilege principle
- Cognito user pool with strong password policies
- API Gateway with proper authorization
- CloudWatch monitoring for security events
- Public access blocking for S3
- Secure environment variable handling

## 💰 Cost Optimization

Cost efficiency is achieved through:

- Pay-per-request pricing for DynamoDB
- Serverless compute with Lambda
- S3 lifecycle policies for tiered storage
- CloudWatch log retention policies
- Right-sizing of Lambda functions

## 🚀 Deployment Instructions

To deploy this infrastructure:

1. **Ensure AWS CLI is configured**

   ```bash
   aws configure
   ```

2. **Initialize Terraform**

   ```bash
   cd infrastructure
   terraform init
   ```

3. **Review the deployment plan**

   ```bash
   terraform plan
   ```

4. **Apply the configuration**

   ```bash
   terraform apply
   ```

5. **Access deployment outputs**

   ```bash
   terraform output
   ```

6. **To remove all resources**
   ```bash
   terraform destroy
   ```

## 📊 Architecture Benefits

This infrastructure design provides:

1. Scalability: Serverless architecture scales automatically with demand
2. Reliability: Managed services with high availability
3. Security: Comprehensive encryption and access controls
4. Cost Efficiency: Pay-as-you-go pricing model
5. Operational Excellence: Monitoring, logging, and alerting
6. Developer Velocity: Infrastructure as code enables rapid iteration

## The infrastructure follows all six pillars of the AWS Well-Architected Framework:

1. Operational Excellence
2. Security
3. Reliability
4. Performance Efficiency
5. Cost Optimization
6. Sustainability
