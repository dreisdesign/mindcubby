export function syncExportPreviewCameraStateController({
    exportFrameEnabled,
    getOrbitFrameState,
    getCropFrameVerticalScale,
    sourceCameraZoom = 1,
    existingExportCamDist,
    existingExportCamElev,
    existingExportCamZoom,
} = {}) {
    if (!exportFrameEnabled) return null;

    const { dist, elev } = getOrbitFrameState();
    const cropScale = getCropFrameVerticalScale();
    const finiteOr = (value, fallback) => (
        typeof value === 'number' && Number.isFinite(value) && value > 0
            ? value
            : fallback
    );
    return {
        exportCamDist: finiteOr(existingExportCamDist, dist),
        exportCamElev: typeof existingExportCamElev === 'number' && Number.isFinite(existingExportCamElev)
            ? existingExportCamElev
            : elev,
        exportCamZoom: finiteOr(existingExportCamZoom, (sourceCameraZoom || 1) / cropScale),
    };
}
