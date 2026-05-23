export function persistExportPanelCollapsedStateController(
    collapsed,
    {
        storage = localStorage,
        key = 'rotater_exportPanelCollapsed',
    } = {}
) {
    try {
        storage.setItem(key, collapsed ? '1' : '0');
    } catch (_) {
        // Ignore persistence failures (private mode, disabled storage, etc.)
    }
}

export function restoreExportPanelCollapsedStateController({
    applyExportPanelState,
    storage = localStorage,
    key = 'rotater_exportPanelCollapsed',
    fallback = false,
} = {}) {
    try {
        const exportCollapsed = storage.getItem(key);
        applyExportPanelState?.(exportCollapsed === '1');
    } catch (_) {
        applyExportPanelState?.(fallback);
    }
}

export function handleExportPanelToggleController({
    exportPanelEl,
    applyExportPanelState,
    persistExportPanelCollapsedState,
} = {}) {
    if (!exportPanelEl) return;
    const collapsed = !exportPanelEl.classList.contains('is-collapsed');
    applyExportPanelState?.(collapsed);
    persistExportPanelCollapsedState?.(collapsed);
}
