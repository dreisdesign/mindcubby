#!/bin/bash

# Timer App Testing Script
# Tests basic functionality and layout

echo "🧪 Testing Focus Timer v2.4.2..."
echo ""

# Test 1: Check if all required files exist
echo "📁 Checking required files..."
files=("index.html" "styles.css" "manifest.json" "sw.js")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file missing"
    fi
done
echo ""

# Test 2: Check CSS syntax (basic)
echo "🎨 Checking CSS syntax..."
if grep -q "Focus Timer v2.4.2" styles.css; then
    echo "  ✅ CSS header version correct"
else
    echo "  ❌ CSS header version incorrect"
fi

if grep -q ".bottom-buttons-wrapper" styles.css; then
    echo "  ✅ Fixed footer styles present"
else
    echo "  ❌ Fixed footer styles missing"
fi

if grep -q ".circle-large" styles.css; then
    echo "  ✅ Circle styles present"
else
    echo "  ❌ Circle styles missing"
fi
echo ""

# Test 3: Check HTML structure
echo "🏗️  Checking HTML structure..."
if grep -q 'class="app"' index.html; then
    echo "  ✅ App container present"
else
    echo "  ❌ App container missing"
fi

if grep -q 'class="main-content"' index.html; then
    echo "  ✅ Main content area present"
else
    echo "  ❌ Main content area missing"
fi

if grep -q 'class="bottom-buttons-wrapper"' index.html; then
    echo "  ✅ Fixed footer present"
else
    echo "  ❌ Fixed footer missing"
fi
echo ""

# Test 4: Check version consistency
echo "🔢 Checking version consistency..."
html_version=$(grep -o 'v2\.4\.2' index.html | head -1)
css_version=$(grep -o 'v2\.4\.2' styles.css | head -1)

if [ "$html_version" = "v2.4.2" ] && [ "$css_version" = "v2.4.2" ]; then
    echo "  ✅ Version numbers consistent (v2.4.2)"
else
    echo "  ❌ Version numbers inconsistent"
    echo "    HTML: $html_version"
    echo "    CSS: $css_version"
fi
echo ""

echo "🏁 Testing complete!"
echo ""
echo "🌐 To test manually:"
echo "  1. Open index.html in browser"
echo "  2. Test circle scaling at different window sizes"
echo "  3. Test Start/Pause/Reset buttons"
echo "  4. Test Settings overlay"
echo "  5. Check PWA installation prompt"
echo "  6. Verify circles don't get cut off at any size"
