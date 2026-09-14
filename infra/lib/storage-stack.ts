import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

/**
 * S3 bucket for tenant-uploaded content: company logos, OS attachments,
 * generated invoices (PART B lists all three under Phase 1 object
 * storage). CloudFront in front of it is Phase 3 work.
 */
export class StorageStack extends Stack {
  public readonly attachmentsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.attachmentsBucket = new s3.Bucket(this, "AttachmentsBucket", {
      bucketName: undefined, // let CDK generate a unique name — Phase 1 has no custom-domain CDN in front of it yet
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: "abort-incomplete-multipart-uploads",
          abortIncompleteMultipartUploadAfter: Duration.days(7),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ["https://app.opero.com.br", "http://localhost:3000"],
          allowedHeaders: ["*"],
        },
      ],
    });
  }
}
