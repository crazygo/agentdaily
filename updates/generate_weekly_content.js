const fs = require('fs');
const path = require('path');

// Configuration
const UPDATES_DIR = __dirname;
const OUTPUT_FILE = path.join(__dirname, 'content.html');

// Current week: May 23 - May 29, 2026 (7 days ending on latest date)
const CURRENT_WEEK_START = '2026-05-23';
const CURRENT_WEEK_END = '2026-05-29';

// Generate date range
function getDateRange(start, end) {
  const dates = [];
  let current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Read all JSON files from a directory
function readJsonFiles(dateDir) {
  const items = [];
  const files = fs.readdirSync(dateDir);

  files.forEach(file => {
    if (path.extname(file) === '.json' && !file.includes('run-logs') && !file.includes('prompts')) {
      try {
        const filePath = path.join(dateDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        if (Array.isArray(data)) {
          items.push(...data);
        } else if (typeof data === 'object' && data !== null) {
          items.push(data);
        }
      } catch (err) {
        // Skip invalid JSON files
        console.warn(`Skipping ${file}: ${err.message}`);
      }
    }
  });

  return items;
}

// Normalize item to common structure
function normalizeItem(item, date) {
  // Handle different field names
  const title = item.title || item.name || item.productName || 'Untitled';
  const description = item.description || item.summary || item.content || '';
  const url = item.url || item.href || item.link || item.source_url || '#';
  const source = item.source || item.author || 'Unknown';

  // Derive date from item if available, otherwise use folder date
  let itemDate = date;
  if (item.published_date || item.release_date || item.date) {
    itemDate = item.published_date || item.release_date || item.date;
    // Format to YYYY-MM-DD
    itemDate = itemDate.split('T')[0];
  }

  return { title, description, url, source, date: itemDate };
}

// Categorize item based on content analysis
function categorizeItem(item) {
  const { title, description } = item;
  const content = `${title} ${description}`.toLowerCase();

  // New Products: Complete new tools, apps, or agents
  if (content.includes('launch') || content.includes('release') || content.includes('new product') ||
      content.includes('introducing') || content.includes('announcing') ||
      content.includes('product of the day') || content.includes('product hunt') ||
      (content.includes('agent') && content.includes('new'))) {
    return 'New Products';
  }

  // New Features: Updates to existing tools, improvements, v2.0 releases
  if (content.includes('update') || content.includes('feature') || content.includes('improve') ||
      content.includes('enhancement') || content.includes('upgrade') || content.includes('now available') ||
      content.includes('version') || content.includes('v2') || content.includes('v3') ||
      content.includes('integration') || content.includes('plugin') || content.includes('extension')) {
    return 'New Features';
  }

  // New Technologies: Papers, underlying models, frameworks, research
  if (content.includes('paper') || content.includes('research') || content.includes('arxiv') ||
      content.includes('model') || content.includes('framework') || content.includes('algorithm') ||
      content.includes('training') || content.includes('architecture') || content.includes('study') ||
      content.includes('experiment') || content.includes('breakthrough')) {
    return 'New Technologies';
  }

  // Others: General news, industry commentary, miscellaneous
  return 'Others';
}

// Deduplicate items based on URL or title
function deduplicateItems(items) {
  const seen = new Set();
  const unique = [];

  // Sort by date (descending) to keep latest versions first
  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  items.forEach(item => {
    const key = `${item.url}|${item.title}`.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  });

  return unique;
}

// Format date for display (e.g., "May 23")
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Generate grid rows class based on item count
function getGridRowsClass(count) {
  if (count <= 3) return 'grid-rows-1';
  if (count <= 8) return 'grid-rows-2';
  return 'grid-rows-3';
}

// Generate HTML card for an item
function generateCard(item) {
  const { title, description, url, source, date } = item;
  const displayDate = formatDate(date);

  return `            <a href="${url}" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
                <div>
                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">${title}</h3>
                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">${description}</p>
                </div>
                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
                    <span class="font-medium">${displayDate}</span>
                    <span>${source}</span>
                </div>
            </a>`;
}

// Main generation function
function generateContent() {
  console.log('Starting content generation...');

  // Get date range for current week
  const dateRange = getDateRange(CURRENT_WEEK_START, CURRENT_WEEK_END);
  console.log(`Processing week: ${CURRENT_WEEK_START} to ${CURRENT_WEEK_END}`);

  // Aggregate all items from all JSON files in the date range
  let allItems = [];
  dateRange.forEach(date => {
    const dateDir = path.join(UPDATES_DIR, date);
    if (fs.existsSync(dateDir)) {
      console.log(`Reading data from ${date}...`);
      const items = readJsonFiles(dateDir);
      const normalized = items.map(item => normalizeItem(item, date));
      allItems.push(...normalized);
    }
  });

  console.log(`Total items before deduplication: ${allItems.length}`);

  // Deduplicate
  allItems = deduplicateItems(allItems);
  console.log(`Total items after deduplication: ${allItems.length}`);

  // Categorize items
  const categories = {
    'New Products': [],
    'New Features': [],
    'New Technologies': [],
    'Others': []
  };

  allItems.forEach(item => {
    const category = categorizeItem(item);
    categories[category].push(item);
  });

  // Log category counts
  Object.entries(categories).forEach(([cat, items]) => {
    console.log(`${cat}: ${items.length} items`);
  });

  // Generate HTML
  let html = `<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">May 23 - May 29</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">May 23 - May 29, 2026</div>
        </div>
    </nav>
</aside>

<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">May 23, 2026 – May 29, 2026</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>

`;

  // Generate category sections
  const categoryOrder = ['New Products', 'New Features', 'New Technologies', 'Others'];

  categoryOrder.forEach(categoryName => {
    const items = categories[categoryName];
    if (items.length === 0) return;

    const gridRowsClass = getGridRowsClass(items.length);

    html += `    <!-- ${categoryName} Section (${items.length} items = ${gridRowsClass}) -->
    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">${categoryName}</h2>
        <div class="grid grid-flow-col auto-cols-[320px] ${gridRowsClass} gap-5 overflow-x-auto pb-4 hide-scrollbar">
`;
    items.forEach(item => {
      html += generateCard(item) + '\n';
    });

    html += '        </div>\n    </section>\n\n';
  });

  html += '</main>';

  // Write output
  fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
  console.log(`Content fragment written to ${OUTPUT_FILE}`);
}

// Run generation
generateContent();
