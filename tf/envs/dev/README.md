# Deploying common-app-api

In general, you should use GitHub Actions to actually deploy, instead of
deploying locally. The local instructions are provided primarily to aid in
testing plans during dev and for troubleshooting.

## Overview

The `tf` folder is divided into `envs`.

Each environment has a folder in `envs`. For example, the `dev` folder houses
code for the `dev` environment.

## Local setup

### AWS Setup

First set up an AWS SSO profile for the `FAN Apps` account using:

```sh
aws configure sso --profile fan-apps-admin
```

Then, once per session, you'll run the following to login and cache credentials:

```sh
aws sso login --profile fan-apps-admin
```

### Working in environments

The first time you work in an environment, you'll need to `init`:

```sh
cd tf/envs/dev # or whatever env
terraform init
```

To run terraform commands such as `plan` and `apply`, set the AWS profile:

```sh
AWS_PROFILE=fan-apps-admin terraform plan
```
