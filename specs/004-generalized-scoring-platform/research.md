# Research — Generalized Scoring Platform

## Decision 1: Incremental rollout over big-bang rewrite

- **Decision**: Use phased rollout with additive schema evolution.
- **Rationale**: Phased rollout reduces regression risk and keeps operations stable while generalized services expand.
- **Alternatives considered**:
  - Big-bang replacement of existing schema/routes: rejected due to high outage/regression risk.
  - Long-term parallel products: rejected due to operational overhead and fragmented user experience.

## Decision 2: Generic domain model

- **Decision**: Introduce generalized entities (`game_types`, `contests`, `events`, `prompts_or_metrics`, `submissions`, `scoring_rules`, `points_ledger`, `admin_configuration_versions`).
- **Rationale**: Generalized model supports multiple game formats with one consistent data and workflow model.
- **Alternatives considered**:
  - Extending single-game tables with game-type flags only: rejected because domain semantics diverge for score-entry and hybrid formats.
  - Separate per-game schemas: rejected due to duplicated logic and poor extensibility.

## Decision 3: Preset/template scoring v1 (no dynamic scripts)

- **Decision**: Support curated scoring presets with versioning and admin-selectable parameters; no arbitrary scripting in v1.
- **Rationale**: Meets no-code admin requirement while limiting operational/security complexity.
- **Alternatives considered**:
  - Custom formula builder: deferred due to validation and UX complexity.
  - Embedded scripting: rejected for risk, governance, and non-technical admin mismatch.

## Decision 4: Immutable points ledger with recompute append-only semantics

- **Decision**: Record all point-affecting changes as immutable ledger events; recomputes create additional compensating entries.
- **Rationale**: Required for auditability, dispute resolution, transparency, and reproducibility.
- **Alternatives considered**:
  - Mutable total-points updates only: rejected due to weak traceability.
  - Hard overwrite recalculation: rejected because historical integrity is lost.

## Decision 5: Configuration version snapshots linked to scoring runs

- **Decision**: Track admin configuration versions and bind scoring jobs/results to the effective version.
- **Rationale**: Enables deterministic audit and replay of outcomes when rules or prompts change over time.
- **Alternatives considered**:
  - Current-state-only configuration: rejected because historical scoring context becomes ambiguous.

## Decision 6: Lock and lifecycle policy model

- **Decision**: Standardize event lifecycle (`draft`, `scheduled/open`, `locked`, `scored`, `finalized`, `archived`) with controlled admin overrides requiring reason capture.
- **Rationale**: Consistent lifecycle semantics simplify participant expectations and audit controls across game types.
- **Alternatives considered**:
  - Per-game custom state machines in v1: rejected to avoid fragmented behavior and operational confusion.

## Decision 7: Admin-facing import/export templates

- **Decision**: Provide CSV and Google Sheet compatible templates for contest setup and score operations.
- **Rationale**: Satisfies no-code operational requirements and reduces manual entry burden.
- **Alternatives considered**:
  - API-only bulk operations: rejected because non-technical admins are a primary persona.
  - CSV only: rejected because spreadsheet collaboration is a core admin workflow.

## Decision 8: Security enforcement through layered role checks + row restrictions

- **Decision**: Enforce participant/admin separation at endpoint/action layer and data-row access layer; exclude sensitive fields from participant payloads by contract.
- **Rationale**: Prevents privilege leaks and preserves privacy/security expectations across all surfaces.
- **Alternatives considered**:
  - UI-only role hiding: rejected as insufficient security control.

## Decision 9: Single generalized write/read path

- **Decision**: Use the generalized write/read path as the only supported runtime path.
- **Rationale**: Reduces complexity and avoids drift between parallel models.
- **Alternatives considered**:
  - Dual-write everywhere: rejected due to complexity and higher failure surface.
  - Split routing by mode: rejected due to operational ambiguity.

## Decision 10: Resolve technical-context clarifications

- **Decision**: All technical-context fields are fully specified from existing repository standards and current stack; no unresolved `NEEDS CLARIFICATION` markers remain for planning.
- **Rationale**: Current codebase and spec provide enough detail for phase 0/1 outputs.
- **Alternatives considered**:
  - Deferring stack decisions: rejected because the project already has an established platform.
