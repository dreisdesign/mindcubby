# Smoothie Design System v3.0 - Complete System Guide

## Overview

The Labs apps (Timer, Pad, Note, Tracker, Today-list) have been successfully migrated from Storybook to Smoothie Design System v3.0. This document provides a complete reference for how the system works, including component registration, theming, service worker caching, and automatic versioning.

**Current Version:** v51 (auto-incremented via git hook)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Smoothie Component System](#smoothie-component-system)
3. [Token System (Colors, Typography, Spacing)](#token-system)
4. [Theme & Appearance System](#theme--appearance-system)
5. [Service Worker & Caching Strategy](#service-worker--caching-strategy)
6. [Git Hook Auto-Versioning](#git-hook-auto-versioning)
7. [App Implementations](#app-implementations)
8. [Best Practices for Future Development](#best-practices-for-future-development)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### File Structure

```
mindcubby/
├── libs/smoothie-design-system/v3.0/
│   ├── src/components/               # 20+ web components
│   ├── styles/tokens/                # CSS token files (colors, typography, spacing)
│   └── utils/theme-manager.js        # Theme initialization & management
│
└── labs/                             # Apps using Smoothie v3.0
    ├── index.html                    # Entry point with app selector
    ├── sw.js                         # Global service worker (labs-static-v51)
    ├── timer/
    │   ├── index.html
    │   ├── js/main.js
    │   └── sw.js                     # App-specific SW (optional)
    ├── pad/
    ├── note/
    ├── tracker/
    └── today-list/
```

### Design System vs Apps

- **Smoothie Design System** (`/libs/smoothie-design-system/v3.0/`): Reusable components and tokens
- **Labs Apps**: Consume Smoothie components through standard web component APIs
- **No Build Step**: Pure ES modules, components load dynamically via `import()`

---

## Smoothie Component System

### Available Components (20+)

| Component | Purpose | Usage |
|-----------|---------|-------|
| `<labs-container>` | Layout wrapper for all apps | `<labs-container><!-- content --></labs-container>` |
| `<labs-header>` | App header with optional title/subtitle | `<labs-header center><div slot="title">...</div></labs-header>` |
| `<labs-footer-settings-wrapper>` | Footer with settings modal | `<labs-footer-settings-wrapper></labs-footer-settings-wrapper>` |
| `<labs-button>` | Interactive buttons | `<labs-button @click="handler">Label</labs-button>` |
| `<labs-icon>` | Icon rendering (SVG) | `<labs-icon name="archive"></labs-icon>` |
| `<labs-card>` | Base card container | `<labs-card title="Title">Content</labs-card>` |
| `<labs-metric-card>` | Displays metrics (e.g., "5 Entries") | `<labs-metric-card label="Entries" value="5"></labs-metric-card>` |
| `<labs-list-item>` | List item with metadata | `<labs-list-item title="Item"></labs-list-item>` |
| `<labs-input>` | Text input field | `<labs-input placeholder="..."></labs-input>` |
| `<labs-dropdown>` | Dropdown menu | `<labs-dropdown><option>A</option></labs-dropdown>` |
| `<labs-toast>` | Toast notifications | `<labs-toast id="myToast"></labs-toast>` |
| `<labs-overlay>` | Modal overlay | `<labs-overlay>Content</labs-overlay>` |
| `<labs-page-layout>` | Page layout wrapper | Wraps modal/menu layouts |
| `<labs-theme-toggle>` | Theme switcher (light/dark) | `<labs-theme-toggle></labs-theme-toggle>` |
| `<labs-appearance-toggle>` | Appearance mode selector | `<labs-appearance-toggle></labs-appearance-toggle>` |
| `<labs-flavor-selector>` | Design flavor picker | `<labs-flavor-selector></labs-flavor-selector>` |
| `<labs-theme-button>` | Compact theme button | `<labs-theme-button></labs-theme-button>` |
| `<labs-settings-card>` | Settings panel container | Displays theme/flavor controls |

### Component Registration Pattern

**CRITICAL:** All components MUST use registration guards to prevent double-definition errors:

```javascript
// ✅ CORRECT - Always use this pattern in every component
if (!customElements.get('labs-button')) {
  customElements.define('labs-button', LabsButton);
}

// ❌ WRONG - This will cause "Cannot define multiple custom elements" errors
customElements.define('labs-button', LabsButton);
```

**Why:** Components can be loaded multiple ways:
1. Direct HTML `<script type="module">` import with query param (e.g., `?v=51`)
2. Dynamic `import()` in other components (also with query param)
3. Service worker cache serving either version

Without guards, a component might be registered twice with different cache versions, causing conflicts.

---

## Token System

### CSS Custom Properties Architecture

Tokens are organized in three files under `/libs/smoothie-design-system/v3.0/styles/tokens/`:

#### 1. **colors.css**
Defines color palette for light/dark themes:
```css
:root {
  /* Light theme (default) */
  --color-primary: #0066cc;
  --color-background: #ffffff;
  --color-text: #1a1a1a;
  /* ... more colors */
}

[data-theme="dark"],
.theme-dark {
  /* Dark theme overrides */
  --color-primary: #4da6ff;
  --color-background: #1a1a1a;
  --color-text: #ffffff;
}
```

#### 2. **typography.css**
Font families, sizes, weights:
```css
:root {
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-sm: 14px;
  --font-weight-normal: 400;
  --font-weight-bold: 700;
}
```

#### 3. **spacing.css**
Consistent spacing scale:
```css
:root {
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 2rem;      /* 32px */
  --space-xl: 4rem;      /* 64px */
}
```

### Using Tokens in HTML/CSS

Every app HTML file MUST import tokens:

```html
<!-- In <head>, before component imports -->
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/spacing.css?v=51">
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/colors.css?v=51">
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/typography.css?v=51">
```

Then use in CSS:

```css
.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);      /* 32px */
  padding: var(--space-md);  /* 16px */
  color: var(--color-text);
  font-family: var(--font-family-base);
}
```

**Key Pattern:** Never hardcode pixel values. Always use `var(--space-*)` and `var(--color-*)` for consistency.

---

## Theme & Appearance System

### Storage Architecture

The theme system uses **localStorage** with two independent settings:

| Key | Values | Purpose | Default |
|-----|--------|---------|---------|
| `smoothie-theme` | `blueberry`, `strawberry`, `vanilla` | Color flavor | `blueberry` |
| `smoothie-appearance` | `light`, `dark` | Light/dark mode | `light` |

### CSS Class System

The system applies classes to `document.documentElement` for CSS targeting:

```html
<html class="theme-blueberry appearance-light">
```

Available classes:
- **Theme:** `.theme-blueberry`, `.theme-strawberry`, `.theme-vanilla`
- **Appearance:** `.appearance-light`, `.appearance-dark`

### Theme Manager Initialization

Every app uses the ThemeManager to initialize themes:

```javascript
import { ThemeManager } from '/libs/smoothie-design-system/v3.0/utils/theme-manager.js?v=51';

// Call once on app load
ThemeManager.init();

// ThemeManager automatically:
// 1. Reads localStorage values for smoothie-theme and smoothie-appearance
// 2. Applies classes to document.documentElement
// 3. Enables theme toggle components to work
```

### Persisting Theme Changes

When theme components (like `<labs-theme-toggle>`) change the theme:

```javascript
// Setting theme programmatically:
localStorage.setItem('smoothie-theme', 'strawberry');
document.documentElement.classList.remove('theme-blueberry');
document.documentElement.classList.add('theme-strawberry');

// Setting appearance:
localStorage.setItem('smoothie-appearance', 'dark');
document.documentElement.classList.remove('appearance-light');
document.documentElement.classList.add('appearance-dark');
```

Components automatically sync with localStorage, so themes persist across page reloads.

---

## Service Worker & Caching Strategy

### Why Multiple Service Workers?

- **Global SW** (`/labs/sw.js`): Handles all `/labs/*` requests
- **App-specific SWs** (optional): `tracker/sw.js`, `note/sw.js` for isolated app caching

### Cache Names & Versioning

Cache buckets follow the pattern `{app}-v{number}`:

```
Global: labs-static-v51
Tracker: tracker-v43
Note: daily-note-v42
```

**Important:** Every commit auto-increments the version. Don't manually edit cache names.

### Fetch Strategy

#### Global Service Worker (`/labs/sw.js`)

```javascript
const CACHE_NAME = 'labs-static-v51';

// Strategy:
// 1. Navigation (HTML): Network-first with cached fallback
// 2. Scripts/CSS: Network-first (ensures fresh code is always loaded)
// 3. Assets (images, fonts): Cache-first with network fallback
```

**Network-First for JS/CSS ensures:**
- Fresh code loads on every visit
- Old cached versions don't block updates
- Graceful fallback if network is unavailable

#### App-Specific SWs

Tracker and Note apps have their own SWs for isolated caching:

```javascript
// /labs/tracker/sw.js
const CACHE_NAME = 'tracker-v43';

// Only caches:
// - /labs/tracker/* requests
// - Component dependencies
// - Does NOT interfere with other apps
```

### Cache Cleanup on Activation

When a new version activates, old cache versions are automatically deleted:

```javascript
self.addEventListener('activate', event => {
  const keep = [CACHE_NAME]; // Only keep current version
  event.waitUntil(
    caches.keys().then(keys => {
      console.log('[SW] Activation: Found caches:', keys);
      const toDelete = keys.filter(k => !keep.includes(k));
      console.log('[SW] Deleting old caches:', toDelete);
      return Promise.all(
        toDelete.map(k => caches.delete(k))
      ).then(() => {
        console.log('[SW] Cache cleanup complete. Claiming clients.');
        return self.clients.claim();
      });
    })
  );
});
```

**Result:** Only one version per app in cache storage at any time.

### Query Parameters for Cache-Busting

All imports include `?v=51` query parameter:

```html
<!-- HTML token imports -->
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/spacing.css?v=51">

<!-- Component script imports -->
<script type="module" src="/libs/smoothie-design-system/v3.0/src/components/labs-button.js?v=51"></script>

<!-- App main.js -->
<script type="module">
  import('./js/main.js?v=51');
</script>
```

**Why:** Different query params = different cache keys. Changing `?v=50` to `?v=51` forces fresh download even if URL path is identical.

---

## Git Hook Auto-Versioning

### How It Works

**File:** `.git/hooks/pre-commit`

Every commit:

1. Checks if any `labs/` or `libs/smoothie/` files are staged
2. Extracts current version from `labs-static-v{number}` pattern
3. Increments version by 1
4. Updates all 7 files with new version

### Files Updated Automatically

1. `/labs/sw.js` - Global SW cache name
2. `/labs/timer/index.html` - Token imports query param
3. `/labs/pad/index.html` - Token imports query param
4. `/labs/note/index.html` - Token imports query param
5. `/labs/tracker/index.html` - Token imports query param
6. `/labs/today-list/index.html` - Token imports query param
7. `/libs/smoothie-design-system/v3.0/src/components/labs-settings-card.js` - Dynamic import query params

### Benefits

✅ Never manually edit versions (prevents typos)
✅ Automatic cache-busting on every commit
✅ All versions stay in sync
✅ Pre-commit hook runs before commit completes

### Manual Version Extraction

If needed to see current version:

```bash
grep "labs-static-v" labs/sw.js | head -1
# Output: const CACHE_NAME = 'labs-static-v51';
```

---

## App Implementations

### General App Structure

Every app follows this template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App Name</title>
  
  <!-- CRITICAL: Token imports (spacing, colors, typography) -->
  <link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/spacing.css?v=51">
  <link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/colors.css?v=51">
  <link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/typography.css?v=51">
  
  <!-- App-specific styles -->
  <style>
    body {
      margin: 0;
      padding: 0;
      background: var(--color-background);
      color: var(--color-text);
      font-family: var(--font-family-base);
    }
    
    .content-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);  /* Use tokens, not hardcoded px */
    }
  </style>
</head>

<body>
  <labs-container>
    <!-- App content here -->
    <labs-header center>
      <div slot="title">App Title</div>
    </labs-header>
  </labs-container>

  <labs-footer-settings-wrapper></labs-footer-settings-wrapper>

  <script type="module">
    import { ThemeManager } from '/libs/smoothie-design-system/v3.0/utils/theme-manager.js?v=51';
    import('./js/main.js?v=51');
    
    ThemeManager.init();
  </script>
</body>
</html>
```

### Individual Apps

#### Timer App
- **Purpose:** Time tracking with intervals
- **Location:** `/labs/timer/`
- **Components:** header, metric cards, start/stop buttons
- **State:** ✅ Working with Smoothie v3.0

#### Pad App
- **Purpose:** Drawing/sketching canvas
- **Location:** `/labs/pad/`
- **Components:** canvas container, toolbar, color picker
- **State:** ✅ Working with Smoothie v3.0

#### Note App
- **Purpose:** Daily note with auto-save
- **Location:** `/labs/note/`
- **Components:** header with date, note input card, undo toast
- **Key Fix:** Element selectors now match actual DOM (e.g., `querySelector('labs-footer-settings-wrapper')`)
- **State:** ✅ Working with Smoothie v3.0

#### Tracker App
- **Purpose:** Entry tracking with archive
- **Location:** `/labs/tracker/`
- **Components:** metrics, entries list, archive section
- **State:** ✅ Working with Smoothie v3.0, proper spacing between sections

#### Today-list App
- **Purpose:** Daily task list
- **Location:** `/labs/today-list/`
- **Components:** list items, add/remove buttons
- **State:** ✅ Working with Smoothie v3.0

---

## Best Practices for Future Development

### When Creating New Components

1. **Always add registration guard:**
   ```javascript
   if (!customElements.get('my-component')) {
     customElements.define('my-component', MyComponent);
   }
   ```

2. **Use slots for content:**
   ```javascript
   this.attachShadow({ mode: 'open' });
   this.shadowRoot.innerHTML = `
     <style>/* component styles */</style>
     <div><slot></slot></div>
   `;
   ```

3. **Import with query params:**
   ```html
   <script type="module" src="/path/to/my-component.js?v=51"></script>
   ```

### When Modifying HTML

1. **Always import all three token CSS files:**
   ```html
   <link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/spacing.css?v=51">
   <link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/colors.css?v=51">
   <link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/typography.css?v=51">
   ```

2. **Initialize ThemeManager:**
   ```javascript
   import { ThemeManager } from '/libs/smoothie-design-system/v3.0/utils/theme-manager.js?v=51';
   ThemeManager.init();
   ```

3. **Use CSS tokens for all spacing/colors:**
   ```css
   margin: var(--space-md);      /* ✅ Good */
   margin: 16px;                 /* ❌ Bad */
   color: var(--color-text);     /* ✅ Good */
   color: #333333;               /* ❌ Bad */
   ```

### When Adding Features

1. **Prefer web components over inline HTML** (for reusability)
2. **Store user preferences in localStorage** (theme, appearance, app state)
3. **Use event listeners on Smoothie components** (they emit custom events)
4. **Test on both hard refresh (⌘⇧R) and regular refresh (⌘R)** to verify caching works

### Version Management

**You don't need to do anything.** The git hook handles all version incrementing automatically:
- Commit changes to `/labs/` or `/libs/smoothie/` → pre-commit hook increments version
- All 7 files updated automatically
- New cache version deployed with next commit

---

## Troubleshooting

### Issue: Components not updating after changes

**Cause:** Stale cache, old version still served
**Solution:** 
1. Hard refresh: **⌘⇧R** (Mac) or **Ctrl⇧R** (Windows/Linux)
2. Unregister service worker in DevTools → Application → Service Workers
3. Clear cache in DevTools → Application → Cache Storage

### Issue: "Cannot define multiple custom elements with the same tag name"

**Cause:** Component registered twice without guard check
**Solution:** Add guard to component:
```javascript
if (!customElements.get('my-component')) {
  customElements.define('my-component', MyComponent);
}
```

### Issue: Theme not persisting across page reloads

**Cause:** Missing ThemeManager.init() call
**Solution:** Ensure app calls:
```javascript
import { ThemeManager } from '/libs/smoothie-design-system/v3.0/utils/theme-manager.js?v=51';
ThemeManager.init();
```

### Issue: CSS variables undefined (gaps/colors not showing)

**Cause:** Missing token CSS imports
**Solution:** Add to HTML `<head>`:
```html
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/spacing.css?v=51">
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/colors.css?v=51">
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/typography.css?v=51">
```

### Issue: Element selectors return null (can't addEventListener)

**Cause:** HTML element IDs/structure don't match JavaScript selectors
**Solution:** 
- Query actual element: `document.querySelector('labs-footer-settings-wrapper')` (not `getElementById('footer')`)
- Verify element exists in HTML before querying
- Use DevTools to inspect actual DOM structure

### Issue: Service worker not cleaning up old cache versions

**Cause:** Incorrect cache cleanup logic
**Solution:** Ensure activation handler uses this pattern:
```javascript
self.addEventListener('activate', event => {
  const keep = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keys => {
      const toDelete = keys.filter(k => !keep.includes(k));
      return Promise.all(toDelete.map(k => caches.delete(k)));
    })
  );
});
```

---

## Reference URLs

- **Smoothie Components:** `/libs/smoothie-design-system/v3.0/src/components/`
- **Token Definitions:** `/libs/smoothie-design-system/v3.0/styles/tokens/`
- **Theme Manager:** `/libs/smoothie-design-system/v3.0/utils/theme-manager.js`
- **Global Service Worker:** `/labs/sw.js`
- **Git Hook:** `.git/hooks/pre-commit`

---

**Last Updated:** v51
**Migration Complete:** Yes
**All Apps Status:** ✅ Working
