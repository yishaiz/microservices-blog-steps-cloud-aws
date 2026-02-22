# Deploy to AWS (EKS) – Full guide

This doc covers: **bringing the environment up from scratch** and **what to run when the previous step already succeeded** (no need to delete everything).

---

## Prerequisites (once per machine)

- AWS CLI configured (`aws configure`), Node.js 18+, Docker, kubectl.
- CDK CLI: `npm install -g aws-cdk@latest` (use `npx cdk` or `npm run …` from `infra/aws` if you prefer).

Set once per shell (use your region):

```bash
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

---

## 1. From scratch (full run)

Do these in order from the **repository root**.

### Step 1 – CDK bootstrap (first time per account/region only)

```bash
cd infra/aws
npm install
npx cdk bootstrap
cd ../..
```

**If the previous step already succeeded:** Skip. You only need bootstrap once per account/region.

---

### Step 2 – Deploy infrastructure (VPC, ECR, EKS, ALB controller)

```bash
cd infra/aws
npm run deploy
cd ../..
```

Takes about 10–20 minutes. Use CloudFormation Events in the AWS Console to watch progress.

**If the previous step already succeeded:** Run `npm run deploy` again from `infra/aws` to apply infra changes only. No need to delete the stack.

**If deploy fails with "ECR Repository ... already exists":** You deleted the stack but ECR repos remained. Delete them then redeploy:

- Mac/Linux: `./scripts/delete-ecr-repos.sh $AWS_REGION`
- Windows: `.\scripts\delete-ecr-repos.ps1 -Region $AWS_REGION`  
Then: `cd infra/aws && npm run deploy`.

---

### Step 3 – Configure kubectl

```bash
# Get cluster name from CDK output or:
aws eks list-clusters --region $AWS_REGION

aws eks update-kubeconfig --region $AWS_REGION --name <EksClusterName>
kubectl get nodes   # expect 2 Ready nodes
```

**If the previous step already succeeded:** Skip unless you switched machine or region; then run `update-kubeconfig` again.

---

### Step 4 – Build and push Docker images to ECR

From repo root, with `AWS_REGION` and `AWS_ACCOUNT_ID` set:

```bash
# Login Docker to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push each service (tag = latest; change if you want versioning)
for svc in client posts comments query moderation event-bus; do
  docker build -t microservices-blog/$svc:latest ./$svc
  docker tag microservices-blog/$svc:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/microservices-blog/$svc:latest
  docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/microservices-blog/$svc:latest
done
```

Or use the script (from repo root):

- Mac/Linux: `chmod +x scripts/build-and-push.sh && ./scripts/build-and-push.sh`
- Windows: run the same `docker build` / `docker tag` / `docker push` loop in PowerShell, or use WSL for the script; see `scripts/README.md`.

**If the previous step already succeeded:** Rebuild and push only what changed, e.g. only `posts`:

```bash
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker build -t microservices-blog/posts:latest ./posts
docker tag microservices-blog/posts:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/microservices-blog/posts:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/microservices-blog/posts:latest
```

Then redeploy that app (see Step 5) or restart the deployment so it pulls the new image.

---

### Step 5 – Deploy the app to EKS (manifests with ECR images)

Images must point to your ECR. From repo root, with `AWS_REGION` and `AWS_ACCOUNT_ID` set:

```bash
export ECR_PREFIX=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/microservices-blog
export IMAGE_TAG=latest
```

Then apply deployments (replace image in YAML). Example for one file (Mac/Linux):

```bash
# Apply all deployments with ECR images (example: posts)
sed -e "s|image: .*|image: $ECR_PREFIX/posts:$IMAGE_TAG|" infra/k8s/posts-depl.yaml | kubectl apply -f -
sed -e "s|image: .*|image: $ECR_PREFIX/comments:$IMAGE_TAG|" infra/k8s/comments-depl.yaml | kubectl apply -f -
sed -e "s|image: .*|image: $ECR_PREFIX/event-bus:$IMAGE_TAG|" infra/k8s/event-bus-depl.yaml | kubectl apply -f -
sed -e "s|image: .*|image: $ECR_PREFIX/query:$IMAGE_TAG|" infra/k8s/query-depl.yaml | kubectl apply -f -
sed -e "s|image: .*|image: $ECR_PREFIX/moderation:$IMAGE_TAG|" infra/k8s/moderation-depl.yaml | kubectl apply -f -
sed -e "s|image: .*|image: $ECR_PREFIX/client:$IMAGE_TAG|" infra/k8s/client-depl.yaml | kubectl apply -f -
```

Then apply the AWS ingress (do **not** apply the nginx `ingress-srv.yaml` on EKS):

```bash
kubectl apply -f infra/k8s/ingress-aws.yaml
```

**Alternative (Mac/Linux):** from repo root, `./scripts/deploy-to-eks.sh` does the image substitution and applies all deployments + ingress (set `AWS_REGION` and `AWS_ACCOUNT_ID` first).

**If the previous step already succeeded:**  
- Only app code changed: rebuild/push the affected service (Step 4), then `kubectl rollout restart deployment/<depl-name>` (e.g. `kubectl rollout restart deployment/posts-depl`) or re-apply that deployment with the same image (K8s will pull the new tag).  
- Only manifests changed: run the same `sed ... | kubectl apply -f -` for the changed files and/or `kubectl apply -f infra/k8s/ingress-aws.yaml`.

---

### Step 6 – Get the app URL

```bash
kubectl get ingress
```

Open **http://\<ADDRESS\>** in the browser (ADDRESS is the ALB hostname; propagation can take 1–2 minutes).

---

## 2. Quick reference – “what do I run?”

| Situation | What to run |
|-----------|-------------|
| First time, full env | Steps 1 → 2 → 3 → 4 → 5 → 6 in order. |
| Infra already exists, only app code changed | Step 4 (build/push changed services), then Step 5 (restart/re-apply those deployments). |
| Infra already exists, only CDK/infra code changed | From `infra/aws`: `npm run deploy`. |
| New machine / new shell | Set `AWS_REGION` and `AWS_ACCOUNT_ID`, run Step 3 (`update-kubeconfig`). |
| Stack was deleted but ECR repos remained | Run `scripts/delete-ecr-repos.sh` (or .ps1), then Step 2. |
| Only K8s manifests changed (no image change) | Step 5: re-apply the changed YAML (with your ECR prefix/tag). |

---

## 3. Tear down (when you want to remove everything)

1. Delete K8s resources (optional; avoids some dependency issues):
   ```bash
   kubectl delete -f infra/k8s/ingress-aws.yaml
   kubectl delete -f infra/k8s/client-depl.yaml
   kubectl delete -f infra/k8s/posts-depl.yaml
   kubectl delete -f infra/k8s/comments-depl.yaml
   kubectl delete -f infra/k8s/query-depl.yaml
   kubectl delete -f infra/k8s/moderation-depl.yaml
   kubectl delete -f infra/k8s/event-bus-depl.yaml
   ```
2. From `infra/aws`: `npm run destroy`. Confirm and wait (often 15–25+ minutes).
3. If ECR repos were left behind: `./scripts/delete-ecr-repos.sh $AWS_REGION` (or .ps1).
