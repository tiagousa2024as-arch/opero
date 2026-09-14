import { Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import type { Construct } from "constructs";

/**
 * Phase 1 network: public subnets only, no NAT Gateway — the blueprint
 * (PART F, Phase 2) explicitly calls a public-subnet VPC acceptable for
 * the MVP to avoid NAT Gateway cost before there's a paying customer.
 * RDS still keeps `publiclyAccessible: false` (see DatabaseStack) so
 * "public subnet" only means "has a route to an Internet Gateway", not
 * "reachable from the internet" — App Runner reaches it through a VPC
 * Connector on the same subnets. Move to private subnets + NAT in
 * Phase 3 (PART F) once there's revenue to justify the cost.
 */
export class NetworkStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "OperoVpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.20.0.0/16"),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });
  }
}
