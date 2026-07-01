/**
 * Recipe Card Aggregator
 * Combines parsed parts with colors to create an ingredient list
 * Groups by (part + form + size + texture + color)
 */

/**
 * Aggregate parts with colors
 * Groups identical parts by their attributes + color hex
 * Same filename + different colors = separate rows
 * Same filename + same color = qty++
 * @param {object[]} parsedParts - Array of parsed part metadata from parser
 * @param {object[]} colors - Array of color objects with { name, hex } for each part
 * @param {number[]} partIndices - Array of part indices (for thumbnail generation)
 * @returns {object[]} Array of aggregated ingredients sorted by quantity
 * 
 * Example input:
 *   parsedParts: [
 *     { part: 'Middle', form: 'Tube', size: 'XS', texture: 'Ribbed', key: '...' },
 *     { part: 'Middle', form: 'Tube', size: 'XS', texture: 'Ribbed', key: '...' },
 *     { part: 'Middle', form: 'Tube', size: 'XS', texture: 'Ribbed', key: '...' },
 *   ]
 *   colors: [
 *     { name: 'Custom', hex: '#FFFF00' },  // Yellow
 *     { name: 'Custom', hex: '#00FF00' },  // Green
 *     { name: 'Custom', hex: '#FF69B4' },  // Pink
 *   ]
 *   partIndices: [0, 1, 2]  // For thumbnail generation
 * 
 * Example output (each color is separate):
 *   [
 *     { qty: 1, part: 'Middle', form: 'Tube', size: 'XS', texture: 'Ribbed', color: 'Custom', colorHex: '#FFFF00', partIdx: 0 },
 *     { qty: 1, part: 'Middle', form: 'Tube', size: 'XS', texture: 'Ribbed', color: 'Custom', colorHex: '#00FF00', partIdx: 1 },
 *     { qty: 1, part: 'Middle', form: 'Tube', size: 'XS', texture: 'Ribbed', color: 'Custom', colorHex: '#FF69B4', partIdx: 2 },
 *   ]
 */
export function aggregateRecipeIngredients(parsedParts, colors = [], partIndices = []) {
    if (!Array.isArray(parsedParts) || parsedParts.length === 0) {
        return [];
    }

    if (!Array.isArray(colors)) {
        colors = [];
    }

    if (!Array.isArray(partIndices)) {
        partIndices = [];
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

    // Create aggregation key: part--form--size--texture--hex
    // This groups identical combinations ONLY if they have the SAME COLOR (hex)
    // Different colors with same part = different rows
    const aggregateMap = new Map();

    parsedParts.forEach((part, index) => {
        const color = normalizedColors[index];
        const partIdx = partIndices[index];
        // Use hex value in key to differentiate by actual color, not just name
        const aggregateKey = `${part.key}--${color.hex}`.toLowerCase();

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
                partIdx: partIdx,
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
