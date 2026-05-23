export function syncExportPreviewCameraStateController({
    exportFrameEnabled,
    getOrbitFrameState,
    getCropFrameVerticalScale,
    sourceCameraZoom = 1,
} = {}) {
    if (!exportFrameEnabled) return null;

    const { dist, elev } = getOrbitFrameState();
    const cropScale = getCropFrameVerticalScale();
    return {
        exportCamDist: dist,
        exportCamElev: elev,
        exportCamZoom: (sourceCameraZoom || 1) / cropScale,
    };
}
