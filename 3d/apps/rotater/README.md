# Rotater

View and export rotating 3D STL models as animated GIF, MP4 video, or PNG snapshot — entirely in the browser. Made by [Mind Cubby](https://www.printables.com/@MindCubby_3731028/models).

**Version 1.0.0** · April 16, 2026

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
- **Reset camera** button (⟳, bottom-right of viewer) — returns camera to default position
- **Dark mode toggle** (bottom-left of viewer)

### Export preview overlay

A semi-transparent dark overlay on the sides of the viewer shows exactly which square region (720×720 px) will be captured in GIF and MP4 exports. The model is sized to fill this square region by default.

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
| Speed | Playback speed: 0.5× – 4× |
| Range | Oscillation amplitude for Tilt (10°–50°) and arc width for Spin (45°–360°); also controls tilt depth for Wobble |

### Export

| Button | Output |
|---|---|
| GIF | Animated GIF — one full motion cycle, 720×720 px |
| Loop toggle | Whether the GIF loops forever (default: on) |
| MP4 | H.264 MP4 video — one full motion cycle, 720×720 px (requires Chrome/Edge/Safari 16.4+) |
| PNG | Still image of the current view at screen resolution |

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
