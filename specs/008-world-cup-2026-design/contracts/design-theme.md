# Contract: World Cup 2026 Design Theme

**Source**: `.cursor/design.json` → `themes.worldCup2026`  
**Runtime mirror**: `lib/design/world-cup-theme.ts` (must stay aligned)

## JSON shape (authoritative)

```json
{
  "themes": {
    "worldCup2026": {
      "name": "World Cup 2026",
      "description": "FIFA World Cup prediction experience — gradient-dominant shells with per-page hero textures.",
      "activation": "worldCupPredictionContest",
      "pageBackgrounds": {
        "welcome": {
          "assetPath": "/design/world-cup-2026/welcome.png",
          "imageOpacity": 0.28,
          "objectPosition": "center 40%",
          "focalHint": "dual portrait; keep faces out of top headline zone",
          "accentPalette": ["#FF7044", "#11398C", "#E4FF3B"]
        },
        "prediction": {
          "assetPath": "/design/world-cup-2026/prediction.png",
          "imageOpacity": 0.22,
          "objectPosition": "center 55%",
          "focalHint": "stadium walk; subjects lower third",
          "accentPalette": ["#C8102E", "#6CACE4", "#2D5016"]
        },
        "standings": {
          "assetPath": "/design/world-cup-2026/standings.png",
          "imageOpacity": 0.25,
          "objectPosition": "center center",
          "focalHint": "pop-art portraits; navy already in asset",
          "accentPalette": ["#0A1628", "#00B4D8", "#E6399B"]
        }
      }
    }
  }
}
```

Existing root `name` / `layout.canvas.background` remain the **Neon Sports Scoreboard** default; `themes.worldCup2026` is additive (FR-001).

## TypeScript exports (`lib/design/world-cup-theme.ts`)

| Export | Description |
|--------|-------------|
| `WORLD_CUP_THEME_NAME` | `"World Cup 2026"` |
| `PageBackgroundKey` | `"welcome" \| "prediction" \| "standings"` |
| `getPageBackgroundDef(key)` | Returns opacity, assetPath, objectPosition |
| `getPageBackgroundStyle(key)` | CSSProperties or class map for shell (`--page-hero-image`, `--page-hero-opacity`) |

## Acceptance

- FR-001, FR-002, FR-009: all three keys present with deployable `assetPath`.
- FR-003: `imageOpacity` within 0.2–0.3 for each entry.
- Changing design.json requires updating `world-cup-theme.ts` in the same PR (007 convention).
