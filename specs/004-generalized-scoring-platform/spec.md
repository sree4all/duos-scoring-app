# Feature Specification: Generalized Scoring Platform

**Feature Branch**: `004-generalized-scoring-platform`  
**Created**: 2026-04-30  
**Status**: Draft  
**Input**: User description: "Transform kin-score-app into a generalized admin-managed multi-game scoring platform."

## Problem Statement and Product Goals

The current product is tightly coupled to single-game prediction workflows, which limits reuse for other game formats and requires technical intervention when rules or structures change. The product direction requires a single platform where a non-technical owner/admin can configure, publish, operate, and audit multiple game types entirely from the application UI while participants continue to have a simple submission and leaderboard experience.

### Product Goals

- Enable one application to support prediction-only, score-entry-only, and hybrid game formats without redesigning core user workflows.
- Enable non-technical admins to create and operate contests end to end without database access or developer support.
- Preserve a stable participant experience during platform rollout with no service interruption.
- Provide transparent, auditable, and recomputable scoring outcomes for trust and operational safety.
- Establish a maintainable foundation for future game formats and scoring expansions.

## Clarifications

### Session 2026-05-01

- Q: What tie-break hierarchy should be default when participants have identical totals? -> A: Tie-break by exact-hit count, then earliest submission timestamp.
- Q: Which penalty models must be supported in v1 and who can apply them? -> A: Fixed, proportional, and disqualification penalties; admin can apply with mandatory reason and optional second-admin approval for disqualification.
- Q: How should partial scoring be presented when some prompts/metrics are unresolved at event lock time? -> A: Show provisional totals excluding unresolved metrics and clearly label entries as provisional.
- Q: What exact policy governs voided events and point reversal messaging to participants? -> A: Append reversal ledger entries to net event points to zero; keep event visible with a "Voided" badge and reason in history and leaderboard details.
- Q: What dispute handling SLA, approval chain, and participant notification rules are required for score challenges? -> A: 48-hour SLA with two-step admin approval (review admin then finalizing admin), and mandatory notification to affected participants on resolution.

## Scope

### In Scope

- Generic domain model for game types, contests, events, prompts/metrics, submissions, scoring rules, points ledger, and admin configuration versions.
- Admin UI for no-code configuration lifecycle, including draft/publish, lock/reveal controls, and validation guardrails.
- Participant UI for submissions, contest leaderboards, and personal points history.
- Preset/template-based scoring engine v1 with immutable ledger and admin reconciliation workflows.
- Role-based access and row-level data controls for participant/admin separation.
- Incremental rollout through defined phases with stable participant-facing behavior.
- CSV and Google Sheet compatible import/export templates for admin operations.

### Out of Scope

- Arbitrary custom scoring code/scripting authored by admins in v1.
- Real-time multiplayer gameplay mechanics outside submission/scoring lifecycle.
- Replacing all previous single-game routes immediately in a single release.
- Native mobile apps or offline-first support in this feature.
- Third-party monetization or payment features.

## Personas and User Journeys

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Launch Multi-Game Contest Without Developer Help (Priority: P1)

As an App Owner/Admin, I configure and publish a new contest for a supported game type using guided UI steps so participants can start submitting entries without technical setup.

**Why this priority**: This is the core business shift; if admins cannot self-serve configuration and publish safely, the generalized platform objective fails.

**Independent Test**: Can be fully tested by creating a new game type contest from draft to published using only admin UI, then validating participant visibility.

**Acceptance Scenarios**:

1. **Given** an authenticated admin is in the contest setup wizard, **When** required contest details, events, prompts/metrics, lock policy, and scoring preset are completed and valid, **Then** the system allows publish and marks the contest as active.
2. **Given** an admin attempts to publish with missing or conflicting configuration, **When** validation runs, **Then** publish is blocked and clear non-technical guidance identifies what to fix.
3. **Given** a contest is published, **When** a participant opens active contests, **Then** they can view the contest and available events according to schedule and visibility rules.

---

### User Story 2 - Submit Entries and See Transparent Scoring (Priority: P1)

As a Participant, I submit predictions/scores during allowed windows and see clear point breakdowns in leaderboard and history.

**Why this priority**: Participant trust and engagement depend on predictable lock behavior and transparent scoring outcomes.

**Independent Test**: Can be fully tested by participant submission, event locking, scoring run, and verification of leaderboard plus personal history.

**Acceptance Scenarios**:

1. **Given** an event is open, **When** a participant submits or edits their own entry before lock, **Then** the submission is saved and visible in their own history.
2. **Given** an event is locked, **When** a participant attempts to edit prior entry, **Then** the system denies edits and displays lock status and reason.
3. **Given** an event is scored, **When** a participant views leaderboard and personal history, **Then** they see total points and an itemized breakdown by event and prompt/metric.

---

### User Story 3 - Recompute and Reconcile Scoring Safely (Priority: P2)

As an App Owner/Admin, I rerun scoring after corrections (for example score updates or policy fixes) while preserving audit traceability and minimizing participant confusion.

**Why this priority**: Operational resilience is required for real-world corrections, disputes, and late data changes.

**Independent Test**: Can be tested by scoring an event, introducing a correction, rerunning recompute, and verifying immutable ledger entries plus updated aggregates.

**Acceptance Scenarios**:

1. **Given** an event is scored and correction is required, **When** admin initiates recompute with reason, **Then** new ledger entries are appended and prior entries remain unchanged.
2. **Given** recompute updates participant totals, **When** participants view leaderboard/history, **Then** updated totals are visible with clear indication that recalculation occurred.
3. **Given** an admin performs override actions, **When** audit logs are reviewed, **Then** actor, timestamp, reason, and affected records are traceable.

---

### User Story 4 - Preserve Stable Participant Workflow During Transition (Priority: P2)

As product owner, I keep participant workflows stable while generalized entities are introduced incrementally.

**Why this priority**: Backward compatibility avoids user disruption and allows phased migration.

**Independent Test**: Can be tested by running participant and admin generalized flows through phased rollout without regressions.

**Acceptance Scenarios**:

1. **Given** generalized contest pages/routes are active, **When** rollout progresses, **Then** participants can continue submitting and viewing results without regression.
2. **Given** rollout controls are enabled, **When** scoring data is consumed by generalized services, **Then** outputs remain consistent and deterministic.
3. **Given** a rollout phase is paused, **When** safeguards are applied, **Then** production access to active contests remains available.

### Edge Cases

- Participant submits exactly at lock boundary; system applies deterministic cutoff and returns clear accepted/rejected result.
- Admin changes lock time after participant submissions exist; system records override and enforces explicit policy for already-entered data.
- Event is voided after partial scoring; leaderboard and history reflect reversal/reconciliation with audit explanation.
- Event is voided after scoring activity; system appends reversal ledger entries that net event points to zero and keeps the event visible with a "Voided" badge and reason in history and leaderboard details.
- Tie scenarios for event or contest totals; default ranking is exact-hit count (higher wins), then earliest submission timestamp (earlier wins), and the rule is surfaced in leaderboard details.
- Partial scoring where some prompts/metrics are unresolved; system shows provisional totals excluding unresolved metrics and marks affected entries as provisional until finalization.
- Bulk import contains malformed rows or unknown participant identifiers; valid rows are processed, invalid rows are reported without corrupting existing data.
- Dual-write succeeds in one model but fails in the second model during migration; system soft-fails, alerts admin, and provides retry/reconciliation path.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow admins to create and manage `game_types` with labels, lifecycle status, and game format classification (prediction, score-entry, hybrid).
- **FR-002**: System MUST allow admins to create and manage `contests` linked to a selected game type, including schedule, visibility, and participant enrollment settings.
- **FR-003**: System MUST allow admins to define and manage `events` per contest with state transitions: `draft`, `scheduled/open`, `locked`, `scored`, `finalized`, and `archived`.
- **FR-004**: System MUST allow admins to define `prompts_or_metrics` per event/contest, including input type, validation rules, display order, and scoring relevance.
- **FR-005**: System MUST allow participants to submit and edit only their own `submissions` while the event is editable per lock policy.
- **FR-006**: System MUST prevent participant edits after lock and provide understandable lock status messaging.
- **FR-007**: System MUST allow admins to configure lock policy per contest/event, including absolute lock timestamp and override capability with mandatory reason capture.
- **FR-008**: System MUST provide preset/template-based `scoring_rules` configuration for v1 and allow admins to select applicable preset per contest/event.
- **FR-009**: System MUST calculate participant points using configured scoring preset and produce deterministic outcomes for the same inputs.
- **FR-010**: System MUST persist every point-affecting action as immutable `points_ledger` entries, including action type, delta, actor/source, reason, and correlation metadata.
- **FR-011**: System MUST provide admin recompute and reconciliation workflows that append new ledger entries instead of mutating historical point records.
- **FR-012**: System MUST expose contest leaderboard views with participant ranking, totals, and tie-break outcome where applicable, using default order: exact-hit count (higher wins) then earliest submission timestamp (earlier wins).
- **FR-013**: System MUST expose participant history views with event-level and prompt/metric-level point breakdown for transparency.
- **FR-014**: System MUST support admin import/export using CSV and Google Sheet compatible templates for contest configuration and scoring-related data where relevant.
- **FR-015**: System MUST support draft vs published configuration states and block publish until required validations pass.
- **FR-016**: System MUST preserve stable participant and admin workflows throughout phased rollout.
- **FR-017**: System MUST support phased migration controls, including compatibility mappings and optional dual-read/dual-write behavior where required for safe rollout.
- **FR-018**: System MUST enforce role-based permissions so participants access only participant capabilities and admins access full configuration/scoring controls.
- **FR-019**: System MUST restrict sensitive admin fields and internal audit metadata from participant-facing responses and UI surfaces.
- **FR-020**: System MUST log admin overrides, state changes, recompute actions, and migration operations with actor identity and timestamp.
- **FR-021**: System MUST provide clear operational status indicators (`open`, `locked`, `scored`, `finalized`) across admin and participant flows.
- **FR-022**: System MUST provide non-technical, action-oriented validation and error messages in admin setup and operational workflows.
- **FR-023**: System MUST support configuration versioning so meaningful admin configuration changes can be traced to specific scoring outcomes.
- **FR-024**: System MUST allow lifecycle actions for voided or disputed events using a controlled workflow that preserves auditability and participant transparency.
- **FR-025**: System MUST support v1 penalty models of fixed deduction, proportional deduction, and disqualification, and MUST restrict application to admins with mandatory reason capture.
- **FR-026**: System MUST support optional second-admin approval for disqualification penalties before they become effective.
- **FR-027**: System MUST show provisional leaderboard and history totals when scoring inputs are incomplete, MUST exclude unresolved metrics from totals, and MUST label affected entries as provisional until finalized.
- **FR-028**: System MUST handle voided events by appending reversal ledger entries that net related event points to zero, MUST retain event visibility, and MUST display "Voided" status with reason in participant-facing history and leaderboard details.
- **FR-029**: System MUST provide dispute handling with a 48-hour resolution SLA, two-step admin approval (review admin then finalizing admin), and mandatory notification to affected participants when disputes are resolved.

### Non-Functional Requirements

- **NFR-001 Reliability**: Scoring and ledger writes must be atomic from the user's perspective so no partial point updates are visible in leaderboard/history views.
- **NFR-002 Integrity**: All point changes must be traceable to source action with immutable audit records and reproducible recompute capability.
- **NFR-003 Performance**: For active contests up to agreed operational limits, leaderboard and participant history pages should load in under 3 seconds for 95% of requests.
- **NFR-004 Security**: Access control must enforce least privilege with role checks and row-level restrictions that prevent cross-user data exposure.
- **NFR-005 Availability**: Configuration and submission workflows must degrade gracefully under partial failures, preserving saved data and providing actionable recovery guidance.
- **NFR-006 Maintainability**: New game types and scoring presets should be introduced via configuration extension without structural redesign of core domain entities.
- **NFR-007 Usability**: Admin workflows must be understandable by non-technical users with clear progression, status, and validation messaging.
- **NFR-008 Compatibility**: Rollout changes must not break production participant workflows during defined phases.

### Data Model Evolution Strategy

- Adopt target conceptual entities: `game_types`, `contests`, `events`, `prompts_or_metrics`, `submissions`, `scoring_rules`, `points_ledger`, and `admin_configuration_versions`.
- Introduce generic entities and keep additive schema evolution first (new tables/columns).
- Use one generalized read/write path in runtime behavior.
- Reconcile discrepancies through audit-supported repair procedures.
- Keep participant-facing identifiers stable during transition to avoid broken links or history discontinuity.
- Version admin configuration snapshots so scoring runs can reference the exact rule set in effect at scoring time.

### API Requirements

- Admin-only endpoints/actions for game type, contest, event, prompt/metric, scoring preset, publish, lock, override, recompute, and import/export operations.
- Participant endpoints/actions for browsing visible contests/events, submitting/updating own entries (subject to lock), and retrieving leaderboard/history.
- API responses must include lifecycle/status fields needed by UI (`draft/open/locked/scored/finalized/archived`) and human-readable lock/status reasons.
- API contracts must separate admin-only metadata from participant payloads.
- Rollout APIs must expose clear phase/status behavior while generalized services are introduced.

### UI Requirements

- Admin experiences must use wizard-like, guided, non-technical flows for setup, validation, publish, and scoring operations.
- Admin UI must surface guardrail checks before publish and show explicit remediation guidance.
- Participant UI must show clear event status indicators, submission windows, and lock/finalized states.
- Leaderboard and participant history views must provide transparent point breakdown and explanation of recalculations.
- Generic surfaces should use neutral game terminology consistently.

### Roles, Permissions, and Security/RLS Expectations

- Participant role:
  - Can view active/public contests and events.
  - Can create/update only own submissions within edit window.
  - Can view public leaderboard and own detailed history.
- Admin role:
  - Full create/read/update lifecycle permissions for configuration, publish controls, scoring, recompute, and migration tools.
  - Can perform lock overrides and dispute/void workflows with mandatory reason capture.
- Security expectations:
  - Role checks required on every protected API/action.
  - Row-level data restrictions prevent participant access to other participants' private submissions and all admin-sensitive fields.
  - Audit fields, internal scoring metadata, and operational controls are never exposed in participant responses.

### Migration and Rollout Plan

- **Phase 0 (Baseline)**: Establish baseline monitoring and regression tests.
- **Phase 1 (Terminology + Foundation)**: Introduce generalized UI terminology and foundational adapters.
- **Phase 2 (Generalized Schema Introduction)**: Add generic domain entities and validate parity between expected and produced outcomes.
- **Phase 3 (First New Game Type in Production)**: Enable Rummy as first non-prediction game type using generic configuration and scoring flows; monitor reliability and admin usability.
- **Phase 4 (Operational Hardening)**: Complete hardening after parity, stability, and rollout readiness criteria are met.

## Acceptance Criteria and Success Metrics

### Measurable Outcomes

- **SC-001**: Admin can launch a new contest from initial draft to published state in under 30 minutes without developer assistance in at least 90% of trials.
- **SC-002**: Platform supports at least 3 distinct game types (prediction, score-entry, hybrid) without requiring schema redesign.
- **SC-003**: Point calculation accuracy is at least 99.9% against approved reference test cases across supported scoring presets.
- **SC-004**: 100% of point-affecting changes are traceable via immutable ledger records with actor and reason context.
- **SC-005**: Leaderboard and participant history load within 3 seconds for at least 95% of requests under target contest scale.
- **SC-006**: Manual back-office interventions for scoring corrections decrease by at least 50% after admin recompute/reconciliation tooling adoption.
- **SC-007**: Participant workflows experience no critical regression incidents during rollout phases.

## Risks, Assumptions, and Open Questions

### Risks

- Dual-write/dual-read migration complexity can introduce data drift if reconciliation controls are weak.
- Ambiguous scoring policy decisions (tie-breaks, penalties, void handling) may reduce participant trust if not standardized early.
- Non-technical admin UX may still be perceived as complex without careful progressive disclosure and defaults.
- Backward compatibility layer may increase maintenance overhead during transition period.

### Assumptions

- Existing authentication and profile foundations remain available and can support admin/participant role separation.
- Admin users are willing to follow guided workflows and provide required metadata (reason codes, publish validations, import templates).
- Initial v1 scoring presets cover the highest-frequency use cases for prediction and score-entry scenarios.
- Contest scale and participation volume remain within current operational envelope while optimization evolves.
- Existing participant workflows remain stable throughout phased rollout.

### Open Questions

- Are there contest-level limits (participants/events/prompts) that should hard-block publish for operational safety?

## Key Entities *(include if feature involves data)*

- **Game Type (`game_types`)**: Defines a reusable game format category with high-level behavior profile and status.
- **Contest (`contests`)**: Represents a specific season/tournament instance under a game type, including lifecycle, schedule, and visibility.
- **Event (`events`)**: Represents a scoring unit (match/round/hand/session) within a contest, with lifecycle state and lock policy.
- **Prompt or Metric (`prompts_or_metrics`)**: Defines participant input fields or scoring dimensions for an event/contest.
- **Submission (`submissions`)**: Participant-provided inputs tied to contest/event/prompt scope and submission window constraints.
- **Scoring Rule Preset (`scoring_rules`)**: Versioned preset configuration that determines how points are computed for applicable inputs.
- **Points Ledger Entry (`points_ledger`)**: Immutable record of each scoring delta or adjustment with actor/source and reason metadata.
- **Admin Configuration Version (`admin_configuration_versions`)**: Snapshot/version of contest configuration used for traceability across publish and scoring runs.
