#!/usr/bin/env bash
# Build and push all microservice images to ECR.
# From repo root: ./scripts/build-and-push.sh [REGION]
# Requires: AWS_REGION and AWS_ACCOUNT_ID (or pass REGION and we use aws sts for account).

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

REGION="${1:-${AWS_REGION:-us-east-1}}"
ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ECR_PREFIX="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/microservices-blog"

SERVICES="client posts comments query moderation event-bus"

echo "ECR prefix: $ECR_PREFIX"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

for svc in $SERVICES; do
  echo "Building $svc ..."
  docker build -t "microservices-blog/$svc:$IMAGE_TAG" "./$svc"
  docker tag "microservices-blog/$svc:$IMAGE_TAG" "$ECR_PREFIX/$svc:$IMAGE_TAG"
  echo "Pushing $svc ..."
  docker push "$ECR_PREFIX/$svc:$IMAGE_TAG"
done
echo "Done. Deploy to EKS with: ./scripts/deploy-to-eks.sh $REGION"
