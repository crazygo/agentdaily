const fs = require('fs');
const path = require('path');

// Configuration
const UPDATES_DIR = './updates';
const OUTPUT_FILE = './updates/content.html';
const LATEST_DATE = '2026-02-08';

// Calculate 7-day range ending on latest date
function getDateRange(latestDate) {
  const end = new Date(latestDate);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

// Format date for display (e.g., "Feb 2")
function formatDateDisplay(dateStr) {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Format date range for display (e.g., "Feb 2 - Feb 8")
function formatRangeDisplay(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`;
}

// Extract data from various JSON structures
function extractDataFromFile(filePath, dateFolder) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    const items = [];

    // Handle array format
    if (Array.isArray(data)) {
      for (const item of data) {
        const extracted = extractItem(item, dateFolder, filePath);
        if (extracted) items.push(extracted);
      }
    }
    // Handle object format with nested arrays
    else if (typeof data === 'object') {
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          for (const item of data[key]) {
            const extracted = extractItem(item, dateFolder, filePath);
            if (extracted) items.push(extracted);
          }
        }
      }
    }

    return items;
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e.message);
    return [];
  }
}

// Extract item properties with flexible field names
function extractItem(item, dateFolder, filePath) {
  // Get URL/link
  const url = item.url || item.href || item.link || item.source_url || '';

  // Skip if no URL
  if (!url) return null;

  // Get title/name
  const title = item.title || item.name || item.headline || item.productName || '';

  // Skip if no title
  if (!title) return null;

  // Get description
  const description = item.description || item.summary || item.content || item.text || '';

  // Get date (prefer item.date, then folder name)
  const date = item.date || item.published_date || item.release_date || dateFolder;

  // Get source
  const source = item.source || item.author || getSourceFromUrl(url) || 'Unknown';

  return {
    title,
    url,
    description,
    date,
    source,
    file: path.basename(filePath)
  };
}

// Extract source name from URL
function getSourceFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  } catch {
    return null;
  }
}

// Categorize item based on content analysis
function categorizeItem(item) {
  const { title, description } = item;
  const text = `${title} ${description}`.toLowerCase();

  // New Products indicators
  const newProductKeywords = [
    'launch', 'release', 'introducing', 'announces', 'emerges', 'unveils',
    'new product', 'new tool', 'new app', 'startup', 'founded', 'series a',
    'raises $', 'funding', 'valuation', 'comes out of stealth'
  ];

  // New Features indicators
  const newFeaturesKeywords = [
    'update', 'feature', 'integration', 'now available', 'improves',
    'enhancement', 'upgrade', 'v2', 'v3', 'version', 'adds', 'adds support',
    'integration', 'available in', 'public preview', 'beta', 'update for'
  ];

  // New Technologies indicators
  const newTechKeywords = [
    'paper', 'research', 'model', 'architecture', 'framework', 'algorithm',
    'study', 'findings', 'breakthrough', 'lm', 'gpt', 'claude', 'transformer',
    'neural', 'dataset', 'benchmark', 'state-of-the-art', 'sota'
  ];

  // Check for technology/papers first (highest priority for tech content)
  if (newTechKeywords.some(kw => text.includes(kw)) &&
      (text.includes('paper') || text.includes('research') ||
       text.includes('model') || text.includes('framework'))) {
    return 'New Technologies';
  }

  // Check for new products
  if (newProductKeywords.some(kw => text.includes(kw))) {
    return 'New Products';
  }

  // Check for new features
  if (newFeaturesKeywords.some(kw => text.includes(kw))) {
    return 'New Features';
  }

  // Default to Others
  return 'Others';
}

// Aggregate and deduplicate data
function aggregateData(dateRange) {
  const allItems = [];
  const seenUrls = new Map(); // URL -> item (keeps latest)

  // Iterate through each day in range
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateFolder = d.toISOString().split('T')[0];
    const folderPath = path.join(UPDATES_DIR, dateFolder);

    if (!fs.existsSync(folderPath)) continue;

    // Scan all JSON files in folder
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const items = extractDataFromFile(filePath, dateFolder);

      for (const item of items) {
        // Deduplicate by URL (keep latest)
        const existing = seenUrls.get(item.url);
        if (!existing || new Date(item.date) >= new Date(existing.date)) {
          seenUrls.set(item.url, item);
        }
      }
    }
  }

  return Array.from(seenUrls.values());
}

// Generate HTML content fragment
function generateHTML(items, dateRange) {
  // Categorize items
  const categories = {
    'New Products': [],
    'New Features': [],
    'New Technologies': [],
    'Others': []
  };

  for (const item of items) {
    const category = categorizeItem(item);
    categories[category].push(item);
  }

  // Sort items within each category by date (newest first)
  for (const cat in categories) {
    categories[cat].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Generate HTML
  let html = '';

  // Left sidebar
  html += `<aside class="lg:sticky lg:top-10">\n`;
  html += `    <div class="mb-4">\n`;
  html += `        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">${formatRangeDisplay(dateRange.start, dateRange.end)}</div>\n`;
  html += `    </div>\n`;
  html += `    <nav class="flex flex-col">\n`;
  html += `        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">\n`;
  html += `            <div class="font-medium mb-1">This Week</div>\n`;
  html += `            <div class="text-xs text-[#6B6B6B]">${formatRangeDisplay(dateRange.start, dateRange.end)}, 2026</div>\n`;
  html += `        </div>\n`;
  html += `    </nav>\n`;
  html += `</aside>\n\n`;

  // Main content
  html += `<main class="min-w-0">\n`;
  html += `    <div class="mb-12">\n`;
  html += `        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>\n`;
  html += `        <p class="text-xl text-[#292929] mb-4 font-normal">${formatDateDisplay(dateRange.start)}, 2026 – ${formatDateDisplay(dateRange.end)}, 2026</p>\n`;
  html += `        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>\n`;
  html += `    </div>\n\n`;

  // Generate category sections
  const categoryOrder = ['New Products', 'New Features', 'New Technologies', 'Others'];

  for (const categoryName of categoryOrder) {
    const items = categories[categoryName];
    if (items.length === 0) continue;

    // Determine grid rows class
    const gridRowsClass = items.length <= 3 ? 'grid-rows-1' :
                          items.length <= 8 ? 'grid-rows-2' : 'grid-rows-3';

    html += `    <!-- ${categoryName} Section -->\n`;
    html += `    <section class="mb-16">\n`;
    html += `        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">${categoryName}</h2>\n`;
    html += `        <div class="grid grid-flow-col auto-cols-[320px] ${gridRowsClass} gap-5 overflow-x-auto pb-4 hide-scrollbar">\n`;

    for (const item of items) {
      html += `            <a href="${item.url}" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">\n`;
      html += `                <div>\n`;
      html += `                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">${item.title}</h3>\n`;
      html += `                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">${item.description}</p>\n`;
      html += `                </div>\n`;
      html += `                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">\n`;
      html += `                    <span class="font-medium">${formatDateDisplay(item.date)}</span>\n`;
      html += `                    <span>${item.source}</span>\n`;
      html += `                </div>\n`;
      html += `            </a>\n`;
    }

    html += `        </div>\n`;
    html += `    </section>\n\n`;
  }

  html += `</main>\n`;

  return html;
}

// Main execution
function main() {
  console.log('Generating content.html...\n');

  // Get date range
  const dateRange = getDateRange(LATEST_DATE);
  console.log(`Processing date range: ${dateRange.start} to ${dateRange.end}`);

  // Aggregate data
  const items = aggregateData(dateRange);
  console.log(`Found ${items.length} unique items`);

  // Generate HTML
  const html = generateHTML(items, dateRange);

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
  console.log(`\nGenerated ${OUTPUT_FILE}`);

  // Print category stats
  const categories = ['New Products', 'New Features', 'New Technologies', 'Others'];
  console.log('\nCategory breakdown:');
  for (const cat of categories) {
    const count = items.filter(i => categorizeItem(i) === cat).length;
    if (count > 0) {
      console.log(`  ${cat}: ${count}`);
    }
  }
}

main();
