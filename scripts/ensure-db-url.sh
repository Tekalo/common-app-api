#!/bin/bash

if [ -z "${DATABASE_URL:-}" ]; then
  echo 2>&1 "Database URL is unset. Attempting to set from secret env var..."
  DATABASE_URL="$(node scripts/get-db-url.js)"
  if [ -z "${DATABASE_URL:-}" ]; then
    echo 2>&1 "Unable to set URL from secret. Aborting..."
    exit 1
  fi
  export DATABASE_URL
fi

exec "$@"
