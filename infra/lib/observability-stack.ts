import { Duration, Stack, type StackProps } from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as rds from "aws-cdk-lib/aws-rds";
import * as apprunner from "@aws-cdk/aws-apprunner-alpha";
import type { Construct } from "constructs";

export interface ObservabilityStackProps extends StackProps {
  dbInstance: rds.DatabaseInstance;
  service: apprunner.Service;
}

/**
 * The basic alarm set PART F Phase 2 calls for: 5xx error rate, RDS
 * CPU/storage, App Runner health check failures. No alarm actions (SNS
 * topic/PagerDuty/etc.) are wired up yet — that's a real operational
 * decision (who gets paged, on what channel) for Tiago to make, not
 * something to default silently.
 */
export class ObservabilityStack extends Stack {
  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props);

    new cloudwatch.Alarm(this, "RdsHighCpu", {
      alarmDescription: "RDS CPU utilization above 80% for 15 minutes",
      metric: props.dbInstance.metricCPUUtilization({ period: Duration.minutes(5) }),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, "RdsLowStorage", {
      alarmDescription: "RDS free storage below 2GB",
      metric: props.dbInstance.metricFreeStorageSpace({ period: Duration.minutes(5) }),
      threshold: 2 * 1024 * 1024 * 1024,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    const service5xx = new cloudwatch.Metric({
      namespace: "AWS/AppRunner",
      metricName: "5xxStatusResponses",
      dimensionsMap: { ServiceName: props.service.serviceName },
      statistic: "Sum",
      period: Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, "AppRunner5xxRate", {
      alarmDescription: "App Runner returned 5xx responses",
      metric: service5xx,
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // App Runner has no CloudWatch metric for "health check failed" the way
    // an ALB does — its own health monitoring only surfaces as service
    // status transitions (RUNNING -> ... -> OPERATION_IN_PROGRESS, etc.) on
    // an EventBridge event, not a metric an Alarm can watch. If that
    // matters before Phase 3's move to ECS/ALB (which does expose it),
    // add an EventBridge rule on the App Runner service's state-change
    // events instead of an Alarm here.
  }
}
