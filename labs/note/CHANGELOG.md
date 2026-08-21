# Changelog

All notable changes to the DailyNote app will be documented in this file.

## [5.1.0] - 2025-11-19 - ThemeManager Integration

### 🔧 Technical Improvements
- **ThemeManager v2 Integration**: Unified app-specific theme/flavor persistence
  - Storage keys: `note-flavor`, `note-theme`
  - Seamless persistence across app restarts
  - Centralized singleton utility eliminates per-app boilerplate

### 🎨 Features Maintained
- All v5.0.0 features fully functional with new persistence layer
- Expand/collapse, auto-save, timestamp tracking all operational

---

## [5.0.0] - 2025-10-19

### 🎨 Major UI/UX Improvements
- **Expand/Collapse Button**: Click the expand button (↗️) to maximize the note for distraction-free writing. Icon toggles to collapse (↙️) when expanded
- **Fullscreen Mode**: Note card expands to fill entire viewport, textarea grows to fill available space
- **Two-Line Header**: Date now displays on two semantic lines (no `<br>` tags) - "Today is [day]" on line 1, "[date]" on line 2
- **Centered Layout**: Header and note card now centered together on page for unified visual hierarchy

### ✨ New Features
- **State Persistence**: Expanded state saved to localStorage and restored on page refresh
- **Auto-Save**: Text auto-saves with 500ms debounce on input (no more manual save button)
- **Timestamp Tracking**: "Last edited" timestamp updates automatically on each save
- **Proper Flex Layout**: Card and textarea properly fill available vertical space when expanded

### 🏗️ Architecture Changes
- **Design System Integration**: Now uses Labs design system components (container, card, button, icon) instead of custom styling
- **Web Components**: Custom `<note-input-card>` component with Shadow DOM encapsulation
- **Enhanced Container**: Container component now supports `fill` attribute for fullscreen layouts with `height: 100vh`
- **Improved Card Component**: Card's input slot now properly supports flex-grow for vertical expansion

### 🔧 Technical Improvements
- **Event-Driven Architecture**: Component emits `autosave`, `expanded-changed`, and `reset` events
- **Modular Component API**: Public methods: `setValue()`, `getValue()`, `focus()`, `setTimestamp()`, `toggleExpanded()`
- **State Management**: Proper localStorage handling with daily cleanup and expanded state persistence
- **CSS Custom Properties**: Full use of design system tokens for colors, spacing, typography

### 📚 Documentation
- Comprehensive README with feature list and usage guide
- New COMPONENT.md with complete API documentation
- Updated CHANGELOG with version history

### 🧹 Cleanup
- Removed test-daily-reset.js and test-storage.js (old migration artifacts)
- Removed migration documentation files
- Removed index.html backup file
- Consolidated core test suite to test-functionality.js

## [Unreleased]

### Added

- "All Apps" button in settings overlay for navigation back to labs home page
- Project-specific favicon with `icon-labs--note.*` naming
- Favicon files placed in project root for easy maintenance
- Cache busting parameters for favicon and CSS assets

### Changed

- Updated HTML to reference new favicon assets
- Simplified favicon paths from `assets/images/` subfolder to project root
- Added cache busting (`?v=2.0.0`) to ensure updated assets load properly

### Fixed

- Fixed circular UI elements (settings button) getting distorted on tablet devices
- Removed problematic padding that was causing "squished circles" while preserving improved tablet positioning

## [1.0.3] - 2025-05-13

### Changed

- Settings button and overlay styles now match Tracker app (light/dark, hover, active)
- Settings overlay buttons (theme toggle, clear note) updated for consistency and accessibility
- Clear Note button is now inactive when there is no note, matching Tracker
- Added Refresh button to settings overlay (mobile only), with matching icon and behavior
- Improved icon consistency and SVG usage for settings/refresh/reset
- Minor accessibility and focus improvements

### Fixed

- Refresh icon now displays correctly on all devices
- Overlay and button states are visually consistent in both light and dark mode

## [1.0.0] - 2025-05-12

### Added

- Initial release of DailyNote app
- Single note interface that resets daily
- Dark mode support that respects system preferences
- Responsive design for mobile and desktop devices
- Note editing functionality with proper overlay
- Label editing functionality to customize the note header
- Settings menu with theme toggle and note reset options
- Undo functionality for cleared notes
- iOS PWA support for home screen installation
- Theme color updating for browser UI elements
- Keyboard accessibility improvements
- Flash prevention during page load

### Design Features

- Clean and consistent UI design matching the Tracker app
- Font scaling for better readability
- Proper button styling with hover and active states
- Consistent overlay design across modals
- Visual feedback for user interactions
- High-contrast support for accessibility
- Smooth transitions between states
