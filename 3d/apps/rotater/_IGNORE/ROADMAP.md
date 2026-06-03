# Rotater Roadmap

Updated: 2026-05-28

This roadmap tracks incomplete work only. Completed work is recorded in CHANGELOG.md.

## Strategic Intent

- Stabilize trust in core interactions first (selection, camera, export behavior).
- Improve export throughput second (speed, presets, multi-variation automation).
- Expand architecture and advanced tooling only after reliability gates are met.

## Tracking Conventions

- This roadmap contains open work only (`Planned`, `Backlog`, or validation-in-progress items).
- Completed work is moved to `CHANGELOG.md` and removed from this file.
- Each active queue should use a priority table (avoid free-form lists for primary planning).

## Kanban Board (Single Source of Truth)

Design status key:
- `Needs design`: concept exists but interaction/spec is not defined enough to implement safely.
- `Details`: direction is known, but acceptance criteria or edge-case behavior still needs to be written.
- `Ready`: spec and acceptance criteria are clear enough to implement.

### Active Reliability Queue (Now)

| ID | Project | Type | Difficulty | Design Status | Notes |
|---|---|---|---|---|---|
| R0 | No open P0/P1 reliability blockers | Reliability | - | Ready | Add new regressions here first with owner + repro links |

### Validate Now (Recently Shipped)

| ID | Project | Type | Difficulty | Design Status | Notes |
|---|---|---|---|---|---|
| V1 | Multi-select state parity on reopen (OFF mismatch regression) | Validation | S | Ready | Validate across open/close and reload paths |
| V2 | Multi-select toggle behavior should not pause animation | Validation | S | Ready | Validate with Spin/Tilt active |
| V3 | Right-drag vertical-lock behavior and pivot stability in spin/tilt flows | Validation | M | Details | Add expected-pivot assertions to smoke checklist |
| V4 | Preset-apply FPS regression mitigation under repeated color/preset switching | Validation | M | Details | Capture baseline/after FPS sampling protocol |
| V5 | Benchy load should always level and reframe | Validation | S | Ready | Validate first load + reset/load cycles |

### Ready Next

| Rank | ID | Project | Type | Difficulty | User Impact | Implementation Risk | Design Status | Dependencies |
|---|---|---|---|---|---|---|---|---|
| 1 | A10 | Model picker default positioning | UX | S | M | L | Ready | None |
| 2 | A2 | Interactive export duration dropdown refinements | Export UX | S | M | L | Ready | None |
| 3 | A4 | Upload decision default simplification | Upload Flow UX | M | H | M | Details | Existing upload decision modal |
| 4 | A1 | Multipart persistence hardening | State Persistence | M | H | H | Details | None |
| 5 | B2 | Ruler persistence polish | Workspace Tools | M | M | M | Needs design | A1 |
| 6 | B1 | Export workspace consolidation finish pass | Rendering UX | M | H | M | Details | A1 |

### Triage Queue (Needs Validation)

| ID | Project | Type | Difficulty | Design Status | Notes |
|---|---|---|---|---|---|
| T1 | Optional tilt pivot choice (top/bottom anchor) | Motion UX | M | Needs design | Confirm naming and default behavior |
| T2 | Crop/export simultaneous mode exploration with share-overlay toggle | Export UX | M | Needs design | Validate with existing crop workflow |
| T3 | Click-to-edit build plate interaction concept (canvas-first affordance) | Interaction UX | M | Needs design | Prototype-only until conflict matrix is defined |

### Planned Queue

| ID | Project | Type | Difficulty | Design Status | Dependencies |
|---|---|---|---|---|---|
| A5 | Model list sorting controls | Model Manager UX | S | Needs design | None |
| A6 | Active part arrow navigation | Interaction Design | S | Details | None |
| A8 | Upload modal persistence during native picker | Upload Flow UX | S | Ready | A4 |
| B3 | Optional filename label in exports | Export UX | S | Ready | B1 |
| B4 | Single-click canvas full-screen | Viewer UX | S | Details | B1 |
| B5 | Watermark redesign and reintroduction | Branding/Export | M | Needs design | B1 |
| B6 | Batch export presets | Export Workflow | M | Details | B1 |
| B7 | Export time estimation and encoding performance | Export UX / Perf | M | Details | B1 |
| B8 | Export variation matrix (BG/Plate toggles) | Export Workflow | M | Details | B1 |
| B9 | Save my filament swatches (hex save/reuse palette) | Preset Management | M | Needs design | C8 |
| U1 | Animation continuity after import and after still export | Motion UX | M | Details | A1 |
| U2 | Reframe/level action should avoid unexpected zoom changes | Camera UX | S | Ready | A1 |
| U3 | Export controls outside crop mode or clearer mode model | Export UX | M | Needs design | B1 |
| U4 | Export duration controls parity across all formats/states | Export UX | S | Details | A2 |
| U5 | Model reorder threshold and drag-handle discoverability | Model Manager UX | S | Needs design | A5 |
| U6 | Export footer CTA density and hierarchy cleanup | UI UX | S | Ready | B1 |
| U7 | ZIP project scope hardening (settings/naming/colors deterministic on restore) | Reliability | M | Details | A1 |
| U8 | HUD vertical rhythm alignment (FPS badge and action cluster) | Viewer UX | S | Ready | None |
| U9 | Cross-sync source parity: BG Sync from Surface selector + Surface Sync from BG selector | Sync UX | M | Needs design | A1 |
| U10 | Floating model window multi-select 3-dots bulk menu (phase 1: Delete Models) | Model Manager UX | S | Details | A5 |
| U11 | Export overlay blur treatment reconsideration (avoid preview blur while preserving focus) | Export UX | S | Needs design | B1 |

### Later Queue

| ID | Project | Type | Difficulty | Design Status | Dependencies |
|---|---|---|---|---|---|
| C1 | JavaScript module refactor (sortable naming) | Code Architecture | L | Details | A1 |
| C2 | Functions index + Copilot docs map | AI-assisted Dev Workflow | M | Details | C1 |
| C3 | Settings-only undo stack | Interaction System | L | Needs design | A1 |
| C4 | Advanced measure mode | Geometry Tools | L | Needs design | B2, C3 |
| C5 | Drag/move models on plate | Geometry Interaction | XL | Needs design | A1, C3 |
| C6 | Pinnable cards | UI Architecture | L | Needs design | C3 |
| C7 | Full-screen model manager | Product Feature | L | Details | A1 |
| C8 | Preset gallery with save-as | Preset Management | M | Details | C7 |

### Backlog / Blocked

| ID | Project | Type | Difficulty | Design Status | Blocker |
|---|---|---|---|---|---|
| D1 | Short-link configuration locker | Cloud Infrastructure | XL | Needs design | Backend service decision |
| D2 | Passkey-gated sync model | Privacy/Security | XL | Needs design | D1 |
| D3 | Local-to-cloud STL UID rehydration | Data Mapping | XL | Needs design | D1, D2 |
| D4 | Manual JSON fallback flow | Reliability | M | Details | D1 |

## Recommended Next Commit Sequence

1. `A10` Model picker default positioning (small UX win, low risk).
2. `A2` Export duration dropdown refinements (small UX win, low risk).
3. `A4` Upload decision default simplification (high impact, moderate risk).
4. `A1` Multipart persistence hardening (high impact, highest risk, unlocks dependencies).
5. `B2` Ruler persistence polish (depends on A1).
6. `B1` Export workspace consolidation finish pass (depends on A1 and unlocks B3+).

## Critical Path and Gates

- Gate 1: Maintain an empty active reliability queue before starting new Phase B features beyond B1/B2.
- Gate 2: Land B1 before B3/B5/B6/B7/B8.
- Gate 3: Land C1 before C2, and C3 before C4/C5/C6.
- Gate 4: Do not begin Phase D implementation until cloud architecture decision is explicit.

Resolved decision:
- Export start position remains unchanged. Users can pause at desired orientation before export.

## Execution Notes

- Run smoke checks: npm run test:smoke
- Install optional pre-commit smoke hook: npm run setup:precommit-smoke
- Remove optional pre-commit smoke hook: npm run remove:precommit-smoke
