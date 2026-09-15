import type { WhatsAppGateway } from "./types";
import { MockWhatsAppGateway } from "./mock-gateway";
import { MetaWhatsAppGateway } from "./meta-gateway";

export * from "./types";

let cached: WhatsAppGateway | null = null;

export function getWhatsAppGateway(): WhatsAppGateway {
  if (cached) return cached;

  const provider = process.env.WHATSAPP_PROVIDER ?? "mock";

  if (provider === "meta" && process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    cached = new MetaWhatsAppGateway(process.env.WHATSAPP_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID);
    return cached;
  }

  // provider === "zapi" | "gupshup" | "twilio" would go here — PART G lists
  // these as open BSP alternatives to a direct Meta integration.

  cached = new MockWhatsAppGateway();
  return cached;
}
