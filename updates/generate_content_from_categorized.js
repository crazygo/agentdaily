const fs = require('fs');
const path = require('path');

// Read the categorized data
const categorizedPath = path.join(__dirname, 'categorized_current_week.json');
const categorized = JSON.parse(fs.readFileSync(categorizedPath, 'utf8'));

// Define the week dates
const weekStart = 'Jun 22';
const weekEnd = 'Jun 28';
const year = '2026';
const fullDateRange = `June 22, 2026 – June 28, 2026`;
const navDateRange = 'Jun 22 - Jun 28';

// Helper function to format date
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Helper function to extract title
function getTitle(item) {
  if (item.title) return item.title;
  if (item.name) return item.name;
  if (item.productName && item.title) return `${item.productName}: ${item.title}`;
  if (item.productName) return item.productName;
  return 'Untitled';
}

// Helper function to extract description
function getDescription(item) {
  if (item.description) return item.description;
  return 'No description available.';
}

// Helper function to extract URL
function getURL(item) {
  if (item.url) return item.url;
  return '#';
}

// Helper function to extract source
function getSource(item) {
  if (item.source) return item.source;
  if (item.sources && Array.isArray(item.sources) && item.sources.length > 0) {
    return item.sources[0];
  }
  return 'Unknown';
}

// Helper function to extract date
function getDate(item) {
  if (item.published_date) return formatDate(item.published_date);
  if (item.date) return formatDate(item.date);
  if (item.release_date) return formatDate(item.release_date);
  if (item._sourceDate) return formatDate(item._sourceDate);
  return '';
}

// Helper function to generate grid rows class
function getGridRowsClass(count) {
  if (count <= 3) return 'grid-rows-1';
  if (count <= 8) return 'grid-rows-2';
  return 'grid-rows-3';
}

// Generate HTML for a card
function generateCard(item) {
  const title = getTitle(item);
  const description = getDescription(item);
  const url = getURL(item);
  const date = getDate(item);
  const source = getSource(item);

  return `            <a href="${url}" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
                <div>
                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">${title}</h3>
                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">${description}</p>
                </div>
                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
                    <span class="font-medium">${date}</span>
                    <span>${source}</span>
                </div>
            </a>`;
}

// Generate HTML for a category section
function generateCategorySection(categoryName, items) {
  if (!items || items.length === 0) return '';

  const gridRowsClass = getGridRowsClass(items.length);
  const cards = items.map(generateCard).join('\n');

  return `    <!-- ${categoryName} Section (${items.length} items) -->
    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">${categoryName}</h2>
        <div class="grid grid-flow-col auto-cols-[320px] ${gridRowsClass} gap-5 overflow-x-auto pb-4 hide-scrollbar">
${cards}
        </div>
    </section>`;
}

// Generate the full content HTML
function generateContent() {
  const categories = [
    'New Products',
    'New Features',
    'New Technologies',
    'Others'
  ];

  const categorySections = categories.map(category => {
    return generateCategorySection(category, categorized[category] || []);
  }).filter(section => section !== '').join('\n\n');

  return `<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">${navDateRange}</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">${navDateRange}, ${year}</div>
        </div>
    </nav>
</aside>

<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">${fullDateRange}</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>

${categorySections}

</main>`;
}

// Write the content.html file
const outputPath = path.join(__dirname, 'content.html');
const content = generateContent();
fs.writeFileSync(outputPath, content, 'utf8');

console.log(`Generated content.html with ${categorized['New Products']?.length || 0} New Products, ${categorized['New Features']?.length || 0} New Features, ${categorized['New Technologies']?.length || 0} New Technologies, and ${categorized['Others']?.length || 0} Others items.`);
