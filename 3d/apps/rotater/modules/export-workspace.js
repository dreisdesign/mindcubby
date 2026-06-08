export function updateExportWorkspaceTransparencyPatternController({
    canvas,
    exportWorkspaceActive,
    exportBgColorEl,
} = {}) {
    const wrap = canvas?.parentElement;
    if (!wrap) return;
    const transparent = !!(exportWorkspaceActive && !(exportBgColorEl?.checked ?? true));
    wrap.classList.toggle('is-export-transparent', transparent);
}

export function setExportWorkspaceActiveController(active, {
    setExportWorkspaceActive,
    exportOverlayEl,
    exportGridEl,
    rulerLinesVisible,
    exportBuildPlateEl,
    buildPlateEnabled,
    updateExportWorkspaceTransparencyPattern,
    updateExportPauseButtonUI,
    syncCanvasSize,
    persistWorkspaceActive,
} = {}) {
    if (typeof setExportWorkspaceActive !== 'function') return;

    const nextActive = !!active;
    setExportWorkspaceActive(nextActive);
    if (exportOverlayEl) exportOverlayEl.hidden = !nextActive;
    if (nextActive) {
        if (exportGridEl) exportGridEl.checked = !!rulerLinesVisible;
        if (exportBuildPlateEl) exportBuildPlateEl.checked = !!buildPlateEnabled;
    }

    if (typeof updateExportWorkspaceTransparencyPattern === 'function') {
        updateExportWorkspaceTransparencyPattern();
    }
    if (typeof updateExportPauseButtonUI === 'function') updateExportPauseButtonUI();
    if (typeof persistWorkspaceActive === 'function') persistWorkspaceActive(nextActive);
    if (typeof syncCanvasSize === 'function') {
        syncCanvasSize();
        requestAnimationFrame(() => syncCanvasSize());
    }
}

export function openExportWorkspaceController({
    setExportWorkspaceActive,
    restoreExportPanelPosition,
    enterCropMode,
} = {}) {
    if (typeof setExportWorkspaceActive === 'function') setExportWorkspaceActive(true);
    if (typeof restoreExportPanelPosition === 'function') {
        requestAnimationFrame(() => restoreExportPanelPosition());
    }
    if (typeof enterCropMode === 'function') enterCropMode();
}

export function closeExportWorkspaceController({
    exportFrameEnabled,
    confirmCropMode,
    setExportWorkspaceActive,
} = {}) {
    if (exportFrameEnabled && typeof confirmCropMode === 'function') confirmCropMode();
    if (typeof setExportWorkspaceActive === 'function') setExportWorkspaceActive(false);
}
