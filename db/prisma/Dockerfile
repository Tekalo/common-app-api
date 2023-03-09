FROM node:18-slim

WORKDIR /app

COPY db/prisma/ prisma/
COPY scripts/ scripts/

RUN apt-get update
RUN apt-get install -y postgresql
RUN apt-get install -y openssl

CMD npx prisma studio
