"use server";

import { revalidatePath } from "next/cache";
import { requireTenantSession, assertCan } from "@opero/auth";

export async function updateBrandingAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "configuracoes", "write");

  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: session.user.tenantId } });
  const settings = (tenant.settings as Record<string, unknown>) ?? {};

  const brandName = String(formData.get("brandName") ?? "").trim();
  const primaryColorHex = String(formData.get("primaryColorHex") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();

  if (primaryColorHex && !/^#[0-9a-fA-F]{6}$/.test(primaryColorHex)) {
    throw new Error("Cor deve estar no formato hexadecimal, ex: #1D4ED8.");
  }

  const nextSettings = { ...settings } as Record<string, unknown>;
  for (const [key, value] of [
    ["brandName", brandName],
    ["primaryColorHex", primaryColorHex],
    ["logoUrl", logoUrl],
  ] as const) {
    if (value) nextSettings[key] = value;
    else delete nextSettings[key];
  }

  await db.tenant.update({
    where: { id: session.user.tenantId },
    data: { settings: nextSettings },
  });

  revalidatePath("/configuracoes/marca-branca");
  revalidatePath("/", "layout");
}
