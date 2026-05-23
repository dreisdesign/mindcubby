# Rotater

View and export rotating 3D STL models as animated GIF, MP4 video, or PNG snapshot — entirely in the browser. Made by [Mind Cubby](https://www.printables.com/@MindCubby_3731028/models).

**Version (current workspace): 2.2.22**

Current development note: Model quick presets now use authoritative config-driven tone defaults via `presetShadeDefaults.model` in `color-rules.json`, so model preset shade positions can be controlled centrally (overriding preset URL `op` when configured). See [_IGNORE/ROADMAP.md](_IGNORE/ROADMAP.md) and [_IGNORE/Cleanup V3 - May 7 2026/cleanup-v3](_IGNORE/Cleanup%20V3%20-%20May%207%202026/cleanup-v3).

Note: `_IGNORE/ROADMAP.md` is now an open-items-only roadmap; completed work has been moved to `CHANGELOG.md` (see the Unreleased section).

Note: UI label update — The in-app `Export` panel label and quick-action buttons were renamed to `Share` on 2026-05-14 to better reflect link/copy semantics. The underlying export/share functionality (Copy Link, Save Project ZIP, format options) is unchanged.

## Refactor Progress (C1)

Refactor progress is tracked in [REFACTOR_PROGRESS.md](REFACTOR_PROGRESS.md).

Current extracted modules:

| Module | Responsibility | Status |
|---|---|---|
| [modules/menu-positioning.js](modules/menu-positioning.js) | Shared menu placement math for viewport/panel-aware positioning | Active |
| [modules/model-part-action-menus.js](modules/model-part-action-menus.js) | Model-part action menu close/reset and placement behavior | Active |
| [modules/orbit-frame-state.js](modules/orbit-frame-state.js) | Orbit frame-state helpers and camera orbit transform math | Active |
| [modules/viewport-performance.js](modules/viewport-performance.js) | Adaptive viewport quality and pixel-ratio helpers | Active |
| [modules/model-picker-controller.js](modules/model-picker-controller.js) | Controller helpers for selector/sync menu open-close behavior | Active |
| [modules/model-picker-floating.js](modules/model-picker-floating.js) | Floating model picker card positioning, persistence, and drag lifecycle helpers | Active |
| [modules/model-edit-commit.js](modules/model-edit-commit.js) | Deferred commit queues and requestAnimationFrame preview scheduling for model edit flows | Active |
| [modules/settings-url-sync.js](modules/settings-url-sync.js) | Debounced URL settings sync controller for save/flush timing behavior | Active |
| [modules/upload-action-controller.js](modules/upload-action-controller.js) | Upload flow action normalization plus pending-action and prompt resolver orchestration | Active |
| [modules/upload-choice-ui.js](modules/upload-choice-ui.js) | Upload-choice modal file-list rendering, prompt text sync, and local view-state helpers | Active |
| [modules/export-collapsed-confirm.js](modules/export-collapsed-confirm.js) | Collapsed-export confirm modal open/close resolver orchestration helpers | Active |
| [modules/export-collapsed-summary.js](modules/export-collapsed-summary.js) | Collapsed-export summary rendering and control binding/sync helpers | Active |
| [modules/export-labels.js](modules/export-labels.js) | Export format/quality/speed label and option-list composition helpers | Active |
| [modules/export-workspace.js](modules/export-workspace.js) | Export workspace active-state orchestration and transparency/open-close helpers | Active |
| [modules/export-transparency-sync.js](modules/export-transparency-sync.js) | Export transparency checkbox coupling and preview-sync orchestration helpers | Active |
| [modules/export-panel-state.js](modules/export-panel-state.js) | Export panel collapsed-state persistence/restore and toggle routing helpers | Active |
| [modules/export-motion-labels.js](modules/export-motion-labels.js) | Export motion duration/frame label and speed-option text composition helpers | Active |
| [modules/export-estimate.js](modules/export-estimate.js) | Export estimate button/title/text update orchestration helpers | Active |
| [modules/export-format-sync.js](modules/export-format-sync.js) | Export format tab/select synchronization and format-application orchestration helpers | Active |
| [modules/export-preview-details.js](modules/export-preview-details.js) | Export preview details toggle binding helpers for preview refresh and rail layout sync | Active |
| [modules/desktop-v2-rail-layout.js](modules/desktop-v2-rail-layout.js) | Desktop V2 effects rail sizing, RAF queueing, and resize observer lifecycle helpers | Active |
| [modules/export-preview-activity.js](modules/export-preview-activity.js) | Export preview active-state visibility guard helpers | Active |
| [modules/export-preview-scene-state.js](modules/export-preview-scene-state.js) | Export preview scene include/exclude and render-state restore orchestration helpers | Active |
| [modules/export-preview-timing.js](modules/export-preview-timing.js) | Export preview update timing and throttle gate helpers | Active |
| [modules/export-preview-transparency.js](modules/export-preview-transparency.js) | Export preview transparency derivation and preview-wrap class sync helpers | Active |
| [modules/export-preview-dimensions.js](modules/export-preview-dimensions.js) | Export preview size/scaling computation helpers for render target sizing | Active |
| [modules/export-preview-camera.js](modules/export-preview-camera.js) | Export preview camera setup and orbit-state application helpers | Active |
| [modules/export-preview-render-target.js](modules/export-preview-render-target.js) | Export preview render-target allocation/reuse and color-space setup helpers | Active |
| [modules/export-preview-readback.js](modules/export-preview-readback.js) | Export preview render-target pixel readback and row-flip imageData helpers | Active |
| [modules/export-preview-crop-overlay.js](modules/export-preview-crop-overlay.js) | Export preview crop matte and corner-mark overlay drawing helpers | Active |
| [modules/export-preview-refresh.js](modules/export-preview-refresh.js) | Export preview immediate + RAF refresh orchestration helpers | Active |
| [modules/export-preview-render-pass.js](modules/export-preview-render-pass.js) | Export preview render pass bind/render/unbind and scene-restore helpers | Active |
| [modules/export-preview-canvas-commit.js](modules/export-preview-canvas-commit.js) | Export preview 2D context image commit helpers | Active |
| [modules/export-preview-camera-state.js](modules/export-preview-camera-state.js) | Export preview crop camera-state snapshot helpers | Active |
| [modules/export-preview-readback-commit.js](modules/export-preview-readback-commit.js) | Export preview readback + canvas commit orchestration helpers | Active |
| [modules/export-preview-overlays.js](modules/export-preview-overlays.js) | Export preview crop and ruler overlay orchestration helpers | Active |
| [modules/export-preview-target-size.js](modules/export-preview-target-size.js) | Export preview canvas pixel target-size sync helpers | Active |
| [modules/export-preview-resources.js](modules/export-preview-resources.js) | Export preview render-target and preview-camera setup orchestration helpers | Active |
| [modules/export-preview-preflight.js](modules/export-preview-preflight.js) | Export preview context preflight orchestration helpers | Active |
| [modules/export-preview-canvas-prep.js](modules/export-preview-canvas-prep.js) | Export preview dimensions and target-size prep orchestration helpers | Active |
| [modules/export-preview-pipeline.js](modules/export-preview-pipeline.js) | Export preview end-to-end pipeline orchestration coordinator | Active |
| [modules/export-preview-update.js](modules/export-preview-update.js) | Export preview update entrypoint controller and dependency wiring | Active |
| [modules/export-preview-state-commit.js](modules/export-preview-state-commit.js) | Export preview pipeline-result state commit helpers | Active |
| [modules/export-preview-update-context.js](modules/export-preview-update-context.js) | Export preview update-context builder helpers | Active |
| [modules/export-preview-runtime.js](modules/export-preview-runtime.js) | Export preview runtime wrappers for update and refresh flows | Active |
| [modules/export-panel-drag.js](modules/export-panel-drag.js) | Export panel drag and persisted positioning controller | Active |
| [modules/export-workspace-runtime.js](modules/export-workspace-runtime.js) | Export workspace runtime wrappers for active-state/open-close flows | Active |
| [modules/export-crop-ui.js](modules/export-crop-ui.js) | Export crop/frame button and orbit-hint UI controller | Active |
| [modules/crop-dimensions-dock.js](modules/crop-dimensions-dock.js) | Crop dimensions dock visibility and positioning controller | Active |
| [modules/export-progress-overlay.js](modules/export-progress-overlay.js) | Export progress overlay element show/update/hide controller | Active |
| [modules/export-status.js](modules/export-status.js) | Export status and animation status lane controller helpers | Active |
| [modules/export-busy-state.js](modules/export-busy-state.js) | Export busy-state button disable and overlay toggle controller | Active |
| [modules/export-progress-timing.js](modules/export-progress-timing.js) | Export progress paint timing/throttle controller | Active |
| [modules/export-download.js](modules/export-download.js) | Export blob download and URL revoke controller | Active |
| [modules/export-filename.js](modules/export-filename.js) | Export quality/modifier tags and filename composition controller | Active |
| [modules/right-pan-lock.js](modules/right-pan-lock.js) | Right-pan vertical-lock and shift-pan interaction controller | Active |

---

## Web App

### Security Hardening

- A baseline CSP is enabled via `Content-Security-Policy` in `index.html`.
- Current policy allows local app assets plus jsDelivr module dependencies while restricting high-risk directives (`object-src 'none'`, `frame-ancestors 'none'`, strict `base-uri`/`form-action`).
- Note: browsers ignore `Content-Security-Policy-Report-Only` when delivered via `<meta>`; use HTTP response headers if you want true report-only telemetry.
- STL ingest guardrails are enabled for direct upload/import paths (file count, per-file size, total size, and triangle-budget limits).
- STL parse/validation now runs in a dedicated Web Worker when available, with timeout protection to keep oversized or malicious files from freezing the main UI thread.
- ZIP package import now includes additional decompression-abuse checks (entry compression-ratio caps plus existing archive/entry/extracted-size limits).
- Export guardrails cap unsafe workload combinations (resolution, FPS, frame count, and total pixel-frame budget) before render/encode starts.
- Export workload budget is adaptive to device capability hints (`navigator.deviceMemory` / `navigator.hardwareConcurrency`) so stronger devices get more headroom while lower-end devices remain protected.

Open `index.html` via a local server (ES modules require `http://`, not `file://`):

```bash
python3 -m http.server 8765
# then open http://localhost:8765
```

### Applying Default Settings
If you want to spin up your own instance and override the default colors, camera angles, speeds, lighting, or build plate/background sync behavior without modifying the codebase, use `Copy Link` in the Export modal or save a project package and copy the `shareURL` value from `package.json`, then paste that URL parameter string inside `script.js` near the top:

```javascript
const DEFAULT_SETTINGS_URL = '...'; // Paste your copied URL here
```

### Build Bump Script (single-source version update)

Run this from `3d/apps/rotater` to update build version/date in `index.html`:

```bash
npm run bump:build -- 2.1.77
```

Notes:
- This updates `ROTATER_BUILD`, `ROTATER_BUILD_DATE`, and the Info card fallback labels.
- CSS/JS cache-buster values are generated from `ROTATER_BUILD` at runtime, so they stay in sync automatically.

### Default Logic Tuning (quick reference)

If you want to change startup defaults and card reset behavior in code, these are the main sources of truth:

- Build/version source-of-truth:
  - `index.html` -> `ROTATER_BUILD` and `ROTATER_BUILD_DATE` in the head bootstrap script
  - CSS and JS cache-buster query strings are now generated from `ROTATER_BUILD` automatically, so version updates are a one-location edit

- `script.js` -> `DEFAULT_SETTINGS_URL`: full URL-based baseline for first-time visitors
- `index.html` -> `ROTATER_DEFAULT_QUERY`: bootstrap fallback query that is inserted when no query/hash exists
- `script.js` -> initial state defaults:
  - `activeBgPreset = 'modelcolor'`
  - `activeBuildPlatePreset = 'modelcolor'`
  - `isDynamicBg = true`
  - `buildPlateAutoBrightnessEnabled = true`
- `color-rules.json` -> `modelShade`:
  - `jumpPercent` controls shade step strength per stop
  - `snapCount` controls how many stops are available
- `color-rules.json` -> `surfaceShade`:
  - `jumpPercent` controls background/build-plate manual shade step strength
  - `snapCount` controls how many manual shade stops are available
- `color-rules.json` -> `autoBrightness`:
  - `background.shade` and `buildPlate.shade` set the auto-brightness direction (`-100` white side, `+100` black side)
  - `maxBlendPercent` sets the strongest blend amount at `|shade|=100`
  - default parity: `background.maxBlendPercent = 40` and `buildPlate.maxBlendPercent = 40`

- Drag and drop any STL file onto the page, or click **Upload STL**
- Upload STL buttons now open the Add/Replace choice modal **before** the file picker when a model is already loaded:
- Multi-part bulk edit: in **Part Color Target**, check multiple parts and use the bulk banner to apply active **Color**, **Shade**, or **Finish** values to all checked parts  - Bulk checkboxes support true multi-select: select any combination of parts to edit them together
  - Clicking a part thumbnail or button activates it for editing without clearing other selections- Model card manager behavior:
- Model preset cards now apply on click only
- The model and all settings persist across page refreshes — no re-upload needed
- Hard refresh startup now exits the splash immediately after restore pass, and demo-model auto-load is deferred for smoother initial interaction
- Startup flow is now unified for both new and returning sessions: `Splash -> full UI shell (no model yet) -> model-ready UI`, with smooth fade transitions between stages
- The filename chip (top-right of canvas) shows the active file
  - For multipart models, click the chevron to expand all part filenames
  - Each expanded row supports **Replace**, **Add**, and **×** remove for individual part operations (remove when 2+ parts are loaded)
  - Click **×** while showing the demo to open the file picker
  - Click **×** while showing your own model to reset back to the demo (3D Benchy)
- **Copy Link** (inside the Export modal) copies a shareable URL for the current scene, including build plate/background sync and auto-brightness settings
- **Save Project** (inside the Export modal) saves a single ZIP package containing `package.json` plus the original STL file(s)
- **Import Package** is part of the Upload STL flow (picker/drop zone) and accepts Rotater `.zip` packages for quick restore/testing
- ZIP package import now validates file paths, type allowlist (`.stl` + `package.json`), and archive size limits before loading
- **Collapsed Export Assist** auto-expands export when collapsed and can show a one-time confirmation before continuing
- Single-model 3-dot menus now dismiss reliably when clicking outside, including overlap areas where the menu crosses the model card hit-region.
- Export motion mode/speed/range controls are always shown inside the Export overlay
- **Build Plate controls** are now in their own dedicated card (separate from Background)
- **Background** and **Build Plate** now default to `Model Sync` with Auto Brightness enabled for new visitors
- **Load 3D Benchy** is available in App Settings for a quick test-model reset

See also: [_IGNORE/ROADMAP.md](_IGNORE/ROADMAP.md)

### App Settings controls

- **Dev mode (show FPS)**: enables a lightweight FPS readout overlay in the viewer for performance diagnostics (off by default).
- **Reset all warnings**: re-enables previously dismissed warning prompts (for example upload choice and collapsed-export confirmations).
- **Build Plate Size**: sets the virtual build plate dimensions used by Surface/Grid context (`180x180`, `220x220`, `235x235`, `256x256`, `300x300`, or `Custom`).
- **Custom Build Plate Width/Depth**: when `Custom` is selected, sets plate width/depth in mm.
- **Ruler Units**: switches measurement units between metric (`mm`) and imperial (`in`).
- **Load 3D Benchy**: loads the default Benchy test model.
- **Dark mode**: toggles app theme.
- **About Rotater**: opens version/build info and project links.
- **Reset Everything**: clears all saved Rotater state (including lighting, animation, UI preferences, dismissed warnings, and stored model/project data) and reloads.

### Viewer controls

- **Drag** to orbit · **Scroll** to zoom · **Right-drag up/down** to pan vertically
  - Plain click in preview no longer pauses rotation; orbit interaction starts only after real pointer movement.
- **Spacebar** — pause / resume rotation
- **Esc** — collapse expanded preview only (no action when preview is already collapsed)
- **D-pad** (bottom-center of viewer) — orbit the camera in 45° snapped increments
  - Arrow keys (←↑↓→) do the same thing from the keyboard
  - Center button of the D-pad pauses / resumes (⏸/▶)
  - Export quick options (`Background`, `Grid`, `Build Plate`) apply directly to the live export workspace viewport while framing
  - When `Background` is off, the export workspace viewport shows a white/gray checkerboard to indicate transparency
  - Clicking outside the crop frame closes Export workspace
  - Dimension presets appear beside the viewer for one-click framing changes
  - During export workspace, `Pause` and `Close` actions are in the same bottom bar as the D-pad (to the right of the D-pad) so controls stay in one place
  - **Cancel** (ghost button, bottom-center) — discards crop changes while staying in the export flow
  - **Keep** (purple button, bottom-center) — saves the current framing
  - The D-pad remains available during export framing so camera alignment stays easy
- **Dark mode toggle** (bottom-left of viewer)

### Export preview overlay

A dashed overlay on the viewer always shows exactly which square region will be captured. Enabling the frame toggle adds a solid dim vignette outside the crop area for a clearer preview. The **⟳ reset** button always recenters the model within this square frame.

### Appearance

Sidebar tabs: **Theme → Effects**

- **Theme** includes model + background controls
- **Effects** combines lighting controls and animation controls in one panel
- **Export** is now a modal opened from the header button
- **Copy Link** and **Save Project** live inside the Export modal for shareable URLs and reusable ZIP packages
- The Theme sidebar uses unified slider styling and shared snap behavior across Shade, Sheen, Contrast, and Highlights

When a multi-part model is loaded:

- **Model** controls are part-aware (color, shade, shading mode, and finish/reflection values are stored per selected part)
- **Model presets** are model-only (they no longer force background or lighting changes)
- **Background → Model Sync** preset can follow a chosen part via **Model Sync Source** (defaults to Part 1), and Auto Brightness is enabled by default on first visit
- The part selector dropdown appears only for multipart models; single-model sessions use an exposed 3-dot actions menu

| Control | Description |
|---|---|
| Color → Model | Model face color (click swatch to open color picker) |
| Color → BG | Background color (click swatch to open color picker) |
| Build Plate Preset | `White`, `Black`, `Model Sync`, or `Custom` |
| Build Plate Auto Brightness | Automatically lightens the selected build plate color or synced model color for better scene contrast |
| Plate Color | Build plate color picker (shown when Build Plate is enabled) |
| Plate Shade | Lighten/darken the selected plate color |
| Plate Finish | Plate material finish: Matte, Satin, or Gloss |
| Plate Shape | Plate footprint mode: Rectangle, Rounded, or Circle |
| Build Plate Size | App Settings preset dropdown (common sizes) with optional custom width/depth in mm |
| Texture → Clay | Matte clay-style shading |
| Texture → Phong | PBR diffuse (non-metal) |
| Texture → Metal | PBR metallic with environment reflections |

Texture tuning (tune icon in the Texture card) includes:

- Light
- Contrast
- Highlights
- Shadows (strength)
- Light Source (shadow direction)
- Lock light to camera (toggle)
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

Rotation timing is now time-based (delta-time corrected), so selected seconds-per-revolution stay accurate even when frame rate drops.

Shade drag responsiveness note: model tone/opacity drag now prioritizes immediate visual feedback and defers heavier persistence/thumbnail work to commit timing for smoother interaction on larger scenes.

### Export preview

Export framing now centers on the main viewer during the export workspace flow. The older duplicate preview surface is being phased out so framing, crop state, and camera adjustment all happen in one place.

### Export

The Export section uses a **Format** dropdown and a **Quality** dropdown. Selecting a format reveals its specific options. A live **Preview** thumbnail shows the export frame crop in real time.

### Save Project

The **Save Project** action inside the Export modal saves one ZIP package that contains:

- `package.json` with the current Rotater settings, part names, selected part, and share URL
- the currently loaded STL file, or all STL parts for multipart models

This package is designed to support a future import flow.

### Copy Link

The **Copy Link** action inside the Export modal copies a shareable URL for the current Rotater scene. The link includes animation, export, background, build plate, model-sync, and auto-brightness settings so another session can restore the same setup directly from the URL.

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
| Background | Toggle background color on/off for export preview and compatible outputs (off state shows checkerboard transparency in export workspace) |
| Grid | Toggle ruler grid visibility in export preview/output (visible even when Build Plate is off) |
| Build Plate | Toggle build plate visibility in export preview/output |

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
