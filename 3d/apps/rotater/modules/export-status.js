export function createExportStatusController({
    statusEl,
    animStatusEl,
    getAnimProgressEl,
    getAnimProgressFillEl,
    onUpdateExportProgressOverlay,
} = {}) {
    function setStatus(msg) {
        if (statusEl) statusEl.textContent = msg || '';
    }

    function setAnimStatus(msg, done, total) {
        if (animStatusEl) animStatusEl.textContent = msg || '';

        const prog = getAnimProgressEl?.();
        const fill = getAnimProgressFillEl?.();
        if (prog && fill) {
            const show = done != null && total != null && total > 0;
            prog.hidden = !show;
            if (show) fill.style.width = `${Math.round(done / total * 100)}%`;
        }

        onUpdateExportProgressOverlay?.(msg, done, total);
    }

    return {
        setStatus,
        setAnimStatus,
    };
}
