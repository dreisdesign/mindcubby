#!/bin/bash

# Labs Design System - Auto Storybook Script
# Automatically kills any process on port 6006 and starts Storybook
# With pre-checks for common errors

PORT=6006
echo "🚀 Starting Labs Design System Storybook..."

# Pre-start error checking
echo "🔍 Pre-start checks..."

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

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "❌ Error: node_modules not found. Run 'npm install' first."
    exit 1
fi

# Check for problematic empty story files
echo "🧹 Checking for problematic files..."
EMPTY_STORIES=$(find ../src/stories -name "*.stories.js" -empty 2>/dev/null || true)
if [ ! -z "$EMPTY_STORIES" ]; then
    echo "⚠️  Warning: Found empty story files that could cause issues:"
    echo "$EMPTY_STORIES"
    echo "🔧 Consider removing these files or adding content"
fi

# Check if port is in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "📡 Port $PORT is in use. Killing existing processes..."
    
    # Get the process ID and kill it
    PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
    if [ ! -z "$PID" ]; then
        echo "🔪 Killing process $PID on port $PORT"
        kill -9 $PID
        sleep 2
    fi
    
    echo "✅ Port $PORT is now available"
else
    echo "✅ Port $PORT is available"
fi

# Run the prestorybook script (icon generation)
echo "🔧 Generating icons list..."
if ! npm run generate-icons-list; then
    echo "❌ Error: Icon generation failed"
    exit 1
fi

# Start Storybook
echo "📚 Starting Storybook on port $PORT..."
npx storybook dev -p $PORT --no-open

# Note: --no-open prevents automatic browser opening
# Remove --no-open if you want the browser to open automatically
