FROM node:18.14.0-slim AS base
WORKDIR /api
RUN apt-get update && apt-get install -y \
    openssl && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*
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
# TODO: Run all operations, in lower-leel envs, as notroot
# https://denibertovic.com/posts/handling-permissions-with-docker-volumes/
RUN groupadd -g 9999 notrootgroup \
    && useradd -m -g 9999 -u 5678 notroot \
    && chown -R 5678:9999 .
USER notroot
RUN npm ci
ENV NODE_ENV production
COPY --chown=5678:9999 . .
RUN npm run build

# Copy our build artifacts and start the server
FROM build AS production
ENV NODE_ENV production
RUN npm prune
COPY --from=build /api/build ./
CMD npm run start
# TOOD: Add ensure-database-url script