# Research — App-Wide Design System Styling

## Decision 1: Tailwind CSS variables + shadcn semantic mapping

- **Decision**: Remap shadcn `:root` HSL variables in `app/globals.css` and extend `tailwind.config.ts` with neon palette keys sourced from `.cursor/design.json`. Keep existing `Button`, `Card`, and layout components; add variants rather than replacing the component library.
- **Rationale**: Repo already uses Tailwind 3 + shadcn/ui (`components.json`). Constitution stack constraint aligns. Central token remap propagates to all `bg-primary`, `text-muted-foreground`, etc., with minimal per-page churn.
- **Alternatives considered**:
  - CSS-in-JS theme provider: rejected — new dependency pattern, fights RSC defaults.
  - Per-page inline styles from JSON at runtime: rejected — harder to tree-shake, worse DX for lint/class sorting.
  - Replace shadcn with custom components only: rejected — scope explosion vs styling-only goal.

## Decision 2: `design.json` → `lib/design/tokens.ts` + CSS custom properties

- **Decision**: Add `lib/design/tokens.ts` exporting typed constants (colors, spacing scale, typography tiers, radii, shadows) parsed from or manually aligned with `.cursor/design.json`, with a file-header comment requiring sync when design.json changes. Mirror values into CSS variables (`--neon-*`, shadcn remaps) in `globals.css`.
- **Rationale**: FR-001 single source; TypeScript enables contrast helpers and page-tier logic; CSS vars keep Tailwind/shadcn integration.
- **Alternatives considered**:
  - Import JSON directly in Tailwind config: viable but weaker typing for tier logic; use TS module as canonical with JSON as human reference.
  - Build-time codegen script: deferred — manual sync acceptable for v1 styling pass.

## Decision 3: `PageShell` layout primitive with surface tier

- **Decision**: Introduce `components/layout/page-shell.tsx` with props `tier: "entry" | "light" | "dense"` controlling pattern overlays (entry/light = grid+dot+vignette; dense = gradient only) and default content max-width/padding from design safe margins.
- **Rationale**: Clarifications require gradient everywhere but patterns only on entry/lighter pages; avoids duplicating background CSS on 26 routes.
- **Alternatives considered**:
  - Global body background only: rejected — cannot omit patterns on dense routes without per-route overrides anyway.
  - Separate layouts per route group: rejected — duplicates authenticated vs public shells.

## Decision 4: Typography and button size tiers via Tailwind utilities

- **Decision**: Add utility classes (or `@layer components`) e.g. `.text-hero`, `.text-display-dense`, `.btn-cta`, `.btn-cta-compact` mapped to reference and scaled-down sizes. Entry/login/welcome use hero tier; authenticated data routes use dense tier.
- **Rationale**: Clarified two-tier typography and button sizing without changing DOM structure.
- **Alternatives considered**:
  - Single scale with `clamp()`: rejected — harder to meet WCAG AA on all roles with one formula.

## Decision 5: Semi-transparent “glass” cards for dense content

- **Decision**: Extend `Card` with `variant="glass"` (`bg-white/5` or similar on gradient, subtle border `rgba(255,255,255,0.08)`, light shadow) used for tables, forms, settings blocks on dense pages.
- **Rationale**: Clarification A for dense content presentation; shadcn Card already used across app.
- **Alternatives considered**:
  - Opaque dark panels: rejected — conflicts with semi-transparent clarification.
  - Flat tables on gradient: rejected — readability risk for WCAG on busy backgrounds.

## Decision 6: Inter via `next/font/google`

- **Decision**: Load Inter in `app/layout.tsx` and set `--font-sans` for Tailwind `font-sans`.
- **Rationale**: design.json primary stack lists Inter first; Next.js built-in font optimization.
- **Alternatives considered**:
  - System font only: rejected — brand drift from reference.

## Decision 7: WCAG 2.1 AA verification in manual QA

- **Decision**: Document contrast check procedure in `quickstart.md` using browser DevTools or axe; adjust muted caption opacity if `#FFFFFF` at 35% on purple fails AA for small text—bump to spec-compliant opacity in tokens.
- **Rationale**: Clarification requires AA on all text including captions; reference `rgba(255,255,255,0.35)` may fail for small captions on some gradients—implementation must tune token, not relax requirement.
- **Alternatives considered**:
  - Automated contrast CI: out of scope per spec (manual review v1).

## Decision 8: No database or API changes

- **Decision**: Zero migrations; no server contract changes.
- **Rationale**: FR-010 styling-only; constitution additive-first irrelevant when no schema touch.
- **Alternatives considered**: N/A

## Decision 9: Score accent mapping

- **Decision**: Map existing positive/negative/neutral point UI to design.json accents: `scoreGreen`, `scoreBlue`, `scoreRed` (and orange/yellow for highlights/stars where used).
- **Rationale**: FR-008; grep-driven pass on leaderboard/history components.
- **Alternatives considered**:
  - New semantic tokens unrelated to product meaning: rejected — confuses operators.

## Screen tier classification (for implementation)

| Tier | Routes (representative) |
|------|-------------------------|
| **entry** | `/login`, `/join`, `/join/[code]`, marketing-style unauthenticated landing |
| **light** | `/welcome`, `/groups` list, group home hub — pattern overlays ON |
| **dense** | `/contests/*/matches`, `/leaderboard`, `/history`, `/rummy/*`, `/groups/*/settings`, `/world-cup/*`, `/admin/*`, event detail, stats, forms |

## Performance note

- Pattern overlays use CSS gradients/repeating-linear-gradient, not image assets, to allow `prefers-reduced-motion` / low-end simplification by disabling pattern layer via media query if needed.
