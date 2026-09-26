# Smoothie Design System - Quick Reference

## Essential Imports (Copy-Paste)

### In HTML `<head>:`
```html
<!-- Always include these three token CSS files -->
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/spacing.css?v=51">
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/colors.css?v=51">
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/typography.css?v=51">
```

### In JavaScript Module:
```javascript
// Initialize theme system (once per app)
import { ThemeManager } from '/libs/smoothie-design-system/v3.0/utils/theme-manager.js?v=51';
ThemeManager.init();

// Import your app logic
import('./js/main.js?v=51');
```

### In Component Files:
```javascript
// Component class definition...
class MyComponent extends HTMLElement {
  // ... component code ...
}

// CRITICAL: Always include this guard
if (!customElements.get('my-component')) {
  customElements.define('my-component', MyComponent);
}
```

---

## Common CSS Patterns

### Spacing (Use tokens, not pixels)
```css
/* ✅ CORRECT */
.container {
  gap: var(--space-lg);        /* 32px */
  padding: var(--space-md);    /* 16px */
  margin-top: var(--space-xl); /* 64px */
}

/* ❌ WRONG - Hardcoded pixels */
.container {
  gap: 32px;
  padding: 16px;
}
```

### Colors
```css
/* ✅ CORRECT */
.text {
  color: var(--color-text);
  background: var(--color-background);
}

/* ❌ WRONG - Hardcoded hex */
.text {
  color: #1a1a1a;
  background: #ffffff;
}
```

### Typography
```css
/* ✅ CORRECT */
body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
}

/* ❌ WRONG - Hardcoded values */
body {
  font-family: Arial, sans-serif;
  font-size: 16px;
}
```

---

## Spacing Token Values

| Token | Pixels | Use Case |
|-------|--------|----------|
| `--space-xs` | 4px | Tiny gaps (icon spacing) |
| `--space-sm` | 8px | Small gaps (button padding) |
| `--space-md` | 16px | Standard padding/gaps |
| `--space-lg` | 32px | Section spacing (between cards) |
| `--space-xl` | 64px | Large spacing (major sections) |

---

## Common Components

### Header
```html
<labs-header center>
  <div slot="title">My App</div>
  <div slot="subtitle">Subtitle here</div>
</labs-header>
```

### Card Container
```html
<labs-card title="Card Title">
  <p>Card content here</p>
</labs-card>
```

### Button
```html
<labs-button @click="handleClick()">Click me</labs-button>
```

### List Item
```html
<labs-list-item title="Item Title">
  <span slot="metadata">Meta info</span>
</labs-list-item>
```

### Metric Card
```html
<labs-metric-card label="Entries" value="42"></labs-metric-card>
```

### Toast (for notifications)
```html
<labs-toast id="myToast"></labs-toast>

<script>
  const toast = document.getElementById('myToast');
  toast.show('Notification message');
</script>
```

### Footer with Settings
```html
<labs-footer-settings-wrapper></labs-footer-settings-wrapper>
```

---

## Theme System

### How Themes Work
1. User selects theme in settings
2. Theme saved to `localStorage.smoothie-theme` and `localStorage.smoothie-appearance`
3. CSS classes applied to `<html>` element:
   - `.theme-blueberry`, `.theme-strawberry`, `.theme-vanilla`
   - `.appearance-light`, `.appearance-dark`
4. CSS variables respond to these classes

### Accessing Theme in JavaScript
```javascript
// Read current theme
const theme = localStorage.getItem('smoothie-theme');
const appearance = localStorage.getItem('smoothie-appearance');

// Set theme programmatically
localStorage.setItem('smoothie-theme', 'strawberry');
localStorage.setItem('smoothie-appearance', 'dark');

// Then update DOM classes
document.documentElement.classList.remove('theme-blueberry');
document.documentElement.classList.add('theme-strawberry');
document.documentElement.classList.remove('appearance-light');
document.documentElement.classList.add('appearance-dark');
```

### Theme Persistence
Themes are automatically persisted via localStorage. They survive page reloads and browser sessions.

---

## Service Worker & Caching

### What Gets Cached?
- All `/labs/` requests (HTML, JS, CSS, assets)
- Component code from `/libs/smoothie/`
- Token CSS files

### Cache Invalidation
✅ **Automatic** — Every commit increments version (`?v=51` → `?v=52`), triggering fresh downloads.

You don't need to do anything. The git pre-commit hook handles versioning.

### Manual Cache Clear
If you need to clear cache manually:
1. DevTools → Application → Service Workers → Unregister
2. DevTools → Application → Cache Storage → Delete all caches
3. Hard refresh: **⌘⇧R** (Mac) or **Ctrl⇧R** (Windows)

---

## Version Numbers

**Current Version:** v51

### Where Versions Appear
- Global SW cache: `labs-static-v51`
- HTML token import query params: `?v=51`
- Component script query params: `?v=51`
- Dynamic import query params: `?v=51`

### Updating Versions
**Don't manually update.** The git hook does it automatically:
```bash
# Just commit changes to /labs/ or /libs/smoothie/
git add -A
git commit -m "your message"
# Pre-commit hook runs → version increments v51 → v52
```

---

## Troubleshooting

### Stale Cache / Changes Not Showing
**Solution:** Hard refresh
- Mac: **⌘⇧R**
- Windows/Linux: **Ctrl⇧R**

### Components Not Defined / Registry Errors
**Problem:** "Cannot define multiple custom elements with the same tag name"
**Solution:** Add registration guard to component:
```javascript
if (!customElements.get('my-component')) {
  customElements.define('my-component', MyComponent);
}
```

### Element Selectors Return Null
**Problem:** `document.getElementById()` returns null
**Solution:** Query actual DOM elements:
```javascript
// ✅ Use querySelector for web components
const footer = document.querySelector('labs-footer-settings-wrapper');

// ✅ Use getElementById only if element has explicit ID
const input = document.getElementById('my-input-id');
```

### CSS Variables Undefined (No Spacing/Color)
**Problem:** Gaps/colors don't show, only hardcoded sizes work
**Solution:** Import token CSS in HTML `<head>`:
```html
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/spacing.css?v=51">
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/tokens/colors.css?v=51">
```

### Theme Not Persisting
**Problem:** Theme reverts on page reload
**Solution:** Call ThemeManager.init():
```javascript
import { ThemeManager } from '/libs/smoothie-design-system/v3.0/utils/theme-manager.js?v=51';
ThemeManager.init();
```

---

## File Locations

| What | Where |
|------|-------|
| Components | `/libs/smoothie-design-system/v3.0/src/components/` |
| Token CSS | `/libs/smoothie-design-system/v3.0/styles/tokens/` |
| Theme Manager | `/libs/smoothie-design-system/v3.0/utils/theme-manager.js` |
| Global SW | `/labs/sw.js` |
| Git Hook | `.git/hooks/pre-commit` |
| Full System Guide | `labs/SMOOTHIE-SYSTEM-GUIDE.md` |

---

## Remember

✅ All query params auto-increment (no manual edits needed)
✅ All spacing/colors use CSS tokens (not hardcoded pixels)
✅ All components use registration guards (prevents conflicts)
✅ All apps initialize ThemeManager (persistence works)
✅ All imports include query params (`?v=51`)

**Don't manually manage versions.** The system handles it.
