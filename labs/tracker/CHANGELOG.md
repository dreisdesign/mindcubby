# Tracker App Changelog

All notable changes to the Tracker app will be documented in this file.

---

## [1.1.0] - 2025-11-19 - Layout Consistency & ThemeManager Integration

### 🎨 UI/UX Improvements
- **Layout Update**: Container resized from `small` to `medium` for consistency with Today List app
  - Wider, more spacious layout matching all other apps
  - Improved visual hierarchy and readability
- **Theme Persistence**: Integrated ThemeManager v2 for unified flavor/theme persistence
  - Seamless sync across app restarts
  - Uses localStorage keys: `tracker-flavor`, `tracker-theme`

### 🏗️ Architecture
- **ThemeManager Integration**: Centralized singleton for app-specific theme management
- **Design System**: Full design system component usage (container, card, button, list-item, footer-with-settings)

---

## [1.0.0] - 2025-10-08 - Migration Complete

### ✅ Completed Features
- ✅ Track button adds timestamped entries
- ✅ Metric displays correct count
- ✅ List renders with formatted timestamps
- ✅ Reset all clears entries with undo toast
- ✅ Data persists across page reloads
- ✅ Empty state displays when no entries
- ✅ Delete with undo toast
- ✅ Light/dark theme support
- ✅ Flavor support (3 variants)
- ✅ iOS footer sticky positioning (100dvh fix)
- ✅ Borders visible on cards and list items
- ✅ Responsive design on all breakpoints
- ✅ Dark mode renders correctly

### 🔧 Technical
- **Phase 1**: Template foundation from design system (Oct 8, 2025)
- **Phase 2**: JavaScript modernization with clean data store
- **Phase 3**: Feature restoration and testing
- **Phase 4**: Polish & production-ready (Complete Oct 8, 2025)

### 📁 Reference
- **Migration Details**: See `_archive/MIGRATION-2025-10-08.md` for complete migration documentation
