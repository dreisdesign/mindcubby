import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import {
    deriveExportPreviewTransparencyController,
    syncExportPreviewWrapTransparencyController,
} from './export-preview-transparency.js';
import {
    computeExportPreviewDimensionsController,
} from './export-preview-dimensions.js';
import {
    ensureAndConfigureExportPreviewCameraController,
} from './export-preview-camera.js';
import {
    ensureExportPreviewRenderTargetController,
} from './export-preview-render-target.js';
import {
    readExportPreviewImageDataController,
} from './export-preview-readback.js';
import {
    drawExportPreviewCropOverlayController,
} from './export-preview-crop-overlay.js';
import {
    executeExportPreviewRenderPassController,
} from './export-preview-render-pass.js';
import {
    commitExportPreviewCanvasImageController,
} from './export-preview-canvas-commit.js';
import {
    syncExportPreviewCameraStateController,
} from './export-preview-camera-state.js';
import {
    readbackAndCommitExportPreviewController,
} from './export-preview-readback-commit.js';
import {
    applyExportPreviewOverlaysController,
} from './export-preview-overlays.js';
import {
    syncExportPreviewTargetSizeController,
} from './export-preview-target-size.js';
import {
    prepareExportPreviewResourcesController,
} from './export-preview-resources.js';
import {
    prepareExportPreviewPreflightController,
} from './export-preview-preflight.js';
import {
    prepareExportPreviewCanvasController,
} from './export-preview-canvas-prep.js';
import {
    runExportPreviewPipelineController,
} from './export-preview-pipeline.js';

export function updateExportPreviewController({
    force = false,
    nowMs = performance.now(),
    lastUpdateMs = 0,
    intervalMs = 0,
    exportCamDist,
    exportCamElev,
    exportCamZoom,
    exportFrameEnabled,
    canvasEl,
    renderer,
    scene,
    sourceCamera,
    previewRt,
    previewRtWidth,
    previewRtHeight,
    previewCam,
    getOrbitFrameState,
    getCropFrameVerticalScale,
    setCameraFromOrbitState,
    getCropFrameRect,
    drawRulerOverlay,
    exportFormatEl,
    exportBgColorEl,
    exportPreviewDprMax,
    isPreviewActive,
    evaluateTimingController,
    getPreviewExportSize,
    applyExportSceneForRender,
    devicePixelRatio = window.devicePixelRatio,
    getPreviewElement = () => document.getElementById('exportPreview'),
    getTransparentElements = () => ({
        exportTransparentEl: document.getElementById('exportTransparent'),
        exportTransparentPngEl: document.getElementById('exportTransparentPng'),
    }),
} = {}) {
    return runExportPreviewPipelineController({
        force,
        nowMs,
        lastUpdateMs,
        intervalMs,
        exportCamDist,
        exportCamElev,
        exportCamZoom,
        exportFrameEnabled,
        canvasEl,
        renderer,
        scene,
        sourceCamera,
        previewRt,
        previewRtWidth,
        previewRtHeight,
        previewCam,
        getOrbitFrameState,
        getCropFrameVerticalScale,
        setCameraFromOrbitState,
        getCropFrameRect,
        drawRulerOverlay,
        exportFormatEl,
        exportBgColorEl,
        exportPreviewDprMax,
        isPreviewActive,
        evaluateTimingController,
        preflightController: prepareExportPreviewPreflightController,
        canvasPrepController: prepareExportPreviewCanvasController,
        cameraStateController: syncExportPreviewCameraStateController,
        resourcesController: prepareExportPreviewResourcesController,
        renderPassController: executeExportPreviewRenderPassController,
        readbackCommitController: readbackAndCommitExportPreviewController,
        overlaysController: applyExportPreviewOverlaysController,
        getPreviewExportSize,
        deriveTransparencyController: deriveExportPreviewTransparencyController,
        syncWrapTransparencyController: syncExportPreviewWrapTransparencyController,
        computeDimensionsController: computeExportPreviewDimensionsController,
        syncTargetSizeController: syncExportPreviewTargetSizeController,
        ensureRenderTargetController: ensureExportPreviewRenderTargetController,
        ensurePreviewCameraController: ensureAndConfigureExportPreviewCameraController,
        readExportPreviewImageDataController,
        commitCanvasImageController: commitExportPreviewCanvasImageController,
        drawCropOverlayController: drawExportPreviewCropOverlayController,
        applyExportSceneForRender,
        createRenderTarget: (w, h) => new THREE.WebGLRenderTarget(w, h, {
            samples: renderer.capabilities.isWebGL2 ? 4 : 0,
        }),
        createPerspectiveCamera: () => new THREE.PerspectiveCamera(45, 1, 0.01, 1e6),
        srgbColorSpace: THREE.SRGBColorSpace,
        getPreviewElement,
        getTransparentElements,
        devicePixelRatio,
    });
}
