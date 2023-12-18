#!/bin/bash
echo "Executing container-test.sh script..."
# This command accepts a --files="..." argument to specify test files to test
files="$(cut -d'=' -f2 <<< "$1")"
exec docker compose --profile test run -T --rm test-api bash "-c" "pnpm prisma db push --accept-data-loss --force-reset / && tsx scripts/createSkillsView.ts && scripts/test-command.sh $files"
