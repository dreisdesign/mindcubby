# Changelog

All notable changes to Smoothie Design System v3.0 are documented here.

## [Unreleased]

### Fixed
- **labs-card padding issue** - Card content (header, description, input, actions) was rendered without proper padding applied. Fixed by wrapping slots in a `.card-content` container with padding and flex gap spacing. Issue occurred because padding on `:host` doesn't apply to slotted light DOM content. Now cards have consistent 2rem padding around content and 1rem gap between slots.
- **labs-card spacing between elements** - Added `gap: 1rem` to `.card-content` flex container to ensure proper vertical spacing between header, description, input, and action slots.

### Changed
- **labs-card shadow DOM structure** - Refactored to use internal `.card-content` wrapper for proper padding application to slotted content. `:host` now has `padding: 0` while `.card-content` applies `padding: var(--labs-card-padding)`.

### Documentation
- **Card Patterns page** - Updated `/smoothie/patterns/cards/` to show only real-world patterns used in Labs apps (Input Forms, Confirmation Dialogs, Metric Cards).
- **Design System README** - Added clarification on how card spacing and padding are handled at the component level via shadow DOM styling.

---

## [3.0.0] - 2026-08-26

### Added
- Initial release of Smoothie Design System v3.0
- 30+ Web Components (buttons, cards, inputs, dropdowns, checkboxes, etc.)
- Comprehensive design tokens (colors, typography, spacing, radius, shadows)
- Theme system with Vanilla, Blueberry, and Cherry flavors
- Light and Dark mode support
- Pattern library with common UI compositions
- Component showcase pages with live examples
- Full WCAG AA compliance

---

## Component Padding & Spacing

### labs-card Shadow DOM Structure

The card component uses an internal `.card-content` wrapper to properly apply padding to slotted content:

```javascript
.card-content {
  padding: var(--labs-card-padding);  // 2rem by default
  display: flex;
  flex-direction: column;
  gap: 1rem;  // Spacing between slots
}
```

This ensures:
- Padding is consistently applied to all content (header, description, input, actions)
- Vertical spacing between sections is uniform
- Customizable via CSS custom properties (--labs-card-padding)

### Why This Approach?

In Web Components with Shadow DOM, padding on `:host` applies to the element boundary, not to slotted content. The card needs padding around the content area, not around the component border. By using an internal wrapper with proper flex spacing, we achieve consistent, predictable card layouts across all use cases.
