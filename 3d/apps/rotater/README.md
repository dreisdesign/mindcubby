# Rotater

View and export rotating 3D STL models as animated GIF, MP4 video, or PNG snapshot — entirely in the browser. Made by [Mind Cubby](https://www.printables.com/@MindCubby_3731028/models).

**Version 1.7.2** · April 23, 2026

---

## Web App

Open `index.html` via a local server (ES modules require `http://`, not `file://`):

```bash
python3 -m http.server 8765
# then open http://localhost:8765
```

### Loading a model

- Drag and drop any STL file onto the page, or click **Replace STL**
- The model and all settings persist across page refreshes — no re-upload needed
- The filename chip (top-right of canvas) shows the active file
  - Click **×** while showing the demo to open the file picker
  - Click **×** while showing your own model to reset back to the demo (3D Benchy)
- **Reset Settings** (sidebar header, left) clears all saved settings and restores defaults
- **Copy Link** (sidebar header, right) copies a shareable URL with current settings baked in

### Viewer controls

- **Drag** to orbit · **Scroll** to zoom · **Right-drag** to pan
- **Spacebar** — pause / resume rotation
- **D-pad** (bottom-center of viewer) — orbit the camera in 45° snapped increments
  - Arrow keys (←↑↓→) do the same thing from the keyboard
  - Center button of the D-pad pauses / resumes (⏸/▶)
- **Reset camera** button (⟳, D-pad center) — recenters the model in the export frame
- **Crop button** (⬜, bottom-right of viewer) — enters crop mode
  - The viewer dims and blurs outside the crop frame; all other controls hide
  - **Cancel** (ghost button, bottom-center) — discards changes and exits crop mode (also Esc)
  - **Keep** (purple button, bottom-center) — saves the current framing and exits crop mode (also Enter)
- **Dark mode toggle** (bottom-left of viewer)

### Export preview overlay

A dashed overlay on the viewer always shows exactly which square region will be captured. Enabling the frame toggle adds a solid dim vignette outside the crop area for a clearer preview. The **⟳ reset** button always recenters the model within this square frame.

### Appearance

Sidebar order: **Color → Texture → Animation → Export**

| Control | Description |
|---|---|
| Color → Model | Model face color (click swatch to open color picker) |
| Color → BG | Background color (click swatch to open color picker) |
| Texture → Flat | Solid unlit color |
| Texture → Phong | PBR diffuse (non-metal) |
| Texture → Metal | PBR metallic with environment reflections |

### Animation controls

| Control | Description |
|---|---|
| Animation toggle | Enable / disable all animation; turning off also pauses the viewer |
| **Spin** | Object rotates continuously around its vertical axis (like a spinning top). Camera can orbit freely. Range slider < 360° makes it oscillate side to side instead of spinning fully. |
| **Tilt** | Object rocks on its X axis (like a juggled bowling pin). Camera stays put. Range controls how far it tilts. |
| **Wobble** | Spin + Tilt combined — continuous spin with a simultaneous tilt oscillation. |
| Speed | Playback speed: 0.5× · 1× · 2× · 3× · 5× |
| Range | Oscillation amplitude for Tilt (10°–50°) and arc width for Spin (45°–360°); controls tilt depth for Wobble |

### Export preview

The sidebar **Preview** thumbnail always shows exactly what will be exported:

- **Default** — preview uses a stored export-frame distance (fit-to-model). Viewport zoom is cosmetic only and does not affect the exported output.
- **Crop mode** (crop icon, bottom-right of viewer) — enables zoom-to-export. Zooming the viewport while crop mode is active directly controls the export framing; the preview updates in real time.
  - **Cancel** discards crop edits; **Keep** commits the framing for future exports

### Export

The Export section uses a **Format** dropdown and a **Quality** dropdown. Selecting a format reveals its specific options. A live **Preview** thumbnail shows the export frame crop in real time.

| Format | Output |
|---|---|
| Animated GIF | Looping GIF — one full motion cycle at the selected quality |
| MP4 Video | H.264 MP4 — one full motion cycle (requires Chrome / Edge / Safari 16.4+) |
| PNG Image | Still image of the current view at screen resolution |
| JPEG Image | Still image with adjustable compression |

#### GIF options

| Control | Description |
|---|---|
| Loop | GIF loops forever (default: on) |
| Dither | Floyd-Steinberg dithering for smoother gradients |
| Transparent | Check for transparent background (no fill) |

#### PNG options

| Control | Description |
|---|---|
| Transparent | Check for transparent background (alpha channel) |

#### Export quality settings

| Level | Resolution | FPS | Notes |
|---|---|---|---|
| Low | 480 px | 15 fps | Smallest file |
| Medium | 720 px | 24 fps | Default |
| High | 1080 px | 30 fps | Largest file |

All export is completely client-side — your STL file never leaves your machine.

---

## Python CLI

### Requirements

```bash
pip3 install numpy-stl matplotlib pillow
```

For MP4 output, also install **ffmpeg** (must be on your PATH):
```bash
brew install ffmpeg
```

### Usage

```bash
python3 stl_rotate.py <path/to/model.stl> [options]
```

### Examples

```bash
# Default: metallic shading, 72-frame GIF saved next to the STL
python3 stl_rotate.py model.stl

# Silver metallic look
python3 stl_rotate.py model.stl --color '#c0c0c0' --bg '#111111' --shading metallic

# Gold with a higher camera angle
python3 stl_rotate.py model.stl --color gold --bg black --elevation 45

# Smooth 120-frame GIF at 30 fps
python3 stl_rotate.py model.stl --frames 120 --fps 30 --out-file spin.gif

# Flat solid colour, no lighting
python3 stl_rotate.py model.stl --shading flat --color orange

# MP4 video (requires ffmpeg)
python3 stl_rotate.py model.stl --output video --out-file model_spin.mp4
```

### Options

| Flag | Default | Description |
|---|---|---|
| `--output` | `gif` | Output format: `gif` or `video` (MP4) |
| `--out-file` | auto | Output path; auto-derived as `<input>_rotate.gif/.mp4` if omitted |
| `--frames` | `144` | Total frames for one full 360° rotation |
| `--fps` | `24` | Playback speed (frames per second) |
| `--elevation` | `28` | Camera elevation angle in degrees |
| `--color` | `#aab8c8` | Model face color (any [matplotlib color](https://matplotlib.org/stable/gallery/color/named_colors.html)) |
| `--bg` | `#0a0a12` | Background color |
| `--shading` | `metallic` | Lighting model: `flat`, `phong`, or `metallic` |
| `--title` | _(none)_ | Optional text title overlaid on the animation |
