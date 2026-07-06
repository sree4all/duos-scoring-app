# Duos Scoring App — Agent Instructions

## Cursor Cloud specific instructions

This repo is configured for **Cursor Cloud Agents** to deploy to Vercel and run Supabase migrations/SQL without local terminal access. Secrets are injected via [Cursor Cloud Agents → Secrets](https://cursor.com/dashboard/cloud-agents).

### One-time setup (you, in Cursor dashboard)

Add these secrets to your workspace. Use **Runtime Secret** for passwords and API tokens; use **Environment Variable** for public URLs and feature flags.

| Secret | Type | Where to get it |
|--------|------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Environment Variable | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Environment Variable | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime Secret | Supabase → Settings → API |
| `SUPABASE_ACCESS_TOKEN` | Runtime Secret | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_ID` | Environment Variable | Supabase → Settings → General (project ref) |
| `SUPABASE_DB_PASSWORD` | Runtime Secret | Supabase → Settings → Database |
| `VERCEL_TOKEN` | Runtime Secret | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Environment Variable | Vercel project → Settings → General, or `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | Environment Variable | Same as above |
| Feature flags (`GROUP_*`, `WORLD_CUP_*`) | Environment Variable | Match production Vercel env vars |

Copy `.env.local.example` for the full list. Restart the cloud agent after adding secrets.

### Supabase: link, migrate, run SQL

```bash
npm run ops:db:link          # one-time per VM (or after snapshot reset)
npm run ops:db:push          # apply pending files in supabase/migrations/
npm run ops:db:repair-applied  # sync history when SQL was run in Dashboard editor
npm run ops:db:sql -- path/to/file.sql
npm run ops:db:sql -- "select count(*) from profiles"
```

For a new migration file, add it under `supabase/migrations/` with a timestamp prefix, commit to `main`, then run `ops:db:push`.

### Vercel: deploy production from main

Ensure the branch is merged to `main` (or deploy from the target commit):

```bash
npm run ops:deploy:prod
```

This runs `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`. Production env vars must already be set in the Vercel project dashboard (or via the Supabase ↔ Vercel integration).

### Typical agent workflow

1. Implement code + migration on a feature branch, open PR, merge to `main`.
2. `npm run ops:db:link` (if not linked) → `npm run ops:db:push`.
3. `npm run ops:deploy:prod`.
4. Verify with `npm run lint` and targeted scripts under `scripts/`.

### Network

Cloud agent VMs need outbound HTTPS to `*.supabase.co`, `api.supabase.com`, and `*.vercel.com`. If your team uses an egress allowlist, add those domains in Cursor Cloud Agents settings.

## Local development

See [README.md](README.md) and [scripts/README.md](scripts/README.md).
