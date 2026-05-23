export function prepareExportPreviewResourcesController({
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
    ensureRenderTarget,
    ensurePreviewCamera,
    createRenderTarget,
    createPerspectiveCamera,
    srgbColorSpace,
} = {}) {
    const nextRenderTargetState = ensureRenderTarget({
        previewRt,
        previewRtWidth,
        previewRtHeight,
        pxW,
        pxH,
        createRenderTarget,
        srgbColorSpace,
    });

    const nextPreviewCam = ensurePreviewCamera({
        previewCam,
        createPerspectiveCamera,
        sourceCamera,
        pxW,
        pxH,
        exportFrameEnabled,
        getOrbitFrameState,
        setCameraFromOrbitState,
    });

    return {
        previewRt: nextRenderTargetState.previewRt,
        previewRtWidth: nextRenderTargetState.previewRtWidth,
        previewRtHeight: nextRenderTargetState.previewRtHeight,
        previewCam: nextPreviewCam,
    };
}
