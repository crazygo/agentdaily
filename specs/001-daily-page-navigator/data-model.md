# Data Model: Valid Dates List

## Injected Context

We will inject a simple Markdown list of verified dates into the prompt variable `INSERT_VALID_DATES`.

**Format**:

```markdown
- 2025-12-09
- 2025-12-08
- 2025-12-01
- 2025-10-23
...
```

## Source of Truth

- **Workflow**: `src/workflows/update.ts`
- **Method**: `fs.readdir` on `updates/` + check for `index.html` existence.