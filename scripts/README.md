# Scripts

Run from **repository root** unless noted.

- **delete-ecr-repos.sh / .ps1** – Remove orphaned ECR repos (e.g. after stack delete). Use before redeploying infra when CloudFormation says repo already exists.
- **build-and-push.sh** – Build all service images and push to ECR. Set `AWS_REGION` and `AWS_ACCOUNT_ID` (or pass region: `./scripts/build-and-push.sh us-east-1`).
- **deploy-to-eks.sh** – Apply deployments (with ECR image substitution) and AWS ingress. Requires `kubectl` configured and images already in ECR.

**When the previous step already succeeded:** Run only the script for what changed (e.g. only `build-and-push.sh` after code change, then `kubectl rollout restart deployment/...` or re-run `deploy-to-eks.sh`).
