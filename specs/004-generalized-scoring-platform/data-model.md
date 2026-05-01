# Data Model — Generalized Scoring Platform

## Modeling approach

- Use generalized entities as the primary runtime model.
- Keep lifecycle and lock semantics consistent across game types.
- Make scoring outputs auditable through immutable ledger records.
- Version admin configuration to tie scoring outcomes to exact configuration state.

## Entities

### 1) `game_types`

Represents reusable game formats (prediction, score-entry, hybrid).

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary identifier |
| `key` | text | Unique, stable external key |
| `name` | text | Human-readable display name |
| `mode` | enum | `prediction`, `score_entry`, `hybrid` |
| `status` | enum | `active`, `inactive` |
| `created_at` / `updated_at` | timestamp | System managed |

### 2) `contests`

Season/tournament instance under a `game_type`.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary identifier |
| `game_type_id` | UUID FK | References `game_types.id` |
| `name` | text | Required, unique within game type/time window |
| `state` | enum | `draft`, `published`, `completed`, `archived` |
| `visibility` | enum | `public`, `private`, `invite_only` |
| `start_at` / `end_at` | timestamp | Valid date range |
| `default_lock_policy` | json/object | Contest-level fallback lock config |
| `published_at` | timestamp nullable | Set when published |
| `created_by` | UUID | Admin actor |
| `created_at` / `updated_at` | timestamp | System managed |

### 3) `events`

Match/round/hand/session unit for participation and scoring.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary identifier |
| `contest_id` | UUID FK | References `contests.id` |
| `external_ref` | text nullable | Optional external source mapping key |
| `title` | text | Required |
| `sequence_no` | integer | Ordering within contest |
| `state` | enum | `draft`, `scheduled_open`, `locked`, `scored`, `finalized`, `archived` |
| `open_at` / `lock_at` | timestamp | Editability window |
| `scored_at` / `finalized_at` | timestamp nullable | Lifecycle timestamps |
| `voided` | boolean | Default false |
| `void_reason` | text nullable | Required when voided |
| `created_at` / `updated_at` | timestamp | System managed |

### 4) `prompts_or_metrics`

Question/pick/score-field definitions for each event.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary identifier |
| `contest_id` | UUID FK | References `contests.id` |
| `event_id` | UUID FK nullable | Nullable for contest-wide prompts |
| `key` | text | Unique within contest/event scope |
| `label` | text | User-facing prompt label |
| `input_type` | enum | `single_choice`, `multi_choice`, `numeric`, `text` |
| `required` | boolean | Default true |
| `validation_config` | json/object | Input bounds/options rules |
| `visibility_state` | enum | `hidden`, `visible`, `revealed` |
| `sort_order` | integer | UI ordering |
| `created_at` / `updated_at` | timestamp | System managed |

### 5) `submissions`

Participant inputs against prompts/metrics.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary identifier |
| `contest_id` | UUID FK | References `contests.id` |
| `event_id` | UUID FK | References `events.id` |
| `prompt_metric_id` | UUID FK | References `prompts_or_metrics.id` |
| `participant_id` | UUID FK | References profile/user |
| `submitted_value` | json/value | Supports prediction and score-entry formats |
| `submitted_at` | timestamp | Set on each write |
| `is_locked_snapshot` | boolean | Captures lock-state at write time |
| `source` | enum | `participant_ui`, `admin_override`, `import` |
| `created_at` / `updated_at` | timestamp | System managed |

**Uniqueness**: at most one active submission record per participant + event + prompt/metric; revisions tracked separately or via history.

### 6) `scoring_rules`

Preset scoring templates and contest/event bindings.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary identifier |
| `rule_key` | text | Preset identifier |
| `name` | text | Display name |
| `version` | integer | Increment on preset changes |
| `mode` | enum | `prediction`, `score_entry`, `hybrid` |
| `parameters` | json/object | Allowed non-script configuration knobs |
| `active` | boolean | Controls admin selection |
| `created_at` / `updated_at` | timestamp | System managed |

### 7) `points_ledger`

Immutable scoring and adjustment trail.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary identifier |
| `contest_id` | UUID FK | References `contests.id` |
| `event_id` | UUID FK nullable | Null when contest-level adjustment |
| `participant_id` | UUID FK | References profile/user |
| `submission_id` | UUID FK nullable | Source submission if applicable |
| `action_type` | enum | `score_award`, `score_adjustment`, `recompute_delta`, `rollback_delta`, `penalty` |
| `points_delta` | numeric | Positive/negative |
| `reason_code` | text | Controlled vocabulary |
| `reason_text` | text nullable | Required for overrides/manual adjustments |
| `actor_id` | UUID nullable | Admin actor; null for system jobs |
| `config_version_id` | UUID FK | References `admin_configuration_versions.id` |
| `correlation_id` | text | Groups one scoring/recompute operation |
| `created_at` | timestamp | Append-only timestamp |

### 8) `admin_configuration_versions`

Version snapshots for traceability and replay.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary identifier |
| `contest_id` | UUID FK | References `contests.id` |
| `version_no` | integer | Sequential per contest |
| `state` | enum | `draft`, `published`, `superseded` |
| `snapshot` | json/object | Full config payload hashable/replayable |
| `published_by` | UUID nullable | Admin actor when published |
| `published_at` | timestamp nullable | Publish time |
| `created_at` | timestamp | System managed |

## Relationships

- `game_types` 1---* `contests`
- `contests` 1---* `events`
- `contests` 1---* `prompts_or_metrics`
- `events` 1---* `prompts_or_metrics` (optional contest-wide prompt support)
- `events` 1---* `submissions`
- `prompts_or_metrics` 1---* `submissions`
- `participants` 1---* `submissions`
- `participants` 1---* `points_ledger`
- `contests` 1---* `admin_configuration_versions`
- `admin_configuration_versions` 1---* `points_ledger`

## State transitions

### Event lifecycle

`draft` -> `scheduled_open` -> `locked` -> `scored` -> `finalized` -> `archived`

Additional controlled paths:

- `locked` -> `scheduled_open` (admin override only, reason required)
- `scored` -> `locked` (recompute preparation, audit required)
- any pre-final state -> `archived` (admin action with reason)
- any state can be marked `voided` with reason while preserving ledger trace

### Contest lifecycle

`draft` -> `published` -> `completed` -> `archived`

## Validation and integrity rules

- Publish blocked unless required entities exist: at least one event, one scoring preset binding, valid lock windows.
- Participant edits allowed only while event is `scheduled_open` and current time is before effective lock.
- Admin overrides require actor identity and non-empty reason.
- Ledger entries are append-only; updates/deletes disallowed except privileged data-repair operations with separate audit.
- Recompute operations must write grouped `correlation_id` entries and never mutate historical ledger rows.
- Participant-facing aggregates must be derivable from ledger to ensure consistency checks.

## Rollout notes

- Generalized entities are the source of truth for contest/event/prompt and scoring flows.
- External IDs may be retained only for import traceability.
- Avoid parallel write paths to prevent reconciliation drift.
