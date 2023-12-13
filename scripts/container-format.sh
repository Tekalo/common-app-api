#!/bin/bash
exec docker compose run -u node -T --no-deps --rm api scripts/format-command.sh
