import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import type { Construct } from "constructs";

export interface DatabaseStackProps extends StackProps {
  vpc: ec2.IVpc;
  /** PART F Phase 4 — off by default; see infra/README.md before flipping it on. */
  enableMultiAz?: boolean;
  /** PART F Phase 4 — off by default; see infra/README.md before flipping it on. */
  enableReadReplica?: boolean;
}

/**
 * Single-instance Postgres. Multi-AZ and a read replica (PART B/F Phase
 * 4) are built here but gated behind `enableMultiAz`/`enableReadReplica`
 * (both default false, wired from cdk.json context in bin/opero.ts) —
 * PART F is explicit that Phase 4 work should turn on "only when a real
 * customer/revenue signal justifies it", and both of these roughly
 * double the RDS bill. Flip them on in cdk.json once that's true, not by
 * hardcoding `true` here.
 */
export class DatabaseStack extends Stack {
  public readonly instance: rds.DatabaseInstance;
  public readonly readReplica?: rds.DatabaseInstanceReadReplica;
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
      multiAz: props.enableMultiAz ?? false,
      storageEncrypted: true,
      backupRetention: Duration.days(7),
      deleteAutomatedBackups: true,
      // RETAIN: an MVP database holding real customer data should never be
      // deleted just because someone ran `cdk destroy` on the wrong stack.
      removalPolicy: RemovalPolicy.RETAIN,
      deletionProtection: true,
    });

    if (props.enableReadReplica) {
      // For reporting queries (PART B) — the app doesn't route any reads
      // to this yet; see infra/README.md for the gap. Same instance
      // class/subnet/security posture as the primary.
      this.readReplica = new rds.DatabaseInstanceReadReplica(this, "PostgresReadReplica", {
        sourceDatabaseInstance: this.instance,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO),
        vpc: props.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [this.securityGroup],
        publiclyAccessible: false,
        // storageEncrypted deliberately omitted: a read replica always
        // inherits encryption from its source instance, and CloudFormation
        // rejects setting it explicitly alongside SourceDBInstanceIdentifier.
      });
    }

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
