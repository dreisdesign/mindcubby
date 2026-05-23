# C1 Refactor Progress

Last updated: 2026-05-23
Roadmap reference: C1 in [_IGNORE/ROADMAP.md](_IGNORE/ROADMAP.md)

Goal: split large runtime logic in script.js into stable modules with clear boundaries and sortable naming.

## Current Status

- Status: in progress
- Completed slices: 48
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

28. Export preview render-target extraction
- Module: [modules/export-preview-render-target.js](modules/export-preview-render-target.js)
- Scope: preview render-target allocation/reuse and color-space setup helpers
- script.js now delegates preview render-target lifecycle through thin wrappers
- Shipped in commit: pending

29. Export preview pixel readback extraction
- Module: [modules/export-preview-readback.js](modules/export-preview-readback.js)
- Scope: render-target pixel readback and row-flip imageData population helpers
- script.js now delegates preview pixel readback and imageData row-flip through thin wrappers
- Shipped in commit: pending

30. Export preview crop overlay extraction
- Module: [modules/export-preview-crop-overlay.js](modules/export-preview-crop-overlay.js)
- Scope: crop matte and corner-mark overlay drawing helpers for preview canvas
- script.js now delegates preview crop overlay drawing through thin wrappers
- Shipped in commit: pending

31. Export preview refresh extraction
- Module: [modules/export-preview-refresh.js](modules/export-preview-refresh.js)
- Scope: immediate and RAF double-refresh orchestration helpers
- script.js now delegates preview refresh orchestration through thin wrappers
- Shipped in commit: pending

32. Export preview render pass extraction
- Module: [modules/export-preview-render-pass.js](modules/export-preview-render-pass.js)
- Scope: preview render pass bind/render/unbind and scene-restore orchestration helpers
- script.js now delegates preview render pass orchestration through thin wrappers
- Shipped in commit: pending

33. Export preview canvas commit extraction
- Module: [modules/export-preview-canvas-commit.js](modules/export-preview-canvas-commit.js)
- Scope: preview 2D context image commit orchestration helpers
- script.js now delegates preview canvas commit path through thin wrappers
- Shipped in commit: pending

34. Export preview camera-state extraction
- Module: [modules/export-preview-camera-state.js](modules/export-preview-camera-state.js)
- Scope: preview crop camera-state snapshot helpers
- script.js now delegates preview camera-state snapshot path through thin wrappers
- Shipped in commit: pending

35. Export preview readback-commit extraction
- Module: [modules/export-preview-readback-commit.js](modules/export-preview-readback-commit.js)
- Scope: preview readback + canvas commit orchestration helpers
- script.js now delegates readback+commit path through thin wrappers
- Shipped in commit: pending

36. Export preview overlays extraction
- Module: [modules/export-preview-overlays.js](modules/export-preview-overlays.js)
- Scope: preview crop and ruler overlay orchestration helpers
- script.js now delegates preview overlay orchestration through thin wrappers
- Shipped in commit: pending

37. Export preview target-size sync extraction
- Module: [modules/export-preview-target-size.js](modules/export-preview-target-size.js)
- Scope: preview canvas pixel target-size sync helpers
- script.js now delegates preview canvas width/height sync through thin wrappers
- Shipped in commit: pending

38. Export preview resource setup extraction
- Module: [modules/export-preview-resources.js](modules/export-preview-resources.js)
- Scope: preview render-target and preview-camera setup orchestration helpers
- script.js now delegates preview resource setup through thin wrappers
- Shipped in commit: pending

39. Export preview context preflight extraction
- Module: [modules/export-preview-preflight.js](modules/export-preview-preflight.js)
- Scope: preview activity/timing/element/readiness/format/transparency preflight orchestration
- script.js now delegates preview preflight through thin wrappers
- Shipped in commit: pending

40. Export preview canvas prep extraction
- Module: [modules/export-preview-canvas-prep.js](modules/export-preview-canvas-prep.js)
- Scope: preview dimensions and target-size prep orchestration helpers
- script.js now delegates preview canvas prep through thin wrappers
- Shipped in commit: pending

41. Export preview pipeline coordinator extraction
- Module: [modules/export-preview-pipeline.js](modules/export-preview-pipeline.js)
- Scope: compose preflight, canvas prep, camera state, resources, render, readback, and overlays
- script.js now delegates export preview pipeline orchestration through thin wrappers
- Shipped in commit: pending

42. Export preview update entrypoint extraction
- Module: [modules/export-preview-update.js](modules/export-preview-update.js)
- Scope: export preview update entrypoint controller and dependency wiring
- script.js now delegates updateExportPreview orchestration setup through thin wrappers
- Shipped in commit: pending

43. Export preview state-commit extraction
- Module: [modules/export-preview-state-commit.js](modules/export-preview-state-commit.js)
- Scope: export preview pipeline-result state commit helpers
- script.js now delegates preview state commit through thin wrappers
- Shipped in commit: pending

44. Export preview update-context extraction
- Module: [modules/export-preview-update-context.js](modules/export-preview-update-context.js)
- Scope: export preview update-context builder helpers
- script.js now delegates update-context construction through thin wrappers
- Shipped in commit: pending

45. Export preview runtime extraction
- Module: [modules/export-preview-runtime.js](modules/export-preview-runtime.js)
- Scope: export preview runtime wrappers for update and refresh flows
- script.js now delegates preview runtime wrappers through thin wrappers
- Shipped in commit: pending

46. Export panel drag extraction
- Module: [modules/export-panel-drag.js](modules/export-panel-drag.js)
- Scope: export panel drag and persisted positioning controller
- script.js now delegates export panel drag/position orchestration through thin wrappers
- Shipped in commit: pending

47. Export workspace runtime extraction
- Module: [modules/export-workspace-runtime.js](modules/export-workspace-runtime.js)
- Scope: export workspace runtime wrappers for active-state and open-close flows
- script.js now delegates workspace runtime wrappers through thin wrappers
- Shipped in commit: pending

48. Export crop UI extraction
- Module: [modules/export-crop-ui.js](modules/export-crop-ui.js)
- Scope: export crop/frame button and orbit-hint UI controller
- script.js now delegates crop/frame hint UI updates through thin wrappers
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
| [modules/export-preview-render-target.js](modules/export-preview-render-target.js) | Export preview render-target allocation/reuse and color-space setup helpers | Active | pending |
| [modules/export-preview-readback.js](modules/export-preview-readback.js) | Export preview render-target pixel readback and row-flip imageData helpers | Active | pending |
| [modules/export-preview-crop-overlay.js](modules/export-preview-crop-overlay.js) | Export preview crop matte and corner-mark overlay drawing helpers | Active | pending |
| [modules/export-preview-refresh.js](modules/export-preview-refresh.js) | Export preview immediate + RAF refresh orchestration helpers | Active | pending |
| [modules/export-preview-render-pass.js](modules/export-preview-render-pass.js) | Export preview render pass bind/render/unbind and scene-restore helpers | Active | pending |
| [modules/export-preview-canvas-commit.js](modules/export-preview-canvas-commit.js) | Export preview 2D context image commit helpers | Active | pending |
| [modules/export-preview-camera-state.js](modules/export-preview-camera-state.js) | Export preview crop camera-state snapshot helpers | Active | pending |
| [modules/export-preview-readback-commit.js](modules/export-preview-readback-commit.js) | Export preview readback + canvas commit orchestration helpers | Active | pending |
| [modules/export-preview-overlays.js](modules/export-preview-overlays.js) | Export preview crop and ruler overlay orchestration helpers | Active | pending |
| [modules/export-preview-target-size.js](modules/export-preview-target-size.js) | Export preview canvas pixel target-size sync helpers | Active | pending |
| [modules/export-preview-resources.js](modules/export-preview-resources.js) | Export preview render-target and preview-camera setup orchestration helpers | Active | pending |
| [modules/export-preview-preflight.js](modules/export-preview-preflight.js) | Export preview context preflight orchestration helpers | Active | pending |
| [modules/export-preview-canvas-prep.js](modules/export-preview-canvas-prep.js) | Export preview dimensions and target-size prep orchestration helpers | Active | pending |
| [modules/export-preview-pipeline.js](modules/export-preview-pipeline.js) | Export preview end-to-end pipeline orchestration coordinator | Active | pending |
| [modules/export-preview-update.js](modules/export-preview-update.js) | Export preview update entrypoint controller and dependency wiring | Active | pending |
| [modules/export-preview-state-commit.js](modules/export-preview-state-commit.js) | Export preview pipeline-result state commit helpers | Active | pending |
| [modules/export-preview-update-context.js](modules/export-preview-update-context.js) | Export preview update-context builder helpers | Active | pending |
| [modules/export-preview-runtime.js](modules/export-preview-runtime.js) | Export preview runtime wrappers for update and refresh flows | Active | pending |
| [modules/export-panel-drag.js](modules/export-panel-drag.js) | Export panel drag and persisted positioning controller | Active | pending |
| [modules/export-workspace-runtime.js](modules/export-workspace-runtime.js) | Export workspace runtime wrappers for active-state/open-close flows | Active | pending |
| [modules/export-crop-ui.js](modules/export-crop-ui.js) | Export crop/frame button and orbit-hint UI controller | Active | pending |

## Recent Milestone Commits

- a3f92b3 refactor(c1): extract model picker floating module
- 816338d refactor(c1): extract model picker controller module
- 14ed52b refactor(c1): extract viewport performance module and adaptive DPR
- 4e885ed refactor(c1): extract orbit frame-state helpers module
- 4e12bc4 Continue C1: extract model-part action-menu module
- feaecd3 Fix picker menu dismissal and preview click pause; update docs; start C1 module split

## Next Planned Extractions

1. Right-pan interaction extraction
- Target: begin/enforce/end vertical-lock and shift-pan interaction helpers
- Candidate module: modules/right-pan-lock.js

## Guardrails

- Preserve runtime behavior before structural cleanup.
- Keep wrappers in script.js during transition so call sites remain stable.
- Add small focused commits per slice.
- Run smoke checks after each extraction.
