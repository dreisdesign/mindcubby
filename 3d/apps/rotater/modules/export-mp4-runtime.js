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
        console.log('[MP4 Runtime] Starting runMp4Export...');
        if (!getHasMesh?.()) {
            console.log('[MP4 Runtime] No mesh found, aborting');
            return;
        }

        if (!hasVideoEncoderSupport?.()) {
            console.log('[MP4 Runtime] No video encoder support, showing preflight');
            preflightController?.showUnsupportedWebCodecs?.();
            return;
        }

        console.log('[MP4 Runtime] Running MP4 preflight checks...');
        const mp4Preflight = preflightController?.runMp4Preflight?.();
        if (!mp4Preflight) {
            console.log('[MP4 Runtime] Preflight check returned falsy, aborting');
            return;
        }

        console.log('[MP4 Runtime] Preflight passed, setting exporting flag...');
        setExporting?.(true);
        await new Promise((resolve) => requestAnimationFrameFn?.(resolve));
        setControlsAutoRotate?.(false);

        let hasError = false;
        try {
            console.log('[MP4 Runtime] Asserting preflight and calling runEncodeFlow...');
            const parsedPreflight = preflightController?.assertMp4Preflight?.(mp4Preflight) || mp4Preflight;
            console.log('[MP4 Runtime] Calling runEncodeFlow with:', parsedPreflight);
            await runEncodeFlow?.(parsedPreflight);
            console.log('[MP4 Runtime] runEncodeFlow completed successfully!');
        } catch (err) {
            hasError = true;
            const message = 'Error: ' + (err?.message || 'MP4 export failed.');
            console.error('[MP4 Runtime] Export failed:', err);
            setStatus?.(message);
            setAnimStatus?.(message);
            console.error(err);
        } finally {
            console.log('[MP4 Runtime] In finally block, hasError=', hasError);
            setExporting?.(false);
            setControlsAutoRotate?.(!!getAutoRotateRestoreState?.());
            // Keep error messages visible longer so users can read them
            scheduleClearStatus?.(hasError ? 15000 : 5000);
            console.log('[MP4 Runtime] Export complete!');
        }
    }

    return {
        runMp4Export,
    };
}
