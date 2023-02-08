FROM node:18.14.0-slim AS base
WORKDIR /api
RUN apt-get update && apt-get install -y \
    openssl
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
ENV NODE_ENV production
RUN npm ci
COPY . .
RUN npm run build

# Copy our build artifacts and start the server
FROM build AS production
ENV NODE_ENV production
COPY --from=build /api/build ./
CMD npm run start
# TOOD: Add ensure-database-url script