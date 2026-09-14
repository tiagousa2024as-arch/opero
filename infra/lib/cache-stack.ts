import { Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import type { Construct } from "constructs";

export interface CacheStackProps extends StackProps {
  vpc: ec2.IVpc;
}

/**
 * Single-node Redis for sessions/rate-limiting (PART B Phase 3). No
 * replication group / cluster mode — this is meant for cache and
 * ephemeral session data the app can regenerate, not data that needs
 * high availability.
 */
export class CacheStack extends Stack {
  public readonly cluster: elasticache.CfnCacheCluster;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    this.securityGroup = new ec2.SecurityGroup(this, "RedisSecurityGroup", {
      vpc: props.vpc,
      description: "OPERO Redis - inbound only from within the VPC",
      allowAllOutbound: false,
    });
    this.securityGroup.addIngressRule(ec2.Peer.ipv4(props.vpc.vpcCidrBlock), ec2.Port.tcp(6379), "VPC -> Redis");

    const subnetGroup = new elasticache.CfnSubnetGroup(this, "RedisSubnetGroup", {
      description: "OPERO Redis subnet group",
      subnetIds: props.vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds,
    });

    this.cluster = new elasticache.CfnCacheCluster(this, "RedisCluster", {
      engine: "redis",
      cacheNodeType: "cache.t4g.micro",
      numCacheNodes: 1,
      cacheSubnetGroupName: subnetGroup.ref,
      vpcSecurityGroupIds: [this.securityGroup.securityGroupId],
    });
  }
}
