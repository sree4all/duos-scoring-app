<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
  - Template Principle 1 -> I. Incremental Compatibility-First Delivery
  - Template Principle 2 -> II. Security and Role Boundary Enforcement
  - Template Principle 3 -> III. Deterministic and Auditable Scoring
  - Template Principle 4 -> IV. Contract-Driven and Measurable Quality Gates
  - Template Principle 5 -> V. Admin-First Simplicity and Operability
- Added sections:
  - Operational Constraints
  - Delivery Workflow and Quality Gates
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ `.specify/templates/plan-template.md` (validated; no changes required)
  - ✅ `.specify/templates/spec-template.md` (validated; no changes required)
  - ✅ `.specify/templates/tasks-template.md` (validated; no changes required)
  - ⚠ `.specify/templates/commands/*.md` (directory not present; validated extension command docs under `.specify/extensions/git/commands/`)
  - ✅ `README.md` (validated; no constitution-specific conflict requiring update)
- Follow-up TODOs:
  - None
-->
# duos-scoring-app Constitution

## Core Principles

### I. Incremental Compatibility-First Delivery
All product evolution MUST follow incremental rollout with explicit compatibility
behavior for active users. Changes that can break existing participant flows MUST
be delivered behind migration controls and verified with parity checks before wider
enablement. Big-bang replacement of live workflows is prohibited unless explicitly
approved as an emergency exception.

### II. Security and Role Boundary Enforcement
All user-facing and server-side capabilities MUST enforce least-privilege role
boundaries. Participant access MUST be limited to their own submissions and allowed
public views. Admin-only operations and sensitive fields MUST be blocked from
participant surfaces at both API/action and data-access layers.

### III. Deterministic and Auditable Scoring
Scoring outcomes MUST be deterministic for identical inputs and rule versions.
Point-affecting changes MUST be persisted in immutable ledger records with actor
and reason context. Recompute and correction workflows MUST append records rather
than mutating historical point history.

### IV. Contract-Driven and Measurable Quality Gates
Specifications, plans, and tasks MUST preserve traceability from requirements to
implementation. Every feature MUST define measurable success criteria and include
validation tasks for performance, compatibility, and security where required by the
specification. Work MUST not move to implementation when critical requirement
coverage gaps are unresolved.

### V. Admin-First Simplicity and Operability
Administrative workflows MUST be understandable by non-technical operators and MUST
not require direct database or code intervention for routine configuration tasks.
Validation and error messaging MUST be action-oriented and plain-language. Product
wording SHOULD remain domain-neutral in generalized surfaces while preserving legacy
continuity during migration phases.

## Operational Constraints

- The canonical stack is TypeScript on Node.js with Next.js and Supabase, and
  proposed deviations MUST be justified in planning artifacts.
- Schema evolution MUST be additive-first during migration phases; destructive
  schema changes require explicit deprecation readiness criteria.
- Every migration phase MUST define rollback or soft-fail behavior before rollout.
- Data integrity, scoring traceability, and participant continuity take precedence
  over release speed.

## Delivery Workflow and Quality Gates

- `/speckit-specify` MUST produce testable requirements and measurable outcomes.
- `/speckit-plan` MUST document architecture, constraints, and constitution checks.
- `/speckit-tasks` MUST provide requirement-linked execution tasks with clear file
  paths and independent story checkpoints.
- `/speckit-analyze` MUST be used before implementation for cross-artifact quality
  checks when tasks are generated.
- Implementers MUST resolve critical analysis findings before `/speckit-implement`.

## Governance

This constitution is the highest-priority process and quality authority for this
repository. If other guidance conflicts with this document, this document prevails.

Amendment procedure:
- Propose changes with rationale and impact in a dedicated constitution update.
- Document compatibility and migration implications for any principle redefinition.
- Re-run affected planning and analysis commands after ratified amendments.

Versioning policy:
- MAJOR: incompatible principle removals or redefinitions.
- MINOR: new principle or materially expanded governance requirement.
- PATCH: wording clarity and non-semantic refinements.

Compliance review expectations:
- Every plan MUST include a constitution check.
- Every analysis run MUST report constitution alignment issues.
- Pull requests SHOULD reference any constitution-impacting decisions.

**Version**: 1.0.0 | **Ratified**: 2026-05-01 | **Last Amended**: 2026-05-01
