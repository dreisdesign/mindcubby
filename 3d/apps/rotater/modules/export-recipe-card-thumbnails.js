/**
 * Recipe Card Thumbnail Generation
 * 
 * Generates thumbnail preview images for recipe card ingredients.
 * Uses existing three.js scene and rendering infrastructure.
 */

/**
 * Generate a thumbnail for a specific part
 * Note: This requires the 3D scene to be initialized (mesh, renderer, camera)
 * 
 * @param {number} partIdx - Index of the part in modelPartNames array
 * @param {number} size - Thumbnail canvas size in pixels (default: 120)
 * @param {string} quality - 'low-res' or 'high-res' (default: 'low-res' for performance)
 * @returns {string|null} Data URL (base64 PNG) or null if render failed
 */
export function generatePartThumbnailDataUrl(partIdx, size = 120, quality = 'low-res') {
    // Create temporary canvas for rendering
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    tempCanvas.className = 'js-part-thumb-preview';
    tempCanvas.dataset.partIndex = partIdx;
    tempCanvas.style.display = 'none';
    
    // Append to body temporarily for rendering
    document.body.appendChild(tempCanvas);
    
    try {
        // Note: renderSinglePartThumbnail must be called from main script.js
        // This is a stub that expects the function to be available in global scope
        if (typeof window.renderSinglePartThumbnail !== 'function') {
            console.warn('renderSinglePartThumbnail not available - returning null');
            return null;
        }
        
        // Render to the temporary canvas
        window.renderSinglePartThumbnail(tempCanvas, partIdx, quality);
        
        // Convert canvas to data URL (PNG)
        const dataUrl = tempCanvas.toDataURL('image/png');
        return dataUrl;
    } catch (error) {
        console.error(`Failed to generate thumbnail for part ${partIdx}:`, error);
        return null;
    } finally {
        // Clean up temporary canvas
        document.body.removeChild(tempCanvas);
    }
}

/**
 * Generate thumbnail data URLs for all ingredients in a recipe
 * Groups by unique part (same part with different colors uses same thumbnail)
 * 
 * @param {object[]} ingredients - Array of aggregated ingredients from aggregator
 * @param {object} options - Configuration options
 *   - size: thumbnail canvas size (default: 120)
 *   - quality: 'low-res' or 'high-res' (default: 'low-res')
 * @returns {Map} Map of {key -> dataUrl} for each unique ingredient
 */
export function generateRecipeCardThumbnails(ingredients, options = {}) {
    const { size = 120, quality = 'low-res' } = options;
    
    const thumbnails = new Map();
    
    // Get unique parts from ingredients
    const uniqueParts = new Set(ingredients.map(ing => ing.key));
    
    // Generate thumbnail for each unique part
    for (const partKey of uniqueParts) {
        // Find the original part data to get index
        const ingredient = ingredients.find(ing => ing.key === partKey);
        
        if (ingredient && typeof ingredient.partIdx !== 'undefined') {
            const dataUrl = generatePartThumbnailDataUrl(ingredient.partIdx, size, quality);
            if (dataUrl) {
                thumbnails.set(partKey, dataUrl);
            }
        }
    }
    
    return thumbnails;
}

/**
 * Create an HTML element for a thumbnail image
 * 
 * @param {string} dataUrl - Data URL of the thumbnail image
 * @param {string} altText - Alt text for accessibility
 * @param {number} size - Size in pixels (default: 80)
 * @returns {string} HTML for thumbnail image element
 */
export function createThumbnailHTML(dataUrl, altText = 'Part thumbnail', size = 80) {
    if (!dataUrl) {
        return `<div style="width: ${size}px; height: ${size}px; background: #f0f0f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px;">No image</div>`;
    }
    
    return `
        <img 
            src="${dataUrl}" 
            alt="${altText}" 
            style="
                width: ${size}px;
                height: ${size}px;
                border-radius: 10px;
                object-fit: contain;
                background: #f9f9f9;
                border: 1px solid #e0e0e0;
            "
        />
    `;
}
