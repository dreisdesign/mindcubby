# C1 Refactor Progress

Last updated: 2026-05-22
Roadmap reference: C1 in [_IGNORE/ROADMAP.md](_IGNORE/ROADMAP.md)

Goal: split large runtime logic in script.js into stable modules with clear boundaries and sortable naming.

## Current Status

- Status: in progress
- Completed slices: 2
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

## Module Index (C1 Workstream)

| Module | Responsibility | Status | Introduced |
|---|---|---|---|
| [modules/menu-positioning.js](modules/menu-positioning.js) | Compute menu placement coordinates with viewport and local container constraints | Active | feaecd3 |
| [modules/model-part-action-menus.js](modules/model-part-action-menus.js) | Close and place model-part action menus | Active | 4e12bc4 |

## Recent Milestone Commits

- 4e12bc4 Continue C1: extract model-part action-menu module
- feaecd3 Fix picker menu dismissal and preview click pause; update docs; start C1 module split

## Next Planned Extractions

1. Model picker open/close and anchor orchestration
- Target: menu open/close controller logic around selector + sync menus
- Candidate module: modules/model-picker-controller.js

2. Picker floating behavior and drag state helpers
- Target: floating card drag/restore/position behavior
- Candidate module: modules/model-picker-floating.js

3. Slider commit/debounce orchestration
- Target: tone/color commit timers and deferred persistence hooks
- Candidate module: modules/model-edit-commit.js

## Guardrails

- Preserve runtime behavior before structural cleanup.
- Keep wrappers in script.js during transition so call sites remain stable.
- Add small focused commits per slice.
- Run smoke checks after each extraction.
