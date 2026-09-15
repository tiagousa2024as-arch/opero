import { Duration, Stack, type StackProps } from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";

/**
 * The two queues PART F Phase 3 calls for — reminders and recurring
 * billing — each with its own dead-letter queue so a message that keeps
 * failing (a bad appointment id, a provider outage) doesn't retry
 * forever; it lands on the DLQ after 5 attempts for someone to look at.
 */
export class QueueStack extends Stack {
  public readonly remindersQueue: sqs.Queue;
  public readonly billingQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.remindersQueue = new sqs.Queue(this, "RemindersQueue", {
      queueName: "opero-reminders",
      visibilityTimeout: Duration.seconds(30),
      deadLetterQueue: {
        maxReceiveCount: 5,
        queue: new sqs.Queue(this, "RemindersDlq", { queueName: "opero-reminders-dlq" }),
      },
    });

    this.billingQueue = new sqs.Queue(this, "BillingQueue", {
      queueName: "opero-billing",
      visibilityTimeout: Duration.seconds(30),
      deadLetterQueue: {
        maxReceiveCount: 5,
        queue: new sqs.Queue(this, "BillingDlq", { queueName: "opero-billing-dlq" }),
      },
    });
  }
}
