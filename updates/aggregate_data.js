const fs = require('fs');
const path = require('path');

// Days to process
const days = ['2025-12-25', '2025-12-26', '2025-12-27', '2025-12-28', '2025-12-29', '2025-12-30', '2025-12-31'];

const allItems = [];
const seenUrls = new Set();

// Read and aggregate all JSON files
days.forEach(day => {
  const dayDir = path.join('updates', day);

  // Try to read new-product.json
  try {
    const newProductPath = path.join(dayDir, 'new-product.json');
    if (fs.existsSync(newProductPath)) {
      const data = JSON.parse(fs.readFileSync(newProductPath, 'utf8'));
      data.forEach(item => {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allItems.push({
            ...item,
            date: day,
            sourceFile: 'new-product.json'
          });
        }
      });
    }
  } catch (e) { console.log('Error reading new-product.json for', day, e.message); }

  // Try to read insights.json
  try {
    const insightsPath = path.join(dayDir, 'insights.json');
    if (fs.existsSync(insightsPath)) {
      const data = JSON.parse(fs.readFileSync(insightsPath, 'utf8'));
      data.forEach(item => {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allItems.push({
            ...item,
            date: day,
            sourceFile: 'insights.json'
          });
        }
      });
    }
  } catch (e) { console.log('Error reading insights.json for', day, e.message); }

  // Try to read whitelist-updates.json
  try {
    const whitelistPath = path.join(dayDir, 'whitelist-updates.json');
    if (fs.existsSync(whitelistPath)) {
      const data = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
      data.forEach(item => {
        const url = item.url || item.link;
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url);
          allItems.push({
            ...item,
            date: day,
            sourceFile: 'whitelist-updates.json'
          });
        }
      });
    }
  } catch (e) { console.log('Error reading whitelist-updates.json for', day, e.message); }
});

console.log('Total unique items:', allItems.length);
fs.writeFileSync('updates/aggregated_data.json', JSON.stringify(allItems, null, 2));
console.log('Saved to updates/aggregated_data.json');
