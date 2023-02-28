#!/bin/bash
exec docker compose run --rm test-api bash "-c" "pnpx prisma db push --accept-data-loss --force-reset / && scripts/test-command.sh $npm_config_files"
