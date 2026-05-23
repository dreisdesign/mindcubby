export function updateExportEstimateController({
    refreshExportMotionSpeedOptionLabels,
    btnGif,
    btnVideo,
    getExportFrames,
    exportGifFps,
    exportMp4Fps,
    getImageExportSize,
    exportImageQuality,
    gifEstEl,
    mp4EstEl,
    imgEstPngEl,
    imgEstJpgEl,
} = {}) {
    if (!btnGif) return;
    refreshExportMotionSpeedOptionLabels?.();

    const gN = getExportFrames(exportGifFps);
    const gSecs = (gN / exportGifFps).toFixed(1);
    btnGif.title = 'Save animated GIF';
    if (gifEstEl) gifEstEl.innerHTML = `${gN} frames &middot; <b class="export-info-time">${gSecs}s</b>`;

    const mN = getExportFrames(exportMp4Fps);
    const mSecs = (mN / exportMp4Fps).toFixed(1);
    if (btnVideo) btnVideo.title = 'Save MP4 video';
    if (mp4EstEl) mp4EstEl.innerHTML = `${mN} frames &middot; <b class="export-info-time">${mSecs}s</b>`;

    if (imgEstPngEl || imgEstJpgEl) {
        const { width: pw, height: ph } = getImageExportSize();
        const pngMB = (pw * ph * 3 * 0.25 / (1024 * 1024)).toFixed(2);
        const jpegMB = (pw * ph * exportImageQuality * 0.21 / (1024 * 1024)).toFixed(2);
        if (imgEstPngEl) imgEstPngEl.textContent = `~${pngMB} MB · ${pw}×${ph}px`;
        if (imgEstJpgEl) imgEstJpgEl.textContent = `~${jpegMB} MB · ${pw}×${ph}px`;
    }
}
