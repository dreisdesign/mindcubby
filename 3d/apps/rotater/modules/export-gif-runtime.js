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
    async function runGifExport() {
        if (!getHasMesh?.()) return;

        setExporting?.(true);
        await new Promise((resolve) => requestAnimationFrameFn?.(resolve));
        setControlsAutoRotate?.(false);

        try {
            const { fps, loop, dither } = getExportGifConfig?.() || {};
            const { width: W, height: H } = getImageExportSize?.() || {};
            const frameCount = exportFrames?.(fps);
            const workloadCheck = validateExportWorkload?.({
                format: 'gif',
                width: W,
                height: H,
                fps,
                frames: frameCount,
                allowUnsafeWorkload: true,
            });
            if (workloadCheck?.warning) {
                setStatus?.('Large GIF export: this may take a while. For faster results, use Medium quality or a wider aspect ratio.');
                setAnimStatus?.('Large GIF workload detected. Continuing export...');
                await scheduleYield?.();
            }

            const isTransparent = !!getTransparentEnabled?.();
            const frames = await captureFrames?.(frameCount, { width: W, height: H }, isTransparent);
            const delay = Math.round(1000 / fps);

            setAnimStatus?.('Encoding GIF…');
            await scheduleYield?.();

            const repeat = loop ? 0 : -1;
            const gif = createGifEncoder?.();
            for (let i = 0; i < frames.length; i++) {
                if (isTransparent) {
                    const pal = quantize?.(frames[i], 255) || [];
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
                    const palette = quantize?.(frames[i], 256) || [];
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
