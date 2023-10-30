# Infrastructure

![Tekalo Infrastructure](./media/tekalo_api_infrastructure.png)

## AWS

The infrastructure for all three Tekalo API environments (dev, staging, prod) is deployed to AWS. The diagram above reflects the infra for each of the environments. The major differences between the environments are that alerts are not enabled for the dev and staging environments and the default number of api tasks is higher for production. Dev and staging are deployed to the same AWS account, while prod is isolated in its own AWS account. One peculiarity to note is that the prod cluster is deployed as `prod-ext` while dev and staging are just `dev` and `staging`. This is to differentiate it from the `prod` cluster deployed in the dev / staging aws account.

## Configuration

We use infrastructure as code (IaC) to configure the infrastructure of the Tekalo API, and avoid making manual edits in the AWS console as much as possible. Most of the infrastructure configuration is in the form of terraform code, and can be found in [the terraform directory](../tf) in this repo. The configuration for the ECS cluster, the vpc, and other related infrastructure is configured using CloudFormation, and can be found in the [aws-infrastructure](https://github.com/schmidtfutures/aws-infrastructure/tree/main/fan-prod-external) repository.

## DNS

The domain name is in AWS Route53 and the SSL cert can be found in AWS Certificate manager. Both of these are configured in the aws-infrastructure repo.

## Application containers and load balancer

The API application runs in an ECS cluster. There is currently one EC2 instance deployed to the cluster. Autoscaling is configured for the cluster and nodes will be added when capacity reaches 100%. The cluster hosts two services on its EC2 instances. The `capp-api` service consists of tasks that contain the API code. This service is also configured to auto-scale based on CPU and Memory usage metrics.

## Container images

When code is merged into the `main` branch a build and deploy is triggered through github actions. A new container image is built and pushed to an AWS ECR repository in the dev account. This image will then be deployed to the `capp-api` cluster, starting with dev. The same image is used for all three environments. For prod deployment, the image is copied from the dev-account ECR repository to a prod-account ECR repository.

## Database

An Aurora Serverless v2 PostgreSQL RDS cluster supports the API. Credentials for the database are stored in Secrets Manager and are accessed and set in the task container at deploy time. At the time of container startup, the [docker container](../Dockerfile) will [process the secret json](../scripts/ensure-db-url.sh) and ensure that the db connection string is properly set in the environment.

Automatic rotation of the database password has been configured. The API tasks [will shut down if a database authentication error is detected](https://github.com/schmidtfutures/common-app-api/blob/main/src/resources/client.ts#L24-L28), allowing new tasks to be started with the new password.

There is currently only one database instance in the cluster, though it would probably make sense to deploy a replica to prevent downtime if there is a database failure.

## Storage

Applicant resumés are stored in S3. The API generates a [presigned S3 upload URL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html) upon client request and generates a [presigned URL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html) to retrieve the resume for logged-in users with sufficient permissions. The S3 bucket has been configured with intelligent tiering to reduce storage costs.

## Email

Emails to applicants are triggered at different stages of the application and are sent by the API via AWS Simple Email Service (SES). Emails sent on behalf of the application by Auth0 are also handled by SES.

It's important not to let the SES bounce rate get too high; if the configured domain sends a lot of email to bad email addresses it will get a reputation as a spam domain and will be blocked by email providers. AWS will preemptively block accounts with high bounce rates from sending emails until the problem has been mitigated. For this reason an email whitelist has been implemented for the dev and staging environments. Only emails with addresses on the whitelist will be sent. The whitelist is configured in the [terraform.tfvars](../tf/envs/staging/terraform.tfvars) as `ses_whitelist` for each environment. It is then injected as the environment variable `AWS_SES_WHITELIST`.

## Logs

Each API tasks outputs logs to [CloudWatch](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/CAPP$252Fprod$252FApi). Additionally, Auth0 logs are imported into [CloudWatch](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Faws$252Fevents$252Fauth0-tekalo-prod) to extend their retention period and make them easier to search. Another potentially useful log in CloudWatch are those related to the [password rotation function](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252Fcapp-prod-rds-postgres-rotator-func).

## Metrics, dashboards, and alarms

CloudWatch collects metrics on all of the infrastructure we run in AWS. There is a [dashboard](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards/dashboard/capp-api-prod) that can give an overview of the overall health of the API infrastructure.

[Alarms](<https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:?~(search~'capp-prod)>) have also been configured for most of the pieces of infrastructure supporting the API. These will trigger alerts in PagerDuty if the alarm thresholds are exceeded.
