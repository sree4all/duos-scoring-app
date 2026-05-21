# Quickstart — Dual-Mode Scoring with Private Groups

## Goal

Verify group isolation, prediction-with-bonuses in a group, and points-rummy hand scoring.

## Prerequisites

- `npm install` and `.env.local` configured
- Migrations through `005` group/rummy migrations applied (in order)
- `GROUP_SCOPING_ENABLED=true` (when wired)
- Two test user accounts (A = owner, B = member)

## 1) Group flows

1. Sign in as User A → create group "Test Friends" → note invite code.
2. Sign in as User B → join with invite code → confirm B sees group home.
3. User A regenerates invite code → User B cannot join a second account with old code.
4. User A removes User B → User B no longer sees group contests.
5. User B rejoins; User A promotes B to co-owner; User B leaves voluntarily (or A transfers ownership before leaving).

## 2) Prediction in group (owner)

1. User A creates prediction contest in group; add one event with bonus prompts + season bonus section.
2. User B submits winner + bonuses before lock.
3. User A locks event, enters official results, runs scoring.
4. Both users: leaderboard shows winner + bonus lines; prediction stats visible post-score.
5. Both users open `/history` — only entries for contests in the active group, with itemized bonus lines.

## 3) Points rummy in group

1. User A creates Rummy contest (points preset); appoints User B as scorer (optional).
2. Scorer records 3 hands with drops and unmelded points.
3. All members: leaderboard cumulative totals match manual spreadsheet for preset.
4. Scorer corrects hand 2 with reason → history shows adjustment.

## 4) Isolation check

1. User A creates second group; User C joins only second group.
2. User C must not see first group's contests (API or UI).

## 5) Quality checks

- `npm run lint`
- `npm test` (when tests exist for group RLS and rummy preset math)

## Contracts referenced

- `contracts/groups-and-tenancy.md`
- `contracts/prediction-parity.md`
- `contracts/rummy-scoring.md`
- `../004-generalized-scoring-platform/contracts/participant-submissions-and-history.md`
