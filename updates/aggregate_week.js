const fs = require('fs');
const path = require('path');

// The 7-day window: August 10-16, 2026
const dateFolders = [
  '2026-08-10',
  '2026-08-11',
  '2026-08-12',
  '2026-08-13',
  '2026-08-14',
  '2026-08-15',
  '2026-08-16'
];

// Store all items with their dates for deduplication
const allItems = new Map();

// Function to extract URL from various fields
function extractUrl(item) {
  return item.url || item.href || item.link || item.source_url || '';
}

// Function to extract title/name
function extractTitle(item) {
  return item.title || item.name || item.headline || item.productName || '';
}

// Function to extract description
function extractDescription(item) {
  return item.description || item.summary || item.content || item.text || '';
}

// Function to extract date
function extractDate(item, folderDate) {
  if (item.date || item.published_date || item.release_date) {
    return item.date || item.published_date || item.release_date;
  }
  return folderDate;
}

// Function to extract source
function extractSource(item) {
  if (item.source) {
    return Array.isArray(item.source) ? item.source[0] : item.source;
  }
  if (item.sources && Array.isArray(item.sources)) {
    return item.sources[0];
  }
  return 'Unknown';
}

// Process each date folder
dateFolders.forEach(folder => {
  const folderPath = path.join(__dirname, folder);

  if (!fs.existsSync(folderPath)) {
    console.log(`Skipping ${folder} - folder not found`);
    return;
  }

  const files = fs.readdirSync(folderPath);

  files.forEach(file => {
    if (!file.endsWith('.json')) return;

    const filePath = path.join(folderPath, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      // Handle different JSON structures
      let items = [];

      if (Array.isArray(data)) {
        items = data;
      } else if (data.newProducts && Array.isArray(data.newProducts)) {
        items = data.newProducts;
      } else if (data.whitelistUpdates && Array.isArray(data.whitelistUpdates)) {
        items = data.whitelistUpdates;
      } else if (data.insights && Array.isArray(data.insights)) {
        items = data.insights;
      }

      // Process each item
      items.forEach(item => {
        const url = extractUrl(item);
        const title = extractTitle(item);

        if (!url && !title) return;

        // Create unique key for deduplication
        const key = url || title;

        // Extract and format date
        const itemDate = extractDate(item, folder);

        // Only add if this is a newer version
        if (!allItems.has(key) || itemDate > allItems.get(key).date) {
          allItems.set(key, {
            ...item,
            _folderDate: folder,
            _itemDate: itemDate,
            _sourceFile: file
          });
        }
      });
    } catch (err) {
      // Skip files that can't be parsed
      console.log(`Error parsing ${filePath}: ${err.message}`);
    }
  });
});

// Convert Map to array
const aggregatedItems = Array.from(allItems.values());

console.log(`Aggregated ${aggregatedItems.length} unique items`);

// Categorize items
const categories = {
  newProducts: [],
  newFeatures: [],
  newTechnologies: [],
  others: []
};

aggregatedItems.forEach(item => {
  const title = extractTitle(item).toLowerCase();
  const description = extractDescription(item).toLowerCase();
  const combined = `${title} ${description}`;

  let category = 'others';

  // New Products: Complete new tools, apps, or agents
  if (combined.includes('release') || combined.includes('launch') ||
      combined.includes('new product') || combined.includes('introduc') ||
      (combined.includes('announc') && (combined.includes('tool') || combined.includes('cli') || combined.includes('agent'))) ||
      (item.updateType === 'announcement' && !combined.includes('shutdown')) ||
      (combined.includes('open-source') && (combined.includes('cli') || combined.includes('agent')))) {
    // Check if it's truly a new product vs feature
    if (combined.includes('version') || combined.includes('update') ||
        combined.includes('feature') || combined.includes('improvement') ||
        title.includes('update') || title.includes('v2') || title.includes('v3')) {
      category = 'newFeatures';
    } else {
      category = 'newProducts';
    }
  }
  // New Features: Updates to existing tools, improvements
  else if (combined.includes('update') || combined.includes('feature') ||
           combined.includes('improvement') || combined.includes('enhancement') ||
           combined.includes('version') || combined.includes('v2') ||
           combined.includes('v3') || combined.includes('now supports') ||
           item.updateType === 'feature') {
    category = 'newFeatures';
  }
  // New Technologies: Papers, models, research, frameworks
  else if (combined.includes('model') || combined.includes('research') ||
           combined.includes('paper') || combined.includes('framework') ||
           combined.includes('llm') || combined.includes('ai ') ||
           combined.includes('machine learning') || combined.includes('parameter') ||
           combined.includes('token') && combined.includes('context') ||
           combined.includes('open weights') || combined.includes('mixture of experts') ||
           item.topics && (item.topics.includes('llms') || item.topics.includes('ai'))) {
    category = 'newTechnologies';
  }
  // Everything else goes to Others
  else {
    category = 'others';
  }

  // Override: whitelist-updates are typically features
  if (item._sourceFile === 'whitelist-updates.json') {
    category = 'newFeatures';
  }

  // insights can be any category based on content
  if (item._sourceFile === 'insights.json') {
    // Keep the categorization logic above
  }

  // new-product.json items should be products
  if (item._sourceFile === 'new-product.json') {
    category = 'newProducts';
  }

  categories[category].push({
    title: extractTitle(item),
    description: extractDescription(item),
    url: extractUrl(item),
    date: extractDate(item, item._folderDate),
    source: extractSource(item)
  });
});

// Sort by date (newest first)
Object.keys(categories).forEach(key => {
  categories[key].sort((a, b) => new Date(b.date) - new Date(a.date));
});

// Output categorized data
fs.writeFileSync(
  path.join(__dirname, 'categorized_week_data.json'),
  JSON.stringify(categories, null, 2),
  'utf8'
);

console.log('Categorization complete:');
console.log(`- New Products: ${categories.newProducts.length}`);
console.log(`- New Features: ${categories.newFeatures.length}`);
console.log(`- New Technologies: ${categories.newTechnologies.length}`);
console.log(`- Others: ${categories.others.length}`);
