import { Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { CfnOutput } from "aws-cdk-lib";
import type { Construct } from "constructs";

export interface WorkerStackProps extends StackProps {
  vpc: ec2.IVpc;
  cluster: ecs.Cluster;
  dbInstance: rds.DatabaseInstance;
  appSecrets: secretsmanager.Secret;
  remindersQueue: sqs.Queue;
  billingQueue: sqs.Queue;
}

/**
 * apps/worker as its own long-running ECS Fargate service — no ALB (it
 * answers no requests), sharing the cluster ComputeStack creates for
 * apps/web. Runs the scheduler + SQS consumer loop from
 * apps/worker/src/index.ts continuously. desiredCount is 1 in steady
 * state — enqueueDueReminders claims each appointment with an atomic
 * conditional update, so a second instance briefly running during a
 * rolling deploy can't double-enqueue, but there's still no reason to
 * run more than one all the time.
 */
export class WorkerStack extends Stack {
  public readonly repository: ecr.Repository;
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: WorkerStackProps) {
    super(scope, id, props);

    this.repository = new ecr.Repository(this, "WorkerRepository", {
      repositoryName: "opero-worker",
      imageScanOnPush: true,
      lifecycleRules: [{ maxImageCount: 20 }],
    });

    const dbSecret = props.dbInstance.secret;
    if (!dbSecret) {
      throw new Error("DatabaseStack must be created with a generated secret (rds.Credentials.fromGeneratedSecret)");
    }

    const taskDefinition = new ecs.FargateTaskDefinition(this, "WorkerTaskDef", { cpu: 256, memoryLimitMiB: 512 });
    dbSecret.grantRead(taskDefinition.taskRole);
    props.appSecrets.grantRead(taskDefinition.taskRole);
    props.remindersQueue.grantConsumeMessages(taskDefinition.taskRole);
    props.remindersQueue.grantSendMessages(taskDefinition.taskRole);
    props.billingQueue.grantConsumeMessages(taskDefinition.taskRole);

    taskDefinition.addContainer("worker", {
      image: ecs.ContainerImage.fromEcrRepository(this.repository, "latest"),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "opero-worker" }),
      environment: {
        NODE_ENV: "production",
        DB_HOST: props.dbInstance.dbInstanceEndpointAddress,
        DB_PORT: props.dbInstance.dbInstanceEndpointPort,
        DB_NAME: "opero",
        SQS_QUEUE_URL_REMINDERS: props.remindersQueue.queueUrl,
        SQS_QUEUE_URL_BILLING: props.billingQueue.queueUrl,
        WHATSAPP_PROVIDER: "mock", // flip to "meta" once WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID are set (PART G)
      },
      secrets: {
        DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, "username"),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, "password"),
      },
    });

    this.service = new ecs.FargateService(this, "WorkerService", {
      serviceName: "opero-worker",
      cluster: props.cluster,
      taskDefinition,
      desiredCount: 1,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      circuitBreaker: { rollback: true },
      // See ComputeStack's WebService for why: avoids a deploy briefly
      // dropping to 0 running tasks with desiredCount 1. Two workers
      // running for a moment during deploy is harmless — see
      // enqueueDueReminders' atomic claim in apps/worker for why that
      // can't cause a double-send.
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    new CfnOutput(this, "WorkerEcrRepositoryUri", { value: this.repository.repositoryUri });
  }
}
