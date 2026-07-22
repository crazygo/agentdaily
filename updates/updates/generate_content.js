const fs = require('fs');
const path = require('path');

// Configuration
const UPDATES_DIR = path.join(__dirname);
const OUTPUT_FILE = path.join(__dirname, 'content.html');
const LATEST_DATE = '2026-07-22';

// Calculate 7-day window
const latestDate = new Date(LATEST_DATE);
const startDate = new Date(latestDate);
startDate.setDate(startDate.getDate() - 6);

// Format dates as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const dateRange = [];
for (let i = 0; i < 7; i++) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + i);
  dateRange.push(formatDate(d));
}

console.log('Processing date range:', dateRange);

// Category mapping
const CATEGORIES = {
  NEW_PRODUCTS: 'New Products',
  NEW_FEATURES: 'New Features',
  NEW_TECHNOLOGIES: 'New Technologies',
  OTHERS: 'Others'
};

// Initialize data structure
const allItems = [];
const urlMap = new Map();
const titleMap = new Map();

// Function to extract fields from various JSON structures
function extractFields(item) {
  // Try different field names
  const title = item.title || item.name || item.headline || item.subject || '';
  const description = item.description || item.summary || item.content || item.text || item.body || item.snippet || '';
  const url = item.url || item.href || item.link || item.source_url || item.web_url || '';

  // Try to get date from item or folder
  let date = item.date || item.published_date || item.pub_date || item.created_at || '';
  if (!date && item.folder_date) {
    date = item.folder_date;
  }

  // Try to get source
  const source = item.source || item.site || item.publication || item.domain || item.author || 'Unknown';

  return { title, description, url, date, source };
}

// Function to categorize item based on content
function categorizeItem(title, description) {
  const content = `${title} ${description}`.toLowerCase();

  // New Products - complete new tools, apps, or agents
  if ((content.includes('launch') || content.includes('release') || content.includes('new tool') ||
       content.includes('new app') || content.includes('introducing') || content.includes('announces')) &&
      (content.includes('ai') || content.includes('agent') || content.includes('chatgpt') ||
       content.includes('copilot') || content.includes('assistant'))) {
    return CATEGORIES.NEW_PRODUCTS;
  }

  // New Technologies - papers, underlying models, frameworks, research
  if (content.includes('paper') || content.includes('research') || content.includes('model') ||
      content.includes('framework') || content.includes('algorithm') || content.includes('architecture') ||
      content.includes('training') || content.includes('dataset') || content.includes('llm') ||
      content.includes('transformer') || content.includes('neural network') || content.includes('open source')) {
    return CATEGORIES.NEW_TECHNOLOGIES;
  }

  // New Features - updates to existing tools, improvements, v2.0 releases
  if (content.includes('update') || content.includes('upgrade') || content.includes('feature') ||
      content.includes('improve') || content.includes('enhancement') || content.includes('now supports') ||
      content.includes('adds') || content.includes('better') || content.includes('version') ||
      content.includes('v2') || content.includes('v3') || content.includes('beta')) {
    return CATEGORIES.NEW_FEATURES;
  }

  // Default to Others
  return CATEGORIES.OTHERS;
}

// Read all JSON files from the 7-day range
dateRange.forEach(date => {
  const dateDir = path.join(UPDATES_DIR, date);

  if (!fs.existsSync(dateDir)) {
    console.log(`Directory not found: ${date}`);
    return;
  }

  const files = fs.readdirSync(dateDir).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    const filePath = path.join(dateDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      // Handle different JSON structures
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
      } else if (data.articles && Array.isArray(data.articles)) {
        items = data.articles;
      } else if (data.updates && Array.isArray(data.updates)) {
        items = data.updates;
      } else if (data.news && Array.isArray(data.news)) {
        items = data.news;
      } else if (data.products && Array.isArray(data.products)) {
        items = data.products;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
      } else {
        // Single item
        items = [data];
      }

      items.forEach(item => {
        const fields = extractFields({...item, folder_date: date});

        if (!fields.title && !fields.description) {
          return;
        }

        // Deduplication by URL
        if (fields.url && urlMap.has(fields.url)) {
          const existing = urlMap.get(fields.url);
          if (date > existing.date) {
            // Update to newer version
            urlMap.set(fields.url, {...fields, category: categorizeItem(fields.title, fields.description)});
          }
        } else if (fields.url) {
          urlMap.set(fields.url, {...fields, category: categorizeItem(fields.title, fields.description)});
        }

        // Deduplication by title (for items without URL)
        if (!fields.url && fields.title) {
          const titleKey = fields.title.toLowerCase().trim();
          if (titleMap.has(titleKey)) {
            const existing = titleMap.get(titleKey);
            if (date > existing.date) {
              titleMap.set(titleKey, {...fields, category: categorizeItem(fields.title, fields.description)});
            }
          } else {
            titleMap.set(titleKey, {...fields, category: categorizeItem(fields.title, fields.description)});
          }
        }
      });

    } catch (err) {
      console.error(`Error reading ${filePath}:`, err.message);
    }
  });
});

// Combine unique items
urlMap.forEach(item => allItems.push(item));
titleMap.forEach(item => allItems.push(item));

// Group by category
const categorized = {
  [CATEGORIES.NEW_PRODUCTS]: [],
  [CATEGORIES.NEW_FEATURES]: [],
  [CATEGORIES.NEW_TECHNOLOGIES]: [],
  [CATEGORIES.OTHERS]: []
};

allItems.forEach(item => {
  if (categorized[item.category]) {
    categorized[item.category].push(item);
  }
});

// Sort items within each category by date (newest first)
Object.keys(categorized).forEach(cat => {
  categorized[cat].sort((a, b) => new Date(b.date) - new Date(a.date));
});

console.log('Total unique items:', allItems.length);
console.log('Categorized items:');
Object.entries(categorized).forEach(([cat, items]) => {
  console.log(`  ${cat}: ${items.length}`);
});

// Format date for display
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Get grid rows class based on item count
function getGridRowsClass(count) {
  if (count <= 3) return 'grid-rows-1';
  if (count <= 8) return 'grid-rows-2';
  return 'grid-rows-3';
}

// Start generating HTML
let html = `<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Jul 16 - Jul 22</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">Jul 16 - Jul 22, 2026</div>
        </div>
    </nav>
</aside>

<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">Jul 16, 2026 – Jul 22, 2026</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>
`;

// Generate sections for each category that has items
const categoryOrder = [CATEGORIES.NEW_PRODUCTS, CATEGORIES.NEW_FEATURES, CATEGORIES.NEW_TECHNOLOGIES, CATEGORIES.OTHERS];

categoryOrder.forEach(category => {
  const items = categorized[category];

  if (items.length === 0) {
    return; // Skip empty categories
  }

  const gridRowsClass = getGridRowsClass(items.length);

  html += `    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">${category}</h2>
        <div class="grid grid-flow-col auto-cols-[320px] ${gridRowsClass} gap-5 overflow-x-auto pb-4 hide-scrollbar">
`;

  items.forEach(item => {
    const displayDate = formatDisplayDate(item.date);
    const displaySource = item.source || 'Source';

    html += `            <a href="${item.url || '#'}" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
                <div>
                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">${item.title || 'Untitled'}</h3>
                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">${item.description || 'No description available.'}</p>
                </div>
                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
                    <span class="font-medium">${displayDate}</span>
                    <span>${displaySource}</span>
                </div>
            </a>
`;
  });

  html += `        </div>
    </section>
`;
});

html += `</main>`;

// Write output file
fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
console.log(`\nContent fragment generated: ${OUTPUT_FILE}`);
console.log('Run: node templates/merge.js');
