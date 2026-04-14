# Changelog

All notable changes to Rotater will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- Test file: MC3D-Fidget-Studio--3.Clicker.stl (412 triangles) -->
<!-- v0.1.0 output: 295 KB GIF @ 72 frames, 24 fps, 720×720px -->
<!-- v0.2.0 output: 698 KB GIF @ 144 frames, 24 fps, 720×720px -->

<!-- v0.5.0 output: GIF ~4.9 MB @ 576 frames, 24 fps | MP4 ~3.6 MB @ 24s -->

## [0.15.0] - 2026-04-14

### Changed
- Button styles aligned to Blueberry design system visual language (no web component dependency)
  - Export buttons (GIF / MP4 / PNG) now use primary fill: blueberry background, white text
  - "Copy configuration" and "Replace STL" buttons use DS secondary style: transparent fill, primary-color border, `color-mix` hover tint
  - Hamburger menu button uses full pill border-radius (`9999px`) and primary-color icon
  - Face-nav and pause/resume overlay buttons updated to full-pill shape; active scale normalised to `0.95` across all buttons
  - Focus-visible rings (`box-shadow: 0 0 0 2px blueberry-300`) added to all interactive buttons
  - Body font updated to `"Source Sans 3"` (design system primary typeface) with system-UI fallback chain
  - `font-weight: 600` and `min-height: 2.5em` applied consistently to all action buttons

## [0.14.0] - 2026-04-14

### Added
- Face navigation buttons (Front / Back / Left / Right / Top / Bottom) on the canvas overlay — click to snap to any face of the model
- Spacebar toggles pause/resume
- PNG export size estimate below Download PNG button (~0.5 MB · 720×720px)

### Changed
- Download buttons moved to the right of Shading in the controls bar ("Animation" and "Image" section titles)
- Face-nav buttons centered on the canvas overlay
- Controls bar padding increased
- "Drag to orbit" hint moved from footer into controls bar; contrast improved to meet WCAG AA
- Export buttons use pill border-radius (`border-radius: 9999px`) per Blueberry design system `--radius-button`
- GIF + Loop toggle compound button uses matching pill shape
- Colors and Shading sections are now top-aligned
- Tilt mode: camera elevation now follows user orbit (base elevation tracks user drag, sine oscillation layered on top) — azimuth freely orbitable
- Tilt elevation slider hidden when Tilt rotation is selected (was redundant — orbit controls the base elevation)
- Wobble rotation mode removed
- Tilt orbit fix: `controls.update()` now called before reading camera position, so user drag input is applied before the tilt recalculation

### Fixed
- Orbit fighting in Tilt mode — camera position was overwritten before OrbitControls could apply drag input

## [0.13.0] - 2026-04-13

### Added
- Blueberry design token system — 3-tier CSS custom properties (palette → semantic → alias) aligned to the Blueberry/Global design system
- Official SVG wordmark logo replaces plain text `<h1>` header
- FOUC prevention — sessions with saved state skip the white flash on hard refresh (`has-session` pattern)
- ACES Filmic tone mapping (`exposure: 0.75`) — prevents highlight clipping on bright/white models while preserving shadow depth

### Changed
- Phong shading engine switched from `MeshPhongMaterial` to `MeshStandardMaterial` (`metalness: 0, roughness: 0.62`) — PBR indirect specular via IBL makes dark/black models readable regardless of albedo
- Metal shading now uses `RoomEnvironment` IBL (`PMREMGenerator`) for physically correct environment reflections; was near-black without an environment map
- Ambient light reduced (`0.72 → 0.45`) and Phong `envMapIntensity` set to `0.4` to deepen shadow contrast
- CW Y-axis snap button replaced with an X-axis snap button (rotates model 90° around X-axis)
- Shading selection indicator uses a double-ring (white border + blueberry outline) for visibility on all background colors
- Shading thumbnail shadow computation is now background-independent (`multiplyScalar` instead of `lerp`-to-bg)
- Shading label text color uses WCAG-compliant opaque values (`#ffffff` / `#2a2a30`) derived from background luminance

## [0.12.1] - 2026-04-13

### Fixed
- Reset to Benchy now clears IndexedDB so a hard refresh stays on Benchy instead of reverting to the previously uploaded STL

## [0.12.0] - 2026-04-13

### Added
- CCW and CW 90° snap buttons on the canvas overlay — rotate the model's Y-axis by 90° without interrupting animation
- Reset View button moved from canvas overlay to top-right of the controls bar; now includes icon + label + confirm dialog
- Committed shared icon library (`3d/apps/icons/`) with 75+ Material-style SVG icons

### Changed
- Swing Range slider range corrected to 0°–180° (was 10–50 with a ×3.6 multiplier hack)
- Range slider reconfigures dynamically when switching between Swing (0–180°, 7 ticks) and Tilt/Wobble (10–50°, 5 ticks)
- Wobble icon updated to `arrow_split`
- Swing icon updated to `arrow_range`
- Download GIF/MP4/PNG all use new `.export-btn` style (outlined accent — white bg, accent border/text)
- Replace STL button demoted to a neutral ghost button (no longer filled-primary)
- Reset View removed from canvas overlay (no longer a `pause-btn` circle)

## [0.11.0] - 2026-04-13

### Added
- Swing rotation mode — azimuth oscillates left/right through a partial arc set by the Range slider
- SVG icons on all rotation mode buttons (Spin, Tilt, Wobble, Swing)
- "Off" replaces "None" as the rotation mode label throughout

### Fixed
- Tilt mode was incorrectly doing wobble behavior (both shared `autoRotate=true`); split into separate loop branches — tilt uses `autoRotate=false` with a fixed azimuth
- Re-click to pause was not working; replaced `mousedown`/`click` on `<label>` with `pointerdown`/`change` on `<input>` directly to avoid browser timing race

### Changed
- Live loop, GIF capture, and MP4 encode all have four separate branches: Wobble / Tilt / Swing / Spin

## [0.10.1] - 2026-04-13

### Fixed
- Shading card background now uses the actual scene background color (`var(--sh-bg)`)
- Shading label text color adapts to background luminance (light text on dark bg, dark text on light bg)
- Checked shading card shows border highlight only — no background tint overlay

## [0.10.0] - 2026-04-13

### Added
- Hamburger menu (☰) in header with "Reset to Benchy" action (replaces header Benchy button)
- Re-click the active Rotation option to pause/resume (pause-hint ⏸/▶ shown on hover)
- Colors section: Model and BG pickers displayed as equal-size color cards with labels

### Changed
- Shading preview thumbnails incorporate the scene background color into shadow/deep gradients
- Speed, Tilt, and Range sliders reordered
- `html.none-mode` disables Speed, Tilt, Range sliders and Loop toggle visually when Off is selected
- Color picker size standardized to match shading card dimensions

## [0.9.5] - 2026-04-13

### Added
- Elevation slider extended to 90° (Top); "Top" tick label shown in accent color
- Speed slider snaps: 0.5×–4.0× in 0.5 steps (8 ticks)
- Off mode disables GIF and MP4 export buttons and the Loop toggle
- Tooltips on all control buttons

### Changed
- "Elevation" label renamed to "Tilt"
- Slider order: Speed → Tilt → Range
- Canvas click-to-pause and spacebar shortcut removed (replaced by dedicated pause button and re-click in 0.10.0)

## [0.9.4] - 2026-04-13

### Added
- Shading thumbnails dynamically reflect the current model and background colors (Three.js `Color.lerp`)
- Benchy button replaced with confirm dialog + swap icon before loading

### Fixed
- Tilt orbit mode now uses `autoRotate=true` (was incorrectly excluded, causing no azimuth movement)

## [0.9.3] - 2026-04-11

### Added
- Download PNG button — exports the current frame as a PNG, auto-pauses rotation if not already paused

## [0.9.2] - 2026-04-11

### Changed
- Replaced file icon with plus (+) icon on both Select STL buttons to match GCoder

## [0.9.1] - 2026-04-11

### Changed
- Export buttons renamed to "Download GIF" and "Download MP4"
- Added download arrow icon to both export buttons (matches GCoder style)
- Button padding and font size updated to match GCoder (`10px 20px`, `14px`)

## [0.9.0] - 2026-04-11

### Added
- Pause/resume button in bottom-left corner of the canvas
- GCoder-style default landing page (big title, dashed upload section)
- Full-viewport layout activates after first file load
- Filename moved to bottom-right overlay on canvas (no header jitter on restore)
- STL and settings persist across page refreshes (IndexedDB + localStorage)

## [0.8.0] - 2026-04-11

### Added
- STL file persists across page refreshes (stored in IndexedDB)
- All control settings persist across refreshes (color, background, shading, speed, elevation) via localStorage
- Restored filename shown with ↩ indicator in header

## [0.7.0] - 2026-04-11

### Changed
- Full single-page no-scroll layout — everything fits in the viewport
- Upload button moved to top-right of header bar
- Canvas fills remaining vertical space (flex:1, non-square aspect ratio)
- Controls and export actions pinned in a compact bar at the bottom
- Canvas renderer now uses full width×height, camera aspect ratio updated on resize

## [0.6.0] - 2026-04-11

### Added
- Ctrl+scroll to zoom (Google Maps pattern) — plain scroll passes through to the page
- "Use Ctrl + scroll to zoom" overlay hint appears briefly on plain scroll, dismisses on mouse leave

### Changed
- Footer hint updated: "Ctrl+scroll to zoom"

## [0.5.0] - 2026-04-11

### Added
- File size estimates shown beneath each export button, update live with speed slider
  - GIF calibrated to ~8.7 KB/frame, MP4 to ~0.15 MB/s

### Fixed
- Export frame count now derived from live `autoRotateSpeed` — exported speed matches viewer exactly
- Export rotation direction matches OrbitControls auto-rotate

### Changed
- Default shading changed from Metallic to Phong

## [0.4.0] - 2026-04-11

### Fixed
- GIF and MP4 export now orbit the camera (not the mesh), matching the live viewer exactly
- Export rotation direction aligned with OrbitControls auto-rotate direction

### Changed
- Video export switched from WebM (MediaRecorder) to H.264 MP4 (WebCodecs + mp4-muxer)
- mp4-muxer v5.1.3 added as CDN dependency

## [0.3.0] - 2026-04-11

### Added
- **Web app** (`index.html`, `style.css`, `script.js`) — Three.js live 3D viewer in the browser
  - Drag-and-drop STL loading
  - Real-time orbit/zoom/pan via OrbitControls
  - Color, background, shading, speed, and elevation controls
  - Client-side GIF export (gifenc) and WebM video export (MediaRecorder)
  - Matches gcoder app design system (colors, layout, typography)
  - CDN-loaded dependencies: Three.js v0.164.1, gifenc v1.0.3

## [0.2.0] - 2026-04-11

### Changed
- Default model color: `steelblue` → `#aab8c8` (cool aluminum tone)
- Default background: `black` → `#0a0a12` (deep blue-black)
- Default elevation: `25°` → `28°` (more heroic viewing angle)
- Default frames: `72` → `144` (50% slower rotation speed)
- Metallic ambient: `0.15` → `0.18` (lifts shadow detail on dark faces)

## [0.1.0] - 2026-04-11

### Added
- Initial release
- STL loading via `numpy-stl` with `trimesh` fallback
- 360° rotation exported as animated GIF or MP4
- Blinn-Phong lighting with `flat`, `phong`, and `metallic` shading presets
- CLI flags: `--frames`, `--fps`, `--elevation`, `--color`, `--bg`, `--shading`, `--title`, `--out-file`, `--output`
