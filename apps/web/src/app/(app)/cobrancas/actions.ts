"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenantSession, assertCan } from "@opero/auth";
import { getPaymentGateway } from "@/lib/payments";
import { applyInvoiceStatus } from "@/lib/payments/apply-invoice-status";
import type { PaymentMethod } from "@opero/database";

export async function createInvoiceAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "cobrancas", "write");

  const customerId = String(formData.get("customerId") ?? "");
  const serviceOrderId = String(formData.get("serviceOrderId") ?? "") || null;
  const amount = Number(formData.get("amount") ?? 0);
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "PIX") as PaymentMethod;

  if (!customerId || amount <= 0 || !dueDateRaw) {
    throw new Error("Cliente, valor e vencimento são obrigatórios.");
  }

  const customer = await db.customer.findUniqueOrThrow({ where: { id: customerId } });
  const dueDate = new Date(dueDateRaw);

  const invoice = await db.invoice.create({
    data: { tenantId: session.user.tenantId, customerId, serviceOrderId, amount, dueDate, paymentMethod, status: "PENDING" },
  });

  const gateway = getPaymentGateway();
  const charge = await gateway.createCharge({
    amount,
    dueDate,
    description: `Cobrança OPERO — ${customer.name}`,
    customer: { name: customer.name, document: customer.document, email: customer.email, phone: customer.phone },
    externalReference: invoice.id,
    paymentMethod,
  });

  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      gatewayReference: charge.gatewayReference,
      gatewayProvider: gateway.provider,
      paymentLinkUrl: charge.paymentLinkUrl,
    },
  });

  revalidatePath("/cobrancas");
  redirect(`/cobrancas/${invoice.id}`);
}

/** Dev-only stand-in for the webhook a real gateway would send. */
export async function markInvoicePaidAction(invoiceId: string, formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "cobrancas", "write");

  const invoice = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.gatewayProvider !== "mock" || !invoice.gatewayReference) {
    throw new Error("Esta ação só está disponível para cobranças do gateway de teste.");
  }

  await applyInvoiceStatus(invoice.gatewayReference, "PAID");

  revalidatePath("/cobrancas");
  revalidatePath(`/cobrancas/${invoiceId}`);
}

export async function cancelInvoiceAction(invoiceId: string, formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "cobrancas", "write");

  await db.invoice.update({ where: { id: invoiceId }, data: { status: "CANCELED" } });

  revalidatePath("/cobrancas");
  revalidatePath(`/cobrancas/${invoiceId}`);
}
