# Contract: Knockout Bracket Team Propagation

## Purpose

When the group owner saves an official winner on a **Round of 16 or later** match, downstream fixture team slots update automatically per FIFA match-number feeders. Invalid member picks on affected fixtures are cleared.

## Actors

- `group_owner` — save/correct official winner via existing result API
- `group_member` — sees updated schedule; must re-pick if pick was cleared

## Scope boundary

| Match numbers | Propagation |
|---|---|
| 1–88 (group + R32) | **No** auto-propagation |
| 89–104 (R16 → Final) | **Yes** when source completes |

## Trigger

`PATCH /api/groups/{groupId}/contests/{contestId}/matches/{matchId}/result` with `{ winner }` → after `matches.winner` + `status=completed`, run `propagateKnockoutTeams(matchId)`.

## Slot rules

From `KNOCKOUT_FEEDERS[target] = [feederA, feederB]`:

| Event | Update |
|---|---|
| `feederA` completes | `target.home_team = winner(feederA)` |
| `feederB` completes | `target.away_team = winner(feederB)` |

Extended for Final: `104 ← winners of 101, 102`.

Only update targets where `status != completed`.

## Pick cleanup (FR-003b, FR-003c)

After slot writes on target match `T`:

1. Delete `predictions` where `match_id = T` and `predicted_winner` ∉ `{home_team, away_team}` (normalized compare).
2. Delete `prediction_bonus_answers` where answer references a team name removed from slot or no longer valid on `T`.
3. Retain team-neutral bonus answers (no team substring match).

Cascade: one source result may update multiple targets (e.g., SF feeders); run cleanup per affected target.

## Owner correction

Same pipeline on winner change for completed source match ≥ 89. Re-propagate all downstream slots fed by that source (direct targets only per save; recursive consistency from bracket tree walk optional — minimum: all `WINNER_TO_SLOT` entries for that source).

## API response

Existing `{ ok: true }`. Optional `{ propagated: { matchIds: string[], picksCleared: number } }` for owner diagnostics (non-breaking).

## Verification hooks

- `tests/unit/bracket-propagation.spec.ts` — R16 result → QF slot, no op for R32 result
- `tests/integration/world-cup-bracket-propagation.spec.ts` — end-to-end with test DB or mocked supabase
- Manual: complete Mexico vs England (R16) → verify QF slot updates (SC-001)

## Out of scope

- Group/R32 → R16 placeholder resolution
- Third-place match (103) loser propagation
- Kickoff time changes
