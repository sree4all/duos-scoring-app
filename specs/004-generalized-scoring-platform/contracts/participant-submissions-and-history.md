# Contract: Participant Submissions and History

## Purpose

Defines participant-visible behavior for discovering contests/events, submitting entries, and viewing scoring outcomes.

## Actors

- Authenticated `participant`

## Visibility rules

- Participant can view active contests/events they are allowed to access.
- Event status indicators must be visible: `open`, `locked`, `scored`, `finalized`.
- Participant cannot view admin-only internal fields (audit metadata, internal scoring configs, operational controls).

## Submission contract

- Participant may create/update only their own submissions.
- Submission editability is bounded by lock policy and event lifecycle.
- Attempts to edit after lock return a clear user-facing lock message and no write occurs.

## Leaderboard contract

- Participant can view public contest leaderboard with:
  - rank
  - participant display identifier
  - total points
  - tie-break outcome indicator when applicable

## History contract

- Participant can view own event-by-event history including:
  - submission snapshot (or summary)
  - points awarded/adjusted
  - transparent breakdown by prompt/metric
  - recompute/reconciliation marker when totals changed post initial scoring

## Error and status messaging

- Validation and failure messages must be understandable by non-technical users.
- Status transitions should be reflected promptly so users can trust lock and scoring states.

## Security expectations

- Participant cannot access another participant's private submission details.
- Participant cannot invoke admin-only configuration/scoring operations.
