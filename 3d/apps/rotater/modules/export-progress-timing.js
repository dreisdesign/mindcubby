export function createExportProgressTimingController({
    nowMs,
    requestAnimationFrameFn,
    onPaintStatus,
} = {}) {
    let lastExportUiPaintAt = 0;

    async function maybePaintExportProgress(msg, done, total, force = false) {
        const now = Number(nowMs?.()) || 0;
        // Paint frequently at start (so early progress does not feel stuck), then throttle.
        if (!force && done != null && done > 24 && (now - lastExportUiPaintAt) < 90) return;

        onPaintStatus?.(msg, done, total);
        lastExportUiPaintAt = now;
        await new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                resolve();
            };

            // RAF can be heavily throttled while browser capture warnings/modals
            // are active; timeout fallback keeps export loops moving.
            const timeoutId = setTimeout(finish, 34);
            if (typeof requestAnimationFrameFn === 'function') {
                requestAnimationFrameFn(() => {
                    clearTimeout(timeoutId);
                    finish();
                });
            }
        });
    }

    return {
        maybePaintExportProgress,
    };
}
