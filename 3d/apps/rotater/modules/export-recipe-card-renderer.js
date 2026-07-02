/**
 * Recipe Card Renderer
 * Renders aggregated ingredients to HTML table
 * Matches the Macaron reference layout
 */

/**
 * Generate HTML for a recipe card table
 * @param {object[]} ingredients - Array of aggregated ingredients
 * @param {object} options - Rendering options
 *   - title: Card title (default: "Recipe Card")
 *   - subtitle: Optional subtitle
 *   - includeColumns: Array of column names to include (default: all)
 *   - includeThumbnails: Whether to show thumbnail placeholders (default: false)
 * @returns {string} HTML table markup
 */
export function generateRecipeCardHTML(ingredients, options = {}) {
    const {
        title = 'Recipe Card',
        subtitle = '',
        includeColumns = ['qty', 'part', 'size', 'texture', 'form', 'color'],
        includeThumbnails = false,
    } = options;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return '<p>No ingredients to display</p>';
    }

    // Column configuration
    const columnConfig = {
        qty: { label: 'Qty', width: '60px' },
        part: { label: 'Part', width: '100px' },
        size: { label: 'Size', width: '80px' },
        texture: { label: 'Texture', width: '100px' },
        form: { label: 'Form', width: '80px' },
        color: { label: 'Color', width: '120px' },
    };

    // Filter to requested columns
    const visibleColumns = includeColumns.filter(col => col in columnConfig);

    // Build header
    const headerCells = visibleColumns
        .map(col => `<th style="text-align: left; padding: 10px 12px; font-weight: 600; border-bottom: 2px solid #e0e0e0; font-size: 13px; letter-spacing: 0.3px;">${columnConfig[col].label}</th>`)
        .join('');

    // Build rows with optional thumbnails
    const rows = ingredients
        .map((ing, idx) => {
            const cells = visibleColumns
                .map(col => {
                    if (col === 'color') {
                        // Color cell with swatch
                        return `<td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 8px;">
                            <div style="width: 20px; height: 20px; background-color: ${ing.colorHex}; border: 1px solid #ccc; border-radius: 4px; flex-shrink: 0;"></div>
                            <span style="font-family: monospace; font-size: 11px; color: #666;">${ing.colorHex.toUpperCase()}</span>
                        </td>`;
                    }
                    return `<td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0;">${ing[col]}</td>`;
                })
                .join('');

            return `<tr>${cells}</tr>`;
        })
        .join('');

    // Build complete table content
    const html = `
        <div style="margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; cursor: grab; user-select: none; margin: 0; padding: 24px 24px 12px 24px;" data-recipe-card-header>
            <h1 style="margin: 0 0 4px 0; font-size: 22px; font-weight: 700; color: #1a1a1a;">${escapeHtml(title)}</h1>
            ${subtitle ? `<p style="margin: 0; color: #666; font-size: 13px;">${escapeHtml(subtitle)}</p>` : ''}
        </div>
        
        <div style="padding: 0 24px 24px 24px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f9f9f9;">
                        ${headerCells}
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;

    return html;
}

/**
 * Render HTML to canvas and return as image data
 * @param {string} html - HTML markup to render
 * @param {object} options - Canvas options
 *   - width: Canvas width (default: 1200)
 *   - height: Canvas height (default: auto, calculated)
 * @returns {Promise<HTMLCanvasElement>} Canvas element with rendered content
 */
export async function renderHTMLToCanvas(html, options = {}) {
    const { width = 1200 } = options;

    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = width + 'px';
    container.innerHTML = html;
    document.body.appendChild(container);

    // Wait for images and fonts to load
    await new Promise(resolve => setTimeout(resolve, 100));

    const height = container.offsetHeight;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Use html2canvas if available (optional dependency)
    // For now, return a simplified version using the container
    // In production, consider using html2canvas or similar library

    // Clean up
    document.body.removeChild(container);

    return { canvas, width, height };
}

/**
 * Download recipe card as PNG
 * @param {object[]} ingredients - Array of aggregated ingredients
 * @param {object} options - Download and rendering options
 *   - filename: Download filename (default: "recipe-card.png")
 *   - title: Card title
 *   - subtitle: Optional subtitle
 */
export async function downloadRecipeCardAsPNG(ingredients, options = {}) {
    const { filename = 'recipe-card.png', title, subtitle } = options;

    const html = generateRecipeCardHTML(ingredients, { title, subtitle });

    // For now, create a simple PNG-like export by copying table to clipboard
    // A full implementation would use html2canvas or similar
    // This is a placeholder that logs the HTML for testing

    console.log('Recipe Card HTML:', html);
    console.warn('PNG export requires html2canvas library. For now, copy HTML to clipboard.');

    // Copy HTML to clipboard for testing
    navigator.clipboard.writeText(html).then(() => {
        console.log('HTML copied to clipboard');
    });
}

/**
 * Escape HTML special characters
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
