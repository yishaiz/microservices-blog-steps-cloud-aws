import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from './vpc-stack';

export class MicroservicesBlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC and Networking infrastructure
    const vpc = new VpcConstruct(this, 'Vpc');

    // TODO: Phase 3 - ECR Repositories
    // TODO: Phase 4 - EKS Cluster (will reference vpc.vpc, vpc.eksNodeSecurityGroup)
  }
}
