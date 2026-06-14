# Rotater — Full Feature List (Working Document)

This is a living reference for Rotater’s feature set, organized for ongoing product, UX, and implementation planning.

Primary source references:
- `README.md`
- `CHANGELOG.md`
- `DESIGN-REFERENCE.md`

---

## Table of Contents
- [1) Product Intent](#1-product-intent)
- [2) User Journey Overview](#2-user-journey-overview)
- [3) Core Feature Inventory](#3-core-feature-inventory)
  - [3.1 Model Import, Replace, and Multipart Workflows](#31-model-import-replace-and-multipart-workflows)
  - [3.2 Model Appearance and Part-Aware Editing](#32-model-appearance-and-part-aware-editing)
  - [3.3 Background, Surface (Build Plate), and Sync Logic](#33-background-surface-build-plate-and-sync-logic)
  - [3.4 Viewer and Camera Interaction](#34-viewer-and-camera-interaction)
  - [3.5 Animation System](#35-animation-system)
  - [3.6 Export and Share System](#36-export-and-share-system)
  - [3.7 Save/Restore, URLs, and Persistence](#37-saverestore-urls-and-persistence)
  - [3.8 App Settings and Safety UX](#38-app-settings-and-safety-ux)
  - [3.9 Performance, Reliability, and Security](#39-performance-reliability-and-security)
- [4) UX Design Decisions (Why Features Work This Way)](#4-ux-design-decisions-why-features-work-this-way)
- [5) Use Cases and Scenarios](#5-use-cases-and-scenarios)
- [6) Onboarding / Tutorial Plan (Working)](#6-onboarding--tutorial-plan-working)
- [7) Future Consideration: Interactive Web Feature Explorer](#7-future-consideration-interactive-web-feature-explorer)
- [8) Gap Analysis: What May Be Missing](#8-gap-analysis-what-may-be-missing)
- [9) Planned Features and Roadmap](#9-planned-features-and-roadmap)
- [10) Change Log for This Document](#10-change-log-for-this-document)

---

## 1) Product Intent
Rotater enables users to load STL models in-browser, style them, animate them, and export/share presentation-ready outputs (GIF, MP4, PNG, JPEG), while keeping file handling client-side.

---

## 2) User Journey Overview
1. Upload STL(s) or load Benchy test model
2. Tune model visual style (color, shade, finish, texture/lighting)
3. Configure scene context (background, grid, build plate/surface, sync source)
4. Adjust camera framing and optional animation behavior
5. Export or share (media export, copy link, save/import project package)
6. Reopen and continue via persisted local state or URL/package restore

---

## 3) Core Feature Inventory

### 3.1 Model Import, Replace, and Multipart Workflows
- Drag/drop and picker-based STL upload
- Add vs replace decision flow when model already exists
- Multipart import preserving CAD-relative alignment
- Per-part management (replace, hide/show, remove)
- Multipart bulk selection and bulk apply for color/shade/finish
- File chip with part list expansion and per-part actions

### 3.2 Model Appearance and Part-Aware Editing
- Model preset system with model-only preset application
- Custom color picker and shade controls
- Texture modes (Clay, Phong/Satin, Metal) with part-aware persistence
- Fine-tuning controls for finish-strength and detailed adjustment
- Per-part settings persistence without cross-part bleeding

### 3.3 Background, Surface (Build Plate), and Sync Logic
- Background presets: White, Black, Model Sync, Custom
- Surface/build plate presets and custom tone controls
- Auto-brightness for background and surface with manual handoff behavior
- Model Sync Source for multipart color-follow behavior
- Grid visibility and floor/footprint guide support
- Surface shape and size controls (presets + custom dimensions)

### 3.4 Viewer and Camera Interaction
- Orbit, zoom, constrained vertical pan
- D-pad camera step controls with keyboard parity
- Pause/resume controls in viewer
- Reset/reframe behavior for export-focused composition
- Export framing workspace integrated into main viewer
- Crop framing now preserves the current camera pose on entry and when switching ratios; re-clicking the same ratio toggles crop mode off/on, and clicking outside the crop frame closes it.

### 3.5 Animation System
- Animation enable/disable master toggle
- Modes: Spin, Tilt, Wobble
- Time/range controls with per-mode interpretation
- Time-based rotation updates for FPS-independent timing consistency

### 3.6 Export and Share System
- Format options: GIF, MP4, PNG, JPEG
- Quality presets and still-image aspect presets
- Export quick options: Background, Grid, Build Plate
- Live export preview and framing parity with viewer workspace
- Copy Link with scene-state URL encoding
- Save Project ZIP with package metadata + STL source files
- Import Package via upload flow for rapid restore/testing

### 3.7 Save/Restore, URLs, and Persistence
- Local persistence of scene/UI state across refresh
- URL-based session restoration (shareable state links)
- Build/version-aware behavior for settings compatibility
- Defaults layering model (URL defaults, query fallback, runtime defaults)

### 3.8 App Settings and Safety UX
- Fine tuning toggle
- D-pad visibility toggle
- Reset all warnings toggle and warning re-enable flow
- Build plate size presets and custom sizing
- Theme toggle and About entry
- Reset Everything full state clear

### 3.9 Performance, Reliability, and Security
- Startup flow/splash improvements for first paint and restore transitions
- Export reliability improvements (encoder/backpressure handling)
- Thumbnail/render update optimizations for multipart interactions
- Restore/state consistency fixes across auto/manual shade paths
- ZIP import hardening (path validation, file allowlist, archive guards)

---

## 4) UX Design Decisions (Why Features Work This Way)
- **Share language in UI**: Export panel labeling favors sharing workflows (Copy Link + Save Project) while retaining export capability.
- **Single framing surface**: Export uses the main viewer to reduce cognitive split between “editing view” and “output view.”
- **Model-only presets**: Prevents unintended scene-wide changes when users only intend material/model updates.
- **Auto/manual tone parity**: Background/surface shade systems are aligned to reduce surprising differences.
- **Context-sensitive controls**: Multipart-only controls are hidden when not needed, reducing noise for single-model sessions.
- **Precision gating**: Advanced tuning appears only when enabled, preserving a simpler default experience.
- **Design token discipline**: Blueberry token usage and semantic mapping enforce visual consistency in light/dark themes.
- **State-safe warnings**: Dismissible confirmations support speed for power users while preserving guardrails for first-time flow decisions.

---

## 5) Use Cases and Scenarios
- **3D print creator showcase**: Load model, style finish/background, export MP4/GIF for product pages.
- **Multipart assembly preview**: Import multiple STLs, tune parts independently, bulk-adjust selected subsets, export stills.
- **Social content creation**: Use aspect presets (1:1, 9:16, 16:9), transparent background, and quick exports for platform-fit media.
- **Client approval loop**: Copy Link to share exact scene settings; Save Project ZIP for versioned handoff/reopen.
- **Rapid internal testing**: Load Benchy + use presets + app reset tools to verify behavior quickly.

---

## 6) Onboarding / Tutorial Plan (Working)
Proposed tutorial structure:
1. **First launch orientation**: Viewer controls, tabs, and export/share location
2. **Import basics**: Upload vs replace vs add-to-plate
3. **Quick styling**: Presets, custom color, shade, finish
4. **Scene setup**: Model Sync, auto brightness, grid, surface shape/size
5. **Motion setup**: Spin/Tilt/Wobble and timing
6. **Export/share**: Framing, format selection, Copy Link, Save Project
7. **Recovery & safety**: Reset warnings, Reset Everything, Load Benchy

Tutorial delivery options:
- Inline stepper overlay (first-run only, dismissible)
- “Show me around” entry in App Settings
- Contextual tips tied to first use of advanced controls

---

## 7) Future Consideration: Interactive Web Feature Explorer
Potential future format for this document as an interactive page:
- Filterable feature taxonomy (Import, Appearance, Export, Settings, Performance, Security)
- Expandable feature cards with:
  - intent
  - UX rationale
  - user value
  - dependencies
  - status/history links to changelog sections
- Scenario browser (creator, seller, educator, tester personas)
- Embedded onboarding flow map and future-roadmap links

---

## 8) Gap Analysis: What May Be Missing
Likely missing items to define next for a complete product spec:
1. **Persona definitions**: clear target user profiles and priority ranking
2. **Feature priority tiers**: must-have vs nice-to-have by release phase
3. **Acceptance criteria per feature**: testable success conditions
4. **Known limitations matrix**: browser support, file-size ceilings, device constraints
5. **Telemetry plan**: onboarding completion, export success/fail funnels, top-used features
6. **Error-state UX inventory**: import failures, codec limitations, storage issues
7. **Accessibility checklist**: keyboard paths, labels, focus management, contrast targets
8. **Information architecture map**: where each control should live long-term
9. **Migration/change governance**: naming changes, deprecated controls, compatibility policy
10. **Documentation ownership model**: who updates this file and when

---

## 9) Planned Features and Roadmap

### Ruler & Measurement Capture
**Status**: Planned  
**Scope**: Automate screenshot exports with measurement overlays

- **Core capability**: Measurement system already exists in viewer (ruler/grid/dimensions visible)
- **Feature**: Capture model screenshots with ruler/measurement markers visible
- **Implementation**:
  - Add "Ruler" checkbox in Export panel (right of "Surface" checkbox)
  - When enabled, include visible ruler/grid in exported images
  - Quick win: Add ruler to existing build plate grid (visual enhancement)
- **Export formats**: Apply to PNG and JPEG exports
- **UI placement**: Export settings panel, measurement section

### Multi-Part Selection & Grouping
**Status**: Planned  
**Scope**: Allow users to organize multipart models into visual groups

- **Context**: Multi-select mode already exists (select multiple parts)
- **Feature**: While multi-select is active, ability to click individual models to combine them into named groups
- **Benefits**: 
  - Organize complex assemblies visually
  - Apply group-level styling/animations
  - Simplify selection workflows
- **Implementation approach**:
  - Add "Create Group" action when multiple parts selected
  - Group name input or default naming (e.g., "Assembly 1", "Subassembly")
  - Visual indication of grouped parts
  - Persist groups to URL state
- **Precedence**: Lower priority; evaluate after measurement export completion

---

## 10) Change Log for This Document
- **2026-06-14**: Updated crop interaction notes and staged Planned Features section with ruler/measurement capture and multi-part grouping roadmap items.
- **2026-06-13**: Added Planned Features section: ruler/measurement capture and multi-part grouping
- **2026-05-17**: Initial working document created from README, CHANGELOG, and DESIGN-REFERENCE synthesis.
