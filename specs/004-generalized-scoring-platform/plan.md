# Implementation Plan: Generalized Scoring Platform

**Branch**: `main` | **Date**: 2026-04-30 | **Spec**: `specs/004-generalized-scoring-platform/spec.md`  
**Input**: Feature specification from `specs/004-generalized-scoring-platform/spec.md`

## Summary

Deliver `kin-score-app` as an admin-managed multi-game scoring platform with generalized contest/event workflows. The implementation prioritizes additive schema evolution, clear API/UI contracts, immutable ledger-based scoring traceability, and role-safe admin/participant experiences.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20 LTS)  
**Primary Dependencies**: Next.js App Router, React, Supabase JS/SSR, Tailwind CSS, shadcn/ui  
**Storage**: Supabase PostgreSQL (existing + additive generalized tables)  
**Testing**: Existing repo test/lint flow (`npm test`, `npm run lint`)  
**Target Platform**: Web application (desktop/mobile browser)  
**Project Type**: Full-stack web app (Next.js frontend + server actions/APIs + Supabase backend)  
**Performance Goals**: Leaderboard/history p95 under 3 seconds at contest target scale  
**Constraints**: No participant technical dependency, no admin custom scoring scripts in v1  
**Scale/Scope**: Multi-game support (prediction, score-entry, hybrid)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Canonical constitution**: `.specify/memory/constitution.md` — **Version 1.0.0**, ratified **2026-05-01** (principles I–V: compatibility-first rollout, role boundaries, auditable deterministic scoring, contract-driven gates, admin-first operability).
- **Alignment (this plan)**:
  - **I**: Phased migration, dual-write/parity motifs, deprecation as a Phase 4 decision — matches incremental compatibility-first delivery.
  - **II**: Admin vs participant surfaces, RLS/role guards in tasks — matches security and role boundaries.
  - **III**: Immutable ledger, recompute markers, dispute/void workflows — matches auditable deterministic scoring intent.
  - **IV**: Spec → plan → tasks traceability and SC-* criteria in spec — matches contract-driven measurable gates.
  - **V**: Admin wizard/scoring UX and plain-language validation tasks — matches admin-first simplicity.
- Gate result (pre-research): **PASS**.
- Gate result (post-design): **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/004-generalized-scoring-platform/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── admin-configuration-and-scoring.md
│   └── participant-submissions-and-history.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── (authenticated)/
├── admin/
└── api/

components/
lib/
supabase/
tests/
specs/
```

**Structure Decision**: Keep existing single Next.js project structure and implement generalized capabilities incrementally in current app/service layers plus additive Supabase schema migrations.

## Complexity Tracking

No constitution violations requiring justification at this stage.
