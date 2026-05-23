export function commitExportPreviewCanvasImageController({
    previewEl,
    imgData,
} = {}) {
    const ctx2d = previewEl?.getContext?.('2d');
    if (!ctx2d || !imgData) return { ctx2d: null, committed: false };
    ctx2d.putImageData(imgData, 0, 0);
    return { ctx2d, committed: true };
}
