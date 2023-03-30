#!/bin/bash
# This command accepts a --files="..." argument to specify test files to test
files="$(cut -d'=' -f2 <<< "$1")"
exec docker compose run --rm test-api bash "-c" "pnpm prisma db push --accept-data-loss --force-reset / && scripts/test-command.sh $files"
