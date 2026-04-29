# Rotater Roadmap

Planned improvements and design goals for the Rotater app.

---

## Ready to build

1. Ruler / grid to see the scale of a model
   - Add an on-screen ruler or grid overlay with metric/imperial markings and an optional snapping guide so users can quickly judge model scale.
2. Replace / Drag-and-Drop overlay (Replace STL UX)
   - Replace the current inline "Replace STL" flow with a small overlay/modal that exposes the drag-and-drop area and the file picker.
   - Provide a clear action in the overlay to "Reset to Benchy" (loads the demo model) and a separate "Cancel" control. This makes the upload and reset flows discoverable in one place.
   - Remove the inline delete/reset button beside the filename in the sidebar; surface the reset action in the overlay instead.
   - Accessibility/UX notes: overlay must be keyboard-focusable, show drag-over state, and be dismissible with Esc.

3. Textured background
   - Allow the user to choose a textured or patterned background (e.g. checkerboard, gradient, subtle noise) in addition to solid colors. (Note: a lightweight checkerboard preview was added for export transparency.)

4. Build plate option
   - Add an optional build plate / platform grid beneath the model so it sits on a visible surface during preview and export.

---

## Crop (formerly 'Frame') — design notes

- Status: Implemented (modal overlay v1.7.0)
- Icon: `3d/apps/icons/crop.svg`
- Goal: The export "frame" now has a modal-like crop mode that dims/blur the outside area and exposes clear Cancel / Keep actions. This provides a focused, immediate crop workflow for framing exports.

Next: interactive handles & polish
- Add interactive SVG or DIV handles for corner/edge drag-to-resize and drag-to-move; support aspect-lock, keyboard nudges, and snap-to-center/edges.
- Improve accessibility (focus management, keyboard shortcuts, ARIA labels) and add persisted crop presets.

Design options:

Option A — SVG overlay handles (recommended)
- Implementation: Render the crop rectangle and handles as an SVG overlay aligned to the canvas parent. Pointer events handled on the SVG; draw the dim overlay on `exportFrameCanvas`.
- Pros: Crisp vector handles, CSS-friendly, straightforward pointer events and hit-testing, easy accessibility and animations.
- Cons: Need to keep coordinate mapping synchronized with canvas pixel size and devicePixelRatio.
- Effort: Small — prototype in ~1–2 days, polish + accessibility ~2–3 days.

Option B — Canvas interactive overlay (single-canvas)
- Implementation: Use `exportFrameCanvas` for both dim and interactive handles. Implement hit-testing and pointer capture manually; respect devicePixelRatio.
- Pros: Pixel-perfect alignment; no DOM overlay mismatch.
- Cons: More code for handle rendering and hit-testing; slightly harder to make accessible.
- Effort: Prototype ~2–3 days, polish ~3–5 days.

Option C — HTML overlay with absolute DIV handles (quick win)
- Pros: Fast to implement using native pointer events and CSS.
- Cons: Less crisp vector visuals, potential alignment edge cases during CSS transitions.
- Effort: ~1 day prototype.

Recommendation: Start with Option A (SVG overlay) for fastest development and clean visuals. Use the existing `exportFrameCanvas` to draw the dim/backdrop and use SVG for handles and interactions. If tighter pixel alignment is later required, migrate to a single-canvas approach.

Key behaviors to implement:
- Drag corner/edge handles to resize; drag inside rectangle to pan the crop.
- Aspect-lock toggle (square default for export) and snap-to-center / snap-to-edges.
- `fitToCrop()` camera action to reframe the model to fill the crop area.
- Persist crop rectangle in settings and include in exported frames.

## Ruler / measurement — refinement & options

(Existing roadmap item #1) — make this the next development priority.

### Implemented: HUD badge (v1.3.0)
W · D · H dimensions displayed as a pill badge at the top of the canvas. Always visible when a model is loaded. Numbers read from the STL bounding box in slicer convention (x=W, y=D, z=H).

### Next: 3D ruler lines in the viewport
Draw three ruler lines directly in the 3D scene — one per axis — aligned to the bounding box of the model. Each line shows the same W, D, H value as the HUD badge but as a visual reference at the actual scale of the model.

Design notes:
- Render as `THREE.Line` objects (or `LineSegments`) using a fixed thin material; drawn outside the model's bounding box so they don't overlap the geometry.
- End-caps or tick marks at each end; label positioned near the midpoint of each line.
- Labels: use HTML `<div>` elements positioned via `camera.project()` world-to-screen each frame (same approach used for CSS3DRenderer labels in Three.js examples). This avoids needing a separate font atlas.
- Color-coded per axis (W = red-ish, D = green-ish, H = blue-ish) or a unified neutral style — decide during implementation.
- Visibility tied to the existing HUD badge; toggling the badge on/off also toggles the 3D lines.
- No interaction required initially (display-only).
- Effort: ~1–2 days.

Options:

Option 1 — Axis-aligned bounding-box ruler (quick win)
- Compute model bounding box in world units; show dimension handles, tick marks and labels along box extents; support snapping & grid.
- Pros: Robust and simple; no raycast edge cases.
- Cons: Not a freehand point-to-point measurement.
- Effort: ~1–2 days to implement a useful UI + labels.

Option 2 — Point-to-point measurement via raycast (recommended long-term)
- User clicks two points on the mesh; perform raycasts to get world points; compute and display distance in mm with leader lines and arrowheads. Live preview while dragging.
- Pros: Flexible and precise for arbitrary measurements.
- Cons: Requires robust hit-testing and smoothing for thin or high-poly geometry.
- Effort: Prototype ~3–5 days; polish longer for snapping/vertex selection.

Option 3 — Workplane grid + ruler overlay (alternative)
- Provide a planar grid with ruler markings and snapping; measurements are along grid axes.
- Pros: Familiar to CAD users; good for planar/orthographic measurements.
- Cons: Limited to planar measures and requires explicit workplane control.

Recommendation: Implement Option 1 first (bounding-box ruler) to deliver immediate value quickly. Follow with Option 2 as an advanced measurement mode for power users.

---

## Needs design decision

6. Multiple STLs at once with positioning options
   - Support loading more than one STL simultaneously. Provide basic positioning (translate, rotate per-model) and a re-ordering UI (drag-to-reorder stack).

15. Benchy reset / Replace-STL UX change
   - Current behavior: clicking the "X" next to the filename resets the scene to Benchy (demo model). This is discoverable but also surprising and destructive when users expect the filename X to simply remove or replace the current model.
   - Change requested: move the Benchy reset out of the inline filename control and into the Replace / Drag-and-Drop overlay (or a dedicated, less-prominent "Load Benchy" quick action). The filename X should instead behave as a simple remove/clear or replace trigger and not auto-load Benchy.
   - Rationale: when adding multi-part / multi-color workflows, a destructive inline reset can accidentally discard parts or per-part materials. Keeping Benchy as an explicit quick-load in the import overlay or a small utility menu reduces accidental data loss and centralizes demo-model actions.
   - Implementation notes:
     - Update the Replace STL overlay to include a clear "Reset to Benchy" control and a separate "Cancel" action.
     - Change the filename-line X button to: (A) open the Replace overlay, or (B) remove the current model from the scene (show a confirmation if unsaved changes or multiple parts exist).
     - Audit any code paths that assume the X triggers a Benchy load (tests, telemetry) and update accordingly.
     - Add a small UI affordance in the sidebar or top bar labeled "Load Benchy" (optional) for power users; keep it intentionally less prominent than an inline destructive control.


7. Dedicated Benchy button
   - Add a dedicated "Load Benchy" quick-load button so the test model can always be recalled in one click.

8. New texture / reconsider Flat shading
   - Add a new shading style (e.g. Matcap, Toon, or Rim-light). Consider replacing Flat since it provides limited visual value.

9. Slider for Texture intensity (Light)
   - Expose an intensity slider for the texture/lighting preset so users can dial in exactly how bright or contrasty the shading appears.

10. Advanced export toggle
    - Show a simple "Advanced" toggle in the export section. When off, hide all custom export options and use default presets. When on, reveal the full controls (quality, loops, dither, etc.).

11. Time-based rotation speed
    - Rethink the speed control: instead of a multiplier (1x, 2x...), express speed as seconds per full rotation (e.g. "8 s / rev"). Choose a new, slightly faster default. Update the slider ticks and value display accordingly.

12. Per-section reset buttons; remove global reset
    - Each control box gets its own reset icon in the upper-right corner. The global "Reset Settings" button in the sidebar header is removed.

13. Watermark toggle
    - Add an option to overlay a small, semi-transparent watermark (e.g. "made with Rotater") on exported GIF / MP4 / images.

14. Filename label in export
    - Option to include the STL filename (or a user-editable text field) as a text overlay or appended label in the exported image/animation.

---

## Done

- ~~Maintain scale when replacing models~~ ✓
- ~~Expand preview — hide/tuck the controls sidebar~~ ✓
- ~~More pronounced export progress with progress bar~~ ✓
- ~~Spin direction toggle (CW / CCW)~~ ✓
- ~~"Rotater_" prefix on exported filenames~~ ✓
- ~~Quality preset labels: Low / Medium / High~~ ✓
- ~~Save filename with settings (mode + quality + modifiers)~~ ✓

- **v1.7.x fixes & UI improvements** — recent release(s) completed several Rotater items:
   - GIF dither crash fix and transparent GIF palette fix (no blank GIFs)
   - Dither and transparent GIF encoding performance improvements
   - MP4 H.264 level fix for high-quality 1080p exports
   - Crop-mode redesigned as a modal overlay with Cancel / Keep actions
   - Unified transparent-background checkbox and transparent preview support
   - Fixed Reset Settings empty-page flash and improved reset UX
   - Fixed Level-and-reframe azimuth and stale-zoom issues; tightened default framing

---

_Last updated: April 2026_

## Preset gallery & Surface-Finish — design + built-in presets

Decision: implement Presets as Shortcuts (Option A — non-breaking, recommended). A preset card applies both a model color and a texture/shader (plus optional visual params). Users can still tweak Color and Texture after applying a preset; any manual changes set the state to "Custom" and deselect the builtin preset.

- Persistence: built-in presets are shipped with the app. User-saved presets persist to `localStorage` (guest mode).
- Export settings: presets do NOT change export format or quality. Default export quality should be set to **High** globally.
- Surface Finish: introduce a high-level "Surface Finish" control with discrete snap points to reduce complexity:
   - High Gloss (gl ≈ 1.0)
   - Medium Gloss (gl ≈ 0.6)
   - Low Gloss (gl ≈ 0.3)
   - Matte (gl ≈ 0.0)
   - Transparent/Glass — handled by a shader (sh=glass) + transparency flag (et=1).

Built-in preset gallery (preview URLs for local testing)
- Notes: preview URLs use the local dev server `http://localhost:8765/` and include `eq=high` for preview fidelity. These example URLs include visual params used by current exporter; actual preset application in-app will only set color, texture, and finish-related params.

| Preset | Color (hex) | Shader | Finish | Preview URL |
|---|---:|---|---|---|
| Chrome | d9d9d9 | metallic | High Gloss | http://localhost:8765/?c=d9d9d9&b=8d8ab7&sh=metallic&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=1&ef=png&eq=high&ed=square&et=1&gd=0&jq=90&tto=1&tl=60&tc=200&thi=250&ts=100&tsa=60&tll=1&tsh=115&tmr=0&tmm=100&tme=200&tpr=100&tpe=125&tcr=100&tce=0&ecd=95.7923&ece=0.0000 |
| Chocolate | 4e300d | clay | Low Gloss | http://localhost:8765/?c=4e300d&b=8d8ab7&sh=clay&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=0.3&ef=png&eq=high&ed=square&et=0&gd=0&jq=90&tto=0&tl=75&tc=200&thi=250&ts=100&tsa=60&tll=1&tsh=115&tmr=0&tmm=100&tme=200&tpr=100&tpe=125&tcr=100&tce=200&ecd=93.5470&ece=0.0000 |
| Ceramic | fff8f0 | clay | Low Gloss | http://localhost:8765/?c=fff8f0&b=8d8ab7&sh=clay&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=0.3&ef=png&eq=high&ed=square&et=0&gd=0&jq=90&tto=0&tl=75&tc=200&thi=250&ts=100&tsa=60&tll=1&tsh=115&tpr=100&tpe=125&tcr=100&tce=200&ecd=93.5470&ece=0.0000 |
| Ink | 0a0a0a | metallic | High Gloss (dark) | http://localhost:8765/?c=0a0a0a&b=8d8ab7&sh=metallic&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=1&ef=png&eq=high&ed=square&et=1&gd=0&jq=90&tto=1&tl=60&tc=200&thi=250&ts=100&tsa=60&tll=1&tsh=115&tmr=0&tmm=100&tme=200&tpr=100&tpe=125&tcr=100&tce=0&ecd=95.7923&ece=0.0000 |
| Earth (Matte Green) | 2e8b57 | clay | Matte | http://localhost:8765/?c=2e8b57&b=8d8ab7&sh=clay&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=0.0&ef=png&eq=high&ed=square&et=0&gd=0&jq=90 |
| MCM / Retro Orange | ff6f00 | metallic | Medium Gloss | http://localhost:8765/?c=ff6f00&b=8d8ab7&sh=metallic&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=0.6&ef=png&eq=high&ed=square&et=1&gd=0&jq=90 |
| 90's Purple | 5b2b8a | clay | Low/Medium | http://localhost:8765/?c=5b2b8a&b=8d8ab7&sh=clay&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=0.4&ef=png&eq=high&ed=square&et=0&gd=0&jq=90 |
| Neon Yellow | ffff00 | metallic | High Gloss (neon) | http://localhost:8765/?c=ffff00&b=8d8ab7&sh=metallic&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=1&ef=png&eq=high&ed=square&et=1&gd=0&jq=90 |
| Glass (transparent) | e6f7ff | glass | Transparent / High Gloss | http://localhost:8765/?c=e6f7ff&b=8d8ab7&sh=glass&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=1&ef=png&eq=high&ed=square&et=1&gd=0&jq=90&transparent=1 |
| Paper (matte white) | ffffff | clay | Matte | http://localhost:8765/?c=ffffff&b=8d8ab7&sh=clay&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=0.0&ef=png&eq=high&ed=square&et=0&gd=0&jq=90 |
| Firetruck (Glossy Red) | ff0000 | metallic | High Gloss | http://localhost:8765/?c=ff0000&b=8d8ab7&sh=metallic&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=1&ef=png&eq=high&ed=square&et=1&gd=0&jq=90 |
| Gumball (Matte Pink) | ff9dbb | clay | Matte | http://localhost:8765/?c=ff9dbb&b=8d8ab7&sh=clay&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=0.0&ef=png&eq=high&ed=square&et=0&gd=0&jq=90 |
| Gold | ffd700 | metallic | High Gloss (metallic) | http://localhost:8765/?c=ffd700&b=8d8ab7&sh=metallic&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=1&ef=png&eq=high&ed=square&et=1&gd=0&jq=90 |
| Platinum | e6e6e6 | metallic | High Gloss (metallic) | http://localhost:8765/?c=e6e6e6&b=8d8ab7&sh=metallic&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=1&ef=png&eq=high&ed=square&et=1&gd=0&jq=90 |
| Blue | 3b82f6 | metallic | Medium Gloss | http://localhost:8765/?c=3b82f6&b=8d8ab7&sh=metallic&rm=spin&sp=3&tr=360&wsr=360&sd=1&gl=0.6&ef=png&eq=high&ed=square&et=1&gd=0&jq=90 |

Implementation notes:
- Thumbnails: generate small 3D mini-renders (circle tokens) using the same render pipeline as the main preview; cache as data-URLs shipped with the builtins.
- UI: gallery grid with keyboard focus and ARIA labels; selecting a preset applies color+shader and marks the preset active. Manual edits convert to "Custom" and show a "Save preset" CTA.
- Surface Finish: replace many fine-grain sliders with a single discrete control exposing the four finish snap points (plus a "Custom" mode if the user wants fine control).
- Transparent: treat as a shader (sh=glass) + an "alpha" flag. Provide a small guidance tooltip describing that "Glass" can change export behavior (background transparency, compositing).

## Multi-Color Models — roadmap

Goal: support models exported as multiple parts (from CAD) that preserve their transforms so they load as one multi-part object. Users can style each part independently with presets.

High-level design:
- Import: accept multi-part STL/OBJ/GLB exported as a single file containing multiple meshes, or accept multiple files dropped together (detect matching transforms). Do NOT attempt automatic assembly; rely on parts exported together to preserve relative placement.
- Scene model: `scene.parts = [{ id, name, geometryRef, transform, material }]`. Each part keeps its local transform and material reference.
- UI: `Parts` panel (left or right) showing thumbnails and part names. Selecting a part focuses it in the viewport and exposes per-part Material/Color/Preset controls. Support multi-select + "apply to all".
- Presets: use the same Preset Gallery per-part (apply color+shader). Allow copying a material from one part and pasting to another.
- Export: options to export single combined file (original geometry with per-part colors baked if supported), or export separate files per part. Document limitations (baking vs. per-part meshes).

Next steps / milestones:
1. Add Preset Gallery UI component, wire to color+texture state (low-risk).
2. Add localStorage-based preset saving & listing.
3. Add Surface-Finish control with snap presets and optional advanced sliders.
4. Implement parts panel and per-part material assignment; support loading multi-part STLs.
5. Add "Save as preset" modal, thumbnail generation, and edge-case QA (accessibility, export parity).

UX decisions pending:
- Confirm whether the "Parts" panel should be collapsed by default on single-part imports.
- Confirm desired default behavior for glass transparency in exported PNG/PNG sequence (flatten vs keep alpha).

_Roadmap updated with presets + multi-color plan — default export quality set to High._
