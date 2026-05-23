export function updateExportActionLabelsController(
    fmt,
    {
        exportPanelEl,
        btnExportLabel,
        btnExportCollapsedLabel,
        formatShortLabels,
        formatLabels,
    } = {}
) {
    const panelWidth = exportPanelEl?.offsetWidth ?? 0;
    const useShortPrimaryLabel = !!exportPanelEl?.classList.contains('is-collapsed') || (panelWidth > 0 && panelWidth < 360);
    if (btnExportLabel) {
        btnExportLabel.textContent = (useShortPrimaryLabel ? formatShortLabels[fmt] : formatLabels[fmt]) ?? 'Export';
    }
    if (btnExportCollapsedLabel) {
        btnExportCollapsedLabel.textContent = formatShortLabels[fmt] ?? 'Export';
    }
}

export function syncExportFormatTabsController(fmt, { exportFormatTabEls } = {}) {
    exportFormatTabEls.forEach((tabEl) => {
        const active = tabEl.dataset.exportFormatTab === fmt;
        tabEl.classList.toggle('is-active', active);
        tabEl.setAttribute('aria-selected', active ? 'true' : 'false');
    });
}

export function applyExportFormatController(
    fmt,
    {
        exportFormatEl,
        exportMiniFormatEl,
        exportFormatCollapsedEl,
        forEachExportFormatOpts,
        getExportOptsEl,
        applyExportQuickOptionsForFormat,
        handleExportFormatAutoPause,
        exportMotionControlsEl,
        updateCropDimensionsDock,
        updateExportActionLabels,
        syncExportFormatTabs,
        updateEstimate,
        refreshExportPreviewNow,
        queueDesktopV2RailLayoutSync,
    } = {}
) {
    if (exportFormatEl && exportFormatEl.value !== fmt) exportFormatEl.value = fmt;
    if (exportMiniFormatEl && exportMiniFormatEl.value !== fmt) exportMiniFormatEl.value = fmt;
    if (exportFormatCollapsedEl && exportFormatCollapsedEl.value !== fmt) exportFormatCollapsedEl.value = fmt;

    forEachExportFormatOpts?.((el) => {
        el.hidden = true;
    });
    const opts = getExportOptsEl?.(fmt);
    if (opts) opts.hidden = false;

    applyExportQuickOptionsForFormat?.(fmt);
    handleExportFormatAutoPause?.(fmt);
    if (exportMotionControlsEl) exportMotionControlsEl.hidden = true;
    updateCropDimensionsDock?.();
    updateExportActionLabels?.(fmt);
    syncExportFormatTabs?.(fmt);
    updateEstimate?.();
    refreshExportPreviewNow?.();
    queueDesktopV2RailLayoutSync?.();
}

export function bindExportFormatTabHandlersController({
    exportFormatTabEls,
    onApply,
    onSave,
} = {}) {
    exportFormatTabEls.forEach((tabEl) => {
        tabEl.addEventListener('click', () => {
            const fmt = tabEl.dataset.exportFormatTab;
            if (!fmt) return;
            onApply?.(fmt);
            onSave?.();
        });
    });
}

export function bindExportFormatSelectChangeHandlersController({
    exportFormatEl,
    exportMiniFormatEl,
    exportFormatCollapsedEl,
    onApply,
    onSave,
} = {}) {
    const bindSelect = (selectEl) => {
        selectEl?.addEventListener('change', function () {
            onApply?.(this.value);
            onSave?.();
        });
    };

    bindSelect(exportFormatEl);
    bindSelect(exportMiniFormatEl);
    bindSelect(exportFormatCollapsedEl);
}
