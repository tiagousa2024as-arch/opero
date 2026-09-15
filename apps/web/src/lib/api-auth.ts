import { createHash } from "crypto";
import { prisma, getTenantClient } from "@opero/database";

/**
 * Authenticates a public /api/v1/* request via `Authorization: Bearer <key>`.
 * Keys are stored hashed (SHA-256) — never in plaintext — so this hashes
 * the presented key and looks up the row by hash rather than ever
 * comparing plaintext keys. Returns a tenant-scoped Prisma client on
 * success, same as requireTenantSession() does for session-based routes.
 */
export async function authenticateApiKey(req: Request) {
  const authHeader = req.headers.get("authorization");
  const key = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!key) return null;

  const keyHash = createHash("sha256").update(key).digest("hex");
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!apiKey || apiKey.revokedAt) return null;

  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });

  return { tenantId: apiKey.tenantId, db: getTenantClient(apiKey.tenantId) };
}
