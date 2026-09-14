import { enqueueDueReminders } from "./handlers/appointment-reminders";

const INTERVAL_MS = Number(process.env.SCHEDULER_INTERVAL_MS ?? 5 * 60 * 1000);

export function startScheduler(signal: AbortSignal): void {
  async function tick() {
    try {
      const count = await enqueueDueReminders();
      if (count > 0) console.log(`[worker] enqueued ${count} appointment reminder(s)`);
    } catch (err) {
      console.error("[worker] scheduler tick failed", err);
    }
  }

  void tick();
  const timer = setInterval(tick, INTERVAL_MS);
  signal.addEventListener("abort", () => clearInterval(timer));
}
