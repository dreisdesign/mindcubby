# Recipe Card POC - Testing Guide

## Phase 1: Core Logic Testing

The recipe card POC is now available in the browser console. To test:

### Quick Start
1. Open the app in browser (index.html)
2. Open DevTools Console (Cmd+Option+J or F12)
3. Run the demo:
   ```js
   window.recipeCardPOC.demo()
   ```

### What to Expect
The demo will:
1. Parse 7 sample Stackables filenames
2. Aggregate them with sample colors (2x Pink, 3x Yellow, 1x Green)
3. Generate an HTML recipe card table
4. Display a visual preview in an overlay on the page

### Test Cases Available

**Run full test suite:**
```js
window.recipeCardPOC.testParser()     // Parser edge case tests
window.recipeCardPOC.testAggregation()  // Aggregation logic tests
```

**Test individual functions:**
```js
// Parse filenames
const parsed = window.recipeCardPOC.parse([
    'middle--flat--md--ribbed.stl',
    'bottom--tube--xs--smooth.stl'
]);

// Check if filename is valid
window.recipeCardPOC.isValid('middle--flat--md--ribbed.stl')  // true

// Aggregate with colors
const aggregated = window.recipeCardPOC.aggregate(parsed, [
    { name: 'Pink', hex: '#FFB3D9' },
    { name: 'Green', hex: '#90EE90' }
]);

// Generate HTML
const html = window.recipeCardPOC.render(aggregated, {
    title: 'My Recipe',
    includeColumns: ['qty', 'part', 'size', 'form', 'color']
});
```

## Module Files

- **export-recipe-card-parser.js** - Filename parsing logic
- **export-recipe-card-aggregator.js** - Grouping & counting logic
- **export-recipe-card-renderer.js** - HTML generation & rendering
- **export-recipe-card-test.js** - Demo & test suite

## Validation Checklist

After running the demo, verify:
- [ ] Parser correctly extracts Part, Form, Size, Texture from each filename
- [ ] Aggregator groups duplicates (e.g., 2 Pink + 1 Yellow = 2 rows, not 3)
- [ ] HTML table renders with all columns (Qty, Part, Size, Texture, Form, Color)
- [ ] Color swatches display correctly (colored boxes next to color names)
- [ ] Sorting works (higher qty items first)

## Next Steps (After Validation)

Once core POC is validated:
1. Add "Generate Recipe Card" checkbox to export panel UI
2. Hook into export workflow to capture actual filenames & colors
3. Add PNG export capability (may need html2canvas library)
4. Test with real Stackables files

**Remember:** Test & validate the POC fully before expanding scope!
