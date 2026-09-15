# Multi-stage build for apps/web, run by App Runner (infra/lib/compute-stack.ts)
# and pushed to ECR by .github/workflows/deploy.yml on merge to main.
#
# Debian-based (not alpine) throughout so Prisma's default binary target
# (debian-openssl-3.0.x) just works — switching to alpine would need
# `binaryTargets` set in schema.prisma plus openssl installed in the
# runner stage.

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /repo

# ---------------------------------------------------------------------------
# deps: install once, cached across builds as long as lockfile + package.json
# files are unchanged.
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/notifications/package.json packages/notifications/package.json
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# builder: generate the Prisma client, then build the Next.js standalone
# output.
# ---------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages ./packages
COPY --from=deps /repo/apps ./apps
COPY . .
RUN pnpm --filter @opero/database generate
RUN pnpm --filter @opero/web build

# ---------------------------------------------------------------------------
# runner: the actual App Runner container — just the standalone server
# (already a pruned, traced node_modules — see outputFileTracingRoot and
# outputFileTracingIncludes in next.config.mjs for how the Prisma engine
# binary makes it in) plus static assets and migrations.
# ---------------------------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public
COPY --from=builder /repo/packages/database/prisma ./packages/database/prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
