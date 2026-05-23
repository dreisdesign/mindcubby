export function createExportProgressOverlayController({
    getOverlayEl,
    getLabelEl,
    getFillEl,
} = {}) {
    function showExportProgressOverlay(msg) {
        const el = getOverlayEl?.();
        if (!el) return;

        const lbl = getLabelEl?.();
        const fill = getFillEl?.();
        if (lbl) lbl.textContent = msg || 'Preparing…';
        if (fill) fill.style.width = '0%';
        el.hidden = false;
    }

    function updateExportProgressOverlay(msg, done, total) {
        const lbl = getLabelEl?.();
        const fill = getFillEl?.();
        if (lbl && msg) lbl.textContent = msg;
        if (fill && done != null && total > 0) {
            fill.style.width = `${Math.round(done / total * 100)}%`;
        }
    }

    function hideExportProgressOverlay() {
        const el = getOverlayEl?.();
        if (el) el.hidden = true;
    }

    return {
        showExportProgressOverlay,
        updateExportProgressOverlay,
        hideExportProgressOverlay,
    };
}
