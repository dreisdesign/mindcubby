export function createExportMp4ScenePrepController({
    createCanvas,
    applyExportSceneForRender,
} = {}) {
    function prepareMp4Scene({ width, height, exportBgColorChecked } = {}) {
        const out = createCanvas?.({ width, height })
            || (typeof OffscreenCanvas !== 'undefined'
                ? new OffscreenCanvas(width, height)
                : (typeof document !== 'undefined' ? document.createElement('canvas') : null));
        if (out) {
            out.width = width;
            out.height = height;
        }

        // Standard 2D context without willReadFrequently so the canvas remains GPU-accelerated
        // for optimal VideoFrame throughput and hardware video encoder ingestion.
        const outCtx = out?.getContext?.('2d') || null;
        if (outCtx) {
            outCtx.imageSmoothingEnabled = true;
            outCtx.imageSmoothingQuality = 'high';
        }

        const transparentVideo = !exportBgColorChecked;
        const restoreExportScene = applyExportSceneForRender?.({ forceTransparent: transparentVideo })
            || (() => { });

        return {
            out,
            outCtx,
            transparentVideo,
            restoreExportScene,
        };
    }

    return {
        prepareMp4Scene,
    };
}
