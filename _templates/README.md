# MindCubby Template Milestones

Saved templates checkpoint versions as we build patterns and components.

## Versioning

Template versions increment by feature set, not dates:
- `template-boiler-plate-01` — Base: Header + theme toggle
- `template-boiler-plate-02` — Add footer + container patterns
- `template-boiler-plate-03` — Add grid/card system
- etc.

## Base Requirements

All templates:
- Use Smoothie design system CSS only (no internal `<style>`)
- Zero inline styles — all semantic HTML
- Theme toggle with localStorage persistence
- Mobile responsive by default
- Work as drop-in boilerplates for new pages

## Current Status

**template-boiler-plate-01** ✅ Complete
- Header with centered h1 and controls
- Theme toggle button (icon-only, 44px circular)
- Appearance toggle button (icon-only, 44px circular)
- Empty main content area
- Minimal, clean structure
- Use case: Simple pages with header and basic layout

**template-boiler-plate-02** ✅ Complete
- Uses `labs-footer-layout` for full-page structure
- Header bar: Theme + appearance controls (icon-only)
- Content area: Scrollable grid of cards using `labs-grid columns="auto"`
- Footer: Sticky footer with copyright info
- Responsive: 3-column grid → 1-column on mobile
- Use case: Dashboard apps, content-heavy pages with persistent controls
- Demonstrates: Grid patterns, footer layout, theme system
