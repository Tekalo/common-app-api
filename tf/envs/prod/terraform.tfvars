env                       = "prod"
api_port                  = 3000
auth0_zone_id             = "Z0605058LTYGQT7UPGFT" // prod-ext.apps.futurestech.cloud
auth0_domain_cname        = "auth.tekalo.org"      // this is irrelevant in prod, as auth DNS records are managed in cloudflare
sentry_dsn                = "https://c38ab9f98fd0404f9d2bfb95d015da8d@o4504962952724480.ingest.sentry.io/4504963428777984"
web_url                   = "https://tekalo.org"
pagerduty_integration_url = "https://events.pagerduty.com/integration/6a0982f555134505c043a4354d923276/enqueue"
notify_webhook            = "https://hooks.slack.com/services/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"

email_from_address       = "info@updates.tekalo.org"
reply_to_address         = "support@tekalo.org"
auth0_from_email_address = "support@tekalo.org"
alarms_enabled           = true

uploads_cors_allowed_origins = ["https://*.tekalo.org"]
