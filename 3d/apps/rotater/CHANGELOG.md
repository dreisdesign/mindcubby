## [Unreleased]

### Fixed
- **Model color neutrality at shade extremes (HSL/HSB)**: neutral model colors (white/gray/black) now stay neutral while shade/tone is adjusted; darkening no longer injects red/pink tint in custom white workflows.
- **Model card scope isolation for shade edits**: model shade/tone updates no longer mutate background/surface color state through legacy model-sync paths.
- **Custom/Gold toggle stability**: switching between named presets and `Custom` no longer restores stale per-part custom snapshots or unexpectedly changes visible model color.
- **Multipart active-part selection reliability**: with Multi-select OFF, clicking a model row in the picker now consistently switches the active part and updates controls/material edits to that selected row.
- **Export workspace click-close reliability**: floating preview close now uses pointerup click detection with drag threshold and crop-frame guard so single-click close is consistent.
- **PNG/JPEG quality slider fill sync**: still-image quality slider now updates its filled track segment correctly while dragging and after restoring saved settings.
- **Export segmented picker visual parity**: Format, Crop, Resolution, and Quality segmented controls now share the same active-chip treatment and avoid active-shadow clipping.
- **MP4 size estimate calibration at Ultra workloads**: MP4 estimate math now applies a high-pixel-rate safety factor so Ultra/high-FPS jobs no longer significantly under-report expected file size.
- **Surface finish slider color sync for custom colors**: finish gradient preview now updates immediately when model custom color changes.
- **Active preset reclick behavior**: clicking an already-selected model preset now opens the model color picker and follows existing custom-mode handoff when color changes.

### Changed
- **Export action row button polish**: Close, Copy Link, and Copy Image secondary actions now use purple text/icon styling for clearer visual consistency with the rest of the export UI.
- **High-resolution export guard limit**: per-frame export guard now allows Ultra 4K-square workloads (while retaining existing width/height, FPS, frame-count, and total-workload safeguards).
- **Roadmap addition (preset management)**: added “Save my filament swatches (hex save/reuse palette)” to the roadmap planning queue.
- **About card What's New emphasis**: moved the orange `NEW` badge into the About card What's New heading and styled the heading text in orange for clearer release visibility.

### Changed
- **Export naming and resolution options**: restored the primary panel/button label to `Export`, renamed the `Size` control to `Resolution`, replaced `512` with `720`, removed the `1440` step, and added a `4K` export option.

---

## [2.2.44] - 2026-05-30

### Fixed
- **GIF estimate calibration and responsiveness**: animated export estimate text now rounds to cleaner MB values, responds to Dithering state changes, and better reflects observed GIF output sizes.
- **Export panel micro typography/layout polish**: export meta/help text, crop ratio labels, and section spacing were tightened for a more consistent hierarchy in the Share panel.

### Changed
- **Animated export FPS tiers**: export quality tiers now use direct FPS values (`30`, `60`, `90`, `120`, `240`) in the UI and internal state.
- **Export URL/state quality serialization**: share URLs and saved settings now store animated export quality as raw FPS values (for example `eq=120`) instead of preset labels, while still restoring older preset-based URLs.
- **GIF dithering default**: Dithering now defaults to ON for GIF export.
- **Build metadata bump**: updated in-app build/version card to `2.2.44` with date `May 30, 2026`.

---

## [2.2.43] - 2026-05-30

### Fixed
- **Export panel still-format label duplication**: PNG/JPEG no longer render duplicate `Quality` headers in the still-image quality area.
- **Export quick-option typography parity**: Background/Grid/Surface checkbox labels now match section hierarchy sizing/weight, and Crop title weight now aligns with other section labels.
- **Export section divider cleanup**: removed inter-section divider lines and normalized spacing rhythm between sections across formats.
- **Still capture pause timing**: still-image actions now enforce a pause-and-settle frame before PNG/JPEG export or Copy Image capture when animation is running.

### Changed
- **Still-image quality label language**: PNG/JPEG slider row now uses `Quality` terminology with consistent label styling.

---

## [2.2.42] - 2026-05-29

### Performance
- **Reset-state recompute coalescing**: card reset dirty-state checks are now coalesced to one `requestAnimationFrame` pass during high-frequency slider/input interactions, reducing repeated DOM and per-part comparisons while scrubbing.
- **Finish slider drag smoothing**: Surface finish roughness input now uses deferred commit scheduling, avoiding per-input multipart persistence, thumbnail regeneration, and settings URL/local saves during active drag.
- **Model-sync color drag smoothing**: live model color preview now uses build-plate preview updates (skip texture rebuild/dispose on each input), reducing animation stalls during color drags.
- **Texture tuning drag smoothing**: Lighting and metallic tuning sliders now defer persistence/sync work to commit timing, reducing per-input save churn during active drags.

### Fixed
- **Export progress visual skew during GIF/MP4 capture**: the visible viewer now freezes behind the export progress modal using a pre-capture snapshot, so temporary export canvas resizing no longer appears as live on-screen distortion while capture/encoding runs.
- **Floating model editor single-click close**: a single non-drag click in the preview canvas now closes the floating 3D Models editor reliably.
- **Repeated refresh zoom drift after level/reframe**: restore now avoids persisting pre-restore viewport camera values before pending orbit restore is applied, preventing second-refresh zoom-in regressions.
- **Zoom refresh persistence reliability**: viewport zoom/orbit persistence now commits on debounced OrbitControls change events with end-event flush, so trackpad/mouse zoom changes are reliably saved before refresh.
- **Refresh-exit zoom persistence hardening**: app now persists settings on page-exit lifecycle events (`pagehide`/`beforeunload`) to retain the latest zoom/orbit state even when a debounced interaction save has not flushed yet.
- **Grid toggle state parity**: legacy ruler visibility restore now migrates into current grid visibility state so checked Grid cannot render as hidden.
- **ZIP restore grid checkbox parity**: restore now also syncs the Surface grid toggle control from canonical ruler-line state, preventing checked-on UI from drifting out of sync after loading saved project ZIP settings.
- **Export preview grid restore parity**: export preview scene cleanup now reapplies canonical ruler/grid recompute instead of restoring helper visibility directly, preventing hidden-grid desync after preview passes.
- **Add-to-plate framing parity**: appending models to an existing build plate now automatically applies level + reframe after load for deterministic camera framing.
- **Inspect overlay measurement jitter**: contextual inspect measurements now use stable label-side orientation hysteresis, preventing rapid top/bottom flips while hovering parts.
- **Shadow banding parity (no third surface band)**: shadow receiving now returns to neutral shadow-only blending, avoiding a visible third surface band while preserving natural background/build-plate shadow blending.
- **MP4 export continuity under screen capture load**: MP4 progress paint and encoder queue handling now tolerate browser/recording throttling more gracefully so warning/busy conditions continue exporting instead of appearing stalled.

### Changed
- **GIF workload UX follow-through**: high-workload GIF exports now show a visible warning lane and continue export, instead of failing with a console-only hard stop.
- **Export progress presentation**: capture/encode status now appears as a centered modal card over a blurred backdrop instead of a flat full-screen dark splash.
- **About panel final polish**: replaced header text with the Rotater wordmark (larger while height-aligned to the close control), switched `View changelog` to a standard inline text link with normalized text styling/alignment, and simplified the maker line to `Made by MindCubby`.

### Documentation
- Clarified that the Quality dropdown controls GIF/MP4 square capture size and motion settings (`480`, `1080`, `2048` short edge), and documented practical guidance that `2048x2048` is typically too large for everyday GIF use.

---

## [2.2.37] - 2026-05-28

### Changed
- **About panel brand logos**: replaced inline/icon mix with the provided full brand logo assets for Etsy, Printables, YouTube, and GitHub (`logos_Etsy.svg`, `Logos_Printables.svg`, `logos_YouTube.svg`, `logos_GitHub.svg`).
- **Build metadata bump**: updated in-app build/version card to `2.2.37` with date `May 28, 2026`.
- **Roadmap Kanban consolidation**: moved all active planning items into Kanban queues, including prior stabilization watchlist, high-value UX follow-ups, and triage intake.
- **Roadmap planning metadata**: added `Design Status` tracking (`Needs design`, `Details`, `Ready`) and a ranked Ready Next execution sequence with impact/risk ordering.

---

## [2.2.36] - 2026-05-27

### Changed
- **Main header logo fallback behavior**: the top-left app header now keeps the full Rotater wordmark across standard desktop widths and falls back to the compact `R` mark only at tighter desktop breakpoints.
- **About Etsy link legibility**: increased Etsy logo size in the About links list for clearer at-a-glance visibility.

---

## [2.2.35] - 2026-05-27

### Changed
- **About panel logo fallback behavior**: the full Rotater wordmark now remains the default in the About header and scales with min/max bounds; only narrow layouts fall back to the compact `R` logo.
- **Roadmap normalization**: `_IGNORE/ROADMAP.md` now uses priority tables for active watchlists/follow-ups and removes completed Phase A/reliability/release-train entries so the roadmap remains open-work only.

### Fixed
- **About Etsy logo visibility**: Etsy now uses a dedicated `etsy-logo.svg` asset in the About links list for clearer, consistent rendering.

---

## [2.2.34] - 2026-05-27

### Fixed
- **Ruler part-hover on single-part models**: the ruler HUD inspect toggle now appears for single-part models as well as multipart sessions, while multi-select stays hidden until multipart selection is relevant.

---

## [2.2.33] - 2026-05-27

### Changed
- **About panel keyboard cleanup**: removed mouse/click interactions from the keyboard shortcuts section and kept only Space, Esc, and Arrow key shortcuts.
- **About panel branding layout**: the About header now shows the Rotater wordmark when space allows, with a wider desktop panel to keep the logo readable.

### Added
- **Etsy link in About panel**: added Mind Cubby's Etsy link above Printables in the About panel links list.

---

## [2.2.31] - 2026-05-25

### Changed
- **About panel shortcut guidance**: added a dedicated quick-controls list (Space pause/resume, Esc close panel, Spin re-click direction toggle, and exact-value slider entry hint).
- **Navigation wording parity**: updated About panel right-drag description to match current vertical-lock interaction behavior.

### Added
- **Precise slider text entry**: with Fine tuning enabled, click slider value badges (or focus + Enter/Space) to type exact values for core shade/range controls.

### Fixed
- **Spin direction tooltip clarity**: Spin card label now reflects active direction and clearly indicates re-click toggles between CC and CCW.

---

## [2.2.27] - 2026-05-24

### Fixed
- **Share workspace click-close consistency**: single non-drag canvas clicks now close Share workspace consistently; when crop framing is active, clicks inside the crop frame remain interactive while outside clicks close.

---

## [2.2.28] - 2026-05-24

### Fixed
- **Spin hover direction parity**: animation card hover preview for Spin now follows the active runtime direction (CW/CCW) instead of previewing the opposite direction.
- **Model sync click disambiguation**: first click on Model Sync background/surface preset now only selects the preset; sync-source chooser opens only when clicking the already-active Model Sync preset or selector controls.
- **Grid clipping across plate shapes**: ruler grid span now respects circular/rounded build plate geometry and uses a stronger plate lift to avoid edge clipping/z-fight artifacts.
- **Dynamic ruler contrast**: grid, measurement labels, and increment ticks now adapt contrast against active background/build-plate brightness for better legibility.
- **Clear/Ceramic material fidelity**: clear now renders with physical transmission/IOR tuning and ceramic uses a dedicated physical clearcoat response for closer preset-to-render parity.
- **Hovered part bounding-box visibility**: hover wireframe now uses adaptive high-contrast color/opacity so it remains visible on dark and light model/background combinations.

---

## [2.2.26] - 2026-05-24

### Fixed
- **Right-drag interaction correction**: restored right-drag to vertical-only movement (up/down lock) instead of zoom-style dolly.
- **Benchy load framing parity**: loading `3dbenchy.stl` now triggers level and reframe so startup camera is deterministic.

### Changed
- **Upload CTA copy simplification**: renamed `Upload STL` button text to `Upload` across empty state and compact/canvas/sidebar upload actions.

---

## [2.2.25] - 2026-05-24

### Fixed
- **Preset-apply FPS regression mitigation**: model preset applies now avoid full mesh material dispose/rebuild when clear/opaque mode is unchanged, using in-place color/tuning updates instead to reduce runtime hitching and post-change FPS drops.

---

## [2.2.24] - 2026-05-24

### Fixed
- **Right-drag camera interaction parity**: right mouse drag now uses true dolly behavior (push/pull camera) instead of pan-lock emulation, matching About panel guidance.
- **Animation pivot drift via right-drag**: removed right-drag pan-lock hooks that could leave off-center orbit pivots in Spin/Tilt transitions.

---

## [2.2.23] - 2026-05-24

### Fixed
- **Multi-select state persistence parity**: opening the 3D Models picker no longer forces multi-select OFF, and saved `rulerPartSelectMulti` state now restores correctly on load for multipart models.
- **Multi-select pause regression**: toggling multi-select no longer pauses animation; pause is now only force-applied for hover/inspect interaction mode.
- **Selection state contradiction cleanup**: turning multi-select OFF while multiple parts are selected now collapses selection to a single active part, preventing contradictory UI states like `OFF` with `N/N selected`.

### Changed
- **Roadmap triage intake update**: `_IGNORE/ROADMAP.md` now includes a strict P0/P1 VQA execution order with owner lanes and effort tags for immediate bug sequencing.

---

## [2.2.22] - 2026-05-19

### Fixed
- **Model picker and upload flow regressions**: fine-tuning slider stepping now preserves centered defaults, multi-select defaults to OFF on open/load, outside-click closes the floating 3D model picker again, hide-model toggle state text matches actual hidden state, and row 3-dot menus now stay above scrolling content.
- **Dark theme contrast parity**: improved dark contrast for model picker shells/cards, part action menus, inspect/quick action controls, and Share format active tab state.
- **Upload choice empty spacer**: hidden upload choice step now fully collapses to prevent an empty pre-upload box.

### Changed
- **Upload action hierarchy swap**: swapped Upload modal action emphasis and placement so `Add to Plate` is secondary and `Create New Plate` is now the primary CTA.

---

## [2.2.21] - 2026-05-19

### Fixed
- **Ruler Units selector functionality**: replaced non-functional toggle button with working dropdown select showing "Millimeters (MM)" and "Inches (IN)" options for improved clarity and reliability.
- **Inspect mode group dimensions for multi-select**: when multiple model parts are selected, Inspect now measures and renders the combined bounding size as a single group instead of only a single hovered part.
- **Model picker close button visibility and feedback**: upgraded the floating `X` button styling (surface, border, shadow, hover, active press) to match reset-button visual treatment and improve discoverability.

### Changed
- **Model section naming parity**: renamed the Model card heading and floating picker heading to `3D Models` for consistent wording in settings UI.
- **Canvas utility hover parity**: updated the top-right utility button hover treatment (expand, app settings, help) to match the inspect/play interaction family.
- **Top-right quick action hover refinement**: ensured icon-button hover state keeps the white elevated surface style with stronger border/shadow feedback, avoiding fallback generic icon hover tinting.
- **Animation preview rotations**: fixed Tilt animation to use horizontal (rotateX) motion and Wobble to combine both rotateX and rotateY for realistic preview behavior.
- **Roadmap cleanup**: removed items already completed from the active `_IGNORE/ROADMAP.md`, updated dependency references, and refreshed roadmap status metadata.

---

## [2.2.20] - 2026-05-19

### Fixed
- **UI Spacing & Padding Cleanup**: Standardized padding and margins across Background and Surface sections for consistent visual hierarchy
  - Reduced build-plate-controls padding from 10px to 8px and gap from 10px to 8px
  - Aligned Model Sync preset padding with Background controls (8px)
  - Fixed extra vertical space below dividers in Surface Finish section
- **Model Sync Dropdown Opening**: Fixed preset thumbnail click handler to properly open the Model Sync dropdown when clicking a Model Sync thumbnail
- **Model Sync Thumbnail Borders**: Removed borders from Model Sync thumbnails by default; borders now only appear when selected (matching Model Color selector behavior)
- **Right Panel Scrollbar Gutter**: Fixed persistent right-margin gutter in Effects panel by changing `scrollbar-gutter` from `stable both-edges` to `auto`

### Changed
- **App Settings Redesign**: Converted App Settings from a persistent dock card to a floating modal panel (similar to Help panel)
  - Settings button now displays as a floating icon button next to Help on desktop layouts
  - On mobile/tablet (≤899px width), the persistent dock is shown instead of the floating button to save UI real estate
  - Floating panel positions dynamically near the settings icon with viewport clamping
  - Dialog closes by clicking the X button or clicking outside the panel
- **Model Sync Selection Architecture**: Model Sync preset rows now use zero-height hosts with floating menu positioning
  - Selecting Model Sync thumbnails now anchors the dropdown to the clicked preset for better spatial context

---

## [2.2.19] - 2026-05-19

### Fixed
- **Multipart Model Picker UI**: Restyled the multi-select toggle to match the reference mockup
  - The ON/OFF label now sits inside the moving knob instead of floating on the track
  - Active state uses a dark purple background with a white knob and dark purple ON text
  - Inactive state uses a gray background with a white knob and gray OFF text
  - Widened the switch so the knob text stays centered and readable in both states

---

## [2.2.18] - 2026-05-19
### Documentation
- **Docs sync timestamp**: 2026-05-29 10:50 -0400 (captured from current `main` history).
- **Recent pushes now documented**:
  - `14db073` — 2026-05-28 20:38 -0400 — fixed Hide/Show model wording to always display `Show model` with ON/OFF state indicating visibility.
  - `a631a3a` — 2026-05-28 20:33 -0400 — updated 3-dot menu direction preference to open downward by default and flip upward only when viewport space requires it.
  - `0ea254a` — 2026-05-28 20:21 -0400 — kept multipart hover bounding-box active regardless of floating model-window open/closed state.

### Added
- **About button build badge**: the canvas About Rotater button now shows a small NEW badge after an app update until the help panel is opened for the current build.
- **Share: Copy Image to clipboard** — added a new `Copy Image` action in the Share panel that copies the current still render directly to clipboard as PNG (or JPEG when JPG format is selected).
- **Dev Mode FPS overlay** — added `Dev mode (show FPS)` in App Settings (dock + modal) with an in-viewer FPS readout for runtime diagnostics; default state is OFF and persisted with other settings.
- **Interaction mode picker (Inspect / Multi-Select)** — replaced separate `Inspect`/`Select` HUD toggles with a single grouped picker; `Select` renamed to `Multi-Select`; picker modes are mutually-exclusive and auto-pause rotation while active.
- **Config: partInteractionModes** — added `partInteractionModes` to `color-rules.json` to control opacity/saturation profiles for `inspect` and `select` modes; visuals are applied dynamically to part materials and persisted in color rules.
- **Canvas sidepanel quick toggle** — added a top-right canvas utility button to hide/show sidepanels; the icon now swaps between close and expand states and persists across refreshes
- **Model footprint floor guides** — ruler grid now includes thin footprint lines derived from the loaded model bounds, aligned to the active ruler unit system (`mm` metric spacing or `in` imperial spacing)
- **Export preview visible border** — the mini export preview now always has a visible border; border strengthens when background is off so the frame is clear on transparent renders
- **Export Build Plate quick option** — Export quick options now include a dedicated `Build Plate` toggle so plate visibility can be controlled per-export without changing the main Build Plate card defaults
- **Export workspace transparency checkerboard** — when Export `Background` is toggled off, the main export workspace viewport now shows a white/gray checkerboard behind the model to make alpha state explicit
- **Build plate shape control** — Build Plate card now supports `Rectangle`, `Rounded`, and `Circle` footprint modes with live geometry switching
- **Multipart bulk edit MVP** — Model parts menu now includes per-row checkboxes plus a bulk action banner to apply active `Color`, `Shade`, or `Finish` values to checked parts
- **Phase 1 regression automation baseline** — added a lightweight `npm run test:smoke` script to validate critical files, JSON parseability, and JS syntax for fast local regression checks
- **Optional pre-commit smoke gate** — added setup/removal scripts to install a local git pre-commit hook that runs only fast Rotater smoke checks
- **D-pad visibility preference** — App Settings now includes `Show D-pad controls`; turning it off hides the bottom camera D-pad and keeps Pause available at bottom-right
- **Ruler part-hover inspect mode** — ruler HUD now includes a `Part hover` toggle; when enabled, hovering multipart geometry updates W/D/H to the hovered part dimensions
- **Ruler hover focus highlight** — hovered multipart parts now show a live 3D bounding-box outline, and the matching row in the model selector is highlighted for clear target context

### Changed
- **C1 module refactor started** — extracted shared action-menu placement math into `modules/menu-positioning.js` and wired picker action-menu positioning through the new helper to reduce `script.js` surface area.
- **Roadmap restructuring (incomplete-only)** — `_IGNORE/ROADMAP.md` now tracks only incomplete work in a cohesive phase-based structure; completed work remains in this changelog.
- **Export start-position decision** — kept current export start behavior unchanged; users can pause at the desired pose before export.
- **Model picker floating-card behavior** — on desktop pointer layouts, the multipart model picker dropdown now opens as a draggable floating card with a sticky drag-handle header, matching the Share panel interaction style while preserving existing mobile dropdown behavior.
- **Model picker close flow** — floating model picker now includes an explicit close button in the header; outside clicks no longer dismiss it, and selection interactions keep the picker open for continuous edits until explicitly closed.
- **Model picker resizable floating window** — desktop floating model picker now supports drag-to-resize from the bottom-right corner, with safe min/max viewport clamping and persisted size across opens.
- **Selection opacity parity with list view** — removed model opacity dimming during selection interactions so parts remain fully opaque while selecting in card/list workflows.
- **Model picker responsive normalization + drag affordance** — polished the floating resize handle styling, capped floating window max size for readability, normalized grid/card option scaling to avoid stretched previews, and added a dedicated per-item drag grip so reorder is discoverable in Grid view.
- **Model picker UX simplification** — removed the custom resize handle/drag-grip complexity; the floating card now uses native browser resize, keeps straightforward drag-to-reposition, and uses normalized grid sizing with empty add-row containers hidden to avoid phantom spacer blocks.
- **Model picker collapsed affordance icon** — replaced the old dropdown-style down-chevron on the main model selector chip with a panel-launch icon to match floating-window behavior.
- **Model picker default-open desktop behavior** — multipart model modal now opens by default on desktop pointer layouts and remains open until explicitly closed.
- **Model picker top-row density + alignment** — Card/Grid segmented control now hugs content and is right-aligned within the bulk row; top spacing and padding were tuned for cleaner balance.
- **Model picker grid thumbnail spacing** — reduced grid thumbnail size and increased tile padding so checkbox and thumb spacing read cleaner.
- **Model picker card-view spacing parity** — restored explicit card-view tile padding/background treatment so card and grid/list states look consistent.
- **Selection visual neutrality in select mode** — model opacity/saturation no longer shifts between parts while using select/multi-select workflows.
- **Model picker visual cleanup pass (Card/Grid)** — rebuilt card/grid tile spacing for tighter, consistent paddings, refined text rhythm, and cleaner professional alignment while keeping the existing interaction model.
- **Model picker drag-handle parity with Share** — floating modal header drag affordance now uses centered top placement and rotated indicator treatment matching Share panel behavior.
- **Model picker multi-select visibility** — row checkboxes now stay hidden until multi-select mode is enabled; the modal keeps its native resize handle and no longer depends on hover for checkbox visibility.
- **Model picker grid real-estate optimization** — grid now packs compact fixed-size tiles with smoother responsive breakpoints so additional cards fit per row instead of growing tile footprints.
- **Model picker modal layout polish** — card view now constrains to 400px max-width for cleaner proportions, header stretches full-width without gaps, and grid columns use auto-fit sizing to eliminate awkward overlaps.
- **Model picker header refinement** — MODELS text is now bold and large (16px), header fills modal width with rounded top corners, X button properly aligned and sized, scrollbar gutter removed to eliminate right-side dead space.
- **Model picker list/grid shell parity** — list and grid now share the same bulk-row and scroll-container structure, and the list toggle label now reads `List` while preserving existing internal view-mode wiring.
- **Model picker consolidated card view** — removed the list/grid switch and keep one optimized card layout; selected parts now sort to the top and the multi-select control is right-aligned as a proper switch.
- **Model picker minimize affordance** — the floating model picker now uses a minimize button in the header instead of a dismiss-style close, matching the new modal treatment.
- **Model picker mockup parity pass** — bulk selection checkbox/count now stay hidden until Multi-select is ON, the Multi-select switch now shows explicit `On`/`Off` text, row 3-dot action menus are vertically centered, and the header minimize icon now uses the provided down-arrow glyph treatment.
- **Model picker parity follow-up** — enforced CSS gating so bulk checkbox/count cannot appear while Multi-select is OFF, moved `Off` state text to the right side of the switch (with `On` on the left when active), and removed forced stable scrollbar gutter reservation from the picker shell/items.
- **Inspect hover dims only** — Inspect mode now shows only hovered-part dimensions in the ruler HUD; the previous ruler fallback readout is hidden while inspecting or multi-selecting.
- **Pause/play disabled while interacting** — Pause and Export pause controls are disabled while `Inspect` or `Multi-Select` modes are active; controls show the tooltip "Not available while inspecting/selecting".
- **Sidepanel toggle restyle** — replaced the expand/close icon with a circular utility button and corrected expand/close orientation behavior.
- **Finish spacing** — added spacing above the Matte/Satin/Gloss finish buttons for improved visual separation.
- **Ruler unit control moved to App Settings** — `mm/in` unit switching now lives in App Settings (instead of the persistent bottom ruler HUD) to reduce always-on canvas control noise
- **Grid toggle no longer hides Inspect/Select** — turning Grid off now keeps the ruler HUD interaction picker visible so Inspect and Select remain available independently of the grid state
- **Ruler select mode decoupled from inspect mode** — part click-select now works whenever ruler is enabled, without requiring Inspect mode to be active first
- **Ruler select icon/style parity** — Select mode now uses the `pan_tool_alt` icon and active styling that matches Inspect mode (removed the separate green active treatment)
- **Surface Finish control order** — model Surface card now presents controls in the order `label -> strength slider -> Matte/Satin/Gloss buttons`
- **Upload icon consistency** — both canvas and sidebar Upload STL actions now use the same Add (`+`) icon path
- **Renamed Export → Share (UI text only)** — the Export panel title and sidebar/canvas quick-action labels were updated to read `Share` to better reflect copy-link and save/share workflows.
- **Ruler/build-plate export parity** — synchronize ruler and build-plate quick options with Export workspace controls so framing and plate visibility remain consistent when entering export/share mode.
- **Background preset naming parity** — background preset naming now consistently uses `Model Sync` terminology in UI labels and related preset metadata.
- **Shade-system auto-brightness refactor** — moved auto-brightness blend logic into a dedicated shade-system helper to keep background and surface auto paths aligned.
- **Config-driven model preset tone defaults** — model preset default tones are now authoritative from `color-rules.json` (`presetShadeDefaults.model`) when present.
- **Model preset tone tuning** — updated ceramic and ink model preset tone defaults for clearer visual separation in the standard lighting path.
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
- **Multipart selector summary wording** — 3+ selected-part summaries now use clearer phrasing (for example `Parts 1, 2, 3 selected`) with explicit count metadata
- **Multipart selector filename-first summary** — collapsed multipart selector now prioritizes the first selected part filename (truncated) while keeping `N of M selected` on the second line
- **Export duration selector parity** — Export `Time` options now show duration with derived frame counts using shared GIF/MP4 timing labels
- **Ruler hover inspection focus** — enabling `Part hover` mode now auto-pauses model rotation so hovered-part measurement is easier to read

### Fixed
- **Single-model 3-dot overlap dismissal** — clicks in overlap regions that landed on the static model-card selector layer now correctly dismiss the 3-dot actions menu.
- **Action-menu anchoring in floating picker** — row 3-dot action menus now anchor against the floating picker/card context instead of drifting to viewport-fixed locations.
- **Preview click-to-pause jank** — plain preview clicks no longer trigger interaction pause; Orbit drag handling now requires real pointer movement, keeping click-only interactions stable.
- **Shade slider drag jank under load** — reduced drag-time stalls by deferring expensive persistence/thumbnail work to commit timing and avoiding per-sample shade-selector rebuilds during continuous slider input.
- **Model modal close-policy regressions** — floating model modal no longer closes during color/preset interactions; close is now limited to explicit `X` action or keyboard `Esc`.
- **Model picker default-open legacy fallback** — default-open multipart selector now consistently initializes in floating modal mode (desktop pointer workflows), instead of intermittently rendering as the legacy inline dropdown.
- **Model picker grid right-gap snapping** — refined responsive column sizing/packing to remove odd right-side dead space at intermediate modal widths.
- **Model picker grid width containment** — grid tiles now use fixed card widths within a shared scroll container so the grid no longer stretches beyond list/card modal proportions.
- **Model picker row actions clipping/overlap** — repositioned per-row 3-dot action buttons to keep them fully inside card bounds in both list/card and grid views.
- **Multipart thumbnail framing stability** — thumbnail capture now hides ruler hover bounding-box overlays during offscreen rendering so preview thumbs keep stable framing/scale and no dashed helper wire leaks into tile images.
- **Inspect mode visibility decoupled from Grid/Ruler toggle** — live inspect overlay and hovered-part contextual dimensions now render whenever inspect is active, even if the grid/ruler visibility toggle is off.
- **Background/Build Plate sync thumbnail size stability** — locked sync selector thumbnail canvases to fixed dimensions so preview thumbs no longer shrink when selecting different model parts.
- **Click-select fallback after deselect-all** — removed the remaining ruler-toggle gate from canvas click selection so clicking a model always re-selects it even after `Deselect all`, with or without multi-select enabled.
- **Multi-select hover feedback gating** — removed remaining ruler-toggle dependency from hover preview state so model hover outlines/selector hover feedback remain active while multi-select is enabled.
- **Share action row clipping** — `Copy Image` now participates in a responsive wrapped action row so the button is fully visible in compact Share panel widths.
- **Play button duplication hardening** — preview and Share pause controls now use explicit runtime `display` toggling to guarantee only one play/pause button is visible at a time.
- **Duplicate play controls in preview** — main preview now hides the export pause/play control outside Share workspace, and hides the regular pause button while Share workspace is active so only one play/pause control appears at a time.
- **Canvas multi-select pick reliability** — model picking for hover/click selection no longer depends on ruler toggle state, fixing cases where multi-select appeared active but clicking models did nothing.
- **Hover selection affordance** — multipart hover now always shows the dashed model bounding box (selection indicator) without dashed arrows/dimension callouts, and the canvas cursor switches to pointer when hovering a selectable part.
- **Select-all visual feedback parity** — bulk `Select all`/checkbox selection now immediately updates part opacity/saturation preview treatment.
- **Inspect toggle semantics** — the bottom-right inspect button now acts as a measurements toggle (`Measurements on/off`) while selection hover outlines remain available independently.
- **Model picker collapse rules** — clicking preview model/build-plate now collapses the model picker in single-select flow, while active multi-select mode keeps the picker open for consecutive picks.
- **Select mode icon update** — model picker multi-select button now uses the provided arrow selector icon path.
- **Duplicate playback controls** — the export pause/play button is now hidden outside export workspace to avoid duplicate play controls in regular preview mode.
- **Model picker zero-selection clarity** — multipart picker checkboxes now stay visible when no parts are selected, making re-selection and bulk targeting discoverable immediately.
- **Selection mode gating and reset behavior** — preview single-click now defaults to single-part selection and multi-select is restricted to picker-open + multi-select toggle state.
- **Inspect/playback control placement** — moved inspect and export play/pause controls to the bottom-right preview action cluster so the D-pad remains centered and visually isolated.
- **No-selection model settings visibility** — model quick presets and slider controls now hide when zero multipart parts are selected to prevent editing against an empty target.
- **Viewer control state parity** — main and export pause buttons now swap between the provided Play and Pause SVG icons, keep their labels in sync with the live paused state, and continue using the shared pause wiring.
- **Multipart deselect-all feedback** — clearing Select mode bulk selection now removes the lingering visual selected state from multipart tiles, so `Deselect all` reads correctly in the HUD and selector.
- **D-pad center alignment** — bottom viewer controls now use a centered three-column layout so the D-pad stays locked to the middle while the ruler HUD and playback controls sit outside it.
- **Ruler mode contrast** — active `Inspect` and `Select` buttons now use the same light-purple filled state as Animation cards with stronger icon/text contrast against their white inactive state.
- **Esc preview toggle direction** — pressing `Esc` now collapses the preview only when it is expanded, and does nothing when already collapsed.
- **Paused-state hard refresh restore** — pause/resume state now persists in settings and is restored after hard refresh, including pause button/icon state
- **Inspect focus clarity on multipart models** — while Inspect mode is hovering one part, non-hovered parts now dim to improve focus on the active target
- **Persistent ruler-dim readout noise** — bottom ruler L/W/H values no longer remain persistently visible when Inspect mode is off
- **Color picker preview performance** — coalesced per-`input` color picker updates via `requestAnimationFrame` and streamlined preview/commit handling so dragging the OS picker remains responsive in multipart models (reduces UI lag during continuous input).
- **Auto-brightness OFF reveal transition** — turning Background/Surface Auto brightness off now reveals the Shade row first, then animates the slider from the auto shade to the restored manual shade for clearer state feedback
- **Auto-brightness ON/OFF animation parity** — Background and Surface auto-brightness toggles now animate both directions with smoother ease-in-out motion
- **Auto-brightness slider motion restore** — restored the original fast slider-knob travel profile so auto-toggle transitions visibly slide the knob (not just row reveal/fade)
- **Auto slider motion clarity** — removed shade-row reveal fades from auto toggles so the visible transition emphasizes knob travel to the new value
- **Surface Model Sync source persistence** — fixed an issue where the selected Model Sync source color was not persisted across refreshes; now uses the correct part-color source during restore.
- **Multipart custom/reset refresh persistence** — preserved part appearance state more reliably across multipart reset/custom flows and refresh, preventing unintended fallback visuals after restore.
- **D-pad horizontal centering** — camera D-pad now stays centered in the preview control bar instead of shifting with ruler width
- **Mobile preview order and Info access** — on narrow widths the preview now sits above the control panel, the duplicate canvas logo/header are hidden, and the Info card is reachable from the sidebar action row
- **Desktop load card overlap** — Effects panel no longer force-renders while hidden in desktop layout, preventing Lighting/Animation cards from stacking over Theme cards during startup/tab initialization
- **Surface auto-brightness visibility sync** — Surface `Shade` row now updates immediately on toggle and initial UI wiring so it stays hidden whenever `Auto brightness` is enabled
- **Surface preset startup regression** — closed the Background preset renderer correctly so the Surface preset row initializes on load again; mobile Info card build/date labels now stay aligned with the shared app build constants
- **Auto brightness slider visibility** — the Background `Shade` slider now hides when `Auto brightness` is enabled; Surface `Auto brightness` now follows the same interaction pattern
- **Undo toast noise** — `Model updated` undo toast now appears only for batch edits instead of single-part model tweaks
- **Export workspace preview parity** — in export framing workspace, `Background`, `Grid`, and `Build Plate` quick options now apply directly to the live export viewport and to exported output, restoring parity with prior mini-preview behavior
- **Build plate finish control scope** — clicking Build Plate `Matte/Satin/Gloss` no longer changes model finish mode; model finish handlers are now scoped only to model finish controls
- **Build plate shade visual mismatch** — strengthened build plate shade response so darker/lighter slider values are more accurate on the live plate surface
- **Grid visibility with plate disabled** — grid now remains visible in the live preview when `Build Plate` is off; shadow-catcher no longer depth-occludes grid rendering
- **MP4 export late-frame stalls** — added WebCodecs encoder queue backpressure handling plus explicit `Finalizing video…` progress stage to avoid apparent hangs near the final frames
- **Startup transition consistency + staged fades** — both first-time and returning refresh paths now follow one startup sequence (`Splash -> Full UI shell -> Model ready`) with matched fade transitions between stages
- **Rotation Time accuracy under load** — viewer animation now uses delta-time based updates so selected durations stay consistent when FPS dips
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
- **Small-browser App Settings visibility** — App Settings quick action remains visible in narrower desktop/tablet viewport widths where it was previously hidden
- **Right-drag pan drift** — right-button drag is now constrained to vertical movement so framing stays horizontally centered

### Security
- **ZIP import hardening** — package import now validates entry paths (blocks traversal), enforces file-type allowlists (`.stl` + `package.json`), and applies archive/extract size and entry-count guards before loading STL buffers

## [2.1.2] - 2026-05-08
- **Prevents state clobber from intermediate code paths while auto is ON** — OFF restore no longer depends solely on mutable cache values that can be overwritten by later flows.

## [2.1.83] - 2026-05-11

### Fixed
- **Surface auto OFF no longer falls back to `+0`** — Added a dedicated persisted manual shade value (`buildPlateManualShade` / `bpms`) so restoring auto/manual states no longer infers manual shade from active auto shade.
- **Manual shade cache is protected while auto is ON** — Surface preset clicks no longer overwrite the manual shade cache during auto mode.
- **Surface shade readout no longer shows stale values** — Shade label now re-syncs when auto state changes, preventing mismatches like slider at `-100` with readout `+0`.

## [2.1.82] - 2026-05-11

### Fixed
- **Core auto-brightness toggle bug** — Build plate `lastManualBuildPlateShade` (manual shade cache) is now properly initialized during restore when auto is ON, and updated whenever presets are selected. This ensures toggling auto OFF always restores to the correct preset-based manual default, not an uninitialized value. This was the root cause of toggle appearing "reversed" or broken through multiple builds.

## [2.1.81] - 2026-05-11

### Fixed
- **Surface preset path no longer overrides manual mode** — Selecting Surface preset `modelcolor` while auto-brightness is OFF no longer forces shade to `-100`; it now respects manual-mode defaults/history.
- **Restore no longer clobbers manual shade memory when auto is ON** — On load, the saved auto shade value is no longer written into the manual shade cache, preventing OFF toggles from restoring the wrong value.

## [2.1.80] - 2026-05-11

### Fixed
- **Surface auto OFF now restores true manual shade** — Build plate auto-brightness now restores the last manual slider value when toggled OFF (instead of preset fallback values like `0`)
- **Shade math restored to HSL model** — Shade computation now preserves hue/saturation and changes only lightness, with `shadeResponse.lightenScale` and `shadeResponse.darkenScale` applied from `color-rules.json`

## [2.1.79] - 2026-05-11

### Fixed
- **Build plate auto-brightness OFF state** — Toggling auto-brightness OFF now properly restores the preset default shade instead of leaving it at the auto value. Matches background auto-brightness behavior.

## [2.1.78] - 2026-05-11

### Changed
- **REFACTOR: Shade system ES Module** — Extracted shade computation logic into new `shade-system.js` ES Module for improved maintainability and code organization (Phase 1 of roadmap modularization)
- **Wrapper functions** — Added compatibility wrappers in script.js to maintain existing API while delegating to module

### Fixed
- **Build plate shade range (lightenScale)** — Fixed double-damping issue where `lightenScale: 0.6` was being multiplied into the blend amount, causing shade=-100 to appear gray instead of white. Now `lightenScale` only affects darker side (darkenScale) for perceptual tuning without reducing white intensity

## [2.1.77] - 2026-05-11

### Fixed
- **BG and Surface auto restore sync** — Auto Brightness now reasserts its `-100` shade on both cards during restore and toggle changes, preventing stale values from making Surface look darker when Auto is enabled

## [2.1.76] - 2026-05-11

### Fixed
- **Background restore precedence** — Auto BG now wins on restore, so URLs with Auto Brightness enabled no longer come back with a stale `+100` shade

## [2.1.75] - 2026-05-11

### Fixed
- **White/Black preset state sync** — White and Black build plate/background presets now reapply their default shade values on restore and when re-selected, preventing stale saved shades from overriding the visible preset

## [2.1.74] - 2026-05-11

### Fixed
- **Surface preset/color state sync** — Build Plate now keeps its stored color aligned with White/Black preset selection, preventing stale custom colors from making Auto Brightness look wrong

## [2.1.73] - 2026-05-11

### Fixed
- **Surface auto-brightness OFF restore** — Build Plate now restores the last manual Shade value when Auto Brightness is turned off, instead of keeping the auto shade

## [2.1.72] - 2026-05-11

### Fixed
- **Surface auto-brightness toggle parity** — Surface (build plate) now preserves the current manual shade value when toggling Auto Brightness off, matching Background behavior
- **Shade jump balance** — Added shade response scaling so the lighter-side step (`0` to `-25`) is less aggressive and more visually balanced with the darker side

### Changed
- **Black preset baseline** — Black preset now uses a near-black baseline (`#0f0f0f`) so shade `0` is not a clipped pure black
- **NPM build bump workflow** — Added `npm run bump:build -- <version>` to update the single source-of-truth build metadata in `index.html`

## [2.1.71] - 2026-05-11

### Fixed
- **Auto brightness toggle shade stability** — Toggling Auto Brightness off now preserves the current shade slider value (no unexpected jump), and toggling on applies the configured auto shade deterministically

### Changed
- **Single source-of-truth build token** — `index.html` now uses `ROTATER_BUILD` as the single cache-buster source for both CSS and JS, reducing version updates to one edit location

## [2.1.70] - 2026-05-11

### Fixed
- **Build label/source consistency** — Aligned all build metadata sources in `index.html` (bootstrap constants, info card label, and CSS/JS cache-buster query strings) so the UI no longer shows stale `Build 2.1.64` after refresh

## [2.1.69] - 2026-05-11

### Fixed
- **Preset shade defaults are now config-driven** — White/Black default manual shade endpoints are now read from `color-rules.json` (`presetShadeDefaults`) so both background and build plate can be controlled without JS edits
- **Background reset sync thumbnail stability** — Resetting the Background card now repaints the model sync thumbnail immediately, preventing transient broken thumbnail states
- **Auto Brightness toggle no longer jumps manual shade** — Disabling Auto Brightness now preserves the current manual shade slider position instead of forcing a preset-specific reset

### Changed
- **Terminology normalization in color rules** — Helper naming now consistently uses `shade` language, and `color-rules.json` includes a plain-language `_guide` block

## [2.1.68] - 2026-05-11

### Fixed
- **Config-driven color rules** — Shade and auto-brightness now read their percentage rules from `color-rules.json`, and shade blending uses RGB lerp so each step stays visually consistent

## [2.1.67] - 2026-05-11

### Fixed
- **Contrast and Highlights sliders centered on fresh load** — Changed range from asymmetric (`min=50/40 max=400`) to `min=0 max=200` so the default value (100) sits at the exact midpoint, making the thumb visually centered and the readout correctly show `+0`

## [2.1.66] - 2026-05-11

### Fixed
- **Shade slider resets on preset change** — Switching model presets now always resets the shade value to the preset's defined shade (defaulting to `0` if the preset has no explicit shade), instead of carrying over the previous preset's shade

## [2.1.65] - 2026-05-11

### Changed
- **Model Shade slider parity** — Model card Shade now uses the same 9-point snap model as Surface/Background shade sliders
- **Lighting readout normalization** — Lighting sliders now show centered delta labels (`+0` midpoint, `±25` per step) without altering the rendered look
- **Pause icon consistency** — Export pause button now uses the same pause glyph path as the main viewer pause button
- **Build metadata bumped** — info card build/date and cache-buster query now report `2.1.65`

### Fixed
- **Multi-select toggle-all persistence UI** — reopening the multipart selector after refresh now re-syncs global checkbox state to current part selection
- **Preset reconciliation reliability** — standard-family preset detection now prioritizes stored finish mode/value matching and compares against selected-part settings, fixing false `Custom` fallbacks (including Gumball)
- **Sync thumb fallback resilience** — background/surface sync selector rows now paint deterministic fallback thumbnails immediately before async thumb renders
- **Mobile cam-nav vertical spacing** — bottom preview controls no longer inherit the desktop compact offset on small screens

## [2.1.64] - 2026-05-10

### Changed
- **Share URL schema cleaned up** — newly generated model URLs now use `mf` (`standard`, `metallic`, `clear`) as the explicit material-family key instead of legacy `sh` shader labels
- **Preset URL cleanup** — bundled model preset URLs now encode the current material-family/finish model directly so preset links are easier to reason about and update

### Fixed
- **Legacy shader URL drift** — old `sh=` links still restore correctly, but they now rewrite forward into the clean `mf=` schema on save/load instead of perpetuating legacy shader labels
- **Preset detection parity** — quick preset matching now compares material family instead of legacy shader labels, preventing standard-finish presets from depending on deprecated `phong`/`matte` URL values

## [2.1.63] - 2026-05-10

### Changed
- **Build metadata aligned** — app build/version metadata and cache-buster query tags now consistently report `2.1.63`

### Fixed
- **Shared finish-state authority** — explicit URL surface-finish values (`tfm`/`tfv`) now apply directly to part settings during restore instead of being parsed and then ignored
- **Legacy shader finish drift** — legacy material URLs/presets that rely on `sh` plus roughness/reflection values now clear stale stored finish metadata so the Surface Finish UI reflects the actual rendered material instead of old matte/gloss labels

## [2.1.62] - 2026-05-10

### Changed
- **Build metadata aligned** — app build/version metadata and cache-buster query tags now consistently report `2.1.62`

### Fixed
- **Model preset thumb border noise** — unselected Model card preset thumbs no longer show the default card border; only selected thumbs display the selection ring
- **Model reset sync propagation** — resetting model visual settings now updates the underlying part base-color cache so `Model Sync` background and build plate colors refresh immediately without requiring a page reload
- **Model-sync manual shade mismatch** — background shade calculations now use the active background source color (including `Model Sync`) instead of stale picker values when Auto brightness is off
- **Auto-to-manual model-sync handoff** — toggling Background Auto brightness off while on `Model Sync` now applies the correct background color transform path (same as normal manual shading)
- **Finish mode classification accuracy** — finish slider mode detection now interprets stored roughness correctly (inverted roughness mapping) and accounts for high reflection values, preventing glossy presets from being mislabeled as matte
- **Sync-thumb fallback resilience** — thumbnail canvases now paint a deterministic fallback when render preconditions are invalid, reducing broken/empty sync thumb states
- **Fast-spin export smoothness** — GIF/MP4 exports now raise effective capture FPS for short rotation times (like 5s) to reduce jitter and speed artifacts
- **Share URL model-state completeness** — URL serialization now always includes full model texture/finish tuning values (including surface-finish mode/value helpers) so preset links/json capture complete model settings reliably
- **Surface URL parity** — build plate finish (`bpf`) is now emitted in share URLs to match existing URL restore support

### Documentation
- **README version updated** — workspace version marker updated to `2.1.62`

## [2.1.61] - 2026-05-10

### Changed
- **Build metadata bumped** — app build/version metadata now reports `2.1.61` and CSS/JS cache-buster query tags were updated to match
- **Model preset card parity** — Model card preset thumb borders/radius now match the same border shape/weight behavior used by Background and Surface presets
- **Surface finish slider visual language** — Surface Finish slider now uses a dynamic color gradient based on the selected part color (matte → satin → gloss) instead of a fixed purple track

### Fixed
- **BG/Surface sync thumbnail fallback** — model-sync selector thumbs now recover with a deterministic fallback paint when thumbnail render buffers are empty or render-time issues occur
- **Surface finish slider state sync** — changing selected model parts now consistently refreshes finish mode and slider value/readout from the selected part settings
- **Dropdown list accessibility in-place** — model-sync dropdown menus now reposition above/below based on viewport room and trap wheel scrolling so users can scroll long option lists without scrolling the entire panel

## [2.1.60] - 2026-05-10

### Changed
- **Build metadata bumped** — app build/version metadata now reports `2.1.60` and CSS/JS cache-buster query tags were updated to match
- **Card header collapse affordance** — all collapsible main control cards now expand/collapse when clicking the full top header area, matching the App Settings dock behavior

### Fixed
- **Sync selector dropdown layout** — Background and Surface model-sync menus can expand taller without being clipped by their parent card and keep wheel scrolling contained
- **Sync selector thumbnail refresh** — hidden menu canvases are skipped until visible, reducing broken-thumb redraw states when opening model-sync selectors after color/sync changes
- **Viewer control icons** — pause, spin, tilt, and wobble controls now use the refreshed inline SVG artwork

## [2.1.59] - 2026-05-10

### Changed
- **Build metadata bumped** — app build/version metadata now reports `2.1.59` and the info panel build date was updated to `May 10, 2026`
- **Documentation sync** — README default-logic notes now reflect the current `AUTO_BRIGHTNESS_RULES` and `SHADE_RANGE_PERCENT` values

### Fixed
- **Custom color edit lag** — color picker changes now debounce expensive thumbnail/settings commits so dragging the OS picker stays responsive with multipart models
- **Background sync UX** — switching the Background Model Sync source no longer shows a confirmation prompt

## [2.1.58] - 2026-05-09

### Fixed
- **Background reset dirty-state trigger** — toggling `Auto brightness` off in the Background card now immediately activates the card reset state
- **Surface control row layout parity** — `Grid` and `Build Plate` toggles are back to a side-by-side row for cleaner scanability
- **Surface preset visual parity** — Build Plate color thumbs now retain standard card borders and selected-state styling matching the rest of the preset system
- **Surface spacing/label cleanup** — Build Plate color/shape section labels are now Title Case and spacing between color controls/shape controls is more consistent
- **Build Plate disabled remnant cleanup** — when Build Plate is toggled off, the inner Build Plate config body now hides cleanly so no empty remnant box is left behind
- **App Settings dock visual parity** — App Settings now aligns with card width conventions and no longer shows the browser-default active/focus border artifact with clipped corners
- **App Settings chevron affordance** — App Settings expand/collapse chevron now uses the same bordered-button visual language as other panel/card toggles

### Changed
- **Build metadata bumped** — app build/version metadata now reports `2.1.58` and CSS/JS cache-buster query tags were updated accordingly

## [2.1.56] - 2026-05-09

### Changed
- **Build metadata bumped** — app build/version metadata now reports `2.1.56` and stylesheet cache-buster query was updated to the same build
- **Background and Surface reset parity** — Background card reset now restores `Model Sync + Auto brightness` (matching Surface reset defaults)
- **Auto-to-manual shade handoff** — turning Surface auto brightness off now reveals its effective manual shade (`+25`) instead of showing `+0`

### Fixed
- **Background/Surface shade logic parity** — both pipelines now use the same tone transform model for matching snap behavior
- **Surface gray cast removal** — build plate now uses an unlit material path (`MeshBasicMaterial`, `toneMapped: false`) so shade colors are not shifted by scene lighting/IBL
- **Preset re-click behavior** — clicking an already-active preset (including Model Sync) is now a no-op instead of toggling away
- **Animation reset default range** — Animation card reset now restores true spin defaults (`360` range) instead of midpoint behavior

### Documentation
- **Design reference expanded** — added a runtime-defaults/logic section documenting where to change startup defaults, reset behavior, and auto-brightness shade mapping
- **README updated** — version updated to `2.1.56` and added a defaults-tuning quick reference for changing baseline behavior

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
