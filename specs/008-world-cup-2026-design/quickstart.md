# Quickstart: World Cup 2026 Themed Page Backgrounds

**Branch**: `008-world-cup-2026-design`  
**Spec**: [spec.md](./spec.md)

## Prerequisites

- Feature 007 design system on branch (PageShell, tokens, glass cards).
- World Cup private pilot or group with World Cup-named prediction contest.
- Assets present:
  - `public/design/world-cup-2026/welcome.png`
  - `public/design/world-cup-2026/prediction.png`
  - `public/design/world-cup-2026/standings.png`
- `.cursor/design.json` includes `themes.worldCup2026`.

## Local setup

1. Copy stakeholder PNGs into `public/design/world-cup-2026/` (optimize to WebP recommended).
2. `npm run dev`
3. Sign in as member of WC group.

## Validation flow (~10 min)

### 1. Welcome (image 1)

1. Open `/welcome` (ensure group has WC contest).
2. Expect dual-portrait texture at ~25% opacity over purple gradient.
3. CTA navigates to matches.
4. Confirm `/groups` list — **no** hero (gradient only).
5. Open `/groups/{groupId}` — same welcome hero as step 1 when group has a WC contest.

### 2. Prediction (image 2)

1. Open `/contests/{worldCupContestId}/matches`.
2. Expect stadium artwork as subtle texture; match rows on glass cards.
3. Submit or view a pick — labels still readable.

### 3. Standings (image 3)

1. Open `/contests/{worldCupContestId}/leaderboard`.
2. Expect pop-art texture; table on glass panel.
3. Scroll table — background stays fixed.

### 4. Negative checks

- Open Rummy contest matches (if any) — no WC textures.
- DevTools → Rendering → emulate `prefers-reduced-motion: reduce` → reload P1–P3 — gradient only.
- Throttle network Slow 3G — page usable within ~3s (SC-005).

### 5. Checklist

Complete [contracts/visual-qa-checklist.md](./contracts/visual-qa-checklist.md).

## Lint

```bash
npm run lint
```

## Success criteria mapping

| ID | Quickstart step |
|----|-----------------|
| SC-001 | Steps 1–3 + P4 in checklist |
| SC-002 | R1–R3 in checklist |
| SC-003 | R4 in checklist |
| SC-004 | L1 in checklist |
| SC-005 | Step 4 throttle + L2 |
