# Contract: Component Variants

**Scope**: shadcn/ui primitives and layout chrome — presentation only.

## Button (`components/ui/button.tsx`)

| Variant | Size | Visual | When |
|---------|------|--------|------|
| `default` (remapped) | `cta` | Mint fill, radius 20px, shadow, white label | Major page CTAs on entry/light |
| `default` | `cta-compact` | Same colors, h-11 min (44px), text-base | Dense forms, table actions |
| `outline` | * | Border subtle, transparent bg, white/muted text | Secondary on dark |
| `ghost` | `sm` | Muted hover | Nav sign-out, tertiary |
| `destructive` | * | score red accent | Delete/void if present |

**States**: hover `#13C5A7`, pressed `#0D9D87`, disabled reduced opacity (still AA for label where possible).

## Card (`components/ui/card.tsx`)

| Variant | Visual | When |
|---------|--------|------|
| `default` | Remapped to glass on dark contexts | General |
| `glass` | `bg-white/5`, border `white/8`, soft shadow | Dense tables, forms, settings (FR-006) |

## Navigation (`app-nav.tsx`, `world-cup-app-nav.tsx`)

- Header: semi-transparent dark bar, `border-border` subtle, no white `bg-background/95`.
- Active link: mint or violet glow accent, not light gray `bg-secondary`.
- Inactive: `text-muted-foreground` with AA-compliant opacity.

## Form controls

- Inputs: dark fill, light border, white text, mint focus ring.
- Labels: `text-body-dense` or `text-caption` with AA contrast.
- Errors: red accent + text (not color-only per spec edge case).

## Score emphasis (existing components)

| Meaning | Token |
|---------|--------|
| Positive delta | `neon.score.green` |
| Negative delta | `neon.score.red` |
| Neutral / info | `neon.score.blue` |
| Highlight / star | `neon.accent.orange` |

## Toaster (`sonner`)

- Theme aligned to dark shell (`theme` prop or className) so toasts are not light boxes on purple gradient.

## Focus and state tokens (FR-007)

- **Focus**: `focus-visible:ring-2` using mint or `neon.violetGlow`; minimum 2px offset on dark backgrounds  
- **Disabled**: `opacity-50` + `pointer-events-none`; label still meets AA where shown  
- **Error**: destructive/red accent plus text label (never color-only)  
- Validated in implementation task T052

## Acceptance

- FR-003, FR-007, FR-008 satisfied via variant usage in pilot screens before full rollout.
