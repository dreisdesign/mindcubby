/**
 * Lighting Effects Module
 * Centralizes all lighting calculations and shadow rendering for easy configuration
 * 
 * ARCHITECTURE:
 * - lighting-config.json: Global min/max for each parameter (easiest to edit!)
 * - Presets in presets.json: Store normalized values (0-1) for each parameter
 * - LightingEffects class: Converts normalized -> actual values using LIGHTING_RANGES
 */

// Global lighting parameter ranges - loaded from lighting-config.json
// Will be populated when the config is fetched
let LIGHTING_RANGES = {};

const DEFAULT_LIGHTING_CONFIG = {
    // Base light intensities (not normalized)
    ambient: 0.45,
    key: 1.9,
    fill: 0.30,
    rim: 0.92,
    exposure: 0.75,
    
    // Contrast effect multipliers (normalized 0-1, will be mapped to LIGHTING_RANGES)
    ambientPower: 0.5,           // Middle of range = ~5.5
    keyMultiplier: 0.5,          // Middle of range = ~16.5
    fillDivisor: 0.5,            // Middle of range = ~2.75
    fillBase: 0.5,               // Middle of range = ~0.025
    exposureDivisor: 0.5,        // Middle of range = ~0.65
    shadowBaseOpacity: 0.5,      // Middle of range = ~0.09
    shadowIntensityMultiplier: 0.5,  // Middle of range = ~0.6
    shadowMaxOpacity: 0.5,       // Middle of range = ~0.75
};

class LightingEffects {
    constructor(config = {}) {
        this.config = { ...DEFAULT_LIGHTING_CONFIG, ...config };
        this.calculateActualValues();
    }
    
    /**
     * Convert normalized config (0-1) to actual values using LIGHTING_RANGES
     */
    calculateActualValues() {
        this.actualValues = {};
        const baseKeys = ['ambient', 'key', 'fill', 'rim', 'exposure'];
        for (const [key, value] of Object.entries(this.config)) {
            if (baseKeys.includes(key)) {
                // Base values are not normalized
                this.actualValues[key] = this.config[key];
            } else if (key in LIGHTING_RANGES) {
                const range = LIGHTING_RANGES[key];
                this.actualValues[key] = range.min + (value * (range.max - range.min));
            }
        }
    }
    
    /**
     * Calculate light intensities based on texture state
     * @param {number} contrast - Contrast value (0-4, where 1 is neutral)
     * @param {number} shadowsAmt - Shadow intensity (0-100)
     * @param {number} gain - Overall brightness gain
     * @param {Object} lights - Object with { ambientLight, keyLight, fillLight, rimLight }
     * @param {Object} params - Additional params { highlights, fwd, shadowBodyFactor, shadowRimFactor }
     */
    applyLighting(contrast, shadowsAmt, gain, lights, params = {}) {
        const { ambientLight, keyLight, fillLight, rimLight } = lights;
        const { highlights = 1, fwd = 1, shadowBodyFactor = 1, shadowRimFactor = 1 } = params;
        
        const inv = 1 / Math.max(0.5, contrast);
        
        if (ambientLight) {
            ambientLight.intensity = this.actualValues.ambient * gain * 
                Math.pow(inv, this.actualValues.ambientPower) * shadowBodyFactor;
        }
        
        if (keyLight) {
            keyLight.intensity = this.actualValues.key * gain * 
                Math.pow(contrast, 3) * this.actualValues.keyMultiplier;
        }
        
        if (fillLight) {
            fillLight.intensity = this.actualValues.fill * gain * this.actualValues.fillBase / 
                Math.pow(contrast, this.actualValues.fillDivisor);
        }
        
        if (rimLight) {
            rimLight.intensity = this.actualValues.rim * gain * fwd * 
                Math.pow(highlights, 1.5) * shadowRimFactor;
        }
    }
    
    /**
     * Apply tone mapping exposure
     * @param {Object} renderer - Three.js renderer
     * @param {number} contrast - Contrast value
     * @param {number} gain - Overall brightness gain
     */
    applyExposure(renderer, contrast, gain) {
        if (!renderer) return;
        
        renderer.toneMappingExposure = Math.max(0.3, Math.min(2.0,
            this.actualValues.exposure * Math.pow(gain, 0.92) / 
            Math.pow(contrast, this.actualValues.exposureDivisor)
        ));
    }
    
    /**
     * Calculate shadow opacity for build plate
     * @param {number} shadowsAmt - Shadow intensity (0-100)
     * @param {number} lumScale - Luminance scale factor
     * @returns {number} Shadow opacity (0-1)
     */
    calculateShadowOpacity(shadowsAmt, lumScale = 1) {
        const normalizedShadows = Math.max(0, Math.min(1, shadowsAmt / 100));
        return Math.min(
            this.actualValues.shadowMaxOpacity,
            this.actualValues.shadowBaseOpacity + normalizedShadows * this.actualValues.shadowIntensityMultiplier * lumScale
        );
    }
    
    /**
     * Update shadow catcher material
     * @param {Object} shadowCatcher - Shadow catcher mesh
     * @param {boolean} shadowsOn - Whether shadows are enabled
     * @param {number} shadowsAmt - Shadow intensity
     * @param {number} lumScale - Luminance scale
     */
    updateShadowMaterial(shadowCatcher, shadowsAmt, lumScale = 1) {
        if (!shadowCatcher || !shadowCatcher.material) return;
        
        shadowCatcher.material.color.set(0x000000);
        shadowCatcher.material.opacity = this.calculateShadowOpacity(shadowsAmt, lumScale);
        shadowCatcher.material.needsUpdate = true;
    }
    
    /**
     * Get current normalized config (0-1 values)
     */
    getConfig() {
        return { ...this.config };
    }
    
    /**
     * Get actual calculated values after range mapping
     */
    getActualValues() {
        return { ...this.actualValues };
    }
    
    /**
     * Merge partial config (for preset overrides)
     * @param {Object} partialConfig - Normalized values (0-1)
     */
    updateConfig(partialConfig) {
        this.config = { ...this.config, ...partialConfig };
        this.calculateActualValues();
    }
}

// Export for use in script.js
const lightingEffects = new LightingEffects();
