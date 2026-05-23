export function computeExportPreviewDimensionsController({
    canvasWrapEl,
    previewEl,
    expW,
    expH,
    exportFrameEnabled,
    devicePixelRatio = 1,
    dprMax = 1,
} = {}) {
    const cw = canvasWrapEl ? canvasWrapEl.clientWidth : (previewEl?.offsetWidth || 160);
    const ch = canvasWrapEl ? canvasWrapEl.clientHeight : (previewEl?.offsetWidth || 160);

    const cssW = cw;
    const cssH = ch;
    const dpr = Math.min(devicePixelRatio || 1, dprMax);

    // In crop mode we preview the full viewport; otherwise the export frame dimensions.
    const previewW = exportFrameEnabled ? cw : expW;
    const previewH = exportFrameEnabled ? ch : expH;

    // Keep proxy render target bounded by the preview container footprint.
    const maxDim = Math.max(previewW, previewH);
    const boxSize = previewEl?.parentElement?.clientWidth || 160;
    const previewScale = boxSize / Math.max(1, maxDim);

    const pxW = Math.max(2, Math.round(previewW * previewScale * dpr));
    const pxH = Math.max(2, Math.round(previewH * previewScale * dpr));
    const cwAspect = Math.max(1, cw) / Math.max(1, ch);

    return {
        cw,
        ch,
        cssW,
        cssH,
        dpr,
        previewW,
        previewH,
        maxDim,
        boxSize,
        previewScale,
        pxW,
        pxH,
        cwAspect,
    };
}
