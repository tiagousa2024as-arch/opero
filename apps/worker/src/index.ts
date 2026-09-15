import { startScheduler } from "./scheduler";
import { startConsumers } from "./consumer";

const controller = new AbortController();

console.log("[worker] starting — reminders + recurring billing consumer, appointment-reminder scheduler");

startScheduler(controller.signal);
const consumerLoops = startConsumers(controller.signal);

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    console.log(`[worker] received ${signal}, shutting down`);
    controller.abort();
  });
}

Promise.allSettled(consumerLoops).then(() => {
  console.log("[worker] all consumer loops stopped, exiting");
  process.exit(0);
});
