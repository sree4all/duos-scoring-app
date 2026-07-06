#!/usr/bin/env bash
# Verify cloud-agent secrets: required vars + live Supabase/Vercel connectivity.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/ops/load-env.sh
source scripts/ops/load-env.sh

echo "== Cloud agent verification =="
echo

# --- 1. Required variables ---
missing=()
require() { [[ -n "${!1:-}" ]] || missing+=("$1"); }

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
  echo "FAIL: Missing required variables:"
  printf '  - %s\n' "${missing[@]}"
  echo
  echo "Add them as Cursor Cloud Agent secrets (exact names) and restart the agent."
  exit 1
fi
echo "OK  All required variables are set"

# --- 2. Supabase API (anon key) ---
http_code=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/" 2>/dev/null || echo "000")

if [[ "$http_code" =~ ^(200|401|404)$ ]]; then
  echo "OK  Supabase REST API reachable (${NEXT_PUBLIC_SUPABASE_URL})"
else
  echo "FAIL: Supabase REST API unreachable (HTTP ${http_code})"
  exit 1
fi

# --- 3. Supabase CLI token ---
if npx supabase projects list >/dev/null 2>&1; then
  echo "OK  Supabase CLI token valid"
else
  echo "FAIL: Supabase CLI token invalid or network blocked"
  exit 1
fi

# --- 4. Vercel token ---
vercel_user=$(vercel whoami 2>/dev/null || true)
if [[ -n "$vercel_user" ]]; then
  echo "OK  Vercel token valid (user: ${vercel_user})"
else
  echo "FAIL: Vercel token invalid or network blocked"
  exit 1
fi

echo
echo "All checks passed. Ready for:"
echo "  npm run ops:db:link && npm run ops:db:push"
echo "  npm run ops:deploy:prod"
