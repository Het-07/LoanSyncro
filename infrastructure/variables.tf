variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "loansyncro"
}

# Local values for consistent naming
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Project     = "LoanSyncro"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

variable "github_repository_url" {
  description = "GitHub repository URL for Amplify"
  type        = string
  default     = "https://github.com/yourusername/loansyncro"
}

variable "github_branch" {
  description = "GitHub branch for Amplify deployment"
  type        = string
  default     = "main"
}

variable "custom_domain" {
  description = "Custom domain for Amplify (optional)"
  type        = string
  default     = ""
}

# Environment-specific configurations
variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 128
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}
