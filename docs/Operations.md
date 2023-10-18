# Operations

Monitoring of the Tekalo API is configured in [Sentry](https://schmidt-futures.sentry.io/issues/?project=4504963428777984) and [AWS CloudWatch](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards/dashboard/capp-api-prod).
Alarms have been set up to detect anomalous behavior and will trigger alerts in [PagerDuty](https://schmidtfutures.pagerduty.com/incidents).

CloudWatch alarms are configured in [terraform](tf/modules/app/alarms.tf), while Sentry alarms are configured manually in the Sentry console.

[Hightouch](https://app.hightouch.com/common-app/extensions/alerting/configuration) syncs are also configured to alert through PagerDuty on sync error.
