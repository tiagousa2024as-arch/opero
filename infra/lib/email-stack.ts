import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import * as ses from "aws-cdk-lib/aws-ses";
import type { Construct } from "constructs";

export interface EmailStackProps extends StackProps {
  domainName: string;
}

/**
 * SES domain identity for transactional email (PART B: "Amazon SES").
 * `.com.br` domains are typically registered at registro.br, not Route53,
 * so this deliberately does NOT assume a Route53-hosted zone — it creates
 * the identity and surfaces the DKIM/verification DNS records as stack
 * outputs. Whoever owns the domain's DNS adds them there by hand; wire up
 * automatic Route53 record creation later only if the domain is ever
 * migrated to Route53.
 */
export class EmailStack extends Stack {
  constructor(scope: Construct, id: string, props: EmailStackProps) {
    super(scope, id, props);

    const identity = new ses.EmailIdentity(this, "OperoDomainIdentity", {
      identity: ses.Identity.domain(props.domainName),
      mailFromDomain: `mail.${props.domainName}`,
    });

    new CfnOutput(this, "DkimRecords", {
      description: `Add these CNAME records at your ${props.domainName} DNS provider to verify DKIM`,
      value: identity.dkimRecords.map((r) => `${r.name} CNAME ${r.value}`).join(" | "),
    });
  }
}
