#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { DatabaseStack } from "../lib/database-stack";
import { StorageStack } from "../lib/storage-stack";
import { EmailStack } from "../lib/email-stack";
import { SecretsStack } from "../lib/secrets-stack";
import { ComputeStack } from "../lib/compute-stack";
import { ObservabilityStack } from "../lib/observability-stack";

const app = new cdk.App();

// AWS account & region come from the deployer's environment (AWS_PROFILE /
// AWS_ACCESS_KEY_ID etc.), never hardcoded — see PART G: "an AWS account
// with billing configured must exist before Phase 2 begins."
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "sa-east-1",
};

const stackProps = { env, tags: { project: "opero", phase: "2" } };

const network = new NetworkStack(app, "Opero-Network", stackProps);

const database = new DatabaseStack(app, "Opero-Database", { ...stackProps, vpc: network.vpc });

const storage = new StorageStack(app, "Opero-Storage", stackProps);

new EmailStack(app, "Opero-Email", { ...stackProps, domainName: "opero.com.br" });

const secrets = new SecretsStack(app, "Opero-Secrets", stackProps);

const compute = new ComputeStack(app, "Opero-Compute", {
  ...stackProps,
  vpc: network.vpc,
  dbInstance: database.instance,
  attachmentsBucket: storage.attachmentsBucket,
  appSecrets: secrets.appSecrets,
});

new ObservabilityStack(app, "Opero-Observability", {
  ...stackProps,
  dbInstance: database.instance,
  service: compute.service,
});
