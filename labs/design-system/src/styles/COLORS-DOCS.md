# Color Tokens & Theme System

> **Feature Doc:** See [../docs/feature-light-dark-theme.md](../docs/feature-light-dark-theme.md) for a summary of the unified light/dark theme system, goals, and implementation plan.

> **✅ Production-Ready** — Complete two-layer token architecture with semantic "on-" color system

This document is the authoritative guide for flavors (Blueberry, Strawberry, etc.) and light/dark theming in the Labs Design System. The token system is now fully implemented with comprehensive semantic color support, accessibility compliance, and strategic Storybook documentation.


## � Unified Light/Dark Theme System (Apps & Storybook)

### Overview
The Labs Design System uses a single, unified approach for light/dark theming across both production apps and Storybook. All theming is driven by semantic CSS custom properties (tokens) and global theme classes applied to the root element. This ensures perfect consistency between your app UI and design system documentation.

### How It Works in Apps
- **Theme Toggle:** A global toggle button (using your design system button component) switches between `.theme-light` and `.theme-dark` classes on `<html>` or `<body>`.
- **Persistence:** The user's theme choice is saved in `localStorage` and restored on page load.
- **System Preference:** If no user preference is set, the app defaults to the system's `prefers-color-scheme`.
- **Tokens:** All components use semantic tokens (e.g., `--color-background`, `--color-on-background`) for colors, never hardcoded values.
- **Example:**

```js
// src/utils/theme.js
export function applyTheme({ flavor = 'blueberry', theme = 'light' } = {}) {
  const root = document.documentElement;
  root.classList.remove('flavor-blueberry', 'flavor-strawberry');
  root.classList.add(`flavor-${flavor}`);
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(`theme-${theme}`);
  root.setAttribute('data-color-scheme', theme);
  localStorage.setItem('labs-theme', `theme-${theme}`);
}

export function initSystemTheme(defaultTheme = 'light') {
  const saved = localStorage.getItem('labs-theme');
  if (saved) {
    document.documentElement.classList.add(saved);
    document.documentElement.setAttribute('data-color-scheme', saved.replace('theme-',''));
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme({ theme: prefersDark ? 'dark' : defaultTheme });
  }
}
```

### How It Works in Storybook
- **Toolbar Toggle:** The Storybook toolbar theme toggle applies the same `.theme-light`/`.theme-dark` class to the preview root.
- **Globals:** The theme is controlled via Storybook globals and passed to all stories.
- **Decorator:** Use a decorator in `preview.js` to call `applyTheme()` with the current global.
- **Result:** All stories and docs pages reflect the active theme exactly as in production apps.
- **Example:**

```js
// .storybook/preview.js
import { applyTheme, initSystemTheme } from '../src/utils/theme.js';
initSystemTheme('light');
export const decorators = [(Story, context) => {
  applyTheme({ flavor: context.globals?.flavor || 'blueberry', theme: context.globals?.theme || 'light' });
  return Story();
}];
```

### Best Practices
- Use `.theme-light` and `.theme-dark` classes everywhere (apps and Storybook).
- Define all theme tokens in one place (e.g., `flavors.css`).
- Always use semantic tokens in component CSS.
- Use your design system button for the theme toggle UI in apps.
- Document the approach in this file and reference it from your README and Storybook docs.

### Example: Theme Toggle Button in App

```html
<labs-button variant="secondary" size="large" icon-left="bedtime" onclick="toggleTheme()">
  Turn on dark mode
</labs-button>
```

```js
function toggleTheme() {
  const isDark = document.documentElement.classList.contains('theme-dark');
  applyTheme({ theme: isDark ? 'light' : 'dark' });
}
```

### Quick Checklist
- [x] Same theme class and token structure in apps and Storybook (refactored everywhere, logic fully synced)
- [x] Theme toggle button uses design system button component
- [x] All colors use semantic tokens (no hardcoded fallbacks remain)
- [x] System preference respected if no user choice
- [x] Theme switching tested and verified in all environments
- [x] Documented here for easy onboarding


**✅ Complete & Robust Token Architecture**
- Two-layer design system: palette anchors + semantic mappings
- All semantic colors have corresponding "on-" text tokens
- Robust JavaScript resolution: semantic tokens first, then fallback to palette mapping by resolved value (covers all flavors and tokens)
- Diagnostic logic ensures every token is mapped to a friendly label, even if the chain is missing
- WCAG AA accessibility compliance (4.5:1+ contrast ratios)

**August 2025 Update:**
- All color/theming issues are now resolved. The Colors story is robust for all flavors and tokens, with correct base mapping and theme-driven polaroid labels.

### Recent minor fixes (2025-08-31)
- Global palette `<details>` now uses `--color-surface` in the Colors story so Base 100 is shown for neutral/global tokens.
- Icon-only `labs-button` variant adjusted to prefer `--color-on-surface` for parity with secondary icon buttons in dark mode.

**✅ Strategic Storybook Documentation**
- Colors story reorganized with Base/Status sections
- Base column shows actual palette tokens ("Blueberry 500", "Base 100")
- Polaroid labels separated to 2 lines with semantic role descriptions
- Comprehensive theme token coverage including neutrals

**✅ Three-Flavor Theming Support**
- Vanilla, Blueberry, and Strawberry flavors with light/dark modes
- Consistent status colors across all themes for accessibility
- Theme-specific branding colors with proper text color pairings

## Goals
- Keep `tokens/colors.css` as a minimal palette (single source of truth for raw color anchors).
- Keep semantic token defaults in `main.css` (sensible fallbacks) and authoritative flavor+theme overrides in `flavors.css`.
- Provide small, copyable examples for applying flavor + theme at runtime and for Storybook.

## Minimal token contract (what components should consume)
- `--color-primary`
- `--color-background` (theme-scoped)
- `--color-surface`
- `--color-on-primary`
- `--color-on-background`
- `--color-error`

Keep component CSS semantic-only: use `var(--color-*)` values in components rather than raw palette anchors.

## Recommended file roles
- `src/styles/tokens/colors.css` — palette anchors only (e.g. `--palette-blueberry-500`).
- `src/styles/main.css` — imports palette and defines root-level utility tokens and semantic fallbacks used when no flavor is applied.
- `src/styles/flavors.css` — authoritative per-flavor + per-theme mappings (one block per `.flavor-*.theme-*`).

## Clear derivation pattern (copyable)

1) Palette anchors: `src/styles/tokens/colors.css`

```css
/* tokens/colors.css — anchors only */
:root {
  --palette-blueberry-100: #F0EEFF;
  --palette-blueberry-200: #DBD7FF;
  --palette-blueberry-500: #2E2B74;
  --palette-blueberry-700: #26225A;

  --palette-strawberry-100: #FFF2F1;
  --palette-strawberry-200: #FFD3D2;
  --palette-strawberry-500: #800800;
}
```

2) Semantic fallbacks: `src/styles/main.css` (used when no flavor class is present)

```css
@import "./tokens/colors.css";

:root {
  /* Status/utilities always available */
  --color-success: #00B56A;
  --color-error: var(--palette-strawberry-500, #800800);

  /* Sensible semantic fallbacks (non-opinionated defaults) */
  --color-primary: var(--palette-blueberry-500);
  --color-surface: #ffffff;
  /* --color-background intentionally left theme-scoped */
}
```

3) Flavor + theme: `src/styles/flavors.css` (applied via classes on `document.documentElement`)

```css
.flavor-blueberry.theme-light {
  --color-primary: var(--palette-blueberry-500);
  --color-primary-darker: var(--palette-blueberry-800);
  --color-background: var(--palette-blueberry-200);
  --color-surface: #ffffff;
  --color-on-primary: #ffffff;
  --color-on-background: var(--palette-blueberry-900);
}

.flavor-blueberry.theme-dark {
  --color-primary: var(--palette-blueberry-500);
  --color-background: var(--palette-black);
  --color-surface: var(--palette-neutral-700);
  --color-on-primary: var(--palette-white);
  --color-on-background: var(--palette-blueberry-50);
}
```

No flavor block should introduce new semantic names — flavors only map the canonical semantic set to palette anchors.

## Applying flavor + theme at runtime (JS)

Create or import a tiny helper `src/utils/theme.js` and reuse it across demos/Storybook:

```js
// src/utils/theme.js
export function applyTheme({ flavor = 'blueberry', theme = 'light' } = {}) {
  const root = document.documentElement;
  root.classList.remove('flavor-blueberry', 'flavor-strawberry');
  root.classList.add(`flavor-${flavor}`);
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(`theme-${theme}`);
  root.setAttribute('data-color-scheme', theme);
}

export function initSystemTheme(defaultTheme = 'light') {
  if (!document.documentElement.classList.contains('theme-light') &&
      !document.documentElement.classList.contains('theme-dark')) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme({ theme: prefersDark ? 'dark' : defaultTheme });
  }
}
```

## Preventing FOUC (apply theme before paint)

To avoid a flash of the wrong theme, add a tiny synchronous snippet as early as possible in the page head (inline script) that applies the stored theme before the CSS is parsed:

```html
<script>
  (function(){
    try{
      const saved = localStorage.getItem('labs-theme');
      if(saved){
        document.documentElement.classList.add(saved);
        // mirror the data attr for tests and meta sync
        if(saved.indexOf('theme-') === 0) document.documentElement.setAttribute('data-color-scheme', saved.replace('theme-',''));
      }
    }catch(e){}
  })();
</script>
```

Or call `initSystemTheme()` synchronously from a small boot script that runs before long-running JS.

## Storybook wiring (preview.js)

Use the helper in `preview.js` so stories reflect globals and toolbar selections:

```js
import { applyTheme, initSystemTheme } from '../src/utils/theme.js';
initSystemTheme('light');
export const decorators = [(Story, context) => {
  applyTheme({ flavor: context.globals?.flavor || 'blueberry', theme: context.globals?.theme || 'light' });
  return Story();
}];
```

## Quick verification checklist
- Start Storybook and open the Tokens/Colors story: swatches should reflect the active flavor + theme immediately.
- Toggle theme (toolbar or UI) and confirm semantic tokens update without layout shift.
- Open a demo page (docs/note or docs/tracker) and confirm stored theme is applied on first paint (no FOUC).

Commands (local smoke):
```bash
npm install
npm run storybook
# open http://localhost:6006 and inspect Tokens/Colors
```

## Current flavor snapshots (authoritative values come from `src/styles/flavors.css`)


Blueberry — dark

Strawberry — light

Strawberry — dark

(These are a human-readable snapshot — the canonical values live in `flavors.css` and palette anchors in `tokens/colors.css`.)
## Current flavor snapshots (authoritative values come from `src/styles/flavors.css`)

> **Note:** Values shown as `var(--palette-...)` reference the palette anchors in `tokens/colors.css`. Hex values are shown for clarity, but the actual mapping uses CSS variables.

### Blueberry — light

| Token                | Value (resolved)                |
|----------------------|---------------------------------|
| --color-primary      | var(--palette-blueberry-500) = #2E2B74 |
| --color-background   | var(--palette-blueberry-200) = #DBD7FF |
| --color-surface      | var(--palette-white) = #FFFFFF  |
| --color-on-primary   | var(--palette-white) = #FFFFFF  |
| --color-on-background| var(--palette-blueberry-900) = #15122B |
| --color-error        | #B5005A (light blueberry destructive/error tone)

### Blueberry — dark

| Token                | Value (resolved)                |
|----------------------|---------------------------------|
| --color-primary      | var(--palette-blueberry-500) = #2E2B74 |
| --color-background   | var(--palette-black) = #000000  |
| --color-surface      | var(--palette-neutral-700) = #3C3C46 |
| --color-on-primary   | var(--palette-white) = #FFFFFF  |
| --color-on-background| var(--palette-blueberry-50) = #F0EEFF |
| --color-error        | #CF6679 (dark blueberry error tone)

### Strawberry — light

| Token                | Value (resolved)                |
|----------------------|---------------------------------|
| --color-primary      | var(--palette-strawberry-500) = #800800 |
| --color-background   | var(--palette-strawberry-200) = #FFD3D2 |
| --color-surface      | var(--palette-white) = #FFFFFF  |
| --color-on-primary   | var(--palette-white) = #FFFFFF  |
| --color-on-background| var(--palette-strawberry-900) = #5C1A18 |
| --color-error        | #E53935 (strawberry light error tone)

### Strawberry — dark

| Token                | Value (resolved)                |
|----------------------|---------------------------------|
| --color-primary      | var(--palette-strawberry-500) = #800800 |
| --color-background   | var(--palette-neutral-700) = #3C3C46 |
| --color-surface      | var(--palette-neutral-700) = #3C3C46 |
| --color-on-primary   | var(--palette-white) = #FFFFFF  |
| --color-on-background| var(--palette-strawberry-50) = #FFF2F1 |
| --color-error        | #FF6F60 (strawberry dark error tone)

(These are a human-readable snapshot — the canonical values live in `flavors.css` and palette anchors in `tokens/colors.css`. Always refer to the source files for the latest mappings.)

## Related Documentation

**Technical Reference:**
- [DESIGN-TOKENS-ARCHITECTURE.md](DESIGN-TOKENS-ARCHITECTURE.md) - Deep technical documentation of token architecture, migration patterns, and performance considerations

**Component Design:**
- [../smoothie.md](../smoothie.md) - Smoothie Design System: playful metaphor and summary table for components, ingredients, patterns, and menu items

**Archive:**
- [../../../_dev/_documents/legacy/colors-system/COLORS-TODO-COMPLETED.md](../../../_dev/_documents/legacy/colors-system/COLORS-TODO-COMPLETED.md) - Completed color system development tasks (archived)
