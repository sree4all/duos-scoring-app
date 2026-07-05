# Research — FIFA Match Prediction Enhancements

## Decision 1: Propagation scope — Round of 16+ only

- **Decision**: Auto-propagate team names only when the completed source match has `match_number >= 89` (Round of 16). Group stage and Round of 32 result entry does not trigger propagation.
- **Rationale**: Clarification session 2026-07-05 — tournament is live at R16; earlier rounds already resolved manually.
- **Alternatives considered**:
  - Full bracket from group stage: rejected — explicit out-of-scope.
  - Quarter-Finals onward only: rejected — would leave R16→QF manual while owner is entering R16 results now.

## Decision 2: Reverse feeder map from existing `KNOCKOUT_FEEDERS`

- **Decision**: Build `WINNER_TO_SLOT` index from `lib/domain/world-cup/knockout-bracket.ts` `KNOCKOUT_FEEDERS`: for each target match, feeder `[a, b]` maps winner(a)→home, winner(b)→away. Filter sources where `sourceMatchNumber >= 89`. Add Final feeders `104: [101, 102]` (not in current map).
- **Rationale**: Reuses verified bracket constants already used for advanced bracket picks; avoids re-parsing CSV at runtime.
- **Alternatives considered**:
  - Parse placeholder strings (“Winner Match 89”) from `home_team`/`away_team`: fragile if import labels differ.
  - Full re-import on each result: rejected — SC-002 zero manual steps.

## Decision 3: Propagation hook on existing result service

- **Decision**: Extend `setMatchOfficialResult` (called by `PATCH .../matches/[matchId]/result`) to invoke `propagateKnockoutTeams` synchronously after successful winner update, before API returns.
- **Rationale**: SC-001 “within 5 seconds on first refresh” — same request cycle satisfies latency; owner already uses this endpoint.
- **Alternatives considered**:
  - Background job/queue: overkill for ~11 users and ≤4 downstream slots per result.
  - Separate “propagate” button: rejected — admin-first operability.

## Decision 4: Invalid pick handling — delete and re-pick

- **Decision**: When propagation or correction changes `home_team`/`away_team` on a non-completed downstream match, delete `predictions` rows where `predicted_winner` is not equal to either team (case-insensitive). UI shows existing “not submitted” state.
- **Rationale**: Clarification Q2 option B — member must re-pick before lock.
- **Alternatives considered**:
  - Warning only: rejected — user chose auto-clear.
  - Block lock globally: rejected — too disruptive.

## Decision 5: Selective bonus answer clearing

- **Decision**: After pick cleanup, delete `prediction_bonus_answers` on affected matches only when `answer_text` contains a team name that was removed or no longer in `{home, away}` (case-insensitive substring match against previous slot value or affected team set). Team-neutral answers (minute brackets, “Yes/No” without team names) retained.
- **Rationale**: Clarification Q4 option C.
- **Alternatives considered**:
  - Clear all bonus answers: rejected — user choice.
  - Never clear bonus: inconsistent with team-specific prompts.

## Decision 6: Odd-match bonus generation — template library (not required LLM)

- **Decision**: Implement `odd-match-bonus-templates.ts` with ~8–12 parameterized templates (first goal team, total goals band, clean sheet, extra time, etc.) selected deterministically by `match_number % templates.length`. Upsert into `bonus_prompts` with `prompt_key = wc2026:auto:odd:m{n}`, `correct_points = 3`, `incorrect_penalty = 0`, `input_type = single_choice`.
- **Rationale**: No OpenAI/Anthropic integration exists in repo; private group needs reliable, kid-readable copy; constitution additive-first avoids new runtime dependency. Meets “sensible auto-generated” without API keys.
- **Alternatives considered**:
  - OpenAI API on each odd match: optional future enhancement behind env flag — deferred.
  - Owner-only manual bonuses: rejected — spec FR-005.

## Decision 7: Odd bonus eligibility gate

- **Decision**: Generate when: `match_number % 2 === 1`, kickoff > `WORLD_CUP_ODD_BONUS_ENABLED_AT` (env ISO timestamp, default deploy time), both teams pass `!isPlaceholderTeam()`, no existing active owner prompt for match, stage revealed.
- **Rationale**: FR-005, FR-009, clarification Q5 (both teams resolved).
- **Alternatives considered**:
  - Generate at stage reveal with placeholders: rejected — clarification.

## Decision 8: Pre-kickoff privacy — server-side filter

- **Decision**: Enforce in `loadPredictionStatsForContest` using `kickoffUtc` from schedule event vs `Date.now()`. Non-owners receive at most one visible row (self); other member rows omitted or marked hidden. Owner (`membership.isOwner`) receives full rows always.
- **Rationale**: Constitution II — must not rely on UI-only hiding; FR-010 includes aggregates (exclude all peer data).
- **Alternatives considered**:
  - Client-only mask: rejected — API leak risk.
  - RLS on `predictions`: rejected — members legitimately need own picks pre-kickoff.

## Decision 9: Kickoff visibility boundary

- **Decision**: Compare `now >= match.match_time_utc` (stored UTC kickoff aligned with Eastern display layer). No separate ET conversion for gate — existing import already normalizes kickoff to UTC consistent with `formatKickoffDisplay`.
- **Rationale**: FR-015; matches existing lock semantics.
- **Alternatives considered**:
  - Lock time instead of kickoff: rejected — spec says kickoff; edge case covers locked-before-kickoff.

## Decision 10: Optional schema marker for auto bonuses

- **Decision**: Add nullable `bonus_prompts.generation_source text check (generation_source in ('owner','auto_odd'))` default `'owner'` via additive migration; backfill auto rows on upsert.
- **Rationale**: Owner edit tracking and idempotent regen without overwriting owner prompts; additive-first.
- **Alternatives considered**:
  - `prompt_key` prefix only: sufficient for logic; column improves operability queries — use both.

## Decision 11: Feature flags

- **Decision**: `WORLD_CUP_ODD_BONUS_ENABLED=true` and `WORLD_CUP_ODD_BONUS_ENABLED_AT=<ISO>` in env; propagation and privacy always on (no flag) — low risk, clarifications require them now.
- **Rationale**: Odd bonus “from here on” cutoff; propagation/privacy are corrective for live tournament.
- **Alternatives considered**:
  - Flag all three: rejected — unnecessary ops burden for privacy/propagation.
