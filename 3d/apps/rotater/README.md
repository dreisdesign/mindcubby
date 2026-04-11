# Rotater

Rotate an STL model 360° and export as an animated **GIF** or **MP4** video.

Available as both a **web app** (Three.js, runs in the browser) and a **Python CLI** script.

---

## Web App

Open `index.html` via a local server (ES modules require `http://`, not `file://`):

```bash
python3 -m http.server 8765
# then open http://localhost:8765
```

- Drag and drop any STL file onto the page, or use the Select button
- Live 3D preview — orbit, zoom, pan; pause/resume rotation
- STL file and all settings persist across page refreshes (no re-upload needed)
- Controls: color, background, shading, speed, elevation
- Export as **GIF** or **MP4 video** (all client-side, STL never leaves your machine)
- Requires an internet connection on first load to fetch Three.js and gifenc from CDN (cached after that)

---

## Python CLI

## Requirements

```bash
pip3 install numpy-stl matplotlib pillow
```

For MP4/video output, also install **ffmpeg** (must be on your PATH):
```bash
brew install ffmpeg
```

## Usage

```bash
python3 stl_rotate.py <path/to/model.stl> [options]
```

### Examples

```bash
# Default: metallic shading, 72-frame GIF saved next to the STL
python3 stl_rotate.py model.stl

# Silver metallic look (Preview-style)
python3 stl_rotate.py model.stl --color '#c0c0c0' --bg '#111111' --shading metallic

# Gold with a higher camera angle
python3 stl_rotate.py model.stl --color gold --bg black --elevation 45

# Smooth 120-frame GIF at 30 fps
python3 stl_rotate.py model.stl --frames 120 --fps 30 --out-file spin.gif

# Soft diffuse shading (less shiny)
python3 stl_rotate.py model.stl --shading phong --color '#7ec8e3'

# Flat solid colour, no lighting
python3 stl_rotate.py model.stl --shading flat --color orange

# MP4 video (requires ffmpeg)
python3 stl_rotate.py model.stl --output video --out-file model_spin.mp4
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--output` | `gif` | Output format: `gif` or `video` (MP4) |
| `--out-file` | auto | Output path; auto-derived as `<input>_rotate.gif/.mp4` if omitted |
| `--frames` | `144` | Total frames for one full 360° rotation |
| `--fps` | `24` | Playback speed (frames per second) |
| `--elevation` | `28` | Camera elevation angle in degrees |
| `--color` | `#aab8c8` | Model face color (any [matplotlib color](https://matplotlib.org/stable/gallery/color/named_colors.html)) |
| `--bg` | `#0a0a12` | Background color |
| `--shading` | `metallic` | Lighting model: `flat` (solid), `phong` (diffuse+specular), `metallic` (shiny, Preview-style) |
| `--title` | _(none)_ | Optional text title overlaid on the animation |
