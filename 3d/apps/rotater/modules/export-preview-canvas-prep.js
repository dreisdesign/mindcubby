export function prepareExportPreviewCanvasController({
    canvasEl,
    previewEl,
    expW,
    expH,
    exportFrameEnabled,
    devicePixelRatio,
    dprMax,
    computeDimensions,
    syncTargetSize,
} = {}) {
    const canvasWrapEl = canvasEl?.parentElement;

    const dimensions = computeDimensions?.({
        canvasWrapEl,
        previewEl,
        expW,
        expH,
        exportFrameEnabled,
        devicePixelRatio,
        dprMax,
    }) || {};

    syncTargetSize?.(previewEl, {
        pxW: dimensions.pxW,
        pxH: dimensions.pxH,
    });

    return dimensions;
}
