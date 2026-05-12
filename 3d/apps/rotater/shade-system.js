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
 * Core shade computation in HSL space.
 * Preserves hue/saturation and adjusts only lightness based on shade.
 *
 * @param {string} baseHex - Base color in #RRGGBB format
 * @param {number} shadeVal - Shade value from -100 (lighter) to +100 (darker)
 * @param {number} maxDeltaPercent - Maximum lightness delta (0-100)
 * @returns {THREE.Color} Computed shade color
 */
export function blendShadeColor(baseHex, shadeVal, maxDeltaPercent) {
    const shade = Number(shadeVal) || 0;

    if (shade === 0) return new THREE.Color(baseHex);

    const baseDelta = Math.max(0, Math.min(1, (Math.abs(shade) / 100) * (Math.max(0, maxDeltaPercent) / 100)));
    const lightenScale = Math.max(0, getColorRuleNumber('shadeResponse.lightenScale', 1.0));
    const darkenScale = Math.max(0, getColorRuleNumber('shadeResponse.darkenScale', 1.0));

    const c = new THREE.Color(baseHex);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);

    if (shade < 0) {
        const delta = Math.max(0, Math.min(1, baseDelta * lightenScale));
        hsl.l = Math.max(0, Math.min(1, hsl.l + ((1 - hsl.l) * delta)));
    } else {
        const delta = Math.max(0, Math.min(1, baseDelta * darkenScale));
        hsl.l = Math.max(0, Math.min(1, hsl.l * (1 - delta)));
    }

    return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
}

/**
 * Compute build plate shade color using surface shade rules (jumpPercent/snapCount).
 * Note: Build plate manual shading uses surfaceShade rules, not autoBrightness rules.
 * The caller must provide the maxDeltaPercent calculated from surfaceShade config.
 */
export function computeBuildPlateShadeColor(baseHex, shadeVal, surfaceShadeMaxDelta) {
    return blendShadeColor(baseHex, shadeVal, surfaceShadeMaxDelta);
}

function getSurfaceShadeMaxDelta() {
    const jumpPercent = getColorRuleNumber('surfaceShade.jumpPercent', 20);
    const snapCount = Math.max(3, Math.round(getColorRuleNumber('surfaceShade.snapCount', 9)));
    return jumpPercent * Math.max(0, (snapCount - 1) / 2);
}

/**
 * Compute build plate color when auto-brightness is enabled.
 * Auto now uses the same surface shade response curve as manual mode.
 */
export function computeBuildPlateAutoBrightnessColor(baseHex) {
    const shade = getColorRuleNumber('autoBrightness.buildPlate.shade', -100);
    const maxDelta = getSurfaceShadeMaxDelta();
    return computeBuildPlateShadeColor(baseHex, shade, maxDelta);
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
 * Auto now uses the same surface shade response curve as manual mode.
 */
export function computeBackgroundAutoBrightnessColor(baseHex) {
    const shade = getColorRuleNumber('autoBrightness.background.shade', -100);
    const maxDelta = getSurfaceShadeMaxDelta();
    return computeBackgroundShadeColor(baseHex, shade, maxDelta);
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

export default {
    setColorRuleGetter,
    blendShadeColor,
    computeBuildPlateShadeColor,
    computeBuildPlateAutoBrightnessColor,
    computeBackgroundShadeColor,
    computeBackgroundAutoBrightnessColor,
    computeTonedColor,
    computeSurfaceShadeColor,
    clampShade,
    getAutoShade
};

