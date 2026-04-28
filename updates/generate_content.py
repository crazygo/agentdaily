#!/usr/bin/env python3
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict

# Read all JSON files from the 7-day window
def read_all_data():
    all_items = []

    # Days to process (2026-04-22 to 2026-04-28)
    dates = [
        "2026-04-22", "2026-04-23", "2026-04-24", "2026-04-25",
        "2026-04-26", "2026-04-27", "2026-04-28"
    ]

    for date in dates:
        base_path = f"/home/runner/work/agentdaily/agentdaily/updates/{date}"

        # Read insights.json
        try:
            with open(f"{base_path}/insights.json", 'r') as f:
                data = json.load(f)
                for item in data:
                    item['_source_date'] = date
                    all_items.append(item)
        except:
            pass

        # Read new-product.json
        try:
            with open(f"{base_path}/new-product.json", 'r') as f:
                data = json.load(f)
                for item in data:
                    item['_source_date'] = date
                    all_items.append(item)
        except:
            pass

        # Read whitelist-updates.json
        try:
            with open(f"{base_path}/whitelist-updates.json", 'r') as f:
                data = json.load(f)
                for item in data:
                    item['_source_date'] = date
                    all_items.append(item)
        except:
            pass

    return all_items

def categorize_item(item):
    """Categorize an item into one of 4 categories"""
    title = item.get('title', item.get('name', '')).lower()
    description = item.get('description', '').lower()
    combined = (title + ' ' + description).lower()

    # Check for update keywords - if it's about updates to existing tools
    update_keywords = ['update', 'release', 'version', 'v2.', 'v3.', 'v4.', 'v5.', 'integration', 'feature', 'changelog', 'improvement']
    is_update = any(kw in combined for kw in update_keywords)

    # Check for research/technology keywords
    tech_keywords = ['paper', 'research', 'arxiv', 'benchmark', 'evaluation', 'model', 'llm', 'tokenizer', 'architecture', 'framework', 'algorithm']
    is_tech = any(kw in combined for kw in tech_keywords)

    # Check for product keywords
    product_keywords = ['launch', 'announce', 'release', 'new', 'introducing', 'vscode', 'cli', 'agent', 'ide', 'app', 'platform', 'tool']
    is_product = any(kw in combined for kw in product_keywords)

    # Determine category
    if is_update and not is_tech:
        return 'New Features'
    elif is_tech and ('paper' in combined or 'arxiv' in combined or 'research' in combined):
        return 'New Technologies'
    elif is_product and not is_update:
        return 'New Products'
    elif is_tech:
        return 'New Technologies'
    else:
        return 'Others'

def deduplicate_items(items):
    """Remove duplicates based on URL or title"""
    seen = {}
    deduped = []

    for item in items:
        url = item.get('url', '')
        title = item.get('title', item.get('name', ''))

        # Create a key for deduplication
        key = url if url else title

        if key and key not in seen:
            seen[key] = item
            deduped.append(item)
        elif key:
            # Keep the newer version
            if item.get('_source_date', '') >= seen[key].get('_source_date', ''):
                deduped.remove(seen[key])
                seen[key] = item
                deduped.append(item)

    return deduped

def format_date(date_str):
    """Format date for display"""
    if not date_str:
        return ""

    # Handle various date formats
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        return dt.strftime('%b %d')
    except:
        return date_str

def get_source(item):
    """Extract source from item"""
    if 'source' in item:
        return item['source']
    if 'author' in item:
        # Extract source from author if it contains '/'
        author = item['author']
        if ' / ' in author:
            return author.split(' / ')[1]
        return author.split(' ')[0] if author else ''
    return ''

def main():
    # Read all data
    items = read_all_data()

    # Deduplicate
    items = deduplicate_items(items)

    # Categorize
    categories = {
        'New Products': [],
        'New Features': [],
        'New Technologies': [],
        'Others': []
    }

    for item in items:
        category = categorize_item(item)
        categories[category].append(item)

    # Generate HTML
    html = generate_html(categories)

    # Write to file
    with open('/home/runner/work/agentdaily/agentdaily/updates/content.html', 'w') as f:
        f.write(html)

    print(f"Generated content.html with {len(items)} items")
    for cat, items in categories.items():
        print(f"  {cat}: {len(items)} items")

def generate_html(categories):
    # Calculate grid row classes
    def get_grid_class(count):
        if count <= 3:
            return 'grid-rows-1'
        elif count <= 8:
            return 'grid-rows-2'
        else:
            return 'grid-rows-3'

    html = '''<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Apr 22 - Apr 28</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">Apr 22 - Apr 28, 2026</div>
        </div>
    </nav>
</aside>

<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">Apr 22, 2026 – Apr 28, 2026</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>
'''

    # Category order
    category_order = ['New Products', 'New Features', 'New Technologies', 'Others']

    for category in category_order:
        items = categories[category]
        if not items:
            continue

        grid_class = get_grid_class(len(items))

        html += f'''
    <!-- {category} Section -->
    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">{category}</h2>
        <div class="grid grid-flow-col auto-cols-[320px] {grid_class} gap-5 overflow-x-auto pb-4 hide-scrollbar">
'''

        for item in items:
            title = item.get('title', item.get('name', item.get('productName', '')))
            description = item.get('description', '')
            url = item.get('url', '#')

            # Get date from item or source_date
            date = item.get('published_date', item.get('date', item.get('release_date', item.get('_source_date', ''))))
            date_display = format_date(date)

            source = get_source(item)

            html += f'''
            <a href="{url}" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
                <div>
                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">{title}</h3>
                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">{description}</p>
                </div>
                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
                    <span class="font-medium">{date_display}</span>
                    <span>{source}</span>
                </div>
            </a>'''

        html += '''
        </div>
    </section>
'''

    html += '</main>'

    return html

if __name__ == '__main__':
    main()
