export function createRightPanLockController() {
    let controlsDefaultMouseButtons = null;
    let controlsDefaultTouches = null;
    let rightPanVerticalLockActive = false;
    let rightPanVerticalLock = null;

    function setDefaults({ mouseButtons, touches } = {}) {
        controlsDefaultMouseButtons = mouseButtons ? { ...mouseButtons } : null;
        controlsDefaultTouches = touches ? { ...touches } : null;
    }

    function isVerticalLockActive() {
        return rightPanVerticalLockActive;
    }

    function beginVerticalLock({ controls, camera } = {}) {
        if (!controls || !camera) return;
        rightPanVerticalLockActive = true;
        rightPanVerticalLock = {
            targetX: controls.target.x,
            targetZ: controls.target.z,
            cameraX: camera.position.x,
            cameraZ: camera.position.z,
        };
    }

    function enforceVerticalLock({ controls, camera } = {}) {
        if (!rightPanVerticalLockActive || !rightPanVerticalLock || !controls || !camera) return;
        controls.target.x = rightPanVerticalLock.targetX;
        controls.target.z = rightPanVerticalLock.targetZ;
        camera.position.x = rightPanVerticalLock.cameraX;
        camera.position.z = rightPanVerticalLock.cameraZ;
    }

    function endVerticalLock() {
        rightPanVerticalLockActive = false;
        rightPanVerticalLock = null;
    }

    function setShiftPanInteraction({ active, controls, mousePanButton } = {}) {
        if (!controls) return;
        if (active) {
            controls.enablePan = true;
            controls.screenSpacePanning = true;
            controls.mouseButtons.LEFT = mousePanButton;
            return;
        }

        if (controlsDefaultMouseButtons) {
            controls.mouseButtons = { ...controlsDefaultMouseButtons };
        }
        if (controlsDefaultTouches) {
            controls.touches = { ...controlsDefaultTouches };
        }
    }

    return {
        setDefaults,
        isVerticalLockActive,
        beginVerticalLock,
        enforceVerticalLock,
        endVerticalLock,
        setShiftPanInteraction,
    };
}
