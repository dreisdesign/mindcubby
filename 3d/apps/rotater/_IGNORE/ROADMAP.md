# Rotater Roadmap

Updated: 2026-05-22

This roadmap contains only incomplete work. Completed items belong in `CHANGELOG.md`.

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
