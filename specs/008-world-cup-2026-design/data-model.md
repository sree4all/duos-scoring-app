# Data Model: World Cup 2026 Themed Page Backgrounds

**Feature**: 008-world-cup-2026-design | **Date**: 2026-05-21

No Supabase schema changes. This feature adds **design-time configuration** and **runtime resolution** types only.

## 1) Design reference extension (`design.json`)

External file: `.cursor/design.json`.

| Field | Type | Description |
|-------|------|-------------|
| `themes.worldCup2026.name` | string | `"World Cup 2026"` |
| `themes.worldCup2026.description` | string | Human-readable theme intent |
| `themes.worldCup2026.activation` | enum | `"worldCupPredictionContest"` |
| `themes.worldCup2026.pageBackgrounds.welcome` | PageBackgroundDef | First artwork |
| `themes.worldCup2026.pageBackgrounds.prediction` | PageBackgroundDef | Second artwork |
| `themes.worldCup2026.pageBackgrounds.standings` | PageBackgroundDef | Third artwork |

### PageBackgroundDef

| Field | Type | Validation |
|-------|------|------------|
| `assetPath` | string | Must start with `/design/world-cup-2026/` |
| `imageOpacity` | number | 0.2–0.3 (default 0.25) |
| `objectPosition` | string | CSS position, e.g. `center 30%` |
| `focalHint` | string | QA note (not rendered) |
| `accentPalette` | string[] | Optional token hints for future use |

## 2) Runtime: `PageBackgroundKey`

```text
"welcome" | "prediction" | "standings" | null
```

- `null` → default gradient shell only (FR-007, FR-012, FR-013).

## 3) Runtime: Theme resolution inputs

| Input | Source | Used for |
|-------|--------|----------|
| `pathname` | Client or server | Tier (existing 007) |
| `contest` | Server `ContestRow` | `isWorldCupContest(contest)` → prediction / standings keys on `/contests/[id]/*` |
| `groupId` | Server active group | `resolveWorldCupContestForGroup()` → welcome key on `/welcome` |

### Resolution rules (authoritative)

| Route | Background key when |
|-------|---------------------|
| `/welcome` | `welcome` if `resolveWorldCupContestForGroup` returns non-null WC contest |
| `/contests/[id]/matches` | `prediction` if `isWorldCupContest(contest)` |
| `/contests/[id]/leaderboard` | `standings` if `isWorldCupContest(contest)` |
| `/groups`, `/groups/[id]`, all other routes | `null` |
| Any route + `prefers-reduced-motion: reduce` | `null` (CSS suppresses layer; server may still pass key but CSS wins) |

## 4) Relationship to 007 `SurfaceTier`

| Page | Tier (007) | Background key (008) |
|------|------------|----------------------|
| `/welcome` | `light` | `welcome` (when eligible) |
| `/contests/*/matches` | `dense` | `prediction` |
| `/contests/*/leaderboard` | `dense` | `standings` |
| `/groups` | `light` | always `null` |

Background layer is **orthogonal** to tier: dense pages get gradient-only patterns (no grid) plus optional hero texture.

## 5) Static assets (deployable)

| File | Page family |
|------|-------------|
| `public/design/world-cup-2026/welcome.webp` | Welcome (dual portrait) |
| `public/design/world-cup-2026/prediction.webp` | Prediction (stadium walk) |
| `public/design/world-cup-2026/standings.webp` | Standings (pop-art) |

Source: stakeholder PNGs from specification session (copy/optimize at implement time).

## State transitions

```text
[default gradient] 
    → (WC contest context + page match + motion OK) → [gradient + hero texture]
    → (image error | no WC contest | reduced motion) → [default gradient]
```

No persistence; purely presentational per request.
