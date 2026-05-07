#!/bin/sh
set -e
NODE_PATH=/app/prisma-node-modules node /app/prisma-node-modules/prisma/build/index.js migrate deploy
exec node server.js
