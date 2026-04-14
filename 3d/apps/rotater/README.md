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
- Click **☰ → Reset to Benchy** to reload the built-in 3D Benchy demo (also clears the saved model so a refresh stays on Benchy)

### Viewer controls

- **Drag** to orbit · **Scroll** to zoom · **Right-drag** to pan
- **Pause/Resume** button (⏸/▶ at lower-left of viewer) or **Spacebar** to toggle
- **Front / Back / Left / Right / Top / Bottom** face buttons snap the model to that face view

### Appearance

| Control | Description |
|---|---|
| Colors → Model | Model face color |
| Colors → BG | Background color |
| Shading → Flat | Solid unlit color |
| Shading → Phong | PBR diffuse (non-metal) — surface detail readable on any albedo including black/white |
| Shading → Metal | PBR metallic with environment reflections |

Shading preview cards use fixed blueberry palette colors (matching the app's default model and background colors) so the difference between shading modes is always clearly visible.

### Motion controls

| Control | Description |
|---|---|
| Rotation | Off / Spin / Tilt / Swing (see below) |
| Speed | Playback speed: 0.5× – 4× |
| Tilt | Camera elevation: 0° (flat side-on) → Top (directly above). Hidden when Tilt rotation is active (orbit controls elevation instead) |
| Range | Oscillation amplitude — 10°–50° for Tilt; 0°–180° for Swing |

**Rotation modes:**

| Mode | Behaviour |
|---|---|
| Off | No rotation; GIF/MP4 export disabled |
| Spin | Continuous 360° orbit around the Y axis |
| Tilt | Elevation oscillates up/down from wherever you orbit to; azimuth freely orbitable |
| Swing | Azimuth oscillates left/right through a partial arc (Range sets the half-angle) |

### Export

Each format appears as a row showing the download button, estimated file size, and (for GIF) a Loop toggle:

| Button | Output |
|---|---|
| GIF | Animated GIF — one full motion cycle |
| Loop toggle | Whether the GIF loops; does not affect MP4 |
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
