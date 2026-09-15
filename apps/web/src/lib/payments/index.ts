import type { PaymentGateway } from "./types";
import { MockGateway } from "./mock-gateway";
import { AsaasGateway } from "./asaas-gateway";

export * from "./types";

let cached: PaymentGateway | null = null;

/**
 * Single entry point the rest of the app should import from — never
 * instantiate a gateway class directly. Falls back to the mock gateway
 * whenever the configured provider has no API key yet, so the product
 * keeps working end-to-end before a real merchant account exists.
 */
export function getPaymentGateway(): PaymentGateway {
  if (cached) return cached;

  const provider = process.env.PAYMENT_PROVIDER ?? "mock";

  if (provider === "asaas" && process.env.ASAAS_API_KEY) {
    cached = new AsaasGateway(process.env.ASAAS_API_KEY, process.env.ASAAS_BASE_URL ?? "https://api-sandbox.asaas.com/v3");
    return cached;
  }

  // provider === "pagarme" would go here once that integration is built —
  // see PART G, this is one of the vendor choices still pending.

  cached = new MockGateway();
  return cached;
}
