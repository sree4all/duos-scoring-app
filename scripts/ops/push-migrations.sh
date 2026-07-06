#!/usr/bin/env bash
# Apply pending migrations in supabase/migrations/ to the linked remote database.
set -euo pipefail

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "Supabase project not linked. Run: npm run ops:db:link"
  exit 1
fi

npx supabase db push --linked --include-all --yes
echo "Migrations pushed successfully."
