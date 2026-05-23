export function syncTransparentCheckboxesController(sourceId = 'exportBgColor', {
    transparentEl,
    transparentPngEl,
    bgToggleEl,
    exportPreviewWrapEl,
    updateExportWorkspaceTransparencyPattern,
    updateEstimate,
    saveSettings,
    refreshExportPreviewNow,
} = {}) {
    let transparent = false;
    if (sourceId === 'exportBgColor') {
        const hasBg = bgToggleEl?.checked ?? true;
        transparent = !hasBg;
    } else {
        transparent = (sourceId === 'exportTransparent')
            ? (transparentEl?.checked ?? false)
            : (transparentPngEl?.checked ?? false);
    }

    if (transparentEl) transparentEl.checked = transparent;
    if (transparentPngEl) transparentPngEl.checked = transparent;
    if (bgToggleEl) bgToggleEl.checked = !transparent;

    if (exportPreviewWrapEl) {
        exportPreviewWrapEl.classList.toggle('is-transparent', transparent);
    }
    if (typeof updateExportWorkspaceTransparencyPattern === 'function') {
        updateExportWorkspaceTransparencyPattern();
    }
    if (typeof updateEstimate === 'function') updateEstimate();
    if (typeof saveSettings === 'function') saveSettings();
    if (typeof refreshExportPreviewNow === 'function') refreshExportPreviewNow();
}
