#!/usr/bin/env bash
# Deploy main-branch code to Vercel production (non-interactive CI pattern).
# Requires: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/ops/load-env.sh
source scripts/ops/load-env.sh

: "${VERCEL_TOKEN:?Set VERCEL_TOKEN in .env.local (https://vercel.com/account/tokens)}"
: "${VERCEL_ORG_ID:?Set VERCEL_ORG_ID in .env.local (team slug or user ID)}"
: "${VERCEL_PROJECT_ID:?Set VERCEL_PROJECT_ID in .env.local (project ID or name)}"

export VERCEL_ORG_ID VERCEL_PROJECT_ID

vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod

echo "Production deployment complete."
