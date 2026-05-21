# Group Scoping Observability

Operational logging guidance for private groups (feature 005).

## Events to log

| Event | Level | Fields |
|-------|-------|--------|
| `group.join.failed` | warn | `reason` (invalid_code, revoked_code), `user_id` (hashed), no invite code in clear text |
| `group.access.denied` | info | `user_id`, `group_id`, `route`, `reason` (not_member, not_owner) |
| `group.contest.cross_group_denied` | info | `user_id`, `requested_group_id`, `contest_id` |
| `rummy.hand.recorded` | info | `group_id`, `contest_id`, `hand_no`, `recorded_by` |
| `rummy.hand.corrected` | info | `prior_hand_id`, `correction_reason` (truncated) |
| `rummy.hand.voided` | warn | `hand_id`, `void_reason` (truncated) |

## Metrics (optional)

- Counter: `group_join_total{result=success|failure}`
- Counter: `group_access_denied_total{reason=...}`
- Histogram: `group_leaderboard_query_ms` (scoped by `contest_id`)

## Alerts

- Spike in `group.join.failed` with `revoked_code` after owner rotation (expected briefly).
- Sustained `group.access.denied` from same user across multiple `group_id` values (possible probing).

## Privacy

- Do not log full invite codes or participant PII in production logs.
- Correlate support tickets with `request_id` when middleware adds one.
