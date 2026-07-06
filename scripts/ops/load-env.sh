#!/usr/bin/env bash
# Load env from .env.local (and .env). Cursor Secrets already in the environment win.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# Optional: paste entire .env.local contents as one Cursor Runtime Secret.
if [[ -n "${DOTENV_LOCAL:-}" && ! -f .env.local ]]; then
  printf '%s\n' "$DOTENV_LOCAL" > .env.local
fi

if [[ -f .env || -f .env.local ]]; then
  # shellcheck disable=SC1090
  eval "$(node scripts/ops/export-env.mjs)"
fi
