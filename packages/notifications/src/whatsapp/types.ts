export interface SendWhatsAppMessageInput {
  /** E.164-ish phone number, e.g. "+5511999999999". */
  to: string;
  message: string;
}

export interface SendWhatsAppMessageResult {
  provider: string;
  externalId: string | null;
}

/**
 * PART G lists the BSP choice (Meta Cloud API direct vs. Z-API/Gupshup/
 * Twilio) as still open. This interface is the seam: whichever gets
 * picked, only a new class implementing it plus a branch in
 * `getWhatsAppGateway()` (./index.ts) should be needed — never a change
 * to the code that sends reminders.
 */
export interface WhatsAppGateway {
  readonly provider: string;
  sendMessage(input: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult>;
}
