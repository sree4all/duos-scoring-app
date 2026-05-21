# Contract: Visual QA Checklist

**Purpose**: FR-012, SC-001, SC-004 manual verification  
**When**: After implementation, before merge

## Instructions

1. Run `npm run dev`, viewport **390px** and **1280px**.
2. For each screen, mark Pass/Fail for columns B–F.
3. Run contrast check on one headline, one body, one caption, one label per screen (WCAG 2.1 AA).
4. **Pass** for SC-001 only if all rows Pass and zero legacy light-gray default theme.

## Screen list (minimum 12)

| ID | Screen | Tier | A: Gradient | B: Patterns | C: Type tier | D: CTA mint | E: Glass/dense card | F: WCAG AA |
|----|--------|------|-------------|-------------|--------------|-------------|---------------------|------------|
| 1 | `/login` | entry | | | full | full height | n/a | |
| 2 | `/join` | entry | | | full | full height | n/a | |
| 3 | `/welcome` | light | | | full | | | |
| 4 | `/groups` | light | | | full | | | |
| 5 | `/contests/{id}/matches` | dense | | no patterns | dense | compact | glass | |
| 6 | `/contests/{id}/leaderboard` | dense | | no | dense | compact | glass | |
| 7 | `/history` | dense | | no | dense | compact | glass | |
| 8 | `/contests/{id}/rummy/record` | dense | | no | dense | compact | glass | |
| 9 | `/groups/{id}/settings` | dense | | no | dense | compact | glass | |
| 10 | `/groups/{id}/world-cup/stages` | dense | | no | dense | compact | glass | |
| 11 | `/admin/scoring` | dense | | no | dense | compact | glass | |
| 12 | `/contests/{id}/events/{id}` | dense | | no | dense | compact | glass | |

## SC-002 spot check (5-second CTA)

On screens 5, 6, 1: unguided reviewer identifies primary action within 5 seconds.

## SC-003 horizontal scroll

On 390px: screens 1, 5, 6 — no horizontal scroll on main content (table internal scroll OK).

## Sign-off

| Reviewer | Date | Build/commit |
|----------|------|--------------|
| | | |
