import {
    refreshExportPreviewNowController,
} from './export-preview-refresh.js';
import {
    updateExportPreviewController,
} from './export-preview-update.js';
import {
    commitExportPreviewStateController,
} from './export-preview-state-commit.js';
import {
    buildExportPreviewUpdateContextController,
} from './export-preview-update-context.js';

export function runUpdateExportPreviewRuntimeController({
    force = false,
    nowMs = performance.now(),
    lastUpdateMs = 0,
    intervalMs = 0,
    exportCameraState,
    exportFrameEnabled,
    canvasEl,
    renderer,
    scene,
    sourceCamera,
    previewResources,
    getOrbitFrameState,
    getCropFrameVerticalScale,
    setCameraFromOrbitState,
    getCropFrameRect,
    drawRulerOverlay,
    exportFormatEl,
    exportBgColorEl,
    exportPreviewDprMax,
    isPreviewActive,
    evaluateTimingController,
    getPreviewExportSize,
    applyExportSceneForRender,
    devicePixelRatio,
    setLastUpdateMs,
    setExportCameraState,
    setPreviewResources,
} = {}) {
    const updateContext = buildExportPreviewUpdateContextController({
        force,
        nowMs,
        lastUpdateMs,
        intervalMs,
        exportCameraState,
        exportFrameEnabled,
        canvasEl,
        renderer,
        scene,
        sourceCamera,
        previewResources,
        getOrbitFrameState,
        getCropFrameVerticalScale,
        setCameraFromOrbitState,
        getCropFrameRect,
        drawRulerOverlay,
        exportFormatEl,
        exportBgColorEl,
        exportPreviewDprMax,
        isPreviewActive,
        evaluateTimingController,
        getPreviewExportSize,
        applyExportSceneForRender,
        devicePixelRatio,
    });

    const pipelineResult = updateExportPreviewController(updateContext);
    return commitExportPreviewStateController(pipelineResult, {
        setLastUpdateMs,
        setExportCameraState,
        setPreviewResources,
    });
}

export function refreshExportPreviewNowRuntimeController({
    isPreviewActive,
    runForcedUpdate,
    requestAnimationFrameFn,
} = {}) {
    refreshExportPreviewNowController({
        isPreviewActive,
        runForcedUpdate,
        requestAnimationFrameFn,
    });
}
