"use server";

import { revalidatePath } from "next/cache";
import { requireTenantSession, assertCan } from "@opero/auth";
import type { TransactionType } from "@opero/database";

export async function createTransactionAction(type: TransactionType, formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "financeiro", "write");

  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const dateRaw = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!category || amount <= 0 || !dateRaw) {
    throw new Error("Categoria, valor e data são obrigatórios.");
  }

  await db.transaction.create({
    data: { tenantId: session.user.tenantId, type, category, amount, date: new Date(dateRaw), description },
  });

  revalidatePath("/financeiro/fluxo-de-caixa");
  revalidatePath("/financeiro/contas-a-pagar");
  revalidatePath("/financeiro/relatorios");
}
