# Rotater Roadmap

Updated: 2026-05-25

This roadmap tracks incomplete work only. Completed work is recorded in CHANGELOG.md.

## Strategic Intent

- Stabilize trust in core interactions first (selection, camera, export behavior).
- Improve export throughput second (speed, presets, multi-variation automation).
- Expand architecture and advanced tooling only after reliability gates are met.

## Current Operating View (Single Source of Truth)

### Active Reliability Queue (Now)

| Rank | Item | Why It Matters | Effort | Status |
|---|---|---|---|---|
| P0-1 | Export close behavior consistency (inside/outside/non-drag click) | Prevents accidental modal loss and interaction confusion in Share flow | M | Done |
| P1-1 | Hover preview correctness (tilt preview + spin direction parity) | Animation affordance must match actual runtime behavior | S | Done |
| P1-2 | Grid clipping across build plate shapes | Visual correctness issue in core workspace context | M | Done |
| P1-3 | Grid + model bounding-box dynamic contrast | Legibility/accessibility across light/dark and colored surfaces | M | Done |
| P1-4 | Clear/Ceramic material fidelity | Product quality and confidence in material preset output | M | Done |
| P1-5 | Background Model Sync click action disambiguation | Prevent accidental state changes from ambiguous click targets | S | Done |

### Stabilization Watchlist (Recently Shipped, Validate)

- Multi-select state parity on reopen (OFF mismatch regression).
- Multi-select toggle behavior should not pause animation.
- Right-drag vertical-lock behavior and pivot stability in spin/tilt flows.
- Preset-apply FPS regression mitigation under repeated color/preset switching.
- Benchy load should always level and reframe.

### High-Value UX Follow-Ups (After Reliability Queue)

- Animation continuity after import and after still export.
- Reframe/level action should avoid unexpected zoom changes.
- Export controls available outside crop mode, or a clearer mode model.
- Optional tilt pivot choice (top/bottom) for alternate motion style.
- Export duration controls parity across all relevant formats/states.
- Model reorder UX threshold and drag-handle discoverability.
- Export footer CTA density and hierarchy cleanup.
- ZIP project scope hardening (settings, naming, colors deterministic on restore).
- HUD vertical rhythm alignment (FPS badge and action cluster).

### Release Train (Target Build Windows)

| Train | Target Build Window | Scope | Exit Criteria |
|---|---|---|---|
| T1 | 2.2.27 (shipped) | P0-1 export close behavior consistency | Single non-drag click close is deterministic; crop inside-frame exception preserved |
| T2 | 2.2.28 (shipped) | P1-1 hover preview correctness + P1-5 sync-click disambiguation | Hover previews match runtime direction/motion; sync click does one clear action |
| T3 | 2.2.29 (shipped) | P1-2 grid clipping + P1-3 dynamic contrast | Grid renders correctly across plate shapes and remains legible across themes/colors |
| T4 | 2.2.30 (shipped) | P1-4 clear/ceramic fidelity + stabilization watchlist sweep | Material output passes visual QA and recently shipped regressions remain closed |

Release policy:
- Do not pull new UX expansion from follow-ups until T1-T4 reliability train is complete.
- Each train requires smoke checks plus targeted manual QA against the related VQA screenshot set.

## Program Plan

### Phase A: Stability and UX Consistency

Goal: close interaction regressions and remove ambiguous behavior before feature expansion.

| ID | Project | Type | Difficulty | Dependencies | Status |
|---|---|---|---|---|---|
| A1 | Multipart persistence hardening | State Persistence | M | None | Planned |
| A2 | Interactive export duration dropdown refinements | Export UX | S | None | Planned |
| A3 | Ruler part-hover supports single-part models | Bugfix | S | None | Planned |
| A4 | Upload decision default simplification | Upload Flow UX | M | Existing upload decision modal | Planned |
| A5 | Model list sorting controls | Model Manager UX | S | None | Planned |
| A6 | Active part arrow navigation | Interaction Design | S | None | Planned |
| A7 | New version indicator badge | Release UX | S | None | Done |
| A8 | Upload modal persistence during native picker | Upload Flow UX | S | A4 | Planned |
| A9 | Info panel keyboard shortcuts | UX / Docs | S | None | Done |
| A10 | Model picker default positioning | UX | S | None | Planned |
| A11 | Slider precise text entry mode | Controls UX | M | None | Done |

### Phase B: Export and Workspace Foundation

Goal: make export reliable, faster, and scalable for repetitive production output.

| ID | Project | Type | Difficulty | Dependencies | Status |
|---|---|---|---|---|---|
| B1 | Export workspace consolidation finish pass | Rendering UX | M | A1 | Planned |
| B2 | Ruler persistence polish | Workspace Tools | M | A1 | Planned |
| B3 | Optional filename label in exports | Export UX | S | B1 | Planned |
| B4 | Single-click canvas full-screen | Viewer UX | S | B1 | Planned |
| B5 | Watermark redesign and reintroduction | Branding/Export | M | B1 | Planned |
| B6 | Batch export presets | Export Workflow | M | B1 | Planned |
| B7 | Export time estimation and encoding performance | Export UX / Perf | M | B1 | Planned |
| B8 | Export variation matrix (BG/Plate toggles) | Export Workflow | M | B1 | Planned |

### Phase C: Interaction and Architecture Expansion

Goal: establish maintainable architecture and advanced workspace interactions.

| ID | Project | Type | Difficulty | Dependencies | Status |
|---|---|---|---|---|---|
| C1 | JavaScript module refactor (sortable naming) | Code Architecture | L | A1 | Planned |
| C2 | Functions index + Copilot docs map | AI-assisted Dev Workflow | M | C1 | Planned |
| C3 | Settings-only undo stack | Interaction System | L | A1 | Planned |
| C4 | Advanced measure mode | Geometry Tools | L | B2, C3 | Planned |
| C5 | Drag/move models on plate | Geometry Interaction | XL | A1, C3 | Planned |
| C6 | Pinnable cards | UI Architecture | L | C3 | Planned |
| C7 | Full-screen model manager | Product Feature | L | A1 | Planned |
| C8 | Preset gallery with save-as | Preset Management | M | C7 | Planned |

### Phase D: Share and Cloud Strategy (Optional Program)

Goal: support short-link scene sharing with robust offline fallback.

| ID | Project | Type | Difficulty | Dependencies | Status |
|---|---|---|---|---|---|
| D1 | Short-link configuration locker | Cloud Infrastructure | XL | Backend service decision | Backlog |
| D2 | Passkey-gated sync model | Privacy/Security | XL | D1 | Backlog |
| D3 | Local-to-cloud STL UID rehydration | Data Mapping | XL | D1, D2 | Backlog |
| D4 | Manual JSON fallback flow | Reliability | M | D1 | Backlog |

## Critical Path and Gates

- Gate 1: Complete active reliability queue before starting new Phase B features beyond B1/B2.
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
