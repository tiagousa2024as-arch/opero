import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import type { Construct } from "constructs";

export interface DatabaseStackProps extends StackProps {
  vpc: ec2.IVpc;
}

/**
 * Single-instance, single-AZ Postgres for Phase 1 (PART B: "single
 * instance, db.t4g.micro/small" is explicitly the MVP tier). Multi-AZ and
 * a read replica are Phase 3 work per the same table — don't add them
 * here pre-emptively; they cost real money for a database with no
 * traffic yet.
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

    // Scoped to the VPC's own CIDR rather than the App Runner connector's
    // security group specifically: an SG-to-SG rule here would need a
    // property from Opero-Compute (the connector's SG id) while
    // Opero-Compute already depends on this stack for the VPC/instance —
    // a cycle CloudFormation can't express across stacks. Everything on
    // this VPC is ours (see NetworkStack), so the CIDR is an equivalent
    // boundary without the circular reference.
    this.securityGroup.addIngressRule(ec2.Peer.ipv4(props.vpc.vpcCidrBlock), ec2.Port.tcp(5432), "VPC -> RDS Postgres");

    this.instance = new rds.DatabaseInstance(this, "Postgres", {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [this.securityGroup],
      // Never reachable from the public internet even though it sits in a
      // public subnet — see NetworkStack's comment on why the subnet is
      // public at all. Only security-group-scoped traffic ever reaches it.
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
  }
}
