import {
    updateExportWorkspaceTransparencyPatternController,
    setExportWorkspaceActiveController,
    openExportWorkspaceController,
    closeExportWorkspaceController,
} from './export-workspace.js';

const EXPORT_WORKSPACE_ACTIVE_KEY = 'rotater_exportWorkspaceActive';

export function createExportWorkspaceRuntimeController({
    rootEl,
    canvas,
    exportBgColorEl,
    exportGridEl,
    exportBuildPlateEl,
    getRulerLinesVisible,
    getBuildPlateEnabled,
    setWorkspaceActive,
    getWorkspaceActive,
    updateExportPauseButtonUI,
    syncCanvasSize,
    restoreExportPanelPosition,
    enterCropMode,
    confirmCropMode,
    getExportFrameEnabled,
} = {}) {
    function updateExportWorkspaceTransparencyPattern() {
        updateExportWorkspaceTransparencyPatternController({
            canvas,
            exportWorkspaceActive: !!getWorkspaceActive?.(),
            exportBgColorEl,
        });
    }

    function setExportWorkspaceActive(active) {
        const exportOverlayEl = document.getElementById('exportOverlay');
        const isDesktopV2Layout = !!rootEl?.classList?.contains('layout-v2-desktop');
        setExportWorkspaceActiveController(active, {
            setExportWorkspaceActive: (nextActive) => {
                setWorkspaceActive?.(!!nextActive);
            },
            rootEl,
            applyRootWorkspaceClass: !isDesktopV2Layout,
            exportOverlayEl,
            exportGridEl,
            rulerLinesVisible: !!getRulerLinesVisible?.(),
            exportBuildPlateEl,
            buildPlateEnabled: !!getBuildPlateEnabled?.(),
            updateExportWorkspaceTransparencyPattern,
            updateExportPauseButtonUI,
            syncCanvasSize,
            persistWorkspaceActive: (nextActive) => {
                try { localStorage.setItem(EXPORT_WORKSPACE_ACTIVE_KEY, nextActive ? '1' : '0'); } catch (_) { }
            },
        });
    }

    function openExportWorkspace() {
        openExportWorkspaceController({
            setExportWorkspaceActive,
            restoreExportPanelPosition,
            enterCropMode,
        });
    }

    function closeExportWorkspace() {
        closeExportWorkspaceController({
            exportFrameEnabled: !!getExportFrameEnabled?.(),
            confirmCropMode,
            setExportWorkspaceActive,
        });
    }

    return {
        setExportWorkspaceActive,
        updateExportWorkspaceTransparencyPattern,
        openExportWorkspace,
        closeExportWorkspace,
    };
}
