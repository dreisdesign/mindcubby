export function isExportPreviewActiveController({
    previewEl,
    renderer,
    camera,
    scene,
    exportOverlayEl,
    previewDetailsEl,
} = {}) {
    if (!previewEl || !renderer || !camera || !scene) return false;
    if (exportOverlayEl?.hidden) return false;
    if (previewDetailsEl && !previewDetailsEl.open) return false;

    const panelBody = previewEl.closest('.export-modal-body');
    if (!panelBody) return false;
    if (panelBody.offsetParent === null) return false;

    return true;
}
