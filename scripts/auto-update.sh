#!/bin/bash
set -e

echo "🚀 Starting auto-update workflow..."

TARGET_BRANCH=${TARGET_BRANCH:-gh-pages}
SOURCE_BRANCH=${SOURCE_BRANCH:-main}

# Step 1: Switch to pages branch and sync with remote
echo ""
echo "📌 Step 1: Switching to ${TARGET_BRANCH} branch..."
git fetch origin

if git rev-parse --verify "${TARGET_BRANCH}" >/dev/null 2>&1; then
  git checkout "${TARGET_BRANCH}"
  echo "✅ Switched to existing ${TARGET_BRANCH} branch"
  
  # Pull latest changes from remote target branch if it exists
  if git ls-remote --exit-code --heads origin "${TARGET_BRANCH}" >/dev/null 2>&1; then
    echo "🔄 Pulling latest changes from origin/${TARGET_BRANCH}..."
    if git pull --rebase origin "${TARGET_BRANCH}"; then
      echo "✅ Successfully pulled latest changes"
    else
      echo "❌ Failed to rebase. This may be due to:"
      echo "   - Conflicting updates to the same date directory"
      echo "   - Solution: abort rebase and reset to remote"
      git rebase --abort 2>/dev/null || true
      git reset --hard "origin/${TARGET_BRANCH}"
      echo "✅ Reset to remote state"
    fi
  else
    echo "ℹ️  Remote ${TARGET_BRANCH} branch not found, will create on push"
  fi
else
  git checkout -b "${TARGET_BRANCH}"
  echo "✅ Created new ${TARGET_BRANCH} branch"
fi

# Step 2: Backup updates directory (preserve historical data)
echo ""
echo "💾 Step 2: Backing up updates directory..."
BACKUP_DIR=$(mktemp -d)
if [ -d "updates" ]; then
  cp -r updates "$BACKUP_DIR/"
  echo "✅ Backed up to $BACKUP_DIR/updates"
else
  mkdir -p "$BACKUP_DIR/updates"
  echo "ℹ️  No existing updates directory, created empty backup"
fi

# Step 3: Merge main branch (get latest code)
echo ""
echo "🔀 Step 3: Merging latest code from ${SOURCE_BRANCH} branch..."
# Configure custom merge driver to always keep existing updates/ content
git config merge.ours.driver true || true
if git merge "origin/${SOURCE_BRANCH}" --no-edit; then
  echo "✅ Successfully merged main branch"
else
  echo "❌ Merge failed, trying to resolve..."
  # If merge conflicts, prefer main's version for all files EXCEPT updates/
  git checkout --theirs . 
  echo "✅ Using main's version for all files"
fi

# Step 4: Restore updates directory (keep target branch data)
echo ""
echo "📂 Step 4: Restoring updates directory..."
rm -rf updates 2>/dev/null || true
cp -r "$BACKUP_DIR/updates" .
rm -rf "$BACKUP_DIR"
echo "✅ Updates directory restored"

# Step 5: Run yarn update
echo ""
echo "📝 Step 5: Generating daily reports..."
if yarn install && yarn update; then
  echo "✅ Successfully generated reports"
else
  echo "❌ Failed to generate reports"
  exit 1
fi

# Step 6: Commit and push changes
echo ""
echo "💾 Step 6: Committing changes..."
git add -A
git add -f updates || true

if ! git diff-index --quiet HEAD --; then
  TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M UTC")
  git commit -m "chore: Auto-update reports - $TIMESTAMP"
  echo "✅ Changes committed"
  
  echo ""
  echo "📤 Pushing to ${TARGET_BRANCH} branch..."
  
  # Strategy: Try normal push, if fails due to concurrent updates, retry with pull
  MAX_RETRIES=3
  RETRY_COUNT=0
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if git push origin "${TARGET_BRANCH}"; then
      echo "✅ Changes pushed successfully"
      break
    else
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "⚠️  Push failed (attempt $RETRY_COUNT/$MAX_RETRIES), retrying..."
        echo "🔄 Pulling latest changes..."
        
        # Backup updates again before pull
        BACKUP_DIR2=$(mktemp -d)
        cp -r updates "$BACKUP_DIR2/"
        
        # Pull with merge (not rebase, to avoid conflicts)
        if git pull --no-rebase origin "${TARGET_BRANCH}"; then
          # Restore our updates
          rm -rf updates
          cp -r "$BACKUP_DIR2/updates" .
          git add -A
          git add -f updates || true
          git commit --amend --no-edit
          rm -rf "$BACKUP_DIR2"
          echo "✅ Merged and restored updates, retrying push..."
        else
          echo "❌ Pull failed"
          rm -rf "$BACKUP_DIR2"
          exit 1
        fi
        
        sleep 2  # Brief delay before retry
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
