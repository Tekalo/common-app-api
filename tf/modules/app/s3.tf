resource "aws_s3_bucket" "upload_files" {
    bucket = "capp-${var.env}-api-uploads"
}

resource "aws_s3_bucket_lifecycle_configuration" "upload_files_lifecycle" {
  bucket = aws_s3_bucket.upload_files.id
  rule {
    id     = "default-to-intelligent-tiering"
    status = "Enabled"

    transition {
        storage_class = "INTELLIGENT_TIERING"
    }
  }
  rule {
    id     = "abort-incomplete-multipart-uploads"
    abort_incomplete_multipart_upload {
      days_after_initiation = 5
    }
    status = "Enabled"
  }
}

// add s3 permissions to task role
resource "aws_iam_role_policy" "s3_policy" {
  name   = "s3-policy"
  role   = aws_iam_role.ecs_task_role.id
  policy = data.aws_iam_policy_document.task_s3_policy.json
}

data "aws_iam_policy_document" "task_s3_policy" {
  statement {
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:AbortMultipartUpload",
      "s3:ListMultipartUploadParts",
      "s3:ListBucketMultipartUploads"
    ]
    resources = [
      aws_s3_bucket.upload_files.arn,
      "${aws_s3_bucket.upload_files.arn}/*"
    ]
  }
}

resource "aws_s3_bucket_versioning" "upload_files_versioning" {
  bucket = aws_s3_bucket.upload_files.id
  versioning_configuration {
    status = "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "upload_files_encryption" {
  bucket = aws_s3_bucket.upload_files.id

  rule {
    bucket_key_enabled = false

    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

// cloudtrail for events in s3 upload bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "capp-${var.env}-cloudtrail"
}
resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_lifecycle" {
  bucket   = aws_s3_bucket.cloudtrail.id
  rule {
    id     = "update-storage-tier"
    status = "Enabled"
    expiration {
      days   = 365
    }
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
resource "aws_s3_bucket_policy" "cloudtrail_access" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = data.aws_iam_policy_document.cloudtrail_access.json
}

data "aws_iam_policy_document" "cloudtrail_access" {
  statement {
    principals {
      type = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["s3:GetBucktAcl","s3:PutObject"]

    resources = [
      aws_s3_bucket.cloudtrail_access.arn,
      "${aws_s3_bucket.cloudtrail_access.arn}/*"
    ]
  }
}
resource "aws_cloudtrail" "upload_files_bucket_trail" {
  name  = "UploadFilesBucketTrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.id
  s3_key_prefix = "s3/${aws_s3_bucket.upload_files.id}"
  include_global_service_events = false

  event_selector {
    read_write_type = "All"
    include_management_events = true

    data_resource {
      type = "AWS::S3::Object"
      values = ["${aws_s3_bucket.upload_files.arn}/"]
    }
  }
}