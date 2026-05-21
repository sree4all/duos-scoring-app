# Research — FIFA World Cup 2026 Private Prediction Game

## Decision 1: Reuse `matches` + group prediction bridge (incremental)

- **Decision**: Extend existing `public.matches` and group-scoped `events.source_match_id` rather than a parallel fixture system. Add World Cup–specific columns (`match_number`, `stage_key`, `venue_label`, `dataset_version`) via additive migration.
- **Rationale**: Constitution I — `GroupPredictionAdapter` and `applyMatchScoring` already integrate with `matches`/`predictions`/`points_ledger`. A second fixture store would duplicate lock, pick, and ledger flows.
- **Alternatives considered**:
  - Separate `wc_matches` only linked at score time: rejected — doubles sync and event linking work.
  - Generalized-only events without `matches`: rejected — breaks bonus prompt `match_id` FK and parity tests.

## Decision 2: Stage scoring as per-contest configuration + scoring engine change

- **Decision**: Introduce `contest_stage_scoring_rules` (per contest, per tournament stage) with `correct_points`, `incorrect_penalty`, `revealed_at`. Update match scoring to award **correct** points on match and **incorrect_penalty** (negative delta) when pick ≠ official winner (Group Stage penalty 0).
- **Rationale**: Current `applyMatchScoring` only awards `winnerPts` on correct picks (`wDelta = 0` on miss). FIFA rules require negative deltas from knockout stages onward.
- **Alternatives considered**:
  - Global `scoring_config.match_winner_points` only: rejected — cannot vary by stage.
  - Hard-coded stage map in code: rejected — spec requires owner-updatable table (FR-007).

## Decision 3: Progressive reveal at stage granularity

- **Decision**: Members see matches and may submit picks only when the contest’s stage row has `revealed_at` set (owner action). Unrevealed stages excluded from list queries, stats, and deep-link guards.
- **Rationale**: FR-005/SC-005; prevents bracket spoilers and cognitive overload for 104 fixtures.
- **Alternatives considered**:
  - Reveal per match: too granular for owner ops.
  - Reveal all on import: rejected — explicit product requirement.

## Decision 4: Kaggle dataset import via operator CSV drop + TS script

- **Decision**: Document Kaggle download (`kagglehub` Python or Kaggle CLI) into `data/worldcup-2026/` (`matches.csv`, `teams.csv`, `host_cities.csv`, `tournament_stages.csv`). Implement `npm run import:worldcup` (`tsx scripts/import-worldcup-2026.ts`) using existing `csv-parse` + service role upsert pattern from `scripts/seed-csv.ts`.
- **Rationale**: Repo is TypeScript/Node; no Python runtime in production path. Constitution V — owner-triggered, repeatable import without code deploy for schedule tweaks.
- **Alternatives considered**:
  - Runtime `kagglehub` from Next.js API: rejected — credentials and Python dep on serverless.
  - Commit SQLite `worldcup2026.db` to repo: rejected — large/binary drift; CSV export is diffable.
  - Manual admin UI for 104 rows: rejected — SC-001 15-minute setup goal.

## Decision 5: Eastern Time display layer

- **Decision**: Store kickoffs as `timestamptz` (UTC from dataset ISO). Add `lib/utils/eastern-time.ts` using `Intl.DateTimeFormat` with `timeZone: 'America/New_York'` for all member-facing schedule/lock labels.
- **Rationale**: Spec FR-004; no `date-fns-tz` dependency today; `Intl` is built-in and handles EDT/EST for June–July 2026.
- **Alternatives considered**:
  - Per-user timezone picker: out of scope per spec assumptions.

## Decision 6: Private single-group deployment shell

- **Decision**: Feature flag `WORLD_CUP_PRIVATE_MODE=true` with optional `DEFAULT_GROUP_ID`. Root redirect to group home; nav shows only “World Cup Picks” and “Rummy”; hide `/admin/*`, legacy global `/contests` list, multi-group switcher when only one membership.
- **Rationale**: FR-013; constitution I — hide surfaces, don’t delete historical rows.
- **Alternatives considered**:
  - Hard delete IPL tables: rejected — breaks rollback and constitution additive-first rule.

## Decision 7: Kid-friendly copy as centralized strings

- **Decision**: `lib/copy/world-cup.ts` (or `messages/world-cup.ts`) for status labels (“Open”, “Locked”, “Done”), errors, and nav titles; contest wizard defaults to simple wording.
- **Rationale**: FR-015; avoids scattering strings; enables quick copy edits without logic changes.
- **Alternatives considered**:
  - i18n framework: overkill for one locale (EN, EST).

## Decision 8: Bonus parity unchanged in mechanism

- **Decision**: Keep `bonus_prompts`, `prediction_bonus_answers`, `group_tournament_config`, season bonuses tab utilities from 005; World Cup contest created from template seeds empty bonus slots owner fills.
- **Rationale**: FR-008/009; constitution III — reuse proven ledger lines (`bonus`, season sources).
- **Alternatives considered**:
  - Remove season bonuses for World Cup: rejected — spec says keep configurable bonuses.

## Decision 9: Rummy zero-change boundary

- **Decision**: No migrations or rule changes under `lib/server/rummy/*`; regression via existing quickstart section 3 and SC-008 checklist.
- **Rationale**: FR-014 explicit freeze.

## Decision 10: Rollout flags

- **Decision**: Add `WORLD_CUP_PRIVATE_MODE`, `WORLD_CUP_IMPORT_ENABLED` to `docs/rollout/world-cup-private.md`; require `GROUP_SCOPING_ENABLED` and `GROUP_PREDICTION_ENABLED` as prerequisites.
- **Rationale**: Aligns with 005 phased rollout pattern.

## Decision 11: Void and correction via 005 void service

- **Decision**: Wire World Cup group contests to existing `lib/server/generalized-scoring/voided-event-service.ts` and owner void UI; ledger reversals append per constitution III (FR-017).
- **Rationale**: Analyze C1 — spec MUST without a dedicated 006 path would miss production disputes.
- **Alternatives considered**:
  - New void tables: rejected — duplicate 004/005 behavior.

## Decision 12: Owner lock override on events

- **Decision**: Allow group owner to `PATCH events.lock_at` (earlier than kickoff or after postponement); display updated time in EST on schedule and event detail (FR-010, edge case postponed matches).
- **Rationale**: Analyze C2 — import-only default `lock_at` insufficient for real tournament ops.
- **Alternatives considered**:
  - Kickoff-only lock with no override: rejected per spec assumptions.

## Decision 13: Stage recalculate (not doc-only)

- **Decision**: Implement `recalculateStageScoring(contestId, stageKey, reason)` that re-runs `applyMatchScoring` for completed matches in stage and appends net ledger deltas when stage rules changed (FR-007).
- **Rationale**: Analyze C3 — constitution III requires auditable corrections; T058 doc stub alone is insufficient.
- **Alternatives considered**:
  - v1 forbid post-score rule edits: rejected — spec explicitly allows owner explicit recalculate.

## Technical context — resolved

All NEEDS CLARIFICATION items from planning are resolved above; no blockers for Phase 1 design.
