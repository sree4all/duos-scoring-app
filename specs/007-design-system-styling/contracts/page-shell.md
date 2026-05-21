# Contract: Page Shell

**Component**: `components/layout/page-shell.tsx` (to be implemented)  
**Used by**: Root public pages, `app/(authenticated)/layout.tsx`, `app/login/page.tsx`, etc.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tier` | `"entry" \| "light" \| "dense"` | required | Controls pattern overlays and default typography context |
| `children` | ReactNode | — | Page content |
| `className` | string | optional | Layout overrides without breaking tier rules |

## Background layers (bottom to top)

1. **Gradient** (all tiers): `layout.canvas.background` — angle 145°, stops `#18004F` → `#2D0D8D` → `#102F86`, base `#12003B`.
2. **Diagonal grid** (entry, light only): `overlayPattern` line `rgba(255,255,255,0.04)`, spacing 26px, angle -45°.
3. **Dot pattern** (entry, light only): `dotPattern` enabled.
4. **Vignette** (entry, light only): strength ~0.18.
5. **Content** with safe padding: top 32, horizontal 28, bottom 40 (reference); dense may use slightly reduced vertical padding inside `main` but not below 16px horizontal on mobile.

## Tier behavior

| Tier | Patterns | Typical routes |
|------|----------|----------------|
| `entry` | All layers | `/login`, `/join` |
| `light` | All layers | `/welcome`, `/groups` hub |
| `dense` | Gradient only | contests, leaderboard, history, rummy, admin, settings |

## Layout constraints

- `min-h-screen` on shell.
- Content max-width: reference `structure.maxWidth` 340px on entry marketing; authenticated `main` may remain `max-w-2xl` but with neon padding/colors — **do not change route structure**, only shell styling.
- No legacy `bg-background` flat white on outer wrapper when shell active.

## Acceptance

- FR-004: dense route renders gradient without grid/dot when inspected in DevTools.
- FR-002: authenticated layout wraps children in `PageShell` with correct tier resolver.

## Route → tier table (authoritative for `resolve-page-tier.ts`)

Implement T004 in this table; T009 must follow these rules (longest prefix wins; default `dense` for authenticated app routes not listed).

| Pathname pattern | Tier | Notes |
|------------------|------|--------|
| `/login` | `entry` | Public auth |
| `/join`, `/join/*` | `entry` | Invite flows |
| `/welcome` | `light` | Post-auth hub |
| `/groups`, `/groups/new`, `/groups/join` | `light` | Group list / create / join |
| `/groups/[groupId]` (exact, no subpath) | `light` | Group home hub |
| `/contests` (list only) | `light` | Contest picker |
| `/contests/*/matches`, `/contests/*/leaderboard`, `/contests/*/stats`, `/contests/*/season-bonuses` | `dense` | |
| `/contests/*/events/*`, `/contests/*/rummy/*` | `dense` | |
| `/history` | `dense` | |
| `/groups/*/settings`, `/groups/*/contests/new`, `/groups/*/world-cup/*` | `dense` | Owner tools |
| `/admin/*` | `dense` | Admin surfaces |

## Tier resolver (helper)

`lib/design/resolve-page-tier.ts`: maps `pathname` → tier using the table above.
