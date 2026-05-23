export function evaluateExportPreviewTimingController({
    force = false,
    nowMs,
    lastUpdateMs = 0,
    intervalMs = 160,
} = {}) {
    if (force) {
        return {
            shouldRender: true,
            nextLastUpdateMs: 0,
        };
    }

    if ((nowMs - lastUpdateMs) < intervalMs) {
        return {
            shouldRender: false,
            nextLastUpdateMs: lastUpdateMs,
        };
    }

    return {
        shouldRender: true,
        nextLastUpdateMs: nowMs,
    };
}
