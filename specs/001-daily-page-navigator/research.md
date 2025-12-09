# Research: Daily Page Navigator & Sidebar Reorganization (Simplified)

## Technical Analysis

### Existing Architecture

- **Workflow**: `src/workflows/update.ts` executes the update process.
- **Agent**: `ClaudeAgent` generates `updates/content.html` using `prompts/index-page-prompt.md`.
- **Constraint**: User wants to avoid complex TypeScript logic/contracts but strictly prevent broken links (hallucinations).

### Revised Implementation Strategy

1.  **Minimal Data Injection**:
    - Instead of building a complex navigation tree in TypeScript, we will simply **scan valid dates** in `src/workflows/update.ts`.
    - We will inject a raw **List of Valid Dates** into the prompt.
    - This ensures the AI has the *exact* "Truth" of what exists on the filesystem, satisfying the "no hallucination" rule.

2.  **AI-Driven Logic (Prompt Engineering)**:
    - The heavy lifting moves to `prompts/index-page-prompt.md`.
    - **Instructions**: "Here is the list of valid dates: {INSERT_VALID_DATES}. You MUST use this list to generate the sidebar."
    - **Logic**: "Determine the current week (latest 7 days) and the Archive (older days) from this list."
    - **Rendering**: The AI generates the `<aside>` HTML structure (This Week -> Days -> Archive) as part of the content fragment.

### Decisions

- **Decision**: Inject a flat list of verified dates into the prompt.
  - **Rationale**: Balances "AI does the work" with "Strict verification". The AI handles the presentation logic (sorting, grouping, HTML generation), while the code guarantees the data validity.
- **Decision**: Remove formal JSON contracts.
  - **Rationale**: Over-engineered for a simple string injection.

### Unknowns & Clarifications

- **Resolved**: Link target is `updates/[YYYY-MM-DD]/index.html`.
- **Resolved**: "Current Week" logic will be handled by the AI based on the injected date list.