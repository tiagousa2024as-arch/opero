import { Stack, type StackProps } from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

/**
 * Application secrets that aren't the database credential (RDS generates
 * and owns its own secret — see DatabaseStack). NEXTAUTH_SECRET is filled
 * in automatically; ASAAS_API_KEY and ASAAS_WEBHOOK_TOKEN start as empty
 * placeholders because they depend on the real Asaas merchant account
 * decision in PART G — update them with `aws secretsmanager put-secret-value`
 * (or the console) once that account exists. Until then the app falls back
 * to the mock payment gateway (see apps/web/src/lib/payments/index.ts),
 * so an empty placeholder here doesn't break the deployment.
 */
export class SecretsStack extends Stack {
  public readonly appSecrets: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.appSecrets = new secretsmanager.Secret(this, "AppSecrets", {
      secretName: "opero/app",
      description: "OPERO application secrets: NEXTAUTH_SECRET (auto), Asaas keys (fill in once the merchant account exists)",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ ASAAS_API_KEY: "", ASAAS_WEBHOOK_TOKEN: "" }),
        generateStringKey: "NEXTAUTH_SECRET",
        excludePunctuation: true,
        passwordLength: 48,
      },
    });
  }
}
