#!/usr/bin/env bash
# Apply K8s manifests with ECR images, then ingress.
# From repo root: ./scripts/deploy-to-eks.sh [REGION]
# Requires: kubectl configured (aws eks update-kubeconfig) and images already in ECR.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

REGION="${1:-${AWS_REGION:-us-east-1}}"
ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ECR_PREFIX="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/microservices-blog"
K8S_DIR="infra/k8s"

echo "Using image prefix: $ECR_PREFIX:$IMAGE_TAG"

apply_deployment() {
  local svc=$1
  local file=$2
  sed -e "s|image: .*|image: $ECR_PREFIX/$svc:$IMAGE_TAG|" "$file" | kubectl apply -f -
}

apply_deployment event-bus "$K8S_DIR/event-bus-depl.yaml"
apply_deployment posts     "$K8S_DIR/posts-depl.yaml"
apply_deployment comments  "$K8S_DIR/comments-depl.yaml"
apply_deployment query     "$K8S_DIR/query-depl.yaml"
apply_deployment moderation "$K8S_DIR/moderation-depl.yaml"
apply_deployment client    "$K8S_DIR/client-depl.yaml"

kubectl apply -f "$K8S_DIR/ingress-aws.yaml"
echo "Done. Get URL: kubectl get ingress"
