import { CfnOutput, Duration, Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as apprunner from "@aws-cdk/aws-apprunner-alpha";
import type { Construct } from "constructs";

export interface ComputeStackProps extends StackProps {
  vpc: ec2.IVpc;
  dbInstance: rds.DatabaseInstance;
  attachmentsBucket: s3.Bucket;
  appSecrets: secretsmanager.Secret;
}

/**
 * Phase 1 compute per PART B: App Runner reading a container image from
 * ECR, auto-deployed on push. Migrating to ECS Fargate behind an ALB is
 * explicitly Phase 3 work — don't build that here.
 */
export class ComputeStack extends Stack {
  public readonly repository: ecr.Repository;
  public readonly service: apprunner.Service;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    this.repository = new ecr.Repository(this, "WebRepository", {
      repositoryName: "opero-web",
      imageScanOnPush: true,
      lifecycleRules: [{ maxImageCount: 20 }],
    });

    // App Runner reaches RDS over this VPC connector instead of the public
    // internet — RDS keeps `publiclyAccessible: false` (see DatabaseStack,
    // whose security group allows the whole VPC CIDR on 5432 rather than
    // this specific SG, to avoid a cross-stack dependency cycle).
    const connectorSecurityGroup = new ec2.SecurityGroup(this, "AppRunnerConnectorSg", {
      vpc: props.vpc,
      description: "OPERO App Runner VPC connector",
      allowAllOutbound: true,
    });

    const vpcConnector = new apprunner.VpcConnector(this, "VpcConnector", {
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }),
      securityGroups: [connectorSecurityGroup],
    });

    const instanceRole = new iam.Role(this, "InstanceRole", {
      assumedBy: new iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
      description: "Permissions the running OPERO web container needs (S3 attachments, its own secrets).",
    });
    props.attachmentsBucket.grantReadWrite(instanceRole);
    props.appSecrets.grantRead(instanceRole);
    props.dbInstance.secret?.grantRead(instanceRole);

    const dbSecret = props.dbInstance.secret;
    if (!dbSecret) {
      throw new Error("DatabaseStack must be created with a generated secret (rds.Credentials.fromGeneratedSecret)");
    }

    this.service = new apprunner.Service(this, "WebService", {
      serviceName: "opero-web",
      source: apprunner.Source.fromEcr({
        repository: this.repository,
        tagOrDigest: "latest",
        imageConfiguration: {
          port: 3000,
          environmentVariables: {
            NODE_ENV: "production",
            PORT: "3000",
            DB_HOST: props.dbInstance.dbInstanceEndpointAddress,
            DB_PORT: props.dbInstance.dbInstanceEndpointPort,
            DB_NAME: "opero",
            AWS_S3_BUCKET_ATTACHMENTS: props.attachmentsBucket.bucketName,
            PAYMENT_PROVIDER: "mock", // flip to "asaas" once ASAAS_API_KEY is set for real (PART G)
          },
          environmentSecrets: {
            DB_USERNAME: apprunner.Secret.fromSecretsManager(dbSecret, "username"),
            DB_PASSWORD: apprunner.Secret.fromSecretsManager(dbSecret, "password"),
            NEXTAUTH_SECRET: apprunner.Secret.fromSecretsManager(props.appSecrets, "NEXTAUTH_SECRET"),
            ASAAS_API_KEY: apprunner.Secret.fromSecretsManager(props.appSecrets, "ASAAS_API_KEY"),
            ASAAS_WEBHOOK_TOKEN: apprunner.Secret.fromSecretsManager(props.appSecrets, "ASAAS_WEBHOOK_TOKEN"),
          },
        },
      }),
      instanceRole,
      vpcConnector,
      autoDeploymentsEnabled: true,
      cpu: apprunner.Cpu.ONE_VCPU,
      memory: apprunner.Memory.TWO_GB,
      healthCheck: apprunner.HealthCheck.http({
        path: "/api/health",
        interval: Duration.seconds(10),
        timeout: Duration.seconds(5),
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      }),
    });

    new CfnOutput(this, "ServiceUrl", { value: this.service.serviceUrl });
    new CfnOutput(this, "EcrRepositoryUri", { value: this.repository.repositoryUri });
  }
}
