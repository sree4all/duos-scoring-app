# Group Scoping Rollout Flags

## Environment variables

| Variable | Values | Purpose |
|----------|--------|---------|
| `GROUP_SCOPING_ENABLED` | `true` / `false` | Master toggle for private groups, active group context, and `group_id` filtering |
| `GROUP_PREDICTION_ENABLED` | `true` / `false` | Group-scoped prediction contests with full bonus parity adapter |
| `GROUP_RUMMY_ENABLED` | `true` / `false` | Points-rummy hand entry and presets |

## Recommended defaults (development)

```env
GROUP_SCOPING_ENABLED=true
GROUP_PREDICTION_ENABLED=true
GROUP_RUMMY_ENABLED=true
```

## Routing

- **Group owners** configure contests at `/groups/[groupId]/contests/new` (not `/admin/contests/new`).
- `/admin/contests/new` is reserved for **platform operators** only when explicitly enabled.

## Operational notes

- Keep flag values consistent across all deployed instances.
- Record flag changes in release notes when toggling production behavior.
