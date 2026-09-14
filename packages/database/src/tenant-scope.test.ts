import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma, getTenantClient } from "./index";

/**
 * Integration test against a real Postgres database (DATABASE_URL) — the
 * whole point of the tenant-scoping extension is a runtime guarantee, so a
 * mocked Prisma client would just prove the mock behaves as programmed.
 */
describe("getTenantClient tenant isolation", () => {
  let tenantA: { id: string };
  let tenantB: { id: string };

  beforeAll(async () => {
    tenantA = await prisma.tenant.create({ data: { name: "Tenant A (test)" } });
    tenantB = await prisma.tenant.create({ data: { name: "Tenant B (test)" } });
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } });
    await prisma.$disconnect();
  });

  it("scopes create() to the client's own tenant even if a caller passes a different tenantId", async () => {
    const dbA = getTenantClient(tenantA.id);
    const customer = await dbA.customer.create({ data: { name: "Cliente A", tenantId: tenantB.id } as any });
    expect(customer.tenantId).toBe(tenantA.id);
  });

  it("scopes findMany() so one tenant never sees another tenant's rows", async () => {
    const dbA = getTenantClient(tenantA.id);
    const dbB = getTenantClient(tenantB.id);

    await dbA.customer.create({ data: { name: "Only in A" } });
    await dbB.customer.create({ data: { name: "Only in B" } });

    const seenByA = await dbA.customer.findMany();
    const seenByB = await dbB.customer.findMany();

    expect(seenByA.every((c) => c.tenantId === tenantA.id)).toBe(true);
    expect(seenByA.some((c) => c.name === "Only in B")).toBe(false);
    expect(seenByB.some((c) => c.name === "Only in A")).toBe(false);
  });

  it("scopes update()/delete() so a tenant cannot mutate another tenant's row by id", async () => {
    const dbA = getTenantClient(tenantA.id);
    const dbB = getTenantClient(tenantB.id);

    const belongsToB = await dbB.customer.create({ data: { name: "B's customer" } });

    await expect(dbA.customer.update({ where: { id: belongsToB.id }, data: { name: "hijacked" } })).rejects.toThrow();
    await expect(dbA.customer.delete({ where: { id: belongsToB.id } })).rejects.toThrow();

    const stillIntact = await prisma.customer.findUnique({ where: { id: belongsToB.id } });
    expect(stillIntact?.name).toBe("B's customer");
  });
});
