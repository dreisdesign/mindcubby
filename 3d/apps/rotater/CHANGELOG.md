# Changelog

All notable changes to Rotater will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- Test file: MC3D-Fidget-Studio--3.Clicker.stl (412 triangles) -->
<!-- v0.1.0 output: 295 KB GIF @ 72 frames, 24 fps, 720×720px -->
<!-- v0.2.0 output: 698 KB GIF @ 144 frames, 24 fps, 720×720px -->

<!-- v0.5.0 output: GIF ~4.9 MB @ 576 frames, 24 fps | MP4 ~3.6 MB @ 24s -->
## [0.21.0] - 2026-04-15

### Changed
- **Copy configuration icon** — replaced chain/link icon with Material Symbols `content_copy` icon
- **GIF loop control** — replaced the inline Loop toggle switch with a styled `<select>` dropdown showing "Looping GIF" / "One-shot GIF"; sits as the right half of the GIF compound pill; fully keyboard-accessible
- **Colors section** — flattened Model/BG color swatches and Flat/Phong/Metal shading options into a single aligned row; removed the separate "SHADING" sub-label; all 5 items bottom-align for consistent visual baseline

## [0.20.0] - 2026-04-15

### Added
- **Orbit hint toast** — "Drag to orbit" hint is now a dismissable cream pill (Blueberry 100 bg, dark text, × close button) positioned left of the face-nav buttons at the canvas bottom-center; remembers dismissal in `localStorage`; Reset Settings clears the flag
- **Controls section boxes** — Exports, Colors, and Rotation+sliders sections are wrapped in white rounded boxes (`border-radius: 12px`) on the Blueberry 100 panel background; Copy config and Reset settings remain unstyled outside the boxes

### Changed
- **Controls panel background** — sidebar controls bar background changed to `--color-surface` (Blueberry 100, `#F0EEFF`); sidebar header matches
- **Canvas button sizing** — face-nav buttons (Front/Back/Left/Right/Top/Bottom), theme toggle, and pause button upgraded to `min-height: 2.5em` / `--text-md` to match export button height
- **Canvas insets** — all canvas overlay positions increased `10px → 16px` (logo, top-right chips, pause, theme toggle, bottom-center row)
- **Section dividers removed** — `<hr class="section-divider">` replaced by visual separation via section boxes


### Changed
- **Filename chip** — replaces the separate filename pill + separate × button; a single unified pill showing the active filename with a plain × icon on the right; clicking anywhere opens the file picker (Replace STL); hover turns the whole chip red with white text/icon to signal removal; no shadow or outline in default state
- **Replace STL** now sits to the right of the filename chip (chip left, button right); hidden until a model is loaded (chip takes over)
- **Settings overlay removed** — Reset settings and Reset to Benchy are now inline buttons in the sticky sidebar header (no more hamburger/modal); Reset settings on the left, Copy configuration on the right
- **Button sizes unified** — Replace STL, Copy configuration, and Reset settings all use `--text-md`, `padding: 0.375em 0.75em`, `min-height: 2.5em`
- **Export section fills full width** — `.downloads-section` uses `flex: 1 1 100%` so export rows span the full sidebar width
- **Export row dividers** — changed from solid `border-bottom` to gradient `border-image` matching the section dividers (fade transparent at edges)
- **Orbit hint divider** — `border-top` changed to gradient `border-image` matching section dividers
- **Export metadata text** — color changed from `--color-hint` (#aaa) to `--color-label` (#666); darker and more readable
- **Theme toggle icons** — switched from sun/moon to Material Symbols `bedtime` (light mode → click to go dark) and `bedtime_off` (dark mode → click to go light)

## [0.18.0] - 2026-04-14

### Added
- **Canvas overlay UI** — logo (top-left), filename pill + Replace STL button (top-right) are now overlaid directly on the canvas; header is hidden in loaded state
- **Hamburger in sidebar header** — sticky bar pinned to top of sidebar, always accessible while scrolling controls
- **Section dividers** — gradient `<hr>` separators (fade to transparent at edges) between Colors/Shading, Exports, and Rotation sections
- **Copy configuration** floats absolutely at top-right of controls bar; takes no layout space

### Changed
- **Filename pill** — blueberry-200 background, blueberry-900 text; right-aligned inside `.canvas-top-right` flex group so it expands leftward as name grows
- **Replace STL button** — filled blueberry-500 (primary), white text, blueberry-800 hover; readable on any canvas background
- **Rotater logo on canvas** — height `48px` to match the canvas-top-right row height
- **Shading previews** — static, fixed to blueberry palette (blueberry-200 card bg, blueberry-500 sphere, blueberry-800/900 shadows); no longer dynamically update to follow model/BG color pickers
- **Loop toggle** active color changed from orange (accent) to primary purple (`--primary-color`)
- **Rotation controls** larger — controls bar padding `20px 24px`, section gap `20px`, radio option padding `8px 14px`, control-label gap `10px`
- **Speed slider** takes full width (`flex-basis: 100%`); Tilt/Range sliders sit on the row below
- Orbit hint text moved to bottom of controls bar
- Exports label gap removed (`margin-top: 0`, first export row `padding-top: 0`)

## [0.17.0] - 2026-04-14

### Added
- **Two-column desktop layout** — at ≥ 900px, canvas fills the left and controls move to a right sidebar (400px, `overflow-y: auto`); mobile retains the existing stacked layout
- **Export list** — GIF / MP4 / PNG now use a macOS-style action-row pattern: button + optional Loop toggle on the left, file size metadata right-aligned, rows separated by dividers; no more wrapping or clipping at any width
- **Dark mode contrast fixes** — active interactive elements (`--color-primary`, `--primary-color`) override to `blueberry-300` in dark mode so buttons, radio selections, and slider accents are visible on dark surfaces; filled export buttons use dark text for contrast; Loop toggle label uses surface tokens instead of hardcoded white

### Changed
- Container fills full viewport in loaded state (`max-width: none`, `margin: 0`, `border-radius: 0`, `box-shadow: none`, `padding: 0`)
- Controls bar stacks sections vertically inside the sidebar; Speed + Tilt sliders stay side-by-side with wrapping
- `Model` / `BG` color labels and "Drag to orbit" hint text now respect dark mode via `html.theme-dark` overrides
- Loop toggle is a standalone full-pill button (no longer joined to the GIF button)

## [0.16.0] - 2026-04-14

### Added
- **Dark / light theme** — blueberry palette dark mode; persisted to `rotater-theme` in localStorage; applied before first paint (no flash)
- **Settings overlay** — hamburger button now opens a Smoothie-styled modal panel (backdrop + 280px card, `border-radius: 16px`, `box-shadow`) instead of a small dropdown; Escape and outside-click dismiss; focus moves to close button on open
- Theme toggle button in settings panel (moon/sun icon + label, updates on toggle)

### Changed
- Downloads section: Animation + Image side-by-side on ≥ 560px; stacks vertically on narrow screens
- Surface colors use `--color-surface-raised` token throughout (radio buttons, selects, color swatches, controls bar, menu button) — all update correctly in dark mode
- Controls bar, settings panel, and form controls animate smoothly on theme switch (`transition: background 0.25s`)
- Settings menu items use full-width action buttons with icon + label (matches Smoothie `labs-settings-card` visual pattern)
## [0.15.0] - 2026-04-14

### Added
- **Shareable URL** — all settings are written to the query string on every change via `settingsToURL` / `history.replaceState`; opening a URL with params restores those settings, falling back to localStorage
- **Copy configuration** button in the orbit-hint bar — copies the current URL (with all settings encoded) to the clipboard; flashes "Copied!" for 1.8 s
- **Reset settings** item in the hamburger menu — clears localStorage and the query string, then reloads
- GIF loop preference now persisted in localStorage and query string (`gl` param)

### Changed
- Orbit/zoom/pan hint moved below the canvas into its own `.orbit-hint-bar` strip (shown on model load); removed from the controls bar
- Export button labels shortened: "Download GIF" → **GIF**, "Download MP4" → **MP4**, "Download PNG" → **PNG**
- Default model color `#aab8c8` → `#2e2b74`; default background `#0a0a12` → `#dbd7ff`
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
