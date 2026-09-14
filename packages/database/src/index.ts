import { PrismaClient } from "@prisma/client";

/**
 * App Runner (Phase 2 infra, see infra/lib/compute-stack.ts) injects the
 * RDS credential as discrete env vars — DB_HOST/DB_PORT/DB_NAME/
 * DB_USERNAME/DB_PASSWORD — rather than one connection-string secret,
 * because Secrets Manager's RDS-generated secret holds those fields
 * separately and there's no CloudFormation-native way to concatenate them
 * into a URL without a custom resource. Local dev keeps using a literal
 * DATABASE_URL from .env, so this only ever fires in that one deployment
 * shape.
 */
function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const { DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env;
  if (!DB_HOST || !DB_NAME || !DB_USERNAME || !DB_PASSWORD) return undefined;

  const encodedPassword = encodeURIComponent(DB_PASSWORD);
  return `postgresql://${DB_USERNAME}:${encodedPassword}@${DB_HOST}:${DB_PORT ?? "5432"}/${DB_NAME}?sslmode=require`;
}

// Global singleton to avoid exhausting connections in dev (Next.js HMR).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Raw, unscoped Prisma client. Only for admin/system code that legitimately
 * spans tenants (migrations, seeds, the internal back-office `/admin/*`
 * routes, cron jobs). Application code that serves a tenant request must
 * use `getTenantClient` instead.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";

/** Models that carry a direct `tenantId` column and must always be scoped. */
const TENANT_SCOPED_MODELS = new Set([
  "User",
  "Customer",
  "ServiceCategory",
  "ServiceOrder",
  "Appointment",
  "Invoice",
  "Transaction",
  "Notification",
  "AuditLog",
  "InventoryItem",
  "InventoryMovement",
]);

const READ_OPS = new Set(["findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow", "findMany", "count", "aggregate", "groupBy"]);
const WRITE_MANY_OPS = new Set(["updateMany", "deleteMany"]);
const SINGLE_WRITE_OPS = new Set(["update", "updateMany", "upsert", "delete", "deleteMany"]);
const CREATE_OPS = new Set(["create", "createMany"]);

/**
 * Returns a Prisma client bound to a single tenant. Every query against a
 * tenant-scoped model has `tenantId` forced into its `where`, and every
 * create has `tenantId` forced into its `data` — a caller cannot read or
 * write across tenants even by mistake. This is enforced again at the
 * database layer via Postgres Row-Level Security (see the
 * `enable_row_level_security` migration), so a bug here is not the only
 * line of defense.
 */
export function getTenantClient(tenantId: string) {
  if (!tenantId) {
    throw new Error("getTenantClient() requires a tenantId");
  }

  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          const a = args as Record<string, any>;

          if (CREATE_OPS.has(operation)) {
            if (operation === "createMany" && Array.isArray(a.data)) {
              a.data = a.data.map((d: Record<string, any>) => ({ ...d, tenantId }));
            } else if (a.data) {
              a.data = { ...a.data, tenantId };
            }
          }

          if (READ_OPS.has(operation) || WRITE_MANY_OPS.has(operation) || SINGLE_WRITE_OPS.has(operation)) {
            a.where = a.where ? { ...a.where, tenantId } : { tenantId };
          }

          return query(a);
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof getTenantClient>;

/**
 * Sets the Postgres session variable `app.tenant_id` that the RLS policies
 * key on. Call this inside the same transaction/connection as the queries
 * it protects — `getTenantClient` does not do this on its own because
 * Prisma's connection pooling makes a bare `SET` outside a transaction
 * leak across requests.
 */
export async function withRlsContext<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId.replace(/'/g, "''")}'`);
    return fn(tx as PrismaClient);
  });
}
