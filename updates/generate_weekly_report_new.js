const fs = require('fs');
const path = require('path');

// Latest date is 2026-08-19
const latestDate = '2026-08-19';
const startDate = '2026-08-13';

// Get all dates in range
function getDateRange(start, end) {
    const dates = [];
    const current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

const dates = getDateRange(startDate, latestDate);
console.log(`Processing dates: ${dates.join(', ')}`);

// Aggregate all items from all JSON files
const allItems = [];
const seenUrls = new Set();

dates.forEach(date => {
    const dirPath = path.join(__dirname, date);
    if (!fs.existsSync(dirPath)) {
        console.log(`Directory not found: ${dirPath}`);
        return;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json') && !f.includes('logs') && !f.includes('run-logs'));

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

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

            items.forEach(item => {
                const url = item.url || item.link || item.source_url;
                if (url && !seenUrls.has(url)) {
                    seenUrls.add(url);
                    allItems.push({
                        ...item,
                        _date: date,
                        _source: file
                    });
                }
            });
        } catch (e) {
            console.log(`Error reading ${filePath}:`, e.message);
        }
    });
});

console.log(`Total unique items: ${allItems.length}`);

// Categorize items using AI logic
function categorizeItem(item) {
    const title = (item.name || item.title || '').toLowerCase();
    const desc = (item.description || item.summary || item.content || '').toLowerCase();
    const text = `${title} ${desc}`;

    // New Technologies (papers, models, frameworks, research)
    if (text.includes('paper') || text.includes('research') || text.includes('model') ||
        text.includes('framework') || text.includes('llm') || text.includes('transformer') ||
        text.includes('architecture') || text.includes('dataset') ||
        text.includes('open source') && (text.includes('model') || text.includes('framework')) ||
        text.includes('algorithm') || text.includes('training') ||
        text.includes('gpt') || text.includes('bert') || text.includes('embedding') ||
        text.includes('meta-learning') || text.includes('reinforcement learning') ||
        text.includes('computer vision') || text.includes('nlp') && text.includes('model')) {
        return 'New Technologies';
    }

    // New Features (updates, improvements, v2, enhancements)
    if (text.includes('update') || text.includes('v2') || text.includes('v3') ||
        text.includes('new feature') || text.includes('enhancement') ||
        text.includes('improvement') || text.includes('upgrade') ||
        text.includes('now supports') || text.includes('adds') && text.includes('support') ||
        text.includes('release') && (text.includes('update') || text.includes('upgrade')) ||
        text.includes('better') || text.includes('faster') && text.includes('now') ||
        text.includes('integrates') || text.includes('integration')) {
        return 'New Features';
    }

    // New Products (complete tools, apps, agents, launches)
    if (text.includes('launch') || text.includes('released') && !text.includes('update') ||
        text.includes('new') && (text.includes('app') || text.includes('tool') || text.includes('platform') || text.includes('agent') || text.includes('service')) ||
        text.includes('agent') || text.includes('tool') ||
        text.includes('platform') || text.includes('application') ||
        text.includes('startup') || text.includes('yc ') || text.includes('y combinator') ||
        text.includes('product hunt') || text.includes('beta') && !text.includes('update') ||
        text.includes('ai assistant') || text.includes('ai coding') ||
        text.includes('software') || text.includes('saas')) {
        return 'New Products';
    }

    // Others
    return 'Others';
}

// Categorize all items
const categories = {
    'New Products': [],
    'New Features': [],
    'New Technologies': [],
    'Others': []
};

allItems.forEach(item => {
    const category = categorizeItem(item);
    categories[category].push(item);
});

console.log('\nCategory counts:');
Object.entries(categories).forEach(([cat, items]) => {
    console.log(`${cat}: ${items.length}`);
});

// Generate HTML content
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

function getGridRowsClass(count) {
    if (count <= 3) return 'grid-rows-1';
    if (count <= 8) return 'grid-rows-2';
    return 'grid-rows-3';
}

function extractSource(item) {
    if (item.sources && Array.isArray(item.sources) && item.sources[0]) {
        return item.sources[0];
    }
    if (item.source) return item.source;
    if (item.published_source) return item.published_source;
    if (item.url) {
        try {
            const hostname = new URL(item.url).hostname.replace('www.', '');
            return hostname;
        } catch {
            return 'Web';
        }
    }
    return 'Unknown';
}

let html = `<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Aug 13 - Aug 19</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">Aug 13 - Aug 19, 2026</div>
        </div>
    </nav>
</aside>

<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">Aug 13, 2026 – Aug 19, 2026</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>
`;

// Category order
const categoryOrder = ['New Products', 'New Features', 'New Technologies', 'Others'];

categoryOrder.forEach(categoryName => {
    const items = categories[categoryName];
    if (items.length === 0) return;

    html += `    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">${categoryName}</h2>
        <div class="grid grid-flow-col auto-cols-[320px] ${getGridRowsClass(items.length)} gap-5 overflow-x-auto pb-4 hide-scrollbar">
`;

    items.forEach(item => {
        const title = item.name || item.title || 'Untitled';
        const description = item.description || item.summary || item.content || item.text || '';
        const url = item.url || item.link || item.source_url || '#';
        const date = formatDate(item._date);
        const source = extractSource(item);

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
    });

    html += `        </div>
    </section>
`;
});

html += `</main>`;

// Write output
const outputPath = path.join(__dirname, 'content.html');
fs.writeFileSync(outputPath, html);
console.log(`\nGenerated ${outputPath}`);
console.log(`Run: node templates/merge.js`);
