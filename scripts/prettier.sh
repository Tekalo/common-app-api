#!/bin/bash
exec docker compose run -u node -T --no-deps --rm api pnpm exec prettier --check --write .
