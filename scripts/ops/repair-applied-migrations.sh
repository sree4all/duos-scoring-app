#!/usr/bin/env bash
# Mark local-only migrations as applied on the linked remote database.
# Use when migration SQL was already executed via the Supabase SQL editor.
set -euo pipefail

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "Supabase project not linked. Run: npm run ops:db:link"
  exit 1
fi

pending="$(
  npx supabase migration list --linked 2>&1 | node -e "
    const input = require('fs').readFileSync(0, 'utf8').trim();
    const jsonStart = input.indexOf('{');
    if (jsonStart < 0) process.exit(1);
    const data = JSON.parse(input.slice(jsonStart));
    const seen = new Set();
    const pending = [];
    for (const row of data.migrations ?? []) {
      if (row.remote) continue;
      if (seen.has(row.local)) continue;
      seen.add(row.local);
      pending.push(row.local);
    }
    process.stdout.write(pending.join(' '));
  "
)"

if [[ -z "$pending" ]]; then
  echo "No pending migrations to repair."
  exit 0
fi

echo "Marking as applied on remote: $pending"
# shellcheck disable=SC2086
npx supabase migration repair --status applied --linked $pending
echo "Migration history synced. Verify with: npx supabase migration list --linked"
