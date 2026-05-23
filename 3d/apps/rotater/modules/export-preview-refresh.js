export function refreshExportPreviewNowController({
    isPreviewActive,
    runForcedUpdate,
    requestAnimationFrameFn,
} = {}) {
    if (!isPreviewActive?.()) return;

    try {
        runForcedUpdate?.();
    } catch (_) { }

    requestAnimationFrameFn?.(() => {
        try {
            runForcedUpdate?.();
        } catch (_) { }
    });
}
