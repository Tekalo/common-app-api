#!/bin/bash
if [ "$#" -eq  "0" ]
then
   docker compose run -u node --no-deps --rm api pnpm install
else
   docker compose run -u node --no-deps --rm api pnpm add "$@"
fi
