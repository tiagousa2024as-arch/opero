"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenantSession, assertCan } from "@opero/auth";
import type { UserRole } from "@opero/database";

export async function createTeamMemberAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "equipe", "write");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "STAFF") as UserRole;

  if (!name || !email) throw new Error("Nome e email são obrigatórios.");

  const tempPassword = randomBytes(6).toString("hex");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const user = await db.user.create({ data: { tenantId: session.user.tenantId, name, email, role, passwordHash } });

  revalidatePath("/equipe");
  redirect(`/equipe/${user.id}?tempPassword=${tempPassword}`);
}

export async function updateTeamMemberAction(userId: string, formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "equipe", "write");

  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "STAFF") as UserRole;
  const active = formData.get("active") === "on";

  await db.user.update({ where: { id: userId }, data: { name, role, active } });

  revalidatePath("/equipe");
  revalidatePath(`/equipe/${userId}`);
}
