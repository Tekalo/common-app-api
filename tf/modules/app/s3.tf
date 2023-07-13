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
    actions   = [
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

    policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AWSCloudTrailAclCheck",
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:GetBucketAcl",
            "Resource": "arn:aws:s3:::capp-${var.env}-cloudtrail"
        },
        {
            "Sid": "AWSCloudTrailWrite",
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::capp-${var.env}-cloudtrail/*",
            "Condition": {
                "StringEquals": {
                    "s3:x-amz-acl": "bucket-owner-full-control"
                }
            }
        },
    ]
}
POLICY
}
resource "aws_cloudtrail" "upload_files_bucket_trail" {
  name  = "UploadFilesBucketTrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail
  s3_key_prefix = "s3"
  include_global_service_events = false

  event_selector {
    read_write_type = "All"
    include_management_events = true

    data_resource {
      type = "AWS::S3::Object"
      values = ["${data.aws_s3_bucket.upload_files.arn}/"]
    }
  }

}

