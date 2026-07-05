# Data Model — FIFA Match Prediction Enhancements

Extends [006 data-model](../006-fifa-world-cup-predictions/data-model.md). **Additive only.**

## Existing entities (unchanged structure)

### `matches`

| Field | Usage in this feature |
|---|---|
| `match_number` | Propagation gate (`>= 89`); odd bonus eligibility (`% 2 === 1`) |
| `home_team`, `away_team` | Updated by propagation service on downstream slots |
| `match_time_utc` | Pre-kickoff privacy boundary |
| `status`, `winner` | Propagation skips `status = completed` targets for team overwrite; source must be completed |

### `predictions`

| Field | Usage |
|---|---|
| `user_id`, `match_id`, `predicted_winner` | Deleted when pick ∉ `{home_team, away_team}` after propagation |

### `prediction_bonus_answers`

| Field | Usage |
|---|---|
| `answer_text` | Selectively deleted when answer references removed/affected team name |

### `bonus_prompts` / `bonus_prompt_options`

| Field | Usage |
|---|---|
| `prompt_key` | Idempotency: `wc2026:auto:odd:m{match_number}` |
| `correct_points`, `incorrect_penalty` | Auto odd: `3` / `0` |
| `match_id`, `is_active` | One auto prompt per qualifying odd match |

## Additive migration (optional column)

### `bonus_prompts.generation_source`

| Column | Type | Notes |
|---|---|---|
| `generation_source` | `text` nullable, check in (`owner`, `auto_odd`), default `owner` | Distinguishes auto-generated odd bonuses |

No new tables. No changes to `points_ledger` schema.

## Domain constants (in code, not DB)

### `KNOCKOUT_FEEDERS` (extended)

Existing map for matches 89–102 plus:

| Target | Feeders |
|---|---|
| 104 (Final) | 101, 102 |

### `MIN_PROPAGATION_MATCH_NUMBER`

`89` — Round of 16 first match in WC2026 numbering.

### `WINNER_TO_SLOT` (derived)

```text
{ sourceMatchNumber, targetMatchNumber, slot: 'home' | 'away' }
```

Built from feeders where `sourceMatchNumber >= 89`.

## State transitions

### Match team slots (downstream)

```text
scheduled/open → [propagation] → home/away slot updated (non-completed targets only)
```

### Member prediction (downstream)

```text
submitted → [propagation invalidates] → deleted → member may re-submit before lock
```

### Odd-match bonus prompt

```text
(none) → [ensureOddMatchBonuses] → active prompt with options
       → [owner edit] → owner-owned copy (generation_source may remain auto_odd)
       → [owner deactivate] → is_active = false
```

### Prediction visibility (per viewer, per match)

```text
pre_kickoff + member → peer rows hidden
pre_kickoff + owner  → all rows visible
post_kickoff + any   → all rows visible
```

## Validation rules

| Rule | Enforcement |
|---|---|
| Propagation source | `match_number >= 89` and `status = completed` with non-null `winner` |
| Propagation target | `status != completed` before team slot write |
| Pick cleanup | `predicted_winner` not in `{home, away}` after update |
| Bonus clear | Team name substring in `answer_text` matches changed/removed slot |
| Odd bonus gen | odd `match_number`, kickoff > enable timestamp, both teams non-placeholder, no owner prompt |
| Privacy | `now < match_time_utc` ⇒ filter peer rows for non-owner |

## RLS / access

No policy changes required if server uses service role or existing owner/member policies. Privacy enforced in server query layer (constitution II defense in depth).
