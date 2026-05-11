/**
 * shade-system.js
 * ES Module for managing shade/tone computations and auto-brightness logic.
 * Extracted to improve maintainability and fix perceptual tuning issues.
 * 
 * Responsibilities:
 * - Compute shaded colors for build plate, background, and model
 * - Provide uniform API for shade operations
 * - Fix perceptual tuning (lightenScale) to not prevent extreme shades
 * 
 * Dependencies:
 * - script.js must call setColorRuleGetter() before using shade functions
 * - THREE.js must be available globally (imported by script.js)
 */

import * as THREE from 'three';

let colorRuleGetter = null;

/**
 * Set the color rule getter function that script.js provides.
 * script.js must call this with its getColorRuleNumber function.
 * @param {Function} getter - Function(path, fallback) that returns color rule values
 */
export function setColorRuleGetter(getter) {
    colorRuleGetter = getter;
}

/**
 * Internal: Get a color rule value using the getter provided by script.js.
 */
function getColorRuleNumber(path, fallback = 0) {
    if (!colorRuleGetter) {
        console.warn('[shade-system] Color rule getter not initialized. Call setColorRuleGetter() first.');
        return fallback;
    }
    return colorRuleGetter(path, fallback);
}

/**
 * Core shade computation: blend a base hex color toward white or black
 * based on a shade value (-100 to +100).
 * 
 * KEY FIX: lightenScale is NOT multiplied into baseMixAmount.
 * This ensures shade=-100 always produces white (not gray).
 * 
 * @param {string} baseHex - Base color in #RRGGBB format
 * @param {number} shadeVal - Shade value from -100 (white) to +100 (black)
 * @param {number} maxDeltaPercent - Maximum blend strength (0-100)
 * @returns {THREE.Color} Computed shade color
 */
export function blendShadeColor(baseHex, shadeVal, maxDeltaPercent) {
    const shade = Number(shadeVal) || 0;
    
    // Clamp shade to valid range
    if (shade === 0) {
        return new THREE.Color(baseHex);
    }
    
    // Calculate blend amount: abs(shade) / 100 * (maxDeltaPercent / 100)
    // Example: shade=-100, maxDeltaPercent=10 → 1.0 * 0.1 = 0.1 (10% blend)
    const baseMixAmount = Math.max(0, Math.min(1, (Math.abs(shade) / 100) * (Math.max(0, maxDeltaPercent) / 100)));
    
    // Get perceptual tuning scales
    const lightenScale = Math.max(0, getColorRuleNumber('shadeResponse.lightenScale', 1.0));
    const darkenScale = Math.max(0, getColorRuleNumber('shadeResponse.darkenScale', 1.0));
    
    if (shade < 0) {
        // Blend toward white (lighter side)
        // FIX: Don't multiply lightenScale with baseMixAmount.
        // This ensures -100 produces full white, not gray.
        // (lightenScale can be used for perceptual adjustments in the future)
        return lerpColorTowardTarget(baseHex, '#ffffff', baseMixAmount);
    } else {
        // Blend toward black (darker side)
        // Apply darkenScale as perceptual tuning
        const darkBlendAmount = Math.max(0, Math.min(1, baseMixAmount * darkenScale));
        return lerpColorTowardTarget(baseHex, '#000000', darkBlendAmount);
    }
}

/**
 * Lerp a color from base toward a target color by a given amount.
 * @param {string} baseHex - Starting color in #RRGGBB format
 * @param {string} targetHex - Target color in #RRGGBB format
 * @param {number} amount - Blend amount (0-1, clamped)
 * @returns {THREE.Color} Interpolated color
 */
export function lerpColorTowardTarget(baseHex, targetHex, amount) {
    const base = new THREE.Color(baseHex);
    const target = new THREE.Color(targetHex);
    base.lerp(target, Math.max(0, Math.min(1, amount)));
    return base;
}

/**
 * Compute build plate shade color using surface shade rules (jumpPercent/snapCount).
 * Note: Build plate manual shading uses surfaceShade rules, not autoBrightness rules.
 * The caller must provide the maxDeltaPercent calculated from surfaceShade config.
 */
export function computeBuildPlateShadeColor(baseHex, shadeVal, surfaceShadeMaxDelta) {
    return blendShadeColor(baseHex, shadeVal, surfaceShadeMaxDelta);
}

/**
 * Compute build plate color when auto-brightness is enabled.
 * This uses autoBrightness.buildPlate rules (maxBlendPercent=10).
 */
export function computeBuildPlateAutoBrightnessColor(baseHex) {
    const shade = getColorRuleNumber('autoBrightness.buildPlate.shade', -100);
    const maxBlendPercent = getColorRuleNumber('autoBrightness.buildPlate.maxBlendPercent', 10);
    return blendShadeColor(baseHex, shade, maxBlendPercent);
}

/**
 * Compute background shade color using surface shade rules (jumpPercent/snapCount).
 * Note: Background manual shading uses surfaceShade rules, not autoBrightness rules.
 * The caller must provide the maxDeltaPercent calculated from surfaceShade config.
 */
export function computeBackgroundShadeColor(baseHex, shadeVal, surfaceShadeMaxDelta) {
    return blendShadeColor(baseHex, shadeVal, surfaceShadeMaxDelta);
}

/**
 * Compute background color when auto-brightness is enabled.
 * This uses autoBrightness.background rules (maxBlendPercent=40).
 */
export function computeBackgroundAutoBrightnessColor(baseHex) {
    const shade = getColorRuleNumber('autoBrightness.background.shade', -100);
    const maxBlendPercent = getColorRuleNumber('autoBrightness.background.maxBlendPercent', 40);
    return blendShadeColor(baseHex, shade, maxBlendPercent);
}

/**
 * Compute model tone color using model shade rules.
 * The caller must provide the maxDeltaPercent calculated from modelShade config.
 */
export function computeTonedColor(baseHex, toneVal, modelShadeMaxDelta) {
    return blendShadeColor(baseHex, toneVal, modelShadeMaxDelta);
}

/**
 * Compute surface shade color using surface shade rules.
 * The caller must provide the maxDeltaPercent calculated from surfaceShade config.
 */
export function computeSurfaceShadeColor(baseHex, shadeVal, surfaceShadeMaxDelta) {
    return blendShadeColor(baseHex, shadeVal, surfaceShadeMaxDelta);
}

/**
 * Validate and clamp a shade value to valid range [-100, +100].
 */
export function clampShade(value) {
    return Math.max(-100, Math.min(100, Math.round(Number(value) || 0)));
}

/**
 * Get the auto-brightness shade value for a given target (buildPlate/background).
 */
export function getAutoShade(target) {
    // target: 'buildPlate' or 'background'
    return getColorRuleNumber(`autoBrightness.${target}.shade`, target === 'buildPlate' ? -100 : -100);
}

/**
 * Get the auto-brightness max blend percent for a given target.
 */
export function getAutoMaxBlendPercent(target) {
    // target: 'buildPlate' or 'background'
    return getColorRuleNumber(`autoBrightness.${target}.maxBlendPercent`, target === 'buildPlate' ? 10 : 40);
}

export default {
    setColorRuleGetter,
    blendShadeColor,
    lerpColorTowardTarget,
    computeBuildPlateShadeColor,
    computeBuildPlateAutoBrightnessColor,
    computeBackgroundShadeColor,
    computeBackgroundAutoBrightnessColor,
    computeTonedColor,
    computeSurfaceShadeColor,
    clampShade,
    getAutoShade,
    getAutoMaxBlendPercent
};

