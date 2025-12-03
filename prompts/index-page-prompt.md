# Generate /updates/content.html (Weekly Report Content Fragment)

Task: Generate the content fragment that will be merged with the static framework to create the final index page. The framework handles all CSS and page structure - you only generate the dynamic content portion.

## Context
- **Site root**: `/updates`
- **Manifest file**: Located at `/updates/manifest.json`
- **Output file**: `/updates/content.html` (content fragment only)
- **Framework**: `/templates/framework.html` (static, DO NOT modify)
- **Build script**: Run `node templates/merge.js` after generating content.html
- **Final output**: `/updates/index.html`
- **Language**: All generated content must be in **English**.

## Framework & Build Process
- **Framework File** (`/templates/framework.html`) contains:
  - Tailwind CSS (via CDN)
  - Global site header (title, tagline, GitHub link)
  - Two-column grid wrapper
  - All styling handled by Tailwind utility classes
- **Your Output**: `/updates/content.html` (content fragment only, NOT full HTML)
- **Build**: After generating content.html, run `node templates/merge.js` to create final index.html
- **Important**: DO NOT generate `<html>`, `<head>`, `<body>`, `<style>`, or `<script>` tags. Only generate the content fragment.

## 1. Data Processing Logic (Crucial)

**Step 1: Determine Time Window**
1. Identify the latest date folder in `/updates/` (e.g., `2025-11-26`).
2. Define the **Current Group** as the 7-day range ending on that date (e.g., `2025-11-20` to `2025-11-26`).
3. **Only process this single group.** Do not render older weeks.

**Step 2: Data Aggregation (File Agnostic)**
1. Iterate through every date folder within the Current Group.
2. Inside each folder, **scan ALL `.json` files** (do NOT look for `data.json` specifically; files may have random names).
3. Extract all data items into a single pool.
4. **Deduplication**: If the same URL or identical title appears in multiple days, keep only the latest version.

**Step 3: AI Categorization (Strict)**
You must analyze the content of each item (Title + Description) and assign it to exactly **one** of the following 4 categories:
1. **New Products** (Complete new tools, apps, or agents)
2. **New Features** (Updates to existing tools, improvements, v2.0 releases)
3. **New Technologies** (Papers, underlying models, frameworks, research)
4. **Others** (General news, industry commentary, miscellaneous)

*Note: Do not create other categories.*

## 2. Content Fragment Structure

You must generate ONLY the content fragment with this exact structure:

### 1. Left Sidebar (Navigation)
```html
<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Nov 27 - Dec 3</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">Nov 27 - Dec 3, 2025</div>
        </div>
    </nav>
</aside>
```

### 2. Right Main Content
Start with the main wrapper and weekly header:
```html
<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">Nov 27, 2025 – Dec 3, 2025</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>

    <!-- Category sections go here (see Section 3) -->

</main>
```

## 3. Card Rendering with Tailwind Classes

For each category section:

**Section wrapper**:
```html
<section class="mb-16">
    <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">Category Name</h2>
    <div class="grid grid-flow-col auto-cols-[320px] gap-5 overflow-x-auto pb-4 hide-scrollbar GRID_ROWS_CLASS">
        <!-- Cards go here -->
    </div>
</section>
```

**MANDATORY Grid Row Logic** (per category):
- Count the number of items ($N$) in this category
- Add the appropriate class to the grid div:
  - If $N \le 3$: Add `grid-rows-1`
  - If $4 \le N \le 8$: Add `grid-rows-2`
  - If $N \ge 9$: Add `grid-rows-3`

**Card Structure**:
```html
<a href="URL" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
    <div>
        <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">Title Here</h3>
        <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">Description text goes here, limited to 3 lines with line-clamp.</p>
    </div>
    <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
        <span class="font-medium">Nov 30</span>
        <span>Source Name</span>
    </div>
</a>
```

**Field Inference Strategy**:
- Since JSON schemas vary, look for:
  - Title: `title`, `name`, `headline`
  - Body: `description`, `summary`, `content`, `text`
  - Link: `url`, `href`, `link`, `source_url`
  - Date: Derive from the folder name if not in JSON

## 4. Tailwind Class Reference

**Key Tailwind Utilities Used**:
- **Typography**: `font-serif`, `font-sans`, `text-xl`, `text-3xl`, `text-5xl`, `font-bold`, `font-medium`, `tracking-tight`, `leading-tight`, `leading-relaxed`
- **Colors**: `text-black`, `text-[#292929]`, `text-[#6B6B6B]`, `bg-white`, `bg-[#F7F7F7]`, `border-[#E6E6E6]`, `border-[#D1D1D1]`
- **Layout**: `flex`, `flex-col`, `grid`, `grid-cols-1`, `lg:grid-cols-[200px_1fr]`, `grid-flow-col`, `auto-cols-[320px]`
- **Spacing**: `mb-3`, `mb-4`, `mb-5`, `mb-8`, `mb-12`, `mb-16`, `p-6`, `px-4`, `py-3`, `pt-4`, `pb-4`, `gap-5`
- **Sizing**: `w-full`, `h-full`, `min-w-0`, `max-w-[800px]`
- **Responsive**: `lg:sticky`, `lg:top-10`
- **Display**: `overflow-x-auto`, `line-clamp-3`
- **Border**: `border`, `border-t`, `border-l-3`, `rounded-md`
- **Effects**: `transition-all`, `hover:border-[#D1D1D1]`, `hover:shadow-md`, `hover:bg-[#F7F7F7]`
- **Positioning**: `sticky`, `top-10`
- **Text**: `uppercase`, `tracking-wider`, `no-underline`
- **Alignment**: `justify-between`, `items-center`, `text-center`

**DO NOT write custom CSS**. Use only the Tailwind classes listed above.

## 5. Output Requirements

1. **Output ONLY the content fragment** (sidebar + main content)
2. **Start with**: `<aside class="lg:sticky lg:top-10">`
3. **End with**: `</main>`
4. **DO NOT include**: `<html>`, `<head>`, `<body>`, `<style>`, `<script>`, or any framework elements
5. **Aggregate 7 days** of data into ONE view
6. **NO separate day headers** in the Right Column. Hierarchy: `Weekly Header` → `Category` → `Cards`
7. **After generating**: Save to `/updates/content.html`, then run `node templates/merge.js`

## 6. Complete Example

```html
<aside class="lg:sticky lg:top-10">
    <div class="mb-4">
        <div class="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Nov 27 - Dec 3</div>
    </div>
    <nav class="flex flex-col">
        <div class="py-3 px-4 mb-2 border-l-3 border-black bg-[#F7F7F7] cursor-pointer transition-all text-sm font-semibold text-black">
            <div class="font-medium mb-1">This Week</div>
            <div class="text-xs text-[#6B6B6B]">Nov 27 - Dec 3, 2025</div>
        </div>
    </nav>
</aside>

<main class="min-w-0">
    <div class="mb-12">
        <h2 class="font-serif text-5xl font-bold text-black mb-4 tracking-tight">Weekly Report</h2>
        <p class="text-xl text-[#292929] mb-4 font-normal">Nov 27, 2025 – Dec 3, 2025</p>
        <p class="text-lg text-[#6B6B6B] leading-relaxed max-w-[800px]">A curated summary of the most important updates in AI from the last 7 days.</p>
    </div>

    <!-- New Products Section (Example with 2 items = grid-rows-1) -->
    <section class="mb-16">
        <h2 class="font-serif text-3xl font-bold text-black mb-8 tracking-tight">New Products</h2>
        <div class="grid grid-flow-col auto-cols-[320px] grid-rows-1 gap-5 overflow-x-auto pb-4 hide-scrollbar">
            <a href="https://example.com/product1" class="w-full h-full bg-white border border-[#E6E6E6] p-6 flex flex-col justify-between transition-all no-underline hover:border-[#D1D1D1] hover:shadow-md">
                <div>
                    <h3 class="font-serif text-xl font-bold text-black mb-3 leading-tight tracking-tight">Product Name</h3>
                    <p class="text-sm text-[#292929] leading-relaxed mb-5 line-clamp-3">Description of the product goes here.</p>
                </div>
                <div class="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E6E6E6]">
                    <span class="font-medium">Nov 30</span>
                    <span>Product Hunt</span>
                </div>
            </a>
            <!-- More cards... -->
        </div>
    </section>

    <!-- Add more category sections as needed -->

</main>
```
