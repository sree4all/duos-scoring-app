# Contract: Stage Scoring and Progressive Reveal

## Purpose

Tournament-phase winner points with incorrect penalties, revealed to members only when the group owner opens that stage.

## Actors

- `group_owner` — edit rules, reveal stages, enter results, trigger scoring
- `group_member` — view revealed schedule, submit picks, see standings

## Stage scoring rules

For each `contest_stage_scoring_rules` row at score time:

| Outcome | Ledger `points_delta` | `reason` |
|---|---|---|
| Pick matches official winner | `correct_points` | `match_winner` |
| Pick does not match winner | `incorrect_penalty` (≤ 0) | `match_winner_miss` |
| No pick before lock | 0 | (no winner line) |

Group Stage: `incorrect_penalty = 0` → wrong pick earns 0, not a deduction.

Bonuses: unchanged from [prediction-parity](../../005-prediction-rummy-groups/contracts/prediction-parity.md); use `match_bonus_points` / per-prompt awards.

## Reveal gate

- Member list/detail queries for events MUST filter `contest_stage_scoring_rules.revealed_at IS NOT NULL` for that event’s `stage_key`.
- Owner UI shows all stages with reveal toggle and scoring editor.
- “How points work” panel shows only **revealed** stage rows to members.

## Owner configuration

- Owner MAY edit `correct_points` / `incorrect_penalty` before reveal.
- After matches in a stage are scored, rule edits apply only to **future** rescoring if owner runs explicit “recalculate stage” (append ledger adjustments per constitution III).

## Lock and time

- Member-facing lock and kickoff labels MUST use US Eastern Time.
- Default lock = kickoff unless owner sets earlier lock on event.
- Owner MAY update `events.lock_at` via `PATCH .../events/[eventId]/lock` (e.g., postponed match or earlier close).
- Pick submission at exact lock boundary: deterministic accept/reject with one clear message to the member.

## Official results

- Owner sets `matches.winner` and `status = completed` → `GroupPredictionAdapter.scoreLinkedMatch`.
- Scoring MUST be deterministic: same inputs + rule version → same ledger totals.

## Verification hooks

- Reference table tests: 20 matches across stages → expected deltas per SC-003 (`world-cup-stage-scoring.spec.ts`).
- Unrevealed stage deep link → 404 or friendly “Not open yet” (`world-cup-stage-reveal.spec.ts`, SC-005).
- Stage recalculate: rule change + recalculate produces append-only ledger adjustments with `reason`.

## Out of scope

- Extra-time / penalty shootout pick granularity (winner pick is match winner team only)
