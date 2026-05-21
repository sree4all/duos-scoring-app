# World Cup Private Deployment

## Prerequisites (005)

Before enabling World Cup features:

1. Apply Supabase migrations through `202605220002` (World Cup + per-match bonus prompts) and all `005` group migrations.
2. Set group rollout flags (see [group-scoping.md](./group-scoping.md)):

```env
GROUP_SCOPING_ENABLED=true
GROUP_PREDICTION_ENABLED=true
GROUP_RUMMY_ENABLED=true
```

## World Cup environment variables

| Variable | Values | Purpose |
|----------|--------|---------|
| `WORLD_CUP_IMPORT_ENABLED` | `true` / `false` | Owner CSV import UI and API |
| `WORLD_CUP_PRIVATE_MODE` | `true` / `false` | Simplified nav; kid-friendly league flow |
| `DEFAULT_GROUP_ID` | UUID (optional) | Pilot group; active-group cookie fallback |
| `DEFAULT_CONTEST_ID` | UUID (optional) | Nav links for Predictions and Standings |
| `DEFAULT_INVITE_CODE` | e.g. `DQBGKVTM` | Auto-join on `/welcome` after sign-in |

## Recommended pilot `.env.local`

```env
GROUP_SCOPING_ENABLED=true
GROUP_PREDICTION_ENABLED=true
GROUP_RUMMY_ENABLED=true
WORLD_CUP_IMPORT_ENABLED=true
WORLD_CUP_PRIVATE_MODE=true
DEFAULT_GROUP_ID=<your-group-uuid>
DEFAULT_CONTEST_ID=<your-world-cup-contest-uuid>
DEFAULT_INVITE_CODE=DQBGKVTM
```

When `WORLD_CUP_PRIVATE_MODE=true`:

- Rummy UI and routes are hidden; members cannot open group settings or create groups.
- Players use a **share link** (no manual code): `/join` or `/join/DQBGKVTM` → sign in → auto-join → predictions schedule.
- Point rules for unrevealed rounds stay hidden until the owner reveals each stage.

## Share links for players

| URL | Behavior |
|-----|----------|
| `https://<app>/join` | Sign in → auto-join with `DEFAULT_INVITE_CODE` |
| `https://<app>/join/DQBGKVTM` | Sign in → auto-join with that code |
| `https://<app>/groups/<group-uuid>` | Sign in → auto-join if not a member (no 404) |

## Operator workflow

1. Create a private group and note its UUID and invite code.
2. Set `DEFAULT_GROUP_ID`, `DEFAULT_CONTEST_ID`, and `DEFAULT_INVITE_CODE`.
3. Download CSVs into `data/worldcup-2026/` (see README there) or upload on Vercel.
4. Publish the World Cup contest from the organizer hub.
5. Import the schedule, then reveal **Group Stage** when ready.
6. Share `/join` with players.

## Stage recalculate

If stage point values change after some matches were scored, the group owner uses **Recalculate stage** on the stages page. Scoring runs only for completed matches in that stage.

## SC-006 spot-check

With 11 test users and a full 104-match import, open the contest leaderboard and confirm it loads in under 3 seconds on a typical connection. If slow, ensure migration `202605200004` indexes are applied.
