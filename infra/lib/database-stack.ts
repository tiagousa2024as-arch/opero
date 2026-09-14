import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import type { Construct } from "constructs";

export interface DatabaseStackProps extends StackProps {
  vpc: ec2.IVpc;
}

/**
 * Single-instance, single-AZ Postgres for Phase 1-3 (PART B: multi-AZ and
 * a read replica are Phase 4 work — don't add them here pre-emptively).
 * Phase 3 (PART F) moves it into the private subnet introduced in
 * NetworkStack, with a bastion host for admin access over SSM (no open
 * SSH port, no keypair to manage or leak).
 */
export class DatabaseStack extends Stack {
  public readonly instance: rds.DatabaseInstance;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    this.securityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc: props.vpc,
      description: "OPERO RDS Postgres - inbound only from within the VPC",
      allowAllOutbound: false,
    });

    // Scoped to the VPC's own CIDR rather than specific security groups,
    // to avoid cross-stack dependency cycles between this stack and every
    // stack whose compute needs to reach the database (App Runner
    // connector, ECS tasks, the bastion). Everything on this VPC is ours
    // (see NetworkStack).
    this.securityGroup.addIngressRule(ec2.Peer.ipv4(props.vpc.vpcCidrBlock), ec2.Port.tcp(5432), "VPC -> RDS Postgres");

    this.instance = new rds.DatabaseInstance(this, "Postgres", {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [this.securityGroup],
      publiclyAccessible: false,
      databaseName: "opero",
      credentials: rds.Credentials.fromGeneratedSecret("opero_admin"),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      multiAz: false,
      storageEncrypted: true,
      backupRetention: Duration.days(7),
      deleteAutomatedBackups: true,
      // RETAIN: an MVP database holding real customer data should never be
      // deleted just because someone ran `cdk destroy` on the wrong stack.
      removalPolicy: RemovalPolicy.RETAIN,
      deletionProtection: true,
    });

    // Admin access: `aws ssm start-session --target <instance-id>` then
    // tunnel Postgres through it (`aws ssm start-session ... --document-name
    // AWS-StartPortForwardingSessionToRemoteHost`) — no bastion SSH key to
    // lose or rotate, no port open to the internet. Already covered by the
    // VPC-CIDR ingress rule above since it sits in the same private subnet.
    new ec2.BastionHostLinux(this, "DbBastion", {
      vpc: props.vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.NANO),
    });
  }
}
