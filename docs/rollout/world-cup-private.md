# World Cup Private Deployment

## Prerequisites (005)

Before enabling World Cup features:

1. Apply Supabase migrations through `202605200004` (World Cup) and all `005` group migrations.
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
| `WORLD_CUP_PRIVATE_MODE` | `true` / `false` | Simplified nav; redirect root to group home |
| `DEFAULT_GROUP_ID` | UUID (optional) | Auto-select group when user has single membership |

## Recommended pilot `.env.local`

```env
GROUP_SCOPING_ENABLED=true
GROUP_PREDICTION_ENABLED=true
GROUP_RUMMY_ENABLED=true
WORLD_CUP_IMPORT_ENABLED=true
WORLD_CUP_PRIVATE_MODE=true
# DEFAULT_GROUP_ID=<your-group-uuid-after-create>
```

## Operator workflow

1. Create a private group and note its UUID.
2. Set `DEFAULT_GROUP_ID` to that UUID (optional).
3. Download Kaggle CSVs into `data/worldcup-2026/` (see README there).
4. Create a **World Cup 2026** prediction contest from the group wizard.
5. Run `npm run import:worldcup -- --group-id <id> --contest-id <id>`.
6. Open **World Cup stages** and reveal Group Stage when ready.
7. Configure bonus questions in the contest wizard as needed.

## Stage recalculate

If stage point values change after some matches were scored, the group owner uses **Recalculate stage** on the stages page. This re-runs scoring for completed matches in that stage and appends net ledger adjustments (constitution: append-only).

## SC-006 spot-check

With 11 test users and a full 104-match import, open the contest leaderboard and confirm it loads in under 3 seconds on a typical connection. If slow, ensure migration `202605200004` indexes are applied.
