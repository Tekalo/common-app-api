#!/bin/bash
if [ "$#" -eq  "0" ]
then
   docker compose run -u node --no-deps --rm api pnpm uninstall
else
   docker compose run -u node --no-deps --rm api pnpm remove "$@"
fi
