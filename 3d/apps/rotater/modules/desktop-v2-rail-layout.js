export function createDesktopV2RailLayoutController({
    rootEl = document.documentElement,
    documentObj = document,
    windowObj = window,
} = {}) {
    let desktopV2RailObserver = null;
    let desktopV2RailRafId = 0;

    function sync() {
        if (!rootEl.classList.contains('layout-v2-desktop')) {
            rootEl.style.removeProperty('--desktop-v2-effects-top');
            rootEl.style.removeProperty('--desktop-v2-effects-max-height');
            return;
        }

        const appDock = documentObj.getElementById('appSettingsDock');
        if (!appDock) return;

        const railTop = 16;
        const railBottom = 16;
        const railGap = 12;

        const appDockHeight = Math.ceil(appDock.getBoundingClientRect().height || 0);
        const effectsTop = railTop;
        const effectsMaxHeight = Math.max(
            150,
            Math.floor(windowObj.innerHeight - effectsTop - railGap - appDockHeight - railBottom)
        );

        rootEl.style.setProperty('--desktop-v2-effects-top', `${effectsTop}px`);
        rootEl.style.setProperty('--desktop-v2-effects-max-height', `${effectsMaxHeight}px`);
    }

    function queue() {
        if (desktopV2RailRafId) windowObj.cancelAnimationFrame(desktopV2RailRafId);
        desktopV2RailRafId = windowObj.requestAnimationFrame(() => {
            desktopV2RailRafId = 0;
            sync();
        });
    }

    function disconnectObserver() {
        if (desktopV2RailObserver) {
            desktopV2RailObserver.disconnect();
            desktopV2RailObserver = null;
        }
    }

    function ensureObserver() {
        if (!windowObj.ResizeObserver || desktopV2RailObserver) return;

        desktopV2RailObserver = new windowObj.ResizeObserver(() => {
            queue();
        });

        const exportPanel = documentObj.querySelector('.export-modal-panel');
        const appDock = documentObj.getElementById('appSettingsDock');
        if (exportPanel) desktopV2RailObserver.observe(exportPanel);
        if (appDock) desktopV2RailObserver.observe(appDock);
    }

    return {
        sync,
        queue,
        disconnectObserver,
        ensureObserver,
    };
}
