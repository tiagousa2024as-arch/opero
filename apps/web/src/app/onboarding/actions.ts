"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { requireTenantSession } from "@opero/auth";

export async function updateEmpresaAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  const name = String(formData.get("name") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim() || null;
  const segment = String(formData.get("segment") ?? "").trim();

  if (!name) throw new Error("Nome da empresa é obrigatório.");

  await db.tenant.update({
    where: { id: session.user.tenantId },
    data: { name, cnpj, settings: { segment } },
  });

  redirect("/onboarding/equipe");
}

export async function inviteTeamMemberAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "STAFF") as "ADMIN" | "STAFF" | "FINANCE";

  if (!name || !email) throw new Error("Nome e email são obrigatórios.");

  const tempPassword = randomBytes(6).toString("hex");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await db.user.create({
    data: { tenantId: session.user.tenantId, name, email, role, passwordHash },
  });

  return { tempPassword, email };
}

export async function selectPlanoAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  const plan = String(formData.get("plan") ?? "trial");

  await db.tenant.update({
    where: { id: session.user.tenantId },
    data: { plan },
  });

  redirect("/onboarding/concluido");
}
