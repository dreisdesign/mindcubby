export function readbackAndCommitExportPreviewController({
    renderer,
    previewRt,
    pxW,
    pxH,
    previewEl,
    readExportPreviewImageData,
    commitExportPreviewCanvasImage,
} = {}) {
    const imgData = readExportPreviewImageData?.({
        renderer,
        previewRt,
        pxW,
        pxH,
        createImageData: (w, h) => {
            const ctx = previewEl?.getContext?.('2d');
            return ctx ? ctx.createImageData(w, h) : null;
        },
    });
    if (!imgData) return { committed: false, ctx2d: null };

    const canvasCommit = commitExportPreviewCanvasImage?.({
        previewEl,
        imgData,
    });
    return canvasCommit ?? { committed: false, ctx2d: null };
}
