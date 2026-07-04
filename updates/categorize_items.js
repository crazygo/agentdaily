const fs = require('fs');

// Load the aggregated data
const data = JSON.parse(fs.readFileSync('./updates/aggregated_current_week.json', 'utf8'));

// Category definitions
const categories = {
  'New Products': 'Complete new tools, apps, or agents that have been released or launched',
  'New Features': 'Updates to existing tools, improvements, v2.0 releases, new capabilities',
  'New Technologies': 'Papers, underlying models, frameworks, research breakthroughs',
  'Others': 'General news, industry commentary, discussions, miscellaneous'
};

// Function to categorize an item based on its content
function categorizeItem(item) {
  const title = (item.title || item.name || '').toLowerCase();
  const description = (item.description || '').toLowerCase();
  const content = title + ' ' + description;
  
  // Extract source and type info
  const source = (item.source || '').toLowerCase();
  const type = (item.type || item.updateType || '').toLowerCase();
  
  // New Products - look for launch announcements, new tools
  if (content.includes('launch') || 
      content.includes('announc') || 
      content.includes('released') ||
      content.includes('now available') ||
      title.includes('app') ||
      title.includes('tool') ||
      type.includes('release') ||
      source.includes('product hunt') ||
      (title.includes('beta') && content.includes('now available'))) {
    return 'New Products';
  }
  
  // New Features - look for updates, improvements, version releases
  if (content.includes('update') || 
      content.includes('feature') || 
      content.includes('improvement') ||
      content.includes('enhancement') ||
      content.includes('upgrade') ||
      content.includes('v2') || 
      content.includes('version') ||
      type.includes('update') ||
      type.includes('feature') ||
      title.includes('update')) {
    return 'New Features';
  }
  
  // New Technologies - look for research, models, frameworks, papers
  if (content.includes('model') || 
      content.includes('research') || 
      content.includes('paper') ||
      content.includes('framework') ||
      content.includes('llm') ||
      content.includes('gpt') ||
      content.includes('claude') ||
      content.includes('algorithm') ||
      content.includes('breakthrough') ||
      source.includes('arxiv') ||
      source.includes('research')) {
    return 'New Technologies';
  }
  
  // Others - discussions, news, commentary
  return 'Others';
}

// Categorize all items
const categorized = {
  'New Products': [],
  'New Features': [],
  'New Technologies': [],
  'Others': []
};

data.forEach(item => {
  const category = categorizeItem(item);
  categorized[category].push(item);
});

// Save categorized data
fs.writeFileSync('./updates/categorized_current_week.json', JSON.stringify(categorized, null, 2));

// Print summary
console.log('=== Categorization Summary ===');
Object.keys(categorized).forEach(cat => {
  console.log(cat + ': ' + categorized[cat].length + ' items');
});
