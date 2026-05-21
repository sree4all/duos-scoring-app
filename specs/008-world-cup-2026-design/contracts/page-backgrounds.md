# Contract: Page Backgrounds & Shell

**Components**: `components/layout/page-shell.tsx`, `lib/design/resolve-page-background.ts`  
**Server helpers**: `lib/server/world-cup/resolve-group-contest.ts` (existing)

## PageShell extension

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tier` | `SurfaceTier` | required | Unchanged from 007 |
| `pageBackground` | `PageBackgroundKey \| null` | `null` | When set, renders hero texture layer |
| `children` | ReactNode | — | Unchanged |

## Layer stack (bottom → top)

1. **Base gradient** (all tiers) — unchanged `.page-shell` background.
2. **Pattern overlays** (entry/light only) — unchanged.
3. **Hero texture** (new, when `pageBackground` set): `background-image: var(--page-hero-image)`, `opacity: var(--page-hero-opacity)`, `background-size: cover`, `background-position` from def, `position: fixed` or absolute inset, `z-index: 0`, `pointer-events: none`.
4. **Content** — `z-index: 1` (existing).

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .page-shell--hero { display: none; }
}
```

## Resolution API

`resolvePageBackgroundKey(input): PageBackgroundKey | null`

| Field | Type |
|-------|------|
| `pathname` | string |
| `contest` | `Pick<ContestRow, "name" \| "format_label"> \| null` |
| `hasWorldCupContestInGroup` | boolean |

### Route table

| Pathname | `contest` required | Key when active |
|----------|-------------------|-----------------|
| `/welcome` | no | `welcome` if `hasWorldCupContestInGroup` |
| `/contests/[id]/matches` | yes | `prediction` if `isWorldCupContest(contest)` |
| `/contests/[id]/leaderboard` | yes | `standings` if `isWorldCupContest(contest)` |
| `/groups` (list) | — | `null` |
| `/groups/[groupId]` (hub) | no | `welcome` if `hasWorldCupContestInGroup` |
| Other routes | — | `null` |

## Server wiring

| Page file | Pass `pageBackground` |
|-----------|------------------------|
| `app/(authenticated)/welcome/page.tsx` | After `resolveWorldCupContestForGroup` |
| `app/(authenticated)/contests/[contestId]/matches/page.tsx` | After `assertContestInGroup` + `isWorldCupContest` |
| `app/(authenticated)/contests/[contestId]/leaderboard/page.tsx` | Same |

Wrap with `<PageShell tier={...} pageBackground={key}>` from server page (import server-safe shell or split `PageShell` + inner client content).

`AppPageShell` in `app/(authenticated)/layout.tsx` **does not** pass `pageBackground` (defaults null).

## Welcome landing (FR-011)

`/welcome` MUST render a visible hub (headline + CTA to `/contests/{id}/matches`) when World Cup contest exists, instead of silent redirect—except when `?next=` valid or join error.

## Image load failure

- Use CSS `image` layer only; on `onError` not available for pure CSS—acceptable: broken url shows gradient dominant (opacity layer empty). Optional: `next/image` with `onError` clearing `--page-hero-image` in enhancement task.
- FR-008: no `<img>` alt broken icon in viewport; prefer background-image.

## Acceptance

- FR-004, FR-007, FR-011, FR-012, FR-013 per route table.
- FR-006: dense pages still use `Card variant="glass"` for tables/forms.
