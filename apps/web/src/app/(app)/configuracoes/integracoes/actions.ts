"use server";

import { randomBytes, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { requireTenantSession, assertCan } from "@opero/auth";

export async function createApiKeyAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "integracoes", "write");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nome é obrigatório.");

  const plaintextKey = `opero_live_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(plaintextKey).digest("hex");

  await db.apiKey.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      keyHash,
      keyPrefix: plaintextKey.slice(0, 16),
    },
  });

  revalidatePath("/configuracoes/integracoes");
  return { plaintextKey };
}

export async function revokeApiKeyAction(apiKeyId: string) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "integracoes", "write");

  await db.apiKey.update({ where: { id: apiKeyId }, data: { revokedAt: new Date() } });
  revalidatePath("/configuracoes/integracoes");
}

const AVAILABLE_EVENTS = ["service_order.status_changed", "invoice.paid"] as const;

export async function createWebhookAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "integracoes", "write");

  const url = String(formData.get("url") ?? "").trim();
  if (!url || !url.startsWith("https://")) {
    throw new Error("Informe uma URL https:// válida.");
  }

  const events = AVAILABLE_EVENTS.filter((e) => formData.get(`event_${e}`) === "on");
  if (events.length === 0) throw new Error("Selecione ao menos um evento.");

  await db.webhook.create({
    data: {
      tenantId: session.user.tenantId,
      url,
      events,
      secret: randomBytes(24).toString("hex"),
    },
  });

  revalidatePath("/configuracoes/integracoes");
}

export async function deleteWebhookAction(webhookId: string) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "integracoes", "write");

  await db.webhook.delete({ where: { id: webhookId } });
  revalidatePath("/configuracoes/integracoes");
}
