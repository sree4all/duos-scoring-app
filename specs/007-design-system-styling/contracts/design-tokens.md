# Contract: Design Tokens

**Source**: `.cursor/design.json`  
**Consumers**: `app/globals.css`, `tailwind.config.ts`, `lib/design/tokens.ts`

## Shadcn semantic remap (dark neon default)

| Semantic variable | design.json source | Notes |
|-------------------|-------------------|--------|
| `--background` | Page shell gradient base (not flat white) | Applied on `body` via shell wrapper; card uses `--card` |
| `--foreground` | `colors.text.primary` `#FFFFFF` | |
| `--card` | Glass surface fill | Semi-transparent on dense pages |
| `--card-foreground` | `colors.text.primary` | |
| `--primary` | `colors.cta.primary` `#10B69B` | Mint CTA |
| `--primary-foreground` | `colors.cta.text` | |
| `--muted` | Translucent purple panel | |
| `--muted-foreground` | `colors.text.muted` | Tune opacity to pass WCAG AA at caption size |
| `--border` | `colors.border.subtle` | |
| `--destructive` | `colors.accent.scoreRed` | Errors / destructive actions |
| `--ring` | `colors.accent.violetGlow` or mint focus | Visible on dark bg |

## Extended palette (Tailwind `theme.extend.colors`)

| Token key | Hex / value |
|-----------|-------------|
| `neon.deepPurple` | `#18004F` |
| `neon.royalPurple` | `#2B0A88` |
| `neon.electricBlue` | `#11398C` |
| `neon.violetGlow` | `#5917FF` |
| `neon.cta` / hover / pressed | `#10B69B` / `#13C5A7` / `#0D9D87` |
| `neon.score.green` | `#4FB84C` |
| `neon.score.blue` | `#394BFF` |
| `neon.score.red` | `#FF254D` |
| `neon.accent.orange` | `#FF7044` |
| `neon.accent.yellow` | `#E4FF3B` |

## Typography utilities

| Class / token | Reference style | Tier |
|---------------|-----------------|------|
| `text-hero` | `heroHeadline` 54px / 800 | entry, light |
| `text-body-lg` | `bodyLarge` 27px | entry, light |
| `text-title-dense` | ~32–36px bold, derived | dense |
| `text-body-dense` | ~16–18px, derived | dense |
| `text-caption` | `caption` 18px muted | all (AA-tuned opacity) |
| `text-button` | `buttonLabel` | maps to button component |

## Spacing

Use `spacingSystem.scale` from design.json: base unit 4px; keys `xs` through `4xl`; section rhythm `verticalRhythm` 40px.

**Section gaps (FR-009)**: Apply `verticalRhythm` (40px) or `spacing.2xl` between major page sections (hero → form → list); use `spacing.lg` (24px) between related in-card blocks. Pilot validation on login, welcome, and matches pages (task T051).

## Radii and shadows

| Element | Value |
|---------|--------|
| Primary button radius | 20px (`components.primaryButton.borderRadius`) |
| Default shadcn `--radius` | align to 20px on CTA, 12px on compact controls |
| CTA shadow | `0 8px 20px rgba(0,0,0,0.18)` |
| Glass card shadow | scoreboard card shadow as lighter variant |

## Sync rule

When `.cursor/design.json` changes, update `lib/design/tokens.ts` and CSS variables in the same PR. Run contrast spot-check on `text-caption` and `text-muted-foreground`.
