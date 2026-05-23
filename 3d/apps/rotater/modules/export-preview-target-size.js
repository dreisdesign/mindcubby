export function syncExportPreviewTargetSizeController(previewEl, {
    pxW,
    pxH,
} = {}) {
    if (!previewEl) return false;
    if (previewEl.width === pxW && previewEl.height === pxH) return false;

    previewEl.width = pxW;
    previewEl.height = pxH;
    return true;
}
