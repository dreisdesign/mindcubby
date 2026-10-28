# Modal & Settings Modal Usage Guide

## Overview
Smoothie provides overlay components for dialogs and modals. The `labs-overlay` component is flexible and can contain any content. For theme and appearance management, use `labs-settings-card` inside the overlay.

## Components

### `labs-overlay`
The core overlay/modal component that positions content centered on screen with a backdrop.
- Customizable sizing (small, medium, large)
- Transparent or opaque backdrop options
- Flexible content support (any HTML/Web Components)

### `labs-settings-card`
Pre-built settings component containing:
- Theme selector ("All Apps" - affects all Smoothie apps)
- Appearance toggle (Light/Dark mode)
- Reset button (optional, can be hidden with `hide-reset` attribute)

### Integration Wrappers
Choose based on your layout:

1. **`labs-footer-settings-wrapper`** - Complete footer + overlay + settings
2. **`labs-overlay` + `labs-settings-card`** - Settings modal positioned anywhere
3. **`labs-overlay` + custom content** - Generic modal for any content
4. **Manual overlay wiring** - Maximum control

## Usage Patterns

### Pattern A: Top-Right Modal Button (Recommended for MindCubby)
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

### Pattern B: Generic Modal Dialog
Use for any custom content - forms, confirmation dialogs, notifications, etc.

```html
<labs-overlay id="my-modal" size="medium" transparent>
  <div style="padding: 1.5rem;">
    <h2>Dialog Title</h2>
    <p>Your content here</p>
    <button>Close</button>
  </div>
</labs-overlay>

<button id="open-btn">Open Modal</button>

<script>
  document.getElementById('open-btn').addEventListener('click', 
    () => document.getElementById('my-modal').toggle());
</script>
```

### Pattern C: Footer Integration (Full layout apps)
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
The settings card dispatches events for app-level handling:
- `close` - User clicked X or overlay backdrop
- `reset-all` - User confirmed reset (listen at app level if needed)

## Showcase Pages

- **Modal:** `/smoothie/patterns/modal/` - Generic overlay component
- **Settings Modal:** `/smoothie/patterns/settings-modal/` - Overlay with settings card
- **Footer Pattern:** `/smoothie/patterns/footer/` - Demonstrates footer integration
- **Footer with Settings:** `/smoothie/patterns/footer-with-settings/` - Complete footer example

## MindCubby Implementation

Replace the separate theme + appearance buttons with a unified settings modal:

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

## Browser Support
Works in all modern browsers supporting:
- Web Components (Shadow DOM)
- CSS custom properties
- localStorage API
