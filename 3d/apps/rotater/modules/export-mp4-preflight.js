export function createExportMp4PreflightController({
    getExportFrameEnabled,
    syncExportCameraFromViewport,
    getMp4Config,
    getImageExportSize,
    exportFrames,
    validateExportWorkload,
    validateResolutionForEncoding,
    setStatus,
    setAnimStatus,
    scheduleClearStatus,
} = {}) {
    function reportPreflightError(err, fallbackMessage = 'MP4 export preflight failed.', clearDelayMs = 6500) {
        const message = 'Error: ' + (err?.message || fallbackMessage);
        setStatus?.(message);
        setAnimStatus?.(message);
        scheduleClearStatus?.(clearDelayMs);
        return null;
    }

    function runMp4Preflight() {
        try {
            if (getExportFrameEnabled?.()) syncExportCameraFromViewport?.();
            const config = getMp4Config?.() || {};
            const fps = Number(config.fps) || 60; // Default to 60fps if missing
            const bitrate = config.bitrate || 24_000_000;
            const loops = config.loops ?? 0;
            const { width: W, height: H } = getImageExportSize?.() || {};
            
            // Validate resolution compatibility with H.264 encoder constraints
            if (validateResolutionForEncoding) {
                const resValidation = validateResolutionForEncoding({ width: W, height: H });
                if (!resValidation.valid) {
                    return reportPreflightError(
                        new Error(resValidation.reason),
                        'MP4 export resolution not supported by H.264 encoder.',
                        6500
                    );
                }
            }
            
            const n = exportFrames?.(fps);
            const totalFrames = n * (loops + 1);
            const workloadResult = validateExportWorkload?.({
                format: 'mp4',
                width: W,
                height: H,
                fps,
                frames: totalFrames,
                allowUnsafeWorkload: true,
            });
            if (workloadResult?.warning) {
                const warningMessage = 'Warning: ' + workloadResult.warning;
                setStatus?.(warningMessage);
                setAnimStatus?.(warningMessage);
            }
            return { fps, bitrate, W, H, n, totalFrames, workloadWarning: workloadResult?.warning || '' };
        } catch (err) {
            return reportPreflightError(err);
        }
    }

    function showUnsupportedWebCodecs() {
        const unsupportedMessage = 'Error: WebCodecs not supported in this browser (use Chrome/Edge/Safari 16.4+).';
        setStatus?.(unsupportedMessage);
        setAnimStatus?.(unsupportedMessage);
        scheduleClearStatus?.(6000);
    }

    function assertMp4Preflight(preflight) {
        const { fps, bitrate, W, H, n, totalFrames } = preflight || {};
        if (!fps || !bitrate || !W || !H || !n || !totalFrames) {
            throw new Error('MP4 export preflight is unavailable. Please try again.');
        }
        return { fps, bitrate, W, H, n, totalFrames };
    }

    return {
        runMp4Preflight,
        showUnsupportedWebCodecs,
        assertMp4Preflight,
    };
}
