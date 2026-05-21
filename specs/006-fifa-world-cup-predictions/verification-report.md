# Verification Report — 006 FIFA World Cup Private Prediction

**Date**: 2026-05-20

## Automated checks

| Check | Command | Result |
|-------|---------|--------|
| Lint | `npm run lint` | PASS |
| Stage scoring matrix | `npx tsx tests/integration/world-cup-stage-scoring.spec.ts` | PASS |
| Reveal copy / SC-005 sample | `npx tsx tests/integration/world-cup-stage-reveal.spec.ts` | PASS |
| Bonus projection parity | `npx tsx tests/integration/group-prediction-parity.spec.ts` | PASS (existing harness) |

## Manual / environment-dependent

- Full `quickstart.md` with live Supabase + Kaggle CSVs (operator)
- SC-006 leaderboard timing at 11 users
- SC-007 kid-friendly survey
- Rummy quickstart section 3 regression on deployed env

## Migrations to apply

```bash
npm run db:push
```

Files: `202605200001` through `202605200004`.
