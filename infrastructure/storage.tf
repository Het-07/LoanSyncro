# DynamoDB Table: Users
resource "aws_dynamodb_table" "users" {
  name           = "${local.name_prefix}-users"
  billing_mode   = "PAY_PER_REQUEST"  # Cost Optimization
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name     = "email-index"
    hash_key = "email"
  }

  # Security: Encryption at rest
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  # Reliability: Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name      = "${local.name_prefix}-users"
    DataType  = "UserData"
    Sensitive = "true"
  })
}

# DynamoDB Table: Loans
resource "aws_dynamodb_table" "loans" {
  name           = "${local.name_prefix}-loans"
  billing_mode   = "PAY_PER_REQUEST"
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

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name      = "${local.name_prefix}-loans"
    DataType  = "FinancialData"
    Sensitive = "true"
  })
}

# DynamoDB Table: Repayments
resource "aws_dynamodb_table" "repayments" {
  name           = "${local.name_prefix}-repayments"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "loan_id"
    type = "S"
  }

  global_secondary_index {
    name     = "loan-id-index"
    hash_key = "loan_id"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name      = "${local.name_prefix}-repayments"
    DataType  = "FinancialData"
    Sensitive = "true"
  })
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "storage" {
  bucket = "${local.name_prefix}-storage-${random_string.suffix.result}"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-storage"
    Purpose = "ApplicationStorage"
  })
}

# S3 Bucket configuration
resource "aws_s3_bucket_versioning" "storage" {
  bucket = aws_s3_bucket.storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "storage" {
  bucket = aws_s3_bucket.storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cost Optimization: Lifecycle policy
resource "aws_s3_bucket_lifecycle_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id

  rule {
    id     = "cost_optimization"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}
