import { Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import type { Construct } from "constructs";

/**
 * Phase 3 network (PART F): private subnets for RDS/ECS/Redis behind a
 * single NAT Gateway, with a public subnet only for the ALB and the NAT
 * Gateway itself. This replaces the Phase 1/2 "public subnets only, no
 * NAT" VPC (see git history) now that there's a real reason to pay for a
 * NAT Gateway — don't run both side by side.
 *
 * One NAT Gateway (not one per AZ) is a deliberate cost choice: it's a
 * single point of failure for outbound internet from private subnets,
 * acceptable for the current traffic level. Add a second only if that
 * actually becomes a problem.
 */
export class NetworkStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "OperoVpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.20.0.0/16"),
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });
  }
}
