# Tasks: App-Wide Design System Styling

**Input**: Design documents from `specs/007-design-system-styling/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Manual validation per `quickstart.md` and `contracts/visual-qa-checklist.md` only (no automated test tasks in spec).

**Organization**: `[US1]` consistent brand (P1), `[US2]` readable gameplay/admin (P1), `[US3]` mobile comfort (P2). Foundational phases block all stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`–`[US3]` per `spec.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm design source and implementation contracts before code changes.

- [X] T001 Verify `.cursor/design.json` exists and matches token contract fields in `specs/007-design-system-styling/contracts/design-tokens.md`
- [X] T002 [P] Add implementation note in `specs/007-design-system-styling/contracts/README.md` linking planned files (`lib/design/tokens.ts`, `components/layout/page-shell.tsx`)
- [X] T003 [P] Audit current light-theme baseline in `app/globals.css` and `tailwind.config.ts` (document deltas needed for neon remap)
- [X] T004 [P] Add pathname → tier route table to `specs/007-design-system-styling/contracts/page-shell.md` (authoritative input for T009; do not create `lib/design/resolve-page-tier.ts` in this task)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Token layer, global theme, shell primitive, and UI variants. **Blocks all user stories.**

**CRITICAL**: No user story work until this phase is complete.

- [X] T005 Create `lib/design/tokens.ts` exporting colors, spacing, typography tiers (full: hero 54px, body-lg 27px; dense: title 32–36px, body 16–18px per `contracts/design-tokens.md`), radii, and shadows aligned with `.cursor/design.json` (FR-001, FR-005)
- [X] T006 Remap shadcn CSS variables and neon utilities in `app/globals.css` per `specs/007-design-system-styling/contracts/design-tokens.md`
- [X] T007 Extend `tailwind.config.ts` with `neon.*` palette, Inter `fontFamily`, spacing scale, and CTA radii from `lib/design/tokens.ts`
- [X] T008 Load Inter via `next/font/google` in `app/layout.tsx` and set `font-sans` on `body`
- [X] T009 Implement pathname → tier resolver in `lib/design/resolve-page-tier.ts` (`entry` | `light` | `dense`) using the route table in `specs/007-design-system-styling/contracts/page-shell.md` (depends on T004)
- [X] T010 Implement `PageShell` with gradient layers and conditional grid/dot/vignette in `components/layout/page-shell.tsx` per `contracts/page-shell.md`
- [X] T011 Add typography utility classes (`.text-hero`, `.text-body-lg`, `.text-title-dense`, `.text-body-dense`, `.text-caption`) in `app/globals.css`
- [X] T012 [P] Add mint CTA variants `cta` and `cta-compact` sizes in `components/ui/button.tsx` per `contracts/component-variants.md`
- [X] T013 [P] Add `glass` card variant in `components/ui/card.tsx` (semi-transparent panel, subtle border)
- [X] T014 [P] Align dark toast styling in `components/ui/sonner.tsx` for gradient shells

**Checkpoint**: Tokens, globals, shell, button/card variants ready for route rollout.

---

## Phase 3: User Story 1 - Consistent Brand Experience Everywhere (Priority: P1) 🎯 MVP

**Goal**: Guest and member surfaces share neon gradient atmosphere, mint CTAs, and entry/light typography—no legacy light-gray default theme on public or hub pages.

**Independent Test**: Visit `/login`, `/groups` (or `/welcome`), and `/contests` list; confirm shared gradient, white headline hierarchy, mint primary buttons, and pattern overlays on entry/light routes. Dense schedule pattern check deferred to US2 (`/contests/{id}/matches`).

**Depends on**: Phase 2 complete.

### Implementation for User Story 1

- [X] T015 [US1] Wrap authenticated app in `PageShell` with tier from `resolve-page-tier` in `app/(authenticated)/layout.tsx` (remove flat `bg-background` shell)
- [X] T016 [P] [US1] Apply `tier="entry"` `PageShell` and hero typography on `app/login/page.tsx`
- [X] T017 [P] [US1] Apply `tier="entry"` styling on `app/join/page.tsx` and `app/join/[code]/page.tsx`
- [X] T018 [P] [US1] Restyle `components/layout/app-nav.tsx` for dark neon chrome (borders, active link, mint accent)
- [X] T019 [P] [US1] Restyle `components/layout/world-cup-app-nav.tsx` to match `app-nav.tsx` token set
- [X] T020 [US1] Apply `tier="light"` typography and pattern shell on `app/(authenticated)/welcome/page.tsx`
- [X] T021 [US1] Apply `tier="light"` styling on `app/(authenticated)/groups/page.tsx` and `app/(authenticated)/groups/[groupId]/page.tsx`
- [X] T022 [US1] Update `app/(authenticated)/groups/join/page.tsx` and `app/(authenticated)/groups/new/page.tsx` for neon entry/light treatment
- [X] T023 [US1] Replace legacy light classes on `app/(authenticated)/contests/page.tsx` with tier-appropriate tokens
- [X] T024 [US1] Smoke-test US1 routes: zero screens defaulting to pre-change light shadcn slate theme (SC-001 partial: entry, auth, groups hub)

**Checkpoint**: Brand recognizable on entry, login, join, nav, welcome, and groups hub.

---

## Phase 4: User Story 2 - Readable Gameplay and Admin Tasks (Priority: P1)

**Goal**: Dense prediction, scoring, Rummy, and owner/admin flows stay legible with dense type tier, glass cards, compact mint CTAs, and score accent colors.

**Independent Test**: Submit a pick and view leaderboard/history; forms and tables readable on glass cards; owner settings/import styled like member views (spec US2).

**Depends on**: Phase 2 complete; US1 nav/shell recommended but dense pages testable after T015+T012+T013.

### Implementation for User Story 2

- [X] T025 [US2] Set `tier="dense"` (gradient only, no patterns) on `app/(authenticated)/contests/[contestId]/matches/page.tsx` with `Card variant="glass"` content blocks
- [X] T026 [P] [US2] Apply dense tier + glass cards on `app/(authenticated)/contests/[contestId]/leaderboard/page.tsx`
- [X] T027 [P] [US2] Apply dense tier + glass cards on `app/(authenticated)/history/page.tsx` and `components/history/prediction-history-table.tsx`
- [X] T028 [P] [US2] Apply dense tier on `app/(authenticated)/contests/[contestId]/events/[eventId]/page.tsx` and related pick forms in `components/world-cup/match-pick-form.tsx`
- [X] T029 [P] [US2] Style `components/world-cup/match-schedule-list.tsx` and `components/world-cup/match-bonus-answer-form.tsx` with dense tokens and glass sections
- [X] T030 [P] [US2] Apply dense glass layout on `app/(authenticated)/contests/[contestId]/rummy/record/page.tsx` and `app/(authenticated)/contests/[contestId]/rummy/history/page.tsx`
- [X] T031 [P] [US2] Apply dense styling on `app/(authenticated)/groups/[groupId]/settings/page.tsx` and `app/(authenticated)/groups/[groupId]/contests/new/page.tsx`
- [X] T032 [P] [US2] Apply dense styling on owner World Cup pages: `app/(authenticated)/groups/[groupId]/world-cup/import/page.tsx`, `world-cup/stages/page.tsx`, `world-cup/page.tsx`, and `components/world-cup/world-cup-organizer-hub.tsx`
- [X] T033 [P] [US2] Apply dense styling on `app/(authenticated)/contests/[contestId]/season-bonuses/page.tsx` and `app/(authenticated)/contests/[contestId]/stats/page.tsx`
- [X] T034 [P] [US2] Apply dense styling on `app/admin/scoring/page.tsx`, `app/admin/contests/new/page.tsx`, and `app/admin/game-types/page.tsx`
- [X] T035 [US2] Map positive/negative/neutral score text to `neon.score.*` tokens in `components/world-cup/stage-points-panel.tsx`, `components/world-cup/match-schedule-list.tsx`, and `components/world-cup/match-pick-form.tsx` (FR-008)
- [X] T036 [US2] Replace hardcoded `text-green-700` / `text-red-*` success/error copy with AA-compliant neon tokens in `components/world-cup/owner-match-lock-form.tsx`, `components/world-cup/owner-match-bonus-panel.tsx`, `components/rummy/hand-entry-form.tsx`, and `components/world-cup/match-bonus-answer-form.tsx`
- [X] T037 [US2] Ensure form labels, inputs, validation errors use dense typography and focus rings in shared form components under `components/world-cup/` and `components/rummy/`
- [X] T038 [US2] Use `size="cta-compact"` (or equivalent) for repeated row actions; reserve full `cta` for major page-level submits across dense routes (FR-003)
- [X] T049 [P] [US2] Apply neon tokens to auth and groups child UI: `components/auth/login-form.tsx`, `components/groups/join-group-form.tsx`, `components/groups/create-group-form.tsx`, `components/groups/group-settings-panel.tsx`, `components/groups/group-switcher.tsx`, and `components/groups/contest-wizard/*.tsx` (FR-002)
- [X] T050 [P] [US2] Apply dense glass styling to remaining World Cup panels: `components/world-cup/leaderboard-list.tsx`, `history-list.tsx`, `prediction-stats-panel.tsx`, `contest-matches-tabs.tsx`, `world-cup-stages-panel.tsx`, `world-cup-import-panel.tsx`, and `components/admin/contest-wizard/*.tsx` (FR-002)

**Checkpoint**: Gameplay, history, Rummy, and admin surfaces readable; no opaque white content panels on gradient.

---

## Phase 5: User Story 3 - Comfortable Use on Phones (Priority: P2)

**Goal**: 390px viewports have safe padding, no main-column horizontal scroll, and touch-friendly compact CTAs.

**Independent Test**: DevTools 390×844 on login, matches, leaderboard—padding OK, tap targets ≥44px on dense actions (spec US3, SC-003).

**Depends on**: US1 entry pages and US2 dense pages substantially complete.

### Implementation for User Story 3

- [X] T039 [US3] Apply reference safe padding (`layout.canvas.safePadding`) to `PageShell` and `app/(authenticated)/layout.tsx` `main` wrapper
- [X] T040 [P] [US3] Audit `app/login/page.tsx` and `app/join/page.tsx` for 390px overflow (headline wrap, full-width CTA)
- [X] T041 [P] [US3] Audit `app/(authenticated)/contests/[contestId]/matches/page.tsx` and `leaderboard/page.tsx` for horizontal scroll and compact button hit areas
- [X] T042 [US3] Fix overflow/wrap issues in `components/world-cup/match-schedule-list.tsx` and long team name rows
- [X] T043 [US3] Review `components/ui/see-more-footer.tsx` and mobile nav tap targets in `components/layout/app-nav.tsx` / `world-cup-app-nav.tsx`

**Checkpoint**: SC-003 passes on login, schedule, and leaderboard at 390px width.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: WCAG verification, full screen checklist, lint, and contrast token tuning.

- [X] T044 Run WCAG 2.1 AA contrast pass; tune `--muted-foreground` / caption opacity in `app/globals.css` if `colors.text.muted` fails on gradient or glass (SC-004)
- [X] T045 Complete all 12 rows in `specs/007-design-system-styling/contracts/visual-qa-checklist.md` plus SC-002 spot check (screens 1, 5, 6: unguided reviewer names primary CTA within 5s) (FR-012, SC-001, SC-002)
- [X] T046 Execute `specs/007-design-system-styling/quickstart.md` validation steps 1–9 and record sign-off
- [X] T047 Run `npm run lint` and fix any styling-related regressions in touched files
- [X] T048 [P] Add `prefers-reduced-motion` rule to disable decorative pattern layers in `app/globals.css` (performance note from research.md)
- [X] T051 Apply spacing scale section gaps (`verticalRhythm` 40px, `spacingSystem.scale` between major blocks) on pilot pages `app/login/page.tsx`, `app/(authenticated)/welcome/page.tsx`, and `app/(authenticated)/contests/[contestId]/matches/page.tsx` (FR-009)
- [X] T052 Audit hover, focus-visible, disabled, and error states on `components/ui/button.tsx`, nav links in `components/layout/app-nav.tsx` and `world-cup-app-nav.tsx`, and any tabs/badges; add global focus ring tokens in `app/globals.css` (FR-007)
- [X] T053 Repo-wide grep for legacy light-theme classes (`text-green-700`, `bg-white`, flat `bg-background` on panels) under `app/` and `components/`; fix stragglers missed by route passes (FR-002)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational; best after T015 (authenticated shell)
- **US3 (Phase 5)**: Depends on US1 + US2 route passes on pilot pages
- **Polish (Phase 6)**: Depends on US1–US3 implementation

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on US2/US3
- **US2 (P1)**: After Phase 2 — integrates shared shell from US1 (T015) but dense pages independently testable
- **US3 (P2)**: After US1 entry routes and US2 dense pilot pages exist

### Parallel Opportunities

- Phase 1: T002, T003, T004 in parallel (T004 before T009)
- Phase 2: T012, T013, T014 in parallel after T006–T007; T009 after T004
- US1: T016–T019 in parallel after T015
- US2: T026–T034, T049, T050 in parallel after T025 establishes pattern
- US3: T040, T041 in parallel
- Polish: T048, T051 parallel where different files; T053 after US2 route passes

---

## Parallel Example: User Story 2

```bash
# After T025 (matches page pattern), launch dense route updates together:
T026 leaderboard/page.tsx
T027 history/page.tsx + prediction-history-table.tsx
T030 rummy record + history pages
T032 world-cup import + stages + hub
```

---

## Parallel Example: Foundational

```bash
# After T006 globals.css, parallel UI primitives:
T012 components/ui/button.tsx
T013 components/ui/card.tsx
T014 components/ui/sonner.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 Setup  
2. Complete Phase 2 Foundational (**critical**)  
3. Complete Phase 3 US1 (login, nav, groups hub, authenticated shell)  
4. **STOP and VALIDATE**: quickstart steps 1–2 + visual checklist rows 1–4  
5. Demo brand-consistent entry experience before dense rollout  

### Incremental Delivery

1. Foundational → tokens + shell + button/card  
2. US1 → brand on entry/auth/nav/hub (MVP)  
3. US2 → all dense gameplay/admin routes + score accents  
4. US3 → mobile padding and overflow fixes  
5. Polish → WCAG + 12-screen checklist + lint  

### Suggested MVP Scope

**Phases 1–3 only** (T001–T024): delivers SC-001 partial coverage and recognizable neon brand on entry surfaces; dense pages remain until US2.

---

## Notes

- **Post-analyze remediation (2026-05-21)**: E1 → T004 documents tiers in `contracts/page-shell.md` before T009; C4 → T049–T050 child components + T053 grep; C1 → T052 focus states; C3 → T045 + quickstart §5 SC-002; C2 → T051 spacing pilots  
- **FR-010**: Do not modify `supabase/migrations/`, `lib/scoring/`, or API route handlers except import path unrelated to styling  
- Tune caption muted opacity in T044 rather than relaxing WCAG requirement  
- `[P]` tasks touch different files; avoid two agents editing `app/globals.css` simultaneously  
- Commit after Phase 2 checkpoint and after each user story phase  

---

## Task Summary

| Phase | Task IDs | Count |
|-------|----------|-------|
| Setup | T001–T004 | 4 |
| Foundational | T005–T014 | 10 |
| US1 | T015–T024 | 10 |
| US2 | T025–T038, T049–T050 | 16 |
| US3 | T039–T043 | 5 |
| Polish | T044–T048, T051–T053 | 8 |
| **Total** | **53** | **53** |

| User story | Tasks | Independent test |
|------------|-------|------------------|
| US1 | 10 | Login + groups + one contest route; shared gradient/mint; patterns on entry only |
| US2 | 16 | Pick + leaderboard/history; glass cards; child components; admin styled; score accent colors |
| US3 | 5 | 390px login, matches, leaderboard; padding and tap targets |
