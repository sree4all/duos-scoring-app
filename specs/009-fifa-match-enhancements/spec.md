# Feature Specification: FIFA Match Prediction Enhancements

**Feature Branch**: `009-fifa-match-enhancements`  
**Created**: 2026-07-05  
**Status**: Draft  
**Input**: User description: "Three new features: (1) Auto update of team names for future matches referring to FIFA official fixtures for match numbers/time — as admin updates winner, the future match that team plays is auto-updated; (2) Add bonus questions (AI generated but sensible ones) for all odd numbered matches from here on — static 3 points irrespective of level and no negative points; (3) Hide predictions from regular members (regular matches; not tournament forecast) till kickoff time (admin can view anytime)."

## Problem Statement and Product Goals

The private World Cup prediction game already supports imported fixtures, stage-based winner scoring, and optional match bonuses. Three gaps remain as the tournament progresses:

1. **Knockout bracket progression** — Future fixtures still show placeholder team labels until someone manually updates them, even after earlier matches have official winners.
2. **Bonus engagement** — Only a handful of matches have bonus questions; odd-numbered fixtures going forward should offer lightweight, fun extras without manual authoring for each match.
3. **Prediction privacy before kickoff** — Members can currently see one another's match picks before kickoff, which reduces independent decision-making.

### Product Goals

- Keep the schedule accurate automatically as results are entered, aligned with official FIFA match-number bracket relationships.
- Enrich odd-numbered upcoming matches with sensible auto-generated bonus questions that award a flat +3 with no penalty for wrong answers.
- Preserve pick secrecy among members until kickoff while giving the group owner full visibility for oversight.

## Clarifications

### Session 2026-07-05

- Q: When earlier-round results are recorded, which fixtures should auto-update team names (group stage → Round of 32 vs full bracket vs later rounds only)? → A: Group stage and Round of 32 are excluded; auto-propagation applies from **Round of 16 onward** through Quarter-Finals, Semi-Finals, and Final.
- Q: If a winner correction changes a downstream team slot and a member's existing pick no longer matches either team in that fixture, what should happen? → A: **Automatically clear the pick**; the member must submit a new pick before lock.
- Q: Before kickoff, what peer prediction information may regular members see besides their own pick? → A: **Nothing** — no peer picks, no aggregates, no pick-direction percentages; only their own pick.
- Q: When a member's winner pick is auto-cleared due to team propagation or correction, what happens to their bonus answer on the same fixture? → A: **Clear the bonus answer only if it references a specific team name**; otherwise keep it.
- Q: When should the system auto-generate a bonus question for an odd-numbered match whose teams are not yet fully known? → A: **Generate only when both home and away team slots are resolved** (no placeholders).

## Scope

### In Scope

- **Automatic team propagation** when the group owner records or corrects the official winner on a completed **Round of 16 or later** match, updating all dependent future fixtures per the official World Cup 2026 match-number bracket (feeder matches → downstream home/away slots through Quarter-Finals, Semi-Finals, and Final).
- **Propagation start point** — Group stage and Round of 32 team slots are **not** auto-updated by this feature (those rounds are treated as already resolved in the live tournament); propagation begins when Round of 16 results are entered and continues for all deeper knockout feeders.
- **Kickoff alignment** — Future match team slots and kickoff times continue to follow the official imported fixture schedule keyed by match number; propagation updates team names only on affected slots, not finished matches.
- **Odd-match bonus questions** — For every odd-numbered match (1, 3, 5, …) that has **not yet kicked off** when this feature is enabled, the system auto-generates one sensible bonus question per match once **both** home and away team slots are resolved (no placeholders), with multiple-choice answers appropriate to the two teams and stage.
- **Flat bonus scoring** — Each auto-generated odd-match bonus awards **+3 points for a correct answer** and **0 points for incorrect or unanswered**; stage-level winner scoring rules do not change bonus values or penalties for these prompts.
- **Owner override** — Group owner may edit, replace, or deactivate auto-generated bonus questions using the same configuration flow as existing match bonuses.
- **Pre-kickoff prediction privacy** — Regular members cannot see **any** peer prediction data for a fixture until kickoff: no other members' winner picks or bonus answers, no aggregate pick counts, and no team-direction percentages. Members always see their own picks; the group owner may view all members' picks at any time.
- **Tournament forecast exclusion** — The advanced tournament forecast (semi-finalist / finalist / winner picks) is **not** subject to the pre-kickoff hiding rule.

### Out of Scope

- Automated ingestion of live scores or winners from external broadcast APIs (owner still enters official results).
- Automatic team-name propagation from group-stage or Round of 32 results into downstream placeholders (Round of 32 and Round of 16 slots remain as already entered or manually maintained).
- Changing stage-based winner point tables or incorrect-prediction penalties for match outcome picks.
- Retroactive AI bonus generation for odd matches that already kicked off before this feature ships.
- Retroactive re-hiding of predictions for matches that already kicked off.
- Wagering, payments, or public multi-tenant behavior.
- Native mobile apps or offline mode.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Knockout Schedule Stays Current After Results (Priority: P1)

As the **group owner**, when I enter the official winner for a knockout match, every future fixture that depends on that result automatically shows the correct team name so members can pick confidently without waiting for manual schedule edits.

**Why this priority**: Incorrect or stale placeholder team names block meaningful picks on downstream knockout fixtures and are the highest operational friction during the live tournament.

**Independent Test**: Complete a Round of 16 match (e.g., Mexico vs England) with a winner, verify the corresponding Quarter-Final fixture immediately shows that winner in the correct home or away slot without manual import or edit.

**Acceptance Scenarios**:

1. **Given** a Round of 16 match is completed and the owner records the official winner, **When** members open the Quarter-Final fixture that officially lists that match as a feeder, **Then** the winning team's name appears in the correct slot on that future fixture.
2. **Given** a future Quarter-Final, Semi-Final, or Final fixture still has placeholder labels, **When** all of its Round of 16-or-later feeder matches are completed and winners recorded, **Then** both team slots show resolved team names matching the official bracket for that match number.
3. **Given** the owner corrects a previously entered winner on a completed Round of 16-or-later match, **When** the correction is saved, **Then** all affected downstream fixtures update to reflect the corrected team within one refresh cycle, any member picks on those fixtures that no longer match either team are automatically cleared, and team-specific bonus answers referencing affected teams are cleared while team-neutral bonus answers are retained.
4. **Given** a match is already completed and scored, **When** propagation runs, **Then** that match's own team names and stored official result are not altered.
5. **Given** a group-stage or Round of 32 match completes or is corrected, **When** the owner saves the result, **Then** downstream team slots are **not** auto-updated by this feature (no propagation from those rounds).

---

### User Story 2 - Odd Matches Offer Flat-Point Bonus Questions (Priority: P2)

As a **group member**, I see a fun, readable bonus question on upcoming odd-numbered matches that is worth 3 points if I get it right and cannot cost me points if I am wrong.

**Why this priority**: Adds engagement on alternating fixtures without burdening the owner to author dozens of prompts, while keeping scoring simple and positive-only.

**Independent Test**: Open an unrevealed odd-numbered upcoming match after feature enablement, confirm a generated bonus question appears, submit an answer, score the match with correct and incorrect bonus outcomes, verify +3 or 0 only.

**Acceptance Scenarios**:

1. **Given** an odd-numbered match has not yet kicked off, has no owner-authored bonus, and **both team slots are resolved**, **When** the match becomes available for picks in a revealed stage, **Then** exactly one auto-generated bonus question with sensible multiple-choice options is shown.
2. **Given** a member answers the odd-match bonus correctly, **When** the owner publishes the official bonus answer and scoring runs, **Then** the member receives exactly +3 bonus points regardless of tournament stage.
3. **Given** a member answers incorrectly or leaves the bonus blank, **When** scoring runs, **Then** the member receives 0 bonus points (no negative deduction).
4. **Given** an even-numbered match, **When** a member views the pick form, **Then** no auto-generated bonus is added solely because of this feature (existing owner-configured bonuses still apply).
5. **Given** the owner edits or replaces an auto-generated odd-match bonus, **When** members view the match, **Then** they see the owner's version; flat +3 / 0 scoring still applies unless the owner explicitly changes point values through admin tools.
6. **Given** an odd-numbered match already kicked off before this feature shipped, **When** members view history, **Then** no retroactive bonus question is injected for that match.

---

### User Story 3 - Member Picks Stay Private Until Kickoff (Priority: P1)

As a **regular group member**, I cannot see how others picked a match until kickoff, so I make my own choices without being influenced by the crowd; as the **group owner**, I can still monitor all picks anytime.

**Why this priority**: Directly supports fair, independent predictions — a core social integrity requirement for the private league.

**Independent Test**: Two members submit different picks on an open pre-kickoff match; each sees only their own pick in shared views; after kickoff both see all picks; owner sees both before kickoff.

**Acceptance Scenarios**:

1. **Given** a match is open and before kickoff, **When** a regular member views the group prediction summary for that match, **Then** they see only their own winner pick and bonus answers; all other members' rows and any aggregate statistics (submission counts, team percentages) are hidden with a clear "Available at kickoff" message.
2. **Given** the same pre-kickoff match, **When** the group owner views the prediction summary, **Then** they see every member's winner pick and bonus answers.
3. **Given** kickoff time has passed for a match, **When** a regular member refreshes the prediction summary, **Then** all members' picks and bonus answers for that match become visible.
4. **Given** a member has not submitted a pick, **When** they view the pre-kickoff summary, **Then** their row shows as not submitted while other rows remain hidden.
5. **Given** the tournament forecast tab, **When** a regular member views semi-finalist, finalist, or winner picks before the forecast lock, **Then** existing forecast visibility rules apply unchanged (this feature does not add pre-kickoff hiding to forecast picks).
6. **Given** a match is locked but kickoff has not occurred, **When** a member views predictions, **Then** other members' picks remain hidden until kickoff even though the member can no longer edit their own pick.

---

### Edge Cases

- **Partial bracket resolution**: A downstream match with one feeder decided and one still pending shows one resolved team and one placeholder until the second feeder completes.
- **Winner correction cascade**: Correcting a feeder winner updates multiple downstream levels (e.g., Round of 16 → Quarter-final → Semi-final slots). If a member's existing pick on an affected future fixture no longer matches either team in that fixture, the system **automatically clears that pick** and prompts the member to submit a new pick before lock. Bonus answers on the same fixture are cleared **only when the answer references a specific team name** that is no longer valid; team-neutral bonus answers (e.g., goal-minute bracket) are retained.
- **Group stage / Round of 32 results**: Entering or correcting winners in these rounds does not trigger automatic downstream team updates; Round of 16 slots already show resolved teams (e.g., Mexico vs England).
- **Odd match with existing owner bonus**: Auto-generation skips matches that already have an active owner-configured bonus prompt.
- **Unresolved team slots**: Odd-match bonus auto-generation is deferred until both home and away teams are known; fixtures with one or more placeholder slots show no auto-generated bonus yet.
- **Postponed kickoff**: Visibility unlock follows the current scheduled kickoff time; if the owner reschedules kickoff, the reveal moment moves accordingly.
- **Abandoned or voided match**: Pre-kickoff hiding ends at original kickoff or when the match is voided — members see a clear status instead of stale hidden picks.
- **Single-member group**: Hiding still applies logically (no other picks to show); owner view unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain an official match-number → bracket dependency map for **Round of 16 through Final** knockout progression so feeder match winners resolve to correct downstream home/away slots (Quarter-Finals, Semi-Finals, Final).
- **FR-002**: When the group owner saves an official winner on a completed **Round of 16-or-later** match, system MUST automatically update team names on all affected future fixtures that depend on that match number, within the same user session without requiring a full re-import.
- **FR-003**: When the group owner corrects a previously saved winner on a Round of 16-or-later match, system MUST re-propagate team names to all dependent future fixtures to reflect the correction.
- **FR-003a**: System MUST NOT auto-propagate team names from group-stage or Round of 32 match results.
- **FR-003b**: When team propagation or a winner correction causes a member's existing winner pick on a future fixture to no longer match either team in that fixture, system MUST automatically clear that pick and require the member to submit a new pick before lock.
- **FR-003c**: When a winner pick is auto-cleared under FR-003b, system MUST also clear the member's bonus answer on that fixture **only if** the answer references a specific team name affected by the change; team-neutral bonus answers MUST be retained.
- **FR-004**: Propagation MUST NOT modify team names, official results, or scoring on matches already marked completed.
- **FR-005**: For each odd-numbered match that has not kicked off at feature enablement, lacks an owner-configured bonus, and has **both team slots resolved**, system MUST generate exactly one readable bonus question with appropriate multiple-choice options based on the match teams and stage context.
- **FR-006**: Auto-generated odd-match bonus questions MUST award +3 points for a correct answer and 0 points for incorrect or unanswered responses, independent of tournament stage scoring level.
- **FR-007**: Auto-generated odd-match bonus questions MUST NOT apply negative point penalties under any outcome.
- **FR-008**: Group owner MUST be able to view, edit, replace, or deactivate auto-generated odd-match bonus questions without losing the ability to set official bonus answers and trigger scoring.
- **FR-009**: System MUST NOT retroactively add auto-generated bonuses to odd-numbered matches whose kickoff occurred before feature enablement.
- **FR-010**: Regular members MUST NOT see any peer prediction data for a fixture until that fixture's scheduled kickoff time — including other members' winner picks, bonus answers, aggregate submission counts, and team-direction percentages.
- **FR-011**: Regular members MUST always see their own match winner picks and bonus answers regardless of kickoff timing.
- **FR-012**: Group owner MUST be able to view all members' match winner picks and bonus answers at any time before or after kickoff.
- **FR-013**: Pre-kickoff prediction hiding MUST apply only to regular match predictions, not to tournament forecast picks.
- **FR-014**: When predictions are hidden, the interface MUST communicate clearly that picks will be visible at kickoff rather than showing empty or misleading data.
- **FR-015**: Prediction visibility MUST unlock for all regular members at or after the fixture's scheduled kickoff time, using the same kickoff time shown to members in Eastern Time.

### Key Entities

- **Match fixture**: A scheduled contest entry with match number, home/away team names, kickoff time, stage, status, and official winner; may contain placeholder team labels until feeders resolve.
- **Bracket dependency**: Official mapping from a completed match number to downstream match numbers and slot position (home or away) that should receive the winner's team name.
- **Match bonus prompt**: A per-match question with options, official answer, and point values; may be owner-authored or system-generated for odd matches.
- **Member match prediction**: A member's winner pick and optional bonus answer for a specific match, subject to visibility rules based on role and kickoff time.
- **Tournament forecast pick**: Long-horizon semi-finalist, finalist, and winner selections governed by separate lock and visibility rules outside this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Within 5 seconds of the owner saving an official winner, 100% of officially mapped downstream fixtures display the correct propagated team name on first member refresh.
- **SC-002**: Group owner spends zero manual steps updating placeholder team names for bracket-fed fixtures after entering results (validated across at least 10 knockout progression scenarios).
- **SC-003**: 100% of auto-generated odd-match bonuses score as +3 or 0 only — no negative bonus ledger entries in verification runs across all tournament stages.
- **SC-004**: At least 90% of auto-generated bonus questions are judged readable and on-topic by the group owner in a spot-check of 10 generated prompts (owner may edit outliers without blocking the feature).
- **SC-005**: Before kickoff, 0% of regular-member prediction summary views expose another member's pick; after kickoff, 100% of members see full pick visibility within one refresh.
- **SC-006**: Group owner can view 100% of member picks on demand before kickoff across all open fixtures.
- **SC-007**: Tournament forecast views behave identically before and after this feature for visibility rules (no regression in forecast pick display).

## Assumptions

- This feature extends the existing private World Cup 2026 prediction contest (feature 006) for a single group; roles are **group owner** (admin) and **group member** (regular member).
- Official bracket feeder relationships follow FIFA World Cup 2026 match numbering already used in the imported schedule; auto-propagation covers the **Round of 16 → Quarter-Finals → Semi-Finals → Final** feeder chain only. Group stage and Round of 32 are already complete in the live tournament and remain outside propagation scope.
- Initial kickoff times and match numbers come from the existing official-style imported dataset; this feature adds propagation on result entry rather than live external sync.
- "From here on" for odd-match bonuses means matches whose kickoff is still in the future when the feature is deployed; completed or in-progress odd matches are excluded.
- One auto-generated bonus question per qualifying odd match is sufficient; multiple prompts per match remain available only via owner configuration.
- Auto-generated questions are produced without owner pre-approval but are editable by the owner before or after members see them, matching the existing bonus configuration trust model. Generation is deferred until both home and away teams are resolved (no placeholder slots).
- Pre-kickoff hiding applies to shared prediction summary views and any other member-facing surfaces that show peer picks or aggregate pick statistics for regular matches; personal pick forms and the member's own history are unaffected.
- Eastern Time is the member-facing kickoff reference for visibility unlock, consistent with the existing World Cup deployment.
