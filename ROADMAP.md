# Rotater Roadmap

Planned improvements and design goals for the Rotater app.

_Last updated: May 2026_

---

## Batch 1 — Quick Wins
> Small, self-contained changes. Low risk, high value.

- **Tabs white-fringe artifact** — Rounded tabs show a light edge/fringe against the tab background. Audit border radius + background clip + any outline/shadow bleed.
- **Header button vertical alignment** — Export/Download buttons sit slightly higher than filename/Upload controls. Normalize shared button height, line-height, and icon alignment.
- **Export format dropdown border radius** — Format dropdown in export panel doesn't match the border-radius of other controls. CSS-only fix.
- **Selected model sphere padding** — Add padding inside the selection border ring on model part spheres so the border doesn't clip the thumbnail edge.
- **Restore export quality slider** — Quality dropdown/slider was previously available and removed. Restore it as a visible control in the export panel (Low / Standard / High).
- **Scroll-to-zoom blocked by export preview** — Mouse wheel zoom stops working when the cursor is over the export preview area. Fix scroll event propagation so zoom always works on the canvas.
- **Warning before replacing STL** — Show a confirmation dialog when a new STL upload would replace an existing model (especially with unsaved settings or multipart). Keep it lightweight — a one-line confirm banner, not a modal.
- **Investigate: Finish / Gloss slider coupled to Shade slider** — UI note: the Finish and Gloss sliders appear to be visually or functionally linked to the Shade slider in unexpected ways. Investigate and decouple if needed.

---

## Batch 2 — Ready to Build
> Design is clear enough to start. May need a small design pass first.

- **Stop spinning on still-image format selection** — When PNG or JPEG is selected in Export, automatically pause rotation (same as pressing Pause). Resume when switching back to GIF or MP4. Show a subtle "Paused for export" indicator near the pause button.

- **Imperial / Metric toggle** — Replace the current button-style unit switcher with a proper accessible toggle switch (matching the Lines toggle style already in the ruler HUD).

- **Single-click full-screen expand** — Add an expand icon on the canvas that opens the model in a full-screen/lightbox view with one click. (Currently requires multiple steps.)

- **Advanced export toggle** — Add a simple "Advanced" toggle in the export panel. Off = use sensible defaults and hide detailed options. On = reveal full controls (quality, loops, dither, etc.).

- **Unified Upload / Import flow** — Replace the current "Upload STL" button with a unified Upload entry point that:
  - Accepts plain STL files
  - Accepts Rotater ZIP packages (restores settings + STL from `package.json`)
  - Falls back gracefully if the ZIP doesn't contain a valid package
  - Shows a "Reset to Benchy" option inside the upload overlay

- **Per-section reset buttons; remove global reset** — Each control card gets its own small reset icon (upper-right corner). Remove the global "Reset Settings" button in the sidebar header.

- **Time-based rotation speed** — Rethink speed control: instead of a multiplier (1×, 2×…), express as seconds per full rotation (e.g. "8 s / rev"). Pick a slightly faster default and update slider ticks + display.

- **Textured background** — Allow user to choose a textured/patterned background (checkerboard, gradient, subtle noise) in addition to solid colors.

- **Build plate option** — Add an optional platform grid beneath the model so it sits on a visible surface during preview and export.

- **3D ruler lines in viewport** — Draw three ruler lines (one per axis) in the 3D scene, aligned to the model bounding box. Labels via HTML `<div>` positioned with `camera.project()` each frame. Visibility tied to the HUD badge toggle. (See design notes below.)

- **Crop interactive handles** — Add corner/edge drag handles to the crop overlay (SVG recommended). Support aspect-lock, keyboard nudges, and snap-to-center/edges. (See design notes below.)

---

## Batch 3 — Needs Design Decision
> Good ideas that need more thought before building. Some need clarification questions answered first.

- **Add STL to existing parts** — Allow adding a new STL alongside the currently loaded parts rather than replacing them. Proposed UI: a `+` button below the existing part thumbnails in the model selector. Questions to resolve: how are new parts positioned relative to existing ones? Does the user control initial placement?

- **Upload STL rethink — multipart replace behavior** — Currently uploading replaces all 3 part slots. This is surprising and lossy. Should upload target a specific slot? Should it add rather than replace? Closely related to the Unified Upload item above. Needs a clear UX spec before building.

- **Move Export panel to right rail** — Proposal to let the Export card live permanently in the right panel (desktop) with optional click/drag snap-to-position behavior. Questions: does this replace or supplement the current overlay approach? How does it behave on mobile/tablet?

- **Organize App Settings** — App Settings is currently a vertical stack of buttons that takes up significant sidebar space. Options: collapse into a popover/dropdown, reorganize into grouped rows, or move less-used settings into a secondary panel. Needs a layout mockup before building.

- **Move "Download JSON Package"** — Current placement may not be discoverable or logical. Where should it live — inside Export, inside App Settings, or in a dedicated "Save / Share" area? Decide placement before moving.

- **Add STL to existing assembly** — Support loading multiple STL files that share a coordinate space (e.g. parts exported from CAD together). Relates to multipart and the `+` button item above. Needs positioning design.

- **Undo** — Undo last settings change (or last STL action). Questions: what is the undo scope? Settings only, or also model changes? Single-step or full history stack? localStorage-based or in-memory?

- **Benchy reset / Replace-STL UX change** — Current behavior: the `×` next to the filename resets the scene to Benchy. This is surprising when users expect `×` to remove or replace. Move Benchy reset into the unified Upload overlay; change `×` to open Replace or remove the part. (See implementation notes below.)

- **Dedicated Benchy button** — Add a visible "Load Benchy" quick-load affordance so the test model can always be recalled in one click, independent of the Upload flow.

- **New shading style / reconsider Flat** — Add a new shader (Matcap, Toon, or Rim-light). Consider removing Flat since it has limited visual value.

- **Shader intensity slider** — Expose an intensity/brightness slider for the active texture/lighting preset.

- **Watermark toggle** — Option to overlay a small semi-transparent watermark (e.g. "made with Rotater") on exported GIF / MP4 / images.

- **Filename label in export** — Option to include the STL filename (or user-editable text) as a text overlay or appended label in the exported file.

---

## Batch 4 — Later / Backlog
> Lower priority or depends on earlier batches landing first.

- One-click re-open of previously downloaded packages
- Better multipart package previews before import
- Optional package thumbnails / manifest metadata for saved model sets
- Batch export presets for repeated marketplace image generation
- Point-to-point measurement via raycast (click two points on the mesh; show distance with leader lines)
- Workplane grid + ruler overlay (alternative to bounding-box ruler; planar/orthographic measurements)
- Preset gallery with saved custom presets (`localStorage`) and a "Save as preset" modal
- Surface Finish snap control (High Gloss / Medium / Low / Matte as discrete presets replacing fine-grain sliders)
- Per-part material assignment for multi-color model assembly

---

## Design Notes

### Benchy reset / Replace-STL — implementation notes
- Update the Replace STL overlay to include a clear "Reset to Benchy" control and a separate "Cancel" action.
- Change the filename-line `×` button to: (A) open the Replace overlay, or (B) remove the current model (confirm if unsaved changes or multiple parts exist).
- Audit all code paths that assume `×` triggers a Benchy load and update accordingly.

### Crop — interactive handles
- Status: modal overlay implemented (v1.7.0)
- Recommended approach: SVG overlay handles aligned to the canvas parent. Pointer events on SVG; dim overlay drawn on `exportFrameCanvas`.
- Key behaviors: drag corner/edge to resize; drag inside to pan; aspect-lock toggle (square default); snap-to-center/edges; `fitToCrop()` camera action; persist in settings.
- Effort: prototype ~1–2 days, polish + accessibility ~2–3 days.

### Ruler / measurement — 3D lines
- Implemented: HUD badge (v1.3.0) — W · D · H pill badge at canvas top.
- Next: render `THREE.Line` objects per axis aligned to bounding box extents. Labels via HTML `<div>` positioned with `camera.project()` each frame. Visibility tied to HUD badge toggle.
- Color-code per axis (W/D/H) or unified neutral style — decide during implementation.
- Effort: ~1–2 days.

### Preset gallery — design decisions
- Presets apply color + shader + finish (non-destructive shortcut). Manual edits after applying set state to "Custom".
- Built-in presets shipped with the app; user-saved presets in `localStorage`.
- Presets do NOT change export format or quality.
- Surface Finish snap points: High Gloss (gl≈1.0), Medium (gl≈0.6), Low (gl≈0.3), Matte (gl≈0.0), Glass (sh=glass, et=1).

### Multi-color models — design
- Import multi-part STL/OBJ/GLB as separate meshes preserving relative transforms. Do not attempt auto-assembly.
- `scene.parts = [{ id, name, geometryRef, transform, material }]`
- Parts panel (left or right): thumbnails, names, per-part color/shader/preset controls, multi-select + "apply to all".
- Export: single combined file or separate per-part files; document limitations (baking vs. per-part meshes).

---

## Done

- ~~Maintain scale when replacing models~~ ✓
- ~~Expand preview — hide/tuck the controls sidebar~~ ✓
- ~~More pronounced export progress with progress bar~~ ✓
- ~~Spin direction toggle (CW / CCW)~~ ✓
- ~~"Rotater_" prefix on exported filenames~~ ✓
- ~~Quality preset labels: Low / Medium / High~~ ✓
- ~~Save filename with settings (mode + quality + modifiers)~~ ✓
- ~~Multipart STL import with part-aware model controls~~ ✓
- ~~Lighting moved to its own Lighting tab~~ ✓
- ~~Export moved into a dedicated modal with live preview~~ ✓
- ~~Contextual part dropdowns for multipart + Model Sync only~~ ✓
- ~~Multipart filename expansion with per-part replace/remove actions~~ ✓
- ~~Inline tab icons and modernized active tab styling~~ ✓
- ~~Download package export as ZIP (package metadata + STL source files)~~ ✓

**v1.7.x fixes & UI improvements:**
- GIF dither crash fix and transparent GIF palette fix (no blank GIFs)
- Dither and transparent GIF encoding performance improvements
- MP4 H.264 level fix for high-quality 1080p exports
- Crop-mode redesigned as a modal overlay with Cancel / Keep actions
- Unified transparent-background checkbox and transparent preview support
- Fixed Reset Settings empty-page flash and improved reset UX
- Fixed Level-and-reframe azimuth and stale-zoom issues; tightened default framing

**v2.x desktop redesign:**
- Full v2 desktop layout: left sidebar, right-rail export panel, fixed overlay controls
- Compact ruler HUD with metric/imperial toggle and axis lines toggle
- Collapsed export panel summary row (format select + short-label export button)
- Pause / crop controls right-aligned to canvas edge
