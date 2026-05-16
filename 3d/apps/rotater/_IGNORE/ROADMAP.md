# Rotater Roadmap
---

Updated: 2026-05-15

This roadmap is sorted by readiness (dependency order). Every project includes a project type, estimated difficulty, and required dependencies.

## Cohesive Program Plan

### Phase 1 (completed)

Completed work archived in `_IGNORE/ROADMAP_ARCHIVE.md` and tracked in `CHANGELOG.md` (Unreleased).

### Phase 2 (completed)

Completed work archived in `_IGNORE/ROADMAP_ARCHIVE.md` and tracked in `CHANGELOG.md` (Unreleased).

### Phase 3

Completed work archived in `_IGNORE/ROADMAP_ARCHIVE.md` and tracked in `CHANGELOG.md` (Unreleased).

Remaining / Fast-follow:

1. Interactive Export duration dropdown refinements — queued (label/estimate responsiveness parity across GIF/MP4)

### Track Integration Map

Track 1: Server-side storage strategy (combined A + C)

- Problem: complex scene settings can exceed practical URL length limits for sharing.
- Solution direction is implemented through existing roadmap items:
	- `Short-link configuration locker`
	- `Passkey-gated sync model`
	- `Local-to-cloud STL UID rehydration`
	- `Manual JSON fallback flow`

Track 2: Ruler and measurement system (feature enhancement)

- Spatial context and alignment are implemented through existing roadmap items:
	- `Ruler persistence polish`
	- `Ruler part-hover inspect mode` (implemented)
	- `Preview click-to-select model parts` (implemented)
	- `Click-to-select parts (single & multi-select)` (implemented)
	- `Advanced measure mode`
	- `Drag / move models on plate`

### Shared workflow legend

| Stage | Action | Technical detail |
|---|---|---|
| Setup | Upload local STLs | App generates UIDs for file matching. |
| Design | Adjust settings and use ruler | Changes are tracked in scene JSON state. |
| Save | Enter passkey and sync | Full JSON is stored in locker service; short ID is returned. |
| Share | Distribute short URL | Link stays clean and below URL length limits. |
| Load | Open link and re-upload local files | App fetches scene JSON and rehydrates by UID match. |

## Readiness 1: Ready Now (no blockers)

| Project | Project Type | Estimated Difficulty | Dependencies | Scope |
|---|---|---|---|---|
| Regression automation baseline (simple) | QA / Tooling | M | None | Create lightweight automated smoke tests (unit + integration) for highest-risk regressions from changelog history, keeping runtime short so maintenance stays low. |
| Optional pre-commit smoke gate | Dev Workflow | S | Regression automation baseline (simple) | Add an optional git pre-commit hook that runs only fast checks (smoke tests + lint) so automation helps without creating heavy workflow friction. |
| Model list sorting controls | Model Manager UX | S | None | Add model list sorting options with explicit choices: A-Z (ascending) and Z-A (descending). Keep A-Z as the default baseline order. |
| Auto-brightness toggle reveal animation | Microinteraction UX | S | None | When Auto Brightness is toggled OFF, reveal the shade slider first, then animate the knob from auto position (for example -100) toward neutral center so the state change is visible. |
| Multipart selection language cleanup | UX Copy | S | None | Replace compressed multi-select wording with clearer selected-part wording for 3+ selections (for example `Parts 1, 2, 3 selected`). |
| Active part arrow navigation | Interaction Design | S | None | Add next/previous arrows to switch active selected model part directly from the selector UI. |
| D-pad visibility preference | UX Settings | S | None | Add App Settings toggle for Show/Hide D-pad; when hidden, move Pause control to bottom-right for accessible reach. |
| New version indicator badge | Release UX | S | None | Add a small red badge to the Info entry in App Settings when build metadata indicates a newer version is available. |
| Export duration selector parity | Export UX | M | None | Replace static frame-count display with shared GIF/MP4 duration dropdown that shows duration and derived frame count. |
| Interactive export duration dropdown refinements (fast-follow) | Export UX | S | Export duration selector parity | Improve dropdown interaction polish so duration labels, frame counts, and estimate rows update with tighter parity across GIF and MP4 paths. |
| Upload decision default simplification | Upload Flow UX | M | Existing upload decision modal | Replace warning-memory behavior with explicit persisted default (`Always Add`, `Always Replace`, `Ask`) plus one-time override in modal. |
| Reset everything also resets Lighting Effects & Animation | UX Settings | S | None | Extend the global `Reset everything` action to clear the Lighting Effects and Animation card state (speed, tilt/wobble, light height/intensity) so a full reset is comprehensive. |
| Ruler part-hover supports single-part models | Bugfix | S | None | Ensure `Part hover` mode can be enabled and displays dimensions even when the model has a single part. |

## Readiness 2: Depends on stabilization work

| Project | Project Type | Estimated Difficulty | Dependencies | Scope |
|---|---|---|---|---|
| Multipart persistence hardening | State Persistence | M | Regression automation baseline (simple) | Close remaining refresh/restore edge cases for multipart appearance, checkbox state, and URL/local storage parity. |
| JavaScript module refactor (sortable naming) | Code Architecture | L | Regression automation baseline (simple) | Split script logic into JS modules, adopt sortable file naming, and migrate incrementally behind stable import boundaries. |
| Functions index + Copilot docs map | AI-assisted Dev Workflow | M | JavaScript module refactor (sortable naming) | Create a maintained functions index and Copilot instruction references that point to project docs so AI-assisted edits can resolve context faster. |
| Export workspace consolidation finish pass | Rendering UX | M | Multipart persistence hardening | Complete one-surface export framing cleanup and remove remaining duplicate or legacy interaction paths. |
| Ruler persistence polish | Workspace Tools | M | Multipart persistence hardening | Ensure ruler visibility, unit mode, and placement state round-trip reliably in saved state and shared links. |

## Readiness 3: Requires core architecture pieces

| Project | Project Type | Estimated Difficulty | Dependencies | Scope |
|---|---|---|---|---|
| Advanced measure mode | Geometry Tools | L | Ruler persistence polish, Multipart persistence hardening | Add two-point mesh measurement via raycast + ruler units with robust hidden-part and transparent-material filtering. |
| Settings-only undo stack | Interaction System | L | Multipart persistence hardening | Implement Cmd/Ctrl+Z for settings mutations only, isolated from file operations (load/append/replace). |
| Drag / move models on plate | Geometry Interaction | XL | Settings-only undo stack, Multipart persistence hardening | Add direct model dragging/placement on the build plate with floor constraints, transform persistence, and predictable multi-model interaction rules. |
| Pinnable cards | UI Architecture | L | Settings-only undo stack | Pin/unpin cards to a quick-access rail with persistent state, keyboard support, and overflow handling. |

## Readiness 4: Cross-system initiatives

| Project | Project Type | Estimated Difficulty | Dependencies | Scope |
|---|---|---|---|---|
| Full-screen model manager | Product Feature | L | Multipart persistence hardening | Build a dedicated model manager with larger thumbnails, rename, reorder, replace, remove, and visibility workflows. |
| Short-link configuration locker | Cloud Infrastructure | XL | Backend service decision | Use short IDs in URLs and store full scene JSON in an external service suitable for static hosting workflows. |
| Passkey-gated sync model | Privacy/Security | XL | Short-link configuration locker | Enable account-less passkey-gated lock/unlock semantics with zero-PII storage patterns. |
| Local-to-cloud STL UID rehydration | Data Mapping | XL | Short-link configuration locker, passkey-gated sync model | Match local STL uploads to server-stored scene JSON using generated UIDs when opening shared links. |
| Manual JSON fallback flow | Reliability | M | Short-link configuration locker | Keep fully offline export/import JSON flow available as a no-server fallback path. |

## Readiness 5: Optional backlog

| Project | Project Type | Estimated Difficulty | Dependencies | Scope |
|---|---|---|---|---|
| Optional filename label in exports | Export UX | S | Export workspace consolidation finish pass | Add optional filename burn-in overlay for exported media. |
| Watermark redesign and reintroduction | Branding / Export | M | Export workspace consolidation finish pass | Revisit watermark only after validating consistent behavior across GIF/MP4/PNG/JPEG pipelines. |
| Single-click canvas full-screen | Viewer UX | S | Export workspace consolidation finish pass | Add instant full-screen viewer mode with reliable mobile and desktop behavior. |
| Batch export presets | Export Workflow | M | Regression automation baseline (simple) | Save and reapply repeatable export settings for listing-generation workflows. |
| Preset gallery with save-as | Preset Management | M | Full-screen model manager | Add named preset library and save-as flow for reusable model looks. |

## Status Notes

| Item | Status |
|---|---|
| Legacy standalone "Export Workspace Cleanup" item | Folded into Export workspace consolidation finish pass (not tracked separately). |
| Preview click-to-select + Select mode projects | Implemented and removed from the open roadmap. |
| Prior mixed "report + queue" layout | Replaced by dependency-ordered project planning layout. |
| Testing scripts + pre-commit request | Consolidated into one testing baseline project plus an optional pre-commit gate to avoid duplicate roadmap items. |

## Execution Notes

- Run smoke checks: `npm run test:smoke`
- Install optional pre-commit smoke hook: `npm run setup:precommit-smoke`
- Remove optional pre-commit smoke hook: `npm run remove:precommit-smoke`
