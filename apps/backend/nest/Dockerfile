# syntax=docker/dockerfile:1

# ---- deps ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/nest/package.json apps/backend/nest/
COPY libs ./libs
RUN corepack enable && pnpm install --frozen-lockfile --filter nest
RUN pnpm prisma generate --schema=libs/database/sqlite/prisma/schema.prisma

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY apps/backend/nest ./apps/backend/nest
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/nest/node_modules ./apps/backend/nest/node_modules
COPY --from=deps /app/libs ./libs
COPY package.json tsconfig.json ./
RUN corepack enable && pnpm build:nest

# ---- runtime ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_MODE="prisma"
ENV DATABASE_URL=file:/data/dev.db

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/nest/node_modules ./apps/backend/nest/node_modules
COPY --from=deps /app/libs ./libs
COPY --from=build /app/apps/backend/nest/dist ./apps/backend/nest/dist
COPY libs/database/sqlite ./libs/database/sqlite
EXPOSE 3000

CMD sh -c "npx prisma migrate deploy --config=libs/database/sqlite/prisma.config.ts && node apps/backend/nest/dist/main.js"