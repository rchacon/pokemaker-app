#!/usr/bin/env bash
# Build the app and publish it to the S3 + CloudFront site created by pokemaker-infra.
#
#   ./scripts/deploy.sh                 # uses ../pokemaker-infra/envs/prod
#   INFRA_DIR=../pokemaker-infra/envs/dev ./scripts/deploy.sh
#
# Needs the AWS CLI with credentials for the target account, and Terraform
# (to read the bucket and distribution ids from the infra outputs).
set -euo pipefail

cd "$(dirname "$0")/.."
INFRA_DIR="${INFRA_DIR:-../pokemaker-infra/envs/prod}"

BUCKET="$(terraform -chdir="$INFRA_DIR" output -raw site_bucket)"
DISTRIBUTION="$(terraform -chdir="$INFRA_DIR" output -raw cloudfront_distribution_id)"

npm ci
npm test
npm run build

# Hashed assets can be cached forever; index.html must always be revalidated.
aws s3 sync dist/ "s3://$BUCKET/" --delete \
  --exclude index.html \
  --cache-control "public, max-age=31536000, immutable"
aws s3 cp dist/index.html "s3://$BUCKET/index.html" \
  --cache-control "no-cache" --content-type "text/html; charset=utf-8"

aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" --paths "/index.html" "/" >/dev/null
echo "Deployed to $(terraform -chdir="$INFRA_DIR" output -raw site_url)"
