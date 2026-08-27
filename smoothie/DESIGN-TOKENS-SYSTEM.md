# Smoothie Design System — Design Tokens & Theming

## Overview

The Smoothie Design System uses a **two-axis theming system** inspired by Apple's macOS system settings, providing both visual variety and accessibility:

- **Theme** (Color): Blueberry, Strawberry, Vanilla
- **Appearance** (Brightness): Light, Dark

This creates **6 theme combinations**, each with a complete semantic color palette optimized for readability and visual hierarchy.

## Terminology Reference

| Concept | Options | CSS Class Prefix | localStorage Key | Example |
|---------|---------|------------------|------------------|---------|
| **Theme** (Color) | Blueberry<br>Strawberry<br>Vanilla | `.theme-blueberry`<br>`.theme-strawberry`<br>`.theme-vanilla` | `smoothie-theme` | `"blueberry"` |
| **Appearance** (Brightness) | Light<br>Dark | `.appearance-light`<br>`.appearance-dark` | `smoothie-appearance` | `"light"` |

**Why this naming?** It mirrors Apple's familiar macOS system settings terminology, making the system immediately recognizable to developers and users.

## CSS Custom Properties (Tokens)

All colors are defined as CSS custom properties (variables) that cascade from the document root.

### Global Color Palette
Defined in `globals.css`, available across all themes:

```css
:root {
  --palette-blueberry-100: #DBD7FF;  /* Lightest */
  --palette-blueberry-200: #C5C0F0;
  --palette-blueberry-300: #9A93D9;
  --palette-blueberry-500: #6750a4;  /* Primary */
  --palette-blueberry-700: #4a3fa1;
  --palette-blueberry-800: #1E193E;  /* Darkest */
  --palette-blueberry-900: #1B1830;

  --palette-strawberry-100: #FFDAD6;
  --palette-strawberry-200: #FFB4AC;
  --palette-strawberry-300: #FF8A80;
  --palette-strawberry-500: #b3261e;  /* Primary */
  --palette-strawberry-700: #8c0d0d;
  --palette-strawberry-800: #5f0f08;
  --palette-strawberry-900: #370b1e;

  --palette-vanilla-100: #F5EFE7;
  --palette-vanilla-200: #DFD3C7;
  --palette-vanilla-300: #C7B8A8;
  --palette-vanilla-500: #6B5C4B;  /* Primary */
  --palette-vanilla-700: #5C5047;
  --palette-vanilla-800: #3C3230;
  --palette-vanilla-900: #342F2A;

  --palette-white: #ffffff;
  --palette-black: #000000;
  /* ...status colors... */
}
```

### Semantic Color Tokens
Defined in `flavors.css` per theme combination. These are the tokens you use in components:

**Common tokens across all themes:**
- `--color-primary` — Primary branded color
- `--color-primary-darker` — Dark variant for hover/active states
- `--color-primary-lighter` — Light variant for disabled/subtle states
- `--color-background` — Page/body background
- `--color-on-background` — Text on background (primary text color)
- `--color-surface` — Card/component surface
- `--color-on-surface` — Text on surface
- `--color-surface-container` — Subtle container layer
- `--color-surface-container-high` — More prominent container
- `--color-surface-variant` — Variant surface (e.g., badges, chips)
- `--color-on-surface-variant` — Text on surface-variant
- `--color-surface-hover` — Hover state background
- `--color-outline` — Border/outline color
- `--color-outline-variant` — Lighter outline
- `--color-footer-bg` — Footer overlay background
- `--settings-icon-color` — Settings icon tint
- Status colors: `--color-success`, `--color-warning`, `--color-error`, `--color-info`

### Example: Blueberry Light Theme

```css
:root.theme-blueberry.appearance-light {
  --color-primary: var(--palette-blueberry-500);           /* #6750a4 */
  --color-on-primary: var(--palette-white);
  --color-background: var(--palette-blueberry-200);         /* #C5C0F0 */
  --color-on-background: var(--palette-blueberry-800);      /* #1E193E */
  --color-surface: var(--palette-blueberry-100);            /* #DBD7FF */
  --color-on-surface: var(--palette-blueberry-900);         /* #1B1830 */
  /* ... more tokens ... */
}
```

### Example: Blueberry Dark Theme

```css
:root.theme-blueberry.appearance-dark {
  --color-primary: var(--palette-blueberry-500);           /* #6750a4 */
  --color-on-primary: var(--palette-white);
  --color-background: var(--palette-blueberry-800);         /* #1E193E */
  --color-on-background: var(--palette-blueberry-100);      /* #DBD7FF */
  --color-surface: var(--palette-blueberry-800);            /* #1E193E */
  --color-on-surface: var(--palette-white);
  /* ... more tokens ... */
}
```

## How to Apply Themes

### In HTML

Apply classes to the `<html>` or `:root` element:

```html
<!-- Light Blueberry Theme (default) -->
<html class="theme-blueberry appearance-light">
  ...
</html>

<!-- Dark Strawberry Theme -->
<html class="theme-strawberry appearance-dark">
  ...
</html>
```

### In JavaScript

```javascript
// Apply theme
document.documentElement.classList.remove(
  'theme-blueberry', 'theme-strawberry', 'theme-vanilla'
);
document.documentElement.classList.add('theme-blueberry');

// Apply appearance
document.documentElement.classList.remove('appearance-light', 'appearance-dark');
document.documentElement.classList.add('appearance-dark');

// Persist to localStorage
localStorage.setItem('smoothie-theme', 'blueberry');
localStorage.setItem('smoothie-appearance', 'dark');
```

### In CSS Components

```css
button {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border: 1px solid var(--color-outline);
}

button:hover {
  background-color: var(--color-primary-darker);
}

button:disabled {
  background-color: var(--color-surface-variant);
  color: var(--color-on-surface-variant);
}
```

## Component Integration

All Smoothie components automatically inherit theme tokens from the document root:

```javascript
// labs-button.js
class LabsButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          /* Tokens cascade from document root */
          --button-bg: var(--color-primary, #6750a4);
          --button-text: var(--color-on-primary, white);
        }
        button {
          background-color: var(--button-bg);
          color: var(--button-text);
        }
      </style>
      <button><slot></slot></button>
    `;
  }
}
```

### Iframe Isolation

When components are embedded in iframes (for the showcase), themes are applied via `postMessage`:

```javascript
// In hub (index.html)
function broadcastToIframes() {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    iframe.contentWindow.postMessage(
      {
        type: 'smoothie-theme-update',
        theme: document.documentElement.classList
          .find((c) => c.startsWith('theme-'))
          .replace('theme-', '')
      },
      '*'
    );
  });
}

// In iframe (e.g., button/index.html)
window.addEventListener('message', (event) => {
  if (event.data.type === 'smoothie-theme-update') {
    const root = document.documentElement;
    root.classList.remove('theme-blueberry', 'theme-strawberry', 'theme-vanilla');
    root.classList.add(`theme-${event.data.theme}`);
  }
});
```

## Storage Keys

Smoothie persists user preferences to localStorage:

| Key | Value Options | Default | Usage |
|-----|----------------|---------|-------|
| `smoothie-theme` | `"blueberry"`, `"strawberry"`, `"vanilla"` | `"vanilla"` | Store selected color theme |
| `smoothie-appearance` | `"light"`, `"dark"` | `"light"` | Store selected brightness |
| `smoothie-container-size` | `"small"`, `"medium"`, `"large"`, `"fill"` | `"medium"` | Responsive container demo preference |

**Initialization Pattern:**

```javascript
const theme = localStorage.getItem('smoothie-theme') || 'vanilla';
const appearance = localStorage.getItem('smoothie-appearance') || 'light';

const root = document.documentElement;
root.classList.add(`theme-${theme}`, `appearance-${appearance}`);
```

## Component State Changes

### Theme Toggle (Appearance Switcher)

The `labs-theme-toggle` component emits custom events:

```javascript
// Listen for appearance changes
document.querySelector('labs-theme-toggle')
  .addEventListener('appearance-changed', (e) => {
    console.log(`Switched to: ${e.detail.appearance}`); // "light" or "dark"
  });
```

### Theme Selector (Color Theme Switcher)

The `labs-theme-selector` component emits custom events:

```javascript
// Listen for theme changes
document.querySelector('labs-theme-selector')
  .addEventListener('theme-changed', (e) => {
    console.log(`Switched to: ${e.detail.theme}`); // "blueberry", "strawberry", "vanilla"
  });
```

## Accessibility Considerations

### Contrast Ratios
All semantic tokens are designed to meet WCAG AA standards:
- Text on background: ≥4.5:1 contrast ratio
- Large text: ≥3:1 contrast ratio
- UI components: ≥3:1 contrast ratio

### Dark Mode
Dark themes are optimized for reduced eye strain in low-light environments:
- Use saturated, lighter palette colors for text
- Use desaturated, darker colors for backgrounds
- Maintain high contrast for interactive elements

### Color Blindness
Tokens support colorblind-safe palettes. Avoid relying solely on color:
- Use icons + text labels
- Use pattern/texture differentiation where color alone indicates meaning

## File Structure

```
/libs/smoothie-design-system/v3.0/
├── styles/
│   ├── globals.css          # Global palette & base tokens
│   ├── flavors.css          # Theme-specific semantic tokens (6 combinations)
│   └── typography.css       # Font families & sizing
├── src/
│   └── components/
│       ├── labs-button.js
│       ├── labs-theme-selector.js    # Color theme switcher
│       ├── labs-theme-toggle.js      # Appearance (light/dark) switcher
│       └── ... (30+ more components)
└── v3.0-index.html          # Comprehensive component showcase
```

## Quick Start: Create a New Component

```javascript
// my-component.js
import '/libs/smoothie-design-system/v3.0/styles/globals.css';
import '/libs/smoothie-design-system/v3.0/styles/flavors.css';

class MyComponent extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --my-bg: var(--color-surface);
          --my-text: var(--color-on-surface);
        }
        .container {
          background-color: var(--my-bg);
          color: var(--my-text);
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid var(--color-outline);
        }
      </style>
      <div class="container">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('my-component', MyComponent);
```

## Resources

- [View Showcase](http://localhost:8000/smoothie/) — Interactive demo of all themes & components
- [Token Values Reference](http://localhost:8000/smoothie/tokens/) — Complete token list with color swatches
- GitHub: Source code and component documentation
- Storybook Reference: See legacy Storybook for visual inspiration (being phased out)

---

**Last Updated:** August 2026
**Version:** Smoothie v3.0
