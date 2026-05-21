# Duos Scoring App

Next.js + Supabase app for generalized contests, scoring, and leaderboards — with **private groups** for prediction leagues and points rummy.

## Architecture

![System architecture](docs/app-architecture.svg)

Editable diagram (diagrams.net / draw.io): [`docs/app-architecture.drawio`](docs/app-architecture.drawio).

## Docs

| Feature | Path |
|---------|------|
| Generalized scoring (004) | [`specs/004-generalized-scoring-platform/`](specs/004-generalized-scoring-platform/) |
| Groups + prediction + rummy (005) | [`specs/005-prediction-rummy-groups/`](specs/005-prediction-rummy-groups/) |
| Group rollout flags | [`docs/rollout/group-scoping.md`](docs/rollout/group-scoping.md) |
| Group observability | [`docs/operations/group-scoping-observability.md`](docs/operations/group-scoping-observability.md) |

## Fresh setup (new database)

1. Copy `.env.local.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server secrets needed for scripts.
3. Apply SQL migrations in `supabase/migrations/` in filename order (through `202605190008` for groups/rummy).
4. Enable auth providers (Google and/or Email) and set callback URL to `http://localhost:3000/auth/callback`.
5. Set group flags (recommended for local dev):

   ```env
   GROUP_SCOPING_ENABLED=true
   GROUP_PREDICTION_ENABLED=true
   GROUP_RUMMY_ENABLED=true
   ```

6. Run `npm install`.
7. Run `npm run dev`.

## Scripts

See [`scripts/README.md`](scripts/README.md) for seed/import commands.

Legacy contest migration (one-time):

```bash
npx tsx scripts/migrate-legacy-to-groups.ts --group-id <your-group-uuid>
# or archive unscoped rows:
npx tsx scripts/migrate-legacy-to-groups.ts --archive
```

## Main routes

### Groups (tenant root)

- `/groups` — list groups or redirect to active group home
- `/groups/new`, `/groups/join` — create / join by invite code
- `/groups/[groupId]` — group dashboard (prediction vs rummy contests)
- `/groups/[groupId]/settings` — invite, roster, scorers, owners
- `/groups/[groupId]/contests/new` — **group owner** contest wizard (not `/admin`)

### Participant

- `/contests` — contests for active group (format badges)
- `/contests/[contestId]/leaderboard` — per-contest totals only
- `/contests/[contestId]/stats` — prediction pick distributions (post-lock)
- `/contests/[contestId]/season-bonuses` — season bonus visibility
- `/contests/[contestId]/rummy/record` — hand entry (owner/scorer)
- `/contests/[contestId]/rummy/history` — hand audit trail
- `/history` — group-scoped ledger history

### Platform admin

- `/admin` — platform operators only
- `/admin/contests/new` — redirects non-admins to `/groups`

## Tests (harness scripts)

```bash
npx tsx tests/unit/rummy-preset-calculator.spec.ts
npx tsx tests/integration/group-prediction-parity.spec.ts
npx tsx tests/integration/group-isolation.spec.ts
```

## License

Private / project use.
