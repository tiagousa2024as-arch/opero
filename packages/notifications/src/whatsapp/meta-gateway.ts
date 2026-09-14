import type { WhatsAppGateway, SendWhatsAppMessageInput, SendWhatsAppMessageResult } from "./types";

/**
 * Direct WhatsApp Business Cloud API (Meta) integration — requires a real
 * Meta Business/App setup with a verified phone number (PART G). Sends
 * free-form text, which only works inside the 24h customer-service
 * window Meta defines; sending outside it (a cold reminder) requires an
 * approved message template instead. Swap `sendMessage`'s body for a
 * template payload once templates are approved for this WABA.
 */
export class MetaWhatsAppGateway implements WhatsAppGateway {
  readonly provider = "meta";

  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
  ) {}

  async sendMessage(input: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult> {
    const res = await fetch(`https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to.replace(/\D/g, ""),
        type: "text",
        text: { body: input.message },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`WhatsApp Cloud API error (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { messages?: { id: string }[] };
    return { provider: this.provider, externalId: data.messages?.[0]?.id ?? null };
  }
}
