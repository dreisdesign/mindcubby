# Rotater Roadmap (Open Items Only)

Completed work is tracked in CHANGELOG.md. This roadmap should only list undone items.

---

## Phase 1 — Build Now

### Grid / Ruler
- Bounding box model floor lines: draw thin model-footprint lines aligned to the grid floor plane and current ruler unit system.

### Background Card
- Background Texture slider: one intensity control for subtle surface pattern overlays (checker/grain) on the background color.

### Model Manager
- Multi-part bulk edit: checkbox per part row + bulk action banner so Color / Shade / Finish changes apply to all checked parts.

---

## Phase 2 — Design / Architecture

### Model Manager
- Full-screen model manager modal: larger thumbnails, rename, reorder (drag), replace, remove, and visibility in one workspace.
- Advanced measure mode: click two mesh points and display live distance labels using raycast + ruler units.

### Import / Export UX
- Import package placement decision: validate whether Import Package should remain in App Settings or move beside Download Package in Export.
- Upload decision UX follow-up: evaluate segmented default action control (Always Add / Always Replace / Ask) to replace single-warning flow if users need more explicit control.

### General
- Undo scope: settings-only undo stack (Cmd/Ctrl+Z) separated from model file load/append/replace actions.

---

## Dependency Notes (Reconsidered)

- Bulk edit depends on stable per-part persistence and append/replace workflows now in place.
- Full-screen manager should include thumbnail virtualization before enabling very large multipart sessions.
- Advanced measure mode depends on robust raycast hit filtering so hidden parts and transparent materials do not produce incorrect picks.
- Import package placement should be validated against actual user flow now that Upload has explicit Add/Replace decisions.

---

## Later / Backlog

- Optional filename label burned into export output.
- Single-click full-screen canvas expand.
- Batch export presets for repeated listing generation.
- Preset gallery with save-as modal.
