# Rotater Roadmap (Undone Only)

---

## Phase 1 — Build Now (scoped, no major design unknowns)

### Grid / Ruler
- **Bounding box model lines** — thin overlay lines that align with the grid floor plane, matching the model's W/D footprint (builds on existing GridHelper; no new raycast required)

### Background Card
- **Build Plate** — solid-fill 3D mesh ground plane under the model; on/off toggle in Background card; inherits background color tint; builds directly on existing shadow-catcher plane
- **Background Texture slider** — single intensity slider in Background card controlling a subtle surface pattern (checker / grain) overlaid on the background color; on/off switch; no new preset rows needed

### Model Manager
- **Floating part dropdown (no scroll)** — when the filename chip dropdown opens it floats upward/outward as a positioned panel (not clipped inside the sidebar card) so all parts are visible without scrolling; z-indexes above the card
- **Multi-part bulk-edit** — add a checkbox to each row in the part list; when 2+ parts are checked, a "Bulk Edit" banner appears; changes to Color / Shade / Sheen / Finish apply to all checked parts simultaneously; uncheck to return to per-part editing; no link icon needed

---

## Phase 2 — Requires Design / Architecture

### Model Manager
- **Full-screen model manager modal** — expand the part list into a full-screen overlay for managing large multipart assemblies; shows larger thumbnails, rename, reorder (drag), replace, remove; triggered by an expand icon in the Model card header
- **Bounding box grid overlay (advanced)** — point-to-point measurement via raycast; click two points on the model surface and show a live distance label

### Export / Import
- **Unified Upload / Import flow** — new "Import Package" button next to Download Package in the Export panel; accepts STL or Rotater ZIP; ZIP import replaces all current parts (with confirmation dialog); re-opens settings from `package.json`

### General
- **Watermark toggle** — checkbox in Export panel; when on, a small branded watermark is composited into the preview and all exported outputs
- **Undo scope** — settings-only undo stack (Ctrl+Z / Cmd+Z); separate from model load actions

---

## Later / Backlog
- Optional filename label burned into export output
- Single-click full-screen canvas expand
- Batch export presets for repeated listing generation
- Preset gallery with save-as modal