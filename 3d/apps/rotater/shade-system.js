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
 * Compute auto-brightness using opacity-equivalent compositing.
 *
 * Negative shade moves toward white, positive shade moves toward black.
 * This keeps saturation response stable regardless of the source color HSL lightness.
 *
 * Example: red (#ff0000) with 80% white blend => #ffcccc (same as 20% opacity over white).
 */
export function blendAutoBrightnessColor(baseHex, shadeVal, maxBlendPercent) {
    const shade = Number(shadeVal) || 0;
    if (shade === 0) return new THREE.Color(baseHex);

    const strength = Math.max(0, Math.min(1, Math.abs(shade) / 100));
    const maxBlend = Math.max(0, Math.min(1, (Number(maxBlendPercent) || 0) / 100));
    const amount = strength * maxBlend;
    const targetHex = shade < 0 ? '#ffffff' : '#000000';
    return lerpColorTowardTarget(baseHex, targetHex, amount);
}

/**
 * Compute build plate color when auto-brightness is enabled.
 * This uses autoBrightness.buildPlate rules (maxBlendPercent=40 by default).
 */
export function computeBuildPlateAutoBrightnessColor(baseHex) {
    const shade = getColorRuleNumber('autoBrightness.buildPlate.shade', -100);
    const maxBlendPercent = getColorRuleNumber('autoBrightness.buildPlate.maxBlendPercent', 40);
    return blendAutoBrightnessColor(baseHex, shade, maxBlendPercent);
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
    return blendAutoBrightnessColor(baseHex, shade, maxBlendPercent);
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
    return getColorRuleNumber(`autoBrightness.${target}.maxBlendPercent`, 40);
}

export default {
    setColorRuleGetter,
    blendShadeColor,
    blendAutoBrightnessColor,
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

