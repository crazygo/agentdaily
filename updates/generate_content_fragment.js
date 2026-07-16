const fs = require('fs');
const path = require('path');

// Determine the 7-day window based on the latest date folder
const updatesDir = '.'; // Current directory (updates)
const dateFolders = fs.readdirSync(updatesDir)
  .filter(f => f.match(/^\d{4}-\d{2}-\d{2}$/))
  .sort()
  .reverse();

const latestDate = dateFolders[0]; // e.g., "2026-07-16"

if (!latestDate) {
  console.error('No date folders found in updates directory');
  process.exit(1);
}

// Parse date manually to avoid timezone issues
const parseDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const latestDateObj = parseDate(latestDate);

// Calculate 7-day window
const sevenDaysAgo = new Date(latestDateObj);
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

// Format dates for display
const formatDate = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const formatDateRange = (start, end) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = months[start.getMonth()];
  const endMonth = months[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startMonth === endMonth && startYear === endYear) {
    return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
  }
};

// Collect all items from the 7-day window
const allItems = {
  newProducts: [],
  newFeatures: [],
  newTechnologies: [],
  others: []
};

// Helper to deduplicate by URL
const seenUrls = new Set();

const addItem = (category, item) => {
  if (item.url && seenUrls.has(item.url)) {
    return; // Skip duplicates
  }
  if (item.url) {
    seenUrls.add(item.url);
  }
  allItems[category].push(item);
};

// Process each date in the 7-day window
for (let i = 0; i < 7; i++) {
  const currentDate = new Date(sevenDaysAgo);
  currentDate.setDate(currentDate.getDate() + i);
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD
  const datePath = path.join(updatesDir, dateStr);

  if (!fs.existsSync(datePath)) {
    console.log(`Skipping ${dateStr} - folder not found`);
    continue;
  }

  console.log(`Processing ${dateStr}...`);

  // Read all JSON files in this date folder
  const files = fs.readdirSync(datePath).filter(f => f.endsWith('.json') && !f.includes('run-logs'));

  files.forEach(file => {
    try {
      const filePath = path.join(datePath, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Process based on file type or content structure
      if (file === 'new-product.json' || (Array.isArray(data) && data[0] && data[0].name && !data[0].productName)) {
        // New products
        data.forEach(item => {
          if (item.name && item.url) {
            addItem('newProducts', {
              title: item.name,
              description: item.description,
              url: item.url,
              date: item.release_date || dateStr,
              source: Array.isArray(item.sources) ? (item.sources[0] || 'Product Hunt') : 'Product Hunt'
            });
          }
        });
      } else if (file === 'insights.json' || (Array.isArray(data) && data[0] && data[0].title && data[0].type)) {
        // Insights/research - categorize as Technologies or Others
        data.forEach(item => {
          if (item.title && item.url) {
            const isResearch = item.source === 'Paper' || item.type === 'technical' ||
                             item.topics?.includes('research') || item.topics?.includes('LLM') ||
                             item.topics?.includes('gpt') || item.topics?.includes('claude');
            const category = isResearch ? 'newTechnologies' : 'others';
            addItem(category, {
              title: item.title,
              description: item.description,
              url: item.url,
              date: item.published_date || dateStr,
              source: item.source || 'Blog'
            });
          }
        });
      } else if (file === 'whitelist-updates.json' || (Array.isArray(data) && data[0] && data[0].productName)) {
        // Product updates/features
        data.forEach(item => {
          if (item.title && item.url) {
            addItem('newFeatures', {
              title: `${item.productName}: ${item.title}`,
              description: item.description,
              url: item.url,
              date: item.date || dateStr,
              source: 'Official'
            });
          }
        });
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  });
}

// Sort items by date (descending)
Object.keys(allItems).forEach(category => {
  allItems[category].sort((a, b) => new Date(b.date) - new Date(a.date));
});

// Generate the content fragment
function generateContentHTML() {
  const sidebarHTML = `<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">${formatDate(sevenDaysAgo)} - ${formatDate(latestDateObj)}</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">${formatDateRange(sevenDaysAgo, latestDateObj)}</div>
        </div>
    </nav>
</aside>`;

  const mainHeader = `<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">${formatDateRange(sevenDaysAgo, latestDateObj)}</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>`;

  function getGridRowsClass(count) {
    if (count <= 3) return 'grid-rows-1';
    if (count <= 8) return 'grid-rows-2';
    return 'grid-rows-3';
  }

  function formatCardDate(dateStr) {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  function generateCards(items) {
    return items.map(item => `
            <a href="${item.url}" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
                <div>
                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">${item.title}</h3>
                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">${item.description}</p>
                </div>
                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
                    <span class="font-medium">${formatCardDate(item.date)}</span>
                    <span>${item.source}</span>
                </div>
            </a>`).join('');
  }

  function generateSection(title, items) {
    if (items.length === 0) return '';
    return `
    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">${title}</h2>
        <div class="grid grid-flow-col auto-cols-[320px] ${getGridRowsClass(items.length)} gap-5 overflow-x-auto pb-4 hide-scrollbar">
            ${generateCards(items)}
        </div>
    </section>`;
  }

  const sections = [
    generateSection('New Products', allItems.newProducts),
    generateSection('New Features', allItems.newFeatures),
    generateSection('New Technologies', allItems.newTechnologies),
    generateSection('Others', allItems.others)
  ].filter(s => s.trim());

  return `${sidebarHTML}

${mainHeader}

${sections.join('')}
</main>`;
}

// Write to content.html
const contentHTML = generateContentHTML();
fs.writeFileSync('./content.html', contentHTML);

console.log('\n✓ Generated content.html successfully!');
console.log(`Weekly Report: ${formatDateRange(sevenDaysAgo, latestDateObj)}`);
console.log(`\nCategory breakdown:`);
console.log(`- New Products: ${allItems.newProducts.length}`);
console.log(`- New Features: ${allItems.newFeatures.length}`);
console.log(`- New Technologies: ${allItems.newTechnologies.length}`);
console.log(`- Others: ${allItems.others.length}`);
