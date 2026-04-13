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
- Click **☰ → Reset to Benchy** to reload the built-in 3D Benchy demo model

### Viewer controls

- **Drag** to orbit · **Scroll** to zoom · **Right-drag** to pan
- **Pause/Resume** button (or re-click the active Rotation option) to pause/resume animation
- **Reset camera** button resets to the default view angle

### Appearance

| Control | Description |
|---|---|
| Colors → Model | Model face color |
| Colors → BG | Background color |
| Shading → Flat | Solid unlit color |
| Shading → Phong | Diffuse + specular lighting |
| Shading → Metal | Metallic/PBR sheen |

Shading preview cards update live to reflect the current model and background colors.

### Motion controls

| Control | Description |
|---|---|
| Rotation | Off / Spin / Tilt / Wobble / Swing (see below) |
| Speed | Playback speed: 0.5× – 4× |
| Tilt | Camera elevation: 0° (flat side-on) → Top (directly above) |
| Range | Oscillation arc for Tilt, Wobble, and Swing modes |

**Rotation modes:**

| Mode | Behaviour |
|---|---|
| Off | No rotation; GIF/MP4 export disabled |
| Spin | Continuous 360° orbit around the Y axis |
| Tilt | Camera elevation oscillates up/down while azimuth stays fixed |
| Wobble | Combines full 360° spin with simultaneous elevation oscillation |
| Swing | Azimuth oscillates left/right (partial arc) instead of full spin |

### Export

| Button | Output |
|---|---|
| Download GIF | Animated GIF — one full motion cycle |
| Loop toggle | Whether the GIF loops; does not affect MP4 |
| Download MP4 | H.264 MP4 video — one full motion cycle (requires Chrome/Edge/Safari 16.4+) |
| Download PNG | Still image of the current view |

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
