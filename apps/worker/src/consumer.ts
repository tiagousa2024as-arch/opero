import { DeleteMessageCommand, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { sqs, QUEUE_URLS } from "./sqs";
import { handleReminderMessage, type ReminderMessage } from "./handlers/appointment-reminders";
import { handleBillingMessage, type BillingMessage } from "./handlers/recurring-billing";

/**
 * Long-polls one SQS queue in a loop until `signal` aborts. A message is
 * deleted only after its handler resolves; a thrown error leaves it in
 * the queue to become visible again after the visibility timeout, so SQS
 * redrives it — after enough failed attempts (maxReceiveCount, set on the
 * queue in infra/lib/queue-stack.ts) it lands on the dead-letter queue
 * instead of retrying forever.
 */
async function pollQueue(queueUrl: string, handle: (body: unknown) => Promise<void>, signal: AbortSignal) {
  while (!signal.aborted) {
    const result = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 20,
      }),
    );

    for (const message of result.Messages ?? []) {
      try {
        if (!message.Body) continue;
        await handle(JSON.parse(message.Body));
        if (message.ReceiptHandle) {
          await sqs.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: message.ReceiptHandle }));
        }
      } catch (err) {
        console.error(`[worker] failed processing message from ${queueUrl}`, err);
      }
    }
  }
}

export function startConsumers(signal: AbortSignal): Promise<void>[] {
  const loops: Promise<void>[] = [];

  if (QUEUE_URLS.reminders) {
    loops.push(
      pollQueue(QUEUE_URLS.reminders, (body) => handleReminderMessage(body as ReminderMessage), signal),
    );
  } else {
    console.warn("[worker] SQS_QUEUE_URL_REMINDERS not set — reminder consumer disabled");
  }

  if (QUEUE_URLS.billing) {
    loops.push(pollQueue(QUEUE_URLS.billing, (body) => handleBillingMessage(body as BillingMessage), signal));
  } else {
    console.warn("[worker] SQS_QUEUE_URL_BILLING not set — billing consumer disabled");
  }

  return loops;
}
