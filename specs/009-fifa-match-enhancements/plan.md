# Implementation Plan: FIFA Match Prediction Enhancements

**Branch**: `009-fifa-match-enhancements` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/009-fifa-match-enhancements/spec.md`

## Summary

Extend the live World Cup 2026 private prediction game with three additive capabilities: **(1)** automatic knockout team-name propagation when the owner records Round of 16-or-later results, including invalid-pick cleanup; **(2)** auto-generated odd-match bonus questions (+3 / 0 scoring) once both teams are resolved; **(3)** pre-kickoff prediction privacy for regular members (owner sees all). Reuses existing `matches`, `bonus_prompts`, `predictions`, `KNOCKOUT_FEEDERS`, and `loadPredictionStatsForContest`; no schema break; Rummy unchanged.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20 LTS)  
**Primary Dependencies**: Next.js App Router, React, Supabase JS/SSR, Tailwind CSS, shadcn/ui (existing)  
**Storage**: Supabase PostgreSQL — **no required new tables**; optional additive column `bonus_prompts.generation_source` (`owner` | `auto_odd`) via migration; reuse `matches.home_team` / `away_team` updates  
**Testing**: `npm run lint`; new unit tests for bracket propagation + privacy filter; extend integration tests for result → propagate → pick clear  
**Target Platform**: Web (private deployment, ~11 members)  
**Project Type**: Full-stack Next.js + Supabase  
**Performance Goals**: Propagation + pick cleanup completes within SC-001 (**5s**) on owner result save; stats panel unchanged p95 for 11 members  
**Constraints**: Propagation **Round of 16+ only** (match numbers ≥ 89); group/R32 excluded per clarifications; Eastern Time kickoff for visibility gate; tournament forecast tab untouched; prerequisite **006** World Cup contest live  
**Scale/Scope**: 1 group, remaining knockout fixtures (R16 → Final), odd upcoming matches only for bonus auto-gen

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Alignment |
|---|---|
| **I. Incremental compatibility** | Additive services hooked into `setMatchOfficialResult`; feature flags for odd-bonus cutoff; no removal of existing bonus/schedule flows |
| **II. Security / roles** | Pre-kickoff filtering enforced server-side in `loadPredictionStatsForContest`; owner bypass via `membership.isOwner`; RLS unchanged on reads |
| **III. Auditable scoring** | Odd bonuses use existing ledger `bonus` lines at +3/0; propagation clears picks (no ledger mutation until re-score) |
| **IV. Contract-driven gates** | FR-* mapped to three contracts + quickstart SC-001–SC-007 |
| **V. Admin-first operability** | Propagation automatic on result save; owner retains bonus edit/deactivate; plain “Available at kickoff” copy |

- Pre-research gate: **PASS**
- Post-design gate: **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/009-fifa-match-enhancements/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── bracket-propagation.md
│   ├── odd-match-bonus.md
│   └── pre-kickoff-privacy.md
└── tasks.md                    # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
lib/
├── domain/world-cup/
│   ├── knockout-bracket.ts              # extend: reverse feeder map, R16+ gate, Final feeders
│   ├── bracket-propagation.ts           # NEW: slot updates, pick/bonus invalidation rules
│   ├── odd-match-bonus-templates.ts     # NEW: template library + team-neutral detection
│   └── match-bonus.ts                   # existing scoring helpers
├── server/world-cup/
│   ├── match-result-service.ts          # hook propagateKnockoutTeams after winner save
│   ├── bracket-propagation-service.ts   # NEW: DB updates + prediction cleanup
│   ├── odd-match-bonus-service.ts       # NEW: ensure prompts for qualifying odd matches
│   ├── prediction-stats.ts              # pre-kickoff privacy filter + owner bypass
│   └── prediction-visibility.ts         # NEW: kickoff gate helper (ET-aware UTC compare)
├── copy/world-cup.ts                    # “Available at kickoff” strings

app/
├── (authenticated)/contests/[contestId]/matches/page.tsx   # pass isOwner + userId to stats loader
└── api/groups/.../matches/[matchId]/result/route.ts          # propagation in result pipeline

components/world-cup/
└── prediction-stats-panel.tsx           # hidden-row UX, kickoff message

tests/
├── unit/bracket-propagation.spec.ts
├── unit/prediction-visibility.spec.ts
├── unit/odd-match-bonus.spec.ts
└── integration/world-cup-bracket-propagation.spec.ts
```

**Structure Decision**: Single Next.js app; domain logic pure in `lib/domain/world-cup/`; side effects in `lib/server/world-cup/`; hook at existing owner result API.

## Complexity Tracking

No constitution violations requiring justification.

---

## Phase 0: Research

**Status**: Complete → [research.md](./research.md)

Key decisions: reverse feeder map from `KNOCKOUT_FEEDERS` (R16+ sources only), template-based odd bonus generation (no mandatory external LLM), server-side pre-kickoff filter, pick auto-clear + selective bonus clear, `prompt_key` idempotency for auto bonuses.

---

## Phase 1: Design & Contracts

**Status**: Complete

| Artifact | Path |
|---|---|
| Data model | [data-model.md](./data-model.md) |
| Bracket propagation | [contracts/bracket-propagation.md](./contracts/bracket-propagation.md) |
| Odd-match bonus | [contracts/odd-match-bonus.md](./contracts/odd-match-bonus.md) |
| Pre-kickoff privacy | [contracts/pre-kickoff-privacy.md](./contracts/pre-kickoff-privacy.md) |
| Validation guide | [quickstart.md](./quickstart.md) |

### Design highlights

1. **Propagation trigger**: `setMatchOfficialResult` → `propagateKnockoutTeams(supabase, matchId)` when `match_number >= 89`.
2. **Slot assignment**: For each `KNOCKOUT_FEEDERS[target] = [fHome, fAway]`, winner of `fHome` → `target.home_team`, winner of `fAway` → `target.away_team`. Extend map with `104: [101, 102]` for Final.
3. **Pick cleanup**: After slot updates, delete `predictions` rows where `predicted_winner` ∉ `{home, away}` on affected incomplete matches; clear team-specific `prediction_bonus_answers` per FR-003c.
4. **Odd bonuses**: `ensureOddMatchBonuses` selects odd `match_number`, kickoff > feature deploy, both teams non-placeholder (`isPlaceholderTeam`), no active owner prompt; upsert via `prompt_key = wc2026:auto:odd:m{n}` with `correct_points=3`, `incorrect_penalty=0`.
5. **Privacy**: `loadPredictionStatsForContest(..., { viewerUserId, isOwner })` — if `!isOwner && now < kickoffUtc`, return only viewer's row per event; mask others with `hidden: true` sentinel (no peer aggregates).

---

## Phase 2: Task Generation

**Status**: Not started — run `/speckit.tasks` to produce `tasks.md`.

Suggested story order:

1. **P1** Bracket propagation domain + service + result hook + unit tests  
2. **P1** Pre-kickoff privacy server filter + panel UX + tests  
3. **P2** Odd-match bonus templates + ensure service + schedule/result hooks + scoring verification  

---

## Post-Design Constitution Re-Check

| Principle | Post-design status |
|---|---|
| I | PASS — hooks only; flags for deploy cutoff |
| II | PASS — server-side privacy; owner role check |
| III | PASS — ledger unchanged; pick deletes auditable via `updated_at` |
| IV | PASS — contracts + quickstart trace to FR/SC |
| V | PASS — zero manual bracket edits for owner after R16 results |
