#!/usr/bin/env bash
# Link this repo to the remote Supabase project (non-interactive).
# Requires: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_ID, SUPABASE_DB_PASSWORD
set -euo pipefail

: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN (Supabase personal access token)}"
: "${SUPABASE_PROJECT_ID:?Set SUPABASE_PROJECT_ID (project ref from Dashboard → Settings → General)}"
: "${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD (database password)}"

npx supabase link --project-ref "$SUPABASE_PROJECT_ID" --password "$SUPABASE_DB_PASSWORD"

echo "Linked to Supabase project: $SUPABASE_PROJECT_ID"
