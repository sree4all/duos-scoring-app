#!/usr/bin/env bash
# Verify cloud agent setup: env vars, Supabase link, and deploy prerequisites.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/ops/load-env.sh
source scripts/ops/load-env.sh

fail=0
warn=0

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
  echo "FAIL: Missing required variables (add to .env.local or Cursor Secrets):"
  printf '  - %s\n' "${missing[@]}"
  fail=1
else
  echo "OK: All required environment variables are set."
fi

if [[ -f supabase/.temp/project-ref ]]; then
  linked_ref="$(cat supabase/.temp/project-ref)"
  if [[ -n "${SUPABASE_PROJECT_ID:-}" && "$linked_ref" != "$SUPABASE_PROJECT_ID" ]]; then
    echo "WARN: Linked Supabase project ($linked_ref) does not match SUPABASE_PROJECT_ID ($SUPABASE_PROJECT_ID)"
    warn=1
  else
    echo "OK: Supabase project linked ($linked_ref)."
  fi
else
  echo "FAIL: Supabase project not linked. Run: npm run ops:db:link"
  fail=1
fi

if npx supabase --version >/dev/null 2>&1; then
  echo "OK: Supabase CLI available ($(npx supabase --version 2>/dev/null | head -1))."
else
  echo "FAIL: Supabase CLI not available."
  fail=1
fi

if command -v vercel >/dev/null 2>&1; then
  echo "OK: Vercel CLI available ($(vercel --version 2>/dev/null))."
elif npx vercel --version >/dev/null 2>&1; then
  echo "OK: Vercel CLI available via npx."
else
  echo "WARN: Vercel CLI not installed (required for ops:deploy:prod). Install with: npm i -g vercel"
  warn=1
fi

if ((fail)); then
  exit 1
fi

if ((warn)); then
  echo ""
  echo "Cloud verification passed with warnings."
  exit 0
fi

echo ""
echo "Cloud verification passed."
