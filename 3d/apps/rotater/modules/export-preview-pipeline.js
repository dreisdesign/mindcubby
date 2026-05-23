export function runExportPreviewPipelineController({
    force = false,
    nowMs = 0,
    lastUpdateMs = 0,
    intervalMs = 0,
    exportCamDist,
    exportCamElev,
    exportCamZoom,
    exportFrameEnabled,
    canvasEl,
    renderer,
    scene,
    sourceCamera,
    previewRt,
    previewRtWidth,
    previewRtHeight,
    previewCam,
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
    preflightController,
    canvasPrepController,
    cameraStateController,
    resourcesController,
    renderPassController,
    readbackCommitController,
    overlaysController,
    getPreviewExportSize,
    deriveTransparencyController,
    syncWrapTransparencyController,
    computeDimensionsController,
    syncTargetSizeController,
    ensureRenderTargetController,
    ensurePreviewCameraController,
    readExportPreviewImageDataController,
    commitCanvasImageController,
    drawCropOverlayController,
    applyExportSceneForRender,
    createRenderTarget,
    createPerspectiveCamera,
    srgbColorSpace,
    getPreviewElement,
    getTransparentElements,
    devicePixelRatio,
} = {}) {
    const preflight = preflightController({
        force,
        nowMs,
        lastUpdateMs,
        intervalMs,
        exportCamDist,
        isPreviewActive,
        evaluateTiming: evaluateTimingController,
        getPreviewElement,
        getFormat: () => exportFormatEl?.value ?? 'gif',
        getPreviewExportSize,
        getBgEnabled: () => exportBgColorEl?.checked ?? true,
        deriveTransparency: deriveTransparencyController,
        syncWrapTransparency: syncWrapTransparencyController,
        getTransparentElements,
    });

    if (!preflight?.shouldRender) {
        return {
            shouldRender: false,
            nextLastUpdateMs: preflight?.nextLastUpdateMs ?? lastUpdateMs,
            exportCamDist,
            exportCamElev,
            exportCamZoom,
            previewRt,
            previewRtWidth,
            previewRtHeight,
            previewCam,
        };
    }

    const { pv, expW, expH, isTransparentPreview } = preflight;

    const {
        cw,
        ch,
        pxW,
        pxH,
    } = canvasPrepController({
        canvasEl,
        previewEl: pv,
        expW,
        expH,
        exportFrameEnabled,
        devicePixelRatio,
        dprMax: exportPreviewDprMax,
        computeDimensions: computeDimensionsController,
        syncTargetSize: syncTargetSizeController,
    });

    const cameraState = cameraStateController({
        exportFrameEnabled,
        getOrbitFrameState,
        getCropFrameVerticalScale,
        sourceCameraZoom: sourceCamera?.zoom || 1,
    });

    let nextExportCamDist = exportCamDist;
    let nextExportCamElev = exportCamElev;
    let nextExportCamZoom = exportCamZoom;
    if (cameraState) {
        nextExportCamDist = cameraState.exportCamDist;
        nextExportCamElev = cameraState.exportCamElev;
        nextExportCamZoom = cameraState.exportCamZoom;
    }

    const resources = resourcesController({
        previewRt,
        previewRtWidth,
        previewRtHeight,
        previewCam,
        pxW,
        pxH,
        sourceCamera,
        exportFrameEnabled,
        getOrbitFrameState,
        setCameraFromOrbitState,
        ensureRenderTarget: ensureRenderTargetController,
        ensurePreviewCamera: ensurePreviewCameraController,
        createRenderTarget,
        createPerspectiveCamera,
        srgbColorSpace,
    });

    renderPassController({
        renderer,
        previewRt: resources.previewRt,
        scene,
        previewCam: resources.previewCam,
        applyExportSceneForRender,
        isTransparentPreview,
    });

    const canvasCommit = readbackCommitController({
        renderer,
        previewRt: resources.previewRt,
        pxW,
        pxH,
        previewEl: pv,
        readExportPreviewImageData: readExportPreviewImageDataController,
        commitExportPreviewCanvasImage: commitCanvasImageController,
    });

    if (canvasCommit?.committed && canvasCommit?.ctx2d) {
        overlaysController(canvasCommit.ctx2d, {
            exportFrameEnabled,
            pxW,
            pxH,
            cw,
            ch,
            drawCropOverlay: drawCropOverlayController,
            getCropFrameRect,
            drawRulerOverlay,
            previewCam: resources.previewCam,
        });
    }

    return {
        shouldRender: true,
        nextLastUpdateMs: preflight.nextLastUpdateMs ?? lastUpdateMs,
        exportCamDist: nextExportCamDist,
        exportCamElev: nextExportCamElev,
        exportCamZoom: nextExportCamZoom,
        previewRt: resources.previewRt,
        previewRtWidth: resources.previewRtWidth,
        previewRtHeight: resources.previewRtHeight,
        previewCam: resources.previewCam,
    };
}
