#!/bin/bash

# Mindcubby Labs Build Script
# Builds Storybook for Labs design system and outputs to mindcubby/labs/design-system/
# IMPORTANT: Keeps labs source repo pristine - builds only what's needed for mindcubby

set -e

LABS_DIR="/Users/danielreis/labs"
MINDCUBBY_ROOT="$(cd "$(dirname "$0")/.." && pwd)"  # Get mindcubby root directory
MINDCUBBY_LABS_DIR="$MINDCUBBY_ROOT/labs"
DESIGN_SYSTEM_DIR="$MINDCUBBY_LABS_DIR/design-system"

echo "🚀 Building Labs Storybook for Mindcubby..."
echo "📁 Labs source: $LABS_DIR"
echo "📁 Mindcubby root: $MINDCUBBY_ROOT"
echo "📁 Output directory: $DESIGN_SYSTEM_DIR"
echo ""

# Step 1: Generate icons in labs (this modifies labs temporarily)
echo "🔧 Generating icons..."
cd "$LABS_DIR/design-system"
npm run generate-icons-list
node ../scripts/sync-icons.js

# Step 2: Build ONLY the Storybook static output (no path updates)
echo "📦 Building Storybook static output..."
if ! npx storybook build; then
    echo "❌ Error: Storybook build failed"
    exit 1
fi

# Step 3: Clean up any docs/ modifications to keep labs pristine
echo "🧹 Cleaning up labs modifications..."
cd "$LABS_DIR"
git checkout docs/ 2>/dev/null || echo "ℹ️  No docs changes to revert"

# Step 4: Copy Storybook static output to mindcubby
echo "📋 Copying Storybook output to mindcubby..."
cd "$MINDCUBBY_ROOT"  # Explicitly go back to mindcubby root

# Create design-system directory if it doesn't exist
mkdir -p "$DESIGN_SYSTEM_DIR"

echo "DEBUG: Current directory: $(pwd)"
echo "DEBUG: Copying from: $LABS_DIR/design-system/storybook-static"
echo "DEBUG: Copying to: $DESIGN_SYSTEM_DIR"

# Copy new storybook static files from labs build
cp -rp "$LABS_DIR/design-system/storybook-static"/* "$DESIGN_SYSTEM_DIR/" 2>&1 | head -5

echo "✅ Copy command completed"
echo "DEBUG: Contents of target dir:"
ls -la "$DESIGN_SYSTEM_DIR" | head -5

# Step 5: Verify key files
if [ ! -f "$DESIGN_SYSTEM_DIR/index.html" ]; then
    echo "❌ Error: Storybook index.html not found at $DESIGN_SYSTEM_DIR/index.html"
    ls -la "$DESIGN_SYSTEM_DIR"
    exit 1
fi

echo "📊 Storybook output size: $(du -sh "$DESIGN_SYSTEM_DIR" | cut -f1)"
echo "✅ Build complete!"
echo ""
echo "📍 Test locally: cd $MINDCUBBY_ROOT && python3 -m http.server 8000"
echo "🌐 Then visit: http://localhost:8000/labs/"

