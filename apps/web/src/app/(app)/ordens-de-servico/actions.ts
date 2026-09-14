"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenantSession, assertCan } from "@opero/auth";
import type { ServiceOrderItemType, ServiceOrderStatus } from "@opero/database";

type ItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  type: ServiceOrderItemType;
  inventoryItemId?: string | null;
};

function parseItems(raw: string): ItemInput[] {
  const parsed = JSON.parse(raw || "[]");
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((i) => ({
      description: String(i.description ?? "").trim(),
      quantity: Number(i.quantity) || 0,
      unitPrice: Number(i.unitPrice) || 0,
      type: (i.type === "PART" ? "PART" : "SERVICE") as ServiceOrderItemType,
      inventoryItemId: i.inventoryItemId ? String(i.inventoryItemId) : null,
    }))
    .filter((i) => i.description && i.quantity > 0);
}

function totalOf(items: ItemInput[]) {
  return items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
}

export async function createServiceOrderAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "ordens_de_servico", "write");

  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) throw new Error("Selecione um cliente.");

  const assignedUserId = String(formData.get("assignedUserId") ?? "") || null;
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const items = parseItems(String(formData.get("itemsJson") ?? "[]"));

  const serviceOrder = await db.$transaction(async (tx) => {
    const created = await tx.serviceOrder.create({
      data: {
        tenantId: session.user.tenantId,
        customerId,
        assignedUserId,
        scheduledAt: scheduledAtRaw ? new Date(scheduledAtRaw) : null,
        notes,
        totalAmount: totalOf(items),
        items: { create: items },
      },
    });

    // Parts picked from stock consume it immediately — edits to an
    // existing OS don't re-reconcile this (see updateServiceOrderAction),
    // so this only ever fires once, at creation.
    for (const item of items) {
      if (!item.inventoryItemId) continue;
      const stockItem = await tx.inventoryItem.findUniqueOrThrow({ where: { id: item.inventoryItemId } });
      const remaining = Number(stockItem.quantity) - item.quantity;
      if (remaining < 0) {
        throw new Error(`Estoque insuficiente para "${stockItem.name}" (disponível: ${Number(stockItem.quantity)}).`);
      }
      await tx.inventoryItem.update({ where: { id: item.inventoryItemId }, data: { quantity: remaining } });
      await tx.inventoryMovement.create({
        data: {
          tenantId: session.user.tenantId,
          inventoryItemId: item.inventoryItemId,
          type: "OUT",
          quantity: item.quantity,
          relatedServiceOrderId: created.id,
        },
      });
    }

    return created;
  });

  await db.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "created",
      entity: "ServiceOrder",
      entityId: serviceOrder.id,
      metadata: {},
    },
  });

  revalidatePath("/ordens-de-servico");
  redirect(`/ordens-de-servico/${serviceOrder.id}`);
}

// Editing an OS re-enters freeform items only (see the [id]/editar page,
// which doesn't pass `inventoryItems` to the form) — stock was already
// consumed at creation time, and reconciling a stock delta against
// arbitrary item edits is out of scope for now, so the edit form
// deliberately doesn't expose the stock picker to avoid implying it does.
export async function updateServiceOrderAction(serviceOrderId: string, formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "ordens_de_servico", "write");

  const customerId = String(formData.get("customerId") ?? "");
  const assignedUserId = String(formData.get("assignedUserId") ?? "") || null;
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const items = parseItems(String(formData.get("itemsJson") ?? "[]"));

  await db.$transaction(async (tx) => {
    // serviceOrderItem carries no tenantId of its own — the extension can't
    // scope this delete, so we scope it explicitly through the parent, or a
    // serviceOrderId from another tenant would delete that tenant's items
    // before the (correctly tenant-scoped) update below ever runs.
    await tx.serviceOrderItem.deleteMany({
      where: { serviceOrderId, serviceOrder: { tenantId: session.user.tenantId } },
    });
    await tx.serviceOrder.update({
      where: { id: serviceOrderId },
      data: {
        customerId,
        assignedUserId,
        scheduledAt: scheduledAtRaw ? new Date(scheduledAtRaw) : null,
        notes,
        totalAmount: totalOf(items),
        items: { create: items },
      },
    });
  });

  revalidatePath("/ordens-de-servico");
  revalidatePath(`/ordens-de-servico/${serviceOrderId}`);
  redirect(`/ordens-de-servico/${serviceOrderId}`);
}

export async function updateServiceOrderStatusAction(serviceOrderId: string, status: ServiceOrderStatus) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "ordens_de_servico", "write");

  const previous = await db.serviceOrder.findUniqueOrThrow({ where: { id: serviceOrderId }, select: { status: true } });
  await db.serviceOrder.update({ where: { id: serviceOrderId }, data: { status } });

  await db.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "status_changed",
      entity: "ServiceOrder",
      entityId: serviceOrderId,
      metadata: { from: previous.status, to: status },
    },
  });

  revalidatePath(`/ordens-de-servico/${serviceOrderId}`);
  revalidatePath("/ordens-de-servico");
}

/** Generates (or returns the existing) public budget-approval link for this OS. */
export async function generatePublicTokenAction(serviceOrderId: string) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "ordens_de_servico", "write");

  const existing = await db.serviceOrder.findUniqueOrThrow({ where: { id: serviceOrderId }, select: { publicToken: true } });
  if (!existing.publicToken) {
    const { randomBytes } = await import("crypto");
    await db.serviceOrder.update({
      where: { id: serviceOrderId },
      data: { publicToken: randomBytes(16).toString("hex") },
    });
  }

  revalidatePath(`/ordens-de-servico/${serviceOrderId}`);
}

export async function deleteServiceOrderAction(serviceOrderId: string) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "ordens_de_servico", "write");

  await db.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "deleted",
      entity: "ServiceOrder",
      entityId: serviceOrderId,
      metadata: {},
    },
  });
  await db.serviceOrder.delete({ where: { id: serviceOrderId } });

  revalidatePath("/ordens-de-servico");
  redirect("/ordens-de-servico");
}
