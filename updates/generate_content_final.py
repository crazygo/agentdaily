#!/usr/bin/env python3
"""Generate content.html from aggregated weekly data"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

# Categories
CATEGORIES = {
    "New Products": [],
    "New Features": [],
    "New Technologies": [],
    "Others": []
}

def categorize_item(item):
    """Categorize an item based on its title and description"""
    title = item.get("name", item.get("title", "")).lower()
    description = item.get("description", "").lower()
    combined = f"{title} {description}"

    # Determine source name
    sources = item.get("sources", item.get("source", ""))
    if isinstance(sources, list):
        source_name = sources[0] if sources else "Unknown"
    else:
        source_name = sources if sources else "Unknown"

    # Create unified item structure
    unified_item = {
        "title": item.get("name", item.get("title", "")),
        "description": item.get("description", ""),
        "url": item.get("url", ""),
        "date": item.get("release_date", item.get("published_date", "")),
        "source": source_name,
        "category_hint": item.get("category", "")
    }

    # New Technologies: Papers, models, frameworks, research
    if any(term in combined for term in [
        "paper", "arxiv", "research", "benchmark", "dataset", "iclr", "icml", "neurips",
        "transformer", "quantization", "compression", "optimization",
        "swe-bench", "livecodebench", "humanEval", "code bench",
        "k2.7", "k2.6", "fable 5", "mythos 5", "glm-5.2", "gpt-5.5", "gpt-5.6",
        "mixture-of-experts", "moe", "model release", "open weights", "llm",
        "framework", "library", "architecture"
    ]):
        # But exclude if it's clearly a product/tool
        if not any(term in combined for term in [
            "cli", "agent", "ide", "tool", "desktop", "terminal", "coding agent"
        ]):
            CATEGORIES["New Technologies"].append(unified_item)
            return

    # New Products: Complete new tools, apps, agents
    if any(term in combined for term in [
        "launch", "released", "announced", "introduces", "unveiled",
        "coding agent", "ai agent", "cli", "terminal", "desktop app", "ide",
        "platform", "startup", "product hunt", "yc ", "y combinator",
        "open-source", "mit licensed", "new tool", "new agent"
    ]):
        # Check if it's a new product or a feature update
        if any(term in combined for term in [
            "version", "update", "upgrade", "beta", "v2.", "v3.", "3.8", "27 ",
            "now includes", "adds", "extends", "enhanced", "improved"
        ]):
            CATEGORIES["New Features"].append(unified_item)
        else:
            CATEGORIES["New Products"].append(unified_item)
        return

    # New Features: Updates, improvements, new versions
    if any(term in combined for term in [
        "update", "upgrade", "version", "beta", "adds", "now includes",
        "enhanced", "improved", "extends", "feature", "capability"
    ]):
        CATEGORIES["New Features"].append(unified_item)
        return

    # Default to Others
    CATEGORIES["Others"].append(unified_item)

def format_date(date_str):
    """Format date string to display format"""
    if not date_str:
        return ""

    try:
        date_obj = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return date_obj.strftime("%b %d")
    except:
        try:
            # Try YYYY-MM-DD format
            date_obj = datetime.strptime(date_str.split("T")[0], "%Y-%m-%d")
            return date_obj.strftime("%b %d")
        except:
            return date_str

def deduplicate_items(items):
    """Remove duplicates based on URL or title"""
    seen = set()
    unique_items = []
    for item in items:
        key = (item.get("url", ""), item.get("title", "").lower())
        if key not in seen:
            seen.add(key)
            unique_items.append(item)
    return unique_items

def load_all_data():
    """Load all data from the 7-day window"""
    base_dir = Path(".")
    all_items = []

    # The latest date is 2026-06-25, so we process June 19-25
    dates = [
        "2026-06-19", "2026-06-20", "2026-06-21", "2026-06-22",
        "2026-06-23", "2026-06-24", "2026-06-25"
    ]

    for date in dates:
        date_dir = base_dir / date
        if not date_dir.exists():
            continue

        # Load new-product.json
        product_file = date_dir / "new-product.json"
        if product_file.exists():
            try:
                with open(product_file, 'r') as f:
                    products = json.load(f)
                    for p in products:
                        all_items.append(p)
            except Exception as e:
                print(f"Error loading {product_file}: {e}")

        # Load insights.json
        insights_file = date_dir / "insights.json"
        if insights_file.exists():
            try:
                with open(insights_file, 'r') as f:
                    insights = json.load(f)
                    for i in insights:
                        # Transform insights to match product structure
                        all_items.append({
                            "name": i.get("title", ""),
                            "description": i.get("description", ""),
                            "url": i.get("url", ""),
                            "release_date": i.get("published_date", ""),
                            "category": i.get("type", ""),
                            "sources": [i.get("source", "Unknown")]
                        })
            except Exception as e:
                print(f"Error loading {insights_file}: {e}")

    return all_items

def generate_grid_rows_class(count):
    """Determine grid rows class based on item count"""
    if count <= 3:
        return "grid-rows-1"
    elif 4 <= count <= 8:
        return "grid-rows-2"
    else:
        return "grid-rows-3"

def render_card(item):
    """Render a single card HTML"""
    return f'''    <a href="{item['url']}" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
        <div>
            <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">{item['title']}</h3>
            <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">{item['description'][:300]}</p>
        </div>
        <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
            <span class="font-medium">{format_date(item['date'])}</span>
            <span>{item['source']}</span>
        </div>
    </a>'''

def render_category(category_name, items):
    """Render a category section"""
    if not items:
        return ""

    grid_rows_class = generate_grid_rows_class(len(items))
    cards_html = "\n".join([render_card(item) for item in items])

    return f'''    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">{category_name}</h2>
        <div class="grid grid-flow-col auto-cols-[320px] {grid_rows_class} gap-5 overflow-x-auto pb-4 hide-scrollbar">
{cards_html}
        </div>
    </section>
'''

def generate_html():
    """Generate the complete content.html"""
    # Load all data
    all_items = load_all_data()
    print(f"Loaded {len(all_items)} items")

    # Categorize items
    for item in all_items:
        categorize_item(item)

    # Deduplicate within categories
    for cat_name in CATEGORIES:
        CATEGORIES[cat_name] = deduplicate_items(CATEGORIES[cat_name])
        print(f"{cat_name}: {len(CATEGORIES[cat_name])} items")

    # Start HTML
    html = '''<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Jun 19 - Jun 25</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">Jun 19 - Jun 25, 2026</div>
        </div>
    </nav>
</aside>

<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">Jun 19, 2026 – Jun 25, 2026</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>
'''

    # Render categories
    for cat_name in ["New Products", "New Features", "New Technologies", "Others"]:
        if CATEGORIES[cat_name]:
            html += render_category(cat_name, CATEGORIES[cat_name])

    html += '</main>'

    # Write to file
    output_file = Path("content.html")
    with open(output_file, 'w') as f:
        f.write(html)

    print(f"\nGenerated {output_file}")
    return html

if __name__ == "__main__":
    generate_html()
