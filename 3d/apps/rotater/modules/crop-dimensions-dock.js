export function createCropDimensionsDockController({
    cropDimensionsDock,
    exportFormatEl,
    rootEl,
    getExportFrameCanvas,
    getCropFrameRect,
} = {}) {
    function updateCropDimensionsDock({
        frameRect = null,
        exportWorkspaceActive = false,
        exportFrameEnabled = false,
    } = {}) {
        const showDimensions = !!exportFormatEl?.value;
        const inExportWorkspace = !!(
            exportWorkspaceActive
            && rootEl?.classList?.contains('export-workspace-active')
        );
        const useDock = showDimensions
            && !!cropDimensionsDock
            && (inExportWorkspace || exportFrameEnabled);

        if (!cropDimensionsDock) return;
        if (!useDock) {
            cropDimensionsDock.hidden = true;
            cropDimensionsDock.setAttribute('aria-hidden', 'true');
            return;
        }

        cropDimensionsDock.hidden = false;
        cropDimensionsDock.setAttribute('aria-hidden', 'false');

        // In export workspace the crop dock lives inside the export card, not on-canvas.
        if (inExportWorkspace) {
            cropDimensionsDock.style.left = '';
            cropDimensionsDock.style.top = '';
            return;
        }

        const fc = getExportFrameCanvas?.();
        const wrap = fc?.parentElement;
        if (!wrap) return;

        const w = fc?.width || wrap.clientWidth;
        const h = fc?.height || wrap.clientHeight;
        if (!w || !h) return;

        const rect = frameRect ?? getCropFrameRect?.(w, h);
        if (!rect || rect.sw <= 0 || rect.sh <= 0) return;

        const dockW = cropDimensionsDock.offsetWidth || 52;
        const dockH = cropDimensionsDock.offsetHeight || 214;
        const top = Math.max(8, Math.min(h - dockH - 8, rect.sy + (rect.sh - dockH) / 2));

        // Keep the crop shapes in crop mode aligned right rigidly.
        const rightOffset = 16;
        const left = Math.max(8, w - dockW - rightOffset);

        cropDimensionsDock.style.left = `${Math.round(left)}px`;
        cropDimensionsDock.style.top = `${Math.round(top)}px`;
    }

    return {
        updateCropDimensionsDock,
    };
}
