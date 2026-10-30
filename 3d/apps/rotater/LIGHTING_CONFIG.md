# Lighting Effects Configuration

The rotater app uses a centralized lighting system with **global parameter ranges** and **per-preset normalized values**.

## Architecture

```
LIGHTING_RANGES (lighting-effects.js)
    ↓
    Defines min/max for each parameter
    
    ↓
    
Presets (presets.json)
    ↓
    Store normalized values (0-1) for each parameter
    
    ↓
    
LightingEffects class
    ↓
    Converts normalized → actual values using LIGHTING_RANGES
```

## Global Settings (lighting-effects.js)

Define the min/max ranges for all lighting parameters. These are the **absolute limits** that all presets will use.

```javascript
const LIGHTING_RANGES = {
    ambientPower: { min: 3, max: 10 },           // How dark shadows get
    keyMultiplier: { min: 5, max: 30 },          // How bright highlights get
    fillDivisor: { min: 1.5, max: 4.0 },         // Shadow depth
    fillBase: { min: 0.005, max: 0.05 },         // Base fill intensity
    exposureDivisor: { min: 0.3, max: 1.2 },     // Exposure reduction
    shadowBaseOpacity: { min: 0.04, max: 0.15 }, // Min shadow visibility
    shadowIntensityMultiplier: { min: 0.2, max: 1.0 },  // Shadow slider strength
    shadowMaxOpacity: { min: 0.5, max: 1.0 },    // Shadow cap
};
```

### How It Works

- **0.0** = Use minimum value from LIGHTING_RANGES
- **0.5** = Use middle value (default, neutral)
- **1.0** = Use maximum value from LIGHTING_RANGES

Example: If `keyMultiplier` has range `{ min: 5, max: 30 }`:
- Preset value 0.0 → actual value 5
- Preset value 0.5 → actual value 17.5 (middle)
- Preset value 1.0 → actual value 30

## Preset Settings (presets.json)

Each preset stores **normalized values (0-1)** for each parameter:

```json
{
  "id": "ceramic",
  "name": "Ceramic",
  "url": "?c=cacdd3&...",
  "lighting": {
    "ambientPower": 0.5,           // Middle (neutral)
    "keyMultiplier": 0.5,          // Middle (neutral)
    "fillDivisor": 0.5,            // Middle (neutral)
    "fillBase": 0.5,               // Middle (neutral)
    "exposureDivisor": 0.5,        // Middle (neutral)
    "shadowBaseOpacity": 0.5,      // Middle (neutral)
    "shadowIntensityMultiplier": 0.5,  // Middle (neutral)
    "shadowMaxOpacity": 0.5        // Middle (neutral)
  }
}
```

## Quick Adjustments

### Make Shadows Darker

Increase `ambientPower` (push toward 1.0):
- Default: 0.5 → New: 0.7 (will map to ~8.1 instead of ~6.5)

Increase `shadowIntensityMultiplier` (push toward 1.0):
- Default: 0.5 → New: 0.8 (will map to ~0.76 instead of ~0.6)

### Make Highlights Brighter

Increase `keyMultiplier` (push toward 1.0):
- Default: 0.5 → New: 0.8 (will map to ~25 instead of ~17.5)

Decrease `exposureDivisor` (push toward 0.0):
- Default: 0.5 → New: 0.3 (will map to ~0.57 instead of ~0.75)

### Increase Shadow Depth

Increase `fillDivisor` (push toward 1.0):
- Default: 0.5 → New: 0.7 (will map to ~3.28 instead of ~2.75)

Decrease `fillBase` (push toward 0.0):
- Default: 0.5 → New: 0.3 (will map to ~0.0173 instead of ~0.0275)

## Example: Dramatic Preset

```json
{
  "id": "dramatic",
  "name": "Dramatic",
  "lighting": {
    "ambientPower": 0.7,           // Darker shadows: 3-10 → ~7.9
    "keyMultiplier": 0.8,          // Brighter highlights: 5-30 → ~25
    "fillDivisor": 0.7,            // More shadow depth: 1.5-4.0 → ~3.28
    "fillBase": 0.2,               // Less fill light: 0.005-0.05 → ~0.014
    "exposureDivisor": 0.3,        // Darker overall: 0.3-1.2 → ~0.57
    "shadowBaseOpacity": 0.7,      // Darker build plate: 0.04-0.15 → ~0.117
    "shadowIntensityMultiplier": 0.8,  // Stronger shadows: 0.2-1.0 → ~0.76
    "shadowMaxOpacity": 0.9        // Allow near-black shadows: 0.5-1.0 → ~0.95
  }
}
```

## How to Modify

### Change Global Ranges

1. Open `lighting-effects.js`
2. Find the `LIGHTING_RANGES` object at the top
3. Adjust min/max for any parameter
4. Save and hard refresh app

**Example: Make keyMultiplier more aggressive**
```javascript
keyMultiplier: { min: 10, max: 50 }  // Was: { min: 5, max: 30 }
```

### Change Per-Preset Values

1. Open `presets.json`
2. Find the preset you want to modify
3. Adjust the `lighting` object values (0.0 to 1.0)
4. Save and hard refresh app

Changes take effect when:
- The app loads (uses default 0.5 for all if not specified)
- A preset is selected from the UI

## Technical Details

### Calculation Formula

```
actualValue = range.min + (normalizedValue * (range.max - range.min))
```

### Contrast Values

The contrast parameter used internally ranges from ~0.5 to ~4:
- 0.5 = very soft (contrast slider at -100)
- 1.0 = neutral (contrast slider at 0)
- 4.0 = very hard (contrast slider at +100)

Formulas use powers of contrast (^2, ^3, etc.) to create aggressive changes at high contrast.

### Apply Order

1. User adjusts Contrast slider → state updates
2. `applyTextureLighting()` called
3. `lightingEffects.updateConfig()` applies preset (if loaded)
4. `lightingEffects.calculateActualValues()` converts normalized → actual
5. `lightingEffects.applyLighting()` updates light intensities using actual values
6. Render loop applies changes

## Debugging

Check current normalized config in browser console:
```javascript
console.log('Normalized:', lightingEffects.getConfig());
console.log('Actual values:', lightingEffects.getActualValues());
```

Manually test a config:
```javascript
lightingEffects.updateConfig({
  ambientPower: 0.8,
  keyMultiplier: 0.9
});
// Lighting updates immediately
```

## Files

- **`lighting-effects.js`** - Contains LIGHTING_RANGES and LightingEffects class
- **`presets.json`** - Preset definitions with normalized lighting values (0-1)
- **`script.js`** - Uses the lighting effects module
- **`LIGHTING_CONFIG.md`** - This file (documentation)
