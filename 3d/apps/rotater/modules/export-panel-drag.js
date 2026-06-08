const EXPORT_PANEL_POS_STORAGE_KEY = 'rotater_exportPanelPos';

export function createExportPanelDragController({
    exportPanelEl,
    exportPanelHeaderEl,
    getExportPanelEl,
    getExportPanelHeaderEl,
    isDesktopV2Layout,
    isWorkspaceActive,
} = {}) {
    let dragState = null;

    function resolveExportPanelEl() {
        if (typeof getExportPanelEl === 'function') {
            const el = getExportPanelEl();
            if (el instanceof HTMLElement) return el;
        }
        const el = document.querySelector('.export-modal-panel');
        if (el instanceof HTMLElement) return el;
        return exportPanelEl instanceof HTMLElement ? exportPanelEl : null;
    }

    function resolveExportPanelHeaderEl(panelEl = null) {
        if (typeof getExportPanelHeaderEl === 'function') {
            const el = getExportPanelHeaderEl();
            if (el instanceof HTMLElement) return el;
        }
        const scope = panelEl instanceof HTMLElement ? panelEl : resolveExportPanelEl();
        if (!scope) return null;
        const el = scope.querySelector('.settings-panel-header');
        if (el instanceof HTMLElement) return el;
        return exportPanelHeaderEl instanceof HTMLElement ? exportPanelHeaderEl : null;
    }

    function clampExportPanelPosition(left, top, panelEl) {
        if (!panelEl) return { left, top };
        const rect = panelEl.getBoundingClientRect();
        const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
        const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
        return {
            left: Math.max(8, Math.min(maxLeft, left)),
            top: Math.max(8, Math.min(maxTop, top)),
        };
    }

    function setExportPanelPosition(left, top, persist = true, panelEl = null) {
        const panel = panelEl || resolveExportPanelEl();
        if (!panel) return;
        const clamped = clampExportPanelPosition(left, top, panel);
        panel.style.left = `${Math.round(clamped.left)}px`;
        panel.style.top = `${Math.round(clamped.top)}px`;
        panel.style.transform = 'none';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        if (!persist) return;
        try {
            localStorage.setItem(
                EXPORT_PANEL_POS_STORAGE_KEY,
                JSON.stringify({ left: Math.round(clamped.left), top: Math.round(clamped.top) })
            );
        } catch (_) { }
    }

    function restoreExportPanelPosition() {
        const panel = resolveExportPanelEl();
        if (!panel || !isDesktopV2Layout?.()) return;
        try {
            const raw = localStorage.getItem(EXPORT_PANEL_POS_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || !Number.isFinite(parsed.left) || !Number.isFinite(parsed.top)) return;
            setExportPanelPosition(parsed.left, parsed.top, false, panel);
        } catch (_) { }
    }

    function initializeExportPanelDrag() {
        const onPointerMove = (ev) => {
            if (!dragState) return;
            const nextLeft = dragState.startLeft + (ev.clientX - dragState.startX);
            const nextTop = dragState.startTop + (ev.clientY - dragState.startY);
            setExportPanelPosition(nextLeft, nextTop, false, dragState.panelEl);
        };

        const onPointerUp = () => {
            if (!dragState) return;
            const rect = dragState.panelEl.getBoundingClientRect();
            setExportPanelPosition(rect.left, rect.top, true, dragState.panelEl);
            dragState.headerEl.classList.remove('is-dragging');
            dragState = null;
        };

        document.addEventListener('pointerdown', (ev) => {
            if (ev.button !== 0) return;
            if (!(ev.target instanceof Element)) return;
            const headerEl = ev.target.closest('.export-modal-panel .settings-panel-header');
            if (!(headerEl instanceof HTMLElement)) return;
            const panelEl = headerEl.closest('.export-modal-panel');
            if (!(panelEl instanceof HTMLElement)) return;
            if (panelEl.closest('#exportOverlay')?.hidden) return;
            if (ev.target.closest('button,a,input,select,label,textarea')) return;
            const rect = panelEl.getBoundingClientRect();
            dragState = {
                startX: ev.clientX,
                startY: ev.clientY,
                startLeft: rect.left,
                startTop: rect.top,
                panelEl,
                headerEl,
            };
            headerEl.classList.add('is-dragging');
            headerEl.setPointerCapture?.(ev.pointerId);
            ev.preventDefault();
        }, true);

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('resize', () => {
            const panelEl = resolveExportPanelEl();
            if (!panelEl || panelEl.closest('#exportOverlay')?.hidden) return;
            const rect = panelEl.getBoundingClientRect();
            setExportPanelPosition(rect.left, rect.top, false, panelEl);
        });
    }

    return {
        restoreExportPanelPosition,
        initializeExportPanelDrag,
    };
}
