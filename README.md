# CommonApp

The Common App API is used to support Tekalo, a tool for matching tech talent to opportunities at non-profit, philanthropic, and government organizations. A diagram depicting the backend architecture can be found [here](./docs/media/tekalo_backend_architecture.png)

## Getting Started

### Prerequisites

- Docker: [Docker Desktop](https://docs.docker.com/desktop/) is recommended for all operating systems.
- [PNPM](https://pnpm.io/) We use pnpm, a more performant drop-in replacement for npm

### Setting up a dev environment

1\. To install dependencies run:

```bash
pnpm container-install
```

For why we use this instead of the default install command, see [important note on node_modules](#important-note-on-node_modules) below.

2\. Create a root level `.env` file, and in it put:

```bash
# Values for Auth0 client when running tests
AUTH0_CLIENT_SECRET={Auth0 Tenant Client Secret}
AUTH0_CLIENT_ID={Auth0 Tenant Client ID}
AUTH0_DOMAIN={Auth0 Tenant Domain}

# Values will be used to hit the actual Auth0 Service in dev/prod
AUTH0_AUDIENCE="auth0.capp.com"
AUTH0_ISSUER="https://auth.dev.tekalo.io"

AWS_SES_FROM_ADDRESS="tekalo@dev.apps.futurestech.cloud"
AWS_ACCESS_KEY_ID={AWS Access Key}
AWS_SECRET_ACCESS_KEY={AWS Secret Key}
AWS_SESSION_TOKEN={AWS Session Token}

# NOTE: Only set if you want to actually send events to Sentry
SENTRY_DSN="https://c38ab9f98fd0404f9d2bfb95d015da8d@o4504962952724480.ingest.sentry.io/4504963428777984"
UPLOAD_BUCKET="capp-dev-api-uploads"

# Create an account on https://lightcast.io/, and use the provided client ID and secret sent to your email.
LIGHTCAST_CLIENT_ID=""
LIGHTCAST_CLIENT_SECRET=""
```

The `AUTH0_` prefixed values should come from our dev Auth0 tenant and can be found [here](https://manage.auth0.com/dashboard/us/sf-capp-dev/applications/AzRVLnVmcru9u0hR5dl5VW84c21GLNEM/settings).

The `AWS_` prefixed values can be found when logging into the AWS Console under your specific user, under `Command line or programmatic access`

Note: `AWS_SES_FROM_ADDRESS` is used for sending emails from AWS Simple Email Service. The default value for local development is our dev service account email. Emails in the dev environment will only send to recipients with [verified emails](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html)

We use Docker for local development and testing. This ensures consistency in environments amongst all contributors. Our Docker environment consists of 2 containers: API and Postgres DB containers. The local dev dir is volume-mounted at `/api` into the container, so there is no need to rebuild the image for code or package changes.

> As a general rule, _all_ package.json scripts should be run _inside_ the development Docker container, not on the local host machine. To do so, you can execute: `docker compose run -u node --no-deps --rm api {your-command-here}`
> This will build a docker image of the API and then use it to install NPM packages.

We also make use of a `.env` file to hold local environment variables.

3\. Initialize the Prisma client

```bash
pnpm prisma:update
```

4\. Build the additional modules in the packages directory

```bash
pnpm container-build
```

### Running the dev server

Run the following command to launch the API (and a dev postgres instance) in Docker containers in dev mode:

```bash
docker-compose up
```

You can now access the API at <http://localhost:3000>. The API container uses `nodemon` and `swc` to hot-reload and re-build after saving any changes made to `.ts` files, while typechecking is done with `tsc`.

### Important note on node_modules

The node_modules directory is mounted into the container and all node commands should be run in the container. As far as possible, the pnpm scripts will use docker to run linting, beautification, build, etc in the container. **Never run `pnpm install` outside the container, as it could result in incorrect architecture packages being installed and logged to pnpm-lock. Use `pnpm container-install` instead, which runs the install in the container.**

To add new packages, you can use:

```sh
pnpm container-install -- args to pnpm install

# examples
pnpm container-install pino # same as: pnpm install pino
pnpm container-install --save-dev pino-pretty # same as: pnpm install --save-dev pino-pretty
```

If you do accidentally run `pnpm install` or otherwise mess up your node modules, deleting your `.pnpm-store` and `node_modules` folders should bring you back to a good state.

## Architecture

Below is a diagram depicting the high-level architecture of the API and its related services.

![API Architecture Diagram](./docs/media/tekalo_api_architecture.png 'API Architecture')

## Database

We make use of Prisma as an ORM over our Postgres database

To make experimental database schema changes during local development (that will not use or effect existing migrations) execute:

```bash
pnpm prisma:update
```

To seed your local instance with test data, execute:

```bash
pnpm prisma:seed
```

If you want to merge changes to `schema.prisma` into main, you must create a new database migration by executing:

```bash
pnpm prisma:migrate
```

To use the [`Prisma Studio`](https://www.prisma.io/studio) GUI to view/edit/update your local Postgres database, execute the command below and navigate to `localhost:5555`. This will spin up an instance of Prisma Studio in a separate docker container.

```bash
docker-compose up prisma-studio
```

### Packages

The `/packages` directory is where any additional modules will be stored that are not meant to be part of the larger API module.

All packages within this directory will also be included in the build when `pnpm build` is executed.

When developing within this directory, it may be useful to use [`pnpm link`](https://pnpm.io/cli/link) to link the local version of this directory to the parent-level API.

### Testing

We use `Jest` and `Supertest` as our testing frameworks. `Supertest` is used for
our end-to-end testing, while `Jest` is used for unit testing.

The test script allows you to specify an optional `--files` flag with `pnpm test` that argets specific tests. For example:

Run all tests: `pnpm run test`
Run only tests in the integration folder: `pnpm run test --files=integration`
Run only tests in the unit folder: `pnpm run test --files=unit`
Run only tests in the unit/controllers folder: `pnpm run test --files=unit/controllers`
Run only tests that start with 'grants' in the unit/controllers folder: `pnpm run test --files=unit/controllers/applicants`
Run only a specific test: `pnpm run test --files=unit/controllers/applicants.controller.test.ts`

### Testing emails locally

Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` to your `.env` file. The values for these can be found in the AWS `start` page for the Future Action Networks. Click on `Command line or programmatic access` under the Future-Actions-Network-Apps account and copy the environment values.

## Auth0 Configuration Management

Prequisite: install auth0deploy `npm install -g auth0-deploy-cli`

The `/dev` and `/prod` directories maintain the working version of our Auth0 Dev and Prod tenants setup. `dev/tenant.yaml` holds general dev configuration, and the rest of the `/dev` directory holds supplemental templates/settings, and the same thing applies for the `/prod` directory.
`auth0/config-dev.json` contains variables for our dev tenant, and `auth0/config-prod.json` contains variables for our prod tenant. The `dev` and `prod` configurations are slightly divergent (the dev tenant also contains an application for staging, for example) so we can't directly apply the dev configuration to production.

It is recommended to make changes in the Auth0 UI first. The configuration in the `auth0` directory is primarily a record of what is in Auth0. Updating the configuration in Auth0 using the `export` functionality of the auth0 CLI has been problematic.

> **_NOTE:_** Auth0 has a [known bug](https://auth0.com/docs/deploy-monitor/deploy-cli-tool/keyword-replacement#unidirectional-limitation) where keyword replacements are reverted to literal strings after an `export`. Make sure to **NOT** commit these changes

1. Make changes in Auth0 UI dev tenant
2. Export changes from dev tenant (the credentials can be found in the Deploy CLI application)

   ```bash
   # values are the same as those set in .env
   export AUTH0_CLIENT_SECRET={auth0-secret-for-dev-tenant}
   a0deploy export -c=auth0/config-dev.json --output_folder=auth0/dev --format=yaml
   ```

3. Open a PR with changes pulled down to the `/auth0/dev` directory.
4. When changes merged into `main` and tested, make the same changes to Auth0 prod tenant.
5. Export changes from Auth0 prod tenant:

   ```bash
   export AUTH0_CLIENT_SECRET={auth0-secret-for-prod-tenant}
   a0deploy export -c=auth0/config-prod.json --output_folder=auth0/prod --format=yaml
   ```

6. Open a PR with changes pulled down to the `/auth0/prod`.

**Pushing changes to Auth0 is not recommended** unless you're configuring a new tenant. To push up changes:

1. Make your changes to `/auth0/dev` directory
2. Once merged, push your changes to the Auth0 dev tenant:

   ```bash
   export AUTH0_CLIENT_SECRET={auth0-secret-for-dev-tenant}
   a0deploy import -c=auth0/config-dev.json --input_file=auth0/dev/tenant.yaml
   ```

3. When you're ready to make the changes to the prod configuration, make the same changes in the `auth0/prod` directory.
4. Once merged, push your changes to Auth0 prod tenant:

   ```bash
   export AUTH0_CLIENT_SECRET={auth0-secret-for-prod-tenant}
   a0deploy import -c=auth0/config-prod.json --input_file=auth0/prod/tenant.yaml
   ```

## Environment Variables

### Local Development

For local development, the `docker-compose` setup should be setting all of these already:

`PORT` - (required) host port for API to be exposed on (should be `3000`)

`DATABASE_URL` - (required) URL for Prisma Client to connect to. Formatted as: `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}`

- `${POSTGRES_HOST}` in the local setup will be the name of our docker-compose postgres service

### Github Actions

The below are used for the Postgres image in Github Actions CI/CD:

`POSTGRES_DB` - Name of default database for Postgres container to create

`POSTGRES_USER` - Username to create in Postgres container

`POSTGRES_PORT` - Port for Postgres to be exposed (should be `5432`)

`POSTGRES_PASSWORD` - Password to create in Postgres container

`POSTGRES_HOST` - Hostname of Postgres server

## Code Formatting

If there are particular rules that you want to add or otherwise toggle, you should generally use the `.prettierrc` file to configure the rules.
[Prettier](https://prettier.io/docs/en/index.html) is an opinionated multi-language code formatter. We use this to make sure our code is consistently formatted.

We also use `eslint`, specifically [airbnb-base](https://www.npmjs.com/package/eslint-config-airbnb-base) to ensure consistent code quality.

The general rule of thumb is: _use Prettier for formatting and ESLint for everything else (e.g. code-quality bugs)_

## Hooks

This repository uses [husky](https://www.npmjs.com/package/husky) to run git hooks (found in the `.husky` directory) to aid in development.
Before each commit, `husky` will run a `pre-commit` hook to run eslint and prettier formatter on your code to ensure consistent code syntax and style uniformity.

Additional hooks should be [added](https://typicode.github.io/husky/#/?id=create-a-hook) under the `.husky` directory as seperate scripts and this README should be updated accordingly.

## Infrastructure

The Tekalo api runs in AWS. The infrastructure configured in terraform files. [More information](tf/README.md).

More detailed information about the infrastructure can be found [here](docs/Infrastructure.md).

## Operations / Troubleshooting

[Supporting the Tekalo API in production](docs/Operations.md)
