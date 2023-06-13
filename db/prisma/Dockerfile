FROM node:18.15.0

WORKDIR /app

RUN apt-get update && apt-get install -y postgresql && apt-get install -y openssl

COPY db/prisma/ prisma/
COPY scripts/ scripts/

CMD npx prisma studio
