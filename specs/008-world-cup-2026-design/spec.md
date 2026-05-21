# Feature Specification: World Cup 2026 Themed Page Backgrounds

**Feature Branch**: `008-world-cup-2026-design`  
**Created**: 2026-05-21  
**Status**: Draft  
**Input**: User description: "Blend these images in the background to be applied in the design.json file and call the design - World Cup 2026. Apply this design aesthetically one image per page. First one in the welcome, second in the prediction and third in the standings/leaderboard."

## Problem Statement and Product Goals

The app already uses a shared neon scoreboard visual language (feature 007) driven by `.cursor/design.json`. For the FIFA World Cup 2026 prediction experience, stakeholders want a **distinct, event-branded atmosphere** that celebrates iconic football imagery while keeping tasks readable.

Three stakeholder-provided hero artworks must be **blended into page backgrounds**—not pasted as raw banners—and registered in the design reference under the name **World Cup 2026**. Each artwork maps to exactly one primary screen family so users feel a deliberate narrative arc: arrival (welcome), competition (prediction), and results (standings/leaderboard).

### Product Goals

- Introduce a named **World Cup 2026** design variant in the styling reference that documents per-page background imagery, blend treatments, and supporting tokens (overlays, vignette, accent hints drawn from each image’s palette).
- Deliver **one hero image per page type**, applied aesthetically behind content without changing layout, navigation, scoring logic, or data flows.
- Preserve **readability and accessibility** on busy photographic/illustrated backgrounds via controlled overlays, contrast-safe text treatments, and elevated content panels where needed.
- Remain **styling-only**: extend the existing design reference and how pages consume it; do not alter product behavior beyond appearance.

## Clarifications

### Session 2026-05-21

- Q: When should the World Cup 2026 backgrounds (and theme) be active? → A: Only on the three in-scope page families when the user is in a **World Cup prediction contest** context (aligned with feature 006 and FR-007); Rummy and other contest types keep the default neon theme on all routes.
- Q: How should `/welcome` decide to show the first hero image? → A: Show welcome artwork when the user’s **current group has an active World Cup prediction contest** (group-level check; no contest ID required in the URL).
- Q: Should `/groups` use the welcome hero image when the group has an active World Cup contest? → A: No — `/groups` stays default neon gradient only; hero images apply only to `/welcome`, prediction, and leaderboard.
- Q: When the user has `prefers-reduced-motion` enabled, what should happen on the three World Cup hero pages? → A: Skip hero images entirely — show default neon gradient only on welcome, prediction, and leaderboard.
- Q: On the three hero pages (when images are shown), how should the artwork relate to the existing purple neon gradient? → A: **Subtle texture** — hero image at low opacity (~20–30%) over the full gradient so the gradient remains visually dominant.

## Scope

### In Scope

- **Design reference extension**: Add or extend `.cursor/design.json` with a **World Cup 2026** theme block that includes:
  - Theme display name: `World Cup 2026`
  - Three page-specific background definitions (welcome, prediction, standings/leaderboard)
  - Blend parameters: full **base purple neon gradient always visible**; hero image as a **low-opacity texture layer (~20–30% opacity)** over the gradient; optional focal crop and light vignette; additional dark wash behind dense content panels if needed for legibility
  - Palette accents harmonized with each image (warm gold/orange for welcome artwork; stadium red/sky blue/green pitch for prediction; navy and pop-art cyan/magenta for standings)
- **Page-to-image mapping** (fixed order from stakeholder input):

  | Page family | Artwork role | Visual character |
  |-------------|--------------|------------------|
  | **Welcome** | First provided image | Expressive dual-portrait, warm/cool split, high energy “clash of legends” |
  | **Prediction** (match picks / schedule) | Second provided image | Cinematic stadium walk, heroic scale, red/blue team tones |
  | **Standings / leaderboard** | Third provided image | Bold geometric pop-art dual portrait on deep navy |

- **Asset stewardship**: Incorporate the three stakeholder-provided image files into the project’s public/static asset location suitable for backgrounds, with consistent naming referenced from the design file.
- **Application surfaces**: Member-facing **welcome hub**, **contest prediction / matches** flow, and **contest leaderboard / standings**—each showing its assigned hero artwork **only** when the active route is tied to a **World Cup prediction contest** (not Rummy or other contest types).
- **Tier alignment with 007**: Welcome uses entry/light background treatment (patterns/overlays allowed); prediction and standings use dense-tier shells (gradient + image blend without busy grid overlays on data-heavy areas; main tables/forms remain on elevated glass panels).
- **Fallback**: When imagery fails to load, pages fall back to the existing purple gradient atmosphere without broken layout. When **`prefers-reduced-motion`** is enabled, hero images are **not shown**—default neon gradient only on the three in-scope pages.

### Out of Scope

- Changing routes, copy, workflows, permissions, imports, or scoring rules.
- Replacing logos, creating new illustrations, or licensing third-party likenesses beyond using the supplied assets as provided.
- Applying World Cup imagery to unrelated flows (Rummy, generic group settings, non–World Cup contests) unless explicitly toggled later.
- **Group hub (`/groups`)**: remains default neon gradient only—even when the group has an active World Cup prediction contest (hero imagery is limited to `/welcome`, prediction, and leaderboard).
- Admin/owner dense tooling themes (imports, stage reveal tables) unless they share the same page shell as leaderboard—leaderboard styling is in scope; separate admin-only screens are out of scope for v1.
- Automated visual regression infrastructure (manual QA checklist is acceptable).
- Renaming or removing the default **Neon Sports Scoreboard** theme; World Cup 2026 is an additional named theme/variant.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Immersive Welcome Arrival (Priority: P1)

As a **member opening the app after joining a World Cup contest**, I land on the welcome hub and immediately sense the 2026 tournament theme through a cinematic blended background behind familiar navigation and calls to action.

**Why this priority**: Welcome is the first impression; the first artwork anchors the entire themed experience.

**Independent Test**: Open the welcome page for a World Cup contest context; confirm the first artwork is visible as a blended background, headline and primary actions remain readable, and the page still matches mint CTA and typography hierarchy from the base design system.

**Acceptance Scenarios**:

1. **Given** I view `/welcome` and my current group has an active World Cup prediction contest, **When** the page loads, **Then** the first stakeholder artwork appears as a low-opacity (~20–30%) texture over the dominant purple neon gradient so white headline text meets contrast expectations.
2. **Given** the welcome background is visible, **When** I scroll primary content, **Then** foreground cards, buttons, and links remain legible without text sitting directly on unmasked busy areas of the portrait.
3. **Given** the image asset is unavailable, **When** the page loads, **Then** I still see the standard gradient atmosphere with no broken layout or empty image placeholders in the main viewport.

---

### User Story 2 - Focused Prediction Atmosphere (Priority: P1)

As a **member making match predictions**, I work on picks with the second artwork subtly reinforcing stadium energy without distracting from forms, locks, and match rows.

**Why this priority**: Prediction is the core World Cup task; imagery must support—not hinder—pick accuracy.

**Independent Test**: Open contest matches/prediction for a World Cup contest; verify second artwork, dense-tier glass panels for match list, and readable form controls.

**Acceptance Scenarios**:

1. **Given** I open the prediction / matches experience, **When** the page renders, **Then** the second stakeholder artwork appears as a low-opacity texture over the dominant gradient, with glass panels carrying primary readability for match rows and picks.
2. **Given** match rows and pick controls on glass panels, **When** I scan the schedule, **Then** labels, scores, and validation messages remain readable at a glance on a phone-width viewport.
3. **Given** a locked or disabled pick state, **When** displayed on the themed background, **Then** disabled styling remains obvious and contrast-safe.

---

### User Story 3 - Clear Standings on Pop-Art Backdrop (Priority: P1)

As a **member checking standings**, I read ranks and points against the third artwork’s bold navy pop-art aesthetic, with table content on elevated panels for clarity.

**Why this priority**: Leaderboards are data-dense; readability is non-negotiable.

**Independent Test**: Open contest leaderboard; confirm third artwork, dense tier without pattern clutter, glass table panel, score accent colors intact.

**Acceptance Scenarios**:

1. **Given** I open standings / leaderboard, **When** the page loads, **Then** the third stakeholder artwork appears as a low-opacity texture over the dominant gradient, with the standings table on an elevated glass panel for tabular clarity.
2. **Given** ranked rows with positive/negative point styling, **When** I review the board, **Then** score accent semantics remain consistent with the base design system.
3. **Given** a long leaderboard, **When** I scroll within the table panel, **Then** only the table scrolls as today; the background remains fixed or subtly parallax-limited so motion does not induce nausea.

---

### User Story 4 - Theme Coherence Across the Trio (Priority: P2)

As a **member moving welcome → prediction → leaderboard**, I perceive one **World Cup 2026** campaign with three deliberate moods, not three unrelated skins.

**Why this priority**: Cohesion sells the feature; inconsistency would feel like broken assets.

**Independent Test**: Navigate the three pages in sequence; confirm shared theme name, shared overlay vocabulary, and consistent primary button / typography tokens from the base reference.

**Acceptance Scenarios**:

1. **Given** I visit all three page families in one session, **When** I compare backgrounds, **Then** each uses its assigned artwork only (no swapped or duplicated images).
2. **Given** the World Cup 2026 theme, **When** I view primary actions on all three pages, **Then** mint CTA, headline hierarchy, and glass card treatments remain aligned with the established design system (007).

---

### Edge Cases

- Very small viewports (~320px width): backgrounds crop gracefully; focal points keep faces or key subjects from dominating text zones.
- Tall desktop viewports: imagery scales with cover behavior; letterboxing uses theme-aligned fills, not flat gray bars.
- Slow networks: progressive or placeholder gradient until image loads; no layout shift of primary CTAs.
- Reduced transparency / high contrast OS settings: overlays strengthen so text still meets minimum contrast.
- **`prefers-reduced-motion: reduce`**: no hero images on welcome, prediction, or leaderboard—gradient-only shells.
- Non–World Cup contests and Rummy: default neon gradient theme applies on all routes; World Cup hero backgrounds do not leak.
- World Cup contest **history**, **stats**, or **bonus** routes (outside the three page families): default neon gradient only—no hero artwork (per activation rule).
- `/welcome` with no World Cup contest in the current group: default neon gradient only (e.g., Rummy-only group phase).
- `/groups` with an active World Cup contest in the group: default neon gradient only (no welcome artwork on the hub).
- Owner viewing the same member leaderboard route: same standings background as members.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The styling reference MUST define a named theme **World Cup 2026** that includes metadata (display name, description, intended contest context) distinct from the default neon scoreboard theme.
- **FR-002**: The **World Cup 2026** theme MUST declare exactly three page-specific background entries keyed to welcome, prediction, and standings/leaderboard page families, each referencing one stakeholder artwork in fixed order (first → welcome, second → prediction, third → standings).
- **FR-003**: Each background entry MUST specify blend behavior: the **base purple neon gradient remains the dominant layer**; the hero image renders as a **low-opacity texture (~20–30% opacity)** over that gradient (cover fit, focal position, optional vignette). Imagery MUST NOT appear as a full-opacity full-bleed poster behind text; dense content continues to use elevated glass panels for readability.
- **FR-004**: Welcome MUST use the first artwork; prediction MUST use the second; standings/leaderboard MUST use the third—with no cross-assignment on production routes.
- **FR-011**: `/welcome` MUST show the first artwork when the user’s **current group has an active World Cup prediction contest**, determined by a group-level check (contest ID in the URL is not required). If the group has no active World Cup prediction contest, `/welcome` MUST use the default neon gradient without World Cup artwork.
- **FR-012**: `/groups` MUST NOT display World Cup hero artwork; it MUST always use the default neon gradient shell regardless of World Cup contest presence in the group.
- **FR-013**: When the user’s system reports **`prefers-reduced-motion: reduce`**, the three in-scope pages MUST omit World Cup hero images and render the default neon gradient shell only (same as image load failure).
- **FR-005**: Foreground content (headlines, body, buttons, tables, forms) MUST remain readable on all three pages; overlays or panel treatments MUST meet the same minimum text contrast standard established for the app-wide dark theme (WCAG 2.1 AA for text and essential UI labels).
- **FR-006**: Dense pages (prediction and standings) MUST keep main interactive and tabular content on elevated semi-transparent panels per the existing dense-tier pattern; backgrounds MUST NOT replace panel readability requirements.
- **FR-007**: World Cup 2026 hero backgrounds MUST activate **only** on the three in-scope page families when the user is viewing content in a **World Cup prediction contest** context (per feature 006). Rummy contests, non–World Cup contests, and the same route families outside that context MUST use the default neon gradient styling with no World Cup artwork.
- **FR-008**: Image load failure MUST degrade to the default layered gradient background without broken UI or exposed broken-image icons in the primary viewport.
- **FR-009**: The three artwork files MUST be stored in the application’s deployable static assets and referenced from the design reference so environments stay reproducible.
- **FR-010**: Styling changes MUST NOT alter navigation structure, copy, scoring, predictions storage, or permissions—appearance only.

### Key Entities

- **World Cup 2026 theme**: Named variant inside the design reference; groups palette hints, overlay defaults, and three page background definitions.
- **Page background definition**: Describes which artwork applies, blend/overlay parameters, and which page family consumes it (welcome | prediction | standings).
- **Stakeholder artwork (×3)**: Binary image assets supplied for this feature; immutable mapping to page families for v1.
- **Theme context**: Active only when the current page family (welcome, prediction, or standings) is rendered for a **World Cup prediction contest**; Rummy and other contest types always resolve to the default neon theme.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a structured review of the three in-scope page families (welcome, prediction, leaderboard) under World Cup contest context, **100%** display the correct assigned artwork as a **low-opacity texture over the dominant gradient**—**zero** pages showing the wrong image, full-opacity poster treatment, or missing background treatment.
- **SC-002**: On a **390px-wide** viewport, **100%** of tested primary text blocks (welcome headline, prediction labels, leaderboard column headers and top 10 rows) meet the project’s agreed minimum contrast bar for the dark theme.
- **SC-003**: **95%** of test participants (or internal QA reviewers) can read leaderboard rank and points without squinting when standing at arm’s length from a phone—qualitative readability pass on the third page.
- **SC-004**: Navigating welcome → prediction → leaderboard in one session completes with **no horizontal scroll** introduced by background imagery on the main content column (tables may scroll internally as today).
- **SC-005**: With network throttling simulating slow image load, all three pages reach usable, readable state within **3 seconds** via gradient fallback, without cumulative layout shift of primary CTAs exceeding comfortable thresholds (no displaced main buttons after load).

## Assumptions

- Feature 007 (app-wide design system) is implemented or in progress; this feature **extends** `.cursor/design.json` and page shell consumption rather than replacing 007.
- “Prediction” maps to the existing contest matches / pick submission experience; “standings/leaderboard” maps to the contest leaderboard route used for World Cup scoring.
- World Cup 2026 theme activation applies **only** on welcome, prediction, and leaderboard page families when the route is scoped to a World Cup prediction contest (feature 006); it does not apply app-wide or to Rummy contests.
- `/welcome` resolves World Cup theme via **group-level** eligibility (active World Cup prediction contest in the current group), not via contest ID in the URL.
- Stakeholder-provided images are approved for in-app use; no additional likeness rights work is in scope.
- Default blend strategy: **gradient-dominant** stack—the base purple neon gradient is always visible; hero images render at **~20–30% opacity** as full-viewport cover textures; optional vignette for polish. Primary text readability relies on existing typography contrast on the gradient plus glass panels on dense pages (not on heavy full-bleed photo overlays).
- Parallax or animation on backgrounds is disabled by default. **`prefers-reduced-motion: reduce`** suppresses hero images entirely (gradient-only), not merely motion effects.
- Only the three listed page families receive unique photography/illustration; other routes keep gradient-only shells.

## Dependencies

- Existing `.cursor/design.json` structure and token mapping (007).
- World Cup contest routes and page shells for welcome, matches/prediction, and leaderboard (006).
- Three stakeholder image files provided at specification time (dual expressive portrait, stadium walk, pop-art portrait).
