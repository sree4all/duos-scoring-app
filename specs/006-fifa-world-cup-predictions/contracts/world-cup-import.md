# Contract: World Cup Schedule Import

## Purpose

Load FIFA World Cup 2026 fixture data from the standard unofficial Kaggle dataset into `matches` + contest `events` without manual per-match entry.

## Actors

- `group_owner` — runs import, reviews summary, reveals stages
- `system` — idempotent upsert, audit row

## Preconditions

- `GROUP_SCOPING_ENABLED=true`, `WORLD_CUP_IMPORT_ENABLED=true`
- Owner is member of target `group_id`
- CSV files present under `data/worldcup-2026/` (operator prepared via Kaggle CLI or `kagglehub` export)

## Input files (minimum)

| File | Required columns (logical) |
|---|---|
| `matches.csv` | `match_number`, `kickoff_at`, `home_team_id`, `away_team_id`, `city_id`, `stage_id` |
| `teams.csv` | `id`, display name, optional `group_letter` |
| `host_cities.csv` | `id`, `venue_name`, city label |
| `tournament_stages.csv` | `id`, `stage_name`, `stage_order` |

## Import behavior

1. Parse kickoff ISO → `match_time_utc` (timestamptz UTC).
2. Resolve team/city/stage ids to display strings; placeholder teams render as “TBD (Playoff)”.
3. Upsert `matches` with `external_key = wc2026:m{n}`.
4. If `contest_id` provided: upsert `events` linked via `source_match_id`; set `stage_key` on event.
5. Seed `contest_stage_scoring_rules` if missing (defaults from spec).
6. Write `worldcup_import_runs` with counts; on failure return plain-language error (no stack trace to members).

## Re-import (merge)

- Update kickoff, venue, team labels for non-completed matches.
- Do not delete predictions or ledger for completed matches.
- Bump `dataset_version` on changed rows.

## Postconditions

- 104 matches present for full dataset.
- Owner can open import summary: created/updated/skipped counts.

## Errors (owner-facing)

| Condition | Message pattern |
|---|---|
| Missing CSV directory | “Put the World Cup CSV files in data/worldcup-2026, then try again.” |
| Partial file set | “We need matches, teams, cities, and stages files.” |
| No contest selected | “Choose your World Cup contest first.” |

## Out of scope

- Live FIFA API sync
- Automatic Kaggle download from production web servers without operator credentials
