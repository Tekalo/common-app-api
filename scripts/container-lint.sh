#!/bin/bash
exec docker compose run -u node -T --no-deps --rm api scripts/lint-command.sh
