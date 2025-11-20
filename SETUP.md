# Setup Guide

## Prerequisites

- Node.js >= 18.0.0
- Yarn package manager
- Anthropic API key (Claude)

## Installation

1. **Clone/navigate to the project:**
   ```bash
   cd agentcodedaily
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` and add your API key:**
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   ```

5. **Build the project:**
   ```bash
   yarn build
   ```

## Configuration

### Whitelist Configuration

Edit `config/whitelist.json` to customize:

- **Products to track**: Add/remove products in the `products` array
- **Leaders to follow**: Add/remove thought leaders in the `leaders` array
- **Data sources**: Enable/disable sources in the `sources` object

Example:
```json
{
  "products": [
    {
      "name": "Your Product",
      "category": "IDE",
      "url": "https://...",
      "description": "..."
    }
  ],
  "leaders": [
    {
      "name": "Leader Name",
      "twitter": "handle",
      "topics": ["AI", "Coding"]
    }
  ]
}
```

## Usage

### 1. Default Auto-dated Update
```bash
yarn update
```
- Creates `updates/YYYY-MM-DD/` directory
- Runs Claude Agent SDK research workflow
- Writes `report.md` and `data.json` to workspace

### 2. Custom Workspace
```bash
yarn update -- --workspace /path/to/workspace
```
- Uses specified directory as workspace
- Useful for testing or custom organization

### 3. List Mode (Read-only)
```bash
yarn update -- --list
```
- Runs research without writing files
- Displays results to console only
- Perfect for previewing or CI/CD validation

## How It Works

### Research Workflow

The agent performs three parallel research tasks:

1. **New Product Discovery**
   - Searches Product Hunt, GitHub, Hacker News
   - Filters for agentic coding tools
   - Returns structured product information

2. **Whitelist Product Updates**
   - Checks official websites/blogs for announcements
   - Monitors GitHub releases
   - Tracks version updates and new features

3. **Technical Insights**
   - Follows thought leaders' blogs and social media
   - Monitors technical discussions
   - Captures opinions and trends

### Agent Capabilities

The Claude Agent has access to:
- **Web Search**: DuckDuckGo search (no API key required)
- **GitHub Search**: Repository discovery
- **Page Fetching**: Extract content from URLs

### Output Formats

- **Markdown** (`report.md`): Human-readable daily report
- **JSON** (`data.json`): Structured data for programmatic access
- **Console**: Formatted terminal output for list mode

## Troubleshooting

### API Key Issues
```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Check .env file
cat .env
```

### Build Errors
```bash
# Clean and rebuild
yarn clean
yarn build
```

### Rate Limiting
- The agent makes multiple API calls during research
- Consider adding delays between runs
- Claude API has generous rate limits

### Web Search Issues
- DuckDuckGo HTML search doesn't require API keys
- For production, consider Google Custom Search API
- Some sites may block automated requests

## Development

### Watch Mode
```bash
yarn dev
```
Automatically recompiles TypeScript on file changes.

### Project Structure
```
src/
├── agent/
│   ├── ClaudeAgent.ts      # Agent with tool use
│   └── prompts.ts          # Research prompts
├── tools/
│   └── webSearch.ts        # Web search capabilities
├── workflows/
│   ├── research.ts         # Shared research logic
│   ├── update.ts           # Write mode workflow
│   └── list.ts             # Read-only workflow
├── utils/
│   ├── workspace.ts        # Workspace management
│   └── formatter.ts        # Output formatting
└── types/
    └── index.ts            # TypeScript interfaces
```

### Adding New Features

**Custom Tool:**
1. Add tool definition in `ClaudeAgent.ts` → `getTools()`
2. Implement tool logic in `executeTool()`
3. Update prompts to use the new tool

**New Data Source:**
1. Add search function in `src/tools/`
2. Define tool in agent
3. Update prompts to include source

**Custom Output Format:**
1. Add formatter in `src/utils/formatter.ts`
2. Update workflows to use new formatter

## Next Steps

1. **Test the workflow** with your API key
2. **Customize whitelist** for your interests
3. **Schedule daily runs** (cron, GitHub Actions)
4. **Build web interface** for browsing reports
5. **Add notifications** (email, Slack)

## License

MIT
