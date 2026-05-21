# Contract: Group-Scoped Prediction Parity

## Purpose

Group-bound prediction contests that preserve historical league features: winner picks, bonuses, season bonuses, stats, leaderboard, history.

## Actors

- `group_owner` — configure, publish, enter official results, season bonus reveal
- `group_member` — submit picks/bonuses, view stats/leaderboard/history

## Preconditions

- Contest `group_id` set; `game_type.mode = prediction` (or hybrid with prediction events only in v1 UI)
- User is active member of contest's group

## Participant submission

- Per event before lock: winner pick + applicable bonus answers (multi-prompt and/or legacy single bonus per contest config)
- Season bonuses: visible only when contest/group config says so (timed and/or owner reveal); submissions editable until season bonus lock policy says otherwise
- After lock: edits rejected with lock message

## Official results (owner)

- Owner records winner and bonus official answers per event
- Triggers scoring run producing ledger lines: `match` / `bonus` / season bonus sources
- Scoring MUST match legacy reference behavior for equivalent config (parity tests)

## Prediction statistics

- After event lock/scored: members see aggregate distribution of picks per prompt
- MUST NOT expose other members' pre-lock drafts

## Leaderboard and history

- Same transparency rules as 004 participant contract, scoped to `group_id`
- Itemized breakdown: winner points, per-prompt bonus lines, season bonus lines
- Voided events: visible with badge and reason; net points zeroed via ledger reversals

## Out of scope (this contract)

- Global/platform contests without `group_id`
- Deals rummy

## Error messaging

- Non-owner attempting contest setup: "Only group owners can manage contests"
- Non-member access: generic not-found/forbidden per isolation contract
