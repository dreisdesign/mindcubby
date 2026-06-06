export function createExportMp4RuntimeController({
    getHasMesh,
    hasVideoEncoderSupport,
    preflightController,
    setExporting,
    requestAnimationFrameFn,
    setControlsAutoRotate,
    setStatus,
    setAnimStatus,
    getAutoRotateRestoreState,
    scheduleClearStatus,
} = {}) {
    async function runMp4Export({ runEncodeFlow } = {}) {
        if (!getHasMesh?.()) return;

        if (!hasVideoEncoderSupport?.()) {
            preflightController?.showUnsupportedWebCodecs?.();
            return;
        }

        const mp4Preflight = preflightController?.runMp4Preflight?.();
        if (!mp4Preflight) return;

        setExporting?.(true);
        await new Promise((resolve) => requestAnimationFrameFn?.(resolve));
        setControlsAutoRotate?.(false);

        let hasError = false;
        try {
            const parsedPreflight = preflightController?.assertMp4Preflight?.(mp4Preflight) || mp4Preflight;
            await runEncodeFlow?.(parsedPreflight);
        } catch (err) {
            hasError = true;
            const message = 'Error: ' + (err?.message || 'MP4 export failed.');
            setStatus?.(message);
            setAnimStatus?.(message);
            console.error(err);
        } finally {
            setExporting?.(false);
            setControlsAutoRotate?.(!!getAutoRotateRestoreState?.());
            // Keep error messages visible longer so users can read them
            scheduleClearStatus?.(hasError ? 15000 : 5000);
        }
    }

    return {
        runMp4Export,
    };
}
