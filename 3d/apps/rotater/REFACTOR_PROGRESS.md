# C1 Refactor Progress

Last updated: 2026-05-23
Roadmap reference: C1 in [_IGNORE/ROADMAP.md](_IGNORE/ROADMAP.md)

Goal: split large runtime logic in script.js into stable modules with clear boundaries and sortable naming.

## Current Status

- Status: in progress
- Completed slices: 13
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

6. Model picker floating helpers extraction
- Module: [modules/model-picker-floating.js](modules/model-picker-floating.js)
- Scope: floating model picker card positioning, persisted placement restore, and drag lifecycle wiring
- script.js now delegates through thin wrappers
- Shipped in commit: a3f92b3

7. Slider commit/debounce orchestration extraction
- Module: [modules/model-edit-commit.js](modules/model-edit-commit.js)
- Scope: deferred model-edit commit queues, multipart persist scheduling, and RAF preview scheduling primitives
- script.js now delegates timer orchestration through thin wrappers
- Shipped in commit: pending

8. Settings URL sync debounce extraction
- Module: [modules/settings-url-sync.js](modules/settings-url-sync.js)
- Scope: save-flow URL sync debounce/flush scheduling primitives
- script.js now delegates timer orchestration through thin wrappers
- Shipped in commit: pending

9. Upload/import action orchestration extraction
- Module: [modules/upload-action-controller.js](modules/upload-action-controller.js)
- Scope: upload action normalization plus pending-action and prompt resolver orchestration
- script.js now delegates action routing state through thin wrappers
- Shipped in commit: pending

10. Upload choice UI state extraction
- Module: [modules/upload-choice-ui.js](modules/upload-choice-ui.js)
- Scope: upload choice file-list rendering/view-state helpers and prompt text synchronization
- script.js now delegates upload-choice UI state/render through thin wrappers
- Shipped in commit: pending

11. Collapsed export warning orchestration extraction
- Module: [modules/export-collapsed-confirm.js](modules/export-collapsed-confirm.js)
- Scope: collapsed export confirm resolver lifecycle and modal open/close routing
- script.js now delegates confirm prompt resolver orchestration through thin wrappers
- Shipped in commit: pending

12. Collapsed export summary rendering extraction
- Module: [modules/export-collapsed-summary.js](modules/export-collapsed-summary.js)
- Scope: collapsed export summary UI markup and bound control synchronization wiring
- script.js now delegates summary render/bind orchestration through thin wrappers
- Shipped in commit: pending

13. Export labels/options helper extraction
- Module: [modules/export-labels.js](modules/export-labels.js)
- Scope: export format/quality/speed label and option-list composition helpers
- script.js and summary renderer now delegate label/option composition through thin wrappers
- Shipped in commit: pending

## Module Index (C1 Workstream)

| Module | Responsibility | Status | Introduced |
|---|---|---|---|
| [modules/menu-positioning.js](modules/menu-positioning.js) | Compute menu placement coordinates with viewport and local container constraints | Active | feaecd3 |
| [modules/model-part-action-menus.js](modules/model-part-action-menus.js) | Close and place model-part action menus | Active | 4e12bc4 |
| [modules/orbit-frame-state.js](modules/orbit-frame-state.js) | Orbit frame-state reads and camera-from-orbit transform helpers | Active | 4e885ed |
| [modules/viewport-performance.js](modules/viewport-performance.js) | Adaptive viewport quality and pixel-ratio helpers | Active | 14ed52b |
| [modules/model-picker-controller.js](modules/model-picker-controller.js) | Controller helpers for selector/sync menu open-close behavior | Active | 816338d |
| [modules/model-picker-floating.js](modules/model-picker-floating.js) | Floating picker card positioning, persisted placement restore, and drag lifecycle helpers | Active | a3f92b3 |
| [modules/model-edit-commit.js](modules/model-edit-commit.js) | Deferred commit queues and RAF preview scheduling helpers for model edit flows | Active | pending |
| [modules/settings-url-sync.js](modules/settings-url-sync.js) | Debounced URL settings sync controller for save/flush timing behavior | Active | pending |
| [modules/upload-action-controller.js](modules/upload-action-controller.js) | Upload flow action normalization plus pending-action and prompt resolver orchestration | Active | pending |
| [modules/upload-choice-ui.js](modules/upload-choice-ui.js) | Upload-choice modal file-list rendering, prompt text sync, and local view-state helpers | Active | pending |
| [modules/export-collapsed-confirm.js](modules/export-collapsed-confirm.js) | Collapsed-export confirm modal open/close resolver orchestration helpers | Active | pending |
| [modules/export-collapsed-summary.js](modules/export-collapsed-summary.js) | Collapsed-export summary rendering and control binding/sync helpers | Active | pending |
| [modules/export-labels.js](modules/export-labels.js) | Export format/quality/speed label and option-list composition helpers | Active | pending |

## Recent Milestone Commits

- a3f92b3 refactor(c1): extract model picker floating module
- 816338d refactor(c1): extract model picker controller module
- 14ed52b refactor(c1): extract viewport performance module and adaptive DPR
- 4e885ed refactor(c1): extract orbit frame-state helpers module
- 4e12bc4 Continue C1: extract model-part action-menu module
- feaecd3 Fix picker menu dismissal and preview click pause; update docs; start C1 module split

## Next Planned Extractions

1. No additional C1 candidate currently listed
- Target: reassess next highest-churn script.js region after this slice
- Candidate module: tbd

## Guardrails

- Preserve runtime behavior before structural cleanup.
- Keep wrappers in script.js during transition so call sites remain stable.
- Add small focused commits per slice.
- Run smoke checks after each extraction.
