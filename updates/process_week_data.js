const fs = require('fs');
const path = require('path');

// Current week: July 3-9, 2026 (7 days ending on latest date 2026-07-09)
const currentWeek = [
  '2026-07-03',
  '2026-07-04',
  '2026-07-05',
  '2026-07-06',
  '2026-07-07',
  '2026-07-08',
  '2026-07-09'
];

const updatesDir = '.';

// Helper to extract title
function getTitle(item) {
  return item.title || item.name || item.productName || item.headline || 'Untitled';
}

// Helper to extract description
function getDescription(item) {
  return item.description || item.summary || item.content || item.text || '';
}

// Helper to extract URL
function getUrl(item) {
  return item.url || item.href || item.link || item.source_url || '#';
}

// Helper to extract date
function getDate(item, folderDate) {
  if (item.date) return item.date;
  if (item.published_date) return item.published_date;
  if (item.release_date) return item.release_date;
  return folderDate;
}

// Helper to extract source
function getSource(item) {
  if (item.source) return item.source;
  if (item.sources && Array.isArray(item.sources) && item.sources.length > 0) {
    return item.sources[0];
  }
  return 'Unknown';
}

// AI Categorization function
function categorizeItem(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  // New Products - complete new tools, apps, or agents
  if (
    /launch|release|new|introducing|announc|v1\.0|version 1|first release|initial|beta release|now available|debut|emerge|unveil|introduces|launches|released|introducing|announces/.test(text) &&
    !(/update|upgrade|improvement|enhancement|feature|v2|v3|version [2-9]|patch/.test(text))
  ) {
    return 'New Products';
  }

  // New Technologies - papers, underlying models, frameworks, research
  if (
    /paper|research|model|framework|library|dataset|algorithm|architecture|training|pre-training| MoE |Mixture of Experts|transformer|parameter|token|embedding|quantized|open source|study|analysis|technical/.test(text) &&
    !(/app|tool|service|platform|product|software|application/.test(text))
  ) {
    return 'New Technologies';
  }

  // New Features - updates to existing tools, improvements, v2.0+
  if (
    /update|upgrade|improvement|enhancement|feature|v2|v3|version [2-9]|patch|fix|improve|enhance|upgrade|better|faster|new feature|added|now supports|integrates|extends|expands/.test(text) ||
    (/release|version|v\d+/.test(text) && !/v1\.0|version 1|first/.test(text))
  ) {
    return 'New Features';
  }

  // Others - general news, commentary, discussions
  return 'Others';
}

// Aggregate all data
const allItems = [];
const seen = new Map();

for (const date of currentWeek) {
  const dayDir = path.join(updatesDir, date);

  if (!fs.existsSync(dayDir)) continue;

  const jsonFiles = fs.readdirSync(dayDir).filter(f => f.endsWith('.json') && f !== 'data.json' && !f.includes('run-logs'));

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(dayDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        for (const item of data) {
          const title = getTitle(item);
          const url = getUrl(item);

          // Create unique key for deduplication
          const key = `${title}|${url}`;

          if (!seen.has(key)) {
            seen.set(key, { item, date, file });
            allItems.push({
              ...item,
              _extracted: {
                title,
                description: getDescription(item),
                url,
                date: getDate(item, date),
                source: getSource(item),
                folderDate: date
              }
            });
          } else {
            // Keep latest version
            const existing = seen.get(key);
            if (date > existing.date) {
              seen.set(key, { item, date, file });
              const idx = allItems.findIndex(i => getTitle(i) === title && getUrl(i) === url);
              if (idx !== -1) {
                allItems[idx] = {
                  ...item,
                  _extracted: {
                    title,
                    description: getDescription(item),
                    url,
                    date: getDate(item, date),
                    source: getSource(item),
                    folderDate: date
                  }
                };
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error processing ${file} in ${date}:`, err.message);
    }
  }
}

// Categorize items
const categorized = {
  'New Products': [],
  'New Features': [],
  'New Technologies': [],
  'Others': []
};

for (const item of allItems) {
  const category = categorizeItem(item._extracted.title, item._extracted.description);
  categorized[category].push(item);
}

// Sort each category by date (newest first)
for (const cat of Object.keys(categorized)) {
  categorized[cat].sort((a, b) => new Date(b._extracted.date) - new Date(a._extracted.date));
}

// Output
console.log(JSON.stringify(categorized, null, 2));

// Log summary
console.log('\n=== SUMMARY ===');
for (const cat of Object.keys(categorized)) {
  console.log(`${cat}: ${categorized[cat].length} items`);
}
