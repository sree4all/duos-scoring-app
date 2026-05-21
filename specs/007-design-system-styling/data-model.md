# Data Model — App-Wide Design System Styling

## Modeling approach

This feature has **no persistent database entities**. The model documents **design-time tokens and UI surface classifications** used by the presentation layer. Relationships are containment (shell → card → control), not foreign keys.

## Entities

### 1) Design reference (`design.json`)

External canonical file at `.cursor/design.json`. Not stored in Supabase.

| Attribute group | Examples | Rules |
|-----------------|----------|-------|
| `colors` | `background.deepPurple`, `cta.primary`, `text.muted` | Source of truth for token export |
| `typography.styles` | `heroHeadline`, `bodyLarge`, `buttonLabel`, `caption` | Full-scale tier |
| `spacingSystem.scale` | `xs`–`4xl`, `verticalRhythm` | Maps to Tailwind spacing extend |
| `components` | `primaryButton`, `scoreboardCard` | Component dimension hints |
| `layout.canvas.safePadding` | top/left/right/bottom | Page shell padding |

**Validation**: `lib/design/tokens.ts` MUST stay aligned when `design.json` changes (documented in module header).

### 2) Design token (runtime/CSS)

Named visual attribute materialized as CSS custom property and/or Tailwind theme key.

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Stable kebab or camel identifier, e.g. `cta-primary`, `text-muted` |
| `value` | string | CSS color, length, shadow, or font shorthand |
| `tier` | enum nullable | `full`, `dense`, or `all` — which surface tier may use it |
| `wcagRole` | enum | `headline`, `body`, `caption`, `interactive` — used in contrast review |

**Uniqueness**: `name` unique within the token registry.

### 3) Surface tier

Classification controlling shell background, typography scale, button height, and card variant defaults.

| Tier | Background patterns | Typography | Primary button height | Card default |
|------|---------------------|------------|----------------------|--------------|
| `entry` | Gradient + grid + dots + vignette | Full reference (hero/bodyLarge) | ~92px (`components.primaryButton.height`) | Optional marketing card |
| `light` | Same as entry | Full or slightly reduced titles | Full on hero CTAs | Standard/glass |
| `dense` | Gradient only (no grid/dot) | Scaled-down related tier (~60–70% of reference body/title) | Compact min 44–48px | `glass` semi-transparent |

**State transitions**: Route → layout resolves tier → `PageShell` applies tier props → children inherit typography utilities.

### 4) Styled surface

Any user-visible region that MUST resolve tokens (FR-002, FR-006).

| Surface type | Token dependencies |
|--------------|-------------------|
| `page-shell` | gradient, optional pattern layers, safe padding |
| `nav-chrome` | background blur, border subtle, text primary/muted |
| `glass-card` | `border.subtle`, semi-transparent fill, shadow |
| `control` | CTA mint, focus ring, disabled opacity |
| `score-emphasis` | `accent.scoreGreen/Blue/Red` |

### 5) Visual QA checklist record (documentation only)

Manual artifact for FR-012 / SC-001 — not a database table.

| Field | Type | Rules |
|-------|------|-------|
| `screenId` | string | Route or named view |
| `tier` | Surface tier | Expected classification |
| `reviewedAt` | date | Manual sign-off |
| `pass` | boolean | Background, type, CTA, contrast |

Minimum **12** rows covering: entry, auth, contest schedule, leaderboard, history, Rummy record/history, group settings, World Cup import/stages, admin scoring.

## Validation rules (presentation)

- All text colors on assigned `wcagRole` MUST meet WCAG 2.1 AA against computed background (SC-004).
- Dense routes MUST NOT render `tier=entry` pattern overlays (FR-004).
- Dense main content blocks MUST use `glass` card variant (FR-006).
- Primary actions on dense inline lists MUST use compact CTA height (FR-003).

## Out of scope entities

- User, group, contest, ledger — unchanged.
