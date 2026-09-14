# apps/worker — background SQS consumer + scheduler (infra/lib/worker-stack.ts).
#
# Runs via tsx rather than a tsc build: the shared workspace packages
# (@opero/database, @opero/notifications) ship their TypeScript source as
# `main` — fine for Next.js (which transpiles workspace packages itself)
# and for tsx (whose loader resolves bare-specifier/directory TS imports
# the same way Node's CJS resolver would), but plain `node dist/index.js`
# against a tsc-compiled worker fails on those imports (Node's own
# require() doesn't do TS-style directory-index resolution). tsx sidesteps
# needing a separate build step for every shared package.

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/notifications/package.json packages/notifications/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile

FROM base AS runner
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs worker

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=deps /repo/packages ./packages
COPY package.json pnpm-workspace.yaml ./
COPY apps/worker ./apps/worker
COPY packages/database/prisma ./packages/database/prisma

RUN pnpm --filter @opero/database generate

USER worker
WORKDIR /repo/apps/worker
CMD ["npx", "tsx", "src/index.ts"]
