import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MicroservicesBlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO: This is a placeholder stack
    // We will add VPC, EKS, and ECR in subsequent phases
  }
}
