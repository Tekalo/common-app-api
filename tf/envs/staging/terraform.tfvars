env                = "staging"
bucket_env         = "v2-staging"
api_port           = 3000
auth0_zone_id      = "Z05018301MJBZ3G7FIXJG" // dev.tekalo.io, not used in staging as cname is created for dev and staging by dev config
auth0_domain_cname = "sf-capp-dev-cd-qvqebidgqn1u3sh5.edge.tenants.us.auth0.com"
sentry_dsn         = "https://c38ab9f98fd0404f9d2bfb95d015da8d@o4504962952724480.ingest.sentry.io/4504963428777984"
web_url            = "https://staging.common-app-frontend.pages.dev/"
email_from_address = "tekalo@staging.tekalo.io"
reply_to_address   = "tekalo@staging.tekalo.io"
ses_whitelist      = "nnikkhoui@schmidtfutures.com,acook@schmidtfutures.com,aarmentrout@schmidtfutures.com,cwegrzyn@schmidtfutures.com,cgong@schmidtfutures.com,eperakis@schmidtfutures.com,lgittelson@schmidtfutures.com,smartin@schmidtfutures.com,thawkins@schmidtfutures.com"


uploads_cors_allowed_origins = ["https://*.common-app-frontend.pages.dev"]
