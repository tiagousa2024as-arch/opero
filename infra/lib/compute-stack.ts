import { Annotations, CfnOutput, Duration, Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";
import type { Construct } from "constructs";

export interface ComputeStackProps extends StackProps {
  vpc: ec2.IVpc;
  dbInstance: rds.DatabaseInstance;
  attachmentsBucket: s3.Bucket;
  appSecrets: secretsmanager.Secret;
  redisEndpoint: string;
  remindersQueue: sqs.Queue;
  billingQueue: sqs.Queue;
  /** PART F Phase 4 — off by default; see infra/README.md before flipping it on. */
  enableWaf?: boolean;
  /** PART F Phase 4 — off by default; see infra/README.md before flipping it on. */
  enableBlueGreen?: boolean;
}

/**
 * Phase 3 compute (PART F): ECS Fargate behind an ALB, replacing the
 * Phase 1/2 App Runner service (see git history) now that there's a
 * reason to want the finer network control — private subnets, a shared
 * cluster with the worker service, Redis reachability. `apps/worker` gets
 * its own service in this same cluster (see WorkerStack) with no ALB,
 * since it's a background consumer, not something that answers requests.
 *
 * `enableWaf` and `enableBlueGreen` are Phase 4 (PART F) additions, gated
 * off by default the same way DatabaseStack gates Multi-AZ/read-replica —
 * see that file's comment for why.
 */
export class ComputeStack extends Stack {
  public readonly cluster: ecs.Cluster;
  public readonly repository: ecr.Repository;
  public readonly service: ecs.FargateService;
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    this.repository = new ecr.Repository(this, "WebRepository", {
      repositoryName: "opero-web",
      imageScanOnPush: true,
      lifecycleRules: [{ maxImageCount: 20 }],
    });

    this.cluster = new ecs.Cluster(this, "Cluster", { vpc: props.vpc, clusterName: "opero" });

    const dbSecret = props.dbInstance.secret;
    if (!dbSecret) {
      throw new Error("DatabaseStack must be created with a generated secret (rds.Credentials.fromGeneratedSecret)");
    }

    const taskDefinition = new ecs.FargateTaskDefinition(this, "WebTaskDef", { cpu: 512, memoryLimitMiB: 1024 });
    props.attachmentsBucket.grantReadWrite(taskDefinition.taskRole);
    props.appSecrets.grantRead(taskDefinition.taskRole);
    dbSecret.grantRead(taskDefinition.taskRole);
    props.remindersQueue.grantSendMessages(taskDefinition.taskRole);

    const container = taskDefinition.addContainer("web", {
      image: ecs.ContainerImage.fromEcrRepository(this.repository, "latest"),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "opero-web" }),
      environment: {
        NODE_ENV: "production",
        PORT: "3000",
        DB_HOST: props.dbInstance.dbInstanceEndpointAddress,
        DB_PORT: props.dbInstance.dbInstanceEndpointPort,
        DB_NAME: "opero",
        AWS_S3_BUCKET_ATTACHMENTS: props.attachmentsBucket.bucketName,
        REDIS_URL: `redis://${props.redisEndpoint}:6379`,
        SQS_QUEUE_URL_REMINDERS: props.remindersQueue.queueUrl,
        SQS_QUEUE_URL_BILLING: props.billingQueue.queueUrl,
        PAYMENT_PROVIDER: "mock", // flip to "asaas" once ASAAS_API_KEY is set for real (PART G)
      },
      secrets: {
        DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, "username"),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, "password"),
        NEXTAUTH_SECRET: ecs.Secret.fromSecretsManager(props.appSecrets, "NEXTAUTH_SECRET"),
        ASAAS_API_KEY: ecs.Secret.fromSecretsManager(props.appSecrets, "ASAAS_API_KEY"),
        ASAAS_WEBHOOK_TOKEN: ecs.Secret.fromSecretsManager(props.appSecrets, "ASAAS_WEBHOOK_TOKEN"),
      },
      portMappings: [{ containerPort: 3000 }],
      healthCheck: {
        command: ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/api/health',r=>process.exit(r.statusCode===200?0:1))\""],
        interval: Duration.seconds(15),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(30),
      },
    });

    this.alb = new elbv2.ApplicationLoadBalancer(this, "Alb", { vpc: props.vpc, internetFacing: true });

    if (props.enableBlueGreen) {
      // CodeDeploy blue/green: the service's deployment controller hands
      // target-group registration to CodeDeploy instead of ECS's own
      // rolling update, so the service is wired to the blue target group
      // directly via `loadBalancers` rather than the usual
      // `listener.addTargets(...)` helper (which assumes ECS_NATIVE).
      const blueTargetGroup = new elbv2.ApplicationTargetGroup(this, "BlueTargetGroup", {
        vpc: props.vpc,
        port: 3000,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: { path: "/api/health", interval: Duration.seconds(15), healthyThresholdCount: 2 },
      });
      const greenTargetGroup = new elbv2.ApplicationTargetGroup(this, "GreenTargetGroup", {
        vpc: props.vpc,
        port: 3000,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: { path: "/api/health", interval: Duration.seconds(15), healthyThresholdCount: 2 },
      });
      const listener = this.alb.addListener("HttpListener", {
        port: 80,
        open: true,
        defaultTargetGroups: [blueTargetGroup],
      });

      this.service = new ecs.FargateService(this, "WebService", {
        serviceName: "opero-web",
        cluster: this.cluster,
        taskDefinition,
        desiredCount: 1,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        deploymentController: { type: ecs.DeploymentControllerType.CODE_DEPLOY },
        // minHealthyPercent/maxHealthyPercent/circuitBreaker are ECS-native
        // rolling-update settings — meaningless once CodeDeploy owns the
        // deployment, so they're intentionally left unset here.
      });
      Annotations.of(this.service).acknowledgeWarning(
        "@aws-cdk/aws-ecs:minHealthyPercent",
        "Deployment is owned by CodeDeploy (deploymentController: CODE_DEPLOY) — ECS's own rolling-update minHealthyPercent/maxHealthyPercent don't apply.",
      );
      this.service.attachToApplicationTargetGroup(blueTargetGroup);

      const application = new codedeploy.EcsApplication(this, "WebCodeDeployApp", { applicationName: "opero-web" });
      new codedeploy.EcsDeploymentGroup(this, "WebDeploymentGroup", {
        application,
        service: this.service,
        deploymentGroupName: "opero-web",
        blueGreenDeploymentConfig: {
          blueTargetGroup,
          greenTargetGroup,
          listener,
        },
        deploymentConfig: codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
      });
    } else {
      this.service = new ecs.FargateService(this, "WebService", {
        serviceName: "opero-web",
        cluster: this.cluster,
        taskDefinition,
        desiredCount: 1,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        circuitBreaker: { rollback: true },
        // With desiredCount 1, the ECS default (min 50%) would let a
        // deployment scale down to 0 running tasks before the replacement
        // is up. This starts the new task first instead.
        minHealthyPercent: 100,
        maxHealthyPercent: 200,
      });

      const listener = this.alb.addListener("HttpListener", { port: 80, open: true });
      listener.addTargets("WebTarget", {
        port: 3000,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [this.service],
        healthCheck: { path: "/api/health", interval: Duration.seconds(15), healthyThresholdCount: 2 },
      });
    }

    if (props.enableWaf) {
      const webAcl = new wafv2.CfnWebACL(this, "WebAcl", {
        scope: "REGIONAL",
        defaultAction: { allow: {} },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: "opero-web-waf",
        },
        rules: [
          {
            name: "AWS-AWSManagedRulesCommonRuleSet",
            priority: 0,
            overrideAction: { none: {} },
            statement: { managedRuleGroupStatement: { vendorName: "AWS", name: "AWSManagedRulesCommonRuleSet" } },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: "opero-web-common-rules",
            },
          },
          {
            name: "AWS-AWSManagedRulesKnownBadInputsRuleSet",
            priority: 1,
            overrideAction: { none: {} },
            statement: { managedRuleGroupStatement: { vendorName: "AWS", name: "AWSManagedRulesKnownBadInputsRuleSet" } },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: "opero-web-bad-inputs",
            },
          },
        ],
      });

      new wafv2.CfnWebACLAssociation(this, "WebAclAssociation", {
        resourceArn: this.alb.loadBalancerArn,
        webAclArn: webAcl.attrArn,
      });
    }

    new CfnOutput(this, "AlbDnsName", { value: this.alb.loadBalancerDnsName });
    new CfnOutput(this, "EcrRepositoryUri", { value: this.repository.repositoryUri });
  }
}
