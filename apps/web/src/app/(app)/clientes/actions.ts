"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenantSession } from "@opero/auth";
import { assertCan } from "@opero/auth";

function parseCustomerForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nome é obrigatório.");

  return {
    name,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    document: String(formData.get("document") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

export async function createCustomerAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "clientes", "write");

  const data = parseCustomerForm(formData);
  const customer = await db.customer.create({ data: { ...data, tenantId: session.user.tenantId } });

  revalidatePath("/clientes");
  redirect(`/clientes/${customer.id}`);
}

export async function updateCustomerAction(customerId: string, formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "clientes", "write");

  const data = parseCustomerForm(formData);
  await db.customer.update({ where: { id: customerId }, data });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${customerId}`);
  redirect(`/clientes/${customerId}`);
}

/** Generates (or returns the existing) self-service booking link for this customer. */
export async function generateBookingLinkAction(customerId: string) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "clientes", "write");

  const existing = await db.customer.findUniqueOrThrow({ where: { id: customerId }, select: { publicBookingToken: true } });
  if (!existing.publicBookingToken) {
    const { randomBytes } = await import("crypto");
    await db.customer.update({
      where: { id: customerId },
      data: { publicBookingToken: randomBytes(16).toString("hex") },
    });
  }

  revalidatePath(`/clientes/${customerId}`);
}

export async function deleteCustomerAction(customerId: string) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "clientes", "write");

  await db.customer.delete({ where: { id: customerId } });

  revalidatePath("/clientes");
  redirect("/clientes");
}
