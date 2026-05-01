# Tasks: Generalized Scoring Platform

**Input**: Design documents from `specs/004-generalized-scoring-platform/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: No mandatory test-first requirement was specified; include validation and verification tasks for acceptance metrics.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Every task includes explicit file path(s)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare baseline documentation and migration scaffolding for generalized platform work.

- [X] T001 Document feature flag and rollout environment variables in `docs/rollout/generalized-scoring.md`
- [X] T002 Create migration scaffold for generalized schema in `supabase/migrations/202605010001_generalized_scoring_schema.sql`
- [X] T003 [P] Create shared type definitions for generalized domain in `lib/domain/generalized-scoring/types.ts`
- [X] T004 [P] Add shared constants for lifecycle states, tie-break policy, and role checks in `lib/domain/generalized-scoring/constants.ts`
- [X] T005 Define scoring reference fixture format for accuracy validation in `tests/fixtures/scoring-reference-cases.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before user-story implementation.

**CRITICAL**: User story work starts only after this phase is complete.

- [X] T006 Implement generalized repository access layer in `lib/server/generalized-scoring/repositories.ts`
- [X] T007 [P] Implement authorization helpers for admin/participant actions in `lib/server/auth/role-guards.ts`
- [X] T008 [P] Implement compatibility mapping utilities for source-system to generic entities in `lib/server/generalized-scoring/compatibility.ts`
- [X] T009 Implement immutable ledger writer service in `lib/server/generalized-scoring/ledger-service.ts`
- [X] T010 Implement configuration version snapshot service in `lib/server/generalized-scoring/config-version-service.ts`
- [X] T011 Add shared validation guardrail engine for publish readiness in `lib/server/generalized-scoring/publish-validation.ts`
- [X] T012 [P] Add audit logging utility for overrides/recompute/migration actions in `lib/server/generalized-scoring/audit-log.ts`
- [X] T013 Define generalized API route grouping and handlers index in `app/api/generalized-scoring/route.ts`
- [X] T014 Implement scoring accuracy harness against reference fixtures in `tests/integration/scoring-accuracy.spec.ts`

**Checkpoint**: Foundation complete; user stories can proceed in priority order or parallel staffing.

---

## Phase 3: User Story 1 - Launch Multi-Game Contest Without Developer Help (Priority: P1) 🎯 MVP

**Goal**: Deliver non-technical admin wizard for configuring and publishing multi-game contests.

**Independent Test**: Admin can create game type + contest + events + prompts + scoring preset and publish from UI with clear validation messages.

### Implementation for User Story 1

- [X] T015 [P] [US1] Create admin game-type management UI in `app/admin/game-types/page.tsx`
- [X] T016 [P] [US1] Create contest creation wizard shell in `app/admin/contests/new/page.tsx`
- [X] T017 [US1] Implement contest details step component in `components/admin/contest-wizard/contest-details-step.tsx`
- [X] T018 [US1] Implement events/lifecycle step component in `components/admin/contest-wizard/events-step.tsx`
- [X] T019 [US1] Implement prompts-or-metrics step component in `components/admin/contest-wizard/prompts-step.tsx`
- [X] T020 [US1] Implement scoring preset selection step in `components/admin/contest-wizard/scoring-step.tsx`
- [X] T021 [US1] Implement publish review and guardrails step in `components/admin/contest-wizard/publish-step.tsx`
- [X] T022 [US1] Implement admin save-draft and publish server actions in `app/admin/contests/new/actions.ts`
- [X] T023 [US1] Implement admin import/export template actions in `app/admin/contests/import-export/actions.ts`
- [X] T024 [US1] Implement admin configuration endpoint handlers in `app/api/generalized-scoring/admin/configuration/route.ts`
- [X] T025 [US1] Add non-technical validation/error message mapping in `lib/server/generalized-scoring/admin-error-messages.ts`

**Checkpoint**: Admin can self-serve contest setup and publish without technical tools.

---

## Phase 4: User Story 2 - Submit Entries and See Transparent Scoring (Priority: P1)

**Goal**: Deliver participant submission flows with lock enforcement, transparent tie-breaks, and provisional scoring visibility.

**Independent Test**: Participant can submit/edit before lock, is blocked after lock, sees tie-break-ranked leaderboard, and sees provisional/finalized score states.

### Implementation for User Story 2

- [X] T026 [P] [US2] Build participant contests/events listing page in `app/(authenticated)/contests/page.tsx`
- [X] T027 [US2] Build participant event submission page with status indicators in `app/(authenticated)/contests/[contestId]/events/[eventId]/page.tsx`
- [X] T028 [US2] Implement submission server actions with edit-window checks in `app/(authenticated)/contests/[contestId]/events/[eventId]/actions.ts`
- [X] T029 [US2] Implement participant leaderboard page with exact-hit and timestamp tie-break display in `app/(authenticated)/contests/[contestId]/leaderboard/page.tsx`
- [X] T030 [US2] Implement participant history breakdown page with provisional/voided badges in `app/(authenticated)/history/page.tsx`
- [X] T031 [US2] Implement participant endpoint handlers in `app/api/generalized-scoring/participant/route.ts`
- [X] T032 [US2] Implement lock policy evaluation service in `lib/server/generalized-scoring/lock-policy-service.ts`
- [X] T033 [US2] Implement participant-safe response shaping to hide admin fields in `lib/server/generalized-scoring/participant-response-shaper.ts`
- [X] T034 [US2] Add scoring projection service for leaderboard/history totals in `lib/server/generalized-scoring/scoring-projection-service.ts`
- [X] T035 [US2] Implement provisional scoring projection that excludes unresolved metrics in `lib/server/generalized-scoring/provisional-scoring-service.ts`

**Checkpoint**: Participant journey works end-to-end with lock transparency, tie-break clarity, and provisional status handling.

---

## Phase 5: User Story 3 - Recompute and Reconcile Scoring Safely (Priority: P2)

**Goal**: Enable admin recompute/reconciliation, penalty/disqualification control, dispute handling, and immutable audit trail behavior.

**Independent Test**: Admin can run scoring, apply configured penalties, process disputes within SLA workflow, void events via reversal ledger, and verify append-only history.

### Implementation for User Story 3

- [X] T036 [P] [US3] Build admin scoring operations page in `app/admin/scoring/page.tsx`
- [X] T037 [US3] Implement scoring execution action and job orchestration in `app/admin/scoring/actions.ts`
- [X] T038 [US3] Implement recompute and rollback workflow service in `lib/server/generalized-scoring/recompute-service.ts`
- [X] T039 [US3] Implement admin override workflow with mandatory reason capture in `lib/server/generalized-scoring/override-service.ts`
- [X] T040 [US3] Implement scoring rules preset evaluator v1 in `lib/server/generalized-scoring/scoring-engine.ts`
- [X] T041 [US3] Implement penalty engine for fixed and proportional deductions in `lib/server/generalized-scoring/penalty-service.ts`
- [X] T042 [US3] Implement disqualification approval workflow with optional second-admin approval in `lib/server/generalized-scoring/disqualification-approval-service.ts`
- [X] T043 [US3] Implement dispute workflow with 48-hour SLA and two-step approval in `lib/server/generalized-scoring/dispute-service.ts`
- [X] T044 [US3] Implement participant notification dispatch for dispute resolution in `lib/server/generalized-scoring/dispute-notification-service.ts`
- [X] T045 [US3] Implement voided-event reversal workflow to net points to zero in `lib/server/generalized-scoring/voided-event-service.ts`
- [X] T046 [US3] Add recompute visibility markers for participant history in `lib/server/generalized-scoring/recompute-markers.ts`
- [X] T047 [US3] Implement admin scoring/recompute API handlers in `app/api/generalized-scoring/admin/scoring/route.ts`
- [X] T048 [US3] Implement admin penalties/disputes API handlers in `app/api/generalized-scoring/admin/disputes/route.ts`
- [X] T049 [US3] Add reconciliation report generator for ledger consistency in `lib/server/generalized-scoring/reconciliation-report.ts`

**Checkpoint**: Scoring corrections, penalties, voiding, and disputes are operationally safe, traceable, and transparent.

---

## Phase 6: User Story 4 - Preserve Stable Workflow During Transition (Priority: P2)

**Goal**: Deliver phased rollout controls without breaking participant and admin workflows.

**Independent Test**: Generalized flows remain stable while rollout controls and parity checks operate.

### Implementation for User Story 4

- [X] T050 [P] [US4] Implement generalized read adapter in `lib/server/generalized-scoring/external-read-adapter.ts`
- [X] T051 [US4] Implement selective dual-write orchestrator with retry hooks in `lib/server/generalized-scoring/dual-write-orchestrator.ts`
- [X] T052 [US4] Implement migration parity checker for leaderboard/history outputs in `lib/server/generalized-scoring/parity-checker.ts`
- [X] T053 [US4] Add phase-control feature flags and defaults in `lib/server/generalized-scoring/migration-phase-flags.ts`
- [X] T054 [US4] Implement rollout visibility handlers in generalized scoring APIs
- [X] T055 [US4] Validate participant workflow integration points under rollout controls
- [X] T056 [US4] Add regression verification suite for rollout workflow stability
- [X] T057 [US4] Add rollout runbook and rollback steps in `docs/rollout/generalized-scoring.md`

**Checkpoint**: Rollout phases can progress safely while workflow continuity is preserved and regression gates are explicit.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, performance tuning, and readiness validation across all stories.

- [X] T058 [P] Add operational dashboards/alerts specification for scoring health in `docs/operations/scoring-observability.md`
- [X] T059 Optimize leaderboard/history query paths for p95 target in `lib/server/generalized-scoring/query-optimizations.ts`
- [X] T060 Add publish hard-limit policy placeholder and decision log in `docs/rollout/publish-limits-policy.md`
- [X] T061 Validate quickstart execution checklist and capture outcomes in `specs/004-generalized-scoring-platform/quickstart-validation.md`
- [X] T062 [P] Run lint/test baseline and document results in `specs/004-generalized-scoring-platform/verification-report.md`
- [X] T063 Execute scoring accuracy fixtures and record SC-003 evidence in `specs/004-generalized-scoring-platform/scoring-accuracy-report.md`
- [X] T064 Execute regression suite and record SC-007 evidence in `specs/004-generalized-scoring-platform/verification-report.md`
- [X] T065 Perform security review of role/RLS enforcement and document findings in `docs/security/generalized-scoring-review.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; recommended MVP first.
- **Phase 4 (US2)**: Depends on Phase 2 and can proceed in parallel with US1.
- **Phase 5 (US3)**: Depends on Phase 2 plus scoring/participant data paths from US2.
- **Phase 6 (US4)**: Depends on Phase 2 and compatibility primitives from US1-US3.
- **Phase 7 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1**: Independent after foundation; establishes admin-side MVP.
- **US2**: Independent after foundation; adds participant transparency and tie-break/provisional behavior.
- **US3**: Requires foundational ledger and scoring services plus participant projection outputs.
- **US4**: Requires compatibility adapters and regression/parity checks to enforce non-breaking migration.

### Within Each User Story

- Shared service logic before route handlers.
- Route handlers before UI integration tasks.
- Validation/reporting tasks before release readiness sign-off.

### Parallel Opportunities

- Setup tasks `T003` and `T004` can run in parallel.
- Foundational tasks `T007`, `T008`, and `T012` can run in parallel after `T006`.
- US1 parallel tasks: `T015` and `T016`.
- US2 parallel tasks: `T026` and `T029`.
- US3 parallel tasks: `T036` and `T041`.
- US4 parallel tasks: `T050` and `T053`.
- Polish parallel tasks: `T058` and `T062`.

---

## Parallel Example: User Story 1

```bash
Task: "T015 [US1] Create admin game-type management UI in app/admin/game-types/page.tsx"
Task: "T016 [US1] Create contest creation wizard shell in app/admin/contests/new/page.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T041 [US3] Implement penalty engine for fixed and proportional deductions in lib/server/generalized-scoring/penalty-service.ts"
Task: "T043 [US3] Implement dispute workflow with 48-hour SLA and two-step approval in lib/server/generalized-scoring/dispute-service.ts"
```

## Parallel Example: User Story 4

```bash
Task: "T050 [US4] Implement generalized read adapter in lib/server/generalized-scoring/external-read-adapter.ts"
Task: "T053 [US4] Add phase-control feature flags and defaults in lib/server/generalized-scoring/migration-phase-flags.ts"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) end-to-end.
3. Validate admin no-code setup and publish flow as first production increment.

### Incremental Delivery

1. Add US2 for participant submissions and transparent scoring state.
2. Add US3 for penalties, disputes, voiding, and audit-safe recompute.
3. Add US4 for migration safety and workflow continuity gates.
4. Finish with cross-cutting verification and performance/security hardening.

### Suggested MVP Scope

- MVP scope: **Phase 1 + Phase 2 + Phase 3 (US1)**.
