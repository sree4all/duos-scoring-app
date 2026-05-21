# Contract: Void and Correction (World Cup Events)

## Purpose

FR-017: When official match results are wrong or cancelled, group owners void or correct events; members see reason and net point adjustments in history.

## Actors

- `group_owner` — void event or enter corrected winner; supplies reason text
- `group_member` — read-only history with void badge and adjustment lines

## Preconditions

- Event linked to `source_match_id` in a group World Cup prediction contest
- Caller is `group_owner` for contest's `group_id`

## Void flow

1. Owner marks event void with plain-language `reason` (required).
2. System invokes `voided-event-service` for contest event scope.
3. Prior `match` / `bonus` ledger lines for that match are reversed via append (net zero effect).
4. Member history shows void status and reason; picks remain visible but non-scoring.

## Correction flow

1. Owner updates official winner (and bonus answers if applicable).
2. System re-runs stage-aware `applyMatchScoring` for that match.
3. Ledger reflects net delta vs prior awards (append-only, not delete history).
4. History shows correction reason and updated point lines.

## Error messaging (kid-friendly)

- Non-owner: "Only the group owner can change match results."
- Already locked for picks with no result: use standard lock copy from `lib/copy/world-cup.ts`.

## Out of scope

- Automatic VAR or federation API cancellation feeds
