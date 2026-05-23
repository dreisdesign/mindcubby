const EXPORT_PANEL_POS_STORAGE_KEY = 'rotater_exportPanelPos';

export function createExportPanelDragController({
    exportPanelEl,
    exportPanelHeaderEl,
    isDesktopV2Layout,
    isWorkspaceActive,
} = {}) {
    let dragState = null;

    function clampExportPanelPosition(left, top) {
        if (!exportPanelEl) return { left, top };
        const rect = exportPanelEl.getBoundingClientRect();
        const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
        const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
        return {
            left: Math.max(8, Math.min(maxLeft, left)),
            top: Math.max(8, Math.min(maxTop, top)),
        };
    }

    function setExportPanelPosition(left, top, persist = true) {
        if (!exportPanelEl) return;
        const clamped = clampExportPanelPosition(left, top);
        exportPanelEl.style.left = `${Math.round(clamped.left)}px`;
        exportPanelEl.style.top = `${Math.round(clamped.top)}px`;
        exportPanelEl.style.transform = 'none';
        exportPanelEl.style.right = 'auto';
        exportPanelEl.style.bottom = 'auto';
        if (!persist) return;
        try {
            localStorage.setItem(
                EXPORT_PANEL_POS_STORAGE_KEY,
                JSON.stringify({ left: Math.round(clamped.left), top: Math.round(clamped.top) })
            );
        } catch (_) { }
    }

    function restoreExportPanelPosition() {
        if (!exportPanelEl || !isDesktopV2Layout?.()) return;
        try {
            const raw = localStorage.getItem(EXPORT_PANEL_POS_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || !Number.isFinite(parsed.left) || !Number.isFinite(parsed.top)) return;
            setExportPanelPosition(parsed.left, parsed.top, false);
        } catch (_) { }
    }

    function initializeExportPanelDrag() {
        if (!exportPanelEl || !exportPanelHeaderEl) return;

        const onPointerMove = (ev) => {
            if (!dragState) return;
            const nextLeft = dragState.startLeft + (ev.clientX - dragState.startX);
            const nextTop = dragState.startTop + (ev.clientY - dragState.startY);
            setExportPanelPosition(nextLeft, nextTop, false);
        };

        const onPointerUp = () => {
            if (!dragState) return;
            const rect = exportPanelEl.getBoundingClientRect();
            setExportPanelPosition(rect.left, rect.top, true);
            exportPanelHeaderEl.classList.remove('is-dragging');
            dragState = null;
        };

        exportPanelHeaderEl.addEventListener('pointerdown', (ev) => {
            if (!isDesktopV2Layout?.() || !isWorkspaceActive?.()) return;
            if (ev.button !== 0) return;
            if (ev.target instanceof Element && ev.target.closest('button,a,input,select,label,textarea')) return;
            const rect = exportPanelEl.getBoundingClientRect();
            dragState = {
                startX: ev.clientX,
                startY: ev.clientY,
                startLeft: rect.left,
                startTop: rect.top,
            };
            exportPanelHeaderEl.classList.add('is-dragging');
            exportPanelHeaderEl.setPointerCapture?.(ev.pointerId);
            ev.preventDefault();
        });

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('resize', () => {
            if (!isDesktopV2Layout?.() || !isWorkspaceActive?.()) return;
            const rect = exportPanelEl.getBoundingClientRect();
            setExportPanelPosition(rect.left, rect.top, false);
        });
    }

    return {
        restoreExportPanelPosition,
        initializeExportPanelDrag,
    };
}
