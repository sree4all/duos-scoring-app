# Kin Score App

Next.js + Supabase app for generalized contests, scoring, and leaderboards.

## Architecture

![System architecture](docs/app-architecture.svg)

Editable diagram (diagrams.net / draw.io): [`docs/app-architecture.drawio`](docs/app-architecture.drawio).

## Docs

Current implementation artifacts:

- Specification: [`specs/004-generalized-scoring-platform/spec.md`](specs/004-generalized-scoring-platform/spec.md)
- Quickstart: [`specs/004-generalized-scoring-platform/quickstart.md`](specs/004-generalized-scoring-platform/quickstart.md)
- Plan: [`specs/004-generalized-scoring-platform/plan.md`](specs/004-generalized-scoring-platform/plan.md)
- Tasks: [`specs/004-generalized-scoring-platform/tasks.md`](specs/004-generalized-scoring-platform/tasks.md)
- Rollout flags: [`docs/rollout/generalized-scoring.md`](docs/rollout/generalized-scoring.md)

## Fresh setup (new database)

1. Copy `.env.local.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server secrets needed for scripts.
3. Apply SQL migrations in `supabase/migrations/` in filename order.
4. Enable auth providers (Google and/or Email) and set callback URL to `http://localhost:3000/auth/callback`.
5. Run `npm install`.
6. Run `npm run dev`.

## Scripts

See [`scripts/README.md`](scripts/README.md) for seed/import commands.

## Main routes

- Participant: `/contests`, `/contests/[contestId]/events/[eventId]`, `/contests/[contestId]/leaderboard`, `/history`
- Admin: `/admin`, `/admin/contests/new`, `/admin/scoring`, `/admin/game-types`

## License

Private / project use.