export function ensureExportPreviewRenderTargetController({
    previewRt,
    previewRtWidth = 0,
    previewRtHeight = 0,
    pxW,
    pxH,
    createRenderTarget,
    srgbColorSpace,
} = {}) {
    let nextPreviewRt = previewRt;
    let nextPreviewRtWidth = previewRtWidth;
    let nextPreviewRtHeight = previewRtHeight;

    if (!nextPreviewRt || nextPreviewRtWidth !== pxW || nextPreviewRtHeight !== pxH) {
        if (nextPreviewRt) nextPreviewRt.dispose();
        nextPreviewRtWidth = pxW;
        nextPreviewRtHeight = pxH;
        nextPreviewRt = createRenderTarget?.(pxW, pxH);
        if (nextPreviewRt?.texture && srgbColorSpace) {
            nextPreviewRt.texture.colorSpace = srgbColorSpace;
        }
    }

    return {
        previewRt: nextPreviewRt,
        previewRtWidth: nextPreviewRtWidth,
        previewRtHeight: nextPreviewRtHeight,
    };
}
