#!/bin/bash
docker compose run -u node --no-deps --rm api npx eslint . --fix
