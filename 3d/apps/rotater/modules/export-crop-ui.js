export function createExportCropUiController({
    frameOverlayBtn,
    orbitHintTextEl,
    orbitHintBarEl,
} = {}) {
    let hintVisibleBeforeCrop = null;

    function updateFrameOverlayButtonUI(exportFrameEnabled) {
        if (!frameOverlayBtn) return;
        frameOverlayBtn.setAttribute('aria-pressed', String(!!exportFrameEnabled));
        if (exportFrameEnabled) {
            frameOverlayBtn.classList.add('is-crop-confirm');
            frameOverlayBtn.title = 'Reset crop (Esc)';
            frameOverlayBtn.setAttribute('aria-label', 'Reset crop');
            return;
        }
        frameOverlayBtn.classList.remove('is-crop-confirm');
        frameOverlayBtn.title = 'Show export frame';
        frameOverlayBtn.setAttribute('aria-label', 'Show export frame');
    }

    function updateCropHintUI(exportFrameEnabled) {
        if (orbitHintTextEl) {
            orbitHintTextEl.textContent = exportFrameEnabled
                ? 'Drag to orbit · Scroll to zoom · Hold Shift + drag to pan'
                : 'Drag to orbit · Scroll to zoom · Right-drag up/down · Hold Shift + drag to pan';
        }
        if (!orbitHintBarEl) return;

        if (exportFrameEnabled) {
            if (hintVisibleBeforeCrop === null) {
                hintVisibleBeforeCrop = orbitHintBarEl.classList.contains('visible');
            }
            orbitHintBarEl.classList.add('visible');
            return;
        }

        if (hintVisibleBeforeCrop === false) {
            orbitHintBarEl.classList.remove('visible');
        }
        hintVisibleBeforeCrop = null;
    }

    return {
        updateFrameOverlayButtonUI,
        updateCropHintUI,
    };
}
