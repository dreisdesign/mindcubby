export function executeExportPreviewRenderPassController({
    renderer,
    previewRt,
    scene,
    previewCam,
    applyExportSceneForRender,
    isTransparentPreview = false,
} = {}) {
    if (!renderer || !previewRt || !scene || !previewCam || !applyExportSceneForRender) return;

    const restoreExportScene = applyExportSceneForRender({
        forceTransparent: !!isTransparentPreview,
    });
    try {
        renderer.setRenderTarget(previewRt);
        renderer.render(scene, previewCam);
        renderer.setRenderTarget(null);
    } finally {
        restoreExportScene?.();
    }
}
