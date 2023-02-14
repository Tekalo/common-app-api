# CommonApp

The Common App API is used to support the Common App Application, a tool for matching tech talent to opportunities at non-profit, philanthropic, and government organizations.

## Getting Started

### Prerequisites

- Docker: [Docker Desktop](https://docs.docker.com/desktop/) is recommended for all operating systems.
- NPM

### Setting up a dev environment

We use Docker for local development and testing. This ensures consistency in environments amongst all contributors. Our Docker environment consists of 2 containers: API and Postgres DB containers. The local dev dir is volume-mounted at `/api` into the container, so there is no need to rebuild the image for code or package changes.

To install dependencies, instead of running `npm install` (see [important note on node_modules](#important-note-on-node_modules) below), run:

```bash
npm run container-install
```

This will build a docker image of the API and then use it to install NPM packages.

### Running the dev server

Run the following command to launch the API (and a dev postgres instance) in Docker containers in dev mode:

```bash
docker-compose up
```

You can now access the API at <http://localhost:3000>. The API container uses `nodemon` and `swc` to hot-reload and re-build after saving any changes made to `.ts` files, while typechecking is done with `tsc`.

### Important note on node_modules

The node_modules directory is mounted into the container and all node commands should be run in the container. As far as possible, the npm scripts will use docker to run linting, beautification, build, etc in the container. **Never run `npm install` outside the container, as it could result in incorrect architecture packages being installed and logged to package-lock. Use `npm run container-install` instead, which runs the install in the container**

To add new packages, you can use:

```sh
npm run container-install -- args to npm install

# examples
npm run container-install -- pino # same as: npm install pino
npm run container-install -- --save-dev pino-pretty # same as: npm install --save-dev pino-pretty
```

## Code Formatting

If there are particular rules that you want to add or otherwise toggle, you should generally use the `.prettierrc` file to configure the rules.
[Prettier](https://prettier.io/docs/en/index.html) is an opinionated multi-language code formatter. We use this to make sure our code is consistently formatted.

We also use `eslint`, specifically [airbnb-base](https://www.npmjs.com/package/eslint-config-airbnb-base) to ensure consistent code quality.

The general rule of thumb is: _use Prettier for formatting and ESLint for everything else (e.g. code-quality bugs)_

## Hooks

This repository uses [husky](https://www.npmjs.com/package/husky) to run git hooks (found in the `.husky` directory) to aid in development.
Before each commit, `husky` will run a `pre-commit` hook to run eslint and prettier formatter on your code to ensure consistent code syntax and style uniformity.

Additional hooks should be [added](https://typicode.github.io/husky/#/?id=create-a-hook) under the `.husky` directory as seperate scripts and this README should be updated accordingly.
