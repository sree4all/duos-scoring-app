# Visual QA Checklist: World Cup 2026 Backgrounds

**Purpose**: Manual validation for SC-001–SC-005  
**Viewport**: 390×844 primary; spot-check desktop  
**Prerequisite**: Group with active World Cup prediction contest; three assets deployed under `public/design/world-cup-2026/`

## Activation

| # | Check | Pass |
|---|--------|------|
| A1 | `/groups` with WC contest — **no** hero image, gradient only | |
| A2 | Rummy contest matches route — **no** WC hero | |
| A3 | `prefers-reduced-motion: reduce` on — all three pages gradient-only | |

## Page mapping (SC-001)

| # | Route | Expected asset | Opacity ~20–30% | Pass |
|---|-------|----------------|-----------------|------|
| P1 | `/welcome` (WC group) | welcome (dual portrait) | yes | |
| P2 | `/contests/{wcId}/matches` | prediction (stadium) | yes | |
| P3 | `/contests/{wcId}/leaderboard` | standings (pop-art) | yes | |
| P4 | Wrong image on any of P1–P3 | none | — | |

## Readability (SC-002, SC-003)

| # | Check | Pass |
|---|--------|------|
| R1 | Welcome headline readable on gradient (not on raw face) | |
| R2 | Match list labels readable inside glass cards | |
| R3 | Leaderboard top 10 rows readable in glass table | |
| R4 | Arm's-length phone read of rank + points (qualitative) | |

## Layout (SC-004, SC-005)

| # | Check | Pass |
|---|--------|------|
| L1 | No horizontal scroll on main column (390px) on P1–P3 | |
| L2 | Slow 3G — gradient visible ≤3s; CTAs not shifting after image load | |
| L3 | Long leaderboard — table scrolls; background fixed/static | |

## Coherence (User Story 4)

| # | Check | Pass |
|---|--------|------|
| C1 | Mint CTA + typography match 007 on all three pages | |
| C2 | Navigate P1→P2→P3 — three distinct moods, one campaign feel | |

## Out of scope confirmation

| # | Route | No hero |
|---|-------|---------|
| O1 | `/contests/{wcId}/history` or stats | |
| O2 | `/groups/{id}/world-cup/import` | |

**Sign-off**: __________ **Date**: __________
