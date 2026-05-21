# Research: World Cup 2026 Themed Page Backgrounds

**Feature**: 008-world-cup-2026-design | **Date**: 2026-05-21

## Decision 1: Theme activation signal

- **Decision**: Reuse `isWorldCupContest()` from `lib/server/world-cup/resolve-group-contest.ts` for contest-scoped routes; use `resolveWorldCupContestForGroup()` for group-level `/welcome` eligibility.
- **Rationale**: Already used by group hub and 006; name + `format_label === "prediction"` matches spec without schema migration.
- **Alternatives considered**:
  - New `contest.theme` DB column — rejected (out of scope, not additive-required).
  - App-wide flag only — rejected (FR-007 requires contest context).

## Decision 2: Gradient-dominant hero stack

- **Decision**: Keep existing `.page-shell` gradient layers; add a single `::before` or child layer with `background-image`, `background-size: cover`, `opacity: 0.25` (tunable 0.2–0.3 per page in design.json), `pointer-events: none`, fixed to viewport.
- **Rationale**: Clarification session chose low-opacity texture; CSS opacity on image layer preserves gradient visibility without second full-bleed photo wash.
- **Alternatives considered**:
  - `background-blend-mode` on stacked backgrounds — rejected (harder to tune per asset, weaker predictability).
  - Next.js `Image` as `<img>` behind content — acceptable fallback if CSS url preload needed for LCP.

## Decision 3: `prefers-reduced-motion` handling

- **Decision**: Omit hero layer entirely under `@media (prefers-reduced-motion: reduce)`; gradient-only shell (FR-013). No separate user setting in v1.
- **Rationale**: Matches clarification; aligns with 007 pattern that disables decorative pattern layers under reduced motion.
- **Alternatives considered**:
  - Static images with motion off — rejected by stakeholder answer A.

## Decision 4: `/welcome` route behavior

- **Decision**: Introduce a visible World Cup welcome landing on `/welcome` when the group has an active World Cup contest—hero background + primary CTA to matches—instead of immediate redirect to matches/groups (preserve redirect for `?next=`, errors, and missing contest).
- **Rationale**: Current `welcome/page.tsx` auto-redirects in pilot mode, so FR-011 cannot be met without a stable view. Minimal copy/CTA change; styling-only spirit preserved.
- **Alternatives considered**:
  - Map welcome image to `/groups/[id]` — rejected (FR-012).
  - Hero only on matches page — rejected (violates FR-004 welcome mapping).

## Decision 5: Asset storage and references

- **Decision**: Store optimized PNG/WebP under `public/design/world-cup-2026/{welcome,prediction,standings}.webp`; reference paths in `.cursor/design.json` `themes.worldCup2026.pageBackgrounds.*.assetPath`.
- **Rationale**: Next.js static serving; reproducible deploys (FR-009); no Supabase storage for v1.
- **Alternatives considered**:
  - Remote CDN URLs — rejected for private app reproducibility.
  - Cursor workspace asset paths — rejected (not in repo deploy).

## Decision 6: Shell API extension

- **Decision**: Extend `PageShell` with optional `pageBackground?: PageBackgroundKey | null`; resolve keys to URLs/opacity from `lib/design/world-cup-theme.ts` (reads tokens aligned with design.json). Contest pages pass key from server components; `AppPageShell` stays tier-only (default null).
- **Rationale**: Contest context is server-known; avoids client-side contest fetch; keeps `/groups` on `AppPageShell` without backgrounds.
- **Alternatives considered**:
  - Global React context for theme — rejected (hydration complexity, leaks risk).

## Decision 7: Per-page opacity tuning

- **Decision**: Default `imageOpacity: 0.25`; allow per-page overrides in design.json (welcome 0.28, prediction 0.22, standings 0.25) after visual QA.
- **Rationale**: SC-002/SC-003 readability may differ per asset density; defer fine-tuning to QA without blocking structure.
- **Alternatives considered**: Single global opacity only — kept as default with per-page override optional.
