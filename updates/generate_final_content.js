const fs = require('fs');
const path = require('path');

// Read manifest
const manifestPath = './manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Find the latest date
const allDates = manifest.days.map(d => d.date).sort();
const latestDate = allDates[allDates.length - 1];

// Calculate the 7-day window
const latestDateObj = new Date(latestDate);
const startDateObj = new Date(latestDateObj);
startDateObj.setDate(startDateObj.getDate() - 6);

const formatDate = (date) => date.toISOString().split('T')[0];
const startDate = formatDate(startDateObj);
const endDate = formatDate(latestDateObj);

console.log(`Processing data from ${startDate} to ${endDate}`);

// Collect all items from the 7-day window
const allItems = [];
const seenUrls = new Set();

for (const dayData of manifest.days) {
  const date = dayData.date;
  if (date < startDate || date > endDate) continue;

  const dayDir = `./${date}`;
  for (const file of dayData.files) {
    if (!file.endsWith('.json') || file === 'manifest.json') continue;

    let filePath;
    try {
      filePath = path.join(dayDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Handle different JSON structures
      let items = [];
      if (Array.isArray(content)) {
        items = content;
      } else if (content.items && Array.isArray(content.items)) {
        items = content.items;
      } else if (content.data && Array.isArray(content.data)) {
        items = content.data;
      }

      for (const item of items) {
        // Extract fields flexibly
        const title = item.title || item.name || item.headline || '';
        const description = item.description || item.summary || item.content || item.text || '';
        const url = item.url || item.href || item.link || item.source_url || '';
        const source = item.source || file.replace('.json', '') || 'Unknown';

        // Skip if no title or URL
        if (!title || !url) continue;

        // Deduplication by URL
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        allItems.push({
          title,
          description,
          url,
          source,
          date
        });
      }
    } catch (e) {
      console.error(`Error processing ${filePath}:`, e.message);
    }
  }
}

console.log(`Total unique items: ${allItems.length}`);

// Categorize items based on content analysis
const categorize = (item) => {
  const { title, description } = item;
  const text = `${title} ${description}`.toLowerCase();

  // New Technologies: papers, models, frameworks, research
  if (text.includes('paper') || text.includes('research ') ||
      text.includes(' model') || text.includes(' llama ') ||
      text.includes('gpt-') || text.includes(' claude ') ||
      text.includes('framework') || text.includes('dataset') ||
      text.includes('training') || text.includes('benchmark') ||
      text.includes('arxiv') || text.includes('study') ||
      text.includes('algorithm') || text.includes('architecture')) {
    return 'New Technologies';
  }

  // New Features: updates, improvements, versions, enhancements
  if (text.includes('update') || text.includes('new feature') ||
      text.includes('improvement') || text.includes('enhancement') ||
      text.includes(' v2') || text.includes(' v3') || text.includes(' v4') ||
      text.includes('version 2') || text.includes('version 3') ||
      text.includes(' now supports') || text.includes(' adds ') ||
      text.includes(' introduces ') || text.includes(' upgrades ') ||
      text.includes(' beta') || text.includes(' preview')) {
    return 'New Features';
  }

  // New Products: launches, releases, tools, apps, agents
  if (text.includes('launch') || text.includes('released') ||
      text.includes('new tool') || text.includes('new app') ||
      text.includes('introducing') || text.includes('announces') ||
      text.includes('agent') || text.includes('platform') ||
      text.includes('product') || text.includes('service') ||
      text.includes('available now') || text.includes('just launched')) {
    return 'New Products';
  }

  // Default to Others
  return 'Others';
};

// Categorize all items
const categories = {
  'New Products': [],
  'New Features': [],
  'New Technologies': [],
  'Others': []
};

for (const item of allItems) {
  const category = categorize(item);
  categories[category].push(item);
}

console.log('\nCategory counts:');
for (const [cat, items] of Object.entries(categories)) {
  console.log(`${cat}: ${items.length}`);
}

// Generate content.html
let html = '';

// Sidebar
const startMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const startDateParts = startDate.split('-');
const endDateParts = endDate.split('-');
const startDisplay = `${startMonthNames[parseInt(startDateParts[1]) - 1]} ${parseInt(startDateParts[2])}`;
const endDisplay = `${startMonthNames[parseInt(endDateParts[1]) - 1]} ${parseInt(endDateParts[2])}`;

html += `<aside class="lg:sticky lg:top-10">\n`;
html += `    <div class="mb-4">\n`;
html += `        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">${startDisplay} - ${endDisplay}</div>\n`;
html += `    </div>\n`;
html += `    <nav class="flex flex-col">\n`;
html += `        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">\n`;
html += `            <div class="font-medium mb-1">This Week</div>\n`;
html += `            <div class="text-xs text-[#6B6B6B]">${startDisplay}, ${startDateParts[0]} – ${endDisplay}, ${endDateParts[0]}</div>\n`;
html += `        </div>\n`;
html += `    </nav>\n`;
html += `</aside>\n\n`;

// Main content
html += `<main class="min-w-0">\n`;
html += `    <div class="mb-12">\n`;
html += `        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>\n`;
html += `        <p class="text-xl text-[#292929] mb-4 font-normal">${startMonthNames[parseInt(startDateParts[1]) - 1]} ${parseInt(startDateParts[2])}, ${startDateParts[0]} – ${startMonthNames[parseInt(endDateParts[1]) - 1]} ${parseInt(endDateParts[2])}, ${endDateParts[0]}</p>\n`;
html += `        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>\n`;
html += `    </div>\n\n`;

// Format date for display
const formatDisplayDate = (dateStr) => {
  const parts = dateStr.split('-');
  return `${startMonthNames[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}`;
};

// Generate category sections
for (const [categoryName, items] of Object.entries(categories)) {
  if (items.length === 0) continue;

  // Determine grid rows class
  const itemCount = items.length;
  let gridRowsClass = 'grid-rows-1';
  if (itemCount >= 4 && itemCount <= 8) {
    gridRowsClass = 'grid-rows-2';
  } else if (itemCount >= 9) {
    gridRowsClass = 'grid-rows-3';
  }

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
    html += `                    <span class="font-medium">${formatDisplayDate(item.date)}</span>\n`;
    html += `                    <span>${item.source}</span>\n`;
    html += `                </div>\n`;
    html += `            </a>\n`;
  }

  html += `        </div>\n`;
  html += `    </section>\n\n`;
}

html += `</main>\n`;

// Write content.html
fs.writeFileSync('./content.html', html, 'utf8');
console.log('\nGenerated ./content.html');
console.log(`Total sections: ${Object.values(categories).filter(arr => arr.length > 0).length}`);
