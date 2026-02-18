## Background Agents in Slack

You can now launch Background Agents directly from Slack by mentioning __@Cursor__. Agents can read the thread, understand what's going on, and create PRs in GitHub, all without leaving the conversation.

### Use Cursor where your team works

Mention __@Cursor__ in any thread with a prompt like:

Agents run remotely in a secure environment and you'll get updates directly in Slack, including links to Cursor and GitHub, when the work is done.

### Agents understand context

Cursor reads the entire Slack thread before starting, so Background Agents understand the full context when you reference previous discussions or issues.

You can also ask Cursor to investigate issues and get answers:

### Getting started

To use Background Agents in Slack, an admin needs to set up the integration first. Check out our setup documentation or ask your workspace admin to connect Cursor from the Dashboard → Integrations page.

Once connected, try it in any channel with __@Cursor__ and write a prompt. Use the command `help` to see all commands, or `settings` to configure your default model, repo, and branch.

Improvements (1)

- Search in settings with `Cmd/Ctrl+F`

MCP (3)

- Progress notifications from servers
- Dynamic tool registration
- Roots supports

Patches (3)

__1.1.1__

- Fixed workspaces indexing issue

__1.1.2__

- Improved client side performance

__1.1.3__

- Fixed MCP performance regression
- Added PR search and indexing
- Improved deeplink experience
- Added option to change upstream marketplace provider

__1.1.4__

- Improved Background Agent reliability
- Fixed search in Chat UI bug

## BugBot, Background Agent access to everyone, and one-click MCP install

Cursor 1.0 is here!

This release brings BugBot for code review, a first look at memories, one-click MCP setup, Jupyter support, and general availability of Background Agent.

### Automatic code review with BugBot

BugBot automatically reviews your PRs and catches potential bugs and issues.

When an issue is found, BugBot leaves a comment on your PRs in GitHub. You can click "___Fix in Cursor___" to move back to the editor with a pre-filled prompt to fix the issue.

To set it up, follow instructions in our BugBot docs.

### Background Agent for everyone

Since we released Background Agent, our remote coding agent, in early access a few weeks ago, early signals have been positive.

We're now excited to expand Background Agent to all users! You can start using it right away by clicking the cloud icon in chat or hitting `Cmd/Ctrl+E` if you have privacy mode disabled. For users with privacy mode enabled, we'll soon have a way to enable it for you too!

### Agent in Jupyter Notebooks

Cursor can now implement changes in Jupyter Notebooks!

Agent will now create and edit multiple cells directly inside of Jupyter, a significant improvement for research and data science tasks. Only supported with Sonnet models to start.

### Memories

With Memories, Cursor can remember facts from conversations and reference them in the future. Memories are stored per project on an individual level, and can be managed from Settings.

We're rolling out Memories as a beta feature. To get started, enable from Settings → Rules.

### MCP one-click install and OAuth support

You can now set up MCP servers in Cursor with one click, and together with OAuth support, you can easily authenticate servers that support it.

We've curated a short list of official MCP servers you can add to Cursor at docs.cursor.com/tools.

If you're an MCP developer, you can easily make your server available to developers by adding a _Add to Cursor_ button in your documentation and READMEs. Generate one at docs.cursor.com/deeplinks.

### Richer Chat responses

Cursor can now render visualizations inside of a conversation. In particular, Mermaid diagrams and Markdown tables can now be generated and viewed in the same place!

### New Settings and Dashboard

The setting and dashboard page have gotten some polish with this release.

With the new Dashboard, you can view your individual or team's usage analytics, update your display name, and view detailed statistics broken down by tool or model.

Keyboard (1)

- Open Background Agent control panel with `Cmd/Ctrl+E`

Improvements (4)

- `@Link` and web search can now parse PDFs and include in context
- Network diagnostics in settings to verify connectivity
- Faster responses with parallel tool calls
- Collapsable tool calls in Chat

Account (3)

- Enterprise users can only access stable release (no pre-release)
- Team admins can now disable Privacy Mode
- Admin API for teams to access usage metrics and spend data

Models (1)

- Max mode is now available for Gemini 2.5 Flash

Patches (1)

__1.0.1__

- Fixes and improvements to Background Agent

## Simplified Pricing, Background Agent and Refreshed Inline Edit

Introducing unified request-based pricing, Max Mode for all top models, and Background Agent for parallel task execution. Plus, improved context management with `@folders` support, refreshed Inline Edit with new options, faster file edits, multi-root workspace support, and enhanced chat features including export and duplication.

### Simpler, unified pricing

We've heard your feedback and are rolling out a unified pricing model to make it less confusing. Here's how it works:

- All model usage is now unified into request-based pricing
- Max mode now uses token-based pricing (similar to how models API pricing works)
- Premium tool calls and long context mode are removed to keep it simple

Quotas on plans Hobby, Pro and Business has not changed and slow requests are still included in the plans. All usage can be found in your dashboard to help you track and manage your spend.

### Max Mode for all top models

Max Mode is now available for all state-of-the-art models in Cursor, with a simpler token-based pricing model. It's designed to give you full control when you need it most. You can enable it from the model picker to see which models support it. When new models roll out, Max Mode will be how we deliver their full capabilities from day one.

It's ideal for your hardest problems when you need more context, intelligence and tool use. For everything else, normal mode is still recommended with the same capabilities you're used to.

The pricing is straightforward: you're charged based on token usage. If you've used any CLI-based coding tool, Max mode will feel like that - but right in Cursor.

> Note: If you're using an older version of Cursor, you'll still have access to the previous MAX versions and long context mode for a few weeks. However, these features will be sunset soon, so we recommend updating to continue using these capabilities.

Read more about Max Mode in our documentation

### New Tab model

We've trained a new Tab model that now can suggest changes across multiple files. The model excels particularly at refactors, edit chains, multi file changes, and jumping between related code. You'll also notice it feels more natural and snappier in day-to-day use.

With this we've also added syntax highlighting to the completion suggestions.

### Background Agent Preview

In early preview, rolling out gradually: Cursor agents can now run in the background! To try it, head to Settings > Beta > Background Agent.

This allows you to run many agents in parallel and have them tackle bigger tasks. The agents run in their own remote environments. At any point, you can view the status, send a follow-up, or take over.

We're curious to hear what you think. While it is still early, we've found background agents useful internally for fixing nits, doing investigations, and writing first drafts of medium-sized PRs. Read more at docs.cursor.com/background-agent.

### Include your entire codebase in context

You can now use `@folders` to add your entire codebase into context, just make sure to enable `Full folder contents` from settings. If a folder (or file) is too large to be included, you'll see a small icon on the context pill indicating this.

### Refreshed Inline Edit (Cmd/Ctrl+K) with Agent integration

Inline Edit (Cmd/Ctrl+K) has gotten a UI refresh and new options for full file edits (⌘⇧⏎) and sending to agent (⌘L)

Full file makes it easy to do scope changes to a file without using agent. However, you might come across cases where you're working with a piece of code you want to make multi-file edits to or simply just want more control you can get from agent. This is when you want to send selected codeblock to agent and keep on editing from there.

### Fast edits for long files with Agent

We've added a new tool to the agent that will search & replace code in files, making it much more efficient for long files. Instead of reading the complete file, Agent can now find the exact place where edits should occur and change only that part. Here's an example editing a file in Postgres codebase where using search & replace tool is nearly double as fast. We're rolling this out to Anthropic models first and will expand to other models soon.

### Work in multiple codebases with workspaces

Now you can create multi-root workspaces to make multiple codebases available to Cursor. All of them will be indexed and available to Cursor, ideal when you have projects in different folders you want to work on in the same space.

`.cursor/rules` are supported in all folders added

### Working with Chat

#### Exporting Chat

You can now export chats to markdown from the chat view. Text and code blocks are included in the final export.

#### Duplicate Chats

Exploring different paths from a conversation while preserving the existing is now possible with chat duplication. Go to a message and start a new chat from the three dots menu.

Keybindings (1)

- Full file edits from Inline Edit: `Cmd/Ctrl+Shift+K`

Improvements (11)

- Agent now uses native terminal emulation instead of simulated terminals
- `@folders` will now try to include all files that fit in context
- Icons for context state in Chat to tell you if files were not included or condensed
- Individual MCP tools can now be disabled from MCP settings
- New C# extension available in marketplace
- Chat font size can now be increased in settings
- Detailed in-app changelog

__MCP__

- Run stdio from remote workspace (WSL, Remote SSH)
- Streamable HTTP support
- Fixed leaking SSE server connections
- More reliable refreshing when changing config

Account (1)

- Removed 10 free requests/day for Claude 3 Opus

Patches (7)

__0.50.1__

- Background Agent availability

__0.50.2__

- Fixed keyboard navigation in Jupyter notebooks
- Fixed Custom mode models MAX and selection issues
- Improved indexing reliability for single-root workspaces
- Fixed VPN reliability with ZScaler

__0.50.3__

- Performance improvements

__0.50.4__

- Improved apply reliability
- Fixed Windows horizontal scrolling bug
- MCP improvements
- Improved multiroot workspace support

__0.50.5__

- Fixed chat pill not updating when switching files

__0.50.6__

- Fixed search & replace reliability issues
- Fixed checkpoint reliability issues
- Improved indexing
- Improved Python extension

__0.50.7__

- Fixed search & replace bug for Windows
