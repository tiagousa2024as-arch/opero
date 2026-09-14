import { Duration, Stack, type StackProps } from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as rds from "aws-cdk-lib/aws-rds";
import type { Construct } from "constructs";

export interface ObservabilityStackProps extends StackProps {
  dbInstance: rds.DatabaseInstance;
  webService: ecs.FargateService;
  workerService: ecs.FargateService;
  alb: elbv2.ApplicationLoadBalancer;
}

/**
 * The basic alarm set PART F calls for: 5xx error rate, RDS CPU/storage,
 * service health failures — updated for ECS/ALB (PART F Phase 3), which,
 * unlike App Runner, exposes a real "unhealthy host count" / running task
 * count an Alarm can watch. No alarm actions (SNS topic/PagerDuty/etc.)
 * are wired up yet — that's a real operational decision (who gets paged,
 * on what channel) for Tiago to make, not something to default silently.
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

    new cloudwatch.Alarm(this, "WebServiceUnhealthy", {
      alarmDescription: "opero-web has fewer running tasks than desired for 5 minutes",
      metric: props.webService.metric("RunningTaskCount", { statistic: "Minimum", period: Duration.minutes(1) }),
      threshold: 1,
      evaluationPeriods: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, "WorkerServiceUnhealthy", {
      alarmDescription: "opero-worker has fewer running tasks than desired for 5 minutes",
      metric: props.workerService.metric("RunningTaskCount", { statistic: "Minimum", period: Duration.minutes(1) }),
      threshold: 1,
      evaluationPeriods: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, "AlbTarget5xxRate", {
      alarmDescription: "ALB target returned 5xx responses",
      metric: props.alb.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT, {
        statistic: "Sum",
        period: Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
  }
}
