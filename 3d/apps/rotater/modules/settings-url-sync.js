export function createSettingsUrlSyncController({
    onSync,
} = {}) {
    let timer = 0;

    const runSync = () => {
        timer = 0;
        if (typeof onSync === 'function') onSync();
    };

    return {
        flush() {
            if (timer) {
                clearTimeout(timer);
                timer = 0;
            }
            runSync();
        },
        schedule(delayMs = 120) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(runSync, delayMs);
        },
        cancel() {
            if (!timer) return;
            clearTimeout(timer);
            timer = 0;
        },
    };
}
