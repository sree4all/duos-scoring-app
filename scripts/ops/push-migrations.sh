#!/usr/bin/env bash
# Apply pending migrations in supabase/migrations/ to the linked remote database.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/ops/load-env.sh
source scripts/ops/load-env.sh

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "Supabase project not linked. Run: npm run ops:db:link"
  exit 1
fi

npx supabase db push --linked
echo "Migrations pushed successfully."
