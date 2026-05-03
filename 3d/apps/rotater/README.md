# Rotater

View and export rotating 3D STL models as animated GIF, MP4 video, or PNG snapshot — entirely in the browser. Made by [Mind Cubby](https://www.printables.com/@MindCubby_3731028/models).

**Version 1.8.5** · May 3, 2026

---

## Web App

Open `index.html` via a local server (ES modules require `http://`, not `file://`):

```bash
python3 -m http.server 8765
# then open http://localhost:8765
```

### Applying Default Settings
If you want to spin up your own instance and override the default colors, camera angles, speeds, or lighting without modifying the codebase, download a package from the app header and copy the `shareURL` value from `package.json`, then paste that URL parameter string inside `script.js` near the top:

```javascript
const DEFAULT_SETTINGS_URL = '...'; // Paste your copied URL here
```

### Loading a model

- Drag and drop any STL file onto the page, or click **Upload STL**
- Multi-part import: select or drop multiple STL files at once to load them as one aligned object (keeps original CAD offsets for multi-color part stacks)
- Multi-part editing: use **Part Color Target** in the Model card to choose which part you are editing
- Model preset cards now apply on click only
- The model and all settings persist across page refreshes — no re-upload needed
- The filename chip (top-right of canvas) shows the active file
  - For multipart models, click the chevron to expand all part filenames
  - Each expanded row supports **Replace** for an individual part and **×** to remove that part (when 2+ parts are loaded)
  - Click **×** while showing the demo to open the file picker
  - Click **×** while showing your own model to reset back to the demo (3D Benchy)
- **Export** (sidebar header) opens the Export modal
- **Download Package** (inside the Export modal) saves a single ZIP package containing `package.json` plus the original STL file(s)
- **Load 3D Benchy** is available in App Settings for a quick test-model reset

See also: [_IGNORE/ROADMAP.md](_IGNORE/ROADMAP.md)

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

Sidebar tabs: **Theme → Effects**

- **Theme** includes model + background controls
- **Effects** combines lighting controls and animation controls in one panel
- **Export** is now a modal opened from the header button
- **Download Package** lives inside the Export modal and exports a reusable ZIP package for future import/export workflows
- The Theme sidebar uses unified slider styling and shared snap behavior across Shade, Sheen, Contrast, and Highlights

When a multi-part model is loaded:

- **Model** controls are part-aware (color, shade/tone, shading mode, and finish/reflection values are stored per selected part)
- **Model presets** are model-only (they no longer force background or lighting changes)
- **Background → Model** preset can follow a chosen part via **Model Sync Source** (defaults to Part 1)
- The part dropdowns only appear when they are contextually needed: multipart + Model Sync background

| Control | Description |
|---|---|
| Color → Model | Model face color (click swatch to open color picker) |
| Color → BG | Background color (click swatch to open color picker) |
| Build Plate | Solid slicer-style floor plane beneath the model (toggle in Background card) |
| Background Texture | Optional subtle checker texture on the Build Plate with a single strength slider |
| Texture → Clay | Matte clay-style shading |
| Texture → Phong | PBR diffuse (non-metal) |
| Texture → Metal | PBR metallic with environment reflections |

Texture tuning (tune icon in the Texture card) includes:

- Light
- Contrast
- Highlights
- Shadows (strength)
- Light Source (shadow direction)
- Light Height (shadow length/angle)
- Roughness / Reflection (all modes)
- Metalness (Metal mode only)

Finish strength controls are shown only when **Fine tuning for precise control** is enabled in App Settings.

On first visit after texture updates, the tune icon shows a small **NEW** badge with a quick hover/focus changelog popover. Dismiss with **×**.

### Effects: Animation controls

| Control | Description |
|---|---|
| Animation toggle | Enable / disable all animation; turning off also pauses the viewer |
| **Spin** | Object rotates continuously around its vertical axis (like a spinning top). Camera can orbit freely. Range slider < 360° makes it oscillate side to side instead of spinning fully. |
| **Tilt** | Object rocks on its X axis (like a juggled bowling pin). Camera stays put. Range controls how far it tilts. |
| **Wobble** | Spin + Tilt combined — continuous spin with a simultaneous tilt oscillation. |
| Speed | Playback speed in seconds per full rotation: 5s · 10s · 15s · 20s · 25s · 30s |
| Range | Oscillation amplitude for Tilt (10°–50°) and arc width for Spin (45°–360°); controls tilt depth for Wobble |

### Export preview

The sidebar **Preview** thumbnail always shows exactly what will be exported:

- **Default** — preview uses a stored export-frame distance (fit-to-model). Viewport zoom is cosmetic only and does not affect the exported output.
- **Crop mode** (crop icon, bottom-right of viewer) — enables zoom-to-export. Zooming the viewport while crop mode is active directly controls the export framing; the preview updates in real time.
  - **Cancel** discards crop edits; **Keep** commits the framing for future exports

### Export

The Export section uses a **Format** dropdown and a **Quality** dropdown. Selecting a format reveals its specific options. A live **Preview** thumbnail shows the export frame crop in real time.

### Download package

The **Download Package** action inside the Export modal saves one ZIP package that contains:

- `package.json` with the current Rotater settings, part names, selected part, and share URL
- the currently loaded STL file, or all STL parts for multipart models

This package is designed to support a future import flow.

| Format | Output |
|---|---|
| Animated GIF | Looping GIF — one full motion cycle at the selected quality |
| MP4 Video | H.264 MP4 — one full motion cycle (requires Chrome / Edge / Safari 16.4+) |
| PNG Image | Still image rendered at selected dimensions and quality size |
| JPEG Image | Still image rendered at selected dimensions and quality size, with adjustable compression |

#### PNG/JPEG dimensions

Still-image formats (PNG/JPEG) support these built-in aspect presets:

- 1:1 (Square)
- 4:5 (Portrait)
- 9:16 (Story)
- 16:9 (Landscape)
- 4:3 (Landscape)

The Preview thumbnail and estimate label update immediately when you change format, quality, or dimensions.

#### Export quick options (all formats)

| Control | Description |
|---|---|
| Background | Toggle background color on/off for export preview and compatible outputs |
| Grid | Toggle ruler grid visibility in export preview/output |

#### GIF options

| Control | Description |
|---|---|
| Loop | GIF loops forever (default: on) |
| Dither | Floyd-Steinberg dithering for smoother gradients |
| Transparent | Controlled by the shared Background toggle |

#### PNG options

| Control | Description |
|---|---|
| Transparent | Controlled by the shared Background toggle |

#### Export quality settings

| Level | Resolution | FPS | Notes |
|---|---|---|---|
| Low | 480 px short edge | 15 fps | Smallest file |
| Medium | 1080 px short edge | 24 fps | Default |
| High | 2048 px short edge | 30 fps | Largest file |

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
