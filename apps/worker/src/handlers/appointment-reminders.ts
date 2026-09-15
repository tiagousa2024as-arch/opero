import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { prisma } from "@opero/database";
import { sendAppointmentReminder } from "@opero/notifications";
import { sqs, QUEUE_URLS } from "../sqs";

const REMINDER_WINDOW_START_HOURS = 20;
const REMINDER_WINDOW_END_HOURS = 28; // ~1 day ahead, wide enough that a scheduler tick never misses one

export type ReminderMessage = { type: "appointment_reminder"; appointmentId: string };

/**
 * Scheduler-side producer: finds appointments starting roughly a day out
 * that haven't had a reminder queued yet, and enqueues one each.
 *
 * Two scheduler instances can run this concurrently for a moment during
 * an ECS rolling deploy (see WorkerStack's minHealthyPercent comment), so
 * claiming an appointment has to be atomic: `updateMany` with
 * `reminderSentAt: null` still in the `where` only ever matches for one
 * caller — whichever runs second sees `count: 0` and skips it — rather
 * than both readers acting on the same findMany result before either has
 * written back.
 */
export async function enqueueDueReminders(): Promise<number> {
  if (!QUEUE_URLS.reminders) {
    console.warn("[worker] SQS_QUEUE_URL_REMINDERS not set — skipping reminder scheduling");
    return 0;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + REMINDER_WINDOW_START_HOURS * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_END_HOURS * 60 * 60 * 1000);

  const due = await prisma.appointment.findMany({
    where: {
      startTime: { gte: windowStart, lte: windowEnd },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      reminderSentAt: null,
    },
    select: { id: true },
  });

  let enqueued = 0;
  for (const appointment of due) {
    const claimed = await prisma.appointment.updateMany({
      where: { id: appointment.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (claimed.count === 0) continue; // another scheduler instance claimed it first

    const message: ReminderMessage = { type: "appointment_reminder", appointmentId: appointment.id };
    await sqs.send(new SendMessageCommand({ QueueUrl: QUEUE_URLS.reminders, MessageBody: JSON.stringify(message) }));
    enqueued++;
  }

  return enqueued;
}

/** Consumer-side handler for one dequeued reminder message. */
export async function handleReminderMessage(message: ReminderMessage): Promise<void> {
  await sendAppointmentReminder(message.appointmentId);
}
