export function createViewportPerformanceState() {
    return {
        qualityScale: 1,
        slowMs: 0,
        fastMs: 0,
    };
}

export function getViewportPixelRatio(devicePixelRatio, aaScale, minPixelRatio, maxPixelRatio, state) {
    const dpr = Math.max(0.5, Number(devicePixelRatio) || 1);
    const qualityScale = Math.max(0.5, Math.min(1, Number(state?.qualityScale) || 1));
    const scaled = dpr * aaScale * qualityScale;
    return Math.min(Math.max(scaled, minPixelRatio), maxPixelRatio);
}

export function updateViewportPerformanceState(state, deltaSec, options = {}) {
    if (!state) return false;

    const {
        enabled = true,
        minQualityScale = 0.62,
        downshiftFrameMs = 22,
        upshiftFrameMs = 16.5,
        slowHoldMs = 700,
        fastHoldMs = 1200,
        downStep = 0.08,
        upStep = 0.05,
    } = options;

    if (!enabled) {
        state.slowMs = 0;
        state.fastMs = 0;
        return false;
    }

    const deltaMs = Math.max(0, Math.min(250, (Number(deltaSec) || 0) * 1000));

    if (deltaMs >= downshiftFrameMs) {
        state.slowMs += deltaMs;
        state.fastMs = 0;
    } else if (deltaMs <= upshiftFrameMs) {
        state.fastMs += deltaMs;
        state.slowMs = 0;
    } else {
        state.slowMs = 0;
        state.fastMs = 0;
    }

    if (state.slowMs >= slowHoldMs && state.qualityScale > minQualityScale + 1e-4) {
        state.qualityScale = Math.max(minQualityScale, state.qualityScale - downStep);
        state.slowMs = 0;
        return true;
    }

    if (state.fastMs >= fastHoldMs && state.qualityScale < 1 - 1e-4) {
        state.qualityScale = Math.min(1, state.qualityScale + upStep);
        state.fastMs = 0;
        return true;
    }

    return false;
}
