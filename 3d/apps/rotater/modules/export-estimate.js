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

    const estimateMp4SizeMb = ({ bitrate = 8_000_000, seconds = 1, width = 1080, height = 1080, fps = 30 } = {}) => {
        const safeBitrate = Math.max(1, Number(bitrate) || 8_000_000);
        const safeSeconds = Math.max(0.1, Number(seconds) || 1);
        const safeW = Math.max(1, Math.floor(Number(width) || 1080));
        const safeH = Math.max(1, Math.floor(Number(height) || 1080));
        const safeFps = Math.max(1, Number(fps) || 30);

        const baselineMb = (safeBitrate * safeSeconds) / 8 / (1024 * 1024);
        const megapixelsPerSecond = (safeW * safeH * safeFps) / 1_000_000;

        // Browsers can exceed target bitrate at very high pixel rates (e.g. Ultra + 240fps).
        // Apply a conservative pressure factor so estimates stay closer to real outputs.
        const pressure = Math.max(0, (megapixelsPerSecond - 220) / 1200);
        const vbrSafetyFactor = 1 + Math.min(1.2, pressure);
        const containerOverheadFactor = 1.05;

        return baselineMb * vbrSafetyFactor * containerOverheadFactor;
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
    const mp4Size = formatEstimatedSize(estimateMp4SizeMb({
        bitrate: mp4Bitrate,
        seconds: mSecs,
        width: mp4W,
        height: mp4H,
        fps: exportMp4Fps,
    }));
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
