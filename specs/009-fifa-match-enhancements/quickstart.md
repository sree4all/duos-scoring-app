# Quickstart — FIFA Match Prediction Enhancements

## Goal

Verify Round of 16+ bracket propagation, odd-match auto bonuses (+3/0), and pre-kickoff prediction privacy for a live World Cup contest past group/R32.

## Prerequisites

- Feature **006** deployed; group at Round of 16 or later
- `.env.local`:

```env
GROUP_SCOPING_ENABLED=true
GROUP_PREDICTION_ENABLED=true
WORLD_CUP_PRIVATE_MODE=true
WORLD_CUP_ODD_BONUS_ENABLED=true
WORLD_CUP_ODD_BONUS_ENABLED_AT=2026-07-05T00:00:00.000Z
```

- Test users: **A** = group owner, **B** and **C** = members

## 1) Bracket propagation (SC-001, SC-002)

1. Identify an open **Quarter-Final** with one placeholder slot fed by an incomplete **Round of 16** match.
2. Owner **A** records winner on that R16 match via result API/UI.
3. Within one refresh, QF shows winner in correct home/away slot — no manual import.
4. Member **B** who picked a team no longer in the QF fixture → pick cleared; must re-pick.
5. Owner corrects R16 winner → downstream slot and picks update per contract.
6. Enter result on a **Round of 32** match (if available) → confirm **no** downstream auto-update.

## 2) Odd-match bonus (SC-003, SC-004)

1. Find odd `match_number` upcoming, both teams resolved, kickoff after `ENABLED_AT`.
2. Open schedule → one auto bonus appears with multiple-choice options.
3. Member answers; owner sets official bonus answer and scores match.
4. Correct → **+3** bonus line; wrong/blank → **0**, no negative ledger entry.
5. Even-numbered match → no new auto bonus (unless owner-configured).
6. Owner edits prompt text → members see updated version.

## 3) Pre-kickoff privacy (SC-005, SC-006, SC-007)

1. Pick different winners on same pre-kickoff R16 match as **B** and **C**.
2. **B** opens Prediction stats → sees only own row; message “Available at kickoff”; no counts/percentages.
3. **A** (owner) opens same view → sees B and C picks.
4. After kickoff passes, **B** refreshes → all rows visible.
5. Lock a match before kickoff → open `/contests/{contestId}/stats` as **B** → no aggregate pick counts for that match; after kickoff, distributions appear.
6. Open **Tournament forecast** tab → behavior unchanged from before feature.

## 4) Automated checks

```bash
npm run lint
npx tsx tests/unit/bracket-propagation.spec.ts
npx tsx tests/unit/prediction-visibility.spec.ts
npx tsx tests/unit/odd-match-bonus.spec.ts
npx tsx tests/integration/world-cup-bracket-propagation.spec.ts
```

## Contracts referenced

- [bracket-propagation.md](./contracts/bracket-propagation.md)
- [odd-match-bonus.md](./contracts/odd-match-bonus.md)
- [pre-kickoff-privacy.md](./contracts/pre-kickoff-privacy.md)

## Rollback

- Propagation/privacy: revert server hooks (manual bracket edits resume).
- Odd bonus: set `WORLD_CUP_ODD_BONUS_ENABLED=false`; deactivate auto prompts via owner UI.
