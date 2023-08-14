// cloudtrail for events in s3 upload bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "capp-${var.env}-cloudtrail"
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_lifecycle" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    id     = "update-storage-tier"
    status = "Enabled"
    expiration {
      days = 365
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
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["s3:GetBucketAcl", "s3:PutObjectAcl", "s3:GetObject"]

    resources = [
      aws_s3_bucket.cloudtrail.arn,
      "${aws_s3_bucket.cloudtrail.arn}/*"
    ]
  }
  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["s3:PutObject"]

    resources = [
      aws_s3_bucket.cloudtrail.arn,
      "${aws_s3_bucket.cloudtrail.arn}/*"
    ]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}
resource "aws_cloudtrail" "upload_files_bucket_trail" {
  name                          = "UploadFilesBucketTrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  s3_key_prefix                 = "s3/${module.app.upload_files_bucket.name}"
  include_global_service_events = false

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${module.app.upload_files_bucket.arn}/"]
    }
  }
  depends_on = [aws_s3_bucket_policy.cloudtrail_access]
}