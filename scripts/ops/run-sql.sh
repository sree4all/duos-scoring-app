#!/usr/bin/env bash
# Execute SQL against the linked Supabase database.
# Usage:
#   npm run ops:db:sql -- supabase/migrations/some_file.sql
#   npm run ops:db:sql -- "select count(*) from profiles"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/ops/load-env.sh
source scripts/ops/load-env.sh

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "Supabase project not linked. Run: npm run ops:db:link"
  exit 1
fi

if [[ $# -eq 0 ]]; then
  echo "Usage: npm run ops:db:sql -- <file.sql | \"SQL statement\">"
  exit 1
fi

if [[ -f "$1" ]]; then
  npx supabase db query --linked --file "$1"
else
  npx supabase db query --linked "$*"
fi
