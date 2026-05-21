# Implementation Plan: App-Wide Design System Styling

**Branch**: `007-design-system-styling` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/007-design-system-styling/spec.md`

## Summary

Apply the **Neon Sports Scoreboard** visual language from `.cursor/design.json` across the Next.js app **without changing behavior or layout structure**. Implement a token layer (`lib/design/tokens.ts` + CSS variables), a tiered `PageShell` (gradient everywhere; patterns on entry/light only), shadcn variant updates (mint CTA, glass cards, dense typography/button tiers), and a manual 12-screen QA pass for SC-001/SC-004.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20 LTS)  
**Primary Dependencies**: Next.js App Router, React, Tailwind CSS 3, shadcn/ui (existing), `class-variance-authority`, `next/font` (Inter)  
**Storage**: N/A (no schema changes)  
**Testing**: `npm run lint`; manual [quickstart.md](./quickstart.md) + [contracts/visual-qa-checklist.md](./contracts/visual-qa-checklist.md)  
**Target Platform**: Web (mobile-first, 390px+ viewports)  
**Project Type**: Full-stack Next.js + Supabase (styling-only touch to `app/`, `components/`)  
**Performance Goals**: No visible scroll jank on dense match lists; pattern layers disabled on dense tier; optional `prefers-reduced-motion` to drop decorative overlays  
**Constraints**: Styling-only (FR-010); WCAG 2.1 AA all text; two typography/button tiers; glass cards on dense pages; design.json authoritative (FR-001)  
**Scale/Scope**: ~26 route files, 4 UI primitives, 2 nav components, 1 authenticated layout, 1 root layout

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Alignment |
|-----------|-----------|
| **I. Incremental compatibility** | Visual-only diff; no workflow or API changes; shadcn variants extended, not removed |
| **II. Security / roles** | No auth/RLS impact |
| **III. Auditable scoring** | No scoring logic or ledger changes; score colors are presentation-only |
| **IV. Contract-driven gates** | FR-* → `contracts/*` → tasks; SC-001–SC-005 in quickstart + visual checklist |
| **V. Admin-first operability** | Dense admin tables keep readability via glass cards + dense type tier |

- Pre-research gate: **PASS**
- Post-design gate: **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/007-design-system-styling/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1 (token/surface model)
├── quickstart.md        # Phase 1 validation
├── contracts/
│   ├── README.md
│   ├── design-tokens.md
│   ├── page-shell.md
│   ├── component-variants.md
│   └── visual-qa-checklist.md
└── tasks.md             # Phase 2 (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
.cursor/
└── design.json                    # Authoritative design reference (read-only for feature)

lib/design/
├── tokens.ts                      # NEW — exported constants from design.json
└── resolve-page-tier.ts           # NEW — pathname → entry | light | dense

app/
├── globals.css                    # Neon CSS variables, utilities, gradient/pattern layers
├── layout.tsx                     # Inter font, dark shell defaults
├── login/page.tsx                 # tier=entry
└── (authenticated)/layout.tsx     # PageShell + tier resolver

components/
├── layout/
│   ├── page-shell.tsx             # NEW
│   ├── app-nav.tsx                # Dark nav chrome
│   └── world-cup-app-nav.tsx
└── ui/
    ├── button.tsx                 # cta / cta-compact variants
    ├── card.tsx                   # glass variant
    └── sonner.tsx                 # Dark toast theme

tailwind.config.ts                 # neon colors, fontFamily, spacing, radii
```

**Structure Decision**: Single Next.js app; centralized tokens + `PageShell` to avoid per-page background duplication; roll out via shared UI primitives then route wrappers.

## Complexity Tracking

No constitution violations requiring justification.

---

## Phase 0: Research

**Status**: Complete → [research.md](./research.md)

Key decisions: shadcn CSS variable remap; `lib/design/tokens.ts`; `PageShell` tiers; glass cards; Inter via `next/font`; manual WCAG QA; no DB/API changes.

---

## Phase 1: Design & Contracts

**Status**: Complete

| Artifact | Path |
|----------|------|
| Token/surface model | [data-model.md](./data-model.md) |
| Design token contract | [contracts/design-tokens.md](./contracts/design-tokens.md) |
| Page shell contract | [contracts/page-shell.md](./contracts/page-shell.md) |
| Component variants | [contracts/component-variants.md](./contracts/component-variants.md) |
| Visual QA checklist | [contracts/visual-qa-checklist.md](./contracts/visual-qa-checklist.md) |
| Validation guide | [quickstart.md](./quickstart.md) |

### Implementation sequence (for `/speckit.tasks`)

1. **Foundation**: `tokens.ts`, `globals.css`, `tailwind.config.ts`, Inter in `layout.tsx`.
2. **Shell**: `page-shell.tsx`, `resolve-page-tier.ts`, wire `app/(authenticated)/layout.tsx`, public layouts.
3. **Primitives**: Button CTA variants, Card `glass`, Sonner dark, nav chrome.
4. **Route pass**: Replace ad-hoc `bg-background` / light classes on pages; wrap dense content in `Card variant="glass"`.
5. **Score accents**: Leaderboard/history class updates per FR-008.
6. **QA**: Complete visual checklist + quickstart; tune muted caption opacity if SC-004 fails.

### Agent context

Run after plan: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor-agent`

---

## Phase 2: Task Generation

**Status**: Complete → [tasks.md](./tasks.md) (53 tasks — **implemented** 2026-05-21)

---

## Requirement traceability

| Requirement | Contract / validation |
|-------------|----------------------|
| FR-001 | `design-tokens.md`, `tokens.ts` |
| FR-002 | `page-shell.md`, all routes in visual checklist |
| FR-003 | `component-variants.md` (CTA sizes) |
| FR-004 | `page-shell.md` tier table |
| FR-005 | Typography utilities in `design-tokens.md` |
| FR-006 | Card `glass` in `component-variants.md` |
| FR-007 | Button/nav focus states |
| FR-008 | Score accent mapping |
| FR-009 | Spacing scale in tokens |
| FR-010 | No files under `lib/server/scoring`, `supabase/migrations` |
| FR-011 | No feature removal in route pass |
| FR-012 | `visual-qa-checklist.md` |
| SC-001–SC-005 | `quickstart.md` |
