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

---

_Last updated: April 2026_
