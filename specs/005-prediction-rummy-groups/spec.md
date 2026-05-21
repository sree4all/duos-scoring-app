# Feature Specification: Dual-Mode Scoring with Private Groups

**Feature Branch**: `005-prediction-rummy-groups`  
**Created**: 2026-05-19  
**Status**: Draft  
**Input**: User description: "Additional requirements: (1) Prediction game for ongoing leagues/tournaments with all bonus features as in history; (2) Scoring for card games like Indian Rummy; (3) Teams create private groups via invite code and see only their group data."

## Problem Statement and Product Goals

The product must serve two distinct play patterns in one experience: league-style **prediction contests** (winner picks, bonus questions, season-long bonuses, leaderboards, and personal history) and **live card-game scoring** (starting with Indian Rummy). At the same time, informal teams (friends, clubs, office groups) need their own isolated space—same app capabilities as today, but partitioned so each group only sees its own members, contests, scores, and history unless they explicitly join another group.

### Product Goals

- Restore and sustain full prediction-contest value for any ongoing league or tournament, including every bonus-related capability participants expect from prior seasons.
- Enable reliable, transparent scorekeeping for Indian Rummy sessions (rounds/hands, drops, and settlements) without forcing those groups through prediction-only workflows.
- Let any team self-serve a private group using a simple invite mechanism, with strict data boundaries between groups.
- Keep participant flows simple (submit, view standings, review history) while group owners manage membership and visibility.

## Clarifications

### Session 2026-05-19

- Q: When this feature ships, where can prediction and Rummy contests live? → A: Group-only — every contest belongs to exactly one private group; no global/public participant contests.
- Q: For Indian Rummy score-entry contests, who is allowed to enter or correct hand scores? → A: Group owners plus designated scorers appointed by an owner; ordinary members cannot enter or correct hands.
- Q: Inside a private group, who may create and configure prediction/Rummy contests? → A: Group owners only (owners are the group's admins for setup); ordinary members and designated scorers cannot create or configure contests.
- Q: How should a group's invite code work for new members joining? → A: Reusable until rotated — the same code accepts unlimited joins until the owner regenerates it; prior code is invalid after rotation.
- Q: Which Indian Rummy scoring style should v1 ship with first? → A: Points rummy only — per-hand point totals, drops, and running session leaderboard; deals rummy is out of scope for v1.

## Scope

### In Scope

- **Prediction mode** for leagues/tournaments: schedule of events (matches/rounds), winner predictions, per-event bonus questions, season-level bonus questions, lock/reveal behavior, leaderboards, personal history, and aggregate prediction statistics where the product already exposes them for participants.
- **Card-game score-entry mode** optimized for **points rummy** (Indian Rummy): recording hand outcomes, drop penalties, unmelded-card points, and rolling up session or series totals for group members.
- **Private groups**: creation by a group owner, shareable invite code (or equivalent join token), member roster, and enforcement that all contest data, submissions, leaderboards, and history are visible only within the active group context.
- **Multi-membership**: a signed-in user may belong to more than one group and switches context to work within one group at a time.
- **Group administration**: invite code regeneration, member removal, designating Rummy scorers, and assigning at least one group owner who can start contests for that group.
- **Group-only tenancy**: all prediction and Rummy contests are created and operated inside a private group; there are no global or cross-group public contests for participants.

### Out of Scope

- Real-time card dealing, turn-by-turn gameplay, or video/voice integration.
- Automated detection of card outcomes from photos or devices.
- Public discovery directory of groups (groups are joined only via invite, not browsed globally).
- Global or platform-wide participant contests visible outside a group context.
- Payment, wagering, or prize-pool settlement outside point totals shown in the app.
- Native mobile apps or offline-first play in this feature.
- Arbitrary custom scoring formulas authored by end users without presets.
- Deals rummy (chip-per-deal) scoring in v1; may be added later as a separate preset.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run a League Prediction Contest with Full Bonuses (Priority: P1)

As a **Group Owner** running an ongoing league or tournament, I configure prediction events so members pick winners and answer bonus questions, earn season-long bonus points, and follow the same bonus-rich experience they had in past seasons.

**Why this priority**: Prediction leagues are the established core engagement loop; losing bonus or history features would break trust for returning users.

**Independent Test**: Create a group, publish a prediction contest with at least one event plus match bonus and season bonus questions, have members submit before lock, score the event, and verify leaderboard, history breakdown, and bonus point lines match configured rules.

**Acceptance Scenarios**:

1. **Given** a prediction contest is open for an event, **When** a member submits a winner pick and answers available bonus prompts before the lock time, **Then** the submission is saved and shown in their personal history.
2. **Given** an event is locked, **When** a member attempts to change a prior submission, **Then** the system blocks the edit and shows clear lock status.
3. **Given** official results and bonus answers are recorded for an event, **When** scoring runs, **Then** members see winner points, per-prompt bonus points (where configured), and updated contest leaderboard totals.
4. **Given** season bonus questions are configured with visibility rules, **When** a member views the season bonuses area after it becomes visible, **Then** they can submit season bonus answers and see how those points contribute to their total once scored.
5. **Given** multiple members have submitted, **When** a member views prediction statistics for the contest, **Then** they can see aggregate pick distribution for completed events without seeing other members’ private draft picks before lock.

---

### User Story 2 - Score Indian Rummy Sessions for a Group (Priority: P1)

As a **Group Owner or designated Scorer**, I record Rummy hand outcomes so the group has an accurate running tally of who won/lost points across a session or series.

**Why this priority**: Card-game scoring is the second explicit product pillar and must work without prediction-style picks.

**Independent Test**: Within one group, start a Rummy score-entry contest, record several hands with drops and a declared winner, and verify per-player totals and history match the configured Rummy rules.

**Acceptance Scenarios**:

1. **Given** a Rummy score-entry contest is active, **When** a designated scorer records a completed hand with each player’s unmelded points (or valid drop), **Then** the system updates running totals for all participants in that contest.
2. **Given** a player takes an early drop, **When** the hand is saved with drop type, **Then** the applied penalty matches the contest’s Rummy preset (e.g., first drop, middle drop, full count).
3. **Given** a session spans multiple hands, **When** members open the contest leaderboard, **Then** they see cumulative points and can drill into hand-level history for transparency.
4. **Given** an incorrect hand entry, **When** a group owner or designated scorer issues a correction with reason, **Then** totals are adjusted and prior values remain auditable in history.

---

### User Story 3 - Create and Join a Private Group via Invite Code (Priority: P1)

As a **Team Organizer**, I create a private group, share an invite code with friends, and everyone only sees our group’s contests and scores—not other teams’ data.

**Why this priority**: Multi-tenant isolation is a new foundational requirement; without it, informal teams cannot safely use a shared public deployment.

**Independent Test**: Two groups each run a contest with overlapping member names; members in Group A never see Group B contests, leaderboards, or history when operating in Group A context.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they create a new group, **Then** they become group owner, receive a join invite code, and land in that group’s home context.
2. **Given** a valid invite code, **When** another signed-in user joins, **Then** they appear in the group roster and gain access only to that group’s data.
3. **Given** a user belongs to Group A and Group B, **When** they switch active group to A, **Then** contest lists, leaderboards, and history reflect only Group A until they switch.
4. **Given** a group owner regenerates the invite code, **When** a new user tries the old code, **Then** join is rejected and the owner can share the new code.
5. **Given** a user is removed from a group, **When** they next open the app, **Then** they no longer see that group’s contests or data and cannot rejoin without a fresh invite (unless the owner re-invites them).

---

### User Story 4 - Operate Both Modes in the Same Group (Priority: P2)

As a **Group Owner**, I run a prediction league and a weekly Rummy night in the same group without cross-contaminating scores or confusing members.

**Why this priority**: Real teams often mix formats; the product should feel like one home for the group.

**Independent Test**: One group hosts one active prediction contest and one active Rummy contest; members complete flows appropriate to each format with separate leaderboards.

**Acceptance Scenarios**:

1. **Given** a group with multiple active contests, **When** a member opens the contest list, **Then** each contest is labeled by format (prediction vs card scoring) and status.
2. **Given** prediction and Rummy contests run concurrently, **When** totals are displayed, **Then** points do not merge across contests unless the owner explicitly configures a combined series (out of scope for v1; separate leaderboards by default).

---

### Edge Cases

- Member submits a prediction exactly at lock time; system applies a single deterministic cutoff and reports accepted or rejected clearly.
- Invite code leaked publicly; owner regenerates code and optionally removes unexpected joiners.
- User joins wrong group via typo; they can leave the group themselves or owner removes them—no access to data after removal.
- Rummy hand entered with mismatched player count or missing drop type; system blocks save with plain-language guidance.
- Non-scorer member attempts to enter or edit a Rummy hand; system denies the action and directs them to contact the owner or scorer.
- Non-owner member attempts to create or reconfigure a contest; system denies the action and indicates only group owners (admins) can manage contests.
- Season bonus tab scheduled for future reveal; members see placeholder or hidden state until reveal rules are satisfied.
- Voided or corrected event/hand after points were awarded; history shows adjustment with reason and updated net totals.
- Empty group (owner only): owner can still create contests; joining requires invite before others participate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support a **prediction contest mode** for ongoing leagues/tournaments including scheduled events, winner picks, lock windows, scoring, contest leaderboard, and personal history with itemized point breakdown.
- **FR-002**: System MUST support **per-event bonus questions** (multiple prompts per event where configured), award bonus points when official answers match member answers, and show bonus lines separately in history and leaderboard detail.
- **FR-003**: System MUST support **single bonus pick per event** where configured, when multi-prompt bonuses are not used.
- **FR-004**: System MUST support **season-level bonus questions** as a distinct tab or section, including admin-controlled visibility timing and reveal, and include season bonus points in member totals when scored.
- **FR-005**: System MUST expose **prediction statistics** (aggregate pick distribution for completed events) to group members without exposing other members’ editable drafts before lock.
- **FR-006**: System MUST support a **card-game score-entry mode** for Indian Rummy including hand/round recording, drop penalties, unmelded-card points, declared winner, and cumulative contest totals.
- **FR-007**: System MUST provide **points-rummy scoring presets** for v1 covering common Indian points-rummy conventions (e.g., point caps per hand, first/middle drop penalties, full-count loss) selectable when creating a Rummy contest.
- **FR-025**: System MUST NOT support deals-rummy (chip-per-deal) scoring in v1; deals rummy MAY be introduced later as an additional preset without changing points-rummy behavior.
- **FR-008**: System MUST allow only **group owners and designated scorers** (appointed by an owner) to enter or correct Rummy hand entries, with mandatory reason on correction, preserving prior values in audit history.
- **FR-022**: System MUST allow group owners to **appoint and revoke designated scorers** for their group; designated scorers MUST NOT have full owner privileges unless also promoted to owner.
- **FR-023**: System MUST deny Rummy hand entry and correction attempts by ordinary group members who are not owners or designated scorers.
- **FR-024**: System MUST restrict **contest creation and configuration** (including events, bonuses, lock times, and publish) to **group owners only**; designated scorers and ordinary members participate but cannot create or reconfigure contests.
- **FR-009**: System MUST allow any signed-in user to **create a private group** and become its initial owner.
- **FR-010**: System MUST generate a **reusable join invite code** per group that any number of signed-in users may use to join until the owner regenerates it; after regeneration, attempts with the prior code MUST be rejected.
- **FR-011**: System MUST enforce **strict data isolation** so contests, submissions, leaderboards, history, and member lists for a group are visible only to members of that group (and platform support roles if defined in assumptions).
- **FR-012**: System MUST allow users to **belong to multiple groups** and **select an active group context** that filters all participant-facing lists and detail views.
- **FR-013**: System MUST allow group owners to **regenerate invite codes**, **remove members**, and **transfer or share owner responsibilities** with at least one owner at all times.
- **FR-014**: System MUST require every contest, event, submission, and scoring record to be **associated with exactly one group** so isolation rules are enforceable by default; the system MUST NOT expose participant-facing contests outside a group context.
- **FR-021**: System MUST NOT allow creation or participation in prediction or Rummy contests except within an active private group; platform operators may access cross-group data only for support and abuse resolution, not as a substitute for global participant contests.
- **FR-015**: System MUST prevent users removed from a group from accessing that group’s data on subsequent visits.
- **FR-016**: System MUST label contests and navigation clearly by **format** (prediction vs Rummy score-entry) to reduce user error.
- **FR-017**: System MUST apply **lock and reveal policies** for prediction events consistent with historical expectations (no edits after lock; clear status on schedule).
- **FR-018**: System MUST show **voided or corrected** prediction events and Rummy hands in history with status, reason, and net point effect.
- **FR-019**: System MUST use **deterministic scoring** so the same official inputs produce the same points on recalculation.
- **FR-020**: System MUST present **actionable, non-technical errors** when invite codes are invalid, expired, or contests are misconfigured.

### Key Entities

- **Group**: A private team space with name, owners, members, active invite code, and lifecycle (active/archived).
- **Group Membership**: Links a user to a group with role (owner, member, designated scorer) and join timestamp; scorer is an additional capability an owner grants to a member.
- **Invite Code**: Reusable join credential for a group; accepts unlimited joins until the owner regenerates it, after which only the new code is valid.
- **Contest**: A group-scoped competition instance in either prediction or Rummy score-entry format, with schedule and status.
- **Event** (prediction): A schedulable unit (e.g., match) with lock time, official results, and linked bonus prompts.
- **Bonus Prompt**: Per-event or season-level question with official answer, visibility rules, and point value.
- **Submission**: Member inputs for prediction picks and bonus answers, or scorer-entered Rummy hand data.
- **Hand / Round** (Rummy): One scored unit within a Rummy contest with participants, drop types, points, and winner.
- **Points Record**: Immutable or append-only ledger line for each point change with source, reason, and link to event or hand.
- **Leaderboard Entry**: Ranked view of members for a contest with totals, tie-break metadata where applicable, and drill-down detail.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of test users can create a group, share an invite code, and have a second member join within 5 minutes without assistance.
- **SC-002**: In isolation tests, 100% of attempts by a non-member to access another group’s contest or leaderboard are denied.
- **SC-003**: For a reference prediction season with bonuses, scored outcomes match approved reference sheets for at least 99% of test events (winner + bonus + season bonus combinations).
- **SC-004**: For a reference **points-rummy** session of at least 10 hands, cumulative totals match manual calculation under the selected preset for 100% of hands.
- **SC-005**: Members can complete a prediction submission (winner + available bonuses) in under 2 minutes on first attempt for a typical single event.
- **SC-006**: A designated scorer can record a standard Rummy hand in under 1 minute after the first hand in a session.
- **SC-007**: Leaderboard and personal history views for active group contests load within 3 seconds for at least 95% of requests at target group size (up to 50 members, 30 active events).
- **SC-008**: At least 85% of pilot group owners report that both prediction and Rummy flows are understandable without training (survey or structured feedback).

## Assumptions

- Users authenticate with existing sign-in; group membership is tied to authenticated identity.
- **Prediction parity** means feature equivalence with the product’s established league experience: winner points, match bonuses (multi-prompt and single-pick), season bonuses with timed/admin reveal, leaderboards, personal history, lock behavior, and prediction statistics—not a reduced subset.
- **Indian Rummy v1** is **points rummy only**, using widely used house rules encoded as presets (point cap, drop penalties, full count); deals rummy and other variants are deferred to later presets.
- Each contest has a separate leaderboard by default; combined cross-format championships are not required in v1.
- Platform operators may access cross-group data only for abuse resolution and support, not for ordinary participant browsing or hosting global participant contests.
- All participant-facing contests are group-scoped only; there is no parallel global/public contest layer for end users.
- Group size for v1 is typically under 50 members; performance targets assume that scale unless extended later.
- Generalized scoring platform capabilities from prior work (immutable point history, void/correction transparency, tie-break defaults) apply where relevant but are not re-specified here except where this feature adds group isolation or format-specific behavior.

## Dependencies

- Existing user authentication and profiles.
- Prior generalized contest, event, submission, and ledger concepts where they already exist; this feature adds **group scoping** and explicit **dual-format** product requirements on top.
- Group owners are the group's admins: they create and configure contests, enter official match results when needed, and may delegate Rummy hand entry to designated scorers.
- Contest configuration UI for group owners lives under authenticated group routes (`/groups/[groupId]/contests/new`), not the platform `/admin` area (reserved for platform operators if retained).

## Risks

- Ambiguous points-rummy house rules across regions may cause dissatisfaction if presets are not labeled clearly; deals-rummy users must wait for a future preset.
- Invite code sharing mistakes could expose a group to unintended members until the owner rotates the code; reusable codes increase leak impact, mitigated by owner regeneration and member removal.
- Supporting full prediction bonus parity while adding groups increases configuration complexity for owners without guided setup.
