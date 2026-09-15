export type PaymentMethodInput = "PIX" | "BOLETO" | "CREDIT_CARD";
export type ChargeStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELED";

export interface ChargeCustomer {
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface CreateChargeInput {
  amount: number;
  dueDate: Date;
  description: string;
  customer: ChargeCustomer;
  /** Our own Invoice.id — round-tripped so webhooks can match it back. */
  externalReference: string;
  paymentMethod: PaymentMethodInput;
}

export interface CreateChargeResult {
  gatewayReference: string;
  paymentLinkUrl: string | null;
}

export interface WebhookEvent {
  gatewayReference: string;
  status: ChargeStatus;
}

/**
 * Every Brazilian payment gateway (Asaas, Pagar.me, ...) implements this
 * shape. Swapping PAYMENT_PROVIDER should never require touching the
 * `/cobrancas` pages or actions — only this interface.
 */
export interface PaymentGateway {
  readonly provider: string;
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
  parseWebhookEvent(payload: unknown): WebhookEvent | null;
}
