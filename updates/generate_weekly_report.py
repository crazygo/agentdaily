#!/usr/bin/env python3
"""
Generate content.html for the weekly AI update report.
Aggregates 7 days of data, categorizes items, and renders the content fragment.
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

# Category definitions
CATEGORIES = {
    "New Products": "Complete new tools, apps, or agents",
    "New Features": "Updates to existing tools, improvements, v2.0 releases",
    "New Technologies": "Papers, underlying models, frameworks, research",
    "Others": "General news, industry commentary, miscellaneous"
}

def get_latest_date(updates_dir):
    """Find the latest date folder in the updates directory."""
    date_folders = [d for d in os.listdir(updates_dir) if d.startswith("20") and os.path.isdir(os.path.join(updates_dir, d))]
    date_folders.sort(reverse=True)
    return date_folders[0] if date_folders else None

def get_date_range(end_date_str, days=7):
    """Generate list of dates for the N-day range ending on end_date."""
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    start_date = end_date - timedelta(days=days-1)
    date_list = []
    current = start_date
    while current <= end_date:
        date_list.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    return date_list, start_date, end_date

def load_json_files(updates_dir, date_list):
    """Load all JSON files from the specified date folders."""
    all_items = []
    seen_urls = set()
    seen_titles = set()

    # Convert date_list to datetime objects for comparison
    date_objects = [datetime.strptime(d, "%Y-%m-%d") for d in date_list]
    min_date = min(date_objects)
    max_date = max(date_objects)

    for date_str in date_list:
        date_path = os.path.join(updates_dir, date_str)
        if not os.path.exists(date_path):
            continue

        # Find all JSON files in this date folder
        for filename in os.listdir(date_path):
            if not filename.endswith(".json"):
                continue

            filepath = os.path.join(date_path, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)

                # Handle different JSON structures
                items = []
                if isinstance(data, list):
                    items = data
                elif isinstance(data, dict):
                    # Extract from known dict structures
                    for key in ["insights", "newProducts", "whitelistUpdates", "items", "data"]:
                        if key in data and isinstance(data[key], list):
                            items.extend(data[key])

                # Process each item
                for item in items:
                    if not isinstance(item, dict):
                        continue

                    # Skip items without essential data (title or url)
                    if not item.get("title") and not item.get("url"):
                        continue

                    # Extract published_date for filtering
                    pub_date = item.get("published_date") or item.get("date") or ""

                    # Parse published_date to check if it's within our date range
                    if pub_date:
                        # Handle ISO datetime strings
                        if "T" in pub_date:
                            pub_date = pub_date.split("T")[0]

                        try:
                            pub_dt = datetime.strptime(pub_date, "%Y-%m-%d")
                            # Skip items outside our date range
                            if pub_dt < min_date or pub_dt > max_date:
                                continue
                        except ValueError:
                            # If we can't parse the date, include it anyway
                            pass

                    # Extract fields (handle various naming conventions)
                    url = item.get("url") or item.get("link") or item.get("source_url") or ""
                    title = item.get("title") or item.get("name") or item.get("headline") or ""

                    # Deduplication by URL or title
                    if url and url in seen_urls:
                        continue
                    if title and title in seen_titles:
                        continue

                    if url:
                        seen_urls.add(url)
                    if title:
                        seen_titles.add(title)

                    # Add date from folder if not present
                    if "published_date" not in item and "date" not in item:
                        item["folder_date"] = date_str

                    all_items.append(item)

            except (json.JSONDecodeError, IOError) as e:
                print(f"Warning: Could not load {filepath}: {e}")
                continue

    return all_items

def categorize_item(item):
    """
    Categorize an item into one of 4 categories based on content analysis.
    Returns the category name.
    """
    title = item.get("title", "").lower()
    description = item.get("description", "").lower()
    content = f"{title} {description}"

    # Extract metadata
    item_type = item.get("type", "").lower()
    source = item.get("source", "").lower()
    topics = " ".join(item.get("topics", [])).lower()

    all_text = f"{content} {item_type} {source} {topics}"

    # New Products (complete new tools/apps/agents)
    # Keywords indicating new standalone products/launches
    product_keywords = [
        "launch", "released", "new app", "new tool", "introducing", "announces",
        "available now", "product", "platform", "service", "startup", "founded",
        "beta launch", "public launch", "introduces", "unveils", "debuts"
    ]

    # Check for strong product indicators
    for kw in product_keywords:
        if kw in all_text:
            # But exclude if it's clearly a feature update
            if not any(w in all_text for w in ["update to", "version 2", "v2.0", "now supports", "feature"]):
                # Additional checks to avoid false positives
                if any(w in all_text for w in ["ai agent", "coding agent", "assistant", "app", "tool", "platform"]):
                    return "New Products"

    # New Technologies (papers, models, frameworks, research)
    tech_keywords = [
        "paper", "arxiv", "research", "model", "framework", "benchmark",
        "algorithm", "architecture", "dataset", "technical", "study",
        "proposes", "introduces a", "presents", "advances", "breakthrough"
    ]

    for kw in tech_keywords:
        if kw in all_text:
            # Specifically papers and research
            if "arxiv" in all_text or "paper" in all_text or "research" in all_text:
                return "New Technologies"
            # Models and frameworks
            if any(w in all_text for w in ["model", "framework", "benchmark"]):
                # But exclude if it's just using a model (not introducing one)
                if not any(w in all_text for w in ["using", "with", "powered by"]):
                    return "New Technologies"

    # New Features (updates, improvements, new capabilities)
    feature_keywords = [
        "update", "upgrade", "feature", "improvement", "enhancement",
        "now available in", "adds", "integrates", "version 2", "v2.", "v3.",
        "improves", "better", "faster", "optimized", "support for", "now supports"
    ]

    for kw in feature_keywords:
        if kw in all_text:
            # Make sure it's about existing tools getting updates
            if any(w in all_text for w in ["now", "adds", "update", "version", "feature", "improves"]):
                return "New Features"

    # Default to Others for news, opinion, discussion
    if any(w in all_text for w in ["news", "report", "opinion", "discussion", "blog", "podcast", "commentary"]):
        return "Others"

    # If unclear, use source and type as hints
    if item_type in ["news", "opinion", "discussion"]:
        return "Others"
    if item_type == "technical":
        # Technical content is usually New Technologies
        return "New Technologies"
    if item_type == "tutorial":
        # Tutorials could be either New Technologies or Others
        if any(w in all_text for w in ["paper", "model", "framework", "research"]):
            return "New Technologies"
        return "Others"

    # Final fallback
    return "Others"

def format_date(date_str):
    """Format date string to 'Mon DD' format."""
    if not date_str:
        return ""

    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%b %d")
    except ValueError:
        return date_str

def get_display_date(item):
    """Extract and format the display date from an item."""
    # Try published_date first
    date_str = item.get("published_date") or item.get("date") or item.get("folder_date", "")

    # Handle ISO datetime strings
    if "T" in date_str:
        date_str = date_str.split("T")[0]

    return format_date(date_str)

def render_sidebar(start_date, end_date):
    """Render the left sidebar navigation."""
    start_fmt = start_date.strftime("%b %d")
    end_fmt = end_date.strftime("%b %d")
    year = end_date.strftime("%Y")

    return f'''<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">{start_fmt} - {end_fmt}</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">{start_fmt}, {year} – {end_fmt}, {year}</div>
        </div>
    </nav>
</aside>'''

def render_card(item):
    """Render a single card HTML."""
    url = item.get("url") or item.get("link") or "#"
    title = item.get("title") or item.get("name") or item.get("headline") or "Untitled"
    description = item.get("description") or item.get("summary") or item.get("content") or ""

    # Truncate description to ~200 chars
    if len(description) > 200:
        description = description[:197] + "..."

    source = item.get("source") or item.get("author") or "Unknown"
    display_date = get_display_date(item)

    # Escape HTML entities
    title = title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    description = description.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    return f'''            <a href="{url}" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
                <div>
                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">{title}</h3>
                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">{description}</p>
                </div>
                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
                    <span class="font-medium">{display_date}</span>
                    <span>{source}</span>
                </div>
            </a>'''

def get_grid_rows_class(count):
    """Return the appropriate grid-rows class based on item count."""
    if count <= 3:
        return "grid-rows-1"
    elif count <= 8:
        return "grid-rows-2"
    else:
        return "grid-rows-3"

def render_category_section(category, items):
    """Render a category section with its cards."""
    grid_class = get_grid_rows_class(len(items))

    cards_html = "\n".join(render_card(item) for item in items)

    return f'''    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">{category}</h2>
        <div class="grid grid-flow-col auto-cols-[320px] {grid_class} gap-5 overflow-x-auto pb-4 hide-scrollbar">
{cards_html}
        </div>
    </section>'''

def render_main_content(start_date, end_date, categorized_items):
    """Render the main content area."""
    start_fmt = start_date.strftime("%b %d, %Y")
    end_fmt = end_date.strftime("%b %d, %Y")

    header = f'''    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">{start_fmt} – {end_fmt}</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>
'''

    # Render each category section
    category_order = ["New Products", "New Features", "New Technologies", "Others"]
    sections = []

    for category in category_order:
        items = categorized_items.get(category, [])
        if items:  # Only render non-empty categories
            sections.append(render_category_section(category, items))

    sections_html = "\n".join(sections)

    return f'''<main class="min-w-0">
{header}
{sections_html}
</main>'''

def generate_content_html(updates_dir, output_file):
    """Main function to generate content.html."""
    # Get date range
    latest_date = get_latest_date(updates_dir)
    if not latest_date:
        print("Error: No date folders found")
        return False

    date_list, start_date, end_date = get_date_range(latest_date, days=7)
    print(f"Processing week: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")

    # Load all data
    all_items = load_json_files(updates_dir, date_list)
    print(f"Loaded {len(all_items)} items")

    if not all_items:
        print("Warning: No items found")
        # Still generate empty content
        all_items = []

    # Categorize items
    categorized = defaultdict(list)
    for item in all_items:
        category = categorize_item(item)
        categorized[category].append(item)

    # Print categorization summary
    for cat, items in categorized.items():
        print(f"  {cat}: {len(items)} items")

    # Render content
    sidebar_html = render_sidebar(start_date, end_date)
    main_html = render_main_content(start_date, end_date, categorized)

    # Combine and write
    full_content = f"{sidebar_html}\n\n{main_html}"

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(full_content)

    print(f"Generated {output_file}")
    return True

if __name__ == "__main__":
    script_dir = Path(__file__).parent
    updates_dir = script_dir
    output_file = script_dir / "content.html"

    generate_content_html(str(updates_dir), str(output_file))
