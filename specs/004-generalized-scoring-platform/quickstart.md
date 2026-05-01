# Quickstart ù Generalized Scoring Platform

## Goal

Bring up the app on a fresh Supabase project and verify core generalized flows.

## Prerequisites

- `npm install` completed
- `.env.local` configured with Supabase values
- Access to Supabase SQL editor or CLI

## 1) Fresh database setup

1. Apply all migrations in `supabase/migrations/` in filename order.
2. Run `npm run seed:demo` for smoke data.
3. Run `npm run dev`.

## 2) Verify core flows

- Participant can open contests/history and submit predictions.
- Admin can access `/admin/contests/new` and `/admin/scoring`.
- Scoring APIs respond without auth/role regressions.

## 3) Quality checks

- `npm run lint`
- If test runner is wired, run `npm test`.

## Contracts referenced

- `contracts/admin-configuration-and-scoring.md`
- `contracts/participant-submissions-and-history.md`