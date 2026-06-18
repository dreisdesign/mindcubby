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

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

let colorRuleGetter = null;
let shadeBlendMode = 'hsl';

/**
 * Set the color rule getter function that script.js provides.
 * script.js must call this with its getColorRuleNumber function.
 * @param {Function} getter - Function(path, fallback) that returns color rule values
 */
export function setColorRuleGetter(getter) {
    colorRuleGetter = getter;
}

export function setShadeBlendMode(mode) {
    shadeBlendMode = mode === 'hsb' ? 'hsb' : 'hsl';
}

export function getShadeBlendMode() {
    return shadeBlendMode;
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
 * Adjusts lightness based on shade and applies lighter-side desaturation.
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
    const lightenSaturationDampen = Math.max(0, getColorRuleNumber('shadeResponse.lightenSaturationDampen', 1.6));
    const darkenSaturationBoost = Math.max(0, getColorRuleNumber('shadeResponse.darkenSaturationBoost', 0.8));

    if (shadeBlendMode === 'hsb') {
        const c = new THREE.Color(baseHex);
        const hsv = rgbToHsv(c.r, c.g, c.b);
        const isNeutral = hsv.s <= 0.0001;

        if (shade < 0) {
            const delta = Math.max(0, Math.min(1, baseDelta * lightenScale));
            hsv.v = Math.max(0, Math.min(1, hsv.v + ((1 - hsv.v) * delta)));
            if (!isNeutral) {
                const satMix = Math.max(0, Math.min(1, delta * lightenSaturationDampen));
                hsv.s = Math.max(0, Math.min(1, hsv.s * (1 - satMix)));
            }
        } else {
            const delta = Math.max(0, Math.min(1, baseDelta * darkenScale));
            hsv.v = Math.max(0, Math.min(1, hsv.v * (1 - delta)));
            if (!isNeutral) {
                const satMix = Math.max(0, Math.min(1, delta * darkenSaturationBoost));
                hsv.s = Math.max(0, Math.min(1, hsv.s + ((1 - hsv.s) * satMix)));
            }
        }

        const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v);
        return new THREE.Color(r, g, b);
    }

    const c = new THREE.Color(baseHex);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    const isNeutral = hsl.s <= 0.0001;

    if (shade < 0) {
        const delta = Math.max(0, Math.min(1, baseDelta * lightenScale));
        hsl.l = Math.max(0, Math.min(1, hsl.l + ((1 - hsl.l) * delta)));
        if (!isNeutral) {
            // Lightening naturally washes color; reduce saturation proportionally.
            const satMix = Math.max(0, Math.min(1, delta * lightenSaturationDampen));
            hsl.s = Math.max(0, Math.min(1, hsl.s * (1 - satMix)));
        }
    } else {
        const delta = Math.max(0, Math.min(1, baseDelta * darkenScale));
        hsl.l = Math.max(0, Math.min(1, hsl.l * (1 - delta)));
        if (!isNeutral) {
            // Darkening often increases perceived color intensity; boost saturation proportionally.
            const satMix = Math.max(0, Math.min(1, delta * darkenSaturationBoost));
            hsl.s = Math.max(0, Math.min(1, hsl.s + ((1 - hsl.s) * satMix)));
        }
    }

    return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
}

function rgbToHsv(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (d !== 0) {
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
        else if (max === g) h = ((b - r) / d + 2);
        else h = ((r - g) / d + 4);
        h /= 6;
    }

    return { h, s, v };
}

function hsvToRgb(h, s, v) {
    const i = Math.floor((h % 1) * 6);
    const f = (h * 6) - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    const mod = ((i % 6) + 6) % 6;

    if (mod === 0) return { r: v, g: t, b: p };
    if (mod === 1) return { r: q, g: v, b: p };
    if (mod === 2) return { r: p, g: v, b: t };
    if (mod === 3) return { r: p, g: q, b: v };
    if (mod === 4) return { r: t, g: p, b: v };
    return { r: v, g: p, b: q };
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
    setShadeBlendMode,
    getShadeBlendMode,
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

