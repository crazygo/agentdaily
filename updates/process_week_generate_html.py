#!/usr/bin/env python3
"""
Process the latest 7-day window of data and generate content.html
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
import re

def get_latest_date_folders(base_path, days=7):
    """Get the latest 7 days of date folders"""
    all_folders = []
    for item in os.listdir(base_path):
        item_path = os.path.join(base_path, item)
        if os.path.isdir(item_path) and re.match(r'\d{4}-\d{2}-\d{2}', item):
            try:
                date_obj = datetime.strptime(item, '%Y-%m-%d')
                all_folders.append((item, date_obj))
            except ValueError:
                continue

    # Sort by date descending
    all_folders.sort(key=lambda x: x[1], reverse=True)

    # Get the latest date and calculate 7-day window
    if not all_folders:
        return []

    latest_date = all_folders[0][1]
    start_date = latest_date - timedelta(days=6)

    # Filter folders within the 7-day window
    selected_folders = [
        folder for folder, date in all_folders
        if start_date <= date <= latest_date
    ]

    return sorted(selected_folders)

def extract_json_items(folder_path):
    """Extract all items from JSON files in a folder"""
    items = []
    try:
        for filename in os.listdir(folder_path):
            if filename.endswith('.json'):
                file_path = os.path.join(folder_path, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            items.extend(data)
                        elif isinstance(data, dict):
                            items.append(data)
                except Exception as e:
                    print(f"Error reading {filename}: {e}")
    except Exception as e:
        print(f"Error scanning {folder_path}: {e}")
    return items

def get_field_value(item, field_names):
    """Try to get a value from multiple possible field names"""
    for field in field_names:
        if field in item and item[field]:
            return item[field]
    return None

def categorize_item(item):
    """Categorize an item based on title and description"""
    title = get_field_value(item, ['title', 'name', 'headline']) or ''
    description = get_field_value(item, ['description', 'summary', 'content', 'text']) or ''
    combined_text = f"{title} {description}".lower()

    # Category: New Technologies (papers, models, frameworks, research)
    tech_keywords = ['paper', 'research', 'model', 'framework', 'llm', 'gpt', 'algorithm',
                     'architecture', 'training', 'dataset', 'open source', 'release',
                     'announcement', 'api', 'sdk', 'library', 'benchmark']
    if any(kw in combined_text for kw in tech_keywords):
        # But exclude if it's clearly a product launch
        product_keywords = ['launch', 'product', 'tool', 'app', 'platform', 'service']
        if not any(kw in combined_text for kw in product_keywords):
            return 'New Technologies'

    # Category: New Products (complete new tools, apps, agents)
    if any(kw in combined_text for kw in ['launch', 'new', 'release', 'introducing', 'announcing']):
        if any(kw in combined_text for kw in ['product', 'tool', 'app', 'agent', 'platform', 'service']):
            return 'New Products'

    # Category: New Features (updates to existing tools)
    if any(kw in combined_text for kw in ['update', 'feature', 'improvement', 'upgrade', 'enhancement',
                                          'version', 'v2', 'v3', 'now available', 'adds']):
        return 'New Features'

    # Default to Others
    return 'Others'

def aggregate_and_deduplicate(folders, base_path):
    """Aggregate items from all folders and deduplicate"""
    all_items = []
    seen_urls = set()
    seen_titles = set()

    for folder_name in folders:
        folder_path = os.path.join(base_path, folder_name)
        items = extract_json_items(folder_path)

        for item in items:
            # Extract URL and title
            url = get_field_value(item, ['url', 'href', 'link', 'source_url'])
            title = get_field_value(item, ['title', 'name', 'headline'])

            if not url or not title:
                continue

            # Deduplicate
            if url in seen_urls or title in seen_titles:
                continue

            seen_urls.add(url)
            seen_titles.add(title)

            # Add folder date to item
            item['folder_date'] = folder_name
            all_items.append(item)

    return all_items

def format_date(folder_name):
    """Format date folder name to display date"""
    try:
        date_obj = datetime.strptime(folder_name, '%Y-%m-%d')
        return date_obj.strftime('%b %d')
    except:
        return folder_name

def extract_source(item):
    """Extract source name from item"""
    # Try to get from various fields
    source = get_field_value(item, ['source', 'domain', 'site', 'publisher'])
    if not source:
        # Extract from URL
        url = get_field_value(item, ['url', 'href', 'link'])
        if url:
            try:
                from urllib.parse import urlparse
                domain = urlparse(url).netloc
                source = domain.replace('www.', '').split('.')[0].capitalize()
            except:
                source = 'Source'
        else:
            source = 'Source'
    return source

def generate_html(items):
    """Generate the content.html fragment"""
    # Categorize items
    categorized = {
        'New Products': [],
        'New Features': [],
        'New Technologies': [],
        'Others': []
    }

    for item in items:
        category = categorize_item(item)
        categorized[category].append(item)

    # Calculate date range
    if items:
        dates = sorted([item['folder_date'] for item in items])
        start_date = dates[0]
        end_date = dates[-1]
    else:
        start_date = datetime.now().strftime('%Y-%m-%d')
        end_date = start_date

    # Parse dates for display
    start_dt = datetime.strptime(start_date, '%Y-%m-%d')
    end_dt = datetime.strptime(end_date, '%Y-%m-%d')
    display_start = start_dt.strftime('%b %d')
    display_end = end_dt.strftime('%b %d')
    year = end_dt.year

    # Generate HTML
    html_parts = []

    # Sidebar
    html_parts.append('<aside class="lg:sticky lg:top-10">')
    html_parts.append('    <div class="mb-4">')
    html_parts.append(f'        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">{display_start} - {display_end}</div>')
    html_parts.append('    </div>')
    html_parts.append('    <nav class="flex flex-col">')
    html_parts.append('        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">')
    html_parts.append('            <div class="font-medium mb-1">This Week</div>')
    html_parts.append(f'            <div class="text-xs text-[#6B6B6B]">{display_start} - {display_end}, {year}</div>')
    html_parts.append('        </div>')
    html_parts.append('    </nav>')
    html_parts.append('</aside>')

    # Main content
    html_parts.append('')
    html_parts.append('<main class="min-w-0">')
    html_parts.append('    <div class="mb-12">')
    html_parts.append('        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>')
    html_parts.append(f'        <p class="text-xl text-[#292929] mb-4 font-normal">{display_start}, {year} – {display_end}, {year}</p>')
    html_parts.append('        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>')
    html_parts.append('    </div>')

    # Category sections
    categories_order = ['New Products', 'New Features', 'New Technologies', 'Others']

    for category in categories_order:
        category_items = categorized[category]
        if not category_items:
            continue

        # Determine grid rows class
        n = len(category_items)
        if n <= 3:
            grid_rows_class = 'grid-rows-1'
        elif 4 <= n <= 8:
            grid_rows_class = 'grid-rows-2'
        else:
            grid_rows_class = 'grid-rows-3'

        html_parts.append('')
        html_parts.append(f'    <!-- {category} Section ({n} items) -->')
        html_parts.append('    <section class="mb-16">')
        html_parts.append(f'        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">{category}</h2>')
        html_parts.append(f'        <div class="grid grid-flow-col auto-cols-[320px] {grid_rows_class} gap-5 overflow-x-auto pb-4 hide-scrollbar">')

        # Generate cards
        for item in category_items:
            title = get_field_value(item, ['title', 'name', 'headline']) or 'Untitled'
            description = get_field_value(item, ['description', 'summary', 'content', 'text']) or 'No description available.'
            url = get_field_value(item, ['url', 'href', 'link', 'source_url']) or '#'
            date = format_date(item.get('folder_date', ''))
            source = extract_source(item)

            html_parts.append('            <a href="' + url + '" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">')
            html_parts.append('                <div>')
            html_parts.append('                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">' + title + '</h3>')
            html_parts.append('                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">' + description + '</p>')
            html_parts.append('                </div>')
            html_parts.append('                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">')
            html_parts.append('                    <span class="font-medium">' + date + '</span>')
            html_parts.append('                    <span>' + source + '</span>')
            html_parts.append('                </div>')
            html_parts.append('            </a>')

        html_parts.append('        </div>')
        html_parts.append('    </section>')

    html_parts.append('')
    html_parts.append('</main>')

    return '\n'.join(html_parts)

def main():
    # Paths
    base_path = '/home/runner/work/agentdaily/agentdaily/updates'
    output_file = '/home/runner/work/agentdaily/agentdaily/updates/content.html'

    # Get latest 7 days of folders
    print("Fetching latest 7 days of data...")
    folders = get_latest_date_folders(base_path, days=7)
    print(f"Found folders: {folders}")

    if not folders:
        print("No folders found!")
        return

    # Aggregate and deduplicate
    print("Aggregating items from folders...")
    items = aggregate_and_deduplicate(folders, base_path)
    print(f"Total unique items: {len(items)}")

    # Generate HTML
    print("Generating HTML...")
    html_content = generate_html(items)

    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"Generated content.html with {len(items)} items")
    print(f"Output file: {output_file}")

    # Print category summary
    categorized = {
        'New Products': 0,
        'New Features': 0,
        'New Technologies': 0,
        'Others': 0
    }
    for item in items:
        category = categorize_item(item)
        categorized[category] += 1

    print("\nCategory breakdown:")
    for category, count in categorized.items():
        print(f"  {category}: {count}")

if __name__ == '__main__':
    main()
