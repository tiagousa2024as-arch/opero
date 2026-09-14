# infra — AWS CDK (Phase 2-3)

TypeScript CDK app implementing PART F Phase 2 (production deployment) and Phase 3 (ECS/Redis/SQS scale-up) of the blueprint, as real, synthesizable infrastructure-as-code — `cdk synth` runs clean with zero warnings across all 10 stacks. **Nothing has been deployed** — that needs a real AWS account with billing configured (PART G), which this session doesn't have.

## Stacks

| Stack | What it creates |
|---|---|
| `Opero-Network` | VPC — one public subnet (ALB, NAT Gateway) + one private subnet (everything else) per AZ, one NAT Gateway |
| `Opero-Database` | Single-AZ RDS PostgreSQL 16 (`db.t4g.micro`) in the private subnet, encrypted, not publicly accessible, deletion-protected, plus an SSM bastion for admin access (no open SSH, no keypair) |
| `Opero-Storage` | S3 bucket for logos / OS attachments / invoices |
| `Opero-Email` | SES domain identity for `opero.com.br` (DKIM records output for manual DNS setup — see below) |
| `Opero-Secrets` | Secrets Manager entry for `NEXTAUTH_SECRET` (auto-generated) and `ASAAS_API_KEY` / `ASAAS_WEBHOOK_TOKEN` placeholders |
| `Opero-Queues` | SQS queues for reminders and recurring billing, each with a dead-letter queue |
| `Opero-Cache` | Single-node ElastiCache Redis in the private subnet |
| `Opero-Compute` | ECS cluster, ECR repo + Fargate service + ALB for `apps/web` |
| `Opero-Worker` | ECR repo + Fargate service for `apps/worker` (same cluster, no ALB — it's a background consumer) |
| `Opero-Observability` | CloudWatch alarms: RDS CPU/storage, ECS running-task-count for both services, ALB target 5xx rate |

This supersedes the Phase 1/2 App Runner-based compute (public-subnets-only VPC, no NAT, no Redis/SQS) — see git history if you need to see that version. Real infra evolves forward; it isn't worth maintaining two parallel copies for different growth stages.

## Before the first real deploy

1. **An AWS account with billing configured** (PART G). Nothing below works without one.
2. **Bootstrap CDK** in the target account/region once: `npx cdk bootstrap aws://ACCOUNT_ID/sa-east-1`.
3. **Decide the payment gateway** (Asaas vs. Pagar.me, PART G) — Phase 1 already defaults to a mock gateway, so this can happen after the first deploy. When ready, put the real key in `Opero-Secrets`'s `ASAAS_API_KEY` field (`aws secretsmanager put-secret-value`) and flip `PAYMENT_PROVIDER` in `lib/compute-stack.ts` from `"mock"` to `"asaas"`.
4. **Decide the WhatsApp BSP** (direct Meta Cloud API vs. Z-API/Gupshup/Twilio, PART G). Set `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` as real secrets and flip `WHATSAPP_PROVIDER` in `lib/worker-stack.ts` from `"mock"` to `"meta"` once a Meta Business/WABA setup exists.
5. **Decide the nota fiscal provider** (Focus NFe vs. NFE.io vs. eNotas, PART G) and get the tenant's municipal service registration on file with them — `getNfeProvider()` in `apps/web/src/lib/nfe` stays on the mock provider until `NFE_API_KEY` is set.
6. **DNS**: `opero.com.br` is assumed to live outside Route53 (typically registro.br for a `.com.br` domain), so this app does not manage it automatically:
   - `Opero-Email`'s stack output lists the DKIM CNAME records to add for SES sending to work.
   - `app.opero.com.br` → the ALB (`Opero-Compute`'s `AlbDnsName` output) needs a CNAME plus, for HTTPS, an ACM certificate (DNS-validated the same manual way) and an HTTPS listener added to the ALB — not built yet since there's no domain control to validate against.
7. **CI/CD secrets** (`.github/workflows/deploy.yml`, gated on the `production` GitHub Environment):
   - `AWS_DEPLOY_ROLE_ARN` — an IAM role GitHub Actions assumes via OIDC (don't use long-lived access keys). Needs ECR push (both repos), `prisma migrate deploy` network access to RDS, and `ecs:UpdateService`/`ecs:DescribeServices` on both services.
   - `PRODUCTION_DATABASE_URL` — the real RDS connection string (from the `Opero-Database` generated secret + endpoint), used only to run migrations from CI.

## Local commands

```bash
pnpm --filter @opero/infra typecheck
pnpm --filter @opero/infra synth   # safe — synthesizes CloudFormation locally, no AWS calls
pnpm --filter @opero/infra diff    # needs real AWS credentials
pnpm --filter @opero/infra deploy  # needs real AWS credentials — this is the one that costs money
```

## Not built yet (Phase 4, PART F)

Multi-AZ RDS, a read replica, AWS WAF in front of the ALB, and blue/green deploys via CodeDeploy — don't add these pre-emptively; they're real ongoing cost the blueprint explicitly times to when there's a revenue signal to justify them.
