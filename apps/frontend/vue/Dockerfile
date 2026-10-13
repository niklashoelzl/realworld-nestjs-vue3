# syntax=docker/dockerfile:1

# ---- deps ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/vue/package.json apps/frontend/vue/
RUN corepack enable && pnpm install --frozen-lockfile --filter vue

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/vue/node_modules ./apps/frontend/vue/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

COPY apps ./apps
COPY libs ./libs

RUN corepack enable && pnpm --filter vue build-only

# ---- runtime ----
FROM nginx:stable-alpine AS runtime
COPY --from=build /app/apps/frontend/vue/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
