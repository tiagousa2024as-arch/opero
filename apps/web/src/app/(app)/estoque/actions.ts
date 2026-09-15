"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenantSession, assertCan } from "@opero/auth";

export async function createInventoryItemAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "estoque", "write");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nome é obrigatório.");

  const item = await db.inventoryItem.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      sku: String(formData.get("sku") ?? "").trim() || null,
      quantity: Number(formData.get("quantity") ?? 0),
      unitCost: Number(formData.get("unitCost") ?? 0),
      unitPrice: Number(formData.get("unitPrice") ?? 0),
      lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 0),
    },
  });

  revalidatePath("/estoque");
  redirect(`/estoque/${item.id}`);
}

export async function updateInventoryItemAction(itemId: string, formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "estoque", "write");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nome é obrigatório.");

  await db.inventoryItem.update({
    where: { id: itemId },
    data: {
      name,
      sku: String(formData.get("sku") ?? "").trim() || null,
      unitCost: Number(formData.get("unitCost") ?? 0),
      unitPrice: Number(formData.get("unitPrice") ?? 0),
      lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 0),
    },
  });

  revalidatePath("/estoque");
  revalidatePath(`/estoque/${itemId}`);
}

/** Manual stock adjustment (restock, correction, loss) — not tied to a service order. */
export async function adjustStockAction(itemId: string, formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "estoque", "write");

  const type = String(formData.get("type") ?? "IN") as "IN" | "OUT";
  const quantity = Number(formData.get("quantity") ?? 0);
  if (quantity <= 0) throw new Error("Quantidade deve ser maior que zero.");

  await db.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId } });
    const delta = type === "IN" ? quantity : -quantity;
    const newQuantity = Number(item.quantity) + delta;
    if (newQuantity < 0) throw new Error("Estoque insuficiente para esta saída.");

    await tx.inventoryItem.update({ where: { id: itemId }, data: { quantity: newQuantity } });
    await tx.inventoryMovement.create({
      data: { tenantId: session.user.tenantId, inventoryItemId: itemId, type, quantity },
    });
  });

  revalidatePath("/estoque");
  revalidatePath(`/estoque/${itemId}`);
  revalidatePath("/estoque/movimentacoes");
}
