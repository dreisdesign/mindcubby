export function prepareExportPreviewPreflightController({
    force = false,
    nowMs = 0,
    lastUpdateMs = 0,
    intervalMs = 0,
    exportCamDist,
    isPreviewActive,
    evaluateTiming,
    getPreviewElement,
    getFormat,
    getPreviewExportSize,
    getBgEnabled,
    deriveTransparency,
    syncWrapTransparency,
    getTransparentElements,
} = {}) {
    if (!isPreviewActive?.()) {
        return {
            shouldRender: false,
            nextLastUpdateMs: lastUpdateMs,
        };
    }

    const timing = evaluateTiming?.({
        force,
        nowMs,
        lastUpdateMs,
        intervalMs,
    });
    const nextLastUpdateMs = timing?.nextLastUpdateMs ?? lastUpdateMs;
    if (!timing?.shouldRender) {
        return {
            shouldRender: false,
            nextLastUpdateMs,
        };
    }

    const previewEl = getPreviewElement?.();
    if (!previewEl || exportCamDist === null) {
        return {
            shouldRender: false,
            nextLastUpdateMs,
        };
    }

    const fmt = getFormat?.() ?? 'gif';
    const { width: expW, height: expH } = getPreviewExportSize?.(fmt) || {};
    const bgEnabled = !!getBgEnabled?.();
    const { exportTransparentEl, exportTransparentPngEl } = getTransparentElements?.() || {};

    const isTransparentPreview = deriveTransparency?.(fmt, {
        bgEnabled,
        exportTransparentEl,
        exportTransparentPngEl,
    });

    syncWrapTransparency?.(previewEl.parentElement, isTransparentPreview);

    return {
        shouldRender: true,
        nextLastUpdateMs,
        pv: previewEl,
        fmt,
        expW,
        expH,
        isTransparentPreview,
    };
}
