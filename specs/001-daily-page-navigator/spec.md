# Feature Specification: Daily Page Navigator & Sidebar Reorganization

**Feature Branch**: `001-daily-page-navigator`
**Created**: 2025-12-09
**Status**: Draft
**Input**: User description: "add daily page's navigator... update daily and week link ui... structure changed to this This Week - Dec 3 - Dec 9 Archive - 2025-10-23..."

## User Scenarios & Testing

### User Story 1 - Current Week Navigation (Priority: P1)

As a user, I want to see "This Week" and its daily reports at the top of the sidebar so that I can quickly access the most recent information.

**Why this priority**: Core requirement for navigation.

**Independent Test**: Render the sidebar and verify "This Week" is at the top, followed by the individual days of the current week.

**Acceptance Scenarios**:

1. **Given** the sidebar is rendered
   **When** I look at the navigation menu
   **Then** "This Week" is the first item.
   **And** links for the current week's days (e.g., "Dec 9", "Dec 8") appear immediately below it.

### User Story 2 - Archive Navigation (Priority: P2)

As a user, I want to access older daily reports in a separate "Archive" section so that I can find historical data without cluttering the main view.

**Why this priority**: Organizes historical content effectively.

**Independent Test**: Verify an "Archive" section exists below the current week's list containing older dates.

**Acceptance Scenarios**:

1. **Given** there are daily reports older than the current week
   **When** I look below the current week section
   **Then** I see a section header labeled "Archive".
   **And** below it, I see a list of links for older dates.

## Requirements

### Functional Requirements

- **FR-001**: The sidebar MUST be structured in this order:
  1. "This Week" link
  2. List of days in the current week (descending order)
  3. "Archive" section header
  4. List of older days (descending order)
- **FR-002**: The system MUST scan the `updates/` directory dynamically to identify available dates. It MUST NOT rely on a `manifest.json` file.
- **FR-003**: The list MUST only include days where the target `updates/[YYYY-MM-DD]/index.html` file explicitly exists on the filesystem.
- **FR-004**: Current week days MUST be formatted as "MMM D" (e.g., "Dec 9").
- **FR-005**: Archive days MUST be formatted as "YYYY-MM-DD" (e.g., "2025-10-23") to distinguish them from recent days.
- **FR-006**: All links MUST point to `updates/[YYYY-MM-DD]/index.html`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Sidebar hierarchy matches: This Week -> Current Days -> Archive -> Old Days.
- **SC-002**: All valid `updates/*/index.html` paths are represented in the sidebar.
- **SC-003**: No broken links (404s) are generated.

## Assumptions

- "Current Week" is the 7-day window ending on the latest available date found in the filesystem.
- The styling should match the existing "This Week" navigation item.
