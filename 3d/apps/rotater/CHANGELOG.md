# Changelog

All notable changes to Rotater will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- Test file: MC3D-Fidget-Studio--3.Clicker.stl (412 triangles) -->
<!-- v0.1.0 output: 295 KB GIF @ 72 frames, 24 fps, 720×720px -->
<!-- v0.2.0 output: 698 KB GIF @ 144 frames, 24 fps, 720×720px -->

<!-- v0.5.0 output: GIF ~4.9 MB @ 576 frames, 24 fps | MP4 ~3.6 MB @ 24s -->

## [2.1.55] - 2026-05-09

### Added
- **Copy Link button** — Export panel now includes a `Copy Link` button (left of `Save Project`) that saves current settings to the URL and copies it to the clipboard

### Changed
- **Export: Download Settings → Save Project** — renamed the ZIP package button to `Save Project` for clarity
- **Animation card moved to top** — Animation card is now the first card in the Effects panel (above Lighting Effects)
- **Animation card header** — Animation card header now uses the standard `box-heading` style matching all other cards
- **App Settings chevron** — App Settings collapse chevron now renders as a bordered 30×30 box matching the card collapse button style
- **Desktop sidebar wider** — Sidebar panel width increased from `clamp(320px, 26vw, 420px)` to `clamp(340px, 28vw, 460px)` so the Upload STL button text no longer wraps to two lines

### Fixed
- **Build plate model sync + auto brightness** — Fixed initialization bug where restoring settings with model sync + auto brightness could produce a stale color; `getBuildPlateSyncSourceColor()` now uses `modelPartBaseColors[0]` as primary source for single-part models; `buildPlateAutoBrightnessEl.checked` is now explicitly synced on restore
- **Export grid** — Grid now appears correctly in the export preview even when the main-view ruler is disabled; the grid helper is created on demand for export if needed
- **Defaults: model sync + auto brightness** — Build Plate and Background now default to `Model Sync` preset with Auto Brightness enabled for new visitors

## [Unreleased]
### Added
- **Model footprint floor guides** — ruler grid now includes thin footprint lines derived from the loaded model bounds, aligned to the active ruler unit system (`mm` metric spacing or `in` imperial spacing)
- **Export preview visible border** — the mini export preview now always has a visible border; border strengthens when background is off so the frame is clear on transparent renders
- **Export Build Plate quick option** — Export quick options now include a dedicated `Build Plate` toggle so plate visibility can be controlled per-export without changing the main Build Plate card defaults
- **Export workspace transparency checkerboard** — when Export `Background` is toggled off, the main export workspace viewport now shows a white/gray checkerboard behind the model to make alpha state explicit
- **Build plate shape control** — Build Plate card now supports `Rectangle`, `Rounded`, and `Circle` footprint modes with live geometry switching
- **Multipart bulk edit MVP** — Model parts menu now includes per-row checkboxes plus a bulk action banner to apply active `Color`, `Shade`, or `Finish` values to checked parts

### Changed
- **Manual crop close cleanup** — removed the in-frame top-right crop close button to avoid interfering with crop-corner dragging; export close now stays in the Export panel action row
- **Export action row cleanup** — removed legacy in-canvas crop `Keep` and old D-pad `Close`; Export panel now provides an inline `Close` button beside `Export`
- **Mobile top controls alignment** — mobile/narrow preview header now prioritizes Upload + Export actions, removes the filename chip from that row, and adds a compact quick-close/reset action beside Export for cleaner parity with desktop flow
- **Info entry location** — `About Rotater` access moved to the App Settings card action row (bottom-right)
- **Ruler HUD compact unit switch** — replaced the wider `mm / Imperial` hint-style switch with a compact unit toggle button to save bottom-bar space
- **Surface card hierarchy + presets** — renamed the `Build Plate` card to `Surface`, kept `Grid` and `Build Plate` as peer toggles, and replaced the old plate color button with Background-style `White`, `Black`, `Model Sync`, and `Custom` thumb presets plus a matching multipart sync-source selector
- **Watermark quick option temporarily removed** — removed the non-functional Export `Watermark` toggle and watermark compositing path for now; this will be revisited in a future iteration
- **Export workspace consolidation (phase 1)** — Export now enters a shared framing workspace based on crop mode, using the main viewer as the active preview instead of relying on a separate duplicate preview workflow
- **Export control zones simplified** — Export workspace `Pause` and `Close` actions now live in the bottom d-pad control bar (to the right of the d-pad), and `Close` is now an icon + text button instead of a floating top-right icon-only control
- **Finish wording clarity** — model finish-strength slider label now reads `Surface Finish` (was `Shading`) to match Matte/Satin/Gloss behavior
- **Upload STL modal timing** — Upload STL buttons now open the Add/Replace decision modal before opening the file picker when a model is already loaded
- **Package action placement** — `Download Project ZIP` now lives in the Export panel, and package import is available directly from the Upload STL choice flow
- **Model manager semantics** — per-part 3-dot menus removed `Add STL`; single-model sessions now hide the part dropdown and show an exposed 3-dot actions menu
- **Collapsed Export review UX** — collapsed-review confirmation now uses actionable switches/dropdowns that update the live Export settings immediately
- **Card reset affordance state** — Model, Background, Build Plate, Lighting, and Animation reset buttons are disabled until the corresponding card has changes to reset
- **Chevron orientation consistency** — file chip, part selectors, export panel, and app settings chevrons now follow a single convention: right = collapsed, down = expanded
- **Roadmap cleanup** — removed the obsolete background texture slider roadmap item
- **Build plate color picker parity** — Build Plate now exposes a custom color swatch button that opens the native picker with the same anchored behavior used by Custom color swatches
- **Lighting lock control** — `Lock light to camera` is now a visible toggle in Lighting Effects (instead of a forced hidden state)
- **Sidebar export entry placement** — desktop export entry now sits beside `Upload STL` in the sidebar brand row so export starts from the primary left-panel workflow

### Fixed
- **D-pad horizontal centering** — camera D-pad now stays centered in the preview control bar instead of shifting with ruler width
- **Mobile preview order and Info access** — on narrow widths the preview now sits above the control panel, the duplicate canvas logo/header are hidden, and the Info card is reachable from the sidebar action row
- **Desktop load card overlap** — Effects panel no longer force-renders while hidden in desktop layout, preventing Lighting/Animation cards from stacking over Theme cards during startup/tab initialization
- **Surface auto-brightness visibility sync** — Surface `Shade` row now updates immediately on toggle and initial UI wiring so it stays hidden whenever `Auto brightness` is enabled
- **Surface preset startup regression** — closed the Background preset renderer correctly so the Surface preset row initializes on load again; mobile Info card build/date labels now stay aligned with the shared app build constants
- **Auto brightness slider visibility** — the Background `Shade` slider now hides when `Auto brightness` is enabled; Surface `Auto brightness` now follows the same interaction pattern
- **Undo toast noise** — `Model updated` undo toast now appears only for batch edits instead of single-part model tweaks
- **Export workspace preview parity** — in export framing workspace, `Background`, `Grid`, and `Build Plate` quick options now apply directly to the live export viewport and to exported output, restoring parity with prior mini-preview behavior
- **Build plate finish control scope** — clicking Build Plate `Matte/Satin/Gloss` no longer changes model finish mode; model finish handlers are now scoped only to model finish controls
- **Build plate shade visual mismatch** — strengthened build plate shade response so darker/lighter slider values are reflected more accurately on the live plate surface
- **Grid visibility with plate disabled** — grid now remains visible in the live preview when `Build Plate` is off; shadow-catcher no longer depth-occludes grid rendering
- **MP4 export late-frame stalls** — added WebCodecs encoder queue backpressure handling plus explicit `Finalizing video…` progress stage to avoid apparent hangs near the final frames (for example around `109/120`)
- **Startup transition consistency + staged fades** — both first-time (incognito/new) and returning refresh paths now follow one startup sequence (`Splash -> Full UI shell -> Model ready`) with matched fade transitions between stages
- **Rotation Time accuracy under load** — viewer animation now uses delta-time based updates (`controls.update(delta)` + time-based phase advance), so 5s/10s/etc. timing stays consistent even when FPS dips
- **Export workspace outside-click close** — while crop framing is active, clicking outside the crop frame now closes Export workspace; inside-frame clicks continue to orbit/pan/zoom as expected
- **Hard-refresh splash responsiveness** — restore completion now always marks the app as loaded and dismisses splash promptly; heavy demo auto-load is deferred and skipped for returning users to reduce startup blocking
- **Duplicate export surfaces reduced** — removed the canvas mini export card, removed the standalone crop button, and hid the duplicate export preview panel so export framing now centers on one live viewer surface
- **Multipart row-action bulk behavior** — row-level `Hide` and `Remove` now apply to the active checked selection when multiple parts are selected, matching bulk-edit expectations
- **Multipart checkbox visibility in multi-select mode** — on hover-capable desktop devices, row checkboxes now stay visible while multi-selection is active instead of disappearing until hover/focus
- **Model sync thumbnail distortion** — multipart summary thumbnails now render each part into square tiles, preventing stretched part previews when background sync is enabled
- **Model manager checkbox multi-select** — part selection checkboxes now correctly support multi-select; clicking a part button no longer clears other bulk selections
- **Model manager checkbox state consistency** — checkbox states now remain consistent across card/grid view switches and part selection interactions
- **Model manager checkbox visual parity** — the bulk toggle control beside `Card/Grid` now uses the same checkbox style and indeterminate behavior as row-level part checkboxes
- **Build plate shade response curve** — build plate shade now uses a dedicated capped curve (±20% brightness envelope) so tone changes are more controlled and predictable across colors
- **Build plate URL round-trip completeness** — URL serialization now always includes valid `bpc` and numeric `bps` values (including defaults such as `0`) to improve settings restoration consistency
- **Mobile / narrow viewport layout** — sidebar on narrow viewports (<900px) now maintains a minimum width instead of being squeezed; below 640px switches to full-height stacked layout with expanded canvas
- **Rotation Time hidden for still formats** — Export motion `Rotation Time` field and the motion controls block are now hidden when PNG or JPEG format is selected
- **Right-panel card shadow clipping** — added padding to the desktop v2 effects panel so card drop-shadows are no longer cut off at the panel edges
- **Single-model actions menu alignment** — exposed 3-dot menu is now anchored and centered correctly on the single-model selector card
- **Finish slider fill desync on hard refresh** — finish-strength slider track fill now re-syncs with the knob position on startup/restore (no user interaction required)
- **Mobile App Settings quick action** — top-right App Settings icon now opens the settings dock reliably in mobile/tablet layouts
- **Right-drag pan drift** — right-button drag is now constrained to vertical movement so framing stays horizontally centered

### Security
- **ZIP import hardening** — package import now validates entry paths (blocks traversal), enforces file-type allowlists (`.stl` + `package.json`), and applies archive/extract size and entry-count guards before loading STL buffers

## [2.1.2] - 2026-05-08

### Added
- **Upload STL decision modal** — when a model is already loaded, Upload STL now opens a modal with two explicit actions: `Add to existing plate` or `Create new plate / replace`
- **"Do not ask me again" for Upload STL** — users can persist the chosen Upload STL action as default (`add` or `replace`) and skip the decision modal on subsequent uploads
- **Reset all warnings switch (App Settings)** — new App Settings switch re-enables previously dismissed warning dialogs and resets upload decision prompting defaults

### Changed
- **Roadmap cleanup** — `_IGNORE/ROADMAP.md` is now open-items-only; completed work is tracked in `CHANGELOG.md`; stale roadmap pointer content was corrected
- **README updates** — documentation now reflects Upload STL choice behavior, per-part `Add` action, and warning reset flow

## [2.1.1] - 2026-05-08

### Added
- **Append STL workflow** — upload flow now supports adding incoming STL file(s) as new parts instead of only replacing; multipart action menus now include `Add STL`, and new parts are persisted to IndexedDB with per-part settings

### Fixed
- **Depth precision / layer overlap artifacts** — main camera clipping planes now auto-fit to orbit distance and model radius each frame instead of using a fixed `0.01..1e6` range; this significantly reduces z-fighting (grid/model/build plate overlap, especially visible from underside views)
- **Grid-vs-plate overlap** — ruler grid is now placed farther below the model/build plate using model-scaled offsets, reducing coplanar shimmer and bleed-through
- **Build plate underside shadow artifacts** — build plate material now uses `shadowSide = THREE.FrontSide` to avoid back-face shadow acne when viewing from below

## [2.1.0] - 2026-05-08

### Fixed
- **Per-part color/settings bleeding** — `getMaterial()` now accepts a `partSettings` argument and reads per-part roughness, metalness, reflection, and tone values from it instead of the global `textureTuneState`; all three call sites that rebuild multipart mesh materials now pass the individual part's settings object, so applying a preset or changing finish on one part no longer bleeds to all other parts

## [2.0.9] - 2026-05-08

### Fixed
- **Aliasing floor** — `getViewportPixelRatio()` now clamps to a minimum effective render resolution of `2.0×`, eliminating jagged edges on 1× DPR displays regardless of the `VIEWPORT_AA_SCALE` multiplier

## [2.0.8] - 2026-05-08

### Fixed
- **Thumbnail render performance** — introduced `dirtyPartThumbs` dirty-set so only the parts whose color/tone changed are re-rendered on each animation frame tick; a single live-view repaint follows after all dirty thumbnails are flushed, reducing per-drag GPU work from O(n) to O(1) for 22-part models

## [2.0.7] - 2026-05-08

### Fixed
- **Per-part colors round-trip** — package export now includes `model.partColors[]` and `model.partSettings[]`; import reconstructs each part's color and finish settings individually instead of applying a single global color to all parts
- **Import URL override** — URL params are stripped before `restoreSettings()` runs during package import so stored localStorage values are not silently overridden by the current URL

## [2.0.6] - 2026-05-07

### Fixed
- **Import settings restoration** — `importRotaterPackage()` now calls `history.replaceState` to clear URL query params before `restoreSettings()`, ensuring package-provided settings take effect instead of being overwritten by URL params

## [2.0.5] - 2026-05-07

### Added
- **Watermark toggle** — new `Watermark` checkbox in the Export quick-options row composites a subtle `rotater` brand label in the lower-right corner of all exported images and animations (GIF, MP4, PNG, JPEG); unchecked by default; persisted in session settings

### Fixed
- **App Settings card desktop positioning** — the `App Settings` dock is now anchored to the bottom of the right rail in the desktop v2 layout (`bottom: 16px`) instead of floating at the top (`top: 72px`), eliminating overlap with the Lighting Effects panel

## [2.0.4] - 2026-05-07

### Fixed
- **Splash dismiss tied to real render** — startup splash now fades out only after the first real frame is rendered (inside `loadPreparedGeometry`), not at bookkeeping completion, so the app is never shown in an unfinished state
- **Benchy load reliability contract** — `loadBenchyModel` now explicitly returns `true` on success and `false` on failure; `scheduleAutoDemoModelLoad` dismisses the splash on all code paths, including failed or suppressed loads

## [2.0.3] - 2026-05-06

### Fixed
- **Startup splash stuck on incognito / hard refresh** — `AUTO_LOAD_BENCHY_ON_IDLE` changed to `false` for deterministic startup; idle-callback dependency eliminated; splash is now always dismissed even if the auto-demo load is skipped

## [2.0.2] - 2026-05-06

### Fixed
- **Cache versions fully aligned** — `style.css`, `script.js` query-string cache busters and the in-app `ROTATER_BUILD` constant were all bumped to `2.0.2` together; eliminates stale-asset state where a mix of old CSS and new JS was served from browser cache

## [2.0.1] - 2026-05-06

### Fixed
- **Blank page regression** — `scheduleAutoDemoModelLoad` guard used `currentFileName !== '3dbenchy'` which blocked the auto-demo load when the default filename was `'model'`; guard updated to also allow `'model'` as a trigger name

## [2.0.0] - 2026-05-06

### Performance
- **Lighthouse startup score: 39 → 82** — deferred all session-restore work behind `requestAnimationFrame + setTimeout(0)` so the browser can paint the first frame before any JS-heavy initialization
- **Early first paint for returning users** — inline script in `<head>` restores theme, background colour, and `has-session` / `loaded` class flags synchronously from `localStorage`; returning users see a fully-styled viewport on the very first paint without waiting for the module
- **Startup splash screen** — branded `#startupSplash` overlay (centred Rotater logo on a purple gradient, 180 ms fade) masks the intermediate loading state for first-time and incognito visitors; fades out when the first model frame is ready

### Changed
- **`ROTATER_BUILD` cache-busting constant** — added to the inline `<head>` script; when the stored build ID does not match the current build, stale localStorage settings are cleared to prevent mis-restoring outdated state
- **Version bump to 2.0.x** — reflects the significant startup-path rewrite; `style.css` and `script.js` cache-busting query strings kept in sync with the build constant

## [1.8.10] - 2026-05-03

### Changed
- **Viewport anti-aliasing improved** — live viewer now uses stronger edge smoothing (higher viewport pixel ratio + non-preserved drawing buffer) for cleaner model silhouettes and plate/grid edges
- **Build Plate section introduced** — `Grid`, `Build Plate`, and plate appearance controls are now grouped in a dedicated `Build Plate` card instead of the `Background` card
- **Card reset scope updated** — Background reset now only affects background settings; Build Plate reset now handles grid/plate toggles and plate appearance defaults

## [1.8.9] - 2026-05-03

### Added
- **Curated motion controls in Export panel** — optional quick controls for mode, rotation time, and range are now available directly in the Export overlay
- **App Settings toggle for Export motion controls** — enabled by default and can be turned off for a cleaner export panel
- **Build plate size settings** — new preset dropdown with common bed sizes plus custom width/depth inputs

### Changed
- **Build plate default size** — plate now defaults to `220 x 220 mm` instead of auto-scaling very large from model footprint
- **Build plate sizing behavior** — selected preset/custom dimensions now drive the plate footprint deterministically

## [1.8.8] - 2026-05-03

### Added
- **Collapsed export safety prompt** — clicking `Export` while the export panel is collapsed now auto-expands the panel and shows a confirmation dialog with current export settings
- **"Don't show again" support** — the collapsed-export confirmation includes a checkbox to suppress future prompts

### Changed
- **Advanced App Settings toggles** — added `Auto UI changes` and `Export collapsed confirmation` switches so the behavior can be disabled/reset without clearing storage

## [1.8.7] - 2026-05-03

### Added
- **Fast import workflow** — new `Import Package` action in App Settings accepts both `.stl` and Rotater `.zip` package files for faster iteration/testing
- **Build Plate advanced controls** — Build Plate now includes direct color picker, shade slider, and finish mode (`Matte` / `Satin` / `Gloss`)
- **Collapsible control cards** — Model, Background, Lighting Effects, and Animation cards now support collapse/expand

### Changed
- **Background option layout** — key toggles (`Auto brightness`, `Grid`, `Build Plate`) are now arranged horizontally
- **Card header actions** — reset controls are now icon-only and positioned directly after each card label; collapse control moved to the far right
- **Build Plate rendering quality** — plate texture now uses anisotropic filtering for cleaner detail at glancing camera angles

## [1.8.6] - 2026-05-03

### Changed
- **Build Plate controls simplified** — removed Build Plate texture toggle + strength slider and replaced them with a single `Gold Plate` toggle (Gold or Black finish)
- **Build Plate texture rendering updated** — plate now always uses a CSS-style procedural textured finish with deterministic grain/grid detail for stable visuals

### Compatibility
- Legacy Build Plate URL keys (`bpt`, `bps`) are still read for migration; `bpc` is now used for color state (`gold` / `black`)

## [1.8.5] - 2026-05-03

### Added
- **Background Build Plate (Phase 1)** — new `Build Plate` toggle in the Background card adds a solid slicer-style floor plane under the model, color-matched to the active background tone
- **Build Plate texture controls (Phase 1)** — new `Texture` toggle + `Texture` strength slider (0–100%) in Background card, with live updates and persisted settings

### Changed
- **Background reset scope expanded** — Background card reset now also resets Build Plate and Build Plate Texture controls to defaults
- **Settings persistence/URL coverage** — Build Plate state and texture strength are now saved/restored via local settings and URL params (`bp`, `bpt`, `bps`)

## [1.8.4] - 2026-05-03

### Fixed
- **Export duration mismatch** — exported GIF and MP4 duration now exactly matches the selected Rotation Time (was ~40% too short due to a `2.5×` speed multiplier being double-applied to both live rotation and the export frame count; multiplier removed and `exportFrames()` now derives duration directly from `getSecondsPerRevolution()`)
- **Initial rotation speed on model load** — OrbitControls `autoRotateSpeed` is now initialised from the current Rotation Time setting instead of the hardcoded `2.5` fallback
- **Pause state preserved on model upload** — replacing or uploading a new model while paused no longer auto-resumes rotation; `isPaused` is respected and `controls.autoRotate` stays `false`

### Changed
- **Whole dimensions HUD is now the unit toggle tap target** — clicking anywhere on the W · D · H strip switches between mm and Imperial (`in`); the small "Imperial / Metric" pill button is removed; HUD has `cursor: pointer` and a hover highlight; keyboard-accessible via Tab + Enter / Space

## [1.8.3] - 2026-05-02

### Changed
- **Grid toggle simplification** — removed the duplicate bottom HUD Grid switch; Grid is now controlled from Background and Export only
- **Unified Grid labels** — Background toggle label now matches Export as `Grid`
- **Export background toggle** — added a shared `Background` quick toggle visible for all export formats, with compatibility sync to existing transparent export settings
- **Precision-gated finish controls** — finish strength slider/group now appears only when `Fine tuning for precise control` is enabled
- **Theme button icon parity** — App Settings dark mode button now uses the same bedtime / bedtime_off icon pair as the canvas theme toggle

### Documentation
- Updated README usage details for speed units, export quick options, and roadmap location
- Updated roadmap placement to Rotater `_IGNORE` path and cleaned the active roadmap to undone-only items

## [1.8.2] - 2026-04-30

### Changed
- **Tab consolidation to segmented pair** — sidebar primary tabs are now `Theme` and `Effects`, with lighting and animation controls grouped under Effects
- **Export stays as primary action button** — Export remains a standalone header button instead of becoming a tab
- **Download moved into Export panel** — package download is now located inside the Export modal for a single export-focused workflow

### Fixed
- **Model Sync live update after preset changes** — when Background is set to Model Sync, changing model preset/color now updates the synced background immediately without needing refresh

## [1.8.1] - 2026-04-30

### Changed
- **Final Theme panel polish pass** — sidebar cards, dropdowns, tabs, and primary actions now share a tighter 16 px card radius and more consistent button geometry
- **Unified model slider presentation** — Shade, Sheen, Contrast, and Highlights now use the same thumb size, track height, and snap-dot alignment logic for a cleaner visual rhythm
- **Header action cleanup** — Export and Download buttons now use the same sizing system as the rest of the sidebar controls for a more cohesive top bar

### Fixed
- **Multipart part removal flow** — filename dropdown rows can now remove parts all the way down to a single remaining STL instead of stopping at two parts
- **Model preset hover confusion removed** — model preset cards now apply only on click, preventing accidental preview changes while interacting with nearby UI

## [1.8.0] - 2026-04-30

### Added
- **Download package ZIP** — the header Download action now exports a single ZIP containing `package.json` plus the original STL file or all multipart STL source files
- **Dedicated roadmap** — added `ROADMAP.md` to track recently completed work and the upcoming ZIP import workflow

### Changed
- **Large workflow release consolidation** — multi-part model editing, contextual dropdowns, inline tab icons, the Lighting tab split, and the Export modal are now documented together as the current default experience
- **Export modal density refined** — format/quality controls and preview area are now constrained to a tighter content column for a cleaner, less stretched layout
- **Packaging direction reset** — share/copy behavior has been replaced by file-based package export in preparation for future package import

### Fixed
- **Multipart filename expander gating** — the filename expansion affordance now only appears for multipart models and correctly opens its part list menu
- **Contextual dropdown visibility** — part selector UI now stays hidden for single-STL sessions and only appears when multipart + Background Model Sync requires it

## [1.7.35] - 2026-04-30

### Added
- **Inline tab icons** — Theme, Lighting, and Animation tabs now use inline SVG icons for tighter visual weight control and fewer external icon dependencies
- **Model header quick action** — Copy Settings is back inside the Model card header, aligned to the right for faster sharing while tuning
- **Multipart filename expansion menu** — the filename chip can now expand in multipart mode to list every part, with per-part Replace and Remove actions

### Changed
- **Upload language normalized** — Select/Replace STL labels are now consistently `Upload STL`
- **Header action priority updated** — Export is now emphasized at the top-left of the sidebar header with a larger button and the download icon path
- **Reset Settings relocated** — moved to the bottom-right of the control panel for cleaner top-of-panel hierarchy
- **Tab naming clarity** — tab label `Light` renamed to `Lighting`

### Fixed
- **Background model-sync dropdown reliability** — source-part selector now maintains visible selected text and stable open/close behavior
- **Part thumbnail framing in Model dropdown** — thumbnails now frame each part using per-part bounds so previews are no longer zoomed out
- **Thumbnail artifacts removed** — ruler/grid helper visibility is suppressed during thumbnail rendering so previews show only STL geometry
- **Background white/black swatch contrast** — White and Black background preset circles now include visible outline strokes

## [1.7.33] - 2026-04-30

### Changed
- **Background model-sync flow moved back to preset thumbnail** — removed the separate "Sync Background to Model" checkbox row and restored model-sync as a dedicated background preset card that reveals the source-part dropdown only while active
- **Model-sync source dropdown compacted** — reduced selected/option thumbnail sizes and text scale so the source selector no longer dominates the Background card or clips near section boundaries
- **Dropdown chrome simplified** — removed filled card backgrounds from the part/source dropdown buttons and their internal canvases for a lighter outline-first treatment
- **Thumbnail cards switched to outline style** — model/background preset cards now use transparent card fills (no light-purple blocks)
- **Finish selector restyled to iOS-like segmented control** — sheen mode now sits on a solid segmented track with active-pill emphasis and no extra wrapper outline
- **Finish strength behavior updated for density** — finish strength is now hidden unless "Fine tuning for precise control" is enabled; when fine tuning is off, Matte/Satin/Glossy map to high/mid/low built-in strengths
- **Default sheen updated to Satin** — default shading baseline now initializes to Satin (`phong`) for new sessions

### Fixed
- **Part/source thumbnails no longer show drop shadows** — thumbnail rendering now suppresses shadow-catcher contribution so the mini previews match the cleaner no-shadow UI cards

## [1.7.34] - 2026-04-30

### Added
- **Icon tabs for primary control groups** — sidebar tabs now include dedicated icons for Theme, Light, and Animation

### Changed
- **Lighting controls moved to dedicated Light tab** — Lighting Effects is no longer inside Theme and now lives in its own tab for clearer separation
- **Export moved out of sidebar tab into modal** — Export controls now open from a dedicated header button and render in a modal while preserving the same format/options/preview workflow
- **Header primary action switched to Export** — the top-right header action is now an orange Export button, and Copy Settings moved into the Export modal

## [1.7.32] - 2026-04-29

### Added
- **Multi-part STL import** — selecting/dropping multiple STL files now loads them as a single aligned object, preserving shared CAD coordinates so multi-color part sets remain stacked correctly
- **Part-aware model controls** — in multi-part mode, Model controls now target the selected part (color, shade, shading mode, and finish/reflection profile persist per part)
- **Preset hover preview (selected part)** — hovering a model preset temporarily previews that preset on the currently selected part before click-to-apply
- **Model Sync source picker** — when Background is set to Model Sync with a multi-part model, a source-part selector controls which part drives the background color

### Changed
- **Model presets are model-only** — preset clicks now apply model attributes without forcing background or lighting changes
- **Ruler lines replaced with 3D grid reference** — the "Lines" toggle is now a "Grid" toggle; enabling it drops a `GridHelper` plane beneath the model in the Three.js scene for a stable positional reference instead of the previous projected edge-line overlay
- **Grid state persisted** — grid visibility is now stored in the `rg` URL parameter and localStorage (`rulerGridVisible`) with backward-compatible fallback from the old `rl` / `rulerLinesVisible` keys
- **Dynamic ruler overlay disabled** — the canvas-2D projection-line drawing path (`drawRulerOverlay`, `getRulerScreenLayout`) is retained in code but permanently disabled via `RULER_DYNAMIC_LINES_ENABLED = false`; the W/D/H numeric HUD remains unchanged

## [1.7.20] - 2026-04-30

### Fixed
- **Fine tuning no longer snaps** — toggling fine tuning now also sets `step="any"` on all range inputs (restoring original step on deactivate), so the browser itself no longer snaps to grid positions
- **Hard refresh no longer reverts settings** — `isDynamicBg` (auto adjust), `activeBgPreset`, and `activeModelPreset` are now saved to `localStorage` and encoded in the shareable URL so they survive a full refresh
- **Auto adjust preserves saturation** — background lightening now uses HSL `L` adjustment (adds ~75 % of the gap to white) instead of `lerp(white)`, which was desaturating vivid model colors
- **Matte/Glossy slider inverted correctly** — slider left = Matte (high roughness), slider right = Glossy (low roughness); Chrome preset now defaults to the Glossy end
- **Matte slider value display** — removed the percentage; shows "Matte" at the far-left and "Glossy" at the far-right, blank in between

### Changed
- **Background "Model" preset renamed to "Model Sync"** — clarifies that the BG color tracks the model color
- **Reflection slider removed** — the Reflection row is hidden from the Model card (underlying state is still saved/restored for preset compatibility)
- **Slider group spacing increased** — gap between distinct slider rows in Model and Lighting Effects cards increased from 6 px to 14 px for easier scanning

### Removed
- **Leftover fix/patch scripts deleted** — `fix_*.py`, `fix_*.js`, `plan*.py`, `rewrite_presets.py`, `update_*.js`, `update_*.py`, `layout.txt`, and the `presets/` directory have been removed from the repo root

## [1.7.19] - 2026-04-29

### Added
- **Model background preset** — new "Model" swatch in the Background card syncs the canvas background to the active model color; swatch renders with the same per-material sphere overlay as the model selector so the pairing is visually obvious
- **Fine tuning mode** — checkbox "Fine tuning for precise control" (tooltip: "Remove snap points") hides snap-point dots and disables grid-snap so sliders can be dragged to any value
- **5-point snap enforcement** — all sliders snap to five evenly-spaced positions via a capture-phase `input` listener; bypassed when fine tuning is active
- **Per-material sphere visuals** — Chrome, Ink, Ceramic, Clear, Chocolate, Gumball, and Gold presets each render a physically-plausible multi-layer radial-gradient sphere thumbnail using a shared `THUMB_STYLES` map
- **Contrast and Highlights moved to Model card** — now grouped with Tone, Matte, and Reflection for a single place to tune model appearance

### Changed
- **Sidebar cards always expanded** — removed Show All / Show Less collapsible sections; all sliders are permanently visible
- **Matte slider** (was Roughness) — label renamed to "Matte"; value display shows `Glossy X%` (inverted: 0 roughness = Glossy 100%, full roughness = Glossy 0%)
- **Lighting labels** — "Light" → "Brightness", "Shadows" → "Shadow Intensity", "Light Source" → "Light Position"
- **Lock light always on** — removed the "Lock light to camera" checkbox; light lock is permanently enabled (camera-relative lighting is always active)
- **Automatically adjust brightness** — renamed from "Auto adjust based on model color"; applies a lighter shade of the selected background (or model color when Model preset is active) rather than a complementary tint
- **Custom swatches blank when unselected** — both the model and background Custom swatches show only the rainbow ring until selected; sphere fill and overlay appear only when active
- **Preset order** — Ceramic is now slot 1, Ink slot 2, Chrome slot 3 (unchanged: Clear 4, Chocolate 5, Gumball 6, Gold 7)
- **Removed sub-headings** — "Material" and "Background Fill Color" section labels removed from their cards
- **Reduced slider row spacing** — gap between label rows tightened from 10 px to 6 px; label-to-track gap from 4 px to 2 px

### Fixed
- **Preset not showing as selected** — synthetic `input` / `change` dispatches from preset click handlers no longer reset `activeModelPreset` to `'custom'` (guarded by `ev.isTrusted`)
- **Auto adjust checkbox acting on wrong color** — preset clicks no longer unconditionally force `isDynamicBg = false`; checkbox state is read on every preset click so auto-adjust persists across preset switches
- **Model BG swatch sphere overlay** — swatch updates both background color and gradient overlay whenever the model color picker changes

## [1.7.18] - 2026-04-27

### Added
- **Dynamic Lighting Rotation**: Added a toggle in Texture Tuning to lock lighting direction to the camera. Disabling it allows directional lights and shadows to rotate independently as the model rotates rather than always staying fixed to the view.

## [1.7.17] - 2026-04-27

### Fixed
- Flawless sub-pixel mathematical translation between viewport camera bounds and UI layout when confirming custom crop boxes, stopping the model from 'jumping' inside the mini preview
- Auto-zooming into newly drawn crop boxes intelligently so that the model doesn't get clipped before you even have a chance to frame it
- **MP4 Export Error**: Automatically upgraded the H.264 video encoder level from `4.0` (0x28) to `5.1` (0x33) for High quality exports (2048x2048+) to prevent codec crashes when exceeding pixel limits.

## [1.7.16] - 2026-04-27

### Added
- **Developer Defaults**: Added `DEFAULT_SETTINGS_URL` at the top of `script.js` to easily enforce default camera formatting, framing, and texture values based on any rotater share parameter URL.

## [1.7.15] - 2026-04-27

### Changed
- **Crop Dimensions Dock**: Kept crop aspect ratio icons rigidly right-aligned in crop mode. Added visible text labels to the aspect ratio dimension icons and enhanced the active state visualization.
- **Export Preview**: Added a visible border and subtle shadow to the mini preview panel to prevent it from blending seamlessly into the white background.
- **Texture Badge UI**: Converted the 'NEW' badge to be unclickable, adjusted its placement to avoid overlapping the tuning filter button, and configured it to dismiss automatically upon expanding the panel.

## [1.7.14] - 2026-04-26

### Added
- **Image dimension presets for still export** — PNG/JPEG now support quick aspect presets: **1:1**, **4:5**, **9:16**, **16:9**, **4:3**
- **Dimension preset cards** — replaced the old dropdown with thumb-style selectable cards in the Export section
- **Texture updates callout** — tune button now shows a minimal **NEW** badge plus a compact hover/focus popover with recent texture additions

### Changed
- **Still-image render pipeline** — PNG/JPEG are now rendered offscreen at the selected aspect and quality size, independent of viewport aspect
- **Live preview sync** — export preview aspect and estimated output dimensions update immediately when format, quality, and dimension preset change

### Fixed
- **Texture updates popover hover stability** — popover no longer closes immediately while moving pointer from tune icon into the popover
- **Preview aspect stale states** — reduced stale preview cases during fast export setting changes

## [1.7.10] - 2026-04-26

### Added
- **Highlights slider** for brighter white/specular response in the Texture tune panel
- **Shadows strength slider** (0-100) replacing binary shadow on/off behavior
- **Light Source slider** to rotate shadow direction around the model
- **Light Height slider** to control shadow length/angle depth

### Changed
- **Texture tune icon hit area** — icon remains compact while adding an invisible larger tap target for easier mobile interaction
- **Texture tune icon alignment** — right-aligned with slider value column for visual consistency
- **Texture tune sliders layout** — rows now fully stretch within the Texture card with cleaner spacing

### Fixed
- **Shadow reliability across model scales** — shadow light/frustum now scales with model dimensions so shadows remain visible on small and large STL units
- **Slider dot inconsistency** — snap-dot overlays are now disabled inside the Texture tune panel so all texture sliders render consistently

## [1.7.5] - 2026-04-26

### Changed
- **Toon replaced with Clay** — third texture mode is now **Clay** (matte, non-metal) instead of Toon
- **Texture tuning controls expanded** — added **Contrast** slider and **Shadows** toggle for optional true shadow rendering
- **Texture tune icon styling** — moved to the far top-right of the Texture box and simplified visual treatment (clean icon style, no circular badge)

### Fixed
- **Mode-specific tune rows now hide correctly** — Metalness appears only for Metal mode; non-applicable rows are hidden per selected texture mode
- **Legacy shading migration updated** — stored `flat` and `toon` settings now restore as `clay`

## [1.7.4] - 2026-04-26

### Added
- **Texture tune panel** — new sliders panel (opened via tune icon in the Texture card) to customize material response in real time

### Changed
- **Texture card action icon** — added `tune.svg` button at the top-right of the Texture box to open/close tuning controls
- **Shared Metal/Phong tuning controls** — both modes now share real-time sliders for Light, Roughness, and Reflection (both use `MeshStandardMaterial`)
- **Metal-specific tuning** — Metal mode now includes a dedicated Metalness slider
- **Flat replaced with Toon** — third texture mode is now Toon (stylized stepped shading) instead of Flat

### Notes
- Legacy saved `flat` shading values are automatically migrated to `toon` on restore.

## [1.7.3] - 2026-04-24

### Changed
- **Export filenames now include key settings** — exported files now append animation mode (`spin`, `tilt`, `wobble`), quality (`low`, `medium`, `high`), and relevant modifiers:
  - GIF: `loop` / `noloop`, plus `dither` and `transparent` when enabled
  - PNG: `transparent` when enabled
  - MP4/JPEG: mode + quality tags

### Notes
- Roadmap item for "save filename with settings" is now completed for mode/quality/modifier tags.

## [1.7.2] - 2026-04-23

### Changed
- **Default viewport framing tightened** — reduced the full-viewport fit scale used by initial placement and "Level and reframe" so models appear less zoomed out by default

### Fixed
- **Reset Settings empty-page flash** — reset flow now preserves the session flag before reload, preventing a brief flash of the empty upload state during reinitialization

## [1.7.1] - 2026-04-23

### Fixed
- **"Level and reframe" wrong angle after pan** — azimuth was computed from the camera's world-space position instead of relative to `controls.target`; after panning the model, the reset button would place the camera at an unexpected angle. Fixed by using `getOrbitFrameState()` (which subtracts the orbit target) to get the correct relative azimuth
- **"Level and reframe" stale zoom** — `camera.zoom` was not reset to 1 on click; a zoom value leaked from a restored session could make the model appear unexpectedly large or small after the reset

## [1.7.0] - 2026-04-23

### Changed
- **Crop mode redesigned as a modal overlay** — entering crop mode now dims and blurs the area outside the crop frame, hides all other canvas controls, and shows two centred action buttons: **Cancel** (ghost) and **Keep** (primary purple). Clicking outside no longer cancels; use the buttons or Esc / Enter
- **Unified transparent-background checkbox** — GIF's inverted "Background" checkbox and PNG's separate "Transparent" checkbox are replaced by a single **Transparent** checkbox (unchecked = opaque, default) shown in both GIF and PNG option panels; state is kept in sync when switching formats
- **MP4 High quality codec level** — encoder now uses AVC level 4.0 for resolutions above 720 px, fixing the "coded area exceeds maximum" error at 1080 p

### Fixed
- **GIF dither crash** — `nearestColorIndex` was called with three separate `r, g, b` arguments instead of a `[r, g, b]` array; the `g` value landed in the distance-function slot and threw "s is not a function"
- **Transparent GIF blank output** — palette was being passed as a flat `Uint8Array` to `writeFrame`; gifenc expects a 2D `[[r,g,b],…]` array; fixed by using `pal.slice()` padded to 256 entries
- **Dither and transparent GIF encoding speed** — replaced per-pixel `nearestColorIndex` O(N·palette) loop with a 32³ LUT cache (dither path) and gifenc's own rgb565 hash table via `applyPalette` (transparent path); encoding is now comparable in speed to the non-dither path

## [1.6.6] - 2026-04-23

### Changed
- **Reset moved beside Crop action** — in crop mode, reset now appears in the bottom-right control row directly to the left of the orange **Crop** confirm button
- **Reset is now icon-only** — the crop reset control uses only the red X icon for a cleaner compact layout

## [1.6.5] - 2026-04-23

### Changed
- **Main crop control now confirms crop** — clicking the bottom-right crop button enters crop mode; while active, that same button switches to an orange check-style **Crop** confirm button that applies framing (instead of relying on a separate in-frame confirm action)
- **Crop reset control repositioned** — the in-frame **Reset** action now sits at the upper-right of the crop box for clearer separation from bottom canvas controls

### Fixed
- **Crop-mode button clutter** — removed the duplicate in-frame crop confirm control so crop mode has one clear confirm path (main orange crop button) and one clear cancel path (Reset / Esc / outside click)

## [1.5.0] - 2026-04-21

### Added
- **Viewport zoom is now independent of export zoom** — zooming the main viewer is purely cosmetic; the mini preview and all exported files always use the stored export-frame distance
- **Crop mode zoom-to-export** — enabling the export frame (crop icon) lets the viewport zoom directly control the export framing; zooming in/out updates the mini preview and the export in real time
- **Export zoom persists** — when crop mode is closed, the zoom level set inside crop mode is baked in as the new export distance for both the preview and subsequent exports
- **Mini preview uses offscreen render target** — the preview thumbnail is rendered into a dedicated WebGL `RenderTarget` (sized at device pixel ratio) rather than reading from the live canvas, eliminating flicker in Safari and keeping the main viewport unaffected

### Fixed
- **Spin Range showing 20° on first load** — `updateRangeSliderForMode` was calling `.innerHTML` on `tiltRangeTicks`/`wobbleSpinRangeTicks` elements that don't exist in the HTML, causing a silent throw that left the Range slider at its HTML default (20°); both accesses are now null-guarded and the HTML default is corrected to 360°
- **Wobble showing two range sliders** — the extra "Spin Range" slider in Wobble mode is now hidden; all three modes show only Speed + Range
- **D-pad position affected by hint tooltip** — `.canvas-bottom-center` now uses `left:0; right:0; justify-content: center` so the D-pad stays centered regardless of tooltip visibility; the hint floats independently at the bottom-left
- **Mini preview blurry** — preview canvas now renders at `offsetWidth × devicePixelRatio` instead of a fixed 256 px
- **Export frame button icon** — updated to crop icon (matching the crop-mode function)

## [1.4.0] - 2026-04-21

### Changed
- **Default texture** → Metal (was Phong); texture order is now Metal · Phong · Flat
- **Ruler visible only with export frame** — dimensions HUD now shows/hides together with the export frame overlay
- **Logo height** → `clamp(32px, 6vh, 64px)` (was fixed 8vh / 44px min)
- **Camera on load** — `placeCamera()` is deferred to the first rAF after `syncCanvasSize()`, so `camera.aspect` is correct before computing fit distance; model now loads at a comfortable size without clipping
- **"Level and reframe"** — uses the same aspect-aware formula as `placeCamera()`; both place the camera at 0° elevation with `modelRadius × max(1, 1/aspect) / tan(halfFov) × 1.8` distance, giving consistent framing across all viewport shapes

### Fixed
- **Ruler `hidden` attribute ignored** — added `.ruler-hud[hidden] { display: none }` to override the flex display rule
- **Stray closing brace** in `script.js` from a previous edit causing a parse error

## [1.3.1] - 2026-04-19

### Changed
- **Tooltip audit** — reviewed all button tooltips for clarity and accuracy:
  - "Toggle export frame" → "Show export frame" / "Hide export frame" (toggles with button state)
  - "Pause/Resume rotation" static text → "Pause rotation" (JS already updates it on state change)
  - "Reset camera view" → "Level and reframe" (describes the actual action: level to 0° then fit model)
  - `×` badge button on the filename chip: shows "Load your own model" when the demo is active (clicking opens file picker) and "Reset to Benchy" when a user file is loaded (clicking returns to the demo)

## [1.3.0] - 2026-04-21

### Added
- **Dimensions ruler** — new ruler toggle button (⬜ icon, bottom-right canvas area) shows a W · D · H badge in millimetres at the top of the viewport; dimensions are read directly from the STL bounding box (x=width, y=depth, z=height in slicer Z-up convention)

### Fixed
- **Keyboard ↑ / ↓ orbit** — `ArrowUp` and `ArrowDown` keyboard shortcuts now match the on-screen camera buttons (both previously used the pre-flip direction after the v1.2.1 button swap)

### Changed
- **Code cleanup** — removed unused `EXPORT` backward-compat shim getters (`size`, `fps`, `bitrate`, `dither`), unused `gSize`/`bitrate` destructuring in `updateEstimate`, and a stale comment stub for removed segmented-quality buttons

## [1.2.2] - 2026-04-19

### Changed
- **Sidebar toggle — no flash** — renderer re-renders immediately after `setSize()` so the canvas is never composited blank during the sidebar open/close transition
- **Sidebar toggle — no stretch** — ResizeObserver is throttled to one sync per animation frame (rAF), keeping the WebGL resolution in step with the CSS transition at every frame
- **Sidebar toggle — larger hit area** — collapse/expand tab widened to 20×64px (was 14×48px) for easier clicking
- **Sidebar toggle — blueberry styling** — tab background is `--palette-blueberry-200` with a `--palette-blueberry-300` border, matching the app colour palette

## [1.2.1] - 2026-04-19

### Changed
- **Export frame dim** — dim overlay is now drawn directly on the frame canvas instead of separate `backdrop-filter` divs; eliminates the hard CSS edge that appeared as a line at the bottom of the frame
- **Export estimate** — removed unreliable file-size predictions (MB); export info now shows frames + duration only
- **Duration display** — total animation duration is shown in bold at normal text colour; no longer buried in muted estimate text
- **Single border in export options** — removed redundant inner `border-top` from the estimate row; only the section-level border is shown
- **Camera up / down reversed** — ↑ arrow now orbits up (increases elevation) and ↓ arrow orbits down, matching natural expectation
- **Recenter snaps to horizon** — the ⟳ reset button now levels the camera to 0° elevation (horizontal) before reframing, instead of the previous 30° default tilt
- **"Copy Link" renamed to "Copy Settings"** — button label more accurately describes that it copies the shareable settings URL

## [1.2.0] - 2026-04-18

### Added
- **Live export preview** — square thumbnail in the Export panel mirrors the export frame crop in real time, updated every 4 frames
- **Figma-style export UI** — Format dropdown (GIF / MP4 / PNG / JPEG) and Quality dropdown (Low / Medium / High) replace the old per-format button grid; selecting a format reveals only its relevant options; a single orange **Export** button dispatches to the correct handler

### Changed
- **Frame overlay toggle** — toggling the frame guide overlay no longer moves the camera; it is a pure visual indicator only
- **Reset camera always fits to frame** — the ⟳ button now always calls `fitToFrame()`, correctly centering the model inside the export square regardless of whether the overlay is shown
- **Frame recenters on resize** — `syncCanvasSize` calls `fitToFrame()` on window/sidebar resize when the frame is active, so framing never drifts
- **Speed slider** — reduced to 5 non-linear snap points: **0.5× · 1× · 2× · 3× · 5×** (previously 8 linear steps from 0.5× to 4×); slider index maps to value via `SPEED_VALS`
- **MP4 repeat removed** — video always exports a single play cycle; the Repeat select has been removed from the MP4 options panel
- **Export button above preview** — the Export button is placed above the live preview thumbnail so it is always immediately reachable
- **Preview label** — "Preview" label uses the same small-caps style as the Format and Quality labels

### Fixed
- `EXPORT._preset` shim now reads from `#exportQuality` (was incorrectly reading from removed `#gifQuality`)
- Removed dead `exportAdvanced` and `mp4LoopCount` keys from `saveSettings`
- Duplicate `mp4LoopCount` change listener removed

## [1.1.0] - 2026-04-18

### Added
- **Export progress bar** — thin fill bar above the status label fills proportionally as frames are captured and encoded (GIF and MP4); hidden when idle
- **Collapsible sidebar** — chevron button in the sidebar header collapses the controls panel to a 40 px rail; state persists in `localStorage`
- **Spin CW/CCW hover preview** — when Spin mode is active, hovering the Spin card previews the opposite direction so the user can see the change before clicking

### Changed
- **Maintain zoom on STL replace** — loading a new STL via "Replace STL" preserves the camera distance so the new model appears at the same zoom level
- **Quality dropdown labels** — renamed to **Low / Medium / High** (previously "Web · 480p 15fps", etc.); applies to both GIF and Video quality selects
- **Export filenames prefixed** — all auto-generated exports (PNG, JPEG, GIF, MP4) are now prefixed with `Rotater_`
- **Export UI restructured** — GIF and Video each have a dedicated format block with inline Save button; quality select inline with block header
- **MP4 loop control** — replaced range slider with checkbox + count select (1–6 repeats)
- **Transparent Background** — renamed from "Opaque background" (inverted semantics); unchecked = opaque (default), checked = transparent (PNG only)
- **Quality slider label** — renamed from "JPEG Quality" to "Quality"; label row moved above slider to match motion sliders
- **Slider labels** — removed bullet prefix, weight 600, `--color-label` color
- **Pause/Reset camera** — Pause button moved to canvas bottom-right; Reset camera moved to D-pad center
- **Video estimate** — applied 0.55 correction factor for more accurate MP4 time estimates
- **Animation export status** — separate `exportStatusAnim` span from the image status span

## [1.0.6] - 2026-04-16

### Fixed
- **Spin direction toggle** — re-clicking Spin now correctly toggles CW/CCW when using the demo Benchy; the demo load path was missing `* spinDir` when setting `autoRotateSpeed`
- **Tilt/Wobble start position** — loading a new model while in Tilt or Wobble mode now resets `tiltPhase` to 0 and the mesh to its neutral orientation, so animation always begins from upright
- **Tilt/Wobble/Spin-arc range semantics** — the Range slider now represents total peak-to-peak swing (e.g. Range 20° → model tilts ±10° from center), matching the expected "start at 0, tilt 10 one way, 20 to the other end" behavior
- **Export canvas freezes on last frame** — after frame capture completes the visible canvas is now refreshed once so the view is live again while encoding happens
- **Range slider missing from Spin** — added `?v=1.0.6` version strings to `style.css` and `script.js` to force cache invalidation

## [1.0.0] - 2026-04-16

### Added
- **Wobble animation mode** — combines Spin and Tilt: continuous camera orbit plus simultaneous mesh-tilt oscillation (gyroscope/spinning-top precession effect)
- **D-pad orbit controls** — 3×3 grid of arrow buttons at the bottom-center of the viewer snap the camera azimuth or elevation to the nearest 45° increment in that direction; replaces the old Front/Back/Left/Right/Top/Bottom face buttons
- **Keyboard orbit** — Arrow keys (←↑↓→) trigger the same 45° orbit snaps as the D-pad buttons; Space still pauses/resumes
- **Pencil overlay on color swatches** — semi-transparent overlay with centered pencil icon appears on hover to indicate the swatch is clickable

### Changed
- **Pause button** — moved into the D-pad center cell; pressing it (or Space/Enter) pauses/resumes rotation
- **Camera reset button** — moved to bottom-right floating position (previously held by Pause)
- **Camera buttons are camera-only** — orbit buttons never move the mesh; mesh orientation is controlled only by animation modes
- **Spin mode** — Range slider now goes 45°–360°; at 360° = full continuous spin, below 360° = azimuth oscillation (arc back-and-forth)
- **Wobble reset** — switching to Wobble always resets mesh to its neutral STL orientation, not whatever Tilt left behind
- **`placeCamera()` always resets `camera.up`** — fixes "stuck upside-down" bug when returning from extreme vertical camera angles
- **Swing mode removed** — replaced by Spin with Range < 360°
- **Face buttons removed** — replaced by the D-pad orbit control
- **Color swatch hover** — border now matches Texture/Animation hover style (lighter lift + shadow)

### Fixed
- Clicking Top/Bottom camera buttons no longer rotates the mesh — camera orbits only
- Camera reset after vertical snap no longer leaves the scene upside-down
- Switching to Wobble after using Tilt no longer inherits the tilted base position



### Fixed
- **Slider value display** — value (e.g. "1.0×", "30°") moved from floating bubble into the label header row; no longer overlaps the reset button or the label text
- **Tick mark clicks** — clicking the min/max tick labels (e.g. "0.5×", "4×") no longer accidentally moves the slider

## [0.24.3] - 2026-04-15

### Added
- **Slider reset buttons** — circular revert button appears in the Speed and Tilt label rows only when the value differs from its default; click snaps back to default (Speed: 1.0×, Tilt: 30°)

### Changed
- **Sidebar width** — reduced from 400 px to 350 px
- **Filename chip** — removed ↩ indicator from cached model filenames

## [0.24.2] - 2026-04-15

### Changed
- **Section order** — sidebar boxes reordered to: Color → Texture → Animation → Export
- **"Exports" renamed** → "Export"

## [0.24.1] - 2026-04-15

### Fixed
- **Toggle icons** — check and X SVGs are now centred in their respective halves of the track (no longer tight to the edge)
- **Pause button** — disabled (faded, non-interactive) when Animation is toggled off
- **Filename chip** — chip area is no longer clickable; only the × button triggers file replacement

### Changed
- **Reset settings** — slightly darker text/border (`--color-label` at 80% opacity); background removed (text + stroke only); hover still goes red

## [0.24.0] - 2026-04-15

### Added
- **Toggle icons** — check (✓) and X icons embedded inside both toggle thumbs; check visible when ON, X visible when OFF

### Changed
- **Animation toggle** — turning off the Animation toggle now pauses rotation; re-enabling resumes
- **Unified toggles** — Animation power toggle reuses the same track/thumb markup and 28×16 px size as the GIF Loop toggle
- **Toggle ON color** — both toggles use `--color-primary` (blueberry) for the active state
- **Section headings** — font size increased to `--text-md` (13 px); switched from ALL CAPS to sentence case
- **Label gap** — spacing between Speed/Tilt/Range label text and slider reduced
- **"Rotation" → "Animation"** — section header renamed
- **Rotation preview animations** — tilt and swing previews now start from rest (no jump)
- **Slider tooltip** — font size increased from 10 px to 11 px
- **Reset settings button** — moved to `position: fixed` at viewport bottom-right

## [0.23.0] - 2026-04-15

### Added
- **Thumbnail card borders** — selected card gets a white inner border + blueberry ring for clear active state
- **Animation section toggle** — power toggle in the section header enables/disables all animation
- **Loop label** — "LOOP" text label added next to the GIF Loop toggle
- **Animation timing** — GIF/MP4 frame timing tightened for spin, tilt, and swing modes

### Changed
- **Thumbnail hover lift** — rotation cards animate upward on hover with a blueberry drop shadow
- **Selected card ring** — uses `--color-primary` to stay in sync with theme

## [0.22.0] - 2026-04-15

### Changed
- **GIF loop control** — restored as a "Loop forever" checkbox toggle positioned below the GIF button; checked = looping GIF (default)
- **Sliders** — simplified tick labels to only show min/max values; current value now appears as a floating tooltip bubble above the thumb on hover/focus
- **Colors section** — split into two separate boxes: "Color" (Model + BG) and "Texture" (Flat / Phong / Metal)
- **Rotation mode** — replaced segmented button bar with thumbnail cards; icons animate on hover (spin rotates, tilt bobs vertically, swing moves horizontally)
- **Thumbnail labels** — all thumb labels (Color, Texture, Rotation) now sit below each card outside the card border, aligned consistently
- **Shading thumbnails** — enlarged from 32×32 to 44×44 to match color swatches; hover adds lift and shadow
- **Dark mode text** — fixed labels using hard-coded `--palette-blueberry-800` (invisible on dark bg); now all use `--color-label` which is properly theme-aware

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
