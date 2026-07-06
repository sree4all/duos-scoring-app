# Operator scripts

## Environment

Seeding/import commands require server credentials in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Run commands from repository root.

---

## Fresh database bootstrap

1. Apply all migrations in `supabase/migrations/` in filename order.
2. Seed baseline demo data:
   ```bash
   npm run seed:demo
   ```
3. Start app and verify auth + participant flows:
   ```bash
   npm run dev
   ```
4. Promote an admin user from SQL when needed:
   ```sql
   update public.profiles set role = 'admin' where id = '<uuid>';
   ```

---

## Imports for real contest data

### Schedule import

```bash
npm run seed -- matches ./your-schedule.csv
```

Accepted schedule fields include: `external_key`, `home_team`, `away_team`, `match_time_utc` (or date/time pair), `status`, `winner`, `bonus_result`.

### Participant profile updates

```bash
npm run seed -- profiles ./your-profiles.csv
```

Rows are matched by email to existing auth users.

---

## Cloud agent / CI operations

Non-interactive Supabase and Vercel commands. **All ops scripts load `.env.local` automatically.**

```bash
npm run ops:env:check        # verify required vars are present
npm run ops:db:link          # link CLI to remote Supabase project
npm run ops:db:push          # apply pending migrations
npm run ops:db:sql -- path/to/query.sql
npm run ops:deploy:prod      # Vercel production deploy
```

For Cursor Cloud Agents without a local file, paste your entire `.env.local` as a Runtime Secret named `DOTENV_LOCAL`. See [AGENTS.md](../AGENTS.md).

## Command reference

```bash
npm run seed:demo
npm run seed -- matches ./matches.csv
npm run seed -- profiles ./profiles.csv
```