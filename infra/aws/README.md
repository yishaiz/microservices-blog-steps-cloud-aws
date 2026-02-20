# AWS CDK Infrastructure for Microservices Blog

This directory contains the AWS CDK infrastructure code for deploying the microservices blog to AWS.

## Prerequisites

- Node.js v18 or higher
- AWS CLI configured with credentials
- AWS CDK CLI: `npm install -g aws-cdk`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Bootstrap CDK (first time only):
   ```bash
   cdk bootstrap
   ```

3. Synthesize CloudFormation template:
   ```bash
   npm run synth
   ```

4. Deploy infrastructure:
   ```bash
   npm run deploy
   ```

## Project Structure

- `bin/app.ts` - CDK app entry point
- `lib/microservices-blog-stack.ts` - Main stack definition
- `cdk.json` - CDK configuration
- `tsconfig.json` - TypeScript configuration

## Current Status

**Phase 1 Complete**: CDK project structure initialized

**Next Steps**: 
- Phase 2: VPC and Networking Infrastructure
- Phase 3: ECR Repositories
- Phase 4: EKS Cluster Infrastructure
