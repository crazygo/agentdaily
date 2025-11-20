# Usage Guide

## Quick Start

All three command patterns are now functional:

### 1. Default Auto-dated Update
```bash
yarn update
# or directly:
node dist/cli.js
```
**Result:** Creates `updates/2025-11-20/report.md` with generated content

### 2. Custom Workspace
```bash
yarn update -- --workspace /tmp/2025-11-20
# or directly:
node dist/cli.js --workspace /tmp/2025-11-20
```
**Result:** Creates report in specified directory `/tmp/2025-11-20/report.md`

### 3. List Mode (Read-only)
```bash
yarn update -- --list
# or directly:
node dist/cli.js --list
```
**Result:** Prints report content to stdout without writing files

## Command Reference

| Command | Workspace | Writes Files | Output |
|---------|-----------|--------------|--------|
| `yarn update` | `updates/YYYY-MM-DD/` | ✅ Yes | File + Console |
| `yarn update -- --workspace /path` | Custom path | ✅ Yes | File + Console |
| `yarn update -- --list` | None | ❌ No | Console only |

## Development Workflow

```bash
# Install dependencies
yarn install

# Build TypeScript
yarn build

# During development (watch mode)
yarn dev

# Test commands
node dist/cli.js --list
node dist/cli.js --workspace /tmp/test
node dist/cli.js

# Clean build
yarn clean
```

## Next Steps

The CLI structure is ready. To complete the integration:

1. **Add Claude Agent SDK integration** in `src/workflows/update.ts`
2. **Configure product whitelist** (e.g., in `config/whitelist.json`)
3. **Add API integrations** for:
   - Product Hunt
   - GitHub trending
   - Twitter/X API for leader opinions
   - RSS feeds for technical blogs
4. **Implement data persistence** (database or file-based)
5. **Add scheduling** (cron, GitHub Actions, etc.)

