export function createExportDownloadController({
    createObjectUrl,
    revokeObjectUrl,
    createAnchor,
    scheduleRevoke,
} = {}) {
    function download(data, filename, type) {
        const blob = data instanceof Blob ? data : new Blob([data], { type });
        const href = createObjectUrl?.(blob);
        if (!href) return;

        const anchor = createAnchor?.({ href, download: filename });
        anchor?.click?.();

        scheduleRevoke?.(() => {
            revokeObjectUrl?.(href);
        }, 2000);
    }

    return {
        download,
    };
}
