terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# AWS Provider Configuration
provider "aws" {
  region = var.aws_region
  
  # Default tags for all resources (Cost Optimization + Operational Excellence)
  default_tags {
    tags = {
      Project     = "LoanSyncro"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "LoanSyncro-Team"
    }
  }
}

# Random suffix for unique resource naming
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Current AWS account and region data
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
