# Research — Dual-Mode Scoring with Private Groups

## Decision 1: Group as first-class tenancy boundary

- **Decision**: Introduce `groups`, `group_memberships`, and rotatable `group_invite_codes`; require `group_id` on all participant-facing contests and derived records.
- **Rationale**: Clarified spec mandates group-only tenancy (no global participant contests). A dedicated tenant key is simpler and safer than visibility flags alone.
- **Alternatives considered**:
  - Reuse `contests.visibility = private` only: rejected because it does not model membership, invite rotation, or multi-group users.
  - Separate database per group: rejected due to operational cost.

## Decision 2: Active group context in session

- **Decision**: Persist each user's **active group** in a signed server-side session value (httpOnly cookie backed by membership validation on every request).
- **Rationale**: Users may belong to multiple groups; all list/detail queries must filter consistently without passing group id in every client call unsafely.
- **Alternatives considered**:
  - URL-only group slug: viable later as UX sugar but still requires membership checks; cookie/session is primary guard.
  - Client localStorage only: rejected as forgeable.

## Decision 3: Reusable invite codes with rotation history

- **Decision**: Store current code on `groups`; append prior codes to `group_invite_code_history` with `revoked_at` for audit; reject joins against non-current codes.
- **Rationale**: Matches clarification (unlimited joins until owner regenerates).
- **Alternatives considered**:
  - Single-use tokens: rejected per user choice.
  - Time-limited expiry: deferred.

## Decision 4: Group roles — owner and designated scorer

- **Decision**: `group_memberships` carries `is_owner` and `is_scorer` flags; owners configure contests; owners and scorers enter Rummy hands; ordinary members are read/submit-only per mode.
- **Rationale**: Matches clarifications; avoids overloading platform `admin` role for informal teams.
- **Alternatives considered**:
  - Platform admin for all setup: rejected — groups are self-serve.
  - Scorer as separate table: rejected — boolean on membership is sufficient at v1 scale.

## Decision 5: Prediction parity via legacy scoring adapter (phased)

- **Decision**: For prediction contests, **bridge** existing legacy capabilities (match winner scoring, per-prompt bonuses, legacy single bonus pick, season bonuses tab, prediction stats) into group-scoped contests using an adapter layer over `lib/scoring/match-scoring.ts` and related utilities, while generalized entities remain the long-term model from 004.
- **Rationale**: Fastest path to "all bonus features as in history" without re-implementing proven logic; constitution favors incremental compatibility.
- **Alternatives considered**:
  - Rebuild all bonus flows only in generalized engine before launch: rejected due to time/risk.
  - Legacy tables without group scope: rejected — violates group-only tenancy.

## Decision 6: Points rummy as score-entry preset v1

- **Decision**: Ship **points rummy only** as a `score_entry` game type with preset parameters (max points per hand, first/middle drop penalties, full count) and `rummy_hands` + `rummy_hand_players` tables for hand-level audit.
- **Rationale**: Spec clarification excludes deals rummy in v1; hand-level storage supports corrections and leaderboard drill-down.
- **Alternatives considered**:
  - Store hands only as generic submissions JSON: rejected — weak validation and queryability for drops/winners.
  - Deals rummy in v1: rejected per clarification.

## Decision 7: Row-level security keyed on group membership

- **Decision**: Supabase RLS policies on all group-scoped tables use `exists (select 1 from group_memberships where group_id = ... and user_id = auth.uid())`; owner/scorer mutations add role predicates in policies or security definer RPCs.
- **Rationale**: Constitution principle II — enforce at data layer, not UI-only.
- **Alternatives considered**:
  - Application-only filtering: rejected.

## Decision 8: Incremental rollout with compatibility gates

- **Decision**: Roll out in phases behind `GROUP_SCOPING_ENABLED` (and reuse `GENERALIZED_SCORING_ENABLED` where applicable): (1) groups CRUD/join, (2) group context + RLS, (3) group-bound contests, (4) prediction parity in group, (5) rummy hands.
- **Rationale**: Constitution principle I — avoid big-bang; existing deployments may have legacy global data requiring migration scripts.
- **Alternatives considered**:
  - Single release: rejected for regression risk.

## Decision 9: Technical context — no unresolved stack choices

- **Decision**: Continue TypeScript 5.x, Next.js App Router, Supabase PostgreSQL, existing test/lint commands.
- **Rationale**: Repository standard per constitution operational constraints.
- **Alternatives considered**: None required for this feature.
