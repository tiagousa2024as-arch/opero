import { prisma, getTenantClient } from "@opero/database";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import type { ChargeStatus } from "./types";

/**
 * Applies a gateway-reported status to the Invoice it belongs to, cascading
 * a PAID transition into a Transaction (income) — this is the one place
 * that keeps Invoice and Transaction in sync, called from both the webhook
 * route and the mock "mark as paid" dev action.
 *
 * Runs outside any tenant session (a webhook has none), so it looks the
 * invoice up with the raw admin client first to learn which tenant it
 * belongs to, then does every write through that tenant's scoped client.
 */
export async function applyInvoiceStatus(gatewayReference: string, status: ChargeStatus) {
  const invoice = await prisma.invoice.findFirst({ where: { gatewayReference } });
  if (!invoice) return null;

  const db = getTenantClient(invoice.tenantId);

  if (invoice.status === "PAID" && status === "PAID") {
    return invoice; // already processed — the gateway's own webhook can retry/duplicate
  }

  await db.invoice.update({ where: { id: invoice.id }, data: { status } });

  if (status === "PAID") {
    await db.transaction.create({
      data: {
        tenantId: invoice.tenantId,
        type: "INCOME",
        category: "Cobrança",
        amount: invoice.amount,
        date: new Date(),
        relatedInvoiceId: invoice.id,
        description: `Pagamento recebido — cobrança ${invoice.id}`,
      },
    });

    // OPERO's own outbound webhooks (/configuracoes/integracoes) — not to
    // be confused with the gateway's inbound webhook that got us here.
    await dispatchWebhookEvent(db, "invoice.paid", { invoiceId: invoice.id, amount: Number(invoice.amount) });
  }

  return invoice;
}
