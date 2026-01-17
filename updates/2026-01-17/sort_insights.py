import json

# Read the insights
with open('/home/runner/work/agentdaily/agentdaily/updates/2026-01-17/insights.json', 'r') as f:
    insights = json.load(f)

# Sort by published_date (most recent first)
sorted_insights = sorted(insights, key=lambda x: x['published_date'], reverse=True)

# Remove duplicates based on URL
seen_urls = set()
unique_insights = []
for insight in sorted_insights:
    if insight['url'] not in seen_urls:
        seen_urls.add(insight['url'])
        unique_insights.append(insight)

# Write back
with open('/home/runner/work/agentdaily/agentdaily/updates/2026-01-17/insights.json', 'w') as f:
    json.dump(unique_insights, f, indent=2)

print(f"Sorted and deduplicated {len(unique_insights)} insights (removed {len(insights) - len(unique_insights)} duplicates)")
