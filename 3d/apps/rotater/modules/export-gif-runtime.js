export function createExportGifRuntimeController({
    getHasMesh,
    setExporting,
    requestAnimationFrameFn,
    getControls,
    getExportGifConfig,
    getImageExportSize,
    exportFrames,
    validateExportWorkload,
    setStatus,
    getTransparentEnabled,
    captureFrames,
    setAnimStatus,
    scheduleYield,
    createGifEncoder,
    quantize,
    applyPalette,
    applyPaletteDithered,
    maybePaintExportProgress,
    download,
    buildExportFilename,
    getAutoRotateRestoreState,
    setControlsAutoRotate,
    scheduleClearAnimStatus,
} = {}) {
    function getGifTimingFromRequestedFps(requestedFps) {
        const safeRequestedFps = Math.max(1, Number(requestedFps) || 1);
        // GIF frame delays are centiseconds; use fixed delay for stable playback.
        const minDelayCs = 2;
        // Use ceil so effective FPS never exceeds requested FPS.
        const delayCs = Math.max(minDelayCs, Math.ceil(100 / safeRequestedFps));
        const delayMs = delayCs * 10;
        const effectiveFps = 100 / delayCs;
        return { delayMs, effectiveFps };
    }

    function buildSampledGlobalPalette(frames, maxColors = 256) {
        if (!frames?.length) return [];

        const maxSampleFrames = 24;
        const maxSamplePixels = 320000;
        const frameStep = Math.max(1, Math.ceil(frames.length / maxSampleFrames));
        const sampledFrameCount = Math.max(1, Math.ceil(frames.length / frameStep));
        const perFrameBudget = Math.max(1, Math.floor(maxSamplePixels / sampledFrameCount));
        const sample = [];

        for (let fi = 0; fi < frames.length; fi += frameStep) {
            const frame = frames[fi];
            const totalPixels = Math.floor(frame.length / 4);
            const pxStep = Math.max(1, Math.ceil(totalPixels / perFrameBudget));
            for (let px = 0; px < totalPixels; px += pxStep) {
                const o = px * 4;
                sample.push(frame[o], frame[o + 1], frame[o + 2], frame[o + 3]);
            }
        }

        const sampledRgba = new Uint8Array(sample);
        return quantize?.(sampledRgba, maxColors) || [];
    }

    async function runGifExport() {
        if (!getHasMesh?.()) return;

        setExporting?.(true);
        await new Promise((resolve) => requestAnimationFrameFn?.(resolve));
        setControlsAutoRotate?.(false);

        try {
            const { fps, loop, dither } = getExportGifConfig?.() || {};
            const { width: W, height: H } = getImageExportSize?.() || {};
            let { delayMs, effectiveFps } = getGifTimingFromRequestedFps(fps);
            let frameCount = exportFrames?.(effectiveFps);
            let workloadCheck = validateExportWorkload?.({
                format: 'gif',
                width: W,
                height: H,
                fps: effectiveFps,
                frames: frameCount,
                allowUnsafeWorkload: true,
            });
            if (workloadCheck?.warning) {
                // Reduce one cadence tier (e.g. 40ms -> 50ms) to ease decode stutter on huge GIFs.
                const saferDelayMs = delayMs + 10;
                const saferFps = 1000 / saferDelayMs;
                const saferFrameCount = exportFrames?.(saferFps);
                const saferWorkloadCheck = validateExportWorkload?.({
                    format: 'gif',
                    width: W,
                    height: H,
                    fps: saferFps,
                    frames: saferFrameCount,
                    allowUnsafeWorkload: true,
                });
                delayMs = saferDelayMs;
                effectiveFps = saferFps;
                frameCount = saferFrameCount;
                workloadCheck = saferWorkloadCheck;
                setStatus?.('Large GIF export: this may take a while. For faster results, use Medium quality or a wider aspect ratio.');
                setAnimStatus?.('Large GIF workload detected. Using safer GIF cadence for smoother playback...');
                await scheduleYield?.();
            }

            const isTransparent = !!getTransparentEnabled?.();
            const frames = await captureFrames?.(
                frameCount,
                { width: W, height: H },
                isTransparent,
                { fpsForValidation: effectiveFps, allowUnsafeWorkload: true }
            );
            const delay = delayMs;

            setAnimStatus?.('Building GIF palette…');
            await scheduleYield?.();

            const sharedPalette = isTransparent
                ? buildSampledGlobalPalette(frames, 255)
                : buildSampledGlobalPalette(frames, 256);

            setAnimStatus?.('Encoding GIF…');
            await scheduleYield?.();

            const repeat = loop ? 0 : -1;
            const gif = createGifEncoder?.();
            for (let i = 0; i < frames.length; i++) {
                if (isTransparent) {
                    const pal = sharedPalette.length ? sharedPalette : (quantize?.(frames[i], 255) || []);
                    const fullPal = pal.slice();
                    while (fullPal.length < 256) fullPal.push([0, 0, 0]);

                    const indices = applyPalette?.(frames[i], pal);
                    for (let px = 0; px < W * H; px++) {
                        if (frames[i][px * 4 + 3] < 128) indices[px] = 255;
                    }

                    gif.writeFrame(indices, W, H, {
                        palette: fullPal,
                        delay,
                        transparent: true,
                        transparentIndex: 255,
                        ...(i === 0 && { repeat }),
                    });
                } else {
                    const palette = sharedPalette.length ? sharedPalette : (quantize?.(frames[i], 256) || []);
                    const index = dither
                        ? applyPaletteDithered?.(frames[i], palette, W, H)
                        : applyPalette?.(frames[i], palette);
                    gif.writeFrame(index, W, H, { palette, delay, ...(i === 0 && { repeat }) });
                }

                await maybePaintExportProgress?.(`Encoding… ${i + 1} / ${frames.length}`, i + 1, frames.length);
            }

            gif.finish();
            download?.(gif.bytes(), buildExportFilename?.('gif'), 'image/gif');
            setAnimStatus?.('GIF saved ✓');
        } catch (err) {
            setAnimStatus?.('Error: ' + err.message);
            console.error(err);
        } finally {
            setExporting?.(false);
            setControlsAutoRotate?.(!!getAutoRotateRestoreState?.());
            scheduleClearAnimStatus?.();
        }
    }

    return {
        runGifExport,
    };
}
