# C1 Refactor Progress

Last updated: 2026-05-23
Roadmap reference: C1 in [_IGNORE/ROADMAP.md](_IGNORE/ROADMAP.md)

Goal: split large runtime logic in script.js into stable modules with clear boundaries and sortable naming.

## Current Status

- Status: in progress
- Completed slices: 27
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

14. Export workspace orchestration extraction
- Module: [modules/export-workspace.js](modules/export-workspace.js)
- Scope: export workspace active-state orchestration and transparency/open-close helper routing
- script.js now delegates workspace state/open-close orchestration through thin wrappers
- Shipped in commit: pending

15. Export transparency sync extraction
- Module: [modules/export-transparency-sync.js](modules/export-transparency-sync.js)
- Scope: export transparency checkbox coupling and preview-sync orchestration helpers
- script.js now delegates transparency sync orchestration through thin wrappers
- Shipped in commit: pending

16. Export panel state extraction
- Module: [modules/export-panel-state.js](modules/export-panel-state.js)
- Scope: export panel collapsed-state persistence/restore and toggle routing helpers
- script.js now delegates panel state persistence and toggle orchestration through thin wrappers
- Shipped in commit: pending

17. Export motion labels extraction
- Module: [modules/export-motion-labels.js](modules/export-motion-labels.js)
- Scope: export motion duration/frame label and speed-option text composition helpers
- script.js now delegates motion label helpers through thin wrappers
- Shipped in commit: pending

18. Export estimate extraction
- Module: [modules/export-estimate.js](modules/export-estimate.js)
- Scope: export estimate button/title/text update orchestration helpers
- script.js now delegates estimate updates through thin wrappers
- Shipped in commit: pending

19. Export format sync extraction
- Module: [modules/export-format-sync.js](modules/export-format-sync.js)
- Scope: export format tab/select synchronization and format-application orchestration helpers
- script.js now delegates export format sync/apply helpers through thin wrappers
- Shipped in commit: pending

20. Export preview details extraction
- Module: [modules/export-preview-details.js](modules/export-preview-details.js)
- Scope: export preview details toggle binding for preview refresh and rail-layout sync
- script.js now delegates preview-details toggle wiring through thin wrappers
- Shipped in commit: pending

21. Desktop V2 rail layout extraction
- Module: [modules/desktop-v2-rail-layout.js](modules/desktop-v2-rail-layout.js)
- Scope: desktop V2 effects rail sizing, RAF queueing, and resize observer lifecycle helpers
- script.js now delegates rail layout sync/queue/observer helpers through thin wrappers
- Shipped in commit: pending

22. Export preview activity extraction
- Module: [modules/export-preview-activity.js](modules/export-preview-activity.js)
- Scope: export preview active-state visibility and readiness guard helpers
- script.js now delegates preview active-state checks through thin wrappers
- Shipped in commit: pending

23. Export preview scene-state extraction
- Module: [modules/export-preview-scene-state.js](modules/export-preview-scene-state.js)
- Scope: export preview scene include/exclude toggles and render-state restore orchestration
- script.js now delegates preview scene-state apply/restore through thin wrappers
- Shipped in commit: pending

24. Export preview timing extraction
- Module: [modules/export-preview-timing.js](modules/export-preview-timing.js)
- Scope: export preview update timing and throttle gate helpers
- script.js now delegates preview update throttle gate through thin wrappers
- Shipped in commit: pending

25. Export preview transparency extraction
- Module: [modules/export-preview-transparency.js](modules/export-preview-transparency.js)
- Scope: transparent-preview derivation and preview-wrap class synchronization helpers
- script.js now delegates preview transparency derivation/wrap sync through thin wrappers
- Shipped in commit: pending

26. Export preview dimensions extraction
- Module: [modules/export-preview-dimensions.js](modules/export-preview-dimensions.js)
- Scope: preview size/scaling computation helpers for render target sizing
- script.js now delegates preview dimensions and pixel sizing calculations through thin wrappers
- Shipped in commit: pending

27. Export preview camera setup extraction
- Module: [modules/export-preview-camera.js](modules/export-preview-camera.js)
- Scope: preview camera setup and orbit-state application helpers
- script.js now delegates preview camera setup/orbit application through thin wrappers
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
| [modules/export-workspace.js](modules/export-workspace.js) | Export workspace active-state orchestration and transparency/open-close helpers | Active | pending |
| [modules/export-transparency-sync.js](modules/export-transparency-sync.js) | Export transparency checkbox coupling and preview-sync orchestration helpers | Active | pending |
| [modules/export-panel-state.js](modules/export-panel-state.js) | Export panel collapsed-state persistence/restore and toggle routing helpers | Active | pending |
| [modules/export-motion-labels.js](modules/export-motion-labels.js) | Export motion duration/frame label and speed-option text composition helpers | Active | pending |
| [modules/export-estimate.js](modules/export-estimate.js) | Export estimate button/title/text update orchestration helpers | Active | pending |
| [modules/export-format-sync.js](modules/export-format-sync.js) | Export format tab/select synchronization and format-application orchestration helpers | Active | pending |
| [modules/export-preview-details.js](modules/export-preview-details.js) | Export preview details toggle binding helpers for preview refresh and rail layout sync | Active | pending |
| [modules/desktop-v2-rail-layout.js](modules/desktop-v2-rail-layout.js) | Desktop V2 effects rail sizing, RAF queueing, and resize observer lifecycle helpers | Active | pending |
| [modules/export-preview-activity.js](modules/export-preview-activity.js) | Export preview active-state visibility guard helpers | Active | pending |
| [modules/export-preview-scene-state.js](modules/export-preview-scene-state.js) | Export preview scene include/exclude and render-state restore orchestration helpers | Active | pending |
| [modules/export-preview-timing.js](modules/export-preview-timing.js) | Export preview update timing and throttle gate helpers | Active | pending |
| [modules/export-preview-transparency.js](modules/export-preview-transparency.js) | Export preview transparency derivation and preview-wrap class sync helpers | Active | pending |
| [modules/export-preview-dimensions.js](modules/export-preview-dimensions.js) | Export preview size/scaling computation helpers for render target sizing | Active | pending |
| [modules/export-preview-camera.js](modules/export-preview-camera.js) | Export preview camera setup and orbit-state application helpers | Active | pending |

## Recent Milestone Commits

- a3f92b3 refactor(c1): extract model picker floating module
- 816338d refactor(c1): extract model picker controller module
- 14ed52b refactor(c1): extract viewport performance module and adaptive DPR
- 4e885ed refactor(c1): extract orbit frame-state helpers module
- 4e12bc4 Continue C1: extract model-part action-menu module
- feaecd3 Fix picker menu dismissal and preview click pause; update docs; start C1 module split

## Next Planned Extractions

1. Export preview render-target extraction
- Target: preview render-target allocation/reuse and color space setup
- Candidate module: modules/export-preview-render-target.js

## Guardrails

- Preserve runtime behavior before structural cleanup.
- Keep wrappers in script.js during transition so call sites remain stable.
- Add small focused commits per slice.
- Run smoke checks after each extraction.
