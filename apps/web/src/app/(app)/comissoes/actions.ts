"use server";

import { revalidatePath } from "next/cache";
import { requireTenantSession, assertCan } from "@opero/auth";

export async function markCommissionPaidAction(commissionId: string) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "comissoes", "write");

  await db.commission.update({ where: { id: commissionId }, data: { paid: true } });

  revalidatePath("/comissoes");
}
