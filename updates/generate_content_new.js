const fs = require('fs');
const path = require('path');

// Define the current week (Dec 25 - Dec 31, 2025)
const currentWeek = [
  '2025-12-25',
  '2025-12-26',
  '2025-12-27',
  '2025-12-28',
  '2025-12-29',
  '2025-12-30',
  '2025-12-31'
];

// Aggregate all data
const allItems = {
  newProducts: [],
  insights: [],
  updates: []
};

// Track seen URLs for deduplication
const seenUrls = new Set();

function addItems(items, category) {
  if (!Array.isArray(items)) return;

  items.forEach(item => {
    const url = item.url || item.link || '';
    if (url && seenUrls.has(url)) {
      return; // Skip duplicates
    }
    if (url) seenUrls.add(url);

    // Add date context if not present
    if (!item.date && !item.published_date && !item.release_date) {
      item.folderDate = null; // Will be set during aggregation
    }

    allItems[category].push(item);
  });
}

// Load data from each day
currentWeek.forEach(day => {
  const dayPath = path.join(__dirname, day);

  try {
    // Load new products
    const productsPath = path.join(dayPath, 'new-product.json');
    if (fs.existsSync(productsPath)) {
      const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      products.forEach(p => {
        if (!seenUrls.has(p.url)) {
          seenUrls.add(p.url);
          p.date = p.release_date || day;
          allItems.newProducts.push(p);
        }
      });
    }

    // Load insights
    const insightsPath = path.join(dayPath, 'insights.json');
    if (fs.existsSync(insightsPath)) {
      const insights = JSON.parse(fs.readFileSync(insightsPath, 'utf8'));
      insights.forEach(i => {
        if (!seenUrls.has(i.url)) {
          seenUrls.add(i.url);
          i.date = i.published_date || day;
          allItems.insights.push(i);
        }
      });
    }

    // Load whitelist updates
    const updatesPath = path.join(dayPath, 'whitelist-updates.json');
    if (fs.existsSync(updatesPath)) {
      const updates = JSON.parse(fs.readFileSync(updatesPath, 'utf8'));
      updates.forEach(u => {
        if (!seenUrls.has(u.url)) {
          seenUrls.add(u.url);
          u.date = u.date || day;
          allItems.updates.push(u);
        }
      });
    }
  } catch (err) {
    console.error(`Error loading ${day}:`, err.message);
  }
});

console.log(`Aggregated ${allItems.newProducts.length} new products`);
console.log(`Aggregated ${allItems.insights.length} insights`);
console.log(`Aggregated ${allItems.updates.length} updates`);

// AI Categorization function
function categorizeItem(item) {
  const title = ((item.name || item.title || '') + ' ' + (item.description || '')).toLowerCase();

  // New Products - complete new tools, apps, or agents
  if (item.category ||
      title.includes('launch') ||
      title.includes('release') && !title.includes('feature') && !title.includes('update') ||
      title.includes('new tool') ||
      title.includes('platform') && !title.includes('update') ||
      item.sources && item.sources.length && !title.includes('update')) {
    // Check if it's from new-products.json
    if (item.name && item.category && item.release_date) {
      return 'New Products';
    }
  }

  // New Features - updates to existing tools
  if (item.updateType ||
      title.includes('feature') ||
      title.includes('update') ||
      title.includes('version') ||
      title.includes('v.') ||
      title.includes('improvement') ||
      title.includes('enhancement') ||
      item.productName && item.title) {
    return 'New Features';
  }

  // New Technologies - papers, research, frameworks
  if (item.type === 'technical' ||
      item.type === 'paper' ||
      title.includes('paper') ||
      title.includes('arxiv') ||
      title.includes('research') ||
      title.includes('study') ||
      title.includes('benchmark') ||
      title.includes('evaluation') ||
      title.includes('model') && (title.includes('release') === false)) {
    return 'New Technologies';
  }

  // Others - general news, commentary
  return 'Others';
}

// Categorize all items
const categorized = {
  'New Products': [],
  'New Features': [],
  'New Technologies': [],
  'Others': []
};

// Process new products
allItems.newProducts.forEach(item => {
  categorized['New Products'].push({
    title: item.name,
    description: item.description,
    url: item.url,
    date: formatDate(item.release_date || item.date),
    source: item.sources ? item.sources[0] : 'Product Hunt'
  });
});

// Process updates (features)
allItems.updates.forEach(item => {
  categorized['New Features'].push({
    title: `${item.productName}: ${item.title}`,
    description: item.description,
    url: item.url,
    date: formatDate(item.date),
    source: item.productName || 'Release Notes'
  });
});

// Process insights (technologies + others)
allItems.insights.forEach(item => {
  const category = categorizeItem(item);
  categorized[category].push({
    title: item.title,
    description: item.description,
    url: item.url,
    date: formatDate(item.published_date || item.date),
    source: item.source || 'Blog'
  });
});

// Format date helper
function formatDate(dateStr) {
  if (!dateStr) return 'Dec 25';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Generate HTML
function generateHTML() {
  const lines = [];

  // Sidebar
  lines.push('<aside class="lg:sticky lg:top-10">');
  lines.push('    <div class="mb-4">');
  lines.push('        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Dec 25 - Dec 31</div>');
  lines.push('    </div>');
  lines.push('    <nav class="flex flex-col">');
  lines.push('        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">');
  lines.push('            <div class="font-medium mb-1">This Week</div>');
  lines.push('            <div class="text-xs text-[#6B6B6B]">Dec 25 - Dec 31, 2025</div>');
  lines.push('        </div>');
  lines.push('    </nav>');
  lines.push('</aside>');

  // Main content
  lines.push('<main class="min-w-0">');
  lines.push('    <div class="mb-12">');
  lines.push('        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>');
  lines.push('        <p class="text-xl text-[#292929] mb-4 font-normal">Dec 25, 2025 – Dec 31, 2025</p>');
  lines.push('        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>');
  lines.push('    </div>');

  // Categories
  const categories = ['New Products', 'New Features', 'New Technologies', 'Others'];

  categories.forEach(category => {
    const items = categorized[category];
    if (items.length === 0) return;

    // Determine grid rows
    let gridRowsClass = 'grid-rows-1';
    if (items.length >= 4 && items.length <= 8) {
      gridRowsClass = 'grid-rows-2';
    } else if (items.length >= 9) {
      gridRowsClass = 'grid-rows-3';
    }

    lines.push(`    <!-- ${category} (${items.length} items) -->`);
    lines.push('    <section class="mb-16">');
    lines.push(`        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">${category}</h2>`);
    lines.push(`        <div class="grid grid-flow-col auto-cols-[320px] ${gridRowsClass} gap-5 overflow-x-auto pb-4 hide-scrollbar">`);

    items.forEach(item => {
      lines.push('            <a href="' + item.url + '" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">');
      lines.push('                <div>');
      lines.push('                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">' + escapeHTML(item.title) + '</h3>');
      lines.push('                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">' + escapeHTML(item.description) + '</p>');
      lines.push('                </div>');
      lines.push('                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">');
      lines.push('                    <span class="font-medium">' + item.date + '</span>');
      lines.push('                    <span>' + escapeHTML(item.source) + '</span>');
      lines.push('                </div>');
      lines.push('            </a>');
    });

    lines.push('        </div>');
    lines.push('    </section>');
  });

  lines.push('</main>');

  return lines.join('\n');
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Generate and save
const html = generateHTML();
const outputPath = path.join(__dirname, 'content.html');
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`\nGenerated content.html with ${categorized['New Products'].length} products, ${categorized['New Features'].length} features, ${categorized['New Technologies'].length} technologies, ${categorized['Others'].length} others`);
