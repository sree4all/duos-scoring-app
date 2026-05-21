# Feature Specification: FIFA World Cup 2026 Private Prediction Game

**Feature Branch**: `006-fifa-world-cup-predictions`  
**Created**: 2026-05-20  
**Status**: Draft  
**Input**: User description: "Keep the app for private use now (one group, ~11 users). FIFA World Cup Prediction Game using official-style match schedule data. Import match/team/city/stage details from external tournament dataset. All times in Eastern Time. Keep Indian Rummy scoring; remove or hide other non-essential product surfaces. Stage-based winner scoring revealed per tournament phase; bonus question options remain configurable and updatable. UI readable by children."

## Problem Statement and Product Goals

The product today supports generic prediction leagues and Rummy scoring inside private groups. The immediate need is to **narrow and personalize** the experience for a single private circle (~11 players in Eastern Time) running a **FIFA World Cup 2026 winner-prediction game** with the full official-style match schedule (104 fixtures), while **keeping Rummy** available for the same group and **removing distraction** from unrelated contest types, admin flows, and legacy league content.

### Product Goals

- Deliver a **ready-to-play World Cup prediction contest** seeded from authoritative schedule data (matches, teams, host cities, tournament stages) without manual re-entry of 104 fixtures.
- Apply **stage-dependent winner scoring** that unlocks only as the tournament advances, so players are not overwhelmed early and scoring rules match knockout intensity.
- Preserve **bonus-question richness** (per-match and season-level bonuses with reveal/lock behavior) as in prior prediction seasons, with values **editable by the group owner** without code changes.
- Present schedules, picks, standings, and history in **plain, kid-friendly language** with Eastern Time kickoffs.
- Operate as a **private household/club deployment** for one primary group, not a multi-tenant public product.
- Retain **Indian Rummy (points rummy)** scoring for the same group without regression.

## Scope

### In Scope

- **Single-group private deployment** sized for ~11 members; authentication and membership limited to invited users of that group.
- **Tournament data import** from the referenced external dataset (`areezvisram12/fifa-world-cup-2026-match-data-unofficial`): matches, teams, host cities, tournament stages, and normalized relationships (match number, kickoff, home/away, city, stage order).
- **One primary World Cup prediction contest** (or contest template) pre-wired to imported fixtures, with owner ability to refresh/import if dataset updates.
- **Progressive stage reveal**: group owner controls when each tournament phase’s matches and **stage scoring rules** become visible to members; earlier unrevealed stages stay hidden or locked from picks.
- **Configurable stage scoring table** (correct winner points, incorrect prediction penalty per stage) with defaults:

  | Tournament Stage | Correct Winner | Incorrect Prediction |
  |------------------|----------------|----------------------|
  | First Stage (Group Stage) | +2 | 0 |
  | Round of 32 | +3 | −1 |
  | Round of 16 | +5 | −2 |
  | Quarter-Finals | +8 | −3 |
  | Semi-Finals | +12 | −4 |
  | Third Place Playoff | +8 | −3 (see Assumptions) |
  | Final | +20 | −10 |

- **Bonus questions** (per-match multi-prompt, single-pick where used, season-level tab with timed reveal) remain supported, **configurable and updatable** by the group owner.
- **Prediction flows**: pick match outcome before lock (see **Group stage draws** below), view lock status, leaderboard, personal history with line-item points, aggregate stats after events complete.
- **Group stage draws**: for **First Stage (Group Stage)** fixtures only, members MAY predict **home win, draw, or away win** after 90 minutes of regulation; knockout rounds (Round of 32 through Final, including Third Place Playoff) require a **definitive winning team** (extra time and penalties if needed—no draw pick or draw official result).
- **Time zone**: all member-facing kickoff and lock displays in **US Eastern Time**.
- **UI simplification**: hide or remove navigation and features unrelated to World Cup prediction and Rummy for this deployment (legacy public contests, unused admin wizards, extra game types).
- **Rummy**: unchanged points-rummy behavior for the same private group.

### Out of Scope

- Wagering, cash prizes, or payment processing.
- Live video, ticketing, or travel planning.
- Automated ingestion of live match results from broadcast APIs (owner enters official results unless a later integration is added).
- Multi-group marketplace, public contest discovery, or open registration beyond the private invite list.
- Deals rummy, new card variants, or changes to Rummy scoring rules.
- Native mobile apps or offline play.
- Replacing the external dataset’s team placeholders (playoff winner slots) before they are resolved in data—system may show placeholder labels until updated import.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play the World Cup Prediction Season (Priority: P1)

As a **group member**, I see upcoming matches in Eastern Time, pick the match outcome (home, away, or **draw** in group stage only) and answer bonus questions when available before lock, and track my points on a clear leaderboard and history as results are entered.

**Why this priority**: This is the core reason for the personalization effort.

**Independent Test**: Import schedule, reveal Group Stage, members submit picks for at least two matches, owner locks and scores one match, members see +2/0 behavior and bonus lines on history.

**Acceptance Scenarios**:

1. **Given** the Group Stage is revealed, **When** a member opens the schedule, **Then** they see match number, teams, city/venue label, and kickoff in Eastern Time with simple status labels (e.g., “Open”, “Locked”, “Finished”).
2. **Given** an open **group stage** match, **When** a member selects home, **Draw**, or away and saves before lock, **Then** the pick is stored and shown in their history as pending.
3. **Given** an open **knockout** match, **When** a member views the pick form, **Then** they see only the two teams (no draw option) and copy explains that knockout games always produce a winner after extra time or penalties if needed.
4. **Given** a match is locked, **When** a member tries to change their outcome pick, **Then** the system blocks the edit and explains that picks are closed.
5. **Given** the owner records the official result (including **Draw** for group stage after 90 minutes, or the winning team for knockout), **When** scoring runs, **Then** each member receives stage-appropriate winner points and incorrect picks receive the configured penalty (including zero penalty in Group Stage).
6. **Given** bonus prompts exist for a match, **When** a member answers before lock and official bonus answers are published, **Then** bonus points appear as separate lines in history and count toward the leaderboard total.
7. **Given** a later stage is not yet revealed, **When** a member browses the contest, **Then** they do not see unrevealed stage matches or unrevealed stage scoring rules.

---

### User Story 2 - Owner Sets Up and Reveals the Tournament (Priority: P1)

As the **group owner**, I load the World Cup schedule from the standard dataset, configure stage scoring and bonuses, and reveal each tournament phase to members when we are ready to play that round.

**Why this priority**: Progressive reveal and configurable scoring are explicit differentiators for this game format.

**Independent Test**: Owner imports data, confirms 104 matches mapped to stages, reveals Round of 32 only after Group Stage play, updates a scoring cell, and members see new rules only after reveal.

**Acceptance Scenarios**:

1. **Given** fresh tournament data is available, **When** the owner runs import, **Then** matches, teams, cities, and stages populate without manual entry of each fixture.
2. **Given** imported data, **When** the owner opens stage settings, **Then** they see the default scoring table and can edit correct/incorrect point values before or after reveal.
3. **Given** Group Stage is complete, **When** the owner reveals Round of 32, **Then** members gain access to those fixtures and the Round of 32 scoring row applies to new picks.
4. **Given** the owner edits a bonus question or point value, **When** they save, **Then** future scoring uses the updated configuration and prior scored events retain auditable history.
5. **Given** a data refresh from the dataset, **When** the owner re-imports, **Then** schedule changes merge predictably (new kickoffs, resolved placeholder teams) without losing locked picks for finished matches.

---

### User Story 3 - Simplified App for One Private Group (Priority: P1)

As a **player in the private circle**, I land in our group’s home, choose World Cup prediction or Rummy, and am not confused by unrelated contests or platform-wide features.

**Why this priority**: The user explicitly wants a stripped-down private experience for ~11 users.

**Independent Test**: New member joins via invite, sees only group-scoped World Cup contest and Rummy entry, no legacy global contest list.

**Acceptance Scenarios**:

1. **Given** a signed-in member of the private group, **When** they open the app home, **Then** primary actions are World Cup predictions and Rummy scoring with plain labels.
2. **Given** this deployment targets one group, **When** a user is not in the group, **Then** they cannot view schedules, picks, or standings.
3. **Given** removed product surfaces, **When** members navigate menus, **Then** they do not encounter unused contest types, public directories, or platform admin entry points meant for operators.

---

### User Story 4 - Continue Rummy Nights in the Same Group (Priority: P2)

As a **group owner or designated scorer**, I still run points-rummy sessions without changes while the World Cup contest runs in parallel.

**Why this priority**: Rummy must remain untouched while everything else is simplified.

**Independent Test**: Existing Rummy flow from prior feature: create Rummy contest, record hands, view separate leaderboard from World Cup contest.

**Acceptance Scenarios**:

1. **Given** an active Rummy contest, **When** a member views contest list, **Then** World Cup and Rummy contests are clearly separated with simple format labels.
2. **Given** both contests are active, **When** viewing leaderboards, **Then** points do not combine across formats.

---

### Edge Cases

- Member submits a pick at the exact lock moment; system applies one clear cutoff and tells the member if the pick was accepted or rejected.
- Match postponed or kickoff changes after import; owner can adjust lock time; members see updated Eastern Time kickoff.
- Placeholder team names (playoff slots) until import update; UI shows understandable placeholder text without breaking picks.
- Owner reveals a stage late; members who already know bracket outcomes cannot pick earlier unrevealed matches until reveal (hidden schedule).
- Owner changes stage scoring after some matches in that stage are scored; already-scored matches keep prior point rules unless owner explicitly recalculates with documented reason.
- Voided or corrected match result after scoring; history shows adjustment with reason and net point change.
- Child or low-literacy user: all error and status messages avoid jargon (no “422”, “UUID”, or “submission payload”).
- Dataset missing or import fails; owner sees actionable recovery steps (retry, check credentials) without exposing technical stack traces to members.
- Third Place Playoff incorrect-penalty value ambiguous in source notes; owner can correct in configuration before reveal (see Assumptions).
- Member predicts **Draw** in group stage but owner enters a winning team (or vice versa); scoring treats mismatch as an incorrect pick (0 penalty in Group Stage).
- Member attempts **Draw** on a knockout match (client or API); system rejects with a clear message.
- Owner attempts to record **Draw** as the official result for a knockout match; system rejects and asks for the team that advanced.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support a **private single-group** World Cup prediction experience sized for approximately **11 members**, with invite-based access only.
- **FR-002**: System MUST **import tournament schedule data** from the standard FIFA World Cup 2026 unofficial dataset, including matches (104 fixtures), teams (48 entries including placeholders), host cities/venues, and ordered tournament stages.
- **FR-003**: System MUST map each match to **home team, away team, host city/venue, stage, match number, and kickoff instant**, preserving stage order for display sorting.
- **FR-004**: System MUST display all member-facing **dates and times in US Eastern Time**, including lock deadlines derived from kickoff policy.
- **FR-005**: System MUST provide **progressive stage reveal** controlled by the group owner so unrevealed stages’ matches and scoring rules are not available for member picks.
- **FR-006**: System MUST apply **stage-dependent winner scoring** using a **configurable table** with at least the default rows listed in Scope; correct picks earn the stage’s positive points, incorrect picks earn the stage’s penalty (including zero).
- **FR-007**: System MUST allow the group owner to **update stage scoring values** before reveal and, with explicit action, after matches in that stage have been scored (with audit trail).
- **FR-008**: System MUST support **per-match bonus questions** (multiple prompts and single-pick modes where configured) with points awarded on official answers, shown separately in history and leaderboard detail.
- **FR-009**: System MUST support **season-level bonus questions** with owner-controlled visibility/reveal timing, consistent with prior prediction seasons.
- **FR-010**: System MUST enforce **pick lock** before kickoff (or owner-configured offset) with clear open/locked/finished states readable by non-technical users.
- **FR-010a**: For matches in **group stage** (`stage_key = group_stage`), system MUST allow members to predict **home team, away team, or Draw** (canonical stored value `Draw`) before lock; scoring compares picks to the official result after 90 minutes of regulation.
- **FR-010b**: For **knockout** stages (Round of 32, Round of 16, Quarter-Finals, Semi-Finals, Third Place Playoff, Final), system MUST accept only **home or away team** as member picks and as official results; draws after regulation are resolved via extra time and/or penalties, and the stored winner is the **team that won the match**, not `Draw`.
- **FR-010c**: Group owner MUST enter official results via the match result flow (home / draw / away for group stage; winning team only for knockout) before applying match scoring.
- **FR-011**: System MUST compute **leaderboard and personal history** with itemized winner and bonus lines and deterministic recalculation from the same official inputs.
- **FR-012**: System MUST expose **aggregate prediction statistics** for completed matches without exposing other members’ editable picks before lock.
- **FR-013**: System MUST **simplify navigation** for this deployment by removing or hiding features unrelated to World Cup prediction and Rummy within the private group context.
- **FR-014**: System MUST **retain Indian Rummy points-rummy** scoring behavior, permissions (owner and designated scorers), and separate contest leaderboards without modification to rules.
- **FR-015**: System MUST present **kid-friendly copy** for primary actions, statuses, and errors (short sentences, no internal codes, consistent team names).
- **FR-016**: System MUST allow the owner to **re-import** schedule data to pick up kickoff or team-name updates while protecting integrity of locked or completed matches.
- **FR-017**: System MUST record **voids and corrections** for match results with reason and adjusted points visible in member history.
- **FR-018**: System MUST restrict contest creation, import, stage reveal, scoring configuration, and official result entry to the **group owner** (and platform support only for break-glass assistance, not ordinary play).

### Key Entities

- **Tournament**: The FIFA World Cup 2026 edition represented in the app (name, season label, time zone policy).
- **Tournament Stage**: Ordered phase (Group Stage through Final) with reveal flag and linked scoring configuration row.
- **Stage Scoring Rule**: Correct-winner points and incorrect-prediction penalty for a stage; editable by owner.
- **Team**: National side or placeholder slot with optional group letter for group stage.
- **Host City / Venue**: Location metadata for member display (city, stadium, region cluster optional for filters).
- **Match**: Numbered fixture with kickoff, teams, stage, status (scheduled, open, locked, completed, voided).
- **Prediction Contest**: Group-scoped competition instance binding matches, bonuses, and scoring policies for the World Cup.
- **Member Pick**: A user’s outcome choice for a match before lock—home team name, away team name, or `Draw` (group stage only); stored in `predictions.predicted_winner`.
- **Bonus Prompt**: Per-match or season-level question with points, visibility schedule, and official answer.
- **Points Ledger Line**: Atomic point change (winner, bonus, adjustment) tied to match or season prompt.
- **Reveal Control**: Owner action linking a stage to member visibility and active scoring rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Group owner can import the full 104-match schedule and reveal Group Stage within **15 minutes** without manual per-match entry.
- **SC-002**: At least **90%** of test members (including one child or novice tester) can submit a winner pick for an open match in **under 90 seconds** on first try without help.
- **SC-003**: For a reference set of **20 scored matches** across stages, automated checks show **100%** agreement with the configured stage scoring table (winner and penalty columns).
- **SC-004**: **100%** of member-facing kickoff times in acceptance testing display in **US Eastern Time** with no off-by-one-day errors for evening matches.
- **SC-005**: Unrevealed stages remain **100%** hidden from member pick flows in tests (no fixture leakage via search or deep links).
- **SC-006**: Leaderboard and history views load within **3 seconds** for **95%** of interactions at 11 members and full schedule present.
- **SC-007**: At least **85%** of pilot participants agree the home screen and match list are **easy for kids to understand** (short survey or moderated usability session).
- **SC-008**: Rummy regression suite: **100%** of existing points-rummy acceptance scenarios from the prior release still pass unchanged.

## Assumptions

- **One primary private group** (~11 users) is sufficient for v1; multi-group membership may exist technically but is not optimized in UX.
- **US Eastern Time** uses current zone rules for June–July 2026 (EDT where applicable); no per-user time zone picker in v1.
- **Dataset source** is the unofficial Kaggle FIFA World Cup 2026 package cited by the user; import is operator-triggered with credentials stored securely outside the repo.
- **Third Place Playoff incorrect penalty**: user input listed “13 pts”; interpreted as **−3** to match the knockout penalty pattern until the owner sets otherwise in configuration.
- **Official results** are entered by the group owner (or delegated process outside the app); no live API feed in v1.
- **Group stage vs knockout outcomes**: group stage official results and picks MAY be **Draw** (tie after 90 minutes); knockout fixtures always resolve to a single winning team for prediction and scoring purposes.
- **Bonus parity** means the same categories of bonus features already shipped for prediction leagues (per-event prompts, season tab, reveal timing)—not a reduced subset.
- **Lock policy** defaults to kickoff time in Eastern Time unless the owner sets an earlier lock offset per match or stage.
- Existing **authentication and group invite** mechanics from the private-groups feature remain in place.
- **Removal of “everything else”** means participant-facing deprecation/hiding, not necessarily deleting historical database records.
- Platform **operator/admin** surfaces may remain for break-glass but are not linked from member navigation.

## Dependencies

- Existing private group, membership, invite, and authentication flows.
- Existing prediction contest, bonus, lock, leaderboard, history, and statistics behaviors—specialized for World Cup data and stage reveal.
- Existing Indian Rummy points-rummy implementation unchanged.
- Access to download/update the external tournament dataset (matches, teams, host_cities, tournament_stages, or equivalent normalized export).
- Group owner availability to reveal stages, configure bonuses, and enter official results throughout the tournament.

## Risks

- Unofficial dataset may diverge from FIFA announcements; owners need clear re-import and correction tools.
- Progressive reveal requires discipline; late reveal could frustrate members if communication is unclear.
- Stripping UI surfaces might hide needed owner tools if not carefully scoped—owner settings must remain discoverable with plain labels.
- Placeholder teams in early imports may confuse children unless copy explains “TBD playoff winner” simply.
- Configurable scoring changes after partial stage completion can cause disputes without visible audit history.
