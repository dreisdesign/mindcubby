# Settings Modal Usage Guide

## Overview
The Smoothie settings modal is a production-ready component for theme and appearance management. It can be used in three different integration patterns depending on your app's layout.

## Components

### `labs-settings-card`
The core settings component with:
- Theme selector ("All Apps" - affects all Smoothie apps)
- Appearance toggle (Light/Dark mode)
- Reset button (optional, can be hidden with `hide-reset` attribute)

### Integration Wrappers
Choose based on your layout:

1. **`labs-footer-settings-wrapper`** - Complete footer + overlay + settings
2. **`labs-overlay` + `labs-settings-card`** - Just modal, positioned anywhere
3. **Manual overlay wiring** - Maximum control

## Usage Patterns

### Pattern A: Top-Right Icon Button (Recommended for modal UX)
Perfect for app headers/top bars. Settings icon opens modal overlay.

```html
<script type="module">
  import '/libs/smoothie-design-system/v3.0/src/components/labs-overlay.js';
  import '/libs/smoothie-design-system/v3.0/src/components/labs-settings-card.js';
  import '/libs/smoothie-design-system/v3.0/src/components/labs-button.js';
  import '/libs/smoothie-design-system/v3.0/src/components/labs-icon.js';
</script>

<labs-button id="settings-btn" variant="icon" size="large">
  <labs-icon slot="icon-left" name="settings"></labs-icon>
</labs-button>

<labs-overlay id="settings-overlay" size="medium" transparent>
  <labs-settings-card id="settings-card"></labs-settings-card>
</labs-overlay>

<script>
  const btn = document.getElementById('settings-btn');
  const overlay = document.getElementById('settings-overlay');
  const card = document.getElementById('settings-card');
  
  btn.addEventListener('click', () => overlay.toggle());
  card.addEventListener('close', () => overlay.close());
</script>
```

### Pattern B: Footer Integration (Full layout apps)
Use when your app has a sticky footer.

```html
<script type="module">
  import '/libs/smoothie-design-system/v3.0/src/components/labs-footer-settings-wrapper.js';
  import '/libs/smoothie-design-system/v3.0/src/components/labs-footer-layout.js';
</script>

<labs-footer-layout>
  <labs-container slot="content">Your app content</labs-container>
  
  <labs-footer-settings-wrapper slot="footer">
    <div slot="left"></div>
    <!-- Right slot automatically includes settings gear icon -->
  </labs-footer-settings-wrapper>
</labs-footer-layout>
```

### Pattern C: Minimal Boilerplate
Simplest footer setup without full layout.

```html
<labs-footer-settings-wrapper>
  <div slot="left"></div>
</labs-footer-settings-wrapper>
```

## Features

### Theme Persistence
Settings automatically persist to localStorage:
- `localStorage.getItem('smoothie-theme')` - Theme name
- `localStorage.getItem('smoothie-appearance')` - 'light' or 'dark'

### Customization
Hide the reset button:
```html
<labs-settings-card hide-reset></labs-settings-card>
```

### Events
The card dispatches events for app-level handling:
- `close` - User clicked X or overlay backdrop
- `reset-all` - User confirmed reset (listen at app level if needed)

## MindCubby Implementation

Replace the separate theme + appearance buttons with the unified settings modal:

**Before:**
```html
<labs-theme-button></labs-theme-button>
<labs-theme-toggle></labs-theme-toggle>
```

**After:**
```html
<labs-button id="settings-btn" variant="icon" size="large">
  <labs-icon slot="icon-left" name="settings"></labs-icon>
</labs-button>

<labs-overlay id="settings-overlay" size="medium" transparent>
  <labs-settings-card></labs-settings-card>
</labs-overlay>

<script>
  document.getElementById('settings-btn').addEventListener('click', 
    () => document.getElementById('settings-overlay').toggle());
  document.getElementById('settings-card').addEventListener('close',
    () => document.getElementById('settings-overlay').close());
</script>
```

## Showcase Pages

- **Settings Modal:** `/smoothie/patterns/settings-panel/`
- **Footer Pattern:** `/smoothie/patterns/footer/`
- **Footer with Settings:** `/smoothie/patterns/footer-with-settings/`

## Browser Support
Works in all modern browsers supporting:
- Web Components (Shadow DOM)
- CSS custom properties
- localStorage API
