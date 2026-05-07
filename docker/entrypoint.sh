#!/bin/sh
set -e
(cd /app/prisma-modules && node node_modules/prisma/build/index.js migrate deploy --schema=/app/prisma/schema.prisma --config=/app/prisma.config.ts)
exec node server.js
