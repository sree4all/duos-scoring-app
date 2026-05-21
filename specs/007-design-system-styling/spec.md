# Feature Specification: App-Wide Design System Styling

**Feature Branch**: `007-design-system-styling`  
**Created**: 2026-05-21  
**Status**: Draft  
**Input**: User description: "Use the .cursor/design.json for styling only and apply that styling across the app"

## Problem Statement and Product Goals

The product today presents prediction, scoring, and group management flows with a neutral, light-themed interface that does not reflect the intended **sports-tech, neon scoreboard** brand experience. Stakeholders have captured the target look and feel in a single design reference file (`.cursor/design.json`) describing colors, typography, spacing, surfaces, and component treatments for a high-contrast, mobile-friendly experience.

This feature delivers **visual consistency only**: every user-facing screen should look and feel like it belongs to the same premium broadcast-style product, without changing navigation structure, business rules, data flows, or feature availability.

### Product Goals

- Establish **one authoritative styling source** (`.cursor/design.json`) for visual tokens and component appearance rules.
- Apply that styling **across the entire application**—marketing/entry surfaces, authentication, member flows, contest and leaderboard views, Rummy flows, group settings, and owner/admin tools.
- Preserve **readability and accessibility** for the existing audience (including younger readers on prediction screens) while adopting bold typography and high contrast from the reference.
- Keep **layout and information architecture unchanged**; only appearance (color, type, spacing rhythm, borders, shadows, glows, backgrounds, control chrome) may change.

## Clarifications

### Session 2026-05-21

- Q: On dense screens (schedules, leaderboards, admin tables), how strictly should reference typography sizes (e.g. 54px headlines, 27px body) be applied? → A: Full reference scale on entry/marketing-style pages; scaled-down related tier on data-dense app screens (schedules, tables, forms).
- Q: On data-dense screens, how should page backgrounds use the reference’s layered gradient and pattern overlays? → A: Gradient on all pages; grid/dot pattern overlays only on entry and lighter member pages, not on dense data views.
- Q: How should primary button sizing apply given the reference’s tall (~92px) primary button? → A: Full reference height on entry/marketing and major page CTAs; compact touch-friendly size (~44–48px min) on dense forms, lists, and repeated actions.
- Q: What accessibility contrast bar should body text, labels, and form errors meet on the dark neon theme? → A: WCAG 2.1 AA minimum for all text, including headlines and captions.
- Q: On data-dense screens, how should main content be presented against the gradient background? → A: Main blocks use elevated semi-transparent cards/panels on the gradient (tables, forms, settings sections).

## Scope

### In Scope

- **Design reference adoption**: Map and apply styling attributes from `.cursor/design.json`, including:
  - Layered purple-to-blue gradient backgrounds on all page shells; subtle grid/dot overlays and soft vignette on entry and lighter member pages only—not on data-dense views (schedules, leaderboards, admin tables).
  - Color palette: deep purple base, white primary text, muted secondary text, mint-green primary actions, and accent colors for scores and highlights (orange star, yellow highlight, green/blue/red score accents).
  - Typography scale and weights: oversized bold headlines, large readable body copy, prominent button labels, caption/muted treatments—with **two tiers**: full reference scale on entry/marketing-style surfaces; a scaled-down but visually related tier on data-dense screens (schedules, leaderboards, tables, multi-field forms).
  - Spacing rhythm based on the documented scale and vertical section spacing.
  - Component chrome: primary buttons (mint CTA, rounded, shadowed)—full reference height on entry and major page CTAs; compact touch-friendly height on dense forms, lists, and repeated actions; elevated semi-transparent cards/panels for dense content blocks (tables, forms, settings); inputs, tables/lists, navigation bar, badges, toasts/notifications, empty states, and loading states.
  - Effects: soft glows, antialiased text, subtle borders at low opacity—matching the reference’s energetic but clean broadcast aesthetic.
- **App-wide coverage**: All routes and shared layout chrome (headers, footers, nav, modals, dialogs) receive the updated styling.
- **Responsive behavior**: Mobile-first safe padding and readable type at narrow widths; larger viewports may use additional horizontal space without abandoning the design language.
- **State styling**: Hover, pressed, disabled, focus, error, and success states for interactive elements use palette-consistent treatments derived from the reference (e.g., mint CTA hover/pressed variants).
- **Documentation for reviewers**: A short visual checklist mapping major screens to design tokens (for QA), without prescribing implementation technology.

### Out of Scope

- Changing page structure, navigation items, copy, workflows, permissions, or scoring logic.
- Rebuilding screens to match the reference landing page’s **marketing funnel layout** (strict center stack, hero-only composition); existing multi-column or data-dense layouts remain, styled with the new tokens.
- New product features (avatars cluster, star ratings, embedded marketing previews) unless they already exist in the app—in that case, only their **appearance** may be updated.
- Illustrations, photography, or logo redesign beyond applying existing assets with new colors/typography.
- Internationalization, time zones, or content changes.
- Automated visual regression infrastructure (manual review is acceptable for v1).
- Replacing or relocating `.cursor/design.json`; it remains the styling source file as provided.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Brand Experience Everywhere (Priority: P1)

As a **member or guest**, I open any page in the app and immediately recognize the same neon sports scoreboard aesthetic—dark gradient atmosphere, bright headlines, mint primary actions, and readable body text.

**Why this priority**: Cohesive branding is the core outcome; partial adoption would feel broken.

**Independent Test**: Visit home/login, one contest schedule page, and one leaderboard; confirm shared background treatment, type hierarchy, and primary button styling without comparing unrelated layout changes.

**Acceptance Scenarios**:

1. **Given** I land on the public entry or login screen, **When** the page loads, **Then** I see the deep purple gradient atmosphere, white headline-level text, and mint primary call-to-action styling consistent with the design reference.
2. **Given** I navigate between contest list, match picks, and personal history, **When** each page renders, **Then** backgrounds, text colors, and primary buttons match the same token set (no revert to plain light-gray enterprise styling).
3. **Given** I use secondary actions (cancel, back, low-emphasis links), **When** I view controls, **Then** they are visually distinct from primary mint actions but still legible on the dark background.
4. **Given** I view tabular or list data (standings, history lines), **When** content is dense, **Then** row text and dividers remain readable with muted secondary text and subtle borders per the reference.

---

### User Story 2 - Readable Gameplay and Admin Tasks (Priority: P1)

As a **group member or owner**, I complete prediction picks, review scores, configure bonuses, or manage group settings without losing clarity because of the new bold visual style.

**Why this priority**: Styling must not harm task completion for the app’s primary jobs.

**Independent Test**: Complete a pick submission and an owner-only settings change on styled screens; verify labels, errors, and confirmations remain legible.

**Acceptance Scenarios**:

1. **Given** a form with required fields, **When** I focus and submit, **Then** labels, inputs, validation errors, and success feedback use high-contrast colors and sufficient size for quick scanning.
2. **Given** locked or disabled controls, **When** I attempt interaction, **Then** disabled styling is obvious (reduced contrast or non-interactive appearance) while still meeting readability expectations.
3. **Given** score-positive, score-negative, or neutral outcomes in history or leaderboard, **When** points are displayed, **Then** accent colors align with the reference’s green/blue/red score semantics where those semantics already exist in the product.
4. **Given** owner/admin surfaces, **When** I manage imports, stage reveal, or scoring tables, **Then** tables and dense controls use the same styling system as member views (not a separate legacy theme).

---

### User Story 3 - Comfortable Use on Phones (Priority: P2)

As a **mobile user**, I scroll and tap through schedules and picks on a narrow screen without clipped text, illegible captions, or touch targets that are too small.

**Why this priority**: The design reference is mobile-first; the app is used on phones during live matches.

**Independent Test**: View schedule and leaderboard at ~390px width; verify padding, type sizes, and button heights feel comfortable.

**Acceptance Scenarios**:

1. **Given** a viewport width typical of a phone, **When** I open primary flows, **Then** horizontal padding approximates the reference safe margins and content does not touch screen edges.
2. **Given** primary actions on a page, **When** I tap buttons, **Then** tap targets meet a minimum comfortable height (full reference proportion on entry/major CTAs; at least ~44–48px on dense forms and repeated actions) without overlapping adjacent controls.
3. **Given** long headlines or team names, **When** text wraps, **Then** line height and letter spacing preserve readability without overflow breaking layout.

---

### Edge Cases

- **Very long content** (long team names, multi-line bonus prompts): text wraps gracefully; no horizontal scroll on standard phone widths except intentional wide tables with scroll containers.
- **Empty and loading states**: empty lists and spinners use the dark theme and muted caption color within semi-transparent card shells on dense pages—not stark white boxes from the old theme.
- **System/browser dark preference**: app presents the neon dark theme consistently; no mixed light shell unless a future feature explicitly adds a second theme.
- **Print or PDF export** (if any): acceptable to simplify background effects for print; screen experience remains priority.
- **Third-party embeds or raw HTML** (if present): inherit surrounding page background where possible; isolated legacy widgets are out of scope for v1.
- **Accessibility**: all text (headlines, body, captions, labels, errors) MUST meet **WCAG 2.1 AA** contrast minimums on dark backgrounds; focus indicators remain visible; error text does not rely on color alone (icon or label reinforcement where errors already exist).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST treat `.cursor/design.json` as the single authoritative source for visual styling decisions (colors, typography, spacing scale, radii, shadows, glows, and component appearance attributes defined therein).
- **FR-002**: The system MUST apply those styling decisions to all user-facing routes and shared layout elements (navigation, headers, footers, modals, toasts) so no screen retains the pre-change light neutral theme as the default experience.
- **FR-003**: Primary user actions MUST use the mint call-to-action styling (color, hover/pressed differentiation, rounded shape, and prominence) defined in the design reference. **Sizing**: full reference button height on entry/marketing and major page-level CTAs; compact touch-friendly height (minimum ~44–48px) on dense forms, inline list actions, and other repeated controls—same mint styling in both sizes.
- **FR-004**: Page backgrounds MUST use the layered purple-to-blue gradient atmosphere on all user-facing shells. Grid/dot pattern overlays and vignette MUST appear on entry and lighter member pages; data-dense screens (schedules, leaderboards, admin tables) MUST use the gradient without pattern overlays, adapted to full-page app shells without requiring marketing-only section structure.
- **FR-005**: Typography MUST follow the reference hierarchy on entry/marketing-style pages (bold oversized headlines, large body, prominent button labels, muted captions). On data-dense screens (schedules, leaderboards, admin tables, multi-field forms), typography MUST use a **scaled-down related tier** derived from the same reference tokens—preserving hierarchy and brand feel without applying literal hero/body pixel sizes that impair scanability.
- **FR-006**: Data-dense views (leaderboards, history, admin tables, multi-field forms, settings) MUST present main content in **elevated semi-transparent cards/panels** on the gradient background, using primary, secondary, and muted text colors and subtle dividers from the reference palette—not legacy opaque light boxes or fully flat unbounded content on the gradient.
- **FR-007**: Interactive components (buttons, links, inputs, selects, tabs, cards, badges) MUST expose consistent hover, focus, disabled, and error states derived from the same token set.
- **FR-008**: Score- or outcome-related emphasis MUST use the reference accent colors (green, blue, red, orange, yellow) consistently wherever the product already communicates positive, negative, or neutral scoring visually.
- **FR-009**: Spacing between major sections MUST follow the reference spacing scale and vertical rhythm so pages feel airy rather than cramped, without changing the order or presence of functional blocks.
- **FR-010**: The feature MUST NOT alter business logic, API contracts, database schema, routing paths, or feature flags—only presentation.
- **FR-011**: Styling changes MUST NOT remove or hide existing features solely for visual simplification (e.g., avoiding the reference’s “minimal landing” anti-patterns on complex admin screens).
- **FR-012**: A reviewer MUST be able to verify coverage using a documented screen list (entry, auth, member contest flows, Rummy, group settings, World Cup owner tools, admin scoring) against the design reference checklist.

### Key Entities

- **Design reference file** (`.cursor/design.json`): Canonical description of the Neon Sports Scoreboard visual language—palette, type styles, spacing scale, component specs, effects, and composition hints; used for styling only, not for routing or data models.
- **Design token**: A named visual attribute (e.g., primary text, CTA background, section spacing large) derived from the reference and applied uniformly across UI surfaces.
- **Styled surface**: Any user-visible region—page shell, navigation, card, form control, table row, toast—that must resolve tokens from the reference rather than ad hoc colors.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a structured review of at least 12 named screens (covering entry, auth, member contest, leaderboard, history, Rummy, group settings, World Cup owner, and admin), **100%** use the new background, typography, and primary button treatments with **zero** screens still defaulting to the legacy light theme.
- **SC-002**: **95%** of test participants (or internal reviewers) can identify the app’s primary action on each tested screen within **5 seconds** without guidance, demonstrating clear visual hierarchy.
- **SC-003**: On a **390px-wide** viewport, **100%** of primary flows tested (login, schedule/picks, leaderboard) require **no horizontal scrolling** for main content blocks (tables may scroll internally).
- **SC-004**: On all tested screens, **100%** of text samples (headlines, body, captions, labels, form errors) meet **WCAG 2.1 AA** contrast minimums against their backgrounds, verified in structured review.
- **SC-005**: After release, styling-related confusion tickets (e.g., “can’t read text”, “button invisible”) remain **zero** for two weeks in private group usage, or are resolved in a single follow-up patch if found in review.

## Assumptions

- `.cursor/design.json` is complete and stable for this effort; updates to that file during implementation are treated as change requests, not scope expansion.
- **Styling-only** means existing layouts, component trees, and information density stay; only visual properties change unless a minimal wrapper is required to apply background layers.
- The product continues to target **one primary dark neon theme**; a separate light mode is not required for v1.
- The reference’s **landing-page composition rules** (strict center funnel, hero-first viewport) inform tone and spacing but do not force restructuring of data-heavy admin or schedule screens.
- **Typography tiers**: entry, login, and marketing-style surfaces use full reference type scale; authenticated data-dense surfaces use a proportionally smaller tier from the same token family (not legacy app sizes).
- **Button sizing tiers**: entry/marketing and major page CTAs use full reference primary button height; dense forms and repeated actions use compact touch-friendly height with identical mint CTA colors and states.
- **Dense content surfaces**: schedules, leaderboards, admin tables, forms, and settings use elevated semi-transparent cards/panels on the gradient—not flat unbounded content or opaque light panels.
- **Inter** (or equivalent sans-serif from the reference stack) is acceptable for web delivery via standard font loading practices.
- Decorative patterns (diagonal grid, dots, vignette) appear only on entry and lighter member pages; data-dense screens use gradient-only backgrounds. Patterns may be further simplified on low-end devices if performance suffers, but color and type must remain consistent.
- Accessibility: **WCAG 2.1 AA** contrast minimums apply to all text roles (headlines, body, captions, labels, errors)—no relaxed exceptions for decorative headlines.
- No new user roles or permissions are introduced by this feature.
