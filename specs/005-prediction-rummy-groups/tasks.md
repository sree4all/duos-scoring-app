# Tasks: Dual-Mode Scoring with Private Groups

**Input**: Design documents from `specs/005-prediction-rummy-groups/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: No mandatory test-first requirement in spec; include targeted validation tasks for Rummy preset math (SC-004) and group isolation (SC-002).

**Organization**: User Story 3 (groups) is implemented **before** US1/US2 because prediction and Rummy require group tenancy. Story labels match `spec.md` (`[US1]` prediction, `[US2]` rummy, `[US3]` groups, `[US4]` dual-mode UX).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`–`[US4]` per spec.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Rollout flags, shared types, and migration scaffolding.

- [X] T001 Document group rollout flags (`GROUP_SCOPING_ENABLED`, `GROUP_PREDICTION_ENABLED`, `GROUP_RUMMY_ENABLED`) in `docs/rollout/group-scoping.md`
- [X] T002 [P] Add group domain types (`Group`, `GroupMembership`, `InviteCode`, `ActiveGroupContext`) in `lib/domain/groups/types.ts`
- [X] T003 [P] Add points-rummy preset types and constants in `lib/domain/rummy/types.ts`
- [X] T004 [P] Add group role helpers (`isOwner`, `isScorer`, `canManageContests`, `canRecordRummyHand`) in `lib/server/groups/role-helpers.ts`
- [X] T005 Add Rummy reference fixture format for SC-004 in `tests/fixtures/rummy-points-reference-cases.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database tenancy, RLS, group scope guard, and `group_id` on contests. **Blocks all user stories.**

**CRITICAL**: No user story work until this phase is complete.

- [X] T006 Create migration for `groups`, `group_memberships`, `group_invite_code_history` with GRANTs in `supabase/migrations/202605190001_groups_schema.sql`
- [X] T007 Add RLS policies for group tables (member select; owner update; join via security definer RPC) in `supabase/migrations/202605190002_groups_rls.sql`
- [X] T008 Add nullable then NOT NULL `group_id` to `contests` plus index in `supabase/migrations/202605190003_contests_group_id.sql`
- [X] T009 [P] Implement invite code generator and rotation utilities in `lib/server/groups/invite-code.ts`
- [X] T010 Implement group repository (CRUD, membership, active code lookup) in `lib/server/groups/repository.ts`
- [X] T011 Implement `joinGroupByInviteCode` and `regenerateInviteCode` RPC/SQL in `supabase/migrations/202605190004_groups_join_rpc.sql`
- [X] T012 Implement active group context resolver (cookie + membership validation) in `lib/server/groups/active-context.ts`
- [X] T013 Implement `requireGroupMembership` and `requireGroupOwner` guards in `lib/server/groups/guards.ts`
- [X] T014 Implement `withGroupScope` wrapper for generalized scoring queries in `lib/server/groups/scope-guard.ts`
- [X] T015 Extend `lib/server/generalized-scoring/repositories.ts` to filter by `group_id` on all contest reads/writes
- [X] T016 Add middleware or layout loader to enforce active group on `(authenticated)` routes in `app/(authenticated)/layout.tsx`
- [X] T017 [P] Regenerate Supabase types for new tables/columns in `lib/types/database.ts`

**Checkpoint**: Group schema, RLS, and scope guard ready.

---

## Phase 3: User Story 3 - Create and Join a Private Group (Priority: P1) 🎯 Tenancy MVP

**Goal**: Self-serve groups with reusable rotating invite codes, multi-group membership, and active group switching.

**Independent Test**: Two users: A creates group and shares code; B joins; A regenerates code; old code fails; promote/transfer ownership works; B can leave or be removed and loses access; A/B in separate groups see no cross-group data (SC-002).

### Implementation for User Story 3

- [X] T022 [US3] Implement group service orchestration in `lib/server/groups/group-service.ts`
- [X] T075 [US3] Implement membership mutations with last-owner guard in `lib/server/groups/membership-service.ts`
- [X] T021 [US3] Implement owner endpoints (regenerate invite, remove member, toggle scorer) in `app/api/groups/[groupId]/members/route.ts`
- [X] T073 [US3] Implement `POST` promote-member-to-owner in `app/api/groups/[groupId]/members/promote/route.ts`
- [X] T074 [US3] Implement `POST` transfer-primary-ownership in `app/api/groups/[groupId]/members/transfer-ownership/route.ts`
- [X] T076 [P] [US3] Implement `POST` leave-group in `app/api/groups/[groupId]/leave/route.ts`
- [X] T018 [P] [US3] Implement `POST` create group handler in `app/api/groups/route.ts`
- [X] T019 [P] [US3] Implement `POST` join-by-invite handler in `app/api/groups/join/route.ts`
- [X] T020 [P] [US3] Implement `POST` switch active group handler in `app/api/groups/switch/route.ts`
- [X] T023 [P] [US3] Build create-group page in `app/(authenticated)/groups/new/page.tsx`
- [X] T024 [P] [US3] Build join-by-code page in `app/(authenticated)/groups/join/page.tsx`
- [X] T025 [US3] Build group switcher component in `components/groups/group-switcher.tsx`
- [X] T026 [US3] Build group settings page (invite, regenerate, roster, scorer toggles, promote/transfer/remove, leave group) in `app/(authenticated)/groups/[groupId]/settings/page.tsx`
- [X] T077 [US3] Add group-owner "Manage contests" link on settings page to `app/(authenticated)/groups/[groupId]/contests/new/page.tsx`
- [X] T078 [US3] Add layout guard on `app/(authenticated)/groups/[groupId]/contests/new/page.tsx` using `requireGroupOwner` and active group sync
- [X] T079 [US3] Gate or redirect `app/admin/contests/new/page.tsx` to platform-admin only; document group-owner path in `docs/rollout/group-scoping.md`
- [X] T027 [US3] Add plain-language error mapping for invalid/revoked invite codes in `lib/server/groups/error-messages.ts`
- [X] T028 [US3] Add group home route redirecting to active group contests in `app/(authenticated)/groups/page.tsx`
- [X] T029 [US3] Block participant contest list when no active group with CTA to create/join in `app/(authenticated)/contests/page.tsx`

**Checkpoint**: Groups usable end-to-end; isolation enforceable before contests.

---

## Phase 4: User Story 1 - Run a League Prediction Contest with Full Bonuses (Priority: P1)

**Goal**: Group-scoped prediction contests with winner picks, per-event bonuses, legacy single bonus, season bonuses, stats, leaderboard, and history parity.

**Independent Test**: Owner publishes prediction contest in group; member submits before lock; owner scores; bonus lines and season bonus visible; stats post-lock; no cross-group leakage (SC-003 sample).

**Depends on**: Phase 3 complete (active group + membership).

### Implementation for User Story 1

- [X] T030 [US1] Add migration linking group-scoped contests to legacy tournament bridge columns in `supabase/migrations/202605190005_group_prediction_bridge.sql`
- [X] T031 [US1] Implement `GroupPredictionAdapter` wrapping `lib/scoring/match-scoring.ts` in `lib/server/groups/prediction-adapter.ts`
- [X] T032 [P] [US1] Wire season bonuses visibility using `lib/utils/season-bonuses-tab.ts` in group context in `lib/server/groups/season-bonuses.ts`
- [X] T033 [P] [US1] Wire bonus prompt visibility using `lib/utils/tournament-question-visibility.ts` in `lib/server/groups/bonus-visibility.ts`
- [X] T034 [US1] Implement group-owner contest server actions in `app/(authenticated)/groups/[groupId]/contests/new/actions.ts` using `requireGroupOwner(groupId)`
- [X] T035 [P] [US1] Implement contest details step in `components/groups/contest-wizard/contest-details-step.tsx` (reuse fields from `components/admin/contest-wizard/contest-details-step.tsx` where helpful)
- [X] T085 [P] [US1] Implement events and lock schedule step in `components/groups/contest-wizard/events-step.tsx` (reuse from `components/admin/contest-wizard/events-step.tsx` where helpful)
- [X] T086 [P] [US1] Implement prompts/metrics and bonus questions step in `components/groups/contest-wizard/prompts-step.tsx` (reuse from `components/admin/contest-wizard/prompts-step.tsx` where helpful)
- [X] T036 [US1] Add prediction format label and scoring preset step in `components/groups/contest-wizard/scoring-step.tsx`
- [X] T087 [US1] Implement publish review step with owner guardrails in `components/groups/contest-wizard/publish-step.tsx` (reuse from `components/admin/contest-wizard/publish-step.tsx` where helpful)
- [X] T088 [US1] Compose full contest wizard shell on `app/(authenticated)/groups/[groupId]/contests/new/page.tsx` wiring details, events, prompts, scoring, and publish steps (after T078 layout guard)
- [X] T037 [US1] Add group-owner contest configuration handlers in `app/api/groups/[groupId]/contests/configuration/route.ts` (no platform-admin role required)
- [X] T038 [US1] Extend participant submission actions with group scope in `app/(authenticated)/contests/[contestId]/events/[eventId]/actions.ts`
- [X] T039 [US1] Implement owner official-results entry UI for events in `components/groups/owner-event-results-form.tsx`
- [X] T040 [US1] Hook owner results entry to scoring adapter in `app/api/groups/[groupId]/contests/[contestId]/results/route.ts`
- [X] T041 [P] [US1] Add season bonuses tab section for group contests in `app/(authenticated)/contests/[contestId]/season-bonuses/page.tsx`
- [X] T042 [US1] Implement prediction statistics view (aggregate picks, no pre-lock drafts) in `app/(authenticated)/contests/[contestId]/stats/page.tsx`
- [X] T043 [US1] Ensure leaderboard/history show bonus line items in `lib/server/generalized-scoring/scoring-projection-service.ts`
- [X] T081 [US1] Filter participant history queries by active `group_id` in `lib/server/groups/history-query.ts`
- [X] T082 [US1] Implement group-scoped history page in `app/(authenticated)/history/page.tsx` (itemized lines, voided/provisional badges)
- [X] T083 [US1] Add group history API in `app/api/groups/[groupId]/history/route.ts` with membership guard
- [X] T084 [US1] Wire group-scoped prediction void/correction using `lib/server/generalized-scoring/voided-event-service.ts` for group contests
- [X] T044 [US1] Deny non-owner contest configuration with FR-024 messaging in `lib/server/groups/guards.ts`
- [X] T045 [US1] Add parity test harness comparing adapter output to reference sheets in `tests/integration/group-prediction-parity.spec.ts`

**Checkpoint**: Full prediction+bonus experience works inside a private group.

---

## Phase 5: User Story 2 - Score Indian Rummy Sessions for a Group (Priority: P1)

**Goal**: Points-rummy hand entry by owners/scorers with presets, cumulative leaderboard, and auditable corrections.

**Independent Test**: Owner creates Rummy contest; scorer records 3+ hands with drops; totals match fixture; correction preserves audit (SC-004).

**Depends on**: Phase 3 complete.

### Implementation for User Story 2

- [X] T046 [US2] Create migration for `rummy_hands` and `rummy_hand_players` with GRANTs and RLS in `supabase/migrations/202605190006_rummy_hands_schema.sql`
- [X] T047 [US2] Implement points-rummy preset calculator (drops, cap, full count) in `lib/server/rummy/preset-calculator.ts`
- [X] T048 [US2] Implement hand recording service with ledger writes in `lib/server/rummy/hand-service.ts`
- [X] T049 [US2] Implement hand correction (append-only, `correction_reason`) in `lib/server/rummy/hand-correction-service.ts`
- [X] T050 [US2] Implement `POST` record hand API in `app/api/groups/[groupId]/rummy/hands/route.ts`
- [X] T051 [US2] Implement owner-only void hand action in `app/api/groups/[groupId]/rummy/hands/[handId]/void/route.ts`
- [X] T059 [US2] Seed `points_rummy_standard` game type/preset row in `supabase/migrations/202605190007_rummy_preset_seed.sql`
- [X] T052 [P] [US2] Build Rummy contest setup step (preset selection) in `components/groups/contest-wizard/rummy-preset-step.tsx`
- [X] T053 [P] [US2] Build hand entry form component in `components/rummy/hand-entry-form.tsx`
- [X] T054 [US2] Build scorer hand entry page in `app/(authenticated)/contests/[contestId]/rummy/record/page.tsx`
- [X] T055 [US2] Build hand history drill-down in `app/(authenticated)/contests/[contestId]/rummy/history/page.tsx`
- [X] T056 [US2] Extend leaderboard for Rummy cumulative totals in `app/(authenticated)/contests/[contestId]/leaderboard/page.tsx`
- [X] T057 [US2] Enforce owner/scorer-only writes (FR-008, FR-023) in `lib/server/rummy/hand-service.ts`
- [X] T058 [US2] Add unit tests for preset calculator against fixtures in `tests/unit/rummy-preset-calculator.spec.ts`

**Checkpoint**: Points-rummy scoring operational per contract `contracts/rummy-scoring.md`.

---

## Phase 6: User Story 4 - Operate Both Modes in the Same Group (Priority: P2)

**Goal**: One group home with clearly labeled prediction vs Rummy contests and separate leaderboards.

**Independent Test**: Group runs one prediction and one Rummy contest concurrently; contest list shows format labels; totals do not merge (spec US4).

**Depends on**: US1 and US2 complete.

### Implementation for User Story 4

- [X] T060 [P] [US4] Add contest format badge component in `components/contests/contest-format-badge.tsx`
- [X] T061 [US4] Update contest list cards with format + status in `app/(authenticated)/contests/page.tsx`
- [X] T062 [US4] Add group dashboard summary (active prediction vs rummy contests) in `app/(authenticated)/groups/[groupId]/page.tsx`
- [X] T063 [US4] Ensure separate leaderboard routes per contest (no cross-contest aggregation) in `lib/server/generalized-scoring/scoring-projection-service.ts`
- [X] T064 [US4] Add owner onboarding copy for dual formats in `components/onboarding/group-dual-format-panel.tsx`

**Checkpoint**: Dual-format operation clear for group members and owners.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Legacy migration, global route removal, performance, and quickstart validation.

- [X] T065 Archive or migrate legacy global contest routes to group-only entry in `app/page.tsx`
- [X] T066 Add one-time legacy data migration script (attach or archive unscoped contests) in `scripts/migrate-legacy-to-groups.ts`
- [X] T067 [P] Add cross-group access integration tests in `tests/integration/group-isolation.spec.ts`
- [X] T068 Optimize group-scoped leaderboard queries (group_id indexes) in `lib/server/generalized-scoring/query-optimizations.ts`
- [X] T069 Update `README.md` main routes for groups, Rummy, and group-only tenancy
- [X] T070 Run `specs/005-prediction-rummy-groups/quickstart.md` checklist and record outcomes in `specs/005-prediction-rummy-groups/quickstart-validation.md`
- [X] T071 Run `npm run lint` and document results in `specs/005-prediction-rummy-groups/verification-report.md`
- [X] T072 [P] Log join failures and cross-group denials per plan observability notes in `docs/operations/group-scoping-observability.md`

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Depends on | Delivers |
|-------|------------|----------|
| 1 Setup | — | Flags, types, fixtures |
| 2 Foundational | 1 | Schema, RLS, scope guard |
| 3 US3 Groups | 2 | Tenancy MVP |
| 4 US1 Prediction | 3 | Bonus-rich group leagues |
| 5 US2 Rummy | 3 | Points-rummy scoring |
| 6 US4 Dual UX | 4, 5 | Combined group home |
| 7 Polish | 4, 5 (6 optional) | Migration, validation |

### User Story Dependencies

- **US3 (groups)**: First among stories — **blocks US1 and US2**.
- **US1 (prediction)**: Requires US3; independent of US2.
- **US2 (rummy)**: Requires US3; independent of US1 (can parallelize with US1 after US3).
- **US4 (dual mode)**: Requires US1 + US2.

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 in parallel.
- **Phase 2**: T009, T017 in parallel after T006.
- **Phase 3**: T022 and T075 before T021/T018–T020; T018–T020 and T023–T024 in parallel after T021; T073–T076 after T075.
- **Phase 4**: T035, T085, T086 in parallel after T034; T088 after T035–T037 and T087; T032–T033, T041 in parallel after T031.
- **Phase 5**: T059 before T052; T052–T053 in parallel after T047.
- **After US3**: **US1 and US2 can be staffed in parallel.**

### Parallel Example: User Story 3

```bash
# Foundation first:
T022 lib/server/groups/group-service.ts
T075 lib/server/groups/membership-service.ts
# API routes in parallel (after T021):
T018 app/api/groups/route.ts
T019 app/api/groups/join/route.ts
T020 app/api/groups/switch/route.ts
# UI in parallel:
T023 app/(authenticated)/groups/new/page.tsx
T024 app/(authenticated)/groups/join/page.tsx
```

### Parallel Example: After US3

```bash
# Developer A — US1 prediction parity:
T031 lib/server/groups/prediction-adapter.ts
T045 tests/integration/group-prediction-parity.spec.ts

# Developer B — US2 rummy:
T047 lib/server/rummy/preset-calculator.ts
T058 tests/unit/rummy-preset-calculator.spec.ts
```

---

## Implementation Strategy

### MVP First (recommended)

1. Complete Phase 1 + Phase 2.
2. Complete Phase 3 (**US3 groups**) — tenancy MVP.
3. Complete Phase 4 (**US1 prediction**) — core league value for existing users.
4. **STOP and VALIDATE** using `quickstart.md` sections 1–2 and prediction flow.
5. Add Phase 5 (Rummy), then US4 polish.

### Incremental Delivery

1. Groups (US3) → Prediction in group (US1) → Rummy (US2) → Dual UX (US4) → Polish.
2. Each increment is independently testable per phase checkpoints.

### Suggested MVP Scope

- **Minimum**: Phases 1–3 (group create/join/switch + isolation).
- **Product MVP**: Phases 1–4 (add group-scoped prediction with full bonuses).

---

## Notes

- All new `public` tables must include explicit `GRANT`s in the same migration (see `.cursor/rules/supabase-data-api-grants.mdc`).
- Do not expose participant contests without `group_id` after Phase 2 (FR-021).
- Deals rummy is explicitly out of scope (FR-025).
- Group owners configure contests only under `app/(authenticated)/groups/[groupId]/contests/new/`; `app/admin/contests/*` is not the group-owner surface (platform operator only if retained).
- Implement `lib/server/groups/group-service.ts` (T022) and `membership-service.ts` (T075) before group API routes (T018–T021, T073–T076).
