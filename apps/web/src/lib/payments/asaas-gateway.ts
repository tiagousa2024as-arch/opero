import type { PaymentGateway, CreateChargeInput, CreateChargeResult, WebhookEvent } from "./types";

const BILLING_TYPE: Record<CreateChargeInput["paymentMethod"], string> = {
  PIX: "PIX",
  BOLETO: "BOLETO",
  CREDIT_CARD: "CREDIT_CARD",
};

// https://docs.asaas.com/reference/status-do-pagamento
const ASAAS_STATUS_MAP: Record<string, WebhookEvent["status"]> = {
  PENDING: "PENDING",
  AWAITING_RISK_ANALYSIS: "PENDING",
  CONFIRMED: "PAID",
  RECEIVED: "PAID",
  RECEIVED_IN_CASH: "PAID",
  OVERDUE: "OVERDUE",
  REFUNDED: "CANCELED",
  REFUND_REQUESTED: "CANCELED",
  CHARGEBACK_REQUESTED: "CANCELED",
  DELETED: "CANCELED",
};

/**
 * Requires a real Asaas merchant account (ASAAS_API_KEY) — see PART G of
 * the blueprint. Until that account exists, PAYMENT_PROVIDER should stay
 * "mock" so `/cobrancas` keeps working without a live gateway.
 */
export class AsaasGateway implements PaymentGateway {
  readonly provider = "asaas";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        access_token: this.apiKey,
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Asaas API error (${res.status}): ${body}`);
    }
    return res.json() as Promise<T>;
  }

  private async findOrCreateCustomer(customer: CreateChargeInput["customer"]): Promise<string> {
    if (customer.document) {
      const found = await this.request<{ data: { id: string }[] }>(
        `/customers?cpfCnpj=${encodeURIComponent(customer.document)}`,
      );
      if (found.data[0]) return found.data[0].id;
    }

    const created = await this.request<{ id: string }>("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: customer.name,
        cpfCnpj: customer.document ?? undefined,
        email: customer.email ?? undefined,
        phone: customer.phone ?? undefined,
      }),
    });
    return created.id;
  }

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    const asaasCustomerId = await this.findOrCreateCustomer(input.customer);

    const payment = await this.request<{ id: string; invoiceUrl: string | null }>("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: BILLING_TYPE[input.paymentMethod],
        value: input.amount,
        dueDate: input.dueDate.toISOString().slice(0, 10),
        description: input.description,
        externalReference: input.externalReference,
      }),
    });

    return { gatewayReference: payment.id, paymentLinkUrl: payment.invoiceUrl };
  }

  parseWebhookEvent(payload: unknown): WebhookEvent | null {
    const p = payload as { payment?: { id?: string; status?: string } };
    const asaasStatus = p?.payment?.status;
    const id = p?.payment?.id;
    if (!id || !asaasStatus) return null;

    const status = ASAAS_STATUS_MAP[asaasStatus];
    if (!status) return null;

    return { gatewayReference: id, status };
  }
}
