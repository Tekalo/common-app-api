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
    id = "abort-incomplete-multipart-uploads"
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
      "s3:ListBucketMultipartUploads",
      "s3:DeleteObject",
      "s3:ListBucket",
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

resource "aws_s3_bucket_cors_configuration" "upload" {
  count  = var.uploads_cors_allowed_origins == null ? 0 : 1
  bucket = aws_s3_bucket.upload_files.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST"]
    allowed_origins = var.uploads_cors_allowed_origins
    expose_headers  = ["ETag", "Content-Type", "Content-Length"]
  }

  cors_rule {
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
  }
}


output "upload_files_bucket" {
  value = {
    name = aws_s3_bucket.upload_files.id
    arn  = aws_s3_bucket.upload_files.arn
  }
}
