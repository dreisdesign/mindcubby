# Rotater Roadmap

Planned improvements and design goals for the Rotater app.

---

## Ready to build

1. Ruler / grid to see the scale of a model
   - Add an on-screen ruler or grid overlay with metric/imperial markings and an optional snapping guide so users can quickly judge model scale.

2. When exporting show the animation
   - Display a live preview (or captured frame sequence) during export so users can confirm the motion before saving GIF/MP4.

3. Accurate preview of model in frame, while letting the background color "bleed" to fill the preview box
   - Ensure the model is correctly fitted and centered within the export square (720×720), while allowing the chosen background color to extend behind the model for a clean, polished look.

4. Textured background
   - Allow the user to choose a textured or patterned background (e.g. checkerboard, gradient, subtle noise) in addition to solid colors.

5. Build plate option
   - Add an optional build plate / platform grid beneath the model so it sits on a visible surface during preview and export.

---

## Crop (formerly 'Frame') — design notes

- Status: Ready to design
- Icon: `3d/apps/icons/crop.svg`
- Goal: Treat the export "frame" as a user-adjustable crop rectangle ("Crop"). Provide direct drag-to-resize and drag-to-move handles, aspect-lock, center/crop-fit actions, and keyboard nudges.

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

15. Save filename with settings (quality / preset)
    - Allow exported filenames to encode chosen export settings (format, quality/preset, background, crop). Provide user options:
       - Append a short settings tag (e.g., `model_medium.gif`) or a timestamped template (e.g., `{name}_{preset}_{YYYYMMDD}`).
       - Persist a per-file saved-settings profile so reloading the same STL restores its last export preset.
       - Provide an explicit "Include settings in filename" toggle and a small template editor for power users.
    - Consider privacy: avoid exposing full user file paths in copied share links or autogenerated names.

---

## Done

- ~~Maintain scale when replacing models~~ ✓
- ~~Expand preview — hide/tuck the controls sidebar~~ ✓
- ~~More pronounced export progress with progress bar~~ ✓
- ~~Spin direction toggle (CW / CCW)~~ ✓
- ~~"Rotater_" prefix on exported filenames~~ ✓
- ~~Quality preset labels: Low / Medium / High~~ ✓

---

_Last updated: April 2026_
