# Smoothie Design System v3.0

Complete Web Components library for MindCubby projects. Zero-build, vanilla JavaScript, WCAG AA compliant.

**Status:** ✅ Production-ready — in use across MindCubby labs and 3D apps.

---

## Quick Start

### Import Components

```html
<!-- Import the design system -->
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/main.css">
<script type="module" src="/libs/smoothie-design-system/v3.0/src/components/labs-button.js"></script>
<script type="module" src="/libs/smoothie-design-system/v3.0/src/components/labs-card.js"></script>

<!-- Use components -->
<labs-button variant="primary">Click me</labs-button>
<labs-card>Card content</labs-card>
```

### Import All Components

```javascript
// Auto-discover and load all components
import '/libs/smoothie-design-system/v3.0/src/components/index.js';
```

---

## Directory Structure

```
v3.0/
├── src/
│   ├── components/          # 30+ Web Components (labs-button, labs-card, etc.)
│   ├── utils/               # Component utilities (shared functions)
│   └── patterns/            # Composed patterns (header, footer, etc.)
├── styles/
│   ├── main.css             # Main entry point
│   ├── components/          # Component-specific styles
│   ├── flavors.css          # Theme variants
│   └── tokens/              # Design tokens
├── tokens/                  # Design tokens (colors, spacing, typography)
│   ├── colors.css
│   ├── typography.css
│   ├── spacing.css
│   ├── grid.css
│   ├── shadows.css
│   └── border-radius.css
├── utils/                   # JavaScript utilities
│   ├── theme-manager.js     # Theme switching
│   ├── theme.js             # Theme config
│   ├── date-format.js       # Date utilities
│   └── storage-api.js       # LocalStorage wrapper
├── icons/                   # 100+ SVG icons
├── fonts/                   # Webfont files (Nunito Sans, Source Sans)
└── README.md               # This file
```

---

## Components

### Layout
- `labs-container` — Responsive container
- `labs-header` — Page header with theme toggle
- `labs-footer` — Footer with social links
- `labs-template-header` — Template header variant

### Forms & Input
- `labs-button` — Button with variants (primary, secondary, destructive, icon)
- `labs-input` — Text input with validation
- `labs-checkbox` — Checkbox with label
- `labs-dropdown` — Dropdown menu
- `labs-flavor-selector` — Theme flavor picker

### Display
- `labs-card` — Card container
- `labs-standalone-card` — Standalone card variant
- `labs-badge` — Badge/label
- `labs-icon` — Icon display
- `labs-list-item` — List item
- `labs-list-section` — List section header

### Interactive
- `labs-details` — Collapsible details (accordion)
- `labs-expandable-card` — Expandable card
- `labs-overlay` — Modal overlay
- `labs-toast` — Toast notification
- `labs-warning-card` — Warning/alert card
- `labs-warning-overlay` — Warning modal

### Specialized
- `labs-metric-card` — Metric display card
- `labs-settings-card` — Settings form card
- `labs-apps-selector` — App switcher
- `labs-flavor-button` — Flavor selector button
- `labs-footer-with-settings` — Footer with settings
- `labs-footer-media-controls` — Media controls footer
- `ThemeToggle` — Theme toggle component

---

## Themes

Three theme flavors included:

### Vanilla
Minimalist brutalist design. Light background, dark text.

```javascript
document.documentElement.setAttribute('data-theme', 'vanilla');
```

### Blueberry
Blue color scheme. Cool, modern aesthetic.

```javascript
document.documentElement.setAttribute('data-theme', 'blueberry');
```

### Strawberry
Pink/red color scheme. Warm, playful aesthetic.

```javascript
document.documentElement.setAttribute('data-theme', 'strawberry');
```

### Light/Dark Mode

```javascript
// Toggle dark mode
document.documentElement.setAttribute('data-mode', 'dark');
document.documentElement.setAttribute('data-mode', 'light');
```

---

## Design Tokens

### Colors
- Primary, secondary, destructive
- Surface, background, text
- Accent colors
- Semantic colors (success, warning, error)

### Typography
- Font families (Nunito Sans, Source Sans)
- Font sizes (sm, md, lg, xl, xxl)
- Font weights (regular, bold)
- Line heights
- Letter spacing

### Spacing
- 8px base unit
- Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px

### Grid
- 12-column responsive grid
- Breakpoints: mobile, tablet, desktop, wide

### Shadows
- Elevation levels (sm, md, lg, xl)
- Consistent shadow depth

### Border Radius
- Small, medium, large
- Circle/pill shapes

---

## Utilities

### Theme Manager
```javascript
import { ThemeManager } from '/libs/smoothie-design-system/v3.0/utils/theme-manager.js';

const tm = new ThemeManager();
tm.setTheme('blueberry');
tm.setMode('dark');
tm.getTheme(); // 'blueberry'
```

### Date Format
```javascript
import { formatDate } from '/libs/smoothie-design-system/v3.0/utils/date-format.js';

formatDate(new Date()); // 'Aug 26, 2026'
```

### Storage API
```javascript
import { storage } from '/libs/smoothie-design-system/v3.0/utils/storage-api.js';

storage.set('key', 'value');
storage.get('key'); // 'value'
storage.remove('key');
```

---

## Gradual Adoption

This library is designed for non-breaking adoption:

1. **New projects** — Use components from day one
2. **Existing projects** — Gradually replace components at your own pace
3. **Coexistence** — Old and new components can run side-by-side
4. **Backward compatible** — v3.0 is independent, doesn't affect existing code

### Migration Path

1. Copy `/libs/smoothie-design-system/latest/` to your project
2. Import individual components as needed
3. Update styles to use design tokens
4. Gradually replace old components
5. No deadline, move at your pace

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

**Web Components:** Custom Elements, Shadow DOM, ES modules

---

## Development

This is a static library. Components are vanilla JavaScript Web Components with no build step required.

### Structure
- Each component is a `.js` file
- Styles defined in component or external CSS
- No npm dependencies
- No build process

### Adding to Your Project

```html
<!-- Method 1: Individual imports -->
<script type="module" src="/libs/smoothie-design-system/v3.0/src/components/labs-button.js"></script>

<!-- Method 2: CSS only (all base styles) -->
<link rel="stylesheet" href="/libs/smoothie-design-system/v3.0/styles/main.css">
```

---

## Customization

Override design tokens with CSS variables:

```css
:root {
  --color-primary: #your-color;
  --spacing-md: 12px;
  --font-family-base: 'Your Font';
}
```

Override component styles with CSS specificity:

```css
labs-button {
  --button-padding: 12px 20px;
  --button-font-size: 14px;
}
```

---

## Accessibility

- ✅ WCAG AA compliant
- ✅ Semantic HTML (where applicable)
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Screen reader tested
- ✅ Color contrast verified

---

## Card Component

The `labs-card` component is the foundation for all card-based layouts in the system. It uses a Shadow DOM wrapper to properly apply padding and spacing to slotted content.

### How Card Spacing Works

Cards apply padding at the component level via an internal `.card-content` wrapper:

```javascript
.card-content {
  padding: var(--labs-card-padding);  // 2rem by default
  display: flex;
  flex-direction: column;
  gap: 1rem;  // Vertical spacing between slots
}
```

**Key points:**
- All slotted content (header, description, input, actions) receives 2rem padding
- Automatic 1rem gap between sections for visual breathing room
- Fully customizable via CSS variables

### Common Patterns

See [`/smoothie/patterns/cards/`](../../smoothie/patterns/cards/) for real-world examples:
- **Input Forms** — Used in Today-List and Note apps
- **Confirmation Dialogs** — Used in Timer app for destructive actions
- **Metric Cards** — Used in Today-List and Tracker to show counts

### Slots

- `header` — Card title/heading
- `description` — Main content/description
- `input` — Form input (text, select, etc.)
- `actions` — Action buttons (footer)
- `close` — Close icon/button

### Example

```html
<labs-card>
  <span slot="header">Add New Item</span>
  <input slot="input" type="text" placeholder="Type here...">
  <div slot="actions">
    <labs-button variant="secondary">Cancel</labs-button>
    <labs-button variant="primary">Save</labs-button>
  </div>
</labs-card>
```

---

## Performance

- ✅ Zero-build, no JavaScript compilation overhead
- ✅ Minimal CSS (shared tokens, no duplication)
- ✅ Tree-shakeable (import only what you use)
- ✅ Shadow DOM encapsulation (style isolation)
- ✅ No runtime dependencies

---

## License

MindCubby Proprietary

---

## Support

See [SMOOTHIE-MIGRATION-STRATEGY.md](../../SMOOTHIE-MIGRATION-STRATEGY.md) for migration planning.
