import { prisma } from "@opero/database";
import { getWhatsAppGateway } from "./whatsapp";

/**
 * Sends a WhatsApp reminder for one appointment and records it as a
 * Notification. Used both from the web app (a manual "send now" action on
 * /agenda) and from apps/worker's scheduled reminder pass — so, like
 * applyInvoiceStatus in the web app's payments lib, it takes a bare ID and
 * resolves its own tenant scope from the row rather than assuming a
 * request-scoped session exists.
 */
export async function sendAppointmentReminder(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: true },
  });
  if (!appointment) return null;
  if (!appointment.customer.phone) {
    throw new Error("Cliente não tem telefone cadastrado.");
  }

  const notification = await prisma.notification.create({
    data: {
      tenantId: appointment.tenantId,
      type: "appointment_reminder",
      channel: "WHATSAPP",
      target: appointment.customer.phone,
      status: "PENDING",
    },
  });

  const gateway = getWhatsAppGateway();
  const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(appointment.startTime);

  try {
    await gateway.sendMessage({
      to: appointment.customer.phone,
      message: `Olá ${appointment.customer.name}! Lembrete do seu agendamento em ${when}. Até lá!`,
    });
    await prisma.notification.update({ where: { id: notification.id }, data: { status: "SENT", sentAt: new Date() } });
  } catch (err) {
    await prisma.notification.update({ where: { id: notification.id }, data: { status: "FAILED" } });
    throw err;
  }

  return notification;
}
