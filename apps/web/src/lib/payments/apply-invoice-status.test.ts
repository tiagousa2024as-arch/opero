import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@opero/database";
import { applyInvoiceStatus } from "./apply-invoice-status";

describe("applyInvoiceStatus", () => {
  let tenantId: string;
  let customerId: string;

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({ data: { name: "Billing test tenant" } });
    tenantId = tenant.id;
    const customer = await prisma.customer.create({ data: { tenantId, name: "Billing test customer" } });
    customerId = customer.id;
  });

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it("moves an invoice from PENDING to PAID and creates an income transaction", async () => {
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        customerId,
        amount: 150,
        dueDate: new Date(),
        status: "PENDING",
        gatewayProvider: "mock",
        gatewayReference: "mock_test_1",
      },
    });

    await applyInvoiceStatus("mock_test_1", "PAID");

    const updated = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(updated.status).toBe("PAID");

    const transactions = await prisma.transaction.findMany({ where: { relatedInvoiceId: invoice.id } });
    expect(transactions).toHaveLength(1);
    const transaction = transactions[0]!;
    expect(transaction.type).toBe("INCOME");
    expect(Number(transaction.amount)).toBe(150);
  });

  it("is idempotent — a duplicate PAID webhook does not create a second transaction", async () => {
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        customerId,
        amount: 80,
        dueDate: new Date(),
        status: "PENDING",
        gatewayProvider: "mock",
        gatewayReference: "mock_test_2",
      },
    });

    await applyInvoiceStatus("mock_test_2", "PAID");
    await applyInvoiceStatus("mock_test_2", "PAID");

    const transactions = await prisma.transaction.findMany({ where: { relatedInvoiceId: invoice.id } });
    expect(transactions).toHaveLength(1);
  });

  it("ignores an unknown gateway reference", async () => {
    const result = await applyInvoiceStatus("does-not-exist", "PAID");
    expect(result).toBeNull();
  });
});
