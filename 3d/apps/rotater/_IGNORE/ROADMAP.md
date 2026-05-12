# Rotater Roadmap
---

Updated: 2026-05-11

Arrows to switch the active selected model 


Updated: 2026-05-11


## Language
(Needs some thought) When 3+ parts are selected - update the wording in the dropdown from "Parts 1 +2 more" "(3/3 Selected) to "Parts 1, 2, 3" - or something better. "Part 1 

---

## D-Pad
- New setting for App Settings: Show/Hide D-Pad
- When D-Pad  hidden: Position the Pause button to the bottom right. 

---

## New feature: "New version indicator" - in the app settings card: a little red badge on the Info Icon.

---

## Make surface finish slider only available when Fine tuning for precise control is turned on in settings

---
## Refactor for Industry Standards
Most modern development practices (using frameworks like React, Vue, or Svelte) favor Modularization.
Metric	Assessment
0–300 lines	Ideal; highly readable and focused.
300–600 lines	Acceptable for complex components.
600–1,000 lines	Warning; consider breaking into smaller modules.
1,000+ lines	High technical debt; refactoring is recommended.
Recommendation
Break the file down into smaller, reusable modules using ES Modules (import/export). Group logic by functionality, such as utility functions, API calls, and UI components.


---

Create an automation for testing. NPM?
Plan: review all changelogs / bug fixes to collect and identify common bugs and regressions. 
Solution: create an automated test to run and catch them.




---

Updated: 2026-05-07

This file is intentionally split into two buckets:
- Up Next: concrete tasks we should execute soon.
- Idea Stage: valid ideas that are not scheduled yet.

---

## Current State Snapshot

- Multi-part bulk edit is moving to a live-edit model: select parts, then any color/shade/finish changes apply to all selected parts in real time.
- Light lock behavior is now user-controllable via a visible toggle (lock light to camera on/off).
- Import package is available in Upload flow, and package export naming now uses Project ZIP wording.
- Export workspace close behavior and crop outside-click interactions are stabilized.
- Rotation timing now uses elapsed-time updates so selected duration matches real time more closely under load.
- Startup splash/restore responsiveness has been improved for hard-refresh and returning-session flows.

---

## Up Next (Execution Queue)

1. Export duration dropdown (GIF + MP4)
- Replace the current static frame-count text area (for example "300 frames") with a duration dropdown that shows both duration and derived frame count in each option.
- Keep GIF and MP4 behavior aligned so both formats use the same duration options and frame math presentation.
- Example option format: "10.0s · 300 frames".
- Persist the selected duration and keep estimate labels in sync when FPS or format changes.

2. Batch 1: Export/crop consolidation (ship next)
- Reuse crop mode as the export workspace instead of maintaining separate main-view, mini-export, and export-overlay preview surfaces.
- Add a new Export entry beside Upload STL in the left panel.
- Remove the mini export card from the canvas UI.
- Remove the standalone crop button from the main viewer.
- Keep exactly one live preview and move export controls beside it.
- Apply the full-screen dark/blur treatment during export mode and keep the D-pad available.
- Standardize shared export button and icon sizing during this pass.
- Keep preview/export framing unified to prevent squish/skew regressions.

3. Batch 2: Persistence + multipart hardening
- Keep multipart checkboxes visible when bulk selection is active.
- Make 3-dot part actions apply to the current bulk-selected set when appropriate.
- Normalize build-plate shade behavior to match the midpoint-based shade model used elsewhere.
- Fix URL persistence gaps for model shade, build-plate color, and build-plate shade.
- Run regression checks for refresh persistence, export mode transitions, and mobile layout.

4. Upload decision UX simplification
- Replace current warning-style memory flow with explicit segmented default: Always Add / Always Replace / Ask.
- Keep one-click override in modal so users can bypass default per upload.

---

## Idea Stage (Not Scheduled Yet)

### Model Manager (larger scope)
- Full-screen model manager modal: larger thumbnails, rename, reorder (drag), replace, remove, and visibility in one workspace.

### Export Workspace Cleanup (resolved by consolidation)
- Mini export icon polish, duplicate preview sizing, overlay-only crop affordances, and two-preview performance tuning are intentionally not being pursued as standalone fixes.
- Those issues are superseded by the export/crop merge because the affected UI surfaces will be removed.

### Pinnable Cards (planned)
- Goal: any card (for example Build Plate) can be pinned into a quick-access tab rail for focus workflows.
- UX: pin/unpin per card from card header menu; pinned cards appear as tabs that jump focus and open the relevant section.
- Behavior rules:
	- Pinned cards preserve their expanded/collapsed state.
	- Pins are layout-aware: desktop rail + mobile accordion-compatible fallback.
	- Maximum visible pinned tabs with overflow menu when exceeded.
- Delivery plan:
	- Phase 1: data model + persistent pin state + basic tab rail navigation.
	- Phase 2: focus mode transitions and keyboard shortcuts.
	- Phase 3: drag reorder of pinned tabs + overflow polish.

### Measurement
- Advanced measure mode: click two mesh points and display live distance labels using raycast + ruler units.

### Undo
- Settings-only undo stack (Cmd/Ctrl+Z) separated from model file load/append/replace actions.

### Optional Product Ideas
- Optional filename label burned into export output.
- Revisit export watermark feature (deferred): redesign and re-implement only after behavior is validated across GIF/MP4/PNG/JPEG.
- Single-click full-screen canvas expand.
- Batch export presets for repeated listing generation.
- Preset gallery with save-as modal.

---

## Dependency Notes

- Full-screen manager should include thumbnail virtualization before enabling very large multipart sessions.
- Advanced measure mode depends on robust raycast hit filtering so hidden parts and transparent materials do not produce incorrect picks.
- Undo should be scoped to settings first to avoid file mutation complexity in early versions.

---
Imported from next.md

Modal Manager: List view /  thumbnail grid view / current card view.

Pinnable cards plan:
- Pin button on card header menus.
- Pinned cards become quick tabs for focus switching.
- Persist pin order/state and support overflow handling.

Animation shold have the same title treatment as Lighting Effects etc.

Idea: HOld down command to enter a select mode to select model by clicking on it. This was previously implemented but removed because it was obtrusive. By requiring command it will work without being an issue.

 ![Persistent Add Model button takes upa a lot of space... hmm](image-1.png)