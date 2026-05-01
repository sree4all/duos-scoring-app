# Generalized Scoring Rollout Flags and Environment

## Purpose

Defines runtime toggles for the generalized scoring platform.

## Environment variables

- `GENERALIZED_SCORING_ENABLED` (`true|false`)
  - Master toggle for generalized scoring APIs/UI.
- `GENERALIZED_SCORING_ADMIN_ONLY` (`true|false`)
  - Optional guard to limit generalized surfaces to admins during controlled rollout.

## Recommended defaults (fresh deployment)

- `GENERALIZED_SCORING_ENABLED=true`
- `GENERALIZED_SCORING_ADMIN_ONLY=false`

## Operational notes

- Keep environment values consistent across all deployed services.
- Record runtime flag changes in release notes.