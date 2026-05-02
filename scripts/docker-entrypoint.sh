#!/bin/sh

set -eu

mkdir -p /app/storage/uploads

npx prisma db execute --file prisma/init.sql --schema prisma/schema.prisma

exec "$@"
