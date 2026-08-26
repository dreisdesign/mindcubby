# Design Tokens Architecture Guide

_Labs Design System - Color Token Implementation_
_Updated: 2025-01-21 - Post Migration Phases 1 & 2_

## Overview

The Labs Design System uses a **two-layer token architecture** that separates raw palette colors from semantic design tokens. This approach enables flexible theming while maintaining consistency and accessibility.

## Architecture Layers

### Layer 1: Raw Palette (Global Scope)
**File:** `src/styles/tokens/colors.css`

Raw color values organized by flavor families and purposes:

```css
/* Vanilla Palette */
--palette-vanilla-100: #F5F1E7;    /* Light backgrounds */
--palette-vanilla-200: #E8E2D6;    /* Theme backgrounds */
--palette-vanilla-500: #6B5C4B;    /* Primary colors */
--palette-vanilla-800: #1B1C1F;    /* Dark colors */

/* Blueberry Palette */
--palette-blueberry-100: #F0EEFF;
--palette-blueberry-200: #DBD7FF;
--palette-blueberry-500: #2E2B74;
--palette-blueberry-700: #26225A;
--palette-blueberry-800: #1E193E;
--palette-blueberry-900: #15122B;

/* Strawberry Palette */
--palette-strawberry-100: #FFF2F1;
--palette-strawberry-200: #FFD3D2;
--palette-strawberry-500: #800800;
--palette-strawberry-700: #9B2F2B;
--palette-strawberry-800: #4A1614;
--palette-strawberry-900: #5C1A18;

/* Status Palette */
--palette-green-500: #00B56A;      /* Success */
--palette-yellow-500: #FFB300;     /* Warning */
--palette-red-500: #D32F2F;        /* Error */
```

### Layer 2: Semantic Tokens (Global + Theme Scopes)
**Files:** `src/styles/tokens/colors.css` (global), `src/styles/flavors.css` (themes)

Semantic tokens that components consume:

```css
/* Global Semantic Base */
--color-surface: var(--base-100);           /* Background surfaces */
--color-on-surface: var(--base-800);       /* Text on surfaces */
--color-primary: var(--palette-blueberry-500); /* Main brand color */
--color-on-primary: #fff;                  /* Text on primary */

/* Status Colors (Global) */
--color-success: var(--palette-green-500);
--color-on-success: #fff;
--color-warning: var(--palette-yellow-500);
--color-on-warning: #000;
--color-error: var(--palette-red-500);
--color-on-error: #fff;
```

## Theme Implementation Pattern

**All themes follow the same override pattern** - they only redefine semantic tokens, never palette tokens:

```css
/* ✅ GOOD: Theme overrides semantic tokens only */
.flavor-vanilla.theme-light {
  --color-primary: var(--palette-vanilla-500);
  --color-background: var(--palette-vanilla-100);
  --color-on-background: var(--palette-vanilla-800);
  --color-error: #D32F2F;
  --color-on-error: #fff;
}

/* ❌ BAD: Don't redefine palette tokens in themes */
.flavor-vanilla.theme-light {
  --palette-vanilla-500: #6B5C4B;  /* Wrong - palette is global */
  --color-primary: var(--palette-vanilla-500);
}
```

## Token Naming Conventions

### Background/Surface Tokens
Every background color has a corresponding text color:

| Background Token | Text Token | Usage |
|------------------|------------|-------|
| `--color-surface` | `--color-on-surface` | Default surface backgrounds |
| `--color-surface-alt` | `--color-on-surface-alt` | Alternative/dark surfaces |
| `--color-primary` | `--color-on-primary` | Primary action backgrounds |
| `--color-primary-darker` | `--color-on-primary-darker` | Pressed/hover states |
| `--color-background` | `--color-on-background` | Theme page backgrounds |
| `--color-success` | `--color-on-success` | Success messages |
| `--color-warning` | `--color-on-warning` | Warning messages |
| `--color-error` | `--color-on-error` | Error messages |

### Palette Naming Pattern
Palette tokens follow Material Design-inspired naming:

- **100**: Lightest tint (backgrounds)
- **200**: Light tint (theme backgrounds)
- **500**: Base color (primary use)
- **700**: Dark shade (borders)
- **800**: Darker shade (text on light)
- **900**: Darkest shade (text on very light)

## Component Integration Guidelines

### ✅ Recommended Component Patterns

```css
/* Use semantic tokens with fallbacks */
.labs-button {
  background: var(--color-primary, #2563eb);
  color: var(--color-on-primary, #fff);
  border: 1px solid var(--color-primary, #2563eb);
}

/* Status colors */
.error-message {
  background: var(--color-error);
  color: var(--color-on-error);
}
```

### ❌ Anti-Patterns to Avoid

```css
/* Don't use palette tokens directly in components */
.bad-button {
  background: var(--palette-blueberry-500); /* Wrong - use --color-primary */
}

/* Don't hardcode colors without semantic meaning */
.bad-text {
  color: #2E2B74; /* Wrong - use --color-primary or --color-on-surface */
}
```

## Theme Development Workflow

### Creating a New Theme

1. **Define your palette** in `tokens/colors.css`:
```css
/* Orange Palette */
--palette-orange-100: #FFF7ED;
--palette-orange-200: #FFEDD5;
--palette-orange-500: #F97316;
--palette-orange-800: #9A3412;
```

2. **Create theme selectors** in `flavors.css`:
```css
.flavor-orange.theme-light {
  --color-primary: var(--palette-orange-500);
  --color-primary-darker: var(--palette-orange-800);
  --color-background: var(--palette-orange-100);
  --color-on-background: var(--palette-orange-800);
}
```

3. **Test in Storybook** using the Colors documentation.

### Debugging Theme Issues

1. **Check theme class application**: Ensure `flavor-*` and `theme-*` classes are applied correctly
2. **Verify token resolution**: Use browser dev tools to trace CSS custom property inheritance
3. **Validate contrast**: Ensure all text/background combinations meet WCAG requirements
4. **Test theme combinations**: Verify all flavor + theme combinations work

## Migration from Old Patterns

If you have existing themes using the old complex pattern:

### Before (Complex)
```css
.flavor-custom.theme-light {
  /* Don't do this anymore */
  --palette-custom-100: #F0F0F0;
  --palette-custom-500: #505050;
  --color-primary: var(--palette-custom-500);
  /* ... 20+ lines of redefinitions */
}
```

### After (Simplified)
```css
.flavor-custom.theme-light {
  /* Only override semantic tokens */
  --color-primary: var(--palette-custom-500);
  --color-background: var(--palette-custom-100);
  --color-on-background: var(--palette-custom-800);
}
```

## Performance Considerations

- ✅ **CSS Custom Properties are fast** - Modern browsers optimize them well
- ✅ **Fewer token definitions** - Our simplified architecture reduces parse time
- ✅ **No runtime JavaScript** - All theming happens at CSS level
- ❌ **Avoid deep nesting** - Keep resolution chains ≤ 2 levels
- ❌ **Don't create circular references** - Always map semantic → palette, not palette → semantic

## Accessibility Compliance

All token combinations meet **WCAG 2.1 AA standards**:

- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text**: 3:1 minimum contrast ratio
- **Status colors**: Optimal contrast verified for all backgrounds

Use Storybook's Colors documentation to verify contrast ratios for your theme combinations.

## Tools & Resources

- **Storybook Colors Docs**: Visual reference for all tokens and themes
- **WebAIM Contrast Checker**: Verify accessibility compliance
- **Browser DevTools**: Inspect CSS custom property resolution chains
- **DESIGN-TOKENS-MIGRATION.md**: Detailed migration planning and rationale

---

_For implementation details and current status, see [COLORS-DOCS--TODO.md](COLORS-DOCS--TODO.md)_
