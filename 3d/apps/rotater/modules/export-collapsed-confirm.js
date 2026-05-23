export function createCollapsedExportConfirmController({
    overlayEl,
} = {}) {
    let resolver = null;

    return {
        isOpen() {
            return !!(overlayEl && !overlayEl.hidden);
        },
        open() {
            if (!overlayEl) return Promise.resolve(true);
            overlayEl.hidden = false;
            if (resolver) {
                const resolveExisting = resolver;
                resolver = null;
                resolveExisting(false);
            }
            return new Promise((resolve) => {
                resolver = resolve;
            });
        },
        close(shouldContinue) {
            if (overlayEl) overlayEl.hidden = true;
            if (!resolver) return;
            const resolve = resolver;
            resolver = null;
            resolve(!!shouldContinue);
        },
    };
}
