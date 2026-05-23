export function deriveExportPreviewTransparencyController(
    fmt,
    {
        bgEnabled = true,
        exportTransparentEl,
        exportTransparentPngEl,
    } = {}
) {
    if (!bgEnabled) return true;
    if (fmt === 'gif') return !!(exportTransparentEl?.checked ?? false);
    if (fmt === 'png') {
        return !!(
            exportTransparentPngEl?.checked
            ?? exportTransparentEl?.checked
            ?? false
        );
    }
    return false;
}

export function syncExportPreviewWrapTransparencyController(previewWrapEl, isTransparentPreview) {
    if (!previewWrapEl) return;
    previewWrapEl.style.aspectRatio = '1 / 1';
    previewWrapEl.classList.toggle('is-transparent', !!isTransparentPreview);
}
