import { getServerSession } from "next-auth";
import { getTenantClient } from "@opero/database";
import { authOptions } from "./config";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Sessão inválida ou expirada.");
    this.name = "UnauthenticatedError";
  }
}

/**
 * Resolves the current server-side session and a Prisma client already
 * scoped to that session's tenant. Every server action / route handler
 * that touches tenant data should start from this, never from the raw
 * `prisma` export — that's what keeps a copy-pasted query from silently
 * reading another tenant's rows.
 */
export async function requireTenantSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    throw new UnauthenticatedError();
  }
  return {
    session,
    db: getTenantClient(session.user.tenantId),
  };
}
