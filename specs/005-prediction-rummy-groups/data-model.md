# Data Model — Dual-Mode Scoring with Private Groups

## Modeling approach

- **Tenant root** is `groups`; every contest and downstream scoring artifact carries `group_id`.
- Extend 004 generalized entities additively; do not fork parallel contest systems.
- Prediction bonus parity uses season tournament tables scoped by `group_id` via contest bridge fields.
- Rummy uses explicit hand entities plus ledger entries for cumulative totals.

## New entities

### 1) `groups`

Private team space.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `name` | text | Required, 1–80 chars |
| `slug` | text | Optional human share slug; unique if set |
| `status` | enum | `active`, `archived` |
| `current_invite_code` | text | Unique, indexed; rotatable |
| `invite_code_rotated_at` | timestamptz | Set on regeneration |
| `created_by` | UUID | Creator user |
| `created_at` / `updated_at` | timestamptz | System |

### 2) `group_memberships`

Links users to groups with capabilities.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `group_id` | UUID FK | → `groups.id` |
| `user_id` | UUID FK | → auth user |
| `is_owner` | boolean | At least one owner per active group |
| `is_scorer` | boolean | Owner may set; grants Rummy hand write |
| `joined_at` | timestamptz | Set on join |
| `removed_at` | timestamptz nullable | Soft-remove; null = active |

**Uniqueness**: one active row per (`group_id`, `user_id`).

### 3) `group_invite_code_history`

Audit of revoked codes.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `group_id` | UUID FK | |
| `invite_code` | text | Former code |
| `revoked_at` | timestamptz | When superseded |

### 4) `user_active_group` (or session store)

Tracks last-selected group per user.

| Field | Type | Rules |
|---|---|---|
| `user_id` | UUID | PK |
| `group_id` | UUID FK | Must be active membership |
| `updated_at` | timestamptz | |

*Implementation note*: may be cookie + validated membership instead of table; if table used, upsert on switch.

### 5) `rummy_hands`

One scored hand in a Rummy contest.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `group_id` | UUID FK | Denormalized for RLS |
| `contest_id` | UUID FK | → `contests.id`, score_entry mode |
| `hand_no` | integer | Sequential per contest |
| `winner_participant_id` | UUID | Member in contest |
| `preset_key` | text | Points-rummy preset used |
| `recorded_by` | UUID | Owner or scorer |
| `correction_of_hand_id` | UUID nullable | Links correction chain |
| `correction_reason` | text nullable | Required when correcting |
| `voided` | boolean | Default false |
| `void_reason` | text nullable | |
| `created_at` | timestamptz | |

### 6) `rummy_hand_players`

Per-player outcome for a hand.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | PK |
| `hand_id` | UUID FK | → `rummy_hands.id` |
| `participant_id` | UUID | Group member |
| `drop_type` | enum nullable | `none`, `first`, `middle`, `full_count` |
| `unmelded_points` | integer nullable | Required if not drop |
| `computed_points` | integer | After preset rules |
| `created_at` | timestamptz | |

## Extended entities (004)

### `contests` (add columns)

| Field | Type | Rules |
|---|---|---|
| `group_id` | UUID FK NOT NULL | → `groups.id`; required for all new contests |
| `format_label` | text nullable | UI: `prediction` / `rummy_points` |

- Remove reliance on `visibility = public` for participant access; effective visibility is **group membership**.
- Platform-global contests are not supported; all contests require `group_id`.

### `contests` / prediction bridge (optional link)

| Field | Type | Rules |
|---|---|---|
| `tournament_scope_id` | UUID nullable | Optional link to group tournament config for season bonuses |

### Season / match bonus (bridge)

- Season tables: `tournament_config`, `bonus_prompts`, `prediction_bonus_answers`, plus `group_tournament_config` per group.

## Relationships

```text
groups 1──* group_memberships *──1 users
groups 1──* contests
contests 1──* events
contests 1──* rummy_hands 1──* rummy_hand_players
contests 1──* points_ledger
```

## State transitions

### Group

`active` → `archived` (owner); archived groups read-only, no new contests.

### Membership

`active` (`removed_at null`) → `removed` (`removed_at set`); removed users fail RLS.

### Rummy hand

`recorded` → `corrected` (new hand row or append-only ledger + link `correction_of_hand_id`) → optional `voided`.

### Prediction event

Unchanged from 004 lifecycle; official results entered by **group owner** only.

## Validation rules

- Join: `invite_code` must equal `groups.current_invite_code`; user not already active member.
- Contest create: caller `is_owner` for `group_id`.
- Rummy hand write: caller `is_owner` OR `is_scorer` for `group_id`.
- Hand save: player count ≥ 2; each player has drop OR unmelded points; preset computes capped points.
- At least one owner per group; cannot remove last owner without transfer.

## RLS summary

| Table | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| `groups` | members | owners (update name/archive); create open to authenticated |
| `group_memberships` | members of same group | owners manage; users join via RPC |
| `contests`+children | members | owners configure; scorers/hands per rules |
| `rummy_hands` | members | owners + scorers insert/update |

All policies include `grant` to `authenticated` and `service_role` per repo migration rules.

## Indexes (recommended)

- `group_memberships (group_id, user_id)` unique where `removed_at is null`
- `groups (current_invite_code)` unique
- `contests (group_id, state)`
- `rummy_hands (contest_id, hand_no)`
