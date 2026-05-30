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
    getCurrentExportFormat,
    getExportMp4Bitrate,
} = {}) {
    if (!btnGif) return;
    refreshExportMotionSpeedOptionLabels?.();

    const gN = getExportFrames(exportGifFps);
    const gSecs = Math.max(0.1, (gN / Math.max(1, exportGifFps)));
    const { width: gifW, height: gifH } = getImageExportSize('gif');
    const gifMB = ((gifW * gifH * gN * 0.055) / (1024 * 1024)).toFixed(2);
    btnGif.title = 'Save animated GIF';
    if (gifEstEl) gifEstEl.textContent = `~${gifMB} MB · ${gifW}×${gifH}px`;

    const mN = getExportFrames(exportMp4Fps);
    const mSecs = Math.max(0.1, (mN / Math.max(1, exportMp4Fps)));
    const { width: mp4W, height: mp4H } = getImageExportSize('mp4');
    const mp4Bitrate = Math.max(1, Number(getExportMp4Bitrate?.() || 8_000_000));
    const mp4MB = ((mp4Bitrate * mSecs) / 8 / (1024 * 1024)).toFixed(2);
    if (btnVideo) btnVideo.title = 'Save MP4 video';
    if (mp4EstEl) mp4EstEl.textContent = `~${mp4MB} MB · ${mp4W}×${mp4H}px`;

    const { width: pw, height: ph } = getImageExportSize('png');
    const pngMB = (pw * ph * (0.08 + exportImageQuality * 0.32) / (1024 * 1024)).toFixed(2);
    const jpegMB = (pw * ph * (0.03 + exportImageQuality * 0.22) / (1024 * 1024)).toFixed(2);
    if (imgEstPngEl) imgEstPngEl.textContent = `~${pngMB} MB · ${pw}×${ph}px`;
    if (imgEstJpgEl) imgEstJpgEl.textContent = `~${jpegMB} MB · ${pw}×${ph}px`;

    const currentFormat = getCurrentExportFormat?.() || 'gif';
    const miniSummary = currentFormat === 'mp4'
        ? `~${mp4MB} MB · ${mN} frames · ${mp4W}×${mp4H}px`
        : currentFormat === 'png'
            ? `~${pngMB} MB · ${pw}×${ph}px`
            : currentFormat === 'jpg'
                ? `~${jpegMB} MB · ${pw}×${ph}px`
                : `~${gifMB} MB · ${gN} frames · ${gifW}×${gifH}px`;
    if (gifEstEl) gifEstEl.textContent = miniSummary;
    if (mp4EstEl) mp4EstEl.textContent = miniSummary;
}
