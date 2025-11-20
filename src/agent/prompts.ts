import { WhitelistConfig } from '../types';

export function getSystemPrompt(): string {
  return `You are an expert research agent specializing in the agentic coding and AI-assisted development space. Your role is to:

1. Discover new and innovative products in the agentic coding area
2. Track updates and news about established products
3. Monitor technical discussions and opinions from thought leaders

You have access to web search, GitHub search, and webpage fetching tools. Use these tools to gather comprehensive, accurate, and up-to-date information.

When researching:
- Focus on quality over quantity
- Prioritize recent developments (last 7-30 days)
- Verify information from multiple sources when possible
- Be specific and include relevant URLs
- Categorize findings appropriately

Output your findings in a structured JSON format.`;
}

export function getNewProductsPrompt(config: WhitelistConfig): string {
  const date = new Date().toISOString().split('T')[0];

  return `Research and identify NEW products in the agentic coding space that were launched or gained attention recently.

Focus areas:
- AI coding assistants and IDEs
- Code generation tools
- Autonomous coding agents
- Developer tools leveraging LLMs

Search for:
1. Product Hunt launches with tags: ${config.sources.productHunt.tags.join(', ')}
2. GitHub trending repositories with topics: ${config.sources.github.topics.join(', ')}
3. Recent news and announcements about new agentic coding tools
4. Hacker News discussions about: ${config.sources.hackernews.keywords.join(', ')}

For each product found, provide:
- Title (product name)
- Description (what it does, key features)
- URL (official website or GitHub)
- Source (where you found it)
- Category (IDE, CLI, Extension, Agent, etc.)

Return a JSON array of discoveries. Example format:
[
  {
    "title": "Product Name",
    "description": "Brief description of what it does",
    "url": "https://...",
    "source": "Product Hunt",
    "category": "IDE Extension"
  }
]

Today's date: ${date}
Search for products from the last 30 days.`;
}

export function getWhitelistUpdatesPrompt(config: WhitelistConfig): string {
  const date = new Date().toISOString().split('T')[0];
  const productList = config.products.map(p => `- ${p.name} (${p.url})`).join('\n');

  return `Research recent updates, releases, and news for the following whitelisted products:

${productList}

For each product:
1. Check their official website/blog for announcements
2. Check GitHub releases if they have a repo
3. Search for recent news or discussions about the product
4. Look for version releases, new features, major updates

For each update found, provide:
- productName (exact name from whitelist)
- title (update headline)
- description (what changed or was announced)
- updateType (feature, bugfix, announcement, or release)
- url (link to announcement/release)
- date (when it was announced, if available)

Return a JSON array of updates. Example format:
[
  {
    "productName": "Claude Code",
    "title": "New multi-file editing feature",
    "description": "Added support for editing multiple files simultaneously",
    "updateType": "feature",
    "url": "https://...",
    "date": "2025-11-15"
  }
]

Today's date: ${date}
Focus on updates from the last 7-14 days.`;
}

export function getInsightsPrompt(config: WhitelistConfig): string {
  const date = new Date().toISOString().split('T')[0];
  const leaders = config.leaders.map(l => {
    const handles = [];
    if (l.twitter) handles.push(`@${l.twitter}`);
    if (l.blog) handles.push(l.blog);
    return `- ${l.name} (${handles.join(', ')}) - Topics: ${l.topics.join(', ')}`;
  }).join('\n');

  return `Research technical insights, opinions, and discussions from thought leaders in the AI coding space.

Focus on these leaders:
${leaders}

Search for:
1. Recent blog posts about agentic coding, LLMs, or developer tools
2. Twitter/X threads discussing AI coding trends
3. Technical discussions on Hacker News or Reddit
4. YouTube videos or podcasts about the future of coding with AI
5. Academic or research papers on code generation

For each insight found, provide:
- title (headline or topic)
- description (summary of the key points)
- author (who wrote/said it)
- source (platform: Blog, Twitter, HN, YouTube, etc.)
- url (link to the content)
- topics (relevant tags)
- type (technical, opinion, tutorial, or discussion)

Return a JSON array of insights. Example format:
[
  {
    "title": "The Future of Agentic Code Editors",
    "description": "Discussion on how AI agents will change the IDE landscape",
    "author": "Simon Willison",
    "source": "Blog",
    "url": "https://...",
    "topics": ["AI", "IDEs", "Future of Coding"],
    "type": "opinion"
  }
]

Today's date: ${date}
Focus on content from the last 7-14 days.`;
}
