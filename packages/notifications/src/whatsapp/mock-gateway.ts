import { randomUUID } from "crypto";
import type { WhatsAppGateway, SendWhatsAppMessageInput, SendWhatsAppMessageResult } from "./types";

/**
 * Default when no WHATSAPP_TOKEN is configured. Logs instead of sending,
 * so reminders/nudges keep working end-to-end (visible in logs, recorded
 * as Notification rows) before a real BSP account exists.
 */
export class MockWhatsAppGateway implements WhatsAppGateway {
  readonly provider = "mock";

  async sendMessage(input: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult> {
    console.log(`[whatsapp:mock] -> ${input.to}: ${input.message}`);
    return { provider: this.provider, externalId: `mock_${randomUUID()}` };
  }
}
