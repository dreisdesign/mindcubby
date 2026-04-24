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
