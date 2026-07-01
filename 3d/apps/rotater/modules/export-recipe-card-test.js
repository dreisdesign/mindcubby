/**
 * Recipe Card POC - Test/Demo Module
 * Demonstrates the parser, aggregator, and renderer working together
 * Can be imported and tested in the browser console
 */

import { parseStackablesFilenames } from './export-recipe-card-parser.js';
import { aggregateRecipeIngredients } from './export-recipe-card-aggregator.js';
import { generateRecipeCardHTML } from './export-recipe-card-renderer.js';

/**
 * Run a complete recipe card POC demo
 */
export function runRecipeCardDemo() {
    console.log('=== Recipe Card POC Demo ===\n');

    // Sample filenames with Tinkercad export prefixes (1., 2., 3., etc.)
    const sampleFilenames = [
        '1.topper--flat--xs--ribbed.stl',
        '2.middle--flat--xs--ribbed.stl',
        '3.middle--flat--xs--ribbed.stl',  // Duplicate: 2x this part
        '4.middle--flat--xs--smooth.stl',
        '5.middle--flat--xs--smooth.stl',  // Duplicate: 2x this part
        '6.middle--flat--xs--smooth.stl',  // Actually 3x total
        '7.bottom--flat--xs--ribbed.stl',
    ];

    // Sample colors (would come from app state in real integration)
    const sampleColors = [
        { name: 'Pink', hex: '#FFB3D9' },
        { name: 'Pink', hex: '#FFB3D9' },
        { name: 'Pink', hex: '#FFB3D9' },
        { name: 'Yellow', hex: '#FFEB3B' },
        { name: 'Yellow', hex: '#FFEB3B' },
        { name: 'Yellow', hex: '#FFEB3B' },
        { name: 'Green', hex: '#90EE90' },
    ];

    console.log('Step 1: Parse Filenames');
    console.log('Input filenames:', sampleFilenames);
    const parsed = parseStackablesFilenames(sampleFilenames);
    console.log('Parsed metadata:', parsed);
    console.log(`✓ Successfully parsed ${parsed.length} parts\n`);

    console.log('Step 2: Aggregate with Colors');
    console.log('Input colors:', sampleColors);
    const aggregated = aggregateRecipeIngredients(parsed, sampleColors);
    console.log('Aggregated ingredients:', aggregated);
    console.log(`✓ Aggregated into ${aggregated.length} unique ingredient combinations\n`);

    console.log('Step 3: Render HTML Card');
    const html = generateRecipeCardHTML(aggregated, {
        title: 'Macaron Triple Stack',
        subtitle: 'French Macaron - Stackables Edition',
        includeColumns: ['qty', 'part', 'size', 'texture', 'form', 'color'],
    });
    console.log('Generated HTML:', html);
    console.log('✓ HTML card generated\n');

    // Display in page for visual inspection
    console.log('=== Rendering to page ===');
    displayRecipeCardInPage(html);

    return { parsed, aggregated, html };
}

/**
 * Helper: Display recipe card HTML in a page overlay
 */
function displayRecipeCardInPage(html) {
    // Create container if not exists
    let container = document.getElementById('recipe-card-preview');
    if (!container) {
        container = document.createElement('div');
        container.id = 'recipe-card-preview';
        container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 16px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 9999;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(container);
    }

    container.innerHTML = html + `
        <div style="margin-top: 16px; text-align: center;">
            <button onclick="document.getElementById('recipe-card-preview').remove()" 
                    style="padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Close Preview
            </button>
        </div>
    `;
}

/**
 * Test parser error handling
 */
export function testParserEdgeCases() {
    console.log('=== Parser Edge Case Tests ===\n');

    const testCases = [
        { input: 'middle--flat--md--ribbed.stl', expected: true, desc: 'Valid file (no prefix)' },
        { input: '1.middle--flat--md--ribbed.stl', expected: true, desc: 'Valid with Tinkercad prefix' },
        { input: '99.middle--flat--md--ribbed.stl', expected: true, desc: 'Multi-digit prefix' },
        { input: 'Middle--Flat--MD--Ribbed.stl', expected: true, desc: 'Case-insensitive (no prefix)' },
        { input: '2.Middle--Flat--MD--Ribbed.stl', expected: true, desc: 'Case-insensitive with prefix' },
        { input: 'invalid--file--name.stl', expected: false, desc: 'Invalid part name (no prefix)' },
        { input: '1.invalid--file--name.stl', expected: false, desc: 'Invalid part name (with prefix)' },
        { input: 'middle--flat--md.stl', expected: false, desc: 'Missing texture' },
        { input: '1.middle--flat--md.stl', expected: false, desc: 'Missing texture (with prefix)' },
        { input: 'middle--flat--md--ribbed--extra.stl', expected: false, desc: 'Extra segment' },
        { input: 'middle--flat--md--ribbed', expected: true, desc: 'No .stl extension' },
        { input: '3.middle--flat--md--ribbed', expected: true, desc: 'No .stl extension (with prefix)' },
    ];

    testCases.forEach(test => {
        const { parseStackablesFilename, isValidStackablesFilename } = require('./export-recipe-card-parser.js');
        const result = isValidStackablesFilename(test.input);
        const status = result === test.expected ? '✓' : '✗';
        console.log(`${status} [${test.desc}] "${test.input}" => ${result}`);
    });

    console.log();
}

/**
 * Test aggregation logic
 */
export function testAggregationLogic() {
    console.log('=== Aggregation Logic Tests ===\n');

    // Test case: Same part, different colors
    const parts = [
        { part: 'Middle', form: 'Flat', size: 'MD', texture: 'Ribbed', dimension: '42.8mm', key: 'middle--flat--md--ribbed' },
        { part: 'Middle', form: 'Flat', size: 'MD', texture: 'Ribbed', dimension: '42.8mm', key: 'middle--flat--md--ribbed' },
        { part: 'Middle', form: 'Flat', size: 'MD', texture: 'Ribbed', dimension: '42.8mm', key: 'middle--flat--md--ribbed' },
    ];

    const colors = [
        { name: 'Pink', hex: '#FFB3D9' },
        { name: 'Pink', hex: '#FFB3D9' },
        { name: 'Yellow', hex: '#FFEB3B' },
    ];

    const result = aggregateRecipeIngredients(parts, colors);

    console.log('Test: Same part, same color groups');
    console.log('Input: 3 parts (2 pink, 1 yellow)');
    console.log('Expected: 2 ingredient rows (2x pink, 1x yellow)');
    console.log('Result:', result);
    console.log(`Status: ${result.length === 2 ? '✓ PASS' : '✗ FAIL'}\n`);
}

// Auto-run when module is imported with test flag
if (typeof window !== 'undefined' && window.__RECIPE_CARD_TEST__) {
    runRecipeCardDemo();
    testParserEdgeCases();
    testAggregationLogic();
}
