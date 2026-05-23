export function createExportBusyStateController({
    btnGif,
    btnVideo,
    btnPng,
    getJpegBtn,
    getMainBtn,
    setIsExporting,
    showExportProgressOverlay,
    hideExportProgressOverlay,
} = {}) {
    function setExporting(nextExporting) {
        const exporting = !!nextExporting;
        setIsExporting?.(exporting);

        if (btnGif) btnGif.disabled = exporting;
        if (btnVideo) btnVideo.disabled = exporting;
        if (btnPng) btnPng.disabled = exporting;

        const jpegBtn = getJpegBtn?.();
        if (jpegBtn) jpegBtn.disabled = exporting;

        const mainBtn = getMainBtn?.();
        if (mainBtn) mainBtn.disabled = exporting;

        if (exporting) showExportProgressOverlay?.('Preparing…');
        else hideExportProgressOverlay?.();
    }

    return {
        setExporting,
    };
}
