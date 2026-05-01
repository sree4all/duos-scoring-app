# Generalized Scoring Security Review Notes

## Admin vs participant boundaries

- All `/api/generalized-scoring/admin/*` routes MUST enforce admin-only auth at handler entry.
- Participant routes MUST omit audit metadata via `participant-response-shaper`.

## Ledger integrity

- Append-only writes; disallow participant mutation of ledger records.

## RLS expectation

Policies MUST restrict generalized tables to admins for write and participants for self-read where applicable once migrations are enforced in Supabase.

## Follow-ups

- Add automated policy tests mirroring constitution gates before production rollout.
