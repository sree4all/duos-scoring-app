# Tasks: World Cup 2026 Themed Page Backgrounds

**Input**: Design documents from `specs/008-world-cup-2026-design/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Manual validation per `quickstart.md` and `contracts/visual-qa-checklist.md` only (no automated test tasks in spec).

**Organization**: `[US1]` welcome hero (P1), `[US2]` prediction hero (P1), `[US3]` standings hero (P1), `[US4]` cross-page coherence (P2). Foundational phase blocks all stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`–`[US4]` per `spec.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Deployable assets and design reference before shell code changes.

- [X] T001 Copy stakeholder hero PNGs into `public/design/world-cup-2026/` as `welcome.webp`, `prediction.webp`, and `standings.webp` (optimize/compress for web; FR-009)
- [X] T002 Add `themes.worldCup2026` block to `.cursor/design.json` per `specs/008-world-cup-2026-design/contracts/design-theme.md` (three `pageBackgrounds`, opacity 0.2–0.3, asset paths)
- [X] T003 [P] Verify 007 foundation present: `components/layout/page-shell.tsx`, `lib/design/tokens.ts`, and `app/globals.css` gradient shell (prerequisite from plan.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Theme module, background resolver, and `PageShell` hero layer. **Blocks all user stories.**

**CRITICAL**: No user story work until this phase is complete.

- [X] T004 Create `lib/design/world-cup-theme.ts` exporting `PageBackgroundKey`, `getPageBackgroundDef()`, and CSS variable helpers aligned with `.cursor/design.json` (FR-001, FR-002, FR-003)
- [X] T005 Implement `lib/design/resolve-page-background.ts` with route table from `specs/008-world-cup-2026-design/contracts/page-backgrounds.md` (welcome group check, contest `isWorldCupContest`, FR-007, FR-012)
- [X] T006 Extend `components/layout/page-shell.tsx` with optional `pageBackground` prop and hero texture layer (`--page-hero-image`, `--page-hero-opacity`, cover positioning)
- [X] T007 Add `.page-shell--hero` styles and `@media (prefers-reduced-motion: reduce)` suppression in `app/globals.css` (FR-003, FR-013)
- [X] T008 [P] Export server helper `resolveWelcomePageBackground(supabase, groupId)` in `lib/design/resolve-page-background.ts` using `resolveWorldCupContestForGroup` from `lib/server/world-cup/resolve-group-contest.ts` (FR-011)
- [X] T009 [P] Export server helper `resolveContestPageBackground(contest)` using `isWorldCupContest` from `lib/server/world-cup/resolve-group-contest.ts` for matches vs leaderboard pathnames (FR-004, FR-007)

**Checkpoint**: Shell renders gradient-only when `pageBackground` is null; hero layer appears when key passed and motion OK.

---

## Phase 3: User Story 1 - Immersive Welcome Arrival (Priority: P1) 🎯 MVP

**Goal**: `/welcome` shows first hero texture (~20–30% opacity) when the current group has an active World Cup prediction contest, with readable landing content.

**Independent Test**: Open `/welcome` for a WC group; dual-portrait texture over purple gradient; CTA to matches; no hero when group lacks WC contest (spec US1).

**Depends on**: Phase 2 complete.

### Implementation for User Story 1

- [X] T010 [US1] Refactor `app/(authenticated)/welcome/page.tsx` to render a visible World Cup welcome landing (headline + mint CTA to `/contests/{id}/matches`) when `resolveWorldCupContestForGroup` succeeds—preserve redirects for `?next=`, join errors, and non-pilot paths per `research.md`
- [X] T011 [US1] Wrap welcome content in `PageShell` with `tier="light"` and `pageBackground="welcome"` when group-level WC contest exists in `app/(authenticated)/welcome/page.tsx`
- [X] T012 [US1] Confirm `/groups` and `app/(authenticated)/groups/[groupId]/page.tsx` do **not** pass `pageBackground` (FR-012; remains `AppPageShell` only)
- [X] T013 [US1] Manual smoke: `/welcome` with WC group shows image 1 at low opacity; `/welcome` without WC contest shows gradient only (SC-001 partial)

**Checkpoint**: Welcome arrival themed; groups hub unchanged.

---

## Phase 4: User Story 2 - Focused Prediction Atmosphere (Priority: P1)

**Goal**: World Cup contest matches route shows second hero texture; match UI stays on glass panels.

**Independent Test**: Open `/contests/{wcId}/matches`; stadium texture visible; picks readable on glass cards; Rummy/non-WC contest has no hero (spec US2).

**Depends on**: Phase 2 complete; US1 optional for end-to-end flow.

### Implementation for User Story 2

- [X] T014 [US2] Pass `pageBackground` from `resolveContestPageBackground(contest)` on `app/(authenticated)/contests/[contestId]/matches/page.tsx` with `tier="dense"` via `PageShell` (key `prediction` when `isWorldCupContest`)
- [X] T015 [P] [US2] Ensure existing glass cards on `components/world-cup/match-schedule-list.tsx` and `components/world-cup/contest-matches-tabs.tsx` remain primary readability surfaces (FR-006)
- [X] T016 [US2] Manual smoke: WC matches page shows image 2; non-WC prediction contest on same route pattern shows gradient only (FR-007)

**Checkpoint**: Prediction atmosphere complete without layout/behavior changes.

---

## Phase 5: User Story 3 - Clear Standings on Pop-Art Backdrop (Priority: P1)

**Goal**: World Cup leaderboard shows third hero texture; table on glass panel.

**Independent Test**: Open `/contests/{wcId}/leaderboard`; pop-art texture; ranks/points readable; long table scrolls independently (spec US3).

**Depends on**: Phase 2 complete.

### Implementation for User Story 3

- [X] T017 [US3] Pass `pageBackground` from `resolveContestPageBackground(contest)` on `app/(authenticated)/contests/[contestId]/leaderboard/page.tsx` with `tier="dense"` (key `standings` when `isWorldCupContest`)
- [X] T018 [P] [US3] Verify `components/world-cup/leaderboard-list.tsx` remains inside glass card wrapper on leaderboard page (FR-006, SC-003)
- [X] T019 [US3] Manual smoke: WC leaderboard shows image 3; owner/member same route; fixed/static background during table scroll (spec edge case)

**Checkpoint**: Standings page themed; score accent colors unchanged from 007.

---

## Phase 6: User Story 4 - Theme Coherence Across the Trio (Priority: P2)

**Goal**: Sequential navigation welcome → matches → leaderboard feels like one campaign; mint CTAs and typography consistent.

**Independent Test**: Visit all three pages in one session; correct image per page; shared overlay/opacity vocabulary (spec US4).

**Depends on**: US1, US2, US3 complete.

### Implementation for User Story 4

- [X] T020 [US4] Align per-page `imageOpacity` and `objectPosition` in `.cursor/design.json` if any pilot page fails readability (tune welcome 0.28, prediction 0.22, standings 0.25 per contract defaults)
- [X] T021 [US4] Verify primary buttons and headlines on all three pages still use 007 mint CTA and typography utilities (no regression on `components/ui/button.tsx` usage)
- [X] T022 [US4] End-to-end walkthrough: `/welcome` → `/contests/{id}/matches` → `/contests/{id}/leaderboard` with no swapped images (SC-001, US4 acceptance)

**Checkpoint**: Cohesive World Cup 2026 campaign across trio.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, negative paths, lint, and sign-off.

- [X] T023 [P] Validate `prefers-reduced-motion: reduce` omits heroes on all three pages in `app/globals.css` (FR-013; quickstart step 4)
- [X] T024 [P] Confirm WC history/stats/bonus routes and `app/(authenticated)/groups/[groupId]/world-cup/*` have no `pageBackground` (spec edge cases, FR-012)
- [X] T025 Simulate slow network: gradient visible ≤3s, no CTA layout shift after hero load on pilot pages (SC-005)
- [X] T026 [P] Complete `specs/008-world-cup-2026-design/contracts/visual-qa-checklist.md` (SC-001–SC-004)
- [X] T027 Run `npm run lint` and fix any issues in touched files (`lib/design/`, `components/layout/page-shell.tsx`, welcome/matches/leaderboard pages)
- [X] T028 [P] Update `specs/008-world-cup-2026-design/quickstart.md` if asset paths or welcome landing flow changed during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001–T002 for design.json + assets)
- **User Stories (Phase 3–6)**: Depend on Foundational completion
  - US2 and US3 can run in parallel after Phase 2 (different page files)
  - US4 depends on US1–US3
- **Polish (Phase 7)**: Depends on US1–US4 (or US1–US3 minimum for QA)

### User Story Dependencies

| Story | Depends on | Can parallel with |
|-------|------------|-------------------|
| US1 | Phase 2 | — |
| US2 | Phase 2 | US3 (after Phase 2) |
| US3 | Phase 2 | US2 |
| US4 | US1, US2, US3 | — |

### Within Each User Story

- Server resolution helpers (T008–T009) before page wiring (T010–T019)
- Page `PageShell` props before manual smoke tasks

### Parallel Opportunities

- **Phase 1**: T003 parallel with T001–T002 after T002 starts
- **Phase 2**: T008, T009 parallel after T004–T006
- **Phase 4–5**: US2 (T014–T016) and US3 (T017–T019) in parallel by different developers
- **Phase 7**: T023, T024, T026, T028 parallel

---

## Parallel Example: User Story 2 + User Story 3

```bash
# After Phase 2 checkpoint:
Developer A: T014–T016 (matches/page.tsx + match components check)
Developer B: T017–T019 (leaderboard/page.tsx + leaderboard-list check)
```

---

## Parallel Example: Foundational

```bash
# After T006–T007:
Task T008: resolveWelcomePageBackground in lib/design/resolve-page-background.ts
Task T009: resolveContestPageBackground in lib/design/resolve-page-background.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T009)
3. Complete Phase 3: User Story 1 (T010–T013)
4. **STOP and VALIDATE**: Welcome hero + groups hub negative check
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → shell supports `pageBackground`
2. US1 → Welcome themed (MVP)
3. US2 → Matches themed
4. US3 → Leaderboard themed
5. US4 + Polish → Coherence tuning and QA sign-off

### Parallel Team Strategy

1. Team completes Phase 1–2 together
2. Split US2 and US3 after checkpoint
3. US4 + Phase 7 after both merge

---

## Requirement Traceability

| Requirement | Tasks |
|-------------|-------|
| FR-001, FR-002, FR-009 | T002, T004, T001 |
| FR-003 | T002, T006, T007, T020 |
| FR-004 | T009, T011, T014, T017 |
| FR-005, FR-006 | T015, T018, T026 |
| FR-007 | T005, T012, T016 |
| FR-008 | T007 (gradient fallback when no hero) |
| FR-010 | No scoring/migration tasks |
| FR-011 | T008, T010, T011 |
| FR-012 | T012, T024 |
| FR-013 | T007, T023 |
| SC-001–SC-005 | T013, T016, T019, T022, T025, T026 |

---

## Notes

- **Feature 007** must be on the branch (PageShell, glass cards, tokens).
- Stakeholder PNGs from spec session: copy from Cursor workspace `assets/` into `public/design/world-cup-2026/` during T001.
- `AppPageShell` in `app/(authenticated)/layout.tsx` intentionally does not set `pageBackground`; only explicit pages pass keys.
- Do not add hero layers to `/groups`, Rummy routes, or WC admin import/stages pages.

**Suggested task count**: 28 tasks — Setup 3, Foundational 6, US1 4, US2 3, US3 3, US4 3, Polish 6.
