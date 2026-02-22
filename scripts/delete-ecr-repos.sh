#!/usr/bin/env bash
# Delete orphaned ECR repos so CDK can recreate them (e.g. after stack delete).
# Usage: ./scripts/delete-ecr-repos.sh [REGION]
# Example: ./scripts/delete-ecr-repos.sh us-east-1

set -e
REGION="${1:-${AWS_REGION:-us-east-1}}"
REPOS=(
  microservices-blog/client
  microservices-blog/posts
  microservices-blog/comments
  microservices-blog/query
  microservices-blog/moderation
  microservices-blog/event-bus
)

for repo in "${REPOS[@]}"; do
  if aws ecr describe-repositories --repository-names "$repo" --region "$REGION" 2>/dev/null; then
    echo "Deleting $repo ..."
    aws ecr delete-repository --repository-name "$repo" --region "$REGION" --force
  else
    echo "Skip (not found): $repo"
  fi
done
echo "Done. You can run: cd infra/aws && npm run deploy"
