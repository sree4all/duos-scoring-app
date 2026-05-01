# Contract: Admin Configuration and Scoring

## Purpose

Defines expected admin-facing capabilities for configuring game types/contests/events, publishing safely, operating scoring, and maintaining audit integrity.

## Actors

- `admin` role only

## Core operations

## 1) Game type management

- Admin can create/update/deactivate game types.
- Required fields: name, mode (`prediction`, `score_entry`, `hybrid`), status.
- Deactivation must not invalidate historical contest records.

## 2) Contest configuration wizard

- Admin can create contest draft and complete setup in guided steps:
  - contest details
  - event schedule/lifecycle
  - prompts/metrics
  - scoring preset selection
  - lock/visibility controls
- Publish is blocked until validations pass.

### Validation contract (pre-publish)

- At least one event exists.
- Required prompts/metrics are complete.
- Lock windows are valid and non-conflicting.
- Scoring preset is selected and valid for selected game mode.
- Participant-facing labels/status fields are present.

## 3) Event lifecycle and lock operations

- Supported states: `draft`, `scheduled_open`, `locked`, `scored`, `finalized`, `archived`.
- Admin can transition states according to allowed state machine rules.
- Override actions (unlock/relock/reopen/revert for recompute) require reason text and actor identity.

## 4) Scoring operations

- Admin can run scoring for an eligible event.
- Admin can run recompute/reconciliation when corrections are required.
- Scoring/recompute writes must produce append-only ledger entries; prior rows remain unchanged.

### Scoring idempotency expectation

- Re-running the same scoring operation with unchanged inputs should not duplicate final effect without explicit recompute context.

## 5) Import/export operations

- Admin can import configuration/score data from CSV and Google Sheet compatible templates.
- Import must provide row-level error reporting.
- Valid rows may process while invalid rows are rejected without corrupting existing records.

## 6) Audit and traceability

- All admin-sensitive actions must log actor, timestamp, reason, and affected scope.
- Each scoring/recompute operation must include correlation identifiers for downstream reconciliation.

## Response and visibility guarantees

- Admin responses include full operational metadata needed for setup and debugging.
- Sensitive admin metadata must not leak into participant contracts.
