"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenantSession, assertCan } from "@opero/auth";

export async function createBranchAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "filiais", "write");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nome é obrigatório.");

  const branch = await db.branch.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      address: String(formData.get("address") ?? "").trim() || null,
    },
  });

  revalidatePath("/filiais");
  redirect(`/filiais/${branch.id}`);
}

export async function updateBranchAction(branchId: string, formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "filiais", "write");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nome é obrigatório.");

  await db.branch.update({
    where: { id: branchId },
    data: {
      name,
      address: String(formData.get("address") ?? "").trim() || null,
      active: formData.get("active") === "on",
    },
  });

  revalidatePath("/filiais");
  revalidatePath(`/filiais/${branchId}`);
}
