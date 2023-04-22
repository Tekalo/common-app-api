FROM node:20.0.0-slim AS base
WORKDIR /api
RUN chown node:node /api
RUN apt-get update && apt-get install -y \
    openssl && rm -rf /var/lib/apt/lists/* && \
    npm install -g pnpm

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY db/ db/

FROM base AS test
ENV NODE_ENV test
# pnpm install has prefer-frozen-lockfile set to true by default
RUN pnpm install
COPY . .
CMD pnpm dev

FROM base AS development
ENV NODE_ENV development
# pnpm install has prefer-frozen-lockfile set to true by default
RUN pnpm install
COPY . .
CMD pnpm dev

# Build the project's compiled files
FROM base AS build
# TODO: Run all operations, in lower-leel envs, as notroot
# https://denibertovic.com/posts/handling-permissions-with-docker-volumes/
RUN mkdir ./build && chown -R node:node ./build
# pnpm install has prefer-frozen-lockfile set to true by default
RUN pnpm install
ENV NODE_ENV production
USER node
COPY --chown=node:node . .
RUN pnpm build

# Start the server
FROM build AS production
ENV NODE_ENV production
CMD pnpm start
ENTRYPOINT [ "/api/scripts/ensure-db-url.sh" ]
