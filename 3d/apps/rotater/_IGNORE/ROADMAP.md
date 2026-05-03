# Rotater Roadmap (Undone Only)

Last updated: 2026-05-03

## Quick Wins

- Tabs white-fringe artifact on rounded tab edges
- Header button vertical alignment (Export/Download vs filename/Upload)
- Investigate finish/gloss coupling side effects during preset changes

## Ready To Build

- Imperial / Metric switch style parity with Lines switch pattern
- Single-click full-screen expand action
- Advanced export toggle (basic vs advanced controls)
- Unified Upload / Import flow (STL + Rotater ZIP)
- Textured background presets (checker/gradient/noise)
- Build plate option under model
- ~~3D ruler lines in viewport with projected labels~~ → shipped as grid cell-size indicator in HUD
- Crop interactive handles (corner/edge drag, keyboard nudge, snapping)
- Add STL to existing parts — dashed round rect with "+" and "Add STL" inside part selector
- Upload multipart behavior — default is add; show confirmation with option to replace
- Export panel dock — dock/undock button to embed Export panel in bottom of right panel
- App Settings (now Advanced Settings) — reorganization complete; complex items remain (mobile hamburger, undo/redo)
- ~~Filename chip — remove from canvas top; Export/Theme/Effects row always visible on mobile; tab style like matte/satin with purple active color~~ → shipped: Export tab consolidated into sidebar-tabs row (filename chip removal deferred)
- Undo / Redo buttons for settings-only changes (sliders, colors)
- Mobile hamburger menu for access to Advanced Settings

## Needs Design Decision

- Add STL to existing aligned assembly workflow

## Design Decisions Made (Implemented or Ready to Implement)

- Add STL to existing parts (+ button flow): inside part selector, dashed stroke round rect with plus sign and "Add STL"
- Upload multipart behavior: default add; confirmation with option to replace
- Export panel placement: already floating on desktop; add dock/undock button to embed in bottom of right panel
- App Settings organization: renamed to Advanced Settings; precise checkbox stays (advanced settings); Load Benchy replaced with Reset Everything; Download Package moved to Export panel; dark mode stays in Advanced Settings only; mobile hamburger menu needed for mobile access
- Download package placement: moved to Export panel footer
- Undo scope: add standard forward/backward buttons for settings changes only
- Filename chip X behavior: remove filename chip from canvas top entirely; Export/Theme/Effects always visible on mobile in one row; tab style matches matte/satin with purple active color
- Watermark: ROTATER logo at 50% opacity, white, added to Advanced Settings toggle
- Filename in export metadata: include STL filename(s) in exported image metadata

## Later / Backlog

- Re-open previously downloaded packages in one click
- Multipart package preview before import
- Package thumbnails and manifest metadata
- Batch export presets for repeated listing generation
- Point-to-point measurement via raycast
- Workplane grid + ruler overlay hybrid
- Preset gallery with save-as modal
- Surface finish snap presets
- Per-part material assignment for multi-color assembly
