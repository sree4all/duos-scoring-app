# Contract: Points Rummy Scoring

## Purpose

Hand-level score entry for Indian **points rummy** inside a group contest.

## Actors

- `group_owner` or `designated_scorer` — record and correct hands
- `group_member` — view leaderboard and hand history

## Contest setup (owner)

- Create contest with `score_entry` mode and `points_rummy` preset
- Preset parameters (configurable within allowed bounds):
  - `max_points_per_hand` (e.g., 80)
  - `first_drop_penalty`
  - `middle_drop_penalty`
  - `full_count_penalty` (or use unmelded sum capped)

## Record hand

- **Input**:
  - `contest_id`
  - `players[]`: `{ participant_id, drop_type?, unmelded_points? }`
  - `winner_participant_id`
- **Validation**:
  - All players are contest participants and group members
  - Each player: valid `drop_type` OR non-negative `unmelded_points`
  - Computed points match preset rules
- **Effect**:
  - `rummy_hands` + `rummy_hand_players` rows
  - Ledger deltas per player for the hand
  - Leaderboard cumulative totals updated

## Correct hand

- **Actor**: owner or scorer
- **Input**: prior `hand_id`, corrected payload, `reason` (required)
- **Effect**: Append-only audit; new ledger adjustment entries; link `correction_of_hand_id`; prior hand row immutable

## Void hand

- Owner only; `void_reason` required
- Net ledger effect zeroes hand contribution; hand marked voided in history UI

## Leaderboard

- Rank by cumulative points (lower is better or higher is better per preset flag — default: **lower points wins** for points rummy)
- Drill-down lists hands in `hand_no` order with per-player breakdown

## Authorization matrix

| Action | Owner | Scorer | Member |
|---|---|---|---|
| Record hand | yes | yes | no |
| Correct hand | yes | yes | no |
| Void hand | yes | no | no |
| View leaderboard/history | yes | yes | yes |

## v1 exclusions

- Deals rummy (chips per deal)
- Automated card recognition
