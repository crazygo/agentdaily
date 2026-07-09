const fs = require('fs');

// Read the categorized data
const rawData = fs.readFileSync('categorized_week_data.json', 'utf8');
// Extract JSON portion (before SUMMARY)
const jsonEnd = rawData.lastIndexOf('}');
const jsonOnly = rawData.substring(0, jsonEnd + 1);
const categorized = JSON.parse(jsonOnly);

// Helper to format date (e.g., "Jul 9")
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Helper to determine grid rows class
function getGridRowsClass(count) {
  if (count <= 3) return 'grid-rows-1';
  if (count <= 8) return 'grid-rows-2';
  return 'grid-rows-3';
}

// Start building content fragment
let html = `<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Jul 3 - Jul 9</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">Jul 3 - Jul 9, 2026</div>
        </div>
    </nav>
</aside>

<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">Jul 3, 2026 – Jul 9, 2026</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>
`;

// Category order
const categoryOrder = ['New Products', 'New Features', 'New Technologies', 'Others'];

// Generate each category section
for (const category of categoryOrder) {
  const items = categorized[category] || [];

  if (items.length === 0) continue;

  const gridRowsClass = getGridRowsClass(items.length);

  html += `    <!-- ${category} Section (${items.length} items) -->
    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">${category}</h2>
        <div class="grid grid-flow-col auto-cols-[320px] ${gridRowsClass} gap-5 overflow-x-auto pb-4 hide-scrollbar">
`;

  for (const item of items) {
    const extracted = item._extracted;
    const title = extracted.title;
    const description = extracted.description;
    const url = extracted.url;
    const date = formatDate(extracted.date);
    const source = extracted.source;

    html += `            <a href="${url}" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
                <div>
                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">${title}</h3>
                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">${description}</p>
                </div>
                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
                    <span class="font-medium">${date}</span>
                    <span>${source}</span>
                </div>
            </a>
`;
  }

  html += `        </div>
    </section>

`;
}

html += `</main>`;

// Write to content.html
fs.writeFileSync('content.html', html);

console.log('Generated content.html successfully!');
console.log('\nCategory summary:');
for (const cat of categoryOrder) {
  const count = categorized[cat] ? categorized[cat].length : 0;
  console.log(`  ${cat}: ${count} items`);
}
