import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import { Construct } from 'constructs';
import { VpcConstruct } from './vpc-stack';

export interface EksConstructProps {
  vpc: VpcConstruct;
}

export class EksConstruct extends Construct {
  public readonly cluster: eks.Cluster;

  constructor(scope: Construct, id: string, props: EksConstructProps) {
    super(scope, id);

    this.cluster = new eks.Cluster(this, 'EksCluster', {
      version: eks.KubernetesVersion.V1_28,
      vpc: props.vpc.vpc,
      vpcSubnets: [{ subnets: props.vpc.vpc.privateSubnets }],
      defaultCapacity: 0,
    });

    // Managed node group: 2x t3.medium in private subnets
    this.cluster.addNodegroupCapacity('NodeGroup', {
      instanceTypes: [new ec2.InstanceType('t3.medium')],
      desiredSize: 2,
      minSize: 1,
      maxSize: 4,
      subnets: { subnets: props.vpc.vpc.privateSubnets },
    });
  }
}

