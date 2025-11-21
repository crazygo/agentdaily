#!/bin/bash
set -e

echo "🚀 Starting auto-update workflow..."

# Step 1: Switch to ph-pages branch
echo ""
echo "📌 Step 1: Switching to ph-pages branch..."
git fetch origin

if git rev-parse --verify ph-pages >/dev/null 2>&1; then
  git checkout ph-pages
  echo "✅ Switched to existing ph-pages branch"
  
  # Pull latest changes from remote ph-pages branch if it exists
  if git ls-remote --exit-code --heads origin ph-pages >/dev/null 2>&1; then
    echo "🔄 Pulling latest changes from origin/ph-pages..."
    if git pull --no-rebase origin ph-pages; then
      echo "✅ Successfully pulled latest changes"
    else
      echo "❌ Failed to merge changes from remote. This may be due to:"
      echo "   - Merge conflicts that need manual resolution"
      echo "   - Diverged history between local and remote branches"
      echo "   Please resolve conflicts manually and re-run the workflow"
      exit 1
    fi
  else
    echo "ℹ️  Remote ph-pages branch not found, will create on push"
  fi
else
  git checkout -b ph-pages
  echo "✅ Created new ph-pages branch"
fi

# Step 2: Merge main branch (auto-resolve conflicts)
echo ""
echo "🔀 Step 2: Merging main branch..."
if git merge -X theirs origin/main --no-edit; then
  echo "✅ Successfully merged main branch"
else
  echo "❌ Failed to merge main branch"
  exit 1
fi

# Step 3: Run yarn update
echo ""
echo "📝 Step 3: Generating daily reports..."
if yarn update; then
  echo "✅ Successfully generated reports"
else
  echo "❌ Failed to generate reports"
  exit 1
fi

# Step 4: Commit and push changes
echo ""
echo "💾 Step 4: Committing changes..."
# Only add updates directory, force to bypass .gitignore
git add -f updates/

if ! git diff-index --quiet HEAD --; then
  TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M UTC")
  git commit -m "chore: Auto-update reports - $TIMESTAMP"
  echo "✅ Changes committed"
  
  echo ""
  echo "📤 Pushing to ph-pages branch..."
  
  # Retry loop for push
  MAX_RETRIES=5
  RETRY_COUNT=0
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if git push origin ph-pages; then
      echo "✅ Changes pushed successfully"
      break
    else
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "⚠️  Push failed (attempt $RETRY_COUNT/$MAX_RETRIES), pulling latest changes and retrying..."
        git pull --no-rebase origin ph-pages
        sleep 2
      else
        echo "❌ Failed to push after $MAX_RETRIES attempts"
        exit 1
      fi
    fi
  done
else
  echo "ℹ️  No changes to commit"
fi

echo ""
echo "✨ Auto-update workflow completed successfully!"
