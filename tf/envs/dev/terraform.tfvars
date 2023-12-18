env        = "dev"
bucket_env = "v2-dev"
api_port   = 3000
# auth0_zone_id      = "Z0150227JNC4929IY5CS" // dev.tekalo.io
auth0_zone_id      = "Z09985871SF4O7XALKHWP" // v2-dev.tekalo.io
auth0_domain_cname = "sf-capp-dev-cd-qvqebidgqn1u3sh5.edge.tenants.us.auth0.com"
sentry_dsn         = "https://c38ab9f98fd0404f9d2bfb95d015da8d@o4504962952724480.ingest.sentry.io/4504963428777984"
web_url            = "https://head.common-app-frontend.pages.dev"

email_from_address       = "tekalo@v2-dev.tekalo.io"
reply_to_address         = "tekalo@v2-dev.tekalo.io"
auth0_from_email_address = "futuresengine-auth0@v2-dev.tekalo.io"
ses_whitelist            = "nnikkhoui@schmidtfutures.com,acook@schmidtfutures.com,aarmentrout@schmidtfutures.com,cwegrzyn@schmidtfutures.com,cgong@schmidtfutures.com,eperakis@schmidtfutures.com,lgittelson@schmidtfutures.com,smartin@schmidtfutures.com,thawkins@schmidtfutures.com"

uploads_cors_allowed_origins = ["*"]

image     = "132037611417.dkr.ecr.us-east-1.amazonaws.com/capp/api:e0e4a41"
cli_image = "132037611417.dkr.ecr.us-east-1.amazonaws.com/capp/api:e0e4a41"
