import { SQSClient } from "@aws-sdk/client-sqs";

export const sqs = new SQSClient({ region: process.env.AWS_REGION ?? "sa-east-1" });

export const QUEUE_URLS = {
  reminders: process.env.SQS_QUEUE_URL_REMINDERS,
  billing: process.env.SQS_QUEUE_URL_BILLING,
} as const;
