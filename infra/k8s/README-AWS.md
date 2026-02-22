# Deploying to EKS (AWS)

**Full flow and “what to run when the previous step succeeded”:** see **[DEPLOY-AWS.md](../../DEPLOY-AWS.md)** in the repo root.

## Image format

In AWS, deployments must use images from your ECR. Replace the local image name with:

```
<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/microservices-blog/<service>:<tag>
```

Example: `123456789012.dkr.ecr.us-east-1.amazonaws.com/microservices-blog/posts:latest`

Services: `client`, `posts`, `comments`, `query`, `moderation`, `event-bus`.

## Apply order

1. Deployments + Services (order doesn’t matter for these):  
   `event-bus-depl.yaml`, `posts-depl.yaml`, `comments-depl.yaml`, `query-depl.yaml`, `moderation-depl.yaml`, `client-depl.yaml`  
   **Use the ECR image** in each deployment (see above).
2. Ingress (after AWS Load Balancer Controller is installed):  
   `kubectl apply -f ingress-aws.yaml`

## Get ALB URL

```bash
kubectl get ingress
```

Use the **ADDRESS** (ALB DNS name) in the browser (e.g. `http://<ADDRESS>`).

## Local vs AWS

- **Local (Skaffold/minikube):** use `infra/k8s/*.yaml` **except** `ingress-aws.yaml`; use `ingress-srv.yaml` (nginx).
- **AWS (EKS):** use the same deployment files but with ECR images; use **only** `ingress-aws.yaml` for ingress (do not apply `ingress-srv.yaml`).
