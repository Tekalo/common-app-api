FROM node:18.14.0-slim AS base
WORKDIR /api
RUN apt-get update && apt-get install -y \
    openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json tsconfig.json ./

FROM base AS test
ENV NODE_ENV test
RUN npm ci
COPY . .
CMD npm run dev

FROM base AS development
ENV NODE_ENV development
RUN npm ci
COPY . .
CMD npm run dev

# Build the project's compiled files
FROM base AS build
RUN mkdir /.npm
# TODO: Run all operations, in lower-leel envs, as notroot
# https://denibertovic.com/posts/handling-permissions-with-docker-volumes/
USER node
RUN npm ci
ENV NODE_ENV production
COPY --chown=node:node . .
RUN npm run build

# Copy our build artifacts and start the server
FROM build AS production
ENV NODE_ENV production
RUN npm prune
COPY --from=build /api/build ./
CMD npm run start
# TOOD: Add ensure-database-url script