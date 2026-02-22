# AWS CDK Infrastructure for Microservices Blog

This directory contains the AWS CDK infrastructure code for deploying the microservices blog to AWS.

**Full flow (from scratch + when to re-run what):** see **[DEPLOY-AWS.md](../../DEPLOY-AWS.md)** in the repo root.

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

### If deploy fails: "ECR Repository ... already exists"

This happens when you deleted the CloudFormation stack but ECR repos were left behind (they are not deleted by default). Fix: delete the orphaned repos, then deploy again.

From project root (set `REGION` if needed):

- **Mac/Linux:** `./scripts/delete-ecr-repos.sh us-east-1`
- **Windows PowerShell:** `.\scripts\delete-ecr-repos.ps1 -Region us-east-1`

Or manually:
```bash
for r in client posts comments query moderation event-bus; do
  aws ecr delete-repository --repository-name "microservices-blog/$r" --region us-east-1 --force
done
```
Then: `cd infra/aws && npm run deploy`.

## Deploy/delete timing and how to see progress

- **Deploy:** Creating VPC + EKS + node group usually takes **about 10–20 minutes**. The slow part is the EKS control plane and then the node group. So 10 minutes can be normal; it often looks “stuck” while EKS is provisioning.
- **Delete:** Tearing down the same stack often takes **15–25+ minutes** (draining nodes, deleting EKS control plane, etc.). That can also look stuck.
- **Machine size (t3.medium):** Does not affect how long the stack is created; the delay is mostly AWS creating the EKS control plane and nodes. Medium is fine for this app.

### See that something is moving

1. **CDK with more output** (from `infra/aws`):
   ```bash
   npx cdk deploy --all --verbose
   ```
   Or:
   ```bash
   npx cdk deploy --all --debug
   ```
   You’ll see more logs; the actual resource creation is done by CloudFormation.

2. **CloudFormation events (best way to see progress)**  
   In AWS Console: **CloudFormation → Stacks → your stack (e.g. MicroservicesBlogStack) → Events**.  
   New events appear every 1–2 minutes while resources are being created or deleted.

3. **Same from CLI** (replace region/stack name if needed):
   ```bash
   aws cloudformation describe-stack-events --stack-name MicroservicesBlogStack --region us-east-1 --query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId]' --output table
   ```
   Run every few minutes to see new lines.

4. **Check stack status**:
   ```bash
   aws cloudformation describe-stacks --stack-name MicroservicesBlogStack --region us-east-1 --query 'Stacks[0].StackStatus'
   ```
   During deploy you’ll see `CREATE_IN_PROGRESS`; when done, `CREATE_COMPLETE`. During delete, `DELETE_IN_PROGRESS` then the stack disappears.

If something actually failed (e.g. org policy, quota), it will show in CloudFormation Events as `CREATE_FAILED` or `DELETE_FAILED` with a reason.

## Current Status

**Phases 1–4 complete**: CDK project, VPC, ECR, EKS + node group

**Next Steps**:
- Phase 5: AWS Load Balancer Controller
- Phase 6: Update K8s manifests for AWS (ECR + ALB ingress)
- Phase 7: Build & push images, deploy to EKS
