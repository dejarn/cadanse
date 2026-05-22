#!/bin/sh
set -e

if [ -z "$AUTH_SECRET" ]; then
  echo "ERROR: AUTH_SECRET must be set in production" >&2
  exit 1
fi
if [ -z "$SUPER_ADMIN_PASSWORD" ]; then
  echo "ERROR: SUPER_ADMIN_PASSWORD must be set in production" >&2
  exit 1
fi

exec node server.js
