import { randomUUID } from "crypto";
import type { PaymentGateway, CreateChargeInput, CreateChargeResult, WebhookEvent } from "./types";

/**
 * No real merchant account is needed to develop or demo against this
 * gateway — it's the default when PAYMENT_PROVIDER=mock or no gateway API
 * key is configured. Charges never actually get paid by a customer; the
 * `/cobrancas/[id]` page offers a "mark as paid" action when this provider
 * is active, standing in for the webhook a real gateway would send.
 */
export class MockGateway implements PaymentGateway {
  readonly provider = "mock";

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    const gatewayReference = `mock_${randomUUID()}`;
    return {
      gatewayReference,
      paymentLinkUrl: `https://mock-gateway.opero.local/pay/${gatewayReference}?amount=${input.amount}`,
    };
  }

  parseWebhookEvent(payload: unknown): WebhookEvent | null {
    const p = payload as { gatewayReference?: string; status?: string };
    if (!p?.gatewayReference || !p?.status) return null;
    return { gatewayReference: p.gatewayReference, status: p.status as WebhookEvent["status"] };
  }
}
