---
description: "Task list for Daily Page Navigator & Sidebar Reorganization"
---

# Tasks: Daily Page Navigator & Sidebar Reorganization

**Input**: Design documents from `/specs/001-daily-page-navigator/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: Which user story this task belongs to (US1, US2)

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure changes required for both user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 [P] [Shared] Implement date scanning logic in `src/workflows/update.ts`
  - *Goal*: Scan `updates/` for `YYYY-MM-DD` folders containing `index.html`.
  - *Constraint*: Strictly filesystem-based verification.
- [ ] T002 [Shared] Update `generateIndexPage` in `src/workflows/update.ts` to inject valid date list
  - *Goal*: Format valid dates as a markdown list string.
  - *Goal*: Inject this string into `prompts/index-page-prompt.md` using a new placeholder `{INSERT_VALID_DATES}`.

**Checkpoint**: Backend logic is ready to provide trusted data to the prompt.

---

## Phase 2: User Story 1 - Current Week Navigation (Priority: P1) 🎯 MVP

**Goal**: "This Week" and daily links appear at the top of the sidebar.

**Independent Test**: Run `yarn index`, verify sidebar starts with "This Week" followed by current week's days.

### Implementation for User Story 1

- [ ] T003 [US1] Update `prompts/index-page-prompt.md` with instructions for "This Week"
  - *Goal*: Instruct LLM to identify the last 7 days from `{INSERT_VALID_DATES}`.
  - *Goal*: Define HTML structure for "This Week" and daily links (format: MMM D).
  - *Goal*: Enforce link target `updates/[YYYY-MM-DD]/index.html`.

**Checkpoint**: At this point, the index page should show the correct "This Week" structure.

---

## Phase 3: User Story 2 - Archive Navigation (Priority: P2)

**Goal**: "Archive" section appears below current week with older dates.

**Independent Test**: Run `yarn index`, verify "Archive" section exists with older dates formatted as YYYY-MM-DD.

### Implementation for User Story 2

- [ ] T004 [US2] Update `prompts/index-page-prompt.md` with instructions for "Archive"
  - *Goal*: Instruct LLM to identify dates older than the current week from `{INSERT_VALID_DATES}`.
  - *Goal*: Define HTML structure for "Archive" header and links (format: YYYY-MM-DD).
  - *Goal*: Sort descending (newest first).

**Checkpoint**: "Archive" section is populated correctly.

---

## Phase 4: Polish & Verification

**Purpose**: Final verification of the feature.

- [ ] T005 Run `yarn index` to regenerate the page
- [ ] T006 Verify sidebar hierarchy (This Week -> Days -> Archive)
- [ ] T007 Verify all links work (no 404s)

---

## Implementation Strategy

1. **Foundational**: Implement the strict filesystem scanning in TypeScript. This ensures NO hallucinated dates reach the prompt.
2. **User Story 1**: Update the prompt to handle the "This Week" logic using the injected data.
3. **User Story 2**: Update the prompt to handle the "Archive" logic using the same injected data.
4. **Verify**: Run the generator and check the output.