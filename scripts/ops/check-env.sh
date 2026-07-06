#!/usr/bin/env bash
# Verify required variables are available (from .env.local and/or Cursor Secrets).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/ops/load-env.sh
source scripts/ops/load-env.sh

missing=()

require() {
  if [[ -z "${!1:-}" ]]; then
    missing+=("$1")
  fi
}

require NEXT_PUBLIC_SUPABASE_URL
require NEXT_PUBLIC_SUPABASE_ANON_KEY
require SUPABASE_SERVICE_ROLE_KEY
require SUPABASE_ACCESS_TOKEN
require SUPABASE_PROJECT_ID
require SUPABASE_DB_PASSWORD
require VERCEL_TOKEN
require VERCEL_ORG_ID
require VERCEL_PROJECT_ID

if ((${#missing[@]} > 0)); then
  echo "Missing required variables (add to .env.local or Cursor Secrets):"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

echo "All required variables are set."
