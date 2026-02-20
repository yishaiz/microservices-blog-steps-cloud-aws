import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VpcConstructProps {
  // No additional props needed for now
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly eksNodeSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: VpcConstructProps) {
    super(scope, id);

    // Create VPC with CIDR 10.0.0.0/16
    this.vpc = new ec2.Vpc(this, 'MicroservicesVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // Use 2 Availability Zones
      natGateways: 1, // One NAT Gateway for cost optimization (can scale later)
      
      // Public subnets for ALB and NAT Gateway
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security Group for ALB (Application Load Balancer)
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow HTTP and HTTPS from internet
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    // Security Group for EKS Node Group
    this.eksNodeSecurityGroup = new ec2.SecurityGroup(this, 'EksNodeSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for EKS worker nodes',
      allowAllOutbound: true,
    });

    // Allow traffic from ALB to nodes
    this.eksNodeSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.allTcp(),
      'Allow traffic from ALB'
    );

    // Allow inter-node communication
    this.eksNodeSecurityGroup.addIngressRule(
      this.eksNodeSecurityGroup,
      ec2.Port.allTraffic(),
      'Allow inter-node communication'
    );

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(s => s.subnetId).join(','),
      description: 'Private Subnet IDs',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(s => s.subnetId).join(','),
      description: 'Public Subnet IDs',
    });
  }
}
