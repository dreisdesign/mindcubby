/**
 * Recipe Card Aggregator
 * Combines parsed parts with colors to create an ingredient list
 * Groups by (part + form + size + texture + color)
 */

/**
 * Aggregate parts with colors
 * Groups identical parts by their attributes + color, counting duplicates
 * @param {object[]} parsedParts - Array of parsed part metadata from parser
 * @param {object[]} colors - Array of color objects with { name, hex } for each part
 * @returns {object[]} Array of aggregated ingredients sorted by quantity
 * 
 * Example input:
 *   parsedParts: [
 *     { part: 'Middle', form: 'Flat', size: 'MD', texture: 'Ribbed', key: '...' },
 *     { part: 'Middle', form: 'Flat', size: 'MD', texture: 'Ribbed', key: '...' },
 *     { part: 'Middle', form: 'Flat', size: 'MD', texture: 'Smooth', key: '...' },
 *   ]
 *   colors: [
 *     { name: 'Pink', hex: '#FFB3D9' },
 *     { name: 'Pink', hex: '#FFB3D9' },
 *     { name: 'Green', hex: '#90EE90' },
 *   ]
 * 
 * Example output:
 *   [
 *     { qty: 2, part: 'Middle', form: 'Flat', size: 'MD', dimension: '42.8mm', texture: 'Ribbed', color: 'Pink', colorHex: '#FFB3D9' },
 *     { qty: 1, part: 'Middle', form: 'Flat', size: 'MD', dimension: '42.8mm', texture: 'Smooth', color: 'Green', colorHex: '#90EE90' },
 *   ]
 */
export function aggregateRecipeIngredients(parsedParts, colors = []) {
    if (!Array.isArray(parsedParts) || parsedParts.length === 0) {
        return [];
    }

    if (!Array.isArray(colors)) {
        colors = [];
    }

    // Pad colors array to match parts length (fallback to 'Custom' if not enough colors provided)
    const normalizedColors = colors.map(c => ({
        name: c?.name || 'Custom',
        hex: c?.hex || '#808080',
    }));

    // Ensure we have a color for each part
    while (normalizedColors.length < parsedParts.length) {
        normalizedColors.push({ name: 'Custom', hex: '#808080' });
    }

    // Create aggregation key: part--form--size--texture--color
    // This groups identical combinations with the same color
    const aggregateMap = new Map();

    parsedParts.forEach((part, index) => {
        const color = normalizedColors[index];
        const aggregateKey = `${part.key}--${color.name}`.toLowerCase();

        if (!aggregateMap.has(aggregateKey)) {
            aggregateMap.set(aggregateKey, {
                qty: 1,
                part: part.part,
                form: part.form,
                size: part.size,
                dimension: part.dimension,
                texture: part.texture,
                color: color.name,
                colorHex: color.hex,
            });
        } else {
            aggregateMap.get(aggregateKey).qty += 1;
        }
    });

    // Convert to array and sort by quantity (descending), then part name
    return Array.from(aggregateMap.values()).sort((a, b) => {
        if (b.qty !== a.qty) return b.qty - a.qty;
        return a.part.localeCompare(b.part);
    });
}

/**
 * Generate a display label for an ingredient (for UI consistency)
 * @param {object} ingredient - Aggregated ingredient from aggregateRecipeIngredients
 * @returns {string} Human-readable label
 */
export function getIngredientLabel(ingredient) {
    if (!ingredient) return '';
    return `${ingredient.qty}x ${ingredient.part} (${ingredient.size}/${ingredient.form}/${ingredient.texture})`;
}
