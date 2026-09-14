# infra — AWS CDK (Phase 2)

TypeScript CDK app implementing PART F Phase 2 of the blueprint: the production deployment infrastructure. This is real, synthesizable infrastructure-as-code — `cdk synth` runs clean with zero warnings — but **nothing here has been deployed**. That needs a real AWS account with billing configured (PART G), which this session doesn't have.

## Stacks

| Stack | What it creates |
|---|---|
| `Opero-Network` | VPC, public subnets only, no NAT Gateway (cost-saving MVP choice — see comment in `lib/network-stack.ts`) |
| `Opero-Database` | Single-AZ RDS PostgreSQL 16 (`db.t4g.micro`), encrypted, `publiclyAccessible: false`, `deletionProtection: true` |
| `Opero-Storage` | S3 bucket for logos / OS attachments / invoices |
| `Opero-Email` | SES domain identity for `opero.com.br` (DKIM records are output for manual DNS setup — see below) |
| `Opero-Secrets` | Secrets Manager entry for `NEXTAUTH_SECRET` (auto-generated) and `ASAAS_API_KEY` / `ASAAS_WEBHOOK_TOKEN` placeholders |
| `Opero-Compute` | ECR repository + App Runner service (reaches RDS through a VPC connector, reads all credentials from Secrets Manager, auto-deploys on image push) |
| `Opero-Observability` | CloudWatch alarms: RDS CPU/storage, App Runner 5xx rate |

## Before the first real deploy

1. **An AWS account with billing configured** (PART G). Nothing below works without one.
2. **Bootstrap CDK** in the target account/region once: `npx cdk bootstrap aws://ACCOUNT_ID/sa-east-1`.
3. **Decide the payment gateway** (Asaas vs. Pagar.me, PART G) — Phase 1 already defaults to a mock gateway, so this can happen after the first deploy. When ready, put the real key in `Opero-Secrets`'s `ASAAS_API_KEY` field (`aws secretsmanager put-secret-value`) and flip `PAYMENT_PROVIDER` in `lib/compute-stack.ts` from `"mock"` to `"asaas"`.
4. **DNS**: `opero.com.br` is assumed to live outside Route53 (typically registro.br for a `.com.br` domain), so this app does not manage it automatically:
   - `Opero-Email`'s stack output lists the DKIM CNAME records to add for SES sending to work.
   - Custom domain mapping for `app.opero.com.br` onto the App Runner service needs an `AWS::AppRunner::CustomDomainAssociation` (not yet added — add it once the domain is registered/confirmed, per PART G) plus the CNAME/validation records it returns.
5. **CI/CD secrets** (`.github/workflows/deploy.yml`, gated on the `production` GitHub Environment):
   - `AWS_DEPLOY_ROLE_ARN` — an IAM role GitHub Actions assumes via OIDC (don't use long-lived access keys). Needs ECR push, `prisma migrate deploy` network access to RDS, and `apprunner:StartDeployment`/`apprunner:ListServices`.
   - `PRODUCTION_DATABASE_URL` — the real RDS connection string (from the `Opero-Database` generated secret + endpoint), used only to run migrations from CI.

## Local commands

```bash
pnpm --filter @opero/infra typecheck
pnpm --filter @opero/infra synth   # safe — synthesizes CloudFormation locally, no AWS calls
pnpm --filter @opero/infra diff    # needs real AWS credentials
pnpm --filter @opero/infra deploy  # needs real AWS credentials — this is the one that costs money
```

## Why App Runner instead of ECS/Fargate

PART B is explicit that Phase 1–2 uses App Runner and Phase 3 migrates to ECS Fargate behind an ALB with private subnets — don't build the Fargate/ALB/NAT setup now, it's real ongoing cost with no traffic yet to justify it.
