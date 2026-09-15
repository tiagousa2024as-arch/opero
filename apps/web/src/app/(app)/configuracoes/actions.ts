"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireTenantSession, assertCan } from "@opero/auth";

export async function updateEmpresaSettingsAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "configuracoes", "write");

  const name = String(formData.get("name") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim() || null;
  if (!name) throw new Error("Nome da empresa é obrigatório.");

  await db.tenant.update({ where: { id: session.user.tenantId }, data: { name, cnpj } });
  revalidatePath("/configuracoes/empresa");
}

export async function createServiceCategoryAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "configuracoes", "write");

  const name = String(formData.get("name") ?? "").trim();
  const defaultPrice = Number(formData.get("defaultPrice") ?? 0);
  if (!name) throw new Error("Nome é obrigatório.");

  await db.serviceCategory.create({ data: { tenantId: session.user.tenantId, name, defaultPrice } });
  revalidatePath("/configuracoes/servicos");
}

export async function deleteServiceCategoryAction(categoryId: string) {
  const { session, db } = await requireTenantSession();
  assertCan(session.user.role as any, "configuracoes", "write");

  await db.serviceCategory.delete({ where: { id: categoryId } });
  revalidatePath("/configuracoes/servicos");
}

export async function updateNotificationSettingsAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "configuracoes", "write");

  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: session.user.tenantId } });
  const settings = (tenant.settings as Record<string, unknown>) ?? {};

  await db.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      settings: {
        ...settings,
        emailReminders: formData.get("emailReminders") === "on",
        whatsappReminders: formData.get("whatsappReminders") === "on",
      },
    },
  });

  revalidatePath("/configuracoes/notificacoes");
}

export async function updateUserProfileAction(formData: FormData) {
  const { db, session } = await requireTenantSession();

  const name = String(formData.get("name") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");

  const data: { name: string; passwordHash?: string } = { name };
  if (newPassword) {
    if (newPassword.length < 8) throw new Error("A nova senha deve ter ao menos 8 caracteres.");
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  await db.user.update({ where: { id: session.user.id }, data });
  revalidatePath("/configuracoes/usuario");
}
