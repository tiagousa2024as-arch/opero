import { NextResponse } from "next/server";
import { getPaymentGateway } from "@/lib/payments";
import { applyInvoiceStatus } from "@/lib/payments/apply-invoice-status";

// Asaas signs webhooks with a static token you configure on their dashboard
// and echo back in the `asaas-access-token` header — see ASAAS_WEBHOOK_TOKEN
// in .env.example. Reject anything that doesn't present it once configured.
export async function POST(req: Request) {
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (configuredToken) {
    const receivedToken = req.headers.get("asaas-access-token");
    if (receivedToken !== configuredToken) {
      return NextResponse.json({ error: "invalid webhook token" }, { status: 401 });
    }
  }

  const payload = await req.json().catch(() => null);
  const gateway = getPaymentGateway();
  const event = gateway.parseWebhookEvent(payload);

  if (!event) {
    return NextResponse.json({ error: "unrecognized payload" }, { status: 400 });
  }

  await applyInvoiceStatus(event.gatewayReference, event.status);

  return NextResponse.json({ ok: true });
}
