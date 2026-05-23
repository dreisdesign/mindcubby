export function commitExportPreviewStateController(pipelineResult, {
    setLastUpdateMs,
    setExportCameraState,
    setPreviewResources,
} = {}) {
    const nextLastUpdateMs = pipelineResult?.nextLastUpdateMs;
    if (Number.isFinite(nextLastUpdateMs)) {
        setLastUpdateMs?.(nextLastUpdateMs);
    }

    if (!pipelineResult?.shouldRender) {
        return false;
    }

    setExportCameraState?.({
        exportCamDist: pipelineResult.exportCamDist,
        exportCamElev: pipelineResult.exportCamElev,
        exportCamZoom: pipelineResult.exportCamZoom,
    });

    setPreviewResources?.({
        previewRt: pipelineResult.previewRt,
        previewRtWidth: pipelineResult.previewRtWidth,
        previewRtHeight: pipelineResult.previewRtHeight,
        previewCam: pipelineResult.previewCam,
    });

    return true;
}
