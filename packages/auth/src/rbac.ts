import type { UserRole } from "@opero/database";

/**
 * Resources are checked with a coarse action set (`read`/`write`) rather
 * than one permission per page — Phase 1 has few enough resources that a
 * finer grain would just be more matrix to keep in sync for no real gain.
 */
export type Resource =
  | "clientes"
  | "agenda"
  | "ordens_de_servico"
  | "financeiro"
  | "cobrancas"
  | "equipe"
  | "configuracoes";

type Action = "read" | "write";

const MATRIX: Record<Resource, Record<UserRole, Action[]>> = {
  clientes: {
    OWNER: ["read", "write"],
    ADMIN: ["read", "write"],
    STAFF: ["read", "write"],
    FINANCE: ["read"],
  },
  agenda: {
    OWNER: ["read", "write"],
    ADMIN: ["read", "write"],
    STAFF: ["read", "write"],
    FINANCE: ["read"],
  },
  ordens_de_servico: {
    OWNER: ["read", "write"],
    ADMIN: ["read", "write"],
    STAFF: ["read", "write"],
    FINANCE: ["read"],
  },
  financeiro: {
    OWNER: ["read", "write"],
    ADMIN: ["read", "write"],
    STAFF: [],
    FINANCE: ["read", "write"],
  },
  cobrancas: {
    OWNER: ["read", "write"],
    ADMIN: ["read", "write"],
    STAFF: ["read"],
    FINANCE: ["read", "write"],
  },
  equipe: {
    OWNER: ["read", "write"],
    ADMIN: ["read", "write"],
    STAFF: [],
    FINANCE: [],
  },
  configuracoes: {
    OWNER: ["read", "write"],
    ADMIN: ["read", "write"],
    STAFF: [],
    FINANCE: [],
  },
};

export function can(role: UserRole, resource: Resource, action: Action): boolean {
  return MATRIX[resource]?.[role]?.includes(action) ?? false;
}

export class ForbiddenError extends Error {
  constructor(message = "Você não tem permissão para executar esta ação.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Throws ForbiddenError when the role lacks the permission — use at the top of every server action / route handler. */
export function assertCan(role: UserRole, resource: Resource, action: Action): void {
  if (!can(role, resource, action)) {
    throw new ForbiddenError();
  }
}
