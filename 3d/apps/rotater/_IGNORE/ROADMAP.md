# Rotater Roadmap

Updated: 2026-05-27

This roadmap tracks incomplete work only. Completed work is recorded in CHANGELOG.md.

## Strategic Intent

- Stabilize trust in core interactions first (selection, camera, export behavior).
- Improve export throughput second (speed, presets, multi-variation automation).
- Expand architecture and advanced tooling only after reliability gates are met.

## Tracking Conventions

- This roadmap contains open work only (`Planned`, `Backlog`, or validation-in-progress items).
- Completed work is moved to `CHANGELOG.md` and removed from this file.
- Each active queue should use a priority table (avoid free-form lists for primary planning).

## Current Operating View (Single Source of Truth)

### Active Reliability Queue (Now)

No open P0/P1 reliability blockers at this time. New regressions should be added here with explicit rank and effort.

### Stabilization Watchlist (Recently Shipped, Validate)

| Priority | Item | Status |
|---|---|---|
| V1 | Multi-select state parity on reopen (OFF mismatch regression) | Validate |
| V1 | Multi-select toggle behavior should not pause animation | Validate |
| V2 | Right-drag vertical-lock behavior and pivot stability in spin/tilt flows | Validate |
| V2 | Preset-apply FPS regression mitigation under repeated color/preset switching | Validate |
| V2 | Benchy load should always level and reframe | Validate |

### High-Value UX Follow-Ups (After Reliability Queue)

| Priority | Item | Effort | Status |
|---|---|---|---|
| P2 | Animation continuity after import and after still export | M | Planned |
| P2 | Reframe/level action should avoid unexpected zoom changes | S | Planned |
| P2 | Export controls available outside crop mode, or a clearer mode model | M | Planned |
| P3 | Optional tilt pivot choice (top/bottom) for alternate motion style | M | Planned |
| P3 | Export duration controls parity across all relevant formats/states | S | Planned |
| P3 | Model reorder UX threshold and drag-handle discoverability | S | Planned |
| P3 | Export footer CTA density and hierarchy cleanup | S | Planned |
| P3 | ZIP project scope hardening (settings, naming, colors deterministic on restore) | M | Planned |
| P3 | HUD vertical rhythm alignment (FPS badge and action cluster) | S | Planned |

## Kanban Board (Single Source of Truth)

### Ready Next

| ID | Project | Type | Difficulty | Dependencies |
|---|---|---|---|---|
| A1 | Multipart persistence hardening | State Persistence | M | None |
| A2 | Interactive export duration dropdown refinements | Export UX | S | None |
| A4 | Upload decision default simplification | Upload Flow UX | M | Existing upload decision modal |
| A10 | Model picker default positioning | UX | S | None |
| B1 | Export workspace consolidation finish pass | Rendering UX | M | A1 |
| B2 | Ruler persistence polish | Workspace Tools | M | A1 |

### Planned Queue

| ID | Project | Type | Difficulty | Dependencies |
|---|---|---|---|---|
| A5 | Model list sorting controls | Model Manager UX | S | None |
| A6 | Active part arrow navigation | Interaction Design | S | None |
| A8 | Upload modal persistence during native picker | Upload Flow UX | S | A4 |
| B3 | Optional filename label in exports | Export UX | S | B1 |
| B4 | Single-click canvas full-screen | Viewer UX | S | B1 |
| B5 | Watermark redesign and reintroduction | Branding/Export | M | B1 |
| B6 | Batch export presets | Export Workflow | M | B1 |
| B7 | Export time estimation and encoding performance | Export UX / Perf | M | B1 |
| B8 | Export variation matrix (BG/Plate toggles) | Export Workflow | M | B1 |

### Later Queue

| ID | Project | Type | Difficulty | Dependencies |
|---|---|---|---|---|
| C1 | JavaScript module refactor (sortable naming) | Code Architecture | L | A1 |
| C2 | Functions index + Copilot docs map | AI-assisted Dev Workflow | M | C1 |
| C3 | Settings-only undo stack | Interaction System | L | A1 |
| C4 | Advanced measure mode | Geometry Tools | L | B2, C3 |
| C5 | Drag/move models on plate | Geometry Interaction | XL | A1, C3 |
| C6 | Pinnable cards | UI Architecture | L | C3 |
| C7 | Full-screen model manager | Product Feature | L | A1 |
| C8 | Preset gallery with save-as | Preset Management | M | C7 |

### Backlog / Blocked

| ID | Project | Type | Difficulty | Blocker |
|---|---|---|---|---|
| D1 | Short-link configuration locker | Cloud Infrastructure | XL | Backend service decision |
| D2 | Passkey-gated sync model | Privacy/Security | XL | D1 |
| D3 | Local-to-cloud STL UID rehydration | Data Mapping | XL | D1, D2 |
| D4 | Manual JSON fallback flow | Reliability | M | D1 |

## Critical Path and Gates

- Gate 1: Maintain an empty active reliability queue before starting new Phase B features beyond B1/B2.
- Gate 2: Land B1 before B3/B5/B6/B7/B8.
- Gate 3: Land C1 before C2, and C3 before C4/C5/C6.
- Gate 4: Do not begin Phase D implementation until cloud architecture decision is explicit.

## Triage Queue (Needs Validation)

- Pendulum animation option with selectable pivot (top or bottom anchor).
- Crop/export simultaneous mode exploration with share-overlay toggle.
- Click-to-edit build plate interaction concept (canvas-first affordance).

Resolved decision:
- Export start position remains unchanged. Users can pause at desired orientation before export.

## Execution Notes

- Run smoke checks: npm run test:smoke
- Install optional pre-commit smoke hook: npm run setup:precommit-smoke
- Remove optional pre-commit smoke hook: npm run remove:precommit-smoke
