# Recipe Card POC - Testing Guide

## Filename Format

Export from Tinkercad with numeric prefixes:
- `1.bottom--flat--xs--ribbed.stl`
- `2.middle--tube--xs--smooth.stl`
- `3.middle--tube--xs--smooth.stl` (same part as #2, different instance)

**Format breakdown:**
- `{number}.` - Tinkercad export index (1., 2., 3., etc.) — optional but recommended
- `{part}` - Topper, Middle, or Bottom
- `{form}` - Flat or Tube
- `{size}` - XS, SM, MD, LG, XL, XXL
- `{texture}` - Ribbed or Smooth

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
// Parse filenames (with Tinkercad prefixes)
const parsed = window.recipeCardPOC.parse([
    '1.middle--flat--md--ribbed.stl',
    '2.bottom--tube--xs--smooth.stl'
]);

// Check if filename is valid
window.recipeCardPOC.isValid('1.middle--flat--md--ribbed.stl')  // true
window.recipeCardPOC.isValid('middle--flat--md--ribbed.stl')    // also true (prefix optional)

// Aggregate with colors (will group duplicates with different prefixes)
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
- [ ] Parser strips number prefix correctly (e.g., "1.middle--flat--md--ribbed" → validates as "middle--flat--md--ribbed")
- [ ] Parser still works without prefix (e.g., "middle--flat--md--ribbed" → validates)
- [ ] Aggregator groups duplicates with different prefixes (1., 2., 3.) as same part
- [ ] HTML table renders with all columns (Qty, Part, Size, Texture, Form, Color)
- [ ] Color swatches display correctly (colored boxes next to color names)
- [ ] Sorting works (higher qty items first)
- [ ] Qty counts correctly (e.g., 3 files with same base name = qty: 3)

## Next Steps (After Validation)

Once core POC is validated with Tinkercad export format:
1. Test with actual Stackables catalog files from Tinkercad
2. Verify color extraction matches your customizations
3. Validate aggregation with real 3-part Macaron stack
4. Once fully validated, integrate PNG export
5. Add to export workflow (checkbox in export modal)

**Remember:** Test & validate the POC fully before expanding scope!
