# Tasks: FIFA Match Prediction Enhancements

**Input**: Design documents from `specs/009-fifa-match-enhancements/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Unit and integration tests per `plan.md` (bracket propagation, prediction visibility, odd-match bonus).

**Organization**: Story labels match `spec.md` — `[US1]` knockout propagation, `[US2]` odd-match bonuses, `[US3]` pre-kickoff privacy. Both US1 and US3 are P1; US2 is P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`–`[US3]` per spec.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Env flags, optional schema column, copy strings, and type updates for feature 009.

- [X] T001 Add `WORLD_CUP_ODD_BONUS_ENABLED` and `WORLD_CUP_ODD_BONUS_ENABLED_AT` readers in `lib/server/world-cup/flags.ts`
- [X] T002 Create additive migration for `bonus_prompts.generation_source` (`owner` | `auto_odd`) with GRANTs in `supabase/migrations/202607050001_bonus_prompts_generation_source.sql`
- [X] T003 [P] Add pre-kickoff privacy and propagation copy strings in `lib/copy/world-cup.ts`
- [X] T004 [P] Extend Supabase types for `bonus_prompts.generation_source` in `lib/types/database.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared bracket constants and kickoff visibility helper used by multiple stories.

**CRITICAL**: No user story work until this phase is complete.

- [X] T005 Extend `KNOCKOUT_FEEDERS` with Final `104: [101, 102]`, export `MIN_PROPAGATION_MATCH_NUMBER = 89`, and add `buildWinnerToSlotMap()` in `lib/domain/world-cup/knockout-bracket.ts`
- [X] T006 [P] Implement kickoff visibility helpers (`isBeforeKickoff`, `shouldHidePeerPredictions`) in `lib/server/world-cup/prediction-visibility.ts`
- [X] T007 [P] Add team-name substring helper for selective bonus clearing in `lib/domain/world-cup/bracket-propagation.ts` (used by US1 pick cleanup)

**Checkpoint**: Bracket map and visibility primitives ready.

---

## Phase 3: User Story 1 - Knockout Schedule Stays Current After Results (Priority: P1) 🎯 MVP

**Goal**: When owner saves an R16+ winner, downstream QF/SF/Final team slots update automatically; invalid picks and team-specific bonus answers are cleared.

**Independent Test**: Complete an R16 match → corresponding QF slot shows winner without manual import; member with invalid downstream pick must re-pick; R32 result does not propagate (spec US1, SC-001–SC-002).

**Depends on**: Phase 2 complete.

**Contract**: [bracket-propagation.md](./contracts/bracket-propagation.md)

### Tests for User Story 1

- [X] T008 [P] [US1] Add unit tests for winner-to-slot map, R16+ gate, and pick/bonus invalidation rules in `tests/unit/bracket-propagation.spec.ts`
- [X] T009 [P] [US1] Add integration test for result save → propagate → pick clear in `tests/integration/world-cup-bracket-propagation.spec.ts`

### Implementation for User Story 1

- [X] T010 [US1] Implement pure propagation logic (slot targets, invalid pick detection, team-specific bonus detection) in `lib/domain/world-cup/bracket-propagation.ts`
- [X] T011 [US1] Implement `propagateKnockoutTeams(supabase, sourceMatchId)` with DB updates and prediction/bonus cleanup in `lib/server/world-cup/bracket-propagation-service.ts`
- [X] T012 [US1] Hook `propagateKnockoutTeams` after successful winner save when `match_number >= 89` in `lib/server/world-cup/match-result-service.ts`
- [X] T013 [US1] Return optional `{ propagated: { matchIds, picksCleared } }` from `app/api/groups/[groupId]/contests/[contestId]/matches/[matchId]/result/route.ts`

**Checkpoint**: Owner result entry auto-updates downstream fixtures through Final.

---

## Phase 4: User Story 3 - Member Picks Stay Private Until Kickoff (Priority: P1)

**Goal**: Regular members see only their own picks before kickoff; owner sees all; no peer aggregates; tournament forecast unchanged.

**Independent Test**: Two members pick differently pre-kickoff → each sees only self; owner sees both; after kickoff all visible (spec US3, SC-005–SC-007).

**Depends on**: Phase 2 complete. Independent of US1 completion.

**Contract**: [pre-kickoff-privacy.md](./contracts/pre-kickoff-privacy.md)

### Tests for User Story 3

- [X] T014 [P] [US3] Add unit tests for peer-row filtering, owner bypass, and kickoff-gated aggregate stats in `tests/unit/prediction-visibility.spec.ts`

### Implementation for User Story 3

- [X] T015 [US3] Extend `loadPredictionStatsForContest` with `{ viewerUserId, isOwner }` and pre-kickoff peer filtering in `lib/server/world-cup/prediction-stats.ts`
- [X] T016 [US3] Pass `isOwner`, `user.id` to stats loader (replace hardcoded `memberView`-only stats path) in `app/(authenticated)/contests/[contestId]/matches/page.tsx`
- [X] T017 [US3] Render “Available at kickoff” banner and hide peer rows in `components/world-cup/prediction-stats-panel.tsx`
- [X] T018 [US3] Confirm advanced bracket tab on same page is unchanged (no privacy filter applied) in `app/(authenticated)/contests/[contestId]/matches/page.tsx`
- [X] T028 [US3] Gate aggregate pick distributions on **kickoff** (not lock alone) for regular members on `app/(authenticated)/contests/[contestId]/stats/page.tsx` using `lib/server/world-cup/prediction-visibility.ts`; group owner retains full pre-kickoff view (FR-010, FR-012)

**Checkpoint**: Pre-kickoff privacy enforced server-side on matches tab **and** contest stats page, with owner override.

---

## Phase 5: User Story 2 - Odd Matches Offer Flat-Point Bonus Questions (Priority: P2)

**Goal**: Auto-generate one sensible bonus per qualifying odd match (+3 / 0) when both teams resolved; owner can edit/deactivate.

**Independent Test**: Odd upcoming match with resolved teams → bonus appears; score correct +3 / wrong 0; even match unchanged; past odd kickoffs skipped (spec US2, SC-003–SC-004).

**Depends on**: Phase 1 (flags + migration). Soft dependency on US1 for post-propagation team resolution.

**Contract**: [odd-match-bonus.md](./contracts/odd-match-bonus.md)

### Tests for User Story 2

- [X] T019 [P] [US2] Add unit tests for eligibility, template selection, and idempotent upsert in `tests/unit/odd-match-bonus.spec.ts`

### Implementation for User Story 2

- [X] T020 [P] [US2] Implement parameterized bonus template library in `lib/domain/world-cup/odd-match-bonus-templates.ts`
- [X] T021 [US2] Implement `ensureOddMatchBonuses(supabase, contestId)` with `prompt_key = wc2026:auto:odd:m{n}` upsert in `lib/server/world-cup/odd-match-bonus-service.ts`
- [X] T022 [US2] Call `ensureOddMatchBonuses` on schedule page load in `app/(authenticated)/contests/[contestId]/matches/page.tsx`
- [X] T023 [US2] Call `ensureOddMatchBonuses` after `propagateKnockoutTeams` in `lib/server/world-cup/bracket-propagation-service.ts`
- [X] T024 [US2] Verify auto_odd prompts score +3/0 only via existing `applyMatchScoring` per-prompt path in `lib/scoring/match-scoring.ts` (assert `incorrect_penalty = 0` on upsert; spot-check ledger reasons)

**Checkpoint**: Odd-match bonuses live for remaining knockout fixtures.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Rollout docs, lint, and quickstart validation across all stories.

- [X] T025 [P] Document new env vars in `docs/rollout/world-cup-private.md`
- [X] T026 Run `npm run lint` and fix any issues in touched files
- [X] T027 Execute manual validation checklist in `specs/009-fifa-match-enhancements/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — **MVP**
- **US3 (Phase 4)**: Depends on Phase 2 only — can run **in parallel with US1**
- **US2 (Phase 5)**: Depends on Phase 1; T023 depends on T011 (propagation hook)
- **Polish (Phase 6)**: Depends on desired user stories complete

### User Story Dependencies

| Story | Priority | Depends on | Independent test |
|-------|----------|------------|------------------|
| US1 | P1 | Phase 2 | R16 result → QF slot update |
| US3 | P1 | Phase 2 | Pre/post kickoff visibility |
| US2 | P2 | Phase 1; soft US1 for propagation hook | Odd match +3/0 bonus |

### Parallel Opportunities

- **Phase 1**: T003 ∥ T004
- **Phase 2**: T006 ∥ T007 (after T005)
- **After Phase 2**: US1 (Phase 3) ∥ US3 (Phase 4) — different files, no hard dependency
- **US1 tests**: T008 ∥ T009 (before implementation)
- **US2**: T020 ∥ T019; T022 can start before T023

### Parallel Example: P1 stories after Foundation

```bash
# Developer A — US1 propagation
T010 → T011 → T012 → T013

# Developer B — US3 privacy (simultaneously)
T014 → T015 → T016 → T017 → T018
```

### Parallel Example: User Story 1 tests

```bash
T008  # tests/unit/bracket-propagation.spec.ts
T009  # tests/integration/world-cup-bracket-propagation.spec.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: User Story 1  
4. **STOP and VALIDATE** — R16 result propagates to QF; invalid picks cleared  
5. Deploy for live tournament bracket accuracy  

### Incremental Delivery

1. Setup + Foundational → shared primitives ready  
2. **US1** → bracket auto-update (highest ops value during R16)  
3. **US3** → fair pre-kickoff picks (parallel or next)  
4. **US2** → odd-match engagement bonuses  
5. Polish → quickstart sign-off  

### Suggested MVP Scope

**User Story 1 (Phase 3)** — automatic R16+ team propagation. Delivers immediate value for Mexico vs England / remaining knockout rounds without manual bracket edits.

---

## Notes

- Propagation **does not** run for group stage or Round of 32 (`match_number < 89`) per clarifications.
- Pre-kickoff privacy is **server-side** — do not rely on UI-only hiding.
- Odd bonuses use **template library** (no required LLM) per `research.md` Decision 6.
- Rummy and tournament forecast flows must remain unchanged (SC-007).
- Total tasks: **28** (Setup 4, Foundational 3, US1 6, US3 6, US2 6, Polish 3)
