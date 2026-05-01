# Scoring Observability

## Signals

- Scoring job success/failure counts per contest and event.
- Recompute correlation IDs surfaced in dashboards for trace joins.
- Dispute SLA breach alerts when opened cases exceed 48 hours.
- Ledger append rate and rejection reasons for validation failures.

## Dashboards

- Admin operations: scoring queue depth, oldest pending job age.
- Participant experience: p95 leaderboard and history latency.

## Alerts

- P1: parity mismatch detected during migration phases.
- P2: SLA breach on dispute backlog.
- P3: sustained scoring error rate above baseline.
