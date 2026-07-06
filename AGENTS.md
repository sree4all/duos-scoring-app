# Duos Scoring App — Agent Instructions

## Cursor Cloud specific instructions

Ops scripts load **`.env.local` automatically** (same file you use locally). You do not need to duplicate every key into Cursor Secrets unless you prefer to.

### Option A — Use your existing `.env.local` (recommended)

**Locally:** copy `.env.local.example` → `.env.local`, fill in values, run ops commands as usual.

**In Cursor Cloud Agents**, pick one:

1. **Single secret (easiest):** paste your entire `.env.local` file as one **Runtime Secret** named `DOTENV_LOCAL` at [cursor.com/dashboard/cloud-agents](https://cursor.com/dashboard/cloud-agents). On startup the agent writes it to `.env.local` automatically.
2. **Environment snapshot:** when saving a cloud environment snapshot, include your `.env.local` in the VM. Future agents inherit it.
3. **Commit the file to the VM once:** at the start of an agent run, ask it to create `.env.local` from the contents you paste in chat (one-time per VM).

Verify everything loaded:

```bash
npm run ops:env:check
```

### Option B — Individual Cursor Secrets (optional)

If you already use the Secrets tab, those values take precedence over `.env.local`. See `.env.local.example` for the full key list.

Add any **missing** CLI-only keys your local file may not have yet:

| Key | Where to get it |
|-----|-----------------|
| `SUPABASE_ACCESS_TOKEN` | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_ID` | Supabase → Settings → General (project ref) |
| `SUPABASE_DB_PASSWORD` | Supabase → Settings → Database |
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` |

### Supabase: link, migrate, run SQL

```bash
npm run ops:env:check
npm run ops:db:link          # one-time per VM (or after snapshot reset)
npm run ops:db:push          # apply pending files in supabase/migrations/
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
2. `npm run ops:env:check` → `npm run ops:db:link` (if not linked) → `npm run ops:db:push`.
3. `npm run ops:deploy:prod`.
4. Verify with `npm run lint` and targeted scripts under `scripts/`.

### Network

Cloud agent VMs need outbound HTTPS to `*.supabase.co`, `api.supabase.com`, and `*.vercel.com`. If your team uses an egress allowlist, add those domains in Cursor Cloud Agents settings.

## Local development

See [README.md](README.md) and [scripts/README.md](scripts/README.md).
