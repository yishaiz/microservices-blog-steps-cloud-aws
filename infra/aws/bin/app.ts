#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MicroservicesBlogStack } from '../lib/microservices-blog-stack';

const app = new cdk.App();

new MicroservicesBlogStack(app, 'MicroservicesBlogStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'EKS cluster and infrastructure for microservices blog',
});
