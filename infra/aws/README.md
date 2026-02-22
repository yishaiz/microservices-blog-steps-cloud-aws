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

## After first deploy – what to check

1. **Get EKS cluster name**  
   From the CDK deploy output, copy the value of `EksClusterName` (or run `aws cloudformation describe-stacks --stack-name MicroservicesBlogStack --query 'Stacks[0].Outputs'`).

2. **Configure kubectl** (from the machine that has AWS credentials):
   ```bash
   aws eks update-kubeconfig --region <YOUR_REGION> --name <EksClusterName>
   ```
   Example: `aws eks update-kubeconfig --region us-east-1 --name MicroservicesBlogStack-EksEksCluster*`

3. **Verify cluster and nodes**:
   ```bash
   kubectl get nodes
   kubectl get ns
   ```
   You should see 2 nodes in `Ready`.

4. **Verify ECR** (optional):
   ```bash
   aws ecr describe-repositories --query 'repositories[].repositoryName'
   ```
   You should see the 6 `microservices-blog/*` repos.

**Web access from outside:** Not yet. To get HTTP from the internet we still need to: deploy app images to ECR, apply K8s manifests, and set up ALB Ingress (next steps).

## Current Status

**Phases 1–4 complete**: CDK project, VPC, ECR, EKS + node group

**Next Steps**:
- Phase 5: AWS Load Balancer Controller
- Phase 6: Update K8s manifests for AWS (ECR + ALB ingress)
- Phase 7: Build & push images, deploy to EKS
