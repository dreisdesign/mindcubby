export function createMultipartPersistScheduler({
    delayMs = 140,
    onCommit,
} = {}) {
    let timer = 0;

    const commitNow = () => {
        timer = 0;
        if (typeof onCommit === 'function') onCommit();
    };

    const flush = () => {
        if (timer) {
            clearTimeout(timer);
            timer = 0;
        }
        commitNow();
    };

    return {
        schedule({ immediate = false } = {}) {
            if (immediate) {
                flush();
                return;
            }
            if (timer) clearTimeout(timer);
            timer = setTimeout(commitNow, delayMs);
        },
        flush,
        cancel() {
            if (!timer) return;
            clearTimeout(timer);
            timer = 0;
        },
    };
}

export function createDeferredCommitQueue({
    delayMs = 100,
    onFlush,
} = {}) {
    let timer = 0;
    let pendingPayload = null;

    const flushNow = () => {
        timer = 0;
        const payload = pendingPayload;
        pendingPayload = null;
        if (typeof onFlush === 'function') onFlush(payload);
    };

    return {
        schedule(payload = null) {
            pendingPayload = payload;
            if (timer) clearTimeout(timer);
            timer = setTimeout(flushNow, delayMs);
        },
        flush() {
            if (timer) {
                clearTimeout(timer);
                timer = 0;
            }
            flushNow();
        },
        cancel() {
            if (timer) {
                clearTimeout(timer);
                timer = 0;
            }
            pendingPayload = null;
        },
    };
}

export function createRafPreviewScheduler({ onFrame } = {}) {
    let frameId = 0;

    const run = () => {
        frameId = 0;
        if (typeof onFrame === 'function') onFrame();
    };

    return {
        schedule() {
            if (frameId) return;
            frameId = requestAnimationFrame(run);
        },
        flush() {
            if (frameId) {
                cancelAnimationFrame(frameId);
                frameId = 0;
            }
            run();
        },
        cancel() {
            if (!frameId) return;
            cancelAnimationFrame(frameId);
            frameId = 0;
        },
    };
}
