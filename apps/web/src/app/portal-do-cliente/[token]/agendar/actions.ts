"use server";

import { prisma } from "@opero/database";

export async function requestAppointmentAction(token: string, formData: FormData) {
  const customer = await prisma.customer.findUnique({ where: { publicBookingToken: token } });
  if (!customer) throw new Error("Link inválido.");

  const startTimeRaw = String(formData.get("startTime") ?? "");
  if (!startTimeRaw) throw new Error("Escolha uma data e horário.");

  const startTime = new Date(startTimeRaw);
  if (startTime.getTime() < Date.now()) {
    throw new Error("Escolha uma data futura.");
  }
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  await prisma.appointment.create({
    data: {
      tenantId: customer.tenantId,
      customerId: customer.id,
      startTime,
      endTime,
      status: "SCHEDULED",
    },
  });
}
