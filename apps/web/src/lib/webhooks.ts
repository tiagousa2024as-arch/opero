import { createHmac } from "crypto";
import type { TenantClient } from "@opero/database";

/**
 * Fires a webhook event to every active webhook subscribed to it (or to
 * "*"), signing the payload so receivers can verify it actually came from
 * OPERO. Called synchronously from the action that caused the event
 * (e.g. an OS status change) but never lets a slow or failing receiver
 * fail that action — errors are swallowed after being logged to
 * WebhookDelivery.
 */
export async function dispatchWebhookEvent(db: TenantClient, event: string, payload: unknown): Promise<void> {
  const webhooks = await db.webhook.findMany({
    where: {
      active: true,
      OR: [{ events: { has: event } }, { events: { has: "*" } }],
    },
  });

  const body = JSON.stringify({ event, data: payload, sentAt: new Date().toISOString() });

  await Promise.all(
    webhooks.map(async (webhook) => {
      const signature = createHmac("sha256", webhook.secret).update(body).digest("hex");
      let statusCode: number | null = null;
      let success = false;
      let responseBody = "";

      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Opero-Event": event,
            "X-Opero-Signature": signature,
          },
          body,
          signal: AbortSignal.timeout(5000),
        });
        statusCode = res.status;
        success = res.ok;
        responseBody = (await res.text().catch(() => "")).slice(0, 500);
      } catch (err) {
        responseBody = err instanceof Error ? err.message : "unknown error";
      }

      await db.webhookDelivery
        .create({ data: { webhookId: webhook.id, event, statusCode, success, responseBody } })
        .catch((err) => console.error("[webhooks] failed to record delivery", err));
    }),
  );
}
