# Quickstart — FIFA World Cup 2026 Private Prediction

## Goal

Verify schedule import, stage reveal, stage-based winner/penalty scoring, Eastern Time display, simplified nav, and unchanged Rummy.

## Prerequisites

- `npm install`, `.env.local` with Supabase keys
- Migrations through 005 applied; 006 migrations applied when implemented
- Kaggle CSVs in `data/worldcup-2026/` (see [contracts/world-cup-import.md](./contracts/world-cup-import.md))
- Env:

```env
GROUP_SCOPING_ENABLED=true
GROUP_PREDICTION_ENABLED=true
GROUP_RUMMY_ENABLED=true
WORLD_CUP_PRIVATE_MODE=true
WORLD_CUP_IMPORT_ENABLED=true
# DEFAULT_GROUP_ID=<uuid>  # optional after group created
```

- Test users: A = owner, B = member (2–3 members sufficient for pilot)

## 1) Import and bootstrap

1. User A creates group “World Cup 2026” (or uses `DEFAULT_GROUP_ID` group).
2. User A creates World Cup prediction contest from template.
3. Run `npm run import:worldcup -- --group-id <id> --contest-id <id>`.
4. Confirm import summary shows **104** matches (or dataset count).
5. User A reveals **Group Stage** only → User B sees group-stage fixtures, not Round of 32.

## 2) Picks and Group Stage scoring (+2 / 0)

1. User B opens a revealed match → kickoff shows **Eastern Time** (verify evening match date).
2. User B picks winner + optional bonus before lock.
3. User A locks/completes match with official winner.
4. Correct pick: **+2** on leaderboard/history; wrong pick: **0** (not negative).
5. Bonus line appears separately when configured and scored.

## 3) Knockout stage reveal and penalties

1. User A reveals **Round of 32** → members see new matches.
2. Score one match: correct **+3**, incorrect **−1** on history line `match_winner_miss`.
3. Repeat spot-check for Quarter-Final (+8/−3) on one reference match (SC-003 sample).

## 4) Stage rules editor

1. User A opens stage settings → change Semi-Final incorrect penalty (test value) before reveal of that stage.
2. Reveal Semi-Final → members see updated “How points work” row.

## 5) Simplified shell

1. With `WORLD_CUP_PRIVATE_MODE=true`, sign in as member → land on group home with “World Cup Picks” / “Rummy Scores”.
2. Confirm `/admin` not linked from member UI.
3. Unrevealed stage URL (if known match id) → friendly blocked state, no data leak.

## 6) Rummy regression (unchanged)

1. User A creates Rummy contest; record 2 hands.
2. Leaderboards for World Cup and Rummy stay separate.

## 6b) Void, lock override, recalculate

1. Owner moves a match lock earlier via lock edit → member sees updated Eastern Time lock.
2. Owner voids a scored match with reason → history shows void badge and zero net points.
3. Owner changes a stage point value and runs recalculate → history shows adjustment lines with reason.

## 7) Quality checks

- `npm run lint`
- `npx tsx tests/integration/world-cup-stage-scoring.spec.ts`
- `npx tsx tests/integration/world-cup-stage-reveal.spec.ts`
- `npx tsx tests/integration/group-prediction-parity.spec.ts` (bonus regression)
- Spot-check leaderboard load &lt; 3s with 11 users and full schedule (SC-006)

## Contracts referenced

- [world-cup-import.md](./contracts/world-cup-import.md)
- [stage-scoring-reveal.md](./contracts/stage-scoring-reveal.md)
- [void-and-correction.md](./contracts/void-and-correction.md)
- [simplified-shell.md](./contracts/simplified-shell.md)
- [005 prediction-parity](../005-prediction-rummy-groups/contracts/prediction-parity.md)
- [005 rummy-scoring](../005-prediction-rummy-groups/contracts/rummy-scoring.md)
