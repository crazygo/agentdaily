const fs = require('fs');
const path = require('path');

// Helper function to read JSON files
function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e.message);
    return null;
  }
}

// Helper function to format date (e.g., "Mar 14")
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Helper function to get source name from URL
function getSourceName(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    if (hostname.includes('github')) return 'GitHub';
    if (hostname.includes('techcrunch')) return 'TechCrunch';
    if (hostname.includes('blog.jetbrains')) return 'JetBrains Blog';
    if (hostname.includes('x.com') || hostname.includes('twitter')) return 'Twitter';
    if (hostname.includes('simonwillison')) return "Simon Willison's Blog";
    if (hostname.includes('openai')) return 'OpenAI';
    if (hostname.includes('anthropic')) return 'Anthropic';
    if (hostname.includes('cursor')) return 'Cursor';
    if (hostname.includes('windsurf')) return 'Windsurf';
    if (hostname.includes('devin')) return 'Devin';
    if (hostname.includes('geminicli')) return 'Gemini CLI';
    if (hostname.includes('superset')) return 'Superset';
    if (hostname.includes('terminaluse')) return 'Terminal Use';
    if (hostname.includes('producthunt')) return 'Product Hunt';
    if (hostname.includes('hackernews')) return 'Hacker News';
    // Capitalize first letters
    return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
  } catch (e) {
    return 'Source';
  }
}

// Categorization function based on content analysis
function categorizeItem(item, itemType) {
  const title = (item.name || item.title || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const content = `${title} ${desc}`;

  // New Products - complete new tools, apps, or agents
  if (itemType === 'new-product') {
    return 'New Products';
  }

  // New Features - updates to existing tools
  if (itemType === 'whitelist-update') {
    // Check if it's a major version release or new feature
    if (content.includes('version') || content.includes('v0.') || content.includes('v1.') || content.includes('v2.') || content.includes('launch') || content.includes('introduced')) {
      return 'New Features';
    }
    return 'New Features';
  }

  // New Technologies - papers, underlying models, frameworks, research
  if (itemType === 'insight') {
    // Check if it's technical/research focused
    if (content.includes('paper') || content.includes('research') || content.includes('model') || content.includes('framework') || content.includes('paradigm') || content.includes('architecture')) {
      return 'New Technologies';
    }
    // Insights about industry trends or commentary
    if (content.includes('phase change') || content.includes('paradigm shift') || content.includes('future') || content.includes('end of')) {
      return 'New Technologies';
    }
  }

  // Default to Others for news, commentary, miscellaneous
  return 'Others';
}

// Main aggregation function
function aggregateWeekData() {
  const startDate = '2026-05-30';
  const endDate = '2026-06-05';

  const items = {
    'New Products': [],
    'New Features': [],
    'New Technologies': [],
    'Others': []
  };

  // Track seen URLs to deduplicate
  const seenUrls = new Set();
  const seenTitles = new Set();

  // Process each day in the range
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dateFolder = path.join(__dirname, dateStr);

    if (!fs.existsSync(dateFolder)) continue;

    // Read new-product.json
    const productFile = path.join(dateFolder, 'new-product.json');
    if (fs.existsSync(productFile)) {
      const products = readJSON(productFile);
      if (Array.isArray(products)) {
        products.forEach(p => {
          const key = p.url || p.name;
          if (key && !seenUrls.has(key)) {
            seenUrls.add(key);
            items['New Products'].push({
              title: p.name,
              description: p.description,
              url: p.url,
              date: formatDate(dateStr),
              source: p.sources ? p.sources[0] : getSourceName(p.url),
              folderDate: dateStr
            });
          }
        });
      }
    }

    // Read whitelist-updates.json
    const updatesFile = path.join(dateFolder, 'whitelist-updates.json');
    if (fs.existsSync(updatesFile)) {
      const updates = readJSON(updatesFile);
      if (Array.isArray(updates)) {
        updates.forEach(u => {
          const key = u.url || u.title;
          if (key && !seenUrls.has(key)) {
            seenUrls.add(key);
            items['New Features'].push({
              title: u.title || u.productName,
              description: u.description,
              url: u.url,
              date: formatDate(dateStr),
              source: getSourceName(u.url),
              folderDate: dateStr
            });
          }
        });
      }
    }

    // Read insights.json
    const insightsFile = path.join(dateFolder, 'insights.json');
    if (fs.existsSync(insightsFile)) {
      const insights = readJSON(insightsFile);
      if (Array.isArray(insights)) {
        insights.forEach(i => {
          const key = i.url || i.title;
          if (key && !seenUrls.has(key)) {
            seenUrls.add(key);
            const category = categorizeItem(i, 'insight');
            items[category].push({
              title: i.title,
              description: i.description,
              url: i.url,
              date: formatDate(i.published_date || dateStr),
              source: i.source || getSourceName(i.url),
              folderDate: dateStr
            });
          }
        });
      }
    }
  }

  // Sort items within each category by date (newest first)
  Object.keys(items).forEach(category => {
    items[category].sort((a, b) => new Date(b.folderDate) - new Date(a.folderDate));
  });

  return items;
}

// Generate the content HTML
function generateContentHTML(items) {
  const categories = ['New Products', 'New Features', 'New Technologies', 'Others'];

  let html = `<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">May 30 - Jun 5</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">May 30 - Jun 5, 2026</div>
        </div>
    </nav>
</aside>

<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">May 30, 2026 – June 5, 2026</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>
`;

  categories.forEach(category => {
    const categoryItems = items[category];
    if (categoryItems.length === 0) return;

    // Determine grid rows class
    const itemCount = categoryItems.length;
    let gridRowsClass = 'grid-rows-1';
    if (itemCount >= 4 && itemCount <= 8) {
      gridRowsClass = 'grid-rows-2';
    } else if (itemCount >= 9) {
      gridRowsClass = 'grid-rows-3';
    }

    html += `    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">${category}</h2>
        <div class="grid grid-flow-col auto-cols-[320px] ${gridRowsClass} gap-5 overflow-x-auto pb-4 hide-scrollbar">
`;

    categoryItems.forEach(item => {
      html += `            <a href="${item.url}" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
                <div>
                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">${item.title}</h3>
                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">${item.description}</p>
                </div>
                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
                    <span class="font-medium">${item.date}</span>
                    <span>${item.source}</span>
                </div>
            </a>
`;
    });

    html += `        </div>
    </section>
`;
  });

  html += `</main>`;

  return html;
}

// Main execution
console.log('Aggregating data from the last 7 days...');
const items = aggregateWeekData();

console.log('\nCategory counts:');
Object.keys(items).forEach(category => {
  console.log(`  ${category}: ${items[category].length} items`);
});

console.log('\nGenerating content.html...');
const html = generateContentHTML(items);

const outputPath = path.join(__dirname, 'content.html');
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`✓ Generated ${outputPath}`);

console.log('\nTo create the final index.html, run: node templates/merge.js');
