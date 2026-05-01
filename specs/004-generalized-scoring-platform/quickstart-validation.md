# Quickstart Validation Notes

Captured during implementation scaffolding (2026-05-01).

## Checks

1. Lint: run `npm run lint` locally before rollout toggles change.
2. Migrations: apply `supabase/migrations/202605010001_generalized_scoring_schema.sql` via Supabase SQL editor or CLI.
3. Env: set rollout variables per `docs/rollout/generalized-scoring.md`.
4. Smoke: verify `GET /api/generalized-scoring`, admin wizard pages `/admin/game-types`, `/admin/contests/new`.

## Follow-up

- Wire auth/RLS policies before exposing generalized endpoints publicly.
- Expand quickstart scenarios after Supabase bindings land.
