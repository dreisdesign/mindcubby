export function bindExportPreviewDetailsToggleController({
    previewDetailsEl,
    onRefreshPreview,
    onQueueRailLayoutSync,
} = {}) {
    previewDetailsEl?.addEventListener('toggle', () => {
        onRefreshPreview?.();
        onQueueRailLayoutSync?.();
    });
}
