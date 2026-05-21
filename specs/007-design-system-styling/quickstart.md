# Quickstart — App-Wide Design System Styling

## Goal

Verify neon design tokens apply app-wide, tier rules (entry vs dense), glass cards on dense pages, mint CTAs, and WCAG 2.1 AA text—without behavior regressions.

## Prerequisites

- `npm install`
- On branch `007-design-system-styling`
- `.cursor/design.json` present at repo root
- Local app runs: `npm run dev`
- Optional: browser extension **axe DevTools** or Lighthouse accessibility

## 1) Token and shell smoke test

1. Open `/login` → deep purple-blue gradient, grid/dot texture visible, large white headline styling, tall mint **Sign in** (or equivalent) CTA.
2. Log in → authenticated schedule page (`/contests/.../matches` or home redirect).
3. Dense page: gradient visible, **no** diagonal grid overlay on main schedule (inspect `PageShell` / body pseudo-elements).
4. Dense content sits on **semi-transparent card**, not opaque white panel.

## 2) Cross-route consistency (SC-001)

Visit in one session:

- `/login`
- `/groups` or `/welcome`
- One contest **matches** page
- **Leaderboard**
- **History**
- One **Rummy** page
- **Group settings**
- `/admin/scoring` (if accessible)

Confirm: no screen still uses default light gray shadcn slate theme as the page default.

## 3) Typography and button tiers

| Context | Expect |
|---------|--------|
| Login / entry | Large hero title (~54px class), large body |
| Matches / leaderboard | Smaller dense titles, 16–18px body, compact mint buttons in lists |
| Major page action (e.g. “Save” at bottom of form) | Compact min ~44px height, still mint |

## 4) Mobile (SC-003)

1. DevTools → 390×844.
2. Login, matches, leaderboard: no horizontal scroll on main column.
3. Tap primary and compact buttons: comfortable hit area, no overlap.

## 5) Accessibility (SC-004)

Per screen sample (headline, body, caption, label):

1. Use contrast checker against effective background (gradient or glass card).
2. Fail if any required text below WCAG 2.1 AA.
3. If caption muted fails, file token fix (increase opacity)—do not waive requirement.

## 6) Scoring colors (FR-008)

On leaderboard or history with positive/negative points:

- Positive uses green accent from reference.
- Negative uses red accent.
- Neutral/info uses blue where applicable.

## 7) Regression guard

- Submit a test pick (if env has contest): pick flow still works.
- Sign out: still redirects to login.
- No new console hydration errors on first paint.

## 8) Lint

```bash
npm run lint
```

## Sign-off template

Copy [contracts/visual-qa-checklist.md](./contracts/visual-qa-checklist.md) into PR description with Pass/Fail filled.

## Performance (optional)

On mid-tier mobile, scroll long match list: if jank from patterns, confirm dense routes have patterns disabled (already required); entry-only patterns may be disabled under `prefers-reduced-motion` if implemented.
