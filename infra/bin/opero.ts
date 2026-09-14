#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { DatabaseStack } from "../lib/database-stack";
import { StorageStack } from "../lib/storage-stack";
import { EmailStack } from "../lib/email-stack";
import { SecretsStack } from "../lib/secrets-stack";
import { QueueStack } from "../lib/queue-stack";
import { CacheStack } from "../lib/cache-stack";
import { ComputeStack } from "../lib/compute-stack";
import { WorkerStack } from "../lib/worker-stack";
import { ObservabilityStack } from "../lib/observability-stack";

const app = new cdk.App();

// AWS account & region come from the deployer's environment (AWS_PROFILE /
// AWS_ACCESS_KEY_ID etc.), never hardcoded — see PART G: "an AWS account
// with billing configured must exist before Phase 2 begins."
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "sa-east-1",
};

const stackProps = { env, tags: { project: "opero", phase: "3" } };

const network = new NetworkStack(app, "Opero-Network", stackProps);

const database = new DatabaseStack(app, "Opero-Database", { ...stackProps, vpc: network.vpc });

const storage = new StorageStack(app, "Opero-Storage", stackProps);

new EmailStack(app, "Opero-Email", { ...stackProps, domainName: "opero.com.br" });

const secrets = new SecretsStack(app, "Opero-Secrets", stackProps);

const queues = new QueueStack(app, "Opero-Queues", stackProps);

const cache = new CacheStack(app, "Opero-Cache", { ...stackProps, vpc: network.vpc });

const compute = new ComputeStack(app, "Opero-Compute", {
  ...stackProps,
  vpc: network.vpc,
  dbInstance: database.instance,
  attachmentsBucket: storage.attachmentsBucket,
  appSecrets: secrets.appSecrets,
  redisEndpoint: cache.cluster.attrRedisEndpointAddress,
  remindersQueue: queues.remindersQueue,
  billingQueue: queues.billingQueue,
});

const worker = new WorkerStack(app, "Opero-Worker", {
  ...stackProps,
  vpc: network.vpc,
  cluster: compute.cluster,
  dbInstance: database.instance,
  appSecrets: secrets.appSecrets,
  remindersQueue: queues.remindersQueue,
  billingQueue: queues.billingQueue,
});

new ObservabilityStack(app, "Opero-Observability", {
  ...stackProps,
  dbInstance: database.instance,
  webService: compute.service,
  workerService: worker.service,
  alb: compute.alb,
});
