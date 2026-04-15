# Rotater

View and export rotating 3D STL models as animated GIF, MP4 video, or PNG snapshot — entirely in the browser.

---

## Web App

Open `index.html` via a local server (ES modules require `http://`, not `file://`):

```bash
python3 -m http.server 8765
# then open http://localhost:8765
```

### Loading a model

- Drag and drop any STL file onto the page, or click **Select STL**
- The model and all settings persist across page refreshes — no re-upload needed
- The filename chip (top-right of canvas) shows the active file; click **×** to reset to Benchy
- Click **Reset settings** (bottom-right of viewport) to clear saved settings and restore defaults

### Viewer controls

- **Drag** to orbit · **Scroll** to zoom · **Right-drag** to pan
- **Pause/Resume** button (⏸/▶ at lower-left of viewer) or **Spacebar** to toggle
- **Front / Back / Left / Right / Top / Bottom** face buttons snap the model to that face view

### Appearance

Sidebar order: **Color → Texture → Animation → Export**

| Control | Description |
|---|---|
| Color → Model | Model face color |
| Color → BG | Background color |
| Texture → Flat | Solid unlit color |
| Texture → Phong | PBR diffuse (non-metal) |
| Texture → Metal | PBR metallic with environment reflections |

### Animation controls

| Control | Description |
|---|---|
| Animation toggle | Enable / disable all animation; turning off also pauses the viewer |
| Spin / Tilt / Swing | Animation mode — thumbnail cards animate on hover |
| Speed | Playback speed: 0.5× – 4× |
| Tilt | Camera elevation: 0° (flat side-on) → Top (directly above). Hidden in Tilt mode |
| Range | Oscillation amplitude for Tilt and Swing modes |

### Export

| Button | Output |
|---|---|
| GIF | Animated GIF — one full motion cycle |
| Loop toggle | Whether the GIF loops forever (default: on) |
| MP4 | H.264 MP4 video — one full motion cycle (requires Chrome/Edge/Safari 16.4+) |
| PNG | Still image of the current view |

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
