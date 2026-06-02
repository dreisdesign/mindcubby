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
    getGifDitherEnabled,
} = {}) {
    if (!btnGif) return;
    refreshExportMotionSpeedOptionLabels?.();

    const formatEstimatedSize = (valueInMb) => {
        const mb = Math.max(0, Number(valueInMb) || 0);
        if (mb >= 100) return `${Math.round(mb)} MB`;
        if (mb >= 10) return `${mb.toFixed(1)} MB`;
        if (mb >= 1) return `${mb.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} MB`;

        const kb = mb * 1024;
        if (kb >= 10) return `${Math.round(kb)} KB`;
        return '<10 KB';
    };

    const gN = getExportFrames(exportGifFps);
    const gSecs = Math.max(0.1, (gN / Math.max(1, exportGifFps)));
    const { width: gifW, height: gifH } = getImageExportSize('gif');
    const gifDitherMultiplier = getGifDitherEnabled?.() ? 1.18 : 1;
    const gifMBValue = (gifW * gifH * gN * 0.028 * gifDitherMultiplier) / (1024 * 1024);
    const gifSize = formatEstimatedSize(gifMBValue);
    btnGif.title = 'Save animated GIF';
    if (gifEstEl) gifEstEl.textContent = `~${gifSize}`;

    const mN = getExportFrames(exportMp4Fps);
    const mSecs = Math.max(0.1, (mN / Math.max(1, exportMp4Fps)));
    const { width: mp4W, height: mp4H } = getImageExportSize('mp4');
    const mp4Bitrate = Math.max(1, Number(getExportMp4Bitrate?.() || 8_000_000));
    const mp4Size = formatEstimatedSize((mp4Bitrate * mSecs) / 8 / (1024 * 1024));
    if (btnVideo) btnVideo.title = 'Save MP4 video';
    if (mp4EstEl) mp4EstEl.textContent = `~${mp4Size}`;

    const { width: pw, height: ph } = getImageExportSize('png');
    const pngSize = formatEstimatedSize(pw * ph * (0.08 + exportImageQuality * 0.32) / (1024 * 1024));
    const jpegSize = formatEstimatedSize(pw * ph * (0.03 + exportImageQuality * 0.22) / (1024 * 1024));
    if (imgEstPngEl) imgEstPngEl.textContent = `~${pngSize}`;
    if (imgEstJpgEl) imgEstJpgEl.textContent = `~${jpegSize}`;

    const currentFormat = getCurrentExportFormat?.() || 'gif';
    const miniSummary = currentFormat === 'mp4'
        ? `~${mp4Size} · ${mN} frames`
        : currentFormat === 'png'
            ? `~${pngSize}`
            : currentFormat === 'jpg'
                ? `~${jpegSize}`
                : `~${gifSize} · ${gN} frames`;
    if (gifEstEl) gifEstEl.textContent = miniSummary;
    if (mp4EstEl) mp4EstEl.textContent = miniSummary;
}
