export function applyExportSceneForRenderController(
    {
        forceTransparent = false,
        renderer,
        scene,
        three,
        exportBgColorEl,
        exportGridEl,
        exportBuildPlateEl,
        buildPlateEnabled,
        hasMesh,
        modelDims,
        getBuildPlateMesh,
        getRulerGridHelper,
        getRulerFootprintHelper,
        getRulerState,
        setRulerState,
        updateRulerGrid,
    } = {}
) {
    if (!renderer || !scene || !three) return () => { };

    const includeBg = !!(exportBgColorEl?.checked ?? true);
    const includeGrid = !!(exportGridEl?.checked ?? true);
    const includeBuildPlate = !!(exportBuildPlateEl ? exportBuildPlateEl.checked : buildPlateEnabled);
    const transparent = forceTransparent || !includeBg;

    const buildPlateMesh = getBuildPlateMesh?.();
    const savedBg = scene.background;
    const savedClearColor = renderer.getClearColor(new three.Color());
    const savedClearAlpha = renderer.getClearAlpha();
    const savedBuildPlateVisible = buildPlateMesh?.visible;
    const savedRulerGridVisible = getRulerGridHelper?.()?.visible;
    const savedRulerFootprintVisible = getRulerFootprintHelper?.()?.visible;

    if (buildPlateMesh) {
        buildPlateMesh.visible = !!(includeBuildPlate && buildPlateEnabled && hasMesh);
    }

    const showGrid = !!(includeGrid && hasMesh);
    if (showGrid && !getRulerGridHelper?.() && modelDims && scene) {
        // Create grid helpers on demand for export while preserving current ruler state.
        const savedRulerState = getRulerState?.() ?? { rulerEnabled: false, rulerLinesVisible: false };
        setRulerState?.({ rulerEnabled: true, rulerLinesVisible: true });
        updateRulerGrid?.();
        setRulerState?.(savedRulerState);
        if (getRulerGridHelper?.()) getRulerGridHelper().visible = false;
        if (getRulerFootprintHelper?.()) getRulerFootprintHelper().visible = false;
    }

    if (getRulerGridHelper?.()) getRulerGridHelper().visible = showGrid;
    if (getRulerFootprintHelper?.()) getRulerFootprintHelper().visible = showGrid;

    if (transparent) {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
    }

    return () => {
        const currentBuildPlateMesh = getBuildPlateMesh?.();
        const currentRulerGridHelper = getRulerGridHelper?.();
        const currentRulerFootprintHelper = getRulerFootprintHelper?.();

        scene.background = savedBg;
        renderer.setClearColor(savedClearColor, savedClearAlpha);

        if (currentBuildPlateMesh && typeof savedBuildPlateVisible === 'boolean') {
            currentBuildPlateMesh.visible = savedBuildPlateVisible;
        }
        // Recompute canonical grid visibility after preview pass restore.
        // This avoids helper-visible desync when transient preview state differs
        // from main viewport state.
        if (typeof updateRulerGrid === 'function') {
            updateRulerGrid();
        } else {
            if (currentRulerGridHelper) {
                currentRulerGridHelper.visible = typeof savedRulerGridVisible === 'boolean' ? savedRulerGridVisible : false;
            }
            if (currentRulerFootprintHelper) {
                currentRulerFootprintHelper.visible = typeof savedRulerFootprintVisible === 'boolean' ? savedRulerFootprintVisible : false;
            }
        }
    };
}
