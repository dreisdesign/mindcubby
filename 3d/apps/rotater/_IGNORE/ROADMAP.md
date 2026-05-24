# Rotater Roadmap

Updated: 2026-05-24

This roadmap contains only incomplete work. Completed items belong in `CHANGELOG.md`.

## VQA Intake: 2026-05-24 (Screenshots + Filename Notes)

This section captures new VQA findings from `_IGNORE/VQA-May-24-2026` and folds them into the active backlog. Items already shipped in `CHANGELOG.md` remain listed here only when they need regression validation.

### Immediate Bug Queue (Address First)

- [ ] FPS drops after color/preset changes (`FPS-cuts-in-half-after-color-change-via-preset.png`).
- [ ] Multi-select header switch can show `OFF` while all parts are selected (`bug-multi-select-toggle-says-off-when-all-selected.png`).
- [ ] Turning multi-select ON/OFF pauses animation unexpectedly (`turning-on-multi-select-is-pausing-animation.png`, `turning-off-multi-select-is-pausing-anoimation.png`).
- [ ] Closing the model picker can disable multi-select unexpectedly (`closing-mult-select-model-picker-is-turning-off-multi-select-checkbox.png`).
- [ ] Tilt/Spin mode interaction conflict: switching modes + right-drag can break animation state (`bug-switching-from-tilt-to-spin-and-dragging-right-click-breaks-animation.png`).
- [ ] Right-drag can leave animation orbit off-center (`right-click-drag-allows-for-off-center-position-animation.png`).
- [ ] Hover previews are inconsistent: tilt hover not animating, spin hover direction appears reversed (`tilt-animation-hover-not-animating.png`, `spin-animation-hover-rotates-wrong-way.png`).
- [ ] Grid clipping is inconsistent across build plate shapes (`grid-should-get-cut-off-on-all-build-plate-shapes.png`).
- [ ] Grid color and model bounding-box outline need dynamic contrast on varied plate/background colors (`grid-should-needs-to-dynamically-adjust-color-for-contrast-over-different-build-plate-surface-color.png`, `model-bounding-box-needs-to-dynamically-adjust-color-for-contrast-over-different-backgrounds.png`).
- [ ] `Clear` material appears blue-tinted and `Ceramic Gloss` appears too matte (`clear-shouldnt-be-blue.png`, `ceramic-glossy-looks-matte.png`).
- [ ] Export workspace close interactions are inconsistent (single non-drag click close behavior vs crop-only outside click behavior) (`single-non-drag-click-in-export-should-close.png`).
- [ ] Model Sync thumbnail click in Background likely has two actions bound (changes preset + opens picker) and should be disambiguated (`clicking-model-sync-in-bg-changes-it-and-opens-menu-maybe-dont.png`).

### P0/P1 Execution Order (Strict)

| Priority | Issue | Suggested Owner Lane | Effort | Status |
|---|---|---|---|---|
| P0-1 | Multi-select state parity (`OFF` label mismatch, close/open persistence, toggle semantics) | Model Picker / Selection State | S | In progress |
| P0-2 | Multi-select toggles should not pause animation | Animation State / Interaction Modes | S | In progress |
| P0-3 | Tilt/Spin + right-drag can break animation/orbit center | Camera Controls / Animation Runtime | M | Todo |
| P0-4 | FPS drop after preset/color changes | Runtime Perf / Material Update Path | M | Todo |
| P0-5 | Export close behavior inconsistency (inside/outside/non-drag click) | Export Workspace UX | M | Todo |
| P1-1 | Grid clipping across plate shapes | Grid/Surface Rendering | M | Todo |
| P1-2 | Grid + bounding-box dynamic contrast | Visual Contrast / Accessibility | M | Todo |
| P1-3 | Clear/Ceramic material fidelity regressions | Material Shading / Preset Tuning | M | Todo |
| P1-4 | Hover previews wrong (tilt no-preview, spin direction mismatch) | Animation Card UX / Preview State | S | Todo |
| P1-5 | Background Model Sync click action ambiguity | Preset Interaction UX | S | Todo |

### High-Value UX Follow-Ups (Post-Bugfix)

- [ ] Keep animation continuity after import and after image export (validate per format) (`continue-animation-after-import.png`, `consideration--after-png-export-resume-animation.png`, `advanced-option-pause-when-switching-to-image-share.png`).
- [ ] Reframe/level action should not alter user zoom unexpectedly (`level-and-reframe-maybe-shouldnt-change-the-zoom.png`).
- [ ] Export controls should be available outside crop mode or have a clearer mode switch (`export-should-be-accessible-outside-of-crop-view.png`).
- [ ] Add explicit rotation direction control (CW/CCW) and optional tilt pivot mode (top/bottom) (`missing-option-to-set-rotation-direction-CC-CCW.png`, `idea-toggle-to-tilt-animation-pivot-point-top-or-bottom.png`).
- [ ] Add keyboard shortcut hints where actions are primary (`pause-button-missing-tooltip-AND-could-use-keyboard-shortcut-hint-for-space.png`, `missing-keyboard-shorctus-in-about-menu.png`).
- [ ] Add explicit export duration control coverage for all relevant formats and state combinations (`missing-option-to-change-duration-in-export-menu.png`).
- [ ] Improve reorder UX sensitivity/discoverability in model manager (drag threshold + clear handle affordance) (`model-re-order-drag-too-sensitive-and-missing-drag-handles-ui.png`).
- [ ] Reassess export footer CTA density (`close-button-in-export-footer-unnecessary.png`).
- [ ] Export project package scope definition: ZIP should preserve settings, naming, and color state deterministically (`export-zip-project-settings-filename-capture-colors-etc.png`).
- [ ] Align HUD vertical rhythm for FPS badge and bottom-right control cluster (`vertically-center-FPS-with-d-pad-and-inspect-button.png`).

## Planning Principles

- Keep one active source of truth for open work.
- Sequence work by dependency so foundational stability lands first.
- Favor small, user-visible wins in each phase while unlocking larger architecture items.

## Phase A: Stability and UX Consistency (Now)

Goal: tighten reliability and interaction parity in existing flows before major feature expansion.

| Priority | Project | Type | Difficulty | Dependencies | Outcome |
|---|---|---|---|---|---|
| A1 | Multipart persistence hardening | State Persistence | M | None | Close refresh/restore edge cases for multipart appearance, selection state, and URL/local parity. |
| A2 | Interactive export duration dropdown refinements | Export UX | S | None | Tighten label, frame count, and estimate responsiveness parity across GIF/MP4. |
| A3 | Ruler part-hover supports single-part models | Bugfix | S | None | Ensure inspect hover dimensions work for single-part models, not only multipart. |
| A4 | Upload decision default simplification | Upload Flow UX | M | Existing upload decision modal | Replace warning-memory behavior with explicit persisted default (`Always Add`, `Always Replace`, `Ask`) and one-shot override in modal. |
| A5 | Model list sorting controls | Model Manager UX | S | None | Add explicit `A-Z` / `Z-A` sorting, keep `A-Z` as default baseline. |
| A6 | Active part arrow navigation | Interaction Design | S | None | Add next/previous controls to switch active selected part directly from selector UI. |
| A7 | New version indicator badge | Release UX | S | None | Add subtle update badge on About/App Settings entry when newer build metadata exists. |
| A8 | Upload modal persistence during native picker | Upload Flow UX | S | A4 | Prevent upload choice modal from closing while the OS file picker is open; when files are selected, update the modal file list and actions instead of re-opening. |
| A9 | Info panel keyboard shortcuts | UX / Docs | S | None | Add keyboard shortcuts list to the Info panel under "Navigate the 3d..." (minimum: `Esc` to close, `Space` to pause/play). |
| A10 | Model picker default positioning | UX | S | None | On desktop, prefer positioning the model picker modal anchored over the preview area (right side), not overlapping the left sidebar; support draggable/resizable floating behavior but default to preview-aligned placement. |
| A11 | Slider precise text entry mode | Controls UX | M | A1 | Add optional text-based numeric entry for slider-backed controls (shade/finish/etc.) with validation, keyboard support, and parity with existing slider snapping. |

## Phase B: Export and Workspace Foundation

Goal: complete one-surface export workflow and prepare for richer export/preset features.

| Priority | Project | Type | Difficulty | Dependencies | Outcome |
|---|---|---|---|---|---|
| B1 | Export workspace consolidation finish pass | Rendering UX | M | A1 | Complete one-surface framing cleanup and remove duplicate/legacy interaction paths. |
| B2 | Ruler persistence polish | Workspace Tools | M | A1 | Ensure ruler visibility, units, and placement state round-trip reliably through save/share flows. |
| B3 | Optional filename label in exports | Export UX | S | B1 | Add optional filename burn-in overlay for exported media. |
| B4 | Single-click canvas full-screen | Viewer UX | S | B1 | Add robust full-screen viewer entry/exit for desktop and mobile. |
| B5 | Watermark redesign and reintroduction | Branding/Export | M | B1 | Reintroduce watermark with consistent output behavior across GIF/MP4/PNG/JPEG. |
| B6 | Batch export presets | Export Workflow | M | B1 | Save and reapply reusable export settings for repetitive listing workflows. |
| B7 | Export time estimation & encoding performance | Export UX / Perf | M | B1 | Improve pre-export time estimates by adding a short preflight benchmark (sample frame render + encode timings), show live progress, and explore faster encoding paths (WebCodecs, WASM encoders, workerized dithering); investigate dithering cost and options for palette reuse to reduce per-frame work. |

## Phase C: Interaction and Architecture Expansion

Goal: establish maintainable structure and advanced editing interactions.

| Priority | Project | Type | Difficulty | Dependencies | Outcome |
|---|---|---|---|---|---|
| C1 | JavaScript module refactor (sortable naming) | Code Architecture | L | A1 | Split `script.js` into stable modules with clear boundaries and sortable naming. |
| C2 | Functions index + Copilot docs map | AI-assisted Dev Workflow | M | C1 | Add maintained function index and docs map for faster safe AI-assisted edits. |
| C3 | Settings-only undo stack | Interaction System | L | A1 | Implement Cmd/Ctrl+Z for settings mutations only, isolated from file operations. |
| C4 | Advanced measure mode | Geometry Tools | L | B2, C3 | Add two-point mesh measurements via raycast with robust filtering and unit parity. |
| C5 | Drag/move models on plate | Geometry Interaction | XL | A1, C3 | Add direct model placement with floor constraints, persisted transforms, and predictable multi-model behavior. |
| C6 | Pinnable cards | UI Architecture | L | C3 | Add pin/unpin quick-access rail with persistence, keyboard support, and overflow handling. |
| C7 | Full-screen model manager | Product Feature | L | A1 | Build dedicated manager with larger thumbs, rename/reorder/replace/remove/visibility workflows. |
| C8 | Preset gallery with save-as | Preset Management | M | C7 | Add named preset library and save-as flow for reusable appearance setups. |

## Phase D: Share and Cloud Strategy (Optional Program)

Goal: support short-link scene sharing for complex workspaces while preserving offline fallback.

| Priority | Project | Type | Difficulty | Dependencies | Outcome |
|---|---|---|---|---|---|
| D1 | Short-link configuration locker | Cloud Infrastructure | XL | Backend service decision | Use short IDs in URLs and store full scene JSON in an external locker service. |
| D2 | Passkey-gated sync model | Privacy/Security | XL | D1 | Enable account-less passkey-gated lock/unlock with zero-PII storage model. |
| D3 | Local-to-cloud STL UID rehydration | Data Mapping | XL | D1, D2 | Match local STL uploads to stored scene JSON via generated UIDs when opening shared links. |
| D4 | Manual JSON fallback flow | Reliability | M | D1 | Preserve fully offline JSON import/export path as no-server fallback. |

## Triage Queue (Needs Validation)

- Pendulum animation option with selectable pivot (top or bottom anchor).
- Crop/export simultaneous mode exploration with share-overlay toggle for comparing framed export and regular workspace views.
- Click-to-edit build plate interaction concept (direct canvas affordance vs settings-first flow).

Resolved decision:
- Export start position remains unchanged for now. Users can pause at the desired orientation before exporting.

## Execution Notes

- Run smoke checks: `npm run test:smoke`
- Install optional pre-commit smoke hook: `npm run setup:precommit-smoke`
- Remove optional pre-commit smoke hook: `npm run remove:precommit-smoke`
