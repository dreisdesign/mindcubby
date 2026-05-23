export function ensureAndConfigureExportPreviewCameraController({
    previewCam,
    createPerspectiveCamera,
    sourceCamera,
    pxW,
    pxH,
    exportFrameEnabled,
    getOrbitFrameState,
    setCameraFromOrbitState,
} = {}) {
    let cam = previewCam;
    if (!cam) {
        cam = createPerspectiveCamera?.();
    }
    if (!cam || !sourceCamera) return cam;

    // Match preview camera projection to the active viewport camera.
    cam.fov = sourceCamera.fov;
    cam.near = sourceCamera.near;
    cam.far = sourceCamera.far;
    cam.up.copy(sourceCamera.up);
    cam.aspect = pxW / pxH;
    cam.updateProjectionMatrix();

    if (exportFrameEnabled) {
        const { target, dist, elev, az } = getOrbitFrameState();
        setCameraFromOrbitState(cam, target, dist, elev, az);
        cam.zoom = sourceCamera.zoom || 1; // Uncropped zoom
        cam.updateProjectionMatrix();
    } else {
        const { target, dist: liveDist, elev: liveElev, az } = getOrbitFrameState();
        setCameraFromOrbitState(cam, target, liveDist, liveElev, az);
        cam.zoom = sourceCamera.zoom || 1;
        cam.updateProjectionMatrix();
    }

    return cam;
}
