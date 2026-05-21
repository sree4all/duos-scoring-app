# Tasks: FIFA World Cup 2026 Private Prediction Game

**Input**: Design documents from `specs/006-fifa-world-cup-predictions/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Integration test for stage scoring matrix (SC-003) and Rummy regression checklist (SC-008); no mandatory test-first gate in spec.

**Organization**: User Story 2 (owner import/reveal) is implemented **before** US1 because members need imported fixtures and revealed stages. Story labels match `spec.md` (`[US1]` play, `[US2]` owner setup, `[US3]` simplified shell, `[US4]` Rummy unchanged).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`–`[US4]` per spec.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Rollout flags, data drop layout, scripts, and shared types.

- [X] T000 Verify 005 prerequisites (`GROUP_SCOPING_ENABLED`, group migrations applied) documented in `docs/rollout/world-cup-private.md`
- [X] T001 Document World Cup rollout flags (`WORLD_CUP_PRIVATE_MODE`, `WORLD_CUP_IMPORT_ENABLED`, `DEFAULT_GROUP_ID`) in `docs/rollout/world-cup-private.md`
- [X] T002 Add `data/worldcup-2026/` to `.gitignore` with README pointer in `data/worldcup-2026/README.md` (operator CSV drop instructions)
- [X] T003 [P] Add World Cup domain types (`StageScoringRule`, `WorldCupImportSummary`, `StageKey`) in `lib/domain/world-cup/types.ts`
- [X] T004 [P] Add kid-friendly copy constants in `lib/copy/world-cup.ts`
- [X] T005 [P] Add `formatEasternDateTime` helpers in `lib/utils/eastern-time.ts` using `America/New_York`
- [X] T006 Add `import:worldcup` script entry in `package.json` pointing to `scripts/import-worldcup-2026.ts`
- [X] T007 [P] Add stage scoring reference matrix fixture for SC-003 in `tests/fixtures/world-cup-stage-scoring.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, RLS, stage-rules repository, and penalty-aware scoring core. **Blocks all user stories.**

**CRITICAL**: No user story work until this phase is complete.

- [X] T008 Create migration extending `matches` with WC columns (`match_number`, `season_year`, `stage_key`, `venue_label`, team display fields, `dataset_version`) in `supabase/migrations/202605200001_worldcup_matches_extend.sql`
- [X] T009 Create migration for `contest_stage_scoring_rules` and `worldcup_import_runs` with GRANTs in `supabase/migrations/202605200002_worldcup_stage_scoring.sql`
- [X] T010 Add RLS policies (member select revealed rules; owner full access; import runs owner-only) in `supabase/migrations/202605200003_worldcup_rls.sql`
- [X] T011 Add `stage_key` column to `events` for filtered schedule queries in `supabase/migrations/202605200004_events_stage_key.sql`
- [X] T011a [P] Add index on `events(contest_id, stage_key)` for schedule/leaderboard queries (SC-006) in `supabase/migrations/202605200004_events_stage_key.sql`
- [X] T012 Implement stage scoring rules repository (CRUD, seed defaults, reveal toggle) in `lib/server/world-cup/stage-rules-repository.ts`
- [X] T013 Implement `seedDefaultStageRules(contestId, groupId)` with spec default table in `lib/server/world-cup/seed-stage-rules.ts`
- [X] T014 Extend `applyMatchScoring` in `lib/scoring/match-scoring.ts` to load stage rules by `contestId`+`stage_key` and award `correct_points` / `incorrect_penalty` with `match_winner_miss` reason
- [X] T014a Implement `recalculateStageScoring` with append-only ledger adjustments in `lib/server/world-cup/recalculate-stage.ts` (FR-007)
- [X] T015 Pass `contestId` and resolve `stage_key` from event/match in `lib/server/groups/prediction-adapter.ts` when calling `applyMatchScoring`
- [X] T016 [P] Regenerate or extend Supabase types for new tables/columns in `lib/types/database.ts`
- [X] T017 Add env flag readers (`isWorldCupPrivateMode`, `isWorldCupImportEnabled`) in `lib/server/world-cup/flags.ts`

**Checkpoint**: Schema, stage rules, and penalty scoring engine ready.

---

## Phase 3: User Story 2 - Owner Sets Up and Reveals the Tournament (Priority: P1) 🎯 Data MVP

**Goal**: Import 104 fixtures from CSV, bootstrap contest events, configure/reveal stages, and re-import safely.

**Independent Test**: Owner runs import → 104 matches linked to contest events; reveals Group Stage only; edits stage points; re-import updates kickoffs without breaking completed matches (spec US2).

**Depends on**: Phase 2 complete.

### Implementation for User Story 2

- [X] T018 [US2] Implement CSV parsers and row normalizers for matches/teams/cities/stages in `lib/server/world-cup/csv-parsers.ts`
- [X] T019 [US2] Implement upsert logic for `matches` by `external_key` (`wc2026:m{n}`) in `lib/server/world-cup/match-upsert.ts`
- [X] T020 [US2] Implement bulk `events` linker (`source_match_id`, `stage_key`, default `lock_at`) in `lib/server/world-cup/event-linker.ts`
- [X] T021 [US2] Implement operator import orchestration and `worldcup_import_runs` audit in `lib/server/world-cup/import-service.ts`
- [X] T022 [US2] Implement CLI `scripts/import-worldcup-2026.ts` with `--group-id` and `--contest-id` args
- [X] T023 [US2] Add owner-only `POST` import handler in `app/api/groups/[groupId]/world-cup/import/route.ts`
- [X] T024 [P] [US2] Build owner import page with summary counts and plain errors in `app/(authenticated)/groups/[groupId]/world-cup/import/page.tsx`
- [X] T025 [P] [US2] Build stage settings + reveal toggles UI in `app/(authenticated)/groups/[groupId]/world-cup/stages/page.tsx`
- [X] T026 [US2] Add `PATCH` stage rules handler (points + `revealed_at`) in `app/api/groups/[groupId]/contests/[contestId]/stages/route.ts`
- [X] T027 [US2] Add owner guardrails and FR-018 checks on world-cup owner routes in `lib/server/world-cup/guards.ts`
- [X] T028 [US2] Add World Cup contest template preset (prediction mode, auto seed stage rules on create) in `lib/server/world-cup/contest-template.ts`
- [X] T029 [US2] Add "World Cup 2026" template option to group contest wizard in `components/groups/contest-wizard/contest-details-step.tsx`
- [X] T030 [US2] Link owner nav from group settings to import and stages pages in `app/(authenticated)/groups/[groupId]/settings/page.tsx`
- [X] T030a [US2] Add owner `PATCH` lock override handler in `app/api/groups/[groupId]/contests/[contestId]/events/[eventId]/lock/route.ts` (FR-010)
- [X] T030b [P] [US2] Add per-match lock edit control on owner schedule in `components/world-cup/owner-match-lock-form.tsx`

**Checkpoint**: Owner can import schedule, configure stages, and reveal Group Stage.

---

## Phase 4: User Story 1 - Play the World Cup Prediction Season (Priority: P1)

**Goal**: Members see revealed matches in Eastern Time, submit winner picks and bonuses, receive stage-based points including knockout penalties, leaderboard/history/stats.

**Independent Test**: Group Stage revealed; member picks before lock; owner scores; +2/0 for group stage; Round of 32 revealed shows +3/−1; bonuses itemized (spec US1, SC-002–SC-004 sample).

**Depends on**: Phase 3 (import + at least one revealed stage).

### Tests for User Story 1

- [X] T031 [US1] Add integration test for stage scoring matrix in `tests/integration/world-cup-stage-scoring.spec.ts` using `tests/fixtures/world-cup-stage-scoring.json`
- [X] T031a [P] [US1] Add integration test for unrevealed stage leakage in `tests/integration/world-cup-stage-reveal.spec.ts` (SC-005)

### Implementation for User Story 1

- [X] T032 [US1] Implement revealed-stage filter for member event queries in `lib/server/world-cup/schedule-query.ts`
- [X] T033 [P] [US1] Build match schedule list with EST kickoffs and kid status labels in `components/world-cup/match-schedule-list.tsx`
- [X] T034 [P] [US1] Build "How points work" panel (revealed stages only) in `components/world-cup/stage-points-panel.tsx`
- [X] T035 [US1] Add dedicated group contest schedule page at `app/(authenticated)/contests/[contestId]/matches/page.tsx` using revealed filter
- [X] T036 [US1] Apply `formatEasternDateTime` to event/match displays in `app/(authenticated)/contests/[contestId]/events/[eventId]/page.tsx`
- [X] T037 [US1] Block pick submission for unrevealed `stage_key` in `app/(authenticated)/contests/[contestId]/events/[eventId]/actions.ts`
- [X] T038 [US1] Return friendly "Not open yet" for unrevealed deep links in `lib/server/world-cup/schedule-query.ts`
- [X] T039 [US1] Ensure owner results entry triggers stage-aware scoring via `app/api/groups/[groupId]/contests/[contestId]/results/route.ts`
- [X] T040 [US1] Show `match_winner` and `match_winner_miss` lines in `lib/server/generalized-scoring/scoring-projection-service.ts`
- [X] T041 [P] [US1] Wire existing bonus prompts/season tab for World Cup contest (no regression) in `app/(authenticated)/contests/[contestId]/season-bonuses/page.tsx`
- [X] T042 [US1] Keep prediction stats post-lock only in `app/(authenticated)/contests/[contestId]/stats/page.tsx` with revealed-stage filter
- [X] T043 [US1] Map scoring/lock errors to `lib/copy/world-cup.ts` messages in `app/(authenticated)/contests/[contestId]/events/[eventId]/actions.ts`
- [X] T043a [US1] Enforce deterministic pick accept/reject at lock boundary in `app/(authenticated)/contests/[contestId]/events/[eventId]/actions.ts`
- [X] T043b [US1] Wire World Cup void/correction via `lib/server/generalized-scoring/voided-event-service.ts` in `app/api/groups/[groupId]/contests/[contestId]/void/route.ts` (FR-017)
- [X] T043c [P] [US1] Add owner void/correct UI on `components/world-cup/owner-event-results-form.tsx` (extend existing owner results form)

**Checkpoint**: End-to-end member prediction with stage penalties and EST display.

---

## Phase 5: User Story 3 - Simplified App for One Private Group (Priority: P1)

**Goal**: Private deployment shell—World Cup + Rummy home, hidden legacy/admin nav, optional `DEFAULT_GROUP_ID` redirect.

**Independent Test**: With `WORLD_CUP_PRIVATE_MODE=true`, member lands on group home; no global contest list; `/admin` not linked (spec US3).

**Depends on**: Phase 2 flags; benefits from Phase 3 contest existing.

### Implementation for User Story 3

- [X] T044 [US3] Implement root redirect to default/active group in `app/page.tsx` when `WORLD_CUP_PRIVATE_MODE` is true
- [X] T045 [US3] Simplify authenticated layout nav labels via `lib/copy/world-cup.ts` in `app/(authenticated)/layout.tsx`
- [X] T046 [US3] Build group home World Cup + Rummy cards in `app/(authenticated)/groups/[groupId]/page.tsx`
- [X] T047 [US3] Redirect legacy `app/(authenticated)/contests/page.tsx` to active group home when private mode enabled
- [X] T048 [US3] Hide multi-group switcher when user has single membership and `DEFAULT_GROUP_ID` set in `components/groups/group-switcher.tsx`
- [X] T049 [US3] Remove platform admin links from member-facing nav in `components/layout/app-nav.tsx`
- [X] T050 [US3] Document bootstrap steps (create group, set `DEFAULT_GROUP_ID`, import) in `README.md`

**Checkpoint**: App feels like a single-group World Cup + Rummy home.

---

## Phase 6: User Story 4 - Continue Rummy Nights in the Same Group (Priority: P2)

**Goal**: No Rummy rule changes; verify separate leaderboards and labels alongside World Cup contest.

**Independent Test**: Active Rummy + World Cup contests show separate totals and format labels (spec US4, SC-008).

**Depends on**: Phase 5 group home (labels).

### Implementation for User Story 4

- [X] T051 [US4] Verify contest list format labels ("World Cup Picks" vs "Rummy Scores") in `app/(authenticated)/groups/[groupId]/page.tsx`
- [X] T052 [US4] Confirm separate leaderboard scopes per contest (no cross-merge) in `app/(authenticated)/contests/[contestId]/leaderboard/page.tsx`
- [X] T053 [US4] Run 005 Rummy quickstart section 3 and record pass/fail in `specs/006-fifa-world-cup-predictions/quickstart-validation.md`

**Checkpoint**: Rummy regression documented; no code changes unless label gaps found.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification, docs, and quality gates.

- [X] T054 [P] Add Kaggle download instructions to `data/worldcup-2026/README.md` (Kaggle CLI / `kagglehub` export)
- [X] T055 Run full `specs/006-fifa-world-cup-predictions/quickstart.md` checklist and record outcomes in `specs/006-fifa-world-cup-predictions/quickstart-validation.md`
- [X] T056 Run `npm run lint` and document results in `specs/006-fifa-world-cup-predictions/verification-report.md`
- [X] T057 [P] Re-run `tests/integration/group-prediction-parity.spec.ts` for bonus regression after stage scoring changes
- [X] T058 Add owner recalculate-stage action in `app/api/groups/[groupId]/contests/[contestId]/stages/recalculate/route.ts` calling `lib/server/world-cup/recalculate-stage.ts`
- [X] T059 [P] Add placeholder team display strings ("TBD playoff winner") in `lib/copy/world-cup.ts` and import mapping in `lib/server/world-cup/csv-parsers.ts`
- [X] T060 Document SC-006 spot-check procedure (3s leaderboard) in `specs/006-fifa-world-cup-predictions/quickstart.md` section 7

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US2 (Phase 3)**: Depends on Foundational — **blocks US1 member schedule**
- **US1 (Phase 4)**: Depends on US2 import + reveal
- **US3 (Phase 5)**: Depends on Foundational; best after US2 contest exists
- **US4 (Phase 6)**: Depends on US3 labels (minimal)
- **Polish (Phase 7)**: Depends on desired stories complete

### User Story Dependencies

```text
Phase 2 (Foundation)
    ↓
Phase 3 US2 (Owner import/reveal) ──→ Phase 4 US1 (Member play)
    ↓                                      ↓
Phase 5 US3 (Shell) ←──────────────────────┘
    ↓
Phase 6 US4 (Rummy regression)
    ↓
Phase 7 (Polish)
```

### Parallel Opportunities

**Phase 1**: T003, T004, T005, T007 in parallel  
**Phase 2**: T016 parallel with T012–T015 after T008–T011  
**Phase 3 US2**: T024, T025 parallel after T023  
**Phase 4 US1**: T033, T034 parallel; T031 parallel with T032  
**Phase 5 US3**: T044–T049 mostly different files after T044  
**Phase 7**: T054, T057 parallel

### Parallel Example: User Story 2

```bash
# After T023 API exists:
T024: app/(authenticated)/groups/[groupId]/world-cup/import/page.tsx
T025: app/(authenticated)/groups/[groupId]/world-cup/stages/page.tsx
```

### Parallel Example: User Story 1

```bash
# After T032 schedule query:
T033: components/world-cup/match-schedule-list.tsx
T034: components/world-cup/stage-points-panel.tsx
T031: tests/integration/world-cup-stage-scoring.spec.ts
```

---

## Implementation Strategy

### MVP First (User Story 2 + User Story 1)

1. Complete Phase 1 Setup  
2. Complete Phase 2 Foundational (**critical**)  
3. Complete Phase 3 US2 — import + reveal Group Stage  
4. Complete Phase 4 US1 — picks and Group Stage scoring (+2/0)  
5. **STOP and VALIDATE** using `quickstart.md` sections 1–2  
6. Add Phase 5 US3 for private shell before pilot deploy  

### Incremental Delivery

1. Foundation + US2 → owner can load 104 matches  
2. US1 → members play revealed stages with penalties  
3. US3 → simplified nav for 11-user pilot  
4. US4 + Polish → Rummy regression and sign-off  

### Suggested MVP Scope

- **Minimum**: Phases 1–4 with Group Stage only (US2 reveal + US1 picks/scoring)  
- **Pilot-ready**: Phases 1–5 (add private shell)  
- **Full feature**: Phases 1–7 including knockout stages and verification report  

---

## Notes

- Total tasks: **68** (T000–T060, incl. T011a, T014a, T030a/b, T031a, T043a/b/c)  
- US1: **17** | US2: **15** | US3: **7** | US4: **3** | Setup: **8** | Foundational: **11** | Polish: **6**  
- `[P]` tasks = different files; avoid editing same file in parallel  
- Do not modify `lib/server/rummy/*` except label copy unless regression fails  
- Commit after each phase checkpoint; run `quickstart.md` before marking Polish complete
