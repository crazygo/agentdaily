const fs = require('fs');
const path = require('path');

const weekDays = ['2025-12-25', '2025-12-26', '2025-12-27', '2025-12-28', '2025-12-29', '2025-12-30', '2025-12-31'];

const allItems = { newProducts: [], newFeatures: [], newTechnologies: [], others: [] };
const seenUrls = new Map();

function categorizeItem(item) {
  const title = (item.name || item.title || '').toLowerCase();
  const description = (item.description || '').toLowerCase();
  const combined = title + ' ' + description;

  // Check for product/item type first
  if (item.category && (
    item.category.includes('agent') ||
    item.category.includes('AI') ||
    item.category.includes('tool') ||
    item.category.includes('workflow')
  )) {
    return 'newProducts';
  }

  // Check for new product indicators
  if (combined.includes('launch') ||
      combined.includes('platform') ||
      combined.includes('announced') && (combined.includes('new') || combined.includes('app') || combined.includes('agent')) ||
      combined.includes('spark') ||
      combined.includes('zenflow') ||
      combined.includes('vibe pocket') ||
      combined.includes('toad') ||
      combined.includes('agent designer') ||
      combined.includes('minimax m2.1') ||
      combined.includes('glm-4.7') ||
      combined.includes('anthropic agent skills')) {
    return 'newProducts';
  }

  // Check for research/paper indicators
  if (item.source === 'ArXiv' ||
      item.type === 'technical' ||
      item.type === 'paper' ||
      combined.includes('paper') ||
      combined.includes('research') ||
      combined.includes('benchmark') ||
      combined.includes('evaluation') ||
      combined.includes('llm year in review') && combined.includes('karpathy') ||
      combined.includes('reinforcement learning') ||
      combined.includes('semi-supervised') ||
      combined.includes('formal verification') ||
      combined.includes('revffn')) {
    return 'newTechnologies';
  }

  // Check for feature/update indicators
  if (item.updateType === 'feature' ||
      item.updateType === 'release' ||
      item.productName ||
      combined.includes('update') ||
      combined.includes('feature') ||
      combined.includes('improvement') ||
      combined.includes('beta') ||
      combined.includes('version') ||
      combined.includes('visual editor') ||
      combined.includes('codex cli') ||
      combined.includes('gemini cli') ||
      combined.includes('claude code') && (combined.includes('performance') || combined.includes('browser') || combined.includes('slack') || combined.includes('integration')) ||
      combined.includes('windsurf') ||
      combined.includes('copilot')) {
    return 'newFeatures';
  }

  return 'others';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()] + ' ' + date.getDate();
}

function extractSource(item) {
  if (item.sources && Array.isArray(item.sources) && item.sources.length > 0) return item.sources[0];
  if (item.source) return item.source;
  if (item.author) return item.author;
  return 'AI Community';
}

weekDays.forEach(day => {
  const dayDir = path.join(__dirname, day);

  ['new-product.json', 'insights.json', 'whitelist-updates.json'].forEach(filename => {
    const filepath = path.join(dayDir, filename);
    if (fs.existsSync(filepath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        data.forEach(item => {
          const url = item.url;
          if (url && !seenUrls.has(url)) {
            const category = categorizeItem(item);
            seenUrls.set(url, category);
            allItems[category].push({
              name: item.name || item.title,
              ...item,
              _date: item.published_date || item.release_date || day,
              _category: category
            });
          }
        });
      } catch (e) { console.error('Error reading ' + filepath + ':', e.message); }
    }
  });
});

Object.keys(allItems).forEach(category => {
  allItems[category].sort((a, b) => new Date(b._date || b.release_date || b.published_date) - new Date(a._date || a.release_date || a.published_date));
});

function generateContentHTML() {
  let html = '<aside class="lg:sticky lg:top-10">\n    <div class="mb-4">\n        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Dec 25 - Dec 31</div>\n    </div>\n    <nav class="flex flex-col">\n        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">\n            <div class="font-medium mb-1">This Week</div>\n            <div class="text-xs text-[#6B6B6B]">Dec 25 - Dec 31, 2025</div>\n        </div>\n    </nav>\n</aside>\n\n<main class="min-w-0">\n    <div class="mb-12">\n        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>\n        <p class="text-xl text-[#292929] mb-4 font-normal">Dec 25, 2025 – Dec 31, 2025</p>\n        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>\n    </div>\n';

  const categories = [
    { key: 'newProducts', title: 'New Products' },
    { key: 'newFeatures', title: 'New Features' },
    { key: 'newTechnologies', title: 'New Technologies' },
    { key: 'others', title: 'Others' }
  ];

  categories.forEach(cat => {
    const items = allItems[cat.key];
    if (items.length === 0) return;

    let gridRowsClass = items.length >= 9 ? 'grid-rows-3' : (items.length >= 4 ? 'grid-rows-2' : 'grid-rows-1');

    html += '    <section class="mb-16">\n        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">' + cat.title + '</h2>\n        <div class="grid grid-flow-col auto-cols-[320px] ' + gridRowsClass + ' gap-5 overflow-x-auto pb-4 hide-scrollbar">\n';

    items.forEach(item => {
      const title = (item.name || item.title || 'Untitled').replace(/"/g, '&quot;');
      const desc = (item.description || item.summary || '').replace(/"/g, '&quot;');
      const url = item.url || '#';
      const date = formatDate(item._date || item.release_date || item.published_date);
      const source = extractSource(item).replace(/"/g, '&quot;');

      html += '            <a href="' + url + '" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">\n                <div>\n                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">' + title + '</h3>\n                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">' + desc + '</p>\n                </div>\n                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">\n                    <span class="font-medium">' + date + '</span>\n                    <span>' + source + '</span>\n                </div>\n            </a>\n';
    });

    html += '        </div>\n    </section>\n';
  });

  html += '</main>';
  return html;
}

const html = generateContentHTML();
fs.writeFileSync(path.join(__dirname, 'content.html'), html, 'utf8');

console.log('Generated content.html!');
console.log('New Products:', allItems.newProducts.length);
console.log('New Features:', allItems.newFeatures.length);
console.log('New Technologies:', allItems.newTechnologies.length);
console.log('Others:', allItems.others.length);
