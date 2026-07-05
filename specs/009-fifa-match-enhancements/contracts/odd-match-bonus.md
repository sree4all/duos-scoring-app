# Contract: Odd-Match Auto Bonus

## Purpose

Auto-generate one sensible bonus question per **odd-numbered** upcoming match (+3 correct / 0 incorrect), without owner authoring.

## Actors

- `system` — `ensureOddMatchBonuses` on schedule load and after propagation
- `group_owner` — edit/deactivate/score official answer (existing bonus admin flow)
- `group_member` — answer before lock; scored via existing `applyMatchScoring`

## Eligibility (all required)

| Condition | Rule |
|---|---|
| Match number | Odd (`match_number % 2 === 1`) |
| Kickoff | `match_time_utc > WORLD_CUP_ODD_BONUS_ENABLED_AT` |
| Teams | Both `home_team` and `away_team` pass `!isPlaceholderTeam()` |
| Existing bonus | No active owner-configured prompt for match |
| Stage | Contest stage revealed for members |
| Feature flag | `WORLD_CUP_ODD_BONUS_ENABLED=true` |

## Generation

- Service: `ensureOddMatchBonuses(supabase, contestId)`
- Template pick: deterministic from `match_number` + team names + `stage_key`
- Upsert: `prompt_key = wc2026:auto:odd:m{match_number}`, `generation_source = auto_odd`, `correct_points = 3`, `incorrect_penalty = 0`, `input_type = single_choice`, 3–5 options

## Scoring

Uses existing per-prompt bonus path in `applyMatchScoring`:

| Outcome | `points_delta` |
|---|---|
| Correct | +3 |
| Incorrect | 0 |
| Unanswered | 0 (no ledger line) |

Must never produce negative bonus delta for auto_odd prompts.

## Owner override

Owner MAY edit text/options, set official `correct_answer`, deactivate (`is_active=false`). Point values remain 3/0 unless owner explicitly changes via admin tools.

## Hooks

Call `ensureOddMatchBonuses`:

- After `propagateKnockoutTeams` (teams may newly resolve)
- On `contests/[contestId]/matches` page load (server)
- After stage reveal (optional, same page refresh)

## Verification hooks

- `tests/unit/odd-match-bonus.spec.ts` — eligibility, template output, idempotent upsert
- Manual spot-check 10 prompts for readability (SC-004)
- Ledger inspection: no negative `bonus` lines for auto_odd (SC-003)

## Out of scope

- Even-numbered auto bonuses
- Retroactive bonuses for past odd matches
- LLM API (optional future; templates are v1)
