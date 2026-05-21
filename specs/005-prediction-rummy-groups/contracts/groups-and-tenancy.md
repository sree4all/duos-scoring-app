# Contract: Groups and Tenancy

## Purpose

Defines self-serve private groups, invite-based joining, active group context, and data isolation.

## Actors

- `authenticated_user` — any signed-in user
- `group_owner` — membership with `is_owner = true`
- `group_member` — active membership
- `platform_support` — out-of-band; not a participant UI role

## Group lifecycle

### Create group

- **Input**: `name` (required)
- **Effect**: New `groups` row; creator becomes `group_owner`; `current_invite_code` generated; user active context set to new group
- **Response**: `group_id`, `name`, `invite_code` (for sharing)

### Join by invite code

- **Input**: `invite_code` (required)
- **Preconditions**: Code matches `groups.current_invite_code`; group `active`; user not already active member
- **Effect**: `group_memberships` row; optional switch active context to joined group
- **Errors**: invalid/revoked code, already member, archived group — plain language

### Regenerate invite code

- **Actor**: `group_owner`
- **Effect**: New `current_invite_code`; prior code moved to history; old code rejected for join

### Switch active group

- **Input**: `group_id`
- **Precondition**: User has active membership
- **Effect**: Session active group updated; subsequent list APIs scoped to this group only

### Remove member / leave

- Owner may remove any non-owner or transfer ownership first
- Member may leave voluntarily
- **Effect**: `removed_at` set; user loses all access to group data

### Transfer ownership

- **Actor**: `group_owner`
- **Input**: target `user_id` (active member); optional demote self if another owner remains
- **Effect**: Target gains `is_owner`; group never left with zero owners
- **Errors**: Cannot demote/remove last owner without promoting another member first

## Data isolation contract

- All participant APIs require resolved `active_group_id` (or explicit `group_id` validated against membership).
- Responses MUST NOT include contests, events, leaderboards, or history from other groups.
- Non-members receive `404` or `403` (consistent per endpoint family); no existence leakage via different messages.

## Owner administration

| Action | Owner | Scorer | Member |
|---|---|---|---|
| Create/configure contests | yes | no | no |
| Regenerate invite | yes | no | no |
| Appoint/revoke scorer | yes | no | no |
| Remove members | yes | no | no (leave only self) |
| Promote / transfer ownership | yes | no | no |

## Security expectations

- RLS enforces membership on all group-scoped tables.
- Invite codes are opaque, minimum entropy 8 characters (implementation detail in plan, not product contract).
- Rate limiting on join attempts deferred to plan/ops (see plan observability).
