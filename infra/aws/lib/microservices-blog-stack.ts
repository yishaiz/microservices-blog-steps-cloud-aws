import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
import { VpcConstruct } from './vpc-stack';
import { EksConstruct } from './eks-construct';

export class MicroservicesBlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Phase 2: VPC and networking
    const vpc = new VpcConstruct(this, 'Vpc');

    // Phase 3: ECR repositories for all microservices
    const services = [
      'client',
      'posts',
      'comments',
      'query',
      'moderation',
      'event-bus',
    ] as const;

    const ecrRepos: Record<(typeof services)[number], ecr.Repository> = {} as any;

    services.forEach((service) => {
      ecrRepos[service] = new ecr.Repository(this, `EcrRepo${toPascalCase(service)}`, {
        repositoryName: `microservices-blog/${service}`,
        imageScanOnPush: true,
      });
    });

    Object.entries(ecrRepos).forEach(([service, repo]) => {
      new cdk.CfnOutput(this, `EcrRepoUri${toPascalCase(service)}`, {
        value: repo.repositoryUri,
        description: `ECR repository URI for ${service}`,
      });
    });

    // Phase 4: EKS cluster + node group
    const eksConstruct = new EksConstruct(this, 'Eks', { vpc });
    new cdk.CfnOutput(this, 'EksClusterName', {
      value: eksConstruct.cluster.clusterName,
      description: 'EKS cluster name (use: aws eks update-kubeconfig --name <value>)',
    });
  }
}

function toPascalCase(name: string): string {
  return name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
