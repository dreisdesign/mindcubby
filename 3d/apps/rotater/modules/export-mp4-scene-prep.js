export function createExportMp4ScenePrepController({
    createCanvas,
    applyExportSceneForRender,
} = {}) {
    function prepareMp4Scene({ width, height, exportBgColorChecked } = {}) {
        const out = createCanvas?.();
        if (out) {
            out.width = width;
            out.height = height;
        }

        const outCtx = out?.getContext?.('2d', { willReadFrequently: true }) || null;
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
