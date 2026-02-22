# Delete orphaned ECR repos so CDK can recreate them (e.g. after stack delete).
# Usage: .\scripts\delete-ecr-repos.ps1 [-Region us-east-1]

param([string]$Region = $env:AWS_REGION)
if (-not $Region) { $Region = "us-east-1" }

$repos = @(
  "microservices-blog/client",
  "microservices-blog/posts",
  "microservices-blog/comments",
  "microservices-blog/query",
  "microservices-blog/moderation",
  "microservices-blog/event-bus"
)

foreach ($repo in $repos) {
  try {
    aws ecr describe-repositories --repository-names $repo --region $Region 2>$null
    Write-Host "Deleting $repo ..."
    aws ecr delete-repository --repository-name $repo --region $Region --force
  } catch {
    Write-Host "Skip (not found): $repo"
  }
}
Write-Host "Done. You can run: cd infra/aws; npm run deploy"
