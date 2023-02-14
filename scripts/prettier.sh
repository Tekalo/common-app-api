#!/bin/bash
exec docker compose run -u node -T --no-deps --rm api npx prettier --check --write .
