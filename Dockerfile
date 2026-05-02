# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps

WORKDIR /app
ENV DATABASE_URL=file:/tmp/the-explorer-build.db

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
  DATABASE_URL=file:/app/storage/the-explorer-prod.db
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev \
  && npm install --no-save prisma@$(node -p "require('./node_modules/@prisma/client/package.json').version") \
  && npx prisma generate \
  && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/server/dist ./server/dist
COPY reference ./reference
COPY scripts ./scripts

RUN chmod +x ./scripts/docker-entrypoint.sh \
  && mkdir -p /app/storage/uploads

EXPOSE 3001

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["node", "server/dist/server/index.js"]
