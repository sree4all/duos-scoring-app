# Implementation Plan: World Cup 2026 Themed Page Backgrounds

**Branch**: `008-world-cup-2026-design` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/008-world-cup-2026-design/spec.md`

## Summary

Extend `.cursor/design.json` with a **World Cup 2026** theme (three page-specific hero textures at **20–30% opacity** over the existing neon gradient). Wire backgrounds only for **World Cup prediction contest** routes: `/welcome` (group-level WC contest check), `/contests/[id]/matches`, `/contests/[id]/leaderboard`. Suppress heroes on `/groups`, Rummy, and under `prefers-reduced-motion`. Styling-only; no schema or scoring changes.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20 LTS)  
**Primary Dependencies**: Next.js App Router, React, Tailwind CSS 3, existing `PageShell` / `lib/design/tokens.ts` (007)  
**Storage**: N/A — static assets in `public/design/world-cup-2026/`  
**Testing**: `npm run lint`; manual [quickstart.md](./quickstart.md) + [contracts/visual-qa-checklist.md](./contracts/visual-qa-checklist.md)  
**Target Platform**: Web (mobile-first, 390px+)  
**Project Type**: Next.js + Supabase (styling-only: `app/`, `components/`, `lib/design/`, `.cursor/design.json`)  
**Performance Goals**: Gradient-first paint; hero textures non-blocking; no CTA layout shift (SC-005)  
**Constraints**: FR-010 styling-only; WCAG 2.1 AA on text; gradient-dominant blend; FR-012 `/groups` no heroes; FR-013 reduced motion  
**Scale/Scope**: 3 routes + design.json + 2 lib modules + PageShell CSS + 3 asset files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Alignment |
|-----------|-----------|
| **I. Incremental compatibility** | Additive theme block; default neon unchanged; WC activation gated by existing `isWorldCupContest` |
| **II. Security / roles** | No auth/RLS changes; public static assets only |
| **III. Auditable scoring** | No scoring/ledger impact |
| **IV. Contract-driven gates** | FR-* → `contracts/*` → tasks; SC-001–SC-005 in quickstart + visual checklist |
| **V. Admin-first operability** | Leaderboard/readability preserved via glass panels; admin import routes unchanged (no heroes) |

- Pre-research gate: **PASS**
- Post-design gate: **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/008-world-cup-2026-design/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1 validation
├── contracts/
│   ├── README.md
│   ├── design-theme.md
│   ├── page-backgrounds.md
│   └── visual-qa-checklist.md
└── tasks.md             # Phase 2 (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
.cursor/
└── design.json                         # ADD themes.worldCup2026

public/design/world-cup-2026/
├── welcome.webp
├── prediction.webp
└── standings.webp

lib/design/
├── tokens.ts                           # unchanged base
├── world-cup-theme.ts                  # NEW — theme defs from design.json
└── resolve-page-background.ts          # NEW — pathname + contest → key

lib/server/world-cup/
└── resolve-group-contest.ts            # EXISTING — isWorldCupContest, resolveWorldCupContestForGroup

components/layout/
├── page-shell.tsx                      # EXTEND — pageBackground prop, hero layer
└── app-page-shell.tsx                  # unchanged (no background)

app/
├── globals.css                         # EXTEND — .page-shell--hero, reduced-motion
├── (authenticated)/welcome/page.tsx    # EXTEND — landing + welcome background
├── (authenticated)/contests/[contestId]/matches/page.tsx
└── (authenticated)/contests/[contestId]/leaderboard/page.tsx
```

**Structure Decision**: Extend 007 `PageShell` rather than per-page CSS; server pages pass `pageBackground` after contest/group resolution; assets in `public/` per FR-009.

## Complexity Tracking

No constitution violations requiring justification.

---

## Phase 0: Research

**Status**: Complete → [research.md](./research.md)

Key decisions: `isWorldCupContest` activation; CSS opacity hero layer; reduced motion omits heroes; `/welcome` landing required; `public/design/world-cup-2026/` assets; server-passed `pageBackground` prop.

---

## Phase 1: Design & Contracts

**Status**: Complete

| Artifact | Path |
|----------|------|
| Theme/background model | [data-model.md](./data-model.md) |
| design.json theme contract | [contracts/design-theme.md](./contracts/design-theme.md) |
| Page shell / routes | [contracts/page-backgrounds.md](./contracts/page-backgrounds.md) |
| Visual QA | [contracts/visual-qa-checklist.md](./contracts/visual-qa-checklist.md) |
| Validation guide | [quickstart.md](./quickstart.md) |

### Implementation sequence (for `/speckit.tasks`)

1. **Assets & design.json**: Copy/optimize three stakeholder images to `public/design/world-cup-2026/`; add `themes.worldCup2026` to `.cursor/design.json`.
2. **Theme module**: `lib/design/world-cup-theme.ts` + `resolve-page-background.ts`.
3. **Shell**: Extend `PageShell` + `globals.css` hero layer + reduced-motion rule.
4. **Welcome**: Visible WC welcome landing on `/welcome` when group has WC contest; pass `pageBackground="welcome"`.
5. **Contest routes**: Pass `prediction` / `standings` keys on matches and leaderboard when `isWorldCupContest(contest)`.
6. **QA**: Run quickstart + visual checklist; tune per-page `imageOpacity` in design.json if SC-002/SC-003 fail.

### Agent context

Run: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor-agent`

---

## Phase 2: Task Generation

**Status**: Pending — run `/speckit.tasks` to generate `tasks.md`

---

## Requirement traceability

| Requirement | Contract / validation |
|-------------|----------------------|
| FR-001, FR-002, FR-009 | `design-theme.md`, `design.json`, `world-cup-theme.ts` |
| FR-003, FR-004 | `page-backgrounds.md`, opacity in theme defs |
| FR-005, FR-006 | 007 glass cards + quickstart R1–R3 |
| FR-007, FR-011 | `resolve-page-background.ts`, welcome + contest pages |
| FR-012 | `/groups` excluded in route table |
| FR-013 | `globals.css` reduced-motion |
| FR-008 | CSS background-image fallback behavior |
| FR-010 | No `supabase/migrations`, scoring libs |
| SC-001–SC-005 | `visual-qa-checklist.md`, `quickstart.md` |
