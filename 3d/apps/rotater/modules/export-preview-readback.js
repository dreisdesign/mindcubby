export function readExportPreviewImageDataController({
    renderer,
    previewRt,
    pxW,
    pxH,
    createImageData,
} = {}) {
    if (!renderer || !previewRt || !createImageData) return null;

    const buf = new Uint8Array(pxW * pxH * 4);
    renderer.readRenderTargetPixels(previewRt, 0, 0, pxW, pxH, buf);

    const imgData = createImageData(pxW, pxH);
    for (let row = 0; row < pxH; row++) {
        const srcRow = (pxH - 1 - row) * pxW * 4;
        imgData.data.set(buf.subarray(srcRow, srcRow + pxW * 4), row * pxW * 4);
    }
    return imgData;
}
