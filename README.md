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
| FIFA World Cup private game (006) | [`specs/006-fifa-world-cup-predictions/`](specs/006-fifa-world-cup-predictions/) |
| Group rollout flags | [`docs/rollout/group-scoping.md`](docs/rollout/group-scoping.md) |
| World Cup private rollout | [`docs/rollout/world-cup-private.md`](docs/rollout/world-cup-private.md) |
| Group observability | [`docs/operations/group-scoping-observability.md`](docs/operations/group-scoping-observability.md) |

## Fresh setup (new database)

1. Copy `.env.local.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server secrets needed for scripts.
3. Apply all migrations to your empty Supabase project:

   ```bash
   npm run db:link    # one-time: project ref from Dashboard → Settings → General
   npm run db:push    # applies every file in supabase/migrations/ in order
   ```

   **Empty database:** no manual SQL needed. The chain runs `0001` → `0024` → `20260501*` → `20260519*` (groups, rummy, contest ledger).  
   If `db push` fails mid-way, reset the database in the Supabase Dashboard and run `db push` again.

   **“relation profiles does not exist” but push starts at `0004`:** migration history is ahead of the actual schema (tables were deleted manually). Re-run from the beginning:

   ```bash
   npx supabase migration repair --status reverted 0001 0002 0003
   npm run db:push
   ```

   If many versions are stuck, reset the database in the Dashboard (clears tables and migration history), then `npm run db:push` once.

   **Ran migration SQL in the Dashboard editor:** the schema may be current but CLI history is not. Sync without re-running SQL:

   ```bash
   npm run ops:db:repair-applied
   npm run ops:db:push   # should report "Remote database is up to date"
   ```

   Each file under `supabase/migrations/` must have a **unique** version prefix (the part before the first `_`). Duplicate prefixes cause `schema_migrations_pkey` errors on push.
4. Enable auth providers (Google and/or Email) and set callback URL to `http://localhost:3000/auth/callback`.
5. Set group flags (recommended for local dev):

   ```env
   GROUP_SCOPING_ENABLED=true
   GROUP_PREDICTION_ENABLED=true
   GROUP_RUMMY_ENABLED=true
   ```

6. **World Cup pilot** (optional): see [`docs/rollout/world-cup-private.md`](docs/rollout/world-cup-private.md). Create a group, add a **World Cup 2026** contest, drop Kaggle CSVs into `data/worldcup-2026/`, then `npm run import:worldcup -- --group-id <uuid> --contest-id <uuid>`.

6. Run `npm install`.
7. Run `npm run dev`.

## Scripts

See [`scripts/README.md`](scripts/README.md) for seed/import commands.

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

## Cursor Cloud Agents

To let a cloud agent deploy to Vercel and run Supabase migrations/SQL without your terminal, add secrets from `.env.local.example` in [Cursor Cloud Agents → Secrets](https://cursor.com/dashboard/cloud-agents), then see [AGENTS.md](AGENTS.md).
