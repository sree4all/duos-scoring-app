# Contract: Pre-Kickoff Prediction Privacy

## Purpose

Regular members cannot see peer match predictions until kickoff; group owner sees all picks anytime. Tournament forecast tab excluded.

## Actors

- `group_member` — limited pre-kickoff view
- `group_owner` — full pre-kickoff view (`membership.isOwner`)

## Surfaces in scope

- **Prediction stats panel** on `contests/[contestId]/matches` (primary)
- **Contest stats page** at `contests/[contestId]/stats` — aggregate pick distributions MUST NOT appear for regular members until kickoff (lock alone is insufficient)
- Any future member-facing aggregate of peer picks for regular matches

## Surfaces out of scope

- Advanced bracket / tournament forecast tab
- Member's own pick form and personal history
- Leaderboard point totals (not pick disclosure)

## Visibility rules

For each schedule event with kickoff `K = match_time_utc`:

| Viewer | `now < K` | `now >= K` |
|---|---|---|
| Owner | All members' picks + bonuses | All |
| Member | **Own row only** | All members' picks + bonuses |

Pre-kickoff member view MUST NOT include:

- Other members' winner picks or bonus answers
- Submission counts (“9/11 submitted”)
- Team-direction percentages

## UX

- Hidden peer rows: show message **“Available at kickoff”** (via `worldCupCopy.prediction.hiddenUntilKickoff`)
- Own row: show pick or “— Not yet”
- Post-kickoff: existing table behavior unchanged

## Implementation

`loadPredictionStatsForContest(supabase, contestId, groupId, { viewerUserId, isOwner })`:

1. Load schedule + all predictions (unchanged query).
2. For each event, if `!isOwner && now < kickoffUtc`, filter `MemberPredictionRow[]` to viewer only; set `peerHidden: true` on event for UI banner.
3. Owner path: return full `predictionsByEventId`.

**Security**: Filtering MUST occur server-side before HTML/JSON reaches client.

## Kickoff boundary

Use stored `match_time_utc` (UTC). Display remains Eastern via `formatKickoffDisplay`; gate uses same instant.

Locked-before-kickoff: picks still hidden for peers until kickoff (FR acceptance scenario 6).

## Verification hooks

- `tests/unit/prediction-visibility.spec.ts` — filter logic, owner bypass, kickoff edge
- Manual two-member test (SC-005, SC-006)
- Regression: advanced bracket page unchanged (SC-007)

## Out of scope

- Hiding forecast picks
- Post-kickoff re-hiding
- Platform admin impersonation (treat as owner if group owner)
