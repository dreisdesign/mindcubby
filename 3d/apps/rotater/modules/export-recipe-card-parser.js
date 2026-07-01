/**
 * Recipe Card Parser
 * Parses Stackables filenames to extract part metadata
 * Format: [{number}.]{part}--{form}--{size}--{texture}.stl
 * Examples:
 *   - middle--flat--md--ribbed.stl (no prefix)
 *   - 1.middle--flat--md--ribbed.stl (with prefix)
 *   - 3.bottom--flat--xs--ribbed.stl (with prefix)
 */

// Catalog lookup: size → dimension
const CATALOG_DIMENSIONS = {
    'XS': '12.4mm',
    'SM': '30.4mm',
    'MD': '42.8mm',
    'LG': '55.2mm',
    'XL': '67.6mm',
    'XXL': '80.0mm',
};

// Valid parts, forms, textures
const VALID_PARTS = ['Topper', 'Middle', 'Bottom'];
const VALID_FORMS = ['Flat', 'Tube'];
const VALID_SIZES = Object.keys(CATALOG_DIMENSIONS);
const VALID_TEXTURES = ['Ribbed', 'Smooth'];

/**
 * Parse a single filename into structured metadata
 * Handles optional number prefix: 1.middle--flat--md--ribbed.stl or middle--flat--md--ribbed.stl
 * @param {string} filename - The filename (e.g., "1.middle--flat--md--ribbed.stl" or "middle--flat--md--ribbed.stl")
 * @returns {object|null} Parsed metadata or null if invalid
 */
export function parseStackablesFilename(filename) {
    // Remove .stl extension and normalize
    let basename = filename.replace(/\.stl$/i, '').trim();
    
    // Strip leading number prefix if present (e.g., "1.", "2.", "3.")
    // Pattern: digits followed by a dot at the start
    const prefixMatch = basename.match(/^(\d+)\./);
    if (prefixMatch) {
        basename = basename.substring(prefixMatch[0].length);
    }
    
    const parts = basename.split('--');

    // Should have exactly 4 parts: part, form, size, texture
    if (parts.length !== 4) {
        return null;
    }

    const [rawPart, rawForm, rawSize, rawTexture] = parts.map(p => p.trim());

    // Normalize case
    const part = rawPart.charAt(0).toUpperCase() + rawPart.slice(1).toLowerCase();
    const form = rawForm.charAt(0).toUpperCase() + rawForm.slice(1).toLowerCase();
    const size = rawSize.toUpperCase();
    const texture = rawTexture.charAt(0).toUpperCase() + rawTexture.slice(1).toLowerCase();

    // Validate all parts
    if (
        !VALID_PARTS.includes(part) ||
        !VALID_FORMS.includes(form) ||
        !VALID_SIZES.includes(size) ||
        !VALID_TEXTURES.includes(texture)
    ) {
        return null;
    }

    const dimension = CATALOG_DIMENSIONS[size];

    return {
        part,
        form,
        size,
        dimension,
        texture,
        // Unique key for grouping: part--form--size--texture (normalized)
        // This groups duplicates regardless of prefix
        key: `${part}--${form}--${size}--${texture}`.toLowerCase(),
    };
}

/**
 * Parse a list of filenames
 * @param {string[]} filenames - Array of filenames
 * @returns {object[]} Array of parsed metadata (invalid filenames filtered out)
 */
export function parseStackablesFilenames(filenames) {
    if (!Array.isArray(filenames)) return [];

    return filenames
        .map(parseStackablesFilename)
        .filter(meta => meta !== null);
}

/**
 * Validate if a filename follows the Stackables format
 * @param {string} filename
 * @returns {boolean}
 */
export function isValidStackablesFilename(filename) {
    return parseStackablesFilename(filename) !== null;
}
