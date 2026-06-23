const fs = require('fs');
const path = require('path');

// Read the categorized data
const data = JSON.parse(fs.readFileSync('categorized_week_data.json', 'utf8'));

// Helper function to format date (Jun 17 -> Jun 17)
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Helper function to get grid rows class
function getGridRowsClass(count) {
  if (count <= 3) return 'grid-rows-1';
  if (count <= 8) return 'grid-rows-2';
  return 'grid-rows-3';
}

// Helper function to escape HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Generate card HTML
function generateCard(item) {
  return `
            <a href="${escapeHtml(item.url)}" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
                <div>
                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">${escapeHtml(item.title)}</h3>
                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">${escapeHtml(item.description)}</p>
                </div>
                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
                    <span class="font-medium">${formatDate(item.date)}</span>
                    <span>${escapeHtml(item.source)}</span>
                </div>
            </a>`;
}

// Start building HTML
let html = `<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Jun 17 - Jun 23</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">Jun 17 - Jun 23, 2026</div>
        </div>
    </nav>
</aside>

<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">Jun 17, 2026 – Jun 23, 2026</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>
`;

// Generate category sections
const categories = [
  { key: 'newProducts', title: 'New Products' },
  { key: 'newFeatures', title: 'New Features' },
  { key: 'newTechnologies', title: 'New Technologies' },
  { key: 'others', title: 'Others' }
];

categories.forEach(cat => {
  const items = data[cat.key];
  if (items.length === 0) return;

  html += `
    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">${cat.title}</h2>
        <div class="grid grid-flow-col auto-cols-[320px] ${getGridRowsClass(items.length)} gap-5 overflow-x-auto pb-4 hide-scrollbar">
`;

  items.forEach(item => {
    html += generateCard(item);
  });

  html += `
        </div>
    </section>
`;
});

html += `
</main>`;

// Write to content.html
fs.writeFileSync('content.html', html, 'utf8');

console.log('Generated content.html successfully!');
console.log(`Total items: ${data.newProducts.length + data.newFeatures.length + data.newTechnologies.length + data.others.length}`);
