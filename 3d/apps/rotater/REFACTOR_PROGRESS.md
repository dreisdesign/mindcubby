# C1 Refactor Progress

Last updated: 2026-05-22
Roadmap reference: C1 in [_IGNORE/ROADMAP.md](_IGNORE/ROADMAP.md)

Goal: split large runtime logic in script.js into stable modules with clear boundaries and sortable naming.

## Current Status

- Status: in progress
- Completed slices: 5
- Current strategy: behavior-preserving extraction first, then internal cleanup in each module

## Completed Slices

1. Menu placement utility extraction
- Module: [modules/menu-positioning.js](modules/menu-positioning.js)
- Scope: shared action-menu placement math (viewport/panel-aware)
- Shipped in commit: feaecd3

2. Model-part action menus extraction
- Module: [modules/model-part-action-menus.js](modules/model-part-action-menus.js)
- Scope: close/reset + position behavior for model-part action menus
- script.js now delegates through thin wrappers
- Shipped in commit: 4e12bc4

3. Orbit frame-state utility extraction
- Module: [modules/orbit-frame-state.js](modules/orbit-frame-state.js)
- Scope: non-allocating orbit frame-state reads and camera placement math
- script.js now delegates through thin wrappers
- Shipped in commit: 4e885ed

4. Viewport performance utility extraction
- Module: [modules/viewport-performance.js](modules/viewport-performance.js)
- Scope: adaptive viewport pixel-ratio policy and frame-pressure tracking
- script.js now delegates through thin wrappers
- Shipped in commit: 14ed52b

5. Model picker controller extraction
- Module: [modules/model-picker-controller.js](modules/model-picker-controller.js)
- Scope: menu open/close controller logic around model selector + sync source menus
- script.js now delegates through thin wrappers
- Shipped in commit: 816338d

## Module Index (C1 Workstream)

| Module | Responsibility | Status | Introduced |
|---|---|---|---|
| [modules/menu-positioning.js](modules/menu-positioning.js) | Compute menu placement coordinates with viewport and local container constraints | Active | feaecd3 |
| [modules/model-part-action-menus.js](modules/model-part-action-menus.js) | Close and place model-part action menus | Active | 4e12bc4 |
| [modules/orbit-frame-state.js](modules/orbit-frame-state.js) | Orbit frame-state reads and camera-from-orbit transform helpers | Active | 4e885ed |
| [modules/viewport-performance.js](modules/viewport-performance.js) | Adaptive viewport quality and pixel-ratio helpers | Active | 14ed52b |
| [modules/model-picker-controller.js](modules/model-picker-controller.js) | Controller helpers for selector/sync menu open-close behavior | Active | 816338d |

## Recent Milestone Commits

- 816338d refactor(c1): extract model picker controller module
- 14ed52b refactor(c1): extract viewport performance module and adaptive DPR
- 4e885ed refactor(c1): extract orbit frame-state helpers module
- 4e12bc4 Continue C1: extract model-part action-menu module
- feaecd3 Fix picker menu dismissal and preview click pause; update docs; start C1 module split

## Next Planned Extractions

1. Picker floating behavior and drag state helpers
- Target: floating card drag/restore/position behavior
- Candidate module: modules/model-picker-floating.js

2. Slider commit/debounce orchestration
- Target: tone/color commit timers and deferred persistence hooks
- Candidate module: modules/model-edit-commit.js

## Guardrails

- Preserve runtime behavior before structural cleanup.
- Keep wrappers in script.js during transition so call sites remain stable.
- Add small focused commits per slice.
- Run smoke checks after each extraction.
