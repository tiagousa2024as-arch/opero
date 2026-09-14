# OPERO

Vertical B2B SaaS for Brazilian service-based SMBs (oficinas, salões, clínicas, assistências técnicas) — clientes, agendamento, ordens de serviço, financeiro e cobrança em um só lugar.

## Stack

pnpm + Turborepo monorepo, Next.js 14 (App Router) + TypeScript, Tailwind + shadcn/ui, Prisma/PostgreSQL, Auth.js. See the project blueprint for the full architecture and phased build plan.

## Repository layout

```
apps/
  web/        Next.js app — marketing site + authenticated app + admin
  worker/     Background jobs (Phase 2+)
packages/
  database/   Prisma schema, migrations, generated client
  ui/         Shared UI components (shadcn-based design system)
  config/     Shared eslint/tsconfig/tailwind config
  auth/       Auth.js config, RBAC helpers, tenant-scoping session helper
infra/        AWS CDK (TypeScript) — infrastructure as code
```

## Deployment (Phase 2)

`infra/` has the full CDK app for production (VPC, RDS, S3, SES, Secrets Manager, App Runner) and `.github/workflows/deploy.yml` builds the Docker image, pushes to ECR, runs migrations and triggers the App Runner deployment on merge to `main`. None of this has been deployed anywhere — it needs a real AWS account first. See `infra/README.md` for the setup checklist.

## Getting started

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm --filter @opero/database exec prisma migrate dev
pnpm dev
```

The app runs at http://localhost:3000. The marketing site and authenticated app currently share one Next.js deployment (route-based separation), per the Phase 1 plan.

## Multi-tenancy

Every tenant-owned table carries a `tenant_id`. Application code must go through `getTenantClient(tenantId)` (or `requireTenantSession()` in server code) rather than the raw Prisma client — see `packages/database/src/index.ts`. Postgres Row-Level Security policies (`packages/database/prisma/migrations/*_enable_row_level_security`) enforce the same boundary as a second line of defense.
