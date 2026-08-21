#!/bin/bash

# Labs Design System - Auto Build Storybook Script
# Automatically kills any development processes and builds static Storybook
# With pre-checks for common errors

PORT=6006
echo "🏗️  Building Labs Design System Storybook..."

# Pre-build error checking
echo "🔍 Pre-build checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the design-system directory."
    exit 1
fi

# Check if required directories exist
if [ ! -d "src" ]; then
    echo "❌ Error: src directory not found. Invalid project structure."
    exit 1
fi

if [ ! -d ".storybook" ]; then
    echo "❌ Error: .storybook directory not found. Storybook not configured."
    exit 1
fi

# Check for problematic empty story files
echo "🧹 Checking for problematic files..."
EMPTY_STORIES=$(find ../src/stories -name "*.stories.js" -empty 2>/dev/null || true)
if [ ! -z "$EMPTY_STORIES" ]; then
    echo "⚠️  Warning: Found empty story files that could cause 404s:"
    echo "$EMPTY_STORIES"
    echo "🔧 Removing empty story files..."
    find ../src/stories -name "*.stories.js" -empty -delete 2>/dev/null || true
    echo "✅ Cleaned up empty story files"
fi

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "❌ Error: node_modules not found. Run 'npm install' first."
    exit 1
fi

# Check if port is in use and kill development server
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "📡 Stopping development server on port $PORT..."

    # Get the process ID and kill it
    PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
    if [ ! -z "$PID" ]; then
        echo "🔪 Killing process $PID on port $PORT"
        kill -9 $PID
        sleep 2
    fi

    echo "✅ Development server stopped"
fi

# Run the prebuild script (icon generation)
echo "🔧 Generating icons list..."
if ! npm run generate-icons-list; then
    echo "❌ Error: Icon generation failed"
    exit 1
fi

# Build static Storybook
echo "📦 Building static Storybook..."
if ! npx storybook build; then
    echo "❌ Error: Storybook build failed"
    exit 1
fi

# Verify build output
if [ ! -d "storybook-static" ]; then
    echo "❌ Error: Build completed but storybook-static directory not found"
    exit 1
fi

# Check if key files exist in build
if [ ! -f "storybook-static/index.html" ]; then
    echo "❌ Error: Build missing index.html"
    exit 1
fi

echo "✅ Build complete! Output in storybook-static/"
echo "📊 Build size: $(du -sh storybook-static | cut -f1)"
echo "📁 Files generated: $(find storybook-static -type f | wc -l | tr -d ' ')"

# Sync design system files after successful build
echo "🔄 Syncing design system files..."
if command -v fswatch >/dev/null 2>&1; then
    echo "📡 fswatch detected - running full sync"
else
    echo "⚠️  fswatch not installed - partial sync only"
fi

# Sync design system files for docs and public root
echo "🔄 Syncing design system files using update-static-paths.js..."
cd ..
if node scripts/update-static-paths.js --auto; then
    echo "✅ Design system files synced successfully"
else
    echo "❌ Error: Syncing design system files failed"
    exit 1
fi

# Return to design-system directory for consistent exit
cd design-system
