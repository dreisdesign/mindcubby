# Pad App Changelog

All notable changes to the Pad drawing app will be documented in this file.

---

## [2.0.1] - 2025-11-19 - ThemeManager Integration

### 🔧 Technical Improvements
- **ThemeManager v2 Integration**: Unified app-specific theme/flavor persistence
  - Storage keys: `pad-flavor`, `pad-theme`
  - Seamless persistence across app restarts
  - Centralized singleton utility for consistent behavior

### 🎨 Features Maintained
- All v2.0.0 features fully functional with new persistence layer
- Drawing, persistence, theme support all operational

---

## [2.0.0] - 2025-10-20 - Full Design System Integration

### ✨ Major Redesign
- **V2.0 Complete**: Full redesign with design system integration
  - Header/Footer/Container structure matching all other apps
  - Touch + Pointer event handling (iPad/Apple Pencil support)
  - Pressure-sensitive line width (2px-8px)
  - Smooth quadratic curve rendering

### 🎨 Features
- localStorage persistence of drawings
- Theme/flavor support with persistent colors
- Clear All button with confirmation dialog in footer
- Responsive design across all device sizes

### 🏗️ Architecture
- **Design System**: Full integration with Labs design system components
- **Storage**: Persistent drawing data with theme/flavor support
- **Touch Support**: Apple Pencil pressure sensitivity for iPad users

### 🔧 Technical
- Event-driven architecture with touch/pointer events
- Shadow DOM encapsulation for component isolation
- CSS custom properties for theming
