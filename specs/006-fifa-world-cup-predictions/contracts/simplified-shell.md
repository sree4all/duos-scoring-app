# Contract: Simplified Private Shell

## Purpose

Deploy the app for one private group (~11 users) focused on World Cup predictions and Rummy, hiding unrelated product surfaces.

## Environment

| Variable | Purpose |
|---|---|
| `WORLD_CUP_PRIVATE_MODE` | Enable simplified nav and redirects |
| `DEFAULT_GROUP_ID` | Optional UUID — auto-select group on login |
| `GROUP_SCOPING_ENABLED` | Required `true` |
| `GROUP_PREDICTION_ENABLED` | Required `true` |
| `GROUP_RUMMY_ENABLED` | Required `true` (if Rummy used) |

## Member navigation (when `WORLD_CUP_PRIVATE_MODE=true`)

Visible:

- Group home (World Cup contest card + Rummy card)
- Match schedule / picks (revealed stages)
- Leaderboard, history, stats (contest-scoped)
- Join group (invite) if not yet member

Hidden or redirected:

- Global `/contests` legacy list (redirect to group home)
- `/admin/*` links in member nav (platform operator URLs not linked)
- Multi-group switcher when user has exactly one active membership and `DEFAULT_GROUP_ID` set

## Copy standards (FR-015)

- Status: “Open”, “Locked”, “Done” (not `scheduled`/`completed` in UI)
- Errors: one short sentence + what to do next; no HTTP codes or UUIDs
- Nav: “World Cup Picks”, “Rummy Scores”, “Standings”, “My Points”

## Access

- Non-members: no schedule or standings data (same isolation as 005)
- Members: only contests in their group

## Out of scope

- Removing database tables from prior IPL/generalized eras
- Disabling authentication
