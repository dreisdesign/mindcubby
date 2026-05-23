export function applyExportPreviewOverlaysController(
    ctx2d,
    {
        exportFrameEnabled,
        pxW,
        pxH,
        cw,
        ch,
        drawCropOverlay,
        getCropFrameRect,
        drawRulerOverlay,
        previewCam,
    } = {}
) {
    if (!ctx2d || !drawRulerOverlay) return;

    if (exportFrameEnabled) {
        drawCropOverlay?.(ctx2d, {
            pxW,
            pxH,
            cw,
            ch,
            getCropFrameRect,
        });
    }

    drawRulerOverlay(ctx2d, pxW, pxH, previewCam);
}
