"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenantSession, assertCan } from "@opero/auth";
import type { AppointmentStatus } from "@opero/database";

export async function createAppointmentAction(formData: FormData) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "agenda", "write");

  const customerId = String(formData.get("customerId") ?? "");
  const assignedUserId = String(formData.get("assignedUserId") ?? "") || null;
  const startTimeRaw = String(formData.get("startTime") ?? "");
  const endTimeRaw = String(formData.get("endTime") ?? "");

  if (!customerId || !startTimeRaw || !endTimeRaw) {
    throw new Error("Cliente, início e fim são obrigatórios.");
  }

  await db.appointment.create({
    data: {
      tenantId: session.user.tenantId,
      customerId,
      assignedUserId,
      startTime: new Date(startTimeRaw),
      endTime: new Date(endTimeRaw),
    },
  });

  revalidatePath("/agenda");
  redirect("/agenda");
}

export async function updateAppointmentStatusAction(appointmentId: string, status: AppointmentStatus) {
  const { db, session } = await requireTenantSession();
  assertCan(session.user.role as any, "agenda", "write");

  await db.appointment.update({ where: { id: appointmentId }, data: { status } });

  revalidatePath("/agenda");
}
