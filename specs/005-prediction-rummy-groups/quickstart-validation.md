# Quickstart Validation — 005-prediction-rummy-groups

Recorded: 2026-05-19 (implementation session)

## Environment

| Check | Status | Notes |
|-------|--------|-------|
| Migrations `202605190001`–`008` present | ✓ | Apply with `npm run db:push` before manual QA |
| `GROUP_*` flags documented | ✓ | `docs/rollout/group-scoping.md` |
| `npm run lint` | ✓ | See `verification-report.md` |

## 1) Group flows

| Step | Status | Notes |
|------|--------|-------|
| Create group | ○ Manual | API `POST /api/groups` |
| Join by invite | ○ Manual | `POST /api/groups/join` |
| Regenerate invite | ○ Manual | Settings panel |
| Remove / leave / promote | ○ Manual | Membership APIs implemented |

## 2) Prediction in group

| Step | Status | Notes |
|------|--------|-------|
| Owner wizard | ✓ Code | `/groups/[groupId]/contests/new` |
| Event → match link | ✓ Code | `events.source_match_id` |
| Owner scoring | ✓ Code | `GroupPredictionAdapter` + results API |
| Stats / history | ✓ Code | `/stats`, `/history` |

## 3) Points rummy

| Step | Status | Notes |
|------|--------|-------|
| Hand record API | ✓ Code | `POST .../rummy/hands` |
| Preset math | ✓ Auto | `rummy-preset-calculator.spec.ts` |
| Void / correction | ✓ Code | void API + correction service |
| Leaderboard (lower wins) | ✓ Code | per-contest aggregation |

## 4) Isolation

| Step | Status | Notes |
|------|--------|-------|
| Cross-group deny | ✓ Harness | `group-isolation.spec.ts` |
| Live RLS | ○ Manual | Requires two groups in Supabase |

## 5) Quality

| Step | Status | Notes |
|------|--------|-------|
| Lint | ✓ | `npm run lint` |
| Unit/integration harness | ✓ | tsx scripts (no Jest yet) |

**Legend**: ✓ verified in code/automation · ○ requires manual QA with database
