FROM node:20.10.0-slim AS base
WORKDIR /api
RUN chown node:node /api
RUN chown node:node /tmp
# VOLUME instruction: https://github.com/aws/containers-roadmap/issues/938#issuecomment-743655586
VOLUME ["/tmp"]
RUN apt-get update && apt-get install -y \
    openssl \
    curl \
    && rm -rf /var/lib/apt/lists/* && \
    npm install -g pnpm@8

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY db/ db/
ENV PATH /api/node_modules/.bin:$PATH

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
# TODO: Run all operations, in lower-level envs, as notroot
# https://denibertovic.com/posts/handling-permissions-with-docker-volumes/
RUN mkdir ./build && chown -R node:node ./build
# pnpm install has prefer-frozen-lockfile set to true by default
RUN pnpm install
ENV NODE_ENV production
USER node
COPY --chown=node:node . .
RUN pnpm build

FROM scratch AS artifact
COPY --from=build /api/build /

# Start the server
FROM build AS production
ARG GITHUB_SHA
ENV GITHUB_SHA=${GITHUB_SHA}
ENV NODE_ENV production
CMD pnpm start
ENTRYPOINT [ "/api/scripts/ensure-db-url.sh" ]
