import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { GIFEncoder, quantize, applyPalette, nearestColorIndex } from 'gifenc';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import JSZip from 'jszip';
import * as ShadeSystem from './modules/shade-system.js';
import {
    closeModelPartActionMenus as closeModelPartActionMenusModule,
    positionModelPartActionMenu as positionModelPartActionMenuModule,
} from './modules/model-part-action-menus.js';
import {
    createOrbitFrameStateStore,
    getOrbitFrameStateFast as getOrbitFrameStateFastModule,
    getOrbitFrameState as getOrbitFrameStateModule,
    setCameraFromOrbitState as setCameraFromOrbitStateModule,
} from './modules/orbit-frame-state.js';
import {
    createViewportPerformanceState,
    getViewportPixelRatio as getViewportPixelRatioModule,
    updateViewportPerformanceState as updateViewportPerformanceStateModule,
} from './modules/viewport-performance.js';
import {
    closeModelPartSelectorMenuController,
    resetSyncMenuFloatingStyleController,
    positionSyncMenuAtAnchorController,
    resolveModelSyncAnchorController,
    openSyncSourceMenuController,
    closeThumbSelectMenusByModeController,
    shouldCloseFloatingModelSelectorOnSingleClickController,
} from './modules/model-picker-controller.js';
import {
    isModelPartFloatingCardOpenController,
    shouldUseFloatingModelPartSelectorController,
    ensureModelPartFloatingHeaderController,
    clampModelPartSelectorMenuPositionController,
    setModelPartSelectorMenuPositionController,
    restoreModelPartSelectorMenuPositionController,
    positionFloatingModelPartSelectorMenuController,
    initializeModelPartSelectorMenuDragController,
} from './modules/model-picker-floating.js';
import {
    createMultipartPersistScheduler,
    createDeferredCommitQueue,
    createRafPreviewScheduler,
} from './modules/model-edit-commit.js';
import {
    createSettingsUrlSyncController,
} from './modules/settings-url-sync.js';
import {
    createUploadActionController,
    normalizeUploadAction,
} from './modules/upload-action-controller.js';
import {
    createUploadChoiceUiController,
} from './modules/upload-choice-ui.js';
import {
    createCollapsedExportConfirmController,
} from './modules/export-collapsed-confirm.js';
import {
    renderCollapsedExportSummaryController,
} from './modules/export-collapsed-summary.js';
import {
    syncTransparentCheckboxesController,
} from './modules/export-transparency-sync.js';
import {
    persistExportPanelCollapsedStateController,
    restoreExportPanelCollapsedStateController,
    handleExportPanelToggleController,
} from './modules/export-panel-state.js';
import {
    getRotationTimeSecondsByIndexController,
    getExportFormatForDurationLabelsController,
    getRotationFrameCountForSecondsController,
    formatRotationTimeOptionLabelController,
    refreshExportMotionSpeedOptionLabelsController,
} from './modules/export-motion-labels.js';
import {
    updateExportEstimateController,
} from './modules/export-estimate.js';
import {
    updateExportActionLabelsController,
    syncExportFormatTabsController,
    applyExportFormatController,
    bindExportFormatTabHandlersController,
    bindExportFormatSelectChangeHandlersController,
} from './modules/export-format-sync.js';
import {
    bindExportPreviewDetailsToggleController,
} from './modules/export-preview-details.js';
import {
    createDesktopV2RailLayoutController,
} from './modules/desktop-v2-rail-layout.js';
import {
    isExportPreviewActiveController,
} from './modules/export-preview-activity.js';
import {
    applyExportSceneForRenderController,
} from './modules/export-preview-scene-state.js';
import {
    evaluateExportPreviewTimingController,
} from './modules/export-preview-timing.js';
import {
    runUpdateExportPreviewRuntimeController,
    refreshExportPreviewNowRuntimeController,
} from './modules/export-preview-runtime.js';
import {
    createExportPanelDragController,
} from './modules/export-panel-drag.js';
import {
    createExportWorkspaceRuntimeController,
} from './modules/export-workspace-runtime.js';
import {
    createExportCropUiController,
} from './modules/export-crop-ui.js';
import {
    createCropDimensionsDockController,
} from './modules/crop-dimensions-dock.js';
import {
    createExportProgressOverlayController,
} from './modules/export-progress-overlay.js';
import {
    createExportStatusController,
} from './modules/export-status.js';
import {
    createExportBusyStateController,
} from './modules/export-busy-state.js';
import {
    createExportProgressTimingController,
} from './modules/export-progress-timing.js';
import {
    createExportDownloadController,
} from './modules/export-download.js';
import {
    createExportFilenameController,
} from './modules/export-filename.js';
import {
    createExportGifRuntimeController,
} from './modules/export-gif-runtime.js';
import {
    createExportMp4PreflightController,
} from './modules/export-mp4-preflight.js';
import {
    createExportMp4EncoderQueueController,
} from './modules/export-mp4-encoder-queue.js';
import {
    createExportMp4CodecConfigController,
} from './modules/export-mp4-codec-config.js';
import {
    createExportMp4ScenePrepController,
} from './modules/export-mp4-scene-prep.js';
import {
    createExportMp4RuntimeController,
} from './modules/export-mp4-runtime.js';
import {
    createRightPanLockController,
} from './modules/right-pan-lock.js';

// Paste any Rotater URL here to use it as the default settings for first-time visitors
const DEFAULT_SETTINGS_URL = 'https://dreisdesign.github.io/mindcubby/3d/apps/rotater/?c=b4aed6&b=8d8ab7&mf=standard&rm=spin&sp=2&tr=360&wsr=360&sd=1&gl=1&ef=gif&eq=std&ed=square&et=0&gd=0&jq=90&tto=1&tl=120&tc=100&thi=100&ts=50&tsa=180&tsh=130&tpr=62&tpe=40&tcr=88&tce=10&ecd=106.4679&ece=0.0000&rv=1&rg=1&aba=1&abp=modelcolor&bpr=modelcolor&bpab=1';
const SKIP_DEFAULT_PRESET_ONCE_KEY = 'rotater_skipDefaultPresetOnce';
const CANVAS_ORBIT_CLICK_DRAG_THRESHOLD_PX = 6;

// ── Defaults ─────────────────────────────────────────────────────────────────
// Export quality presets — base short-edge size + fps + bitrate.
// GIF/MP4 remain square; still images can use common aspect presets.
const QUALITY_PRESETS = {
    web: { size: 480, fps: 15, bitrate: 4_000_000 },
    std: { size: 1080, fps: 24, bitrate: 8_000_000 },
    high: { size: 2048, fps: 30, bitrate: 16_000_000 },
};

const IMPORT_STL_LIMITS = {
    maxFileCount: 120,
    maxSingleFileBytes: 96 * 1024 * 1024,
    maxTotalBytes: 220 * 1024 * 1024,
    maxTrianglesPerFile: 2_500_000,
    maxTrianglesTotal: 8_000_000,
};

const EXPORT_GUARD_LIMITS = {
    maxFps: 60,
    maxWidth: 4096,
    maxHeight: 4096,
    maxPixelsPerFrame: 8_500_000,
    maxFramesPerJob: 1800,
    maxPixelFramesPerJob: {
        default: 1_000_000_000,
        capture: 1_400_000_000,
        gif: 1_200_000_000,
        mp4: 2_800_000_000,
    },
};

const STL_PARSE_WORKER_TIMEOUT_BASE_MS = 20_000;
const STL_PARSE_WORKER_TIMEOUT_PER_MB = 350;
const STL_PARSE_WORKER_TIMEOUT_MAX_MS = 90_000;

const IMAGE_DIMENSION_PRESETS = {
    square: { w: 1, h: 1, tag: '1x1' },
    portrait12: { w: 1, h: 2, tag: '1x2' },
    landscape43: { w: 4, h: 3, tag: '4x3' },
    landscape21: { w: 2, h: 1, tag: '2x1' },
};

function getSelectedExportDimensionsId() {
    return document.querySelector('input[name="exportDimensions"]:checked')?.value ?? 'square';
}

function setSelectedExportDimensionsId(id) {
    if (!IMAGE_DIMENSION_PRESETS[id]) id = 'square';
    const target = document.querySelector(`input[name="exportDimensions"][value="${id}"]`);
    if (target) {
        target.checked = true;
        return;
    }
    const fallback = document.querySelector('input[name="exportDimensions"][value="square"]');
    if (fallback) fallback.checked = true;
}

function getImageDimensionPreset() {
    const id = getSelectedExportDimensionsId();
    if (IMAGE_DIMENSION_PRESETS[id]) return { id, ...IMAGE_DIMENSION_PRESETS[id] };
    return { id: 'square', ...IMAGE_DIMENSION_PRESETS.square };
}

// Returns the preset id whose aspect ratio (w/h) is nearest to the given aspect,
// using log-scale distance so e.g. 0.5 and 2.0 are equidistant from 1.0.
function nearestDimensionPreset(aspect) {
    let bestId = 'square', bestDist = Infinity;
    for (const [id, p] of Object.entries(IMAGE_DIMENSION_PRESETS)) {
        const dist = Math.abs(Math.log(aspect / (p.w / p.h)));
        if (dist < bestDist) { bestDist = dist; bestId = id; }
    }
    return bestId;
}

function getImageExportSize() {
    const v = document.getElementById('exportQuality')?.value ?? 'std';
    const p = QUALITY_PRESETS[v] ?? QUALITY_PRESETS.std;
    const shortEdge = p.size;
    const preset = getImageDimensionPreset();

    let width = shortEdge;
    let height = shortEdge;
    if (preset.w >= preset.h) {
        height = shortEdge;
        width = Math.round((shortEdge * preset.w) / preset.h);
    } else {
        width = shortEdge;
        height = Math.round((shortEdge * preset.h) / preset.w);
    }

    // Prefer even dimensions for codec and pixel-grid consistency.
    if (width % 2 !== 0) width += 1;
    if (height % 2 !== 0) height += 1;

    return { width, height, presetId: preset.id, presetTag: preset.tag };
}

function getGeometryTriangleCount(geo) {
    if (!geo) return 0;
    if (geo.index?.count) return Math.floor(geo.index.count / 3);
    const posCount = geo.attributes?.position?.count || 0;
    return Math.floor(posCount / 3);
}

function estimateBinaryStlTriangleCount(buffer) {
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 84) return null;
    try {
        const dv = new DataView(buffer);
        const declaredTriangles = dv.getUint32(80, true);
        const expectedBytes = 84 + (declaredTriangles * 50);
        if (expectedBytes === buffer.byteLength) return declaredTriangles;
    } catch (_) { }
    return null;
}

function validateIncomingStlFileBatch(files, contextLabel = 'Upload') {
    const list = Array.from(files || []).filter((f) => /\.stl$/i.test(f?.name || ''));
    if (!list.length) return;
    if (list.length > IMPORT_STL_LIMITS.maxFileCount) {
        throw new Error(`${contextLabel}: too many STL files. Max ${IMPORT_STL_LIMITS.maxFileCount}.`);
    }

    let totalBytes = 0;
    for (const file of list) {
        const size = Number(file?.size) || 0;
        if (size > IMPORT_STL_LIMITS.maxSingleFileBytes) {
            throw new Error(`${contextLabel}: "${file.name}" is too large. Max 96 MB per STL.`);
        }
        totalBytes += size;
    }

    if (totalBytes > IMPORT_STL_LIMITS.maxTotalBytes) {
        throw new Error(`${contextLabel}: total STL upload size is too large. Max 220 MB.`);
    }
}

function validateStlBufferFast(name, buffer) {
    const size = Number(buffer?.byteLength) || 0;
    if (size <= 0) throw new Error(`"${name}" is empty or invalid.`);
    if (size > IMPORT_STL_LIMITS.maxSingleFileBytes) {
        throw new Error(`"${name}" is too large. Max 96 MB per STL.`);
    }

    const estimatedTriangles = estimateBinaryStlTriangleCount(buffer);
    if (Number.isFinite(estimatedTriangles) && estimatedTriangles > IMPORT_STL_LIMITS.maxTrianglesPerFile) {
        throw new Error(`"${name}" exceeds triangle limit (${IMPORT_STL_LIMITS.maxTrianglesPerFile.toLocaleString()}).`);
    }
}

function validateGeometryTriangleBudget(geo, label = 'STL') {
    const triCount = getGeometryTriangleCount(geo);
    if (!Number.isFinite(triCount) || triCount < 1) {
        throw new Error(`"${label}" has invalid geometry.`);
    }
    if (triCount > IMPORT_STL_LIMITS.maxTrianglesPerFile) {
        throw new Error(`"${label}" exceeds triangle limit (${IMPORT_STL_LIMITS.maxTrianglesPerFile.toLocaleString()}).`);
    }
    return triCount;
}

function getExportCapabilityMultiplier() {
    let mul = 1;

    const deviceMemory = Number(globalThis?.navigator?.deviceMemory);
    if (Number.isFinite(deviceMemory)) {
        if (deviceMemory <= 4) mul *= 0.82;
        else if (deviceMemory >= 16) mul *= 1.22;
        else if (deviceMemory >= 8) mul *= 1.10;
    }

    const cores = Number(globalThis?.navigator?.hardwareConcurrency);
    if (Number.isFinite(cores)) {
        if (cores <= 4) mul *= 0.88;
        else if (cores >= 12) mul *= 1.16;
        else if (cores >= 8) mul *= 1.08;
    }

    const ua = String(globalThis?.navigator?.userAgent || '').toLowerCase();
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium') && !ua.includes('crios');
    if (isSafari) mul *= 0.96;

    return Math.max(0.7, Math.min(1.45, mul));
}

function validateExportWorkload({ format = 'export', width = 0, height = 0, fps = 1, frames = 1, allowUnsafeWorkload = false } = {}) {
    const safeW = Math.max(1, Math.floor(width));
    const safeH = Math.max(1, Math.floor(height));
    const safeFps = Math.max(1, Math.floor(fps));
    const safeFrames = Math.max(1, Math.floor(frames));
    const pixelsPerFrame = safeW * safeH;
    const pixelFrames = pixelsPerFrame * safeFrames;
    const formatKey = String(format || '').toLowerCase();
    const maxPixelFramesForFormat = Number(
        EXPORT_GUARD_LIMITS.maxPixelFramesPerJob[formatKey]
        ?? EXPORT_GUARD_LIMITS.maxPixelFramesPerJob.default
    ) || EXPORT_GUARD_LIMITS.maxPixelFramesPerJob.default;
    const adaptiveLimit = Math.max(300_000_000, Math.round(maxPixelFramesForFormat * getExportCapabilityMultiplier()));

    if (safeW > EXPORT_GUARD_LIMITS.maxWidth || safeH > EXPORT_GUARD_LIMITS.maxHeight) {
        throw new Error(`${format.toUpperCase()} export is too large. Max ${EXPORT_GUARD_LIMITS.maxWidth}x${EXPORT_GUARD_LIMITS.maxHeight}.`);
    }
    if (pixelsPerFrame > EXPORT_GUARD_LIMITS.maxPixelsPerFrame) {
        throw new Error(`${format.toUpperCase()} frame resolution is too high.`);
    }
    if (safeFps > EXPORT_GUARD_LIMITS.maxFps) {
        throw new Error(`${format.toUpperCase()} FPS is too high.`);
    }
    if (safeFrames > EXPORT_GUARD_LIMITS.maxFramesPerJob) {
        throw new Error(`${format.toUpperCase()} frame count is too high.`);
    }
    if (pixelFrames > adaptiveLimit) {
        const maxMegaPixels = Math.round(adaptiveLimit / 1_000_000);
        const warning = `${format.toUpperCase()} export is very large and may take a while in your browser. For faster export, use Medium quality or a wider aspect ratio. (Limit: ~${maxMegaPixels} MPx-frames)`;
        if (allowUnsafeWorkload) {
            return {
                warning,
                adaptiveLimit,
                pixelFrames,
            };
        }
        throw new Error(warning);
    }
    return null;
}

function getStlParseTimeoutMs(items) {
    const totalBytes = Array.from(items || []).reduce((sum, item) => sum + (Number(item?.buffer?.byteLength) || 0), 0);
    const totalMb = totalBytes / (1024 * 1024);
    return Math.max(
        STL_PARSE_WORKER_TIMEOUT_BASE_MS,
        Math.min(STL_PARSE_WORKER_TIMEOUT_MAX_MS, Math.round(STL_PARSE_WORKER_TIMEOUT_BASE_MS + (totalMb * STL_PARSE_WORKER_TIMEOUT_PER_MB)))
    );
}

function createVector3FromPlain(value) {
    return new THREE.Vector3(Number(value?.x) || 0, Number(value?.y) || 0, Number(value?.z) || 0);
}

function createBox3FromPlain(value) {
    return new THREE.Box3(createVector3FromPlain(value?.min), createVector3FromPlain(value?.max));
}

function rebuildGeometryFromSerialized(payload) {
    const geo = new THREE.BufferGeometry();
    const positionArray = payload?.position instanceof Float32Array
        ? payload.position
        : new Float32Array(payload?.position || []);
    geo.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));

    if (payload?.normal) {
        const normalArray = payload.normal instanceof Float32Array
            ? payload.normal
            : new Float32Array(payload.normal);
        geo.setAttribute('normal', new THREE.BufferAttribute(normalArray, 3));
    }

    if (payload?.index) {
        const indexArray = payload.indexType === 'Uint32Array'
            ? (payload.index instanceof Uint32Array ? payload.index : new Uint32Array(payload.index))
            : (payload.index instanceof Uint16Array ? payload.index : new Uint16Array(payload.index));
        geo.setIndex(new THREE.BufferAttribute(indexArray, 1));
    }

    geo.boundingBox = payload?.boundingBox ? createBox3FromPlain(payload.boundingBox) : null;
    if (!geo.boundingBox) geo.computeBoundingBox();
    return geo;
}

async function parseStlItemsWithWorker(items, mode = 'single') {
    if (typeof Worker === 'undefined') return null;

    let worker = null;
    try {
        worker = new Worker(new URL('./modules/stl-parse-worker.js', import.meta.url), { type: 'module' });
    } catch (error) {
        if (DEV_LOG) console.warn('[rotater] STL worker unavailable, falling back to main thread.', error);
        return null;
    }

    const timeoutMs = getStlParseTimeoutMs(items);
    const requestId = `stl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const limits = {
        maxTrianglesPerFile: IMPORT_STL_LIMITS.maxTrianglesPerFile,
        maxTrianglesTotal: IMPORT_STL_LIMITS.maxTrianglesTotal,
    };

    return await new Promise((resolve, reject) => {
            const cleanup = () => {
                clearTimeout(timeoutId);
                worker.removeEventListener('message', onMessage);
                worker.removeEventListener('error', onError);
                worker.terminate();
            };

            const onMessage = (event) => {
                const data = event.data || {};
                if (data.id !== requestId) return;
                cleanup();
                if (!data.ok) {
                    reject(new Error(data.error || 'STL worker failed.'));
                    return;
                }
                resolve(data.payload || null);
            };

            const onError = () => {
                cleanup();
                resolve(null);
            };

            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('STL parsing timed out.'));
            }, timeoutMs);

            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            try {
                worker.postMessage({ id: requestId, mode, items, limits });
            } catch (error) {
                cleanup();
                if (DEV_LOG) console.warn('[rotater] STL worker postMessage failed, falling back to main thread.', error);
                resolve(null);
            }
        });
}

async function parseSingleStlGeometry(buffer, name) {
    const workerPayload = await parseStlItemsWithWorker([{ name, buffer }], 'single');
    if (workerPayload?.kind === 'single' && workerPayload.geometry) {
        return rebuildGeometryFromSerialized(workerPayload.geometry);
    }

    const geo = new STLLoader().parse(buffer);
    validateGeometryTriangleBudget(geo, name);
    geo.computeBoundingBox();
    const center = new THREE.Vector3();
    geo.boundingBox?.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    return geo;
}

async function parseMultipartStlGeometries(buffers, names) {
    const workerPayload = await parseStlItemsWithWorker(
        buffers.map((buffer, idx) => ({ name: names?.[idx] || `Part ${idx + 1}`, buffer })),
        'multi'
    );

    if (workerPayload?.kind === 'multi' && Array.isArray(workerPayload.geometries)) {
        return {
            geometries: workerPayload.geometries.map((geo) => rebuildGeometryFromSerialized(geo)),
            partBounds: workerPayload.partBounds.map((entry) => ({
                center: createVector3FromPlain(entry?.center),
                radius: Math.max(0.001, Number(entry?.radius) || 0.001),
            })),
            partDimensions: workerPayload.partDimensions.map((entry) => ({
                w: Number(entry?.w) || 0,
                d: Number(entry?.d) || 0,
                h: Number(entry?.h) || 0,
            })),
            partBoxes: workerPayload.partBoxes.map((entry) => createBox3FromPlain(entry)),
        };
    }

    const parsed = [];
    const unionBox = new THREE.Box3();
    const loader = new STLLoader();
    let totalTriangles = 0;
    for (const buffer of buffers) {
        const geo = loader.parse(buffer);
        const label = names?.[parsed.length] || `Part ${parsed.length + 1}`;
        const partTriangles = validateGeometryTriangleBudget(geo, label);
        totalTriangles += partTriangles;
        if (totalTriangles > IMPORT_STL_LIMITS.maxTrianglesTotal) {
            geo.dispose?.();
            parsed.forEach((g) => g?.dispose?.());
            throw new Error(`Multipart triangle budget exceeded (${IMPORT_STL_LIMITS.maxTrianglesTotal.toLocaleString()}).`);
        }
        geo.computeBoundingBox();
        if (geo.boundingBox) unionBox.union(geo.boundingBox);
        parsed.push(geo);
    }

    const center = unionBox.getCenter(new THREE.Vector3());
    const partBounds = [];
    const partDimensions = [];
    const partBoxes = [];
    for (const geo of parsed) {
        geo.translate(-center.x, -center.y, -center.z);
        geo.computeBoundingBox();
        const box = geo.boundingBox;
        if (box) {
            const boundsCenter = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            partBounds.push({ center: boundsCenter, radius: Math.max(size.length() * 0.5, 0.001) });
            partDimensions.push({ w: size.x, d: size.y, h: size.z });
            partBoxes.push(box.clone());
        } else {
            partBounds.push({ center: new THREE.Vector3(0, 0, 0), radius: Math.max(0.001, modelRadius || 1) });
            partDimensions.push({ w: 0, d: 0, h: 0 });
            partBoxes.push(new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)));
        }
        geo.computeVertexNormals();
    }

    return { geometries: parsed, partBounds, partDimensions, partBoxes };
}

function getPreviewExportSize(_fmt) {
    // All formats now support aspect presets — always delegate to getImageExportSize().
    return getImageExportSize();
}

const EXPORT = {
    get gif() {
        const v = document.getElementById('exportQuality')?.value ?? 'std';
        const p = QUALITY_PRESETS[v] ?? QUALITY_PRESETS.std;
        return {
            size: p.size,
            fps: getEffectiveExportFps(p.fps),
            loop: document.getElementById('gifLoop')?.checked ?? true,
            dither: document.getElementById('gifDither')?.checked ?? false,
        };
    },
    get mp4() {
        const v = document.getElementById('exportQuality')?.value ?? 'std';
        const p = QUALITY_PRESETS[v] ?? QUALITY_PRESETS.std;
        return {
            size: p.size,
            fps: getEffectiveExportFps(p.fps),
            bitrate: p.bitrate,
            loops: 0, // single play
        };
    },
    get image() {
        const { width, height, presetId, presetTag } = getImageExportSize();
        return {
                quality: parseInt(document.getElementById('jpegQuality')?.value ?? 90, 10) / 100,
            width,
            height,
            presetId,
            presetTag,
        };
    },
};
const BASE_ROTATE_SPEED = 1; // Keep timing 1:1 with the selected seconds-per-revolution setting
const SPEED_SECONDS_PER_REV = [5, 10, 15, 20, 25, 30];
const SPEED_DEFAULT = 2; // 15 seconds per full rotation
function getSecondsPerRevolution() {
    return SPEED_SECONDS_PER_REV[parseInt(speedSlider?.value ?? String(SPEED_DEFAULT), 10)] ?? SPEED_SECONDS_PER_REV[SPEED_DEFAULT];
}

// Keep fast 5s rotations smooth in exports by raising capture FPS when needed.
function getEffectiveExportFps(baseFps) {
    const secs = Math.max(1, getSecondsPerRevolution());
    const targetMaxDegreesPerFrame = 2.4;
    const minSmoothFps = Math.ceil(360 / (targetMaxDegreesPerFrame * secs));
    return Math.max(baseFps, Math.min(EXPORT_GUARD_LIMITS.maxFps, minSmoothFps));
}

function getEffectiveExportFpsForSeconds(baseFps, secondsPerRev) {
    const secs = Math.max(1, Number(secondsPerRev) || 1);
    const targetMaxDegreesPerFrame = 2.4;
    const minSmoothFps = Math.ceil(360 / (targetMaxDegreesPerFrame * secs));
    return Math.max(baseFps, Math.min(EXPORT_GUARD_LIMITS.maxFps, minSmoothFps));
}

function getSpeed() { return 60 / getSecondsPerRevolution(); }
const TILT_RANGE_DEFAULT = 20;
const SPIN_RANGE_DEFAULT = 360;
const WOBBLE_SPIN_RANGE_DEFAULT = 360;
const ELEV_DEFAULT = 0; // Used by placeCamera() and fitToFrame() for default camera elevation
const CROP_FRAME_UI_SCALE = 0.82; // Keeps a visual margin around the crop guide
const VIEWPORT_FIT_SCALE = 1.55; // Smaller than 1.8 so default/reset framing is less zoomed out
const VIEWPORT_AA_SCALE = 1.0; // Prioritize realtime smoothness in the main viewport
const VIEWPORT_PIXEL_RATIO_MIN = 1;
const VIEWPORT_PIXEL_RATIO_MAX = 1.6;
const BUILD_PLATE_TEXTURES_ENABLED = false; // Flat plate avoids extra texture work in dense multipart scenes
const AUTO_LOAD_BENCHY_ON_IDLE = true;
const AUTO_LOAD_BENCHY_IDLE_TIMEOUT_MS = 1200;
const ORBIT_MIN_DISTANCE_FACTOR = 0.12;
const ORBIT_MAX_DISTANCE_FACTOR = 6.0;
const LIGHT_BASE = { ambient: 0.45, key: 1.9, fill: 0.30, rim: 0.92, exposure: 0.75 };
const BUILD_PLATE_DEFAULTS = {
    shade: 0,
    finish: 'satin',
    shape: 'rectangle',
    sizePreset: '220x220',
    width: 220,
    depth: 220,
};
const PALETTE = {
    fallback: '#ffffff',
    text: {
        partThumb: '#1f1a47',
        measurement: '#15122b',
    },
    preset: {
        white: '#ffffff',
        black: '#0f0f0f',
        bgThumb: '#d0d0d0',
        ink: '#0d0d0d',
        ceramic: '#fef8f0',
        glassBorder: 'rgba(130,210,240,0.55)',
        chocolate: '#3a1c06',
        gumball: '#ff8fb5',
        gold: '#f5c400',
        bgBorderLight: '#b8b6ca',
        bgBorderDark: '#5d5a74',
        modelShadeFallback: '#2e2b74',
    },
    gradient: {
        white: '#fff',
        chromeEdge: 'rgba(180,180,180,0.2)',
        chromeShadow: 'rgba(0,0,0,0.7)',
        inkHighlight: 'rgba(255,255,255,0.9)',
        inkSoft: 'rgba(255,255,255,0.35)',
        inkEdge: 'rgba(255,255,255,0.04)',
        ceramicHighlight: 'rgba(255,255,255,0.75)',
        ceramicSoft: 'rgba(255,255,255,0.35)',
        ceramicWarm1: 'rgba(230,210,190,0.25)',
        ceramicWarm2: 'rgba(190,165,140,0.45)',
        glassHighlight: 'rgba(255,255,255,0.6)',
        glassTint: 'rgba(200,242,255,0.15)',
        glassTint2: 'rgba(200,242,255,0.3)',
        glassTint3: 'rgba(100,200,240,0.08)',
        chocolateHighlight: 'rgba(180,110,50,0.55)',
        chocolateSoft: 'rgba(120,65,20,0.25)',
        gumballHighlight: 'rgba(255,255,255,0.78)',
        gumballSoft: 'rgba(255,230,240,0.45)',
        gumballShadow: 'rgba(210,60,110,0.28)',
        goldHighlight: 'rgba(255,255,220,0.95)',
        goldSoft: 'rgba(255,235,100,0.6)',
        goldShadow: 'rgba(240,190,0,0.2)',
        goldDeep: 'rgba(140,90,0,0.75)',
        rainbow1: '#FF0909',
        rainbow2: '#FF9D00',
        rainbow3: '#FFF718',
        rainbow4: '#84FF00',
        rainbow5: '#8C00FF',
    },
};
const TEXTURE_TUNE_DEFAULTS = {
    light: 120,
    contrast: 100,
    highlights: 100,
    shadows: 50,
    shadowAzimuth: 180,
    shadowHeight: 130,
    metallicRoughness: 30,
    metallicMetalness: 65,
    metallicReflection: 100,
    phongRoughness: 62,
    phongReflection: 40,
    matteRoughness: 88,
    matteReflection: 10,
    lightLock: true,
};

const BUILD_PLATE_SIZE_PRESETS = {
    '180x180': { w: 180, d: 180 },
    '220x220': { w: 220, d: 220 },
    '235x235': { w: 235, d: 235 },
    '256x256': { w: 256, d: 256 },
    '300x300': { w: 300, d: 300 },
};

// Returns frame count for one cycle using the selected Rotation Time
function exportFrames(fps = EXPORT.gif.fps) {
    const secsPerRev = getSecondsPerRevolution();
    return Math.max(1, Math.round(fps * secsPerRev));
}

function getRotationTimeSecondsByIndex(index) {
    return getRotationTimeSecondsByIndexController(index, {
        speedSecondsPerRev: SPEED_SECONDS_PER_REV,
        speedDefault: SPEED_DEFAULT,
    });
}

function getExportFormatForDurationLabels(format = exportFormatEl?.value || 'gif') {
    return getExportFormatForDurationLabelsController(format);
}

function getRotationFrameCountForSeconds(seconds, format = 'gif') {
    return getRotationFrameCountForSecondsController(seconds, format, {
        getExportQualityValue: () => document.getElementById('exportQuality')?.value ?? 'std',
        qualityPresets: QUALITY_PRESETS,
        getEffectiveExportFpsForSeconds: (baseFps, secs) => getEffectiveExportFpsForSeconds(baseFps, secs),
    });
}

function formatRotationTimeOptionLabel(index, format = 'gif') {
    return formatRotationTimeOptionLabelController(index, format, {
        getRotationTimeSecondsByIndex,
        getRotationFrameCountForSeconds,
    });
}

function refreshExportMotionSpeedOptionLabels(format = exportFormatEl?.value || 'gif') {
    refreshExportMotionSpeedOptionLabelsController(format, {
        exportMotionSpeedEl,
        getExportFormatForDurationLabels,
        formatRotationTimeOptionLabel,
    });
}

function updateEstimate() {
    updateExportEstimateController({
        refreshExportMotionSpeedOptionLabels,
        btnGif,
        btnVideo,
        getExportFrames: exportFrames,
        exportGifFps: EXPORT.gif.fps,
        exportMp4Fps: EXPORT.mp4.fps,
        getImageExportSize,
        exportImageQuality: EXPORT.image.quality,
        gifEstEl: document.getElementById('gifEst'),
        mp4EstEl: document.getElementById('mp4Est'),
        imgEstPngEl: document.getElementById('imgEstPng'),
        imgEstJpgEl: document.getElementById('imgEstJpg'),
    });
}

// ── DOM ───────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('fileInput');
const btnUploadStlPrimary = document.getElementById('btnUploadStlPrimary');
const btnUploadStlCanvas = document.getElementById('btnUploadStlCanvas');
const btnUploadStlSidebar = document.getElementById('btnUploadStlSidebar');
const dropZone = document.getElementById('dropZone');
const viewerSec = document.getElementById('viewerSection');
const colorPick = document.getElementById('colorPicker');
const opacitySlider = document.getElementById('opacitySlider');
const opacityVal = document.getElementById('opacityVal');
const quickPresetsBar = document.getElementById('quickPresetsBar');
const modelCardSliders = document.querySelector('#modelBox .model-sliders');
const modelPartThumbsWrap = document.getElementById('modelPartThumbsWrap');
const modelPartSelectorEl = document.getElementById('modelPartSelector');
const modelPartSelectorBtn = document.getElementById('modelPartSelectorBtn');
const modelPartSelectorMenu = document.getElementById('modelPartSelectorMenu');
const modelPartSelectorThumb = document.getElementById('modelPartSelectorThumb');
const modelPartSelectorText = document.getElementById('modelPartSelectorText');
const modelPartSingleMenuRow = document.getElementById('modelPartSingleMenuRow');
const modelPartSingleMenuBtn = document.getElementById('modelPartSingleMenuBtn');
const modelPartSingleActions = document.getElementById('modelPartSingleActions');
const modelPartAddNextBtn = document.getElementById('modelPartAddNextBtn');
const bgModelSyncSourceWrap = document.getElementById('bgModelSyncSourceWrap');
const bgModelSyncSelectorBtn = document.getElementById('bgModelSyncSelectorBtn');
const bgModelSyncSelectorMenu = document.getElementById('bgModelSyncSelectorMenu');
const bgModelSyncSelectorThumb = document.getElementById('bgModelSyncSelectorThumb');
const bgModelSyncSelectorText = document.getElementById('bgModelSyncSelectorText');
const buildPlateModelSyncSourceWrap = document.getElementById('buildPlateModelSyncSourceWrap');
const buildPlateModelSyncSelectorBtn = document.getElementById('buildPlateModelSyncSelectorBtn');
const buildPlateModelSyncSelectorMenu = document.getElementById('buildPlateModelSyncSelectorMenu');
const buildPlateModelSyncSelectorThumb = document.getElementById('buildPlateModelSyncSelectorThumb');
const buildPlateModelSyncSelectorText = document.getElementById('buildPlateModelSyncSelectorText');
const btnInspectMode = document.getElementById('btnInspectMode');
const bgPick = document.getElementById('bgPicker');
const bgOpacitySlider = document.getElementById('bgOpacitySlider');
const bgOpacitySliderLabel = bgOpacitySlider?.closest('.control-label');
const buildPlateToggleEl = document.getElementById('buildPlateToggle');
const buildPlateControlsEl = document.getElementById('buildPlateControls');
const buildPlateConfigBodyEl = document.getElementById('buildPlateConfigBody');
const buildPlateColorPickerEl = document.getElementById('buildPlateColorPicker');
const buildPlateAutoBrightnessEl = document.getElementById('buildPlateAutoBrightness');
const buildPlateShadeSliderEl = document.getElementById('buildPlateShadeSlider');
const buildPlateShadeRowEl = buildPlateShadeSliderEl?.closest('.control-label');
const buildPlateShadeValEl = document.getElementById('buildPlateShadeVal');
const buildPlateFinishWrapEl = document.getElementById('buildPlateFinishWrap');
const buildPlateShapeWrapEl = document.getElementById('buildPlateShapeWrap');
const shadingEl = document.getElementById('shadingSelect');
const speedSlider = document.getElementById('speedSlider');

const btnGif = document.getElementById('btnExportGif');
const btnVideo = document.getElementById('btnExportVideo');
const btnPng = document.getElementById('btnExportPng');
const btnExportLabel = document.getElementById('btnExportLabel');
const exportFormatEl = document.getElementById('exportFormat');
const exportMiniFormatEl = document.getElementById('exportMiniFormat');
const exportFormatCollapsedEl = document.getElementById('exportFormatCollapsed');
const exportFormatTabEls = Array.from(document.querySelectorAll('[data-export-format-tab]'));
const exportPanelEl = document.querySelector('.export-modal-panel');
const exportPanelHeaderEl = exportPanelEl?.querySelector('.settings-panel-header') || null;
const exportPanelBodyEl = document.getElementById('exportPanelBody');
const btnToggleExportPanel = document.getElementById('btnToggleExportPanel');
const exportPanelCollapsedBarEl = document.getElementById('exportPanelCollapsedBar');
const btnExportCollapsedLabel = document.getElementById('btnExportCollapsedLabel');
const exportQualitySliderEl = document.getElementById('exportQualitySlider');
const exportQualityValEl = document.getElementById('exportQualityVal');
const exportGridEl = document.getElementById('exportGrid');
const exportBuildPlateEl = document.getElementById('exportBuildPlate');
const exportBgColorEl = document.getElementById('exportBgColor');
const exportDimensionInputs = Array.from(document.querySelectorAll('input[name="exportDimensions"]'));
const cropDimensionsDock = document.getElementById('cropDimensionsDock');
const statusEl = document.getElementById('exportStatus');
const animStatusEl = document.getElementById('exportStatusAnim');
const fileNameEl = document.getElementById('fileName');
const fileChipEl = document.getElementById('fileChip');
const fileChipPartsMenu = document.getElementById('fileChipPartsMenu');
const btnFileChipExpand = document.getElementById('btnFileChipExpand');
const partReplaceInput = document.getElementById('partReplaceInput');
const partAppendInput = document.getElementById('partAppendInput');
const uploadChoiceOverlayEl = document.getElementById('uploadChoiceOverlay');
const uploadChoiceTextEl = document.getElementById('uploadChoiceText');
const uploadChoiceDropZoneEl = document.getElementById('uploadChoiceDropZone');
const uploadChoiceDecisionEl = document.getElementById('uploadChoiceDecision');
const uploadChoiceActionsRightEl = document.getElementById('uploadChoiceActionsRight');
const uploadChoiceFileListWrapEl = document.getElementById('uploadChoiceListWrap');
const uploadChoiceFileListEl = document.getElementById('uploadChoiceFileList');
const btnUploadChoiceShowMore = document.getElementById('btnUploadChoiceShowMore');
const btnUploadChoiceClose = document.getElementById('btnUploadChoiceClose');
const btnUploadChoiceCancel = document.getElementById('btnUploadChoiceCancel');
const btnUploadChoiceReplace = document.getElementById('btnUploadChoiceReplace');
const btnUploadChoiceNewPlate = document.getElementById('btnUploadChoiceNewPlate');
const btnDownloadPackage = document.getElementById('btnDownloadPackage');
const exportMotionControlsEl = document.getElementById('exportMotionControls');
const exportMotionModeEl = document.getElementById('exportMotionMode');
const exportMotionSpeedEl = document.getElementById('exportMotionSpeed');
const exportMotionRangeEl = document.getElementById('exportMotionRange');
const exportMotionRangeLabelEl = document.getElementById('exportMotionRangeLabel');
const exportMotionRangeValEl = document.getElementById('exportMotionRangeVal');
const rulerModePickerEl = document.getElementById('rulerModePicker');
const rulerHoverToggleEl = document.getElementById('rulerHoverToggle');
const rulerSelectToggleEl = document.getElementById('rulerSelectToggle');
const showDpadToggleEl = document.getElementById('showDpadToggle');
const devModeToggleEl = document.getElementById('devModeToggle');
const resetWarningsToggleEl = document.getElementById('resetWarningsToggle');
const btnResetEverythingEl = document.getElementById('btnResetEverything');
const btnClearBuildPlateEl = document.getElementById('btnClearBuildPlate');
const btnToggleSidepanelsEl = document.getElementById('btnToggleSidepanels');
const fpsReadoutEl = document.getElementById('fpsReadout');
const exportCollapsedConfirmOverlayEl = document.getElementById('exportCollapsedConfirmOverlay');
const exportCollapsedConfirmSummaryEl = document.getElementById('exportCollapsedConfirmSummary');
const exportCollapsedDontShowEl = document.getElementById('exportCollapsedDontShow');
const btnExportCollapsedConfirmClose = document.getElementById('btnExportCollapsedConfirmClose');
const btnExportCollapsedConfirmCancel = document.getElementById('btnExportCollapsedConfirmCancel');
const btnExportCollapsedConfirmContinue = document.getElementById('btnExportCollapsedConfirmContinue');
const buildPlateSizePresetEl = document.getElementById('buildPlateSizePreset');
const buildPlateCustomSizeRowEl = document.getElementById('buildPlateCustomSizeRow');
const buildPlateCustomWidthEl = document.getElementById('buildPlateCustomWidth');
const buildPlateCustomDepthEl = document.getElementById('buildPlateCustomDepth');
const showDpadToggleModalEl = document.getElementById('showDpadToggle-modal');
const buildPlateSizePresetModalEl = document.getElementById('buildPlateSizePreset-modal');
const buildPlateCustomSizeRowModalEl = document.getElementById('buildPlateCustomSizeRow-modal');
const buildPlateCustomWidthModalEl = document.getElementById('buildPlateCustomWidth-modal');
const buildPlateCustomDepthModalEl = document.getElementById('buildPlateCustomDepth-modal');
const rulerUnitSelectModalEl = document.getElementById('rulerUnitSelect-modal');
const devModeToggleModalEl = document.getElementById('devModeToggle-modal');
const fineTuningCheckModalEl = document.getElementById('fineTuningCheck-modal');
const btnThemeToggleRailModalEl = document.getElementById('btnThemeToggleRail-modal');
const btnPause = document.getElementById('btnPause');
const iconPlayPause = document.getElementById('iconPlayPause');
const iconExportPlayPause = document.getElementById('iconExportPlayPause');
const rotateModeEl = {
    get value() { return document.querySelector('input[name="rotateMode"]:checked')?.value ?? 'spin'; },
    set value(v) { const el = document.querySelector(`input[name="rotateMode"][value="${v}"]`); if (el) el.checked = true; },
    addEventListener(type, fn) { document.querySelectorAll('input[name="rotateMode"]').forEach(el => el.addEventListener(type, fn)); },
};
const tiltRangeSlider = document.getElementById('tiltRangeSlider');
const tiltRangeVal = document.getElementById('tiltRangeVal');
const wobbleSpinRangeSlider = document.getElementById('wobbleSpinRangeSlider');
const wobbleSpinRangeVal = document.getElementById('wobbleSpinRangeVal');
const speedResetBtn = document.getElementById('speedResetBtn');
const tiltRangeResetBtn = document.getElementById('tiltRangeResetBtn');
const wobbleSpinRangeResetBtn = document.getElementById('wobbleSpinRangeResetBtn');
const frameOverlayBtn = document.getElementById('btnFrameOverlay');
const orbitHintBarEl = document.querySelector('.orbit-hint-bar');
const orbitHintTextEl = orbitHintBarEl?.querySelector('.orbit-hint');
const textureTuneBtn = document.getElementById('btnTextureTune');
const textureTuneNewBadge = document.getElementById('textureTuneNewBadge');
const textureTunePanel = document.getElementById('textureTunePanel');
const textureTuneLightSlider = document.getElementById('textureTuneLight');
const textureTuneContrastSlider = document.getElementById('textureTuneContrast');
const textureTuneHighlightsSlider = document.getElementById('textureTuneHighlights');
const textureTuneShadowsSlider = document.getElementById('textureTuneShadows');
const textureTuneLightSourceSlider = document.getElementById('textureTuneLightSource');
const textureTuneLightLockBox = document.getElementById('textureTuneLightLock');
const textureTuneLightHeightSlider = document.getElementById('textureTuneLightHeight');
const textureTuneRoughnessSlider = document.getElementById('textureTuneRoughness');
const textureTuneMetalnessSlider = document.getElementById('textureTuneMetalness');
const finishModeButtons = Array.from(document.querySelectorAll('[data-finish-mode]'));
const textureTuneLightVal = document.getElementById('textureTuneLightVal');
const textureTuneContrastVal = document.getElementById('textureTuneContrastVal');
const textureTuneHighlightsVal = document.getElementById('textureTuneHighlightsVal');
const textureTuneShadowsVal = document.getElementById('textureTuneShadowsVal');
const textureTuneLightSourceVal = document.getElementById('textureTuneLightSourceVal');
const textureTuneLightHeightVal = document.getElementById('textureTuneLightHeightVal');
const textureTuneRoughnessVal = document.getElementById('textureTuneRoughnessVal');
const textureTuneMetalnessVal = document.getElementById('textureTuneMetalnessVal');
const textureTuneContrastRow = document.getElementById('textureTuneContrastRow');
const textureTuneHighlightsRow = document.getElementById('textureTuneHighlightsRow');
const textureTuneShadowRow = document.getElementById('textureTuneShadowRow');
const textureTuneLightSourceRow = document.getElementById('textureTuneLightSourceRow');
const textureTuneLightHeightRow = document.getElementById('textureTuneLightHeightRow');
const textureTuneRoughnessRow = document.getElementById('textureTuneRoughnessRow');
const textureTuneMetalnessRow = document.getElementById('textureTuneMetalnessRow');
const finishControlGroupEl = document.getElementById('finishControlGroup');
const themeToggleRailLabel = document.getElementById('themeToggleRailLabel');
const themeToggleRailIconPath = document.getElementById('themeToggleRailIconPath');
const themeToggleRailLabelModal = document.getElementById('themeToggleRailLabel-modal');
const themeToggleRailIconPathModal = document.getElementById('themeToggleRailIconPath-modal');
const btnResetModelCard = document.getElementById('btnResetModelCard');
const btnResetBackgroundCard = document.getElementById('btnResetBackgroundCard');
const btnResetBuildPlateCard = document.getElementById('btnResetBuildPlateCard');
const btnResetLightingCard = document.getElementById('btnResetLightingCard');
const btnResetAnimationCard = document.getElementById('btnResetAnimationCard');
const btnResetExportCard = document.getElementById('btnResetExportCard');
// Dev logging and a flag used to suppress saveSettings() while programmatically
// applying restored settings so we don't overwrite localStorage/URL mid-restore.
// DEV_LOG: also persist in localStorage so it survives URL rewrites
let DEV_LOG = location.search.includes('debug=1');
try {
    if (DEV_LOG) localStorage.setItem('rotater_devlog', '1');
    else if (localStorage.getItem('rotater_devlog') === '1') DEV_LOG = true;
} catch (e) { }
let suppressSave = false;
// Declared early so restoreSettings() (called before these would otherwise be
// initialized by their let declarations later in the file) can safely read/write them.
let activeModelPreset = 'custom';
let activeBgPreset = 'modelcolor';
let activeBuildPlatePreset = 'modelcolor';
let isDynamicBg = true;
let buildPlateAutoBrightnessEnabled = true;
let rulerEnabled = true;
let rulerUnit = 'metric';
let rulerLinesVisible = true;
let rulerPartHoverEnabled = false;
let rulerPartSelectMultiEnabled = false;
let devModeEnabled = false;
let rulerHoveredPartIndex = -1;
let rulerOverlayEl = null;
let rulerGridHelper = null;
let rulerGridSize = 0;
let rulerGridDivisions = 0;
let rulerGridSpanX = 0;
let rulerGridSpanZ = 0;
let rulerGridStepMm = 0;
let rulerFootprintHelper = null;
let rulerFootprintSignature = '';
const RULER_DYNAMIC_LINES_ENABLED = false;
const RULER_FOOTPRINT_ENABLED = false;
let fpsSampleAccumMs = 0;
let fpsSampleFrames = 0;
const TEXTURE_NEWS_DISMISSED_KEY = 'rotater_textureNewsDismissed';
const VIEWPORT_PERF_MIN_QUALITY_SCALE = 0.62;
let modelPartNames = [];
let modelPartBaseColors = [];
let modelPartSettings = [];
let modelPartFiles = null;
let modelPartDisplayOrder = [];
let pendingModelPartDisplayOrder = null;
let modelPartSelected = 0;
let pendingModelPartSelected = 0;
let pendingBulkSelectedPartIndices = null;
let bgSyncPartIndex = 0;
let lastNonModelBgPreset = 'white';
let buildPlateSyncPartIndex = 0;
let lastNonModelBuildPlatePreset = 'custom';
let presetHoverPreviewSnapshot = null;
let modelPartThumbsQueued = false;
let partThumbRenderTarget = null;
let partThumbCamera = null;
let partThumbScratchCanvas = null;
let partThumbScratchCtx = null;
let bgModelSyncMenuAnchorEl = null;
let buildPlateModelSyncMenuAnchorEl = null;
let multipartPartBounds = null;
let modelPartDimensions = [];
let modelPartBoundsBoxes = [];
let pendingUrlModelAppearanceOverride = null;
let modelPartSelectorClosedByUser = false;
let pendingReplacePartIndex = -1;
let currentModelBuffer = null;
let bulkSelectedPartIndices = new Set();
let modelPartSelectorViewMode = 'card';
let activeModelPartActionMenuEl = null;
let activeModelPartActionAnchorEl = null;
let _modelPartActionMenuOriginalParent = null;
let modelPartSelectedActionsMenuEl = null;

const BULK_SELECT_ICON_PATHS = {
    none: 'M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z',
    some: 'M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM16 14H8V12H16V14ZM19 19H5V5H19V19Z',
    all: 'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-9 14-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9Z',
};

const MODEL_SELECTOR_VIEW_MODES = ['card'];

try {
    const savedViewMode = localStorage.getItem('rotater_modelPartSelectorViewMode');
    if (MODEL_SELECTOR_VIEW_MODES.includes(savedViewMode)) modelPartSelectorViewMode = savedViewMode;
} catch (_) { }


// ── Slider tooltip sync ───────────────────────────────────────────────────────
function syncSliderTooltip(slider) {
    const rawMin = parseFloat(slider.min);
    const rawMax = parseFloat(slider.max);
    const min = Number.isFinite(rawMin) ? rawMin : 0;
    const max = Number.isFinite(rawMax) ? rawMax : 100;
    const value = parseFloat(slider.value);
    const safeValue = Number.isFinite(value) ? value : min;
    const span = Math.max(1e-9, max - min);
    const pct = Math.max(0, Math.min(1, (safeValue - min) / span));
    const wrap = slider.parentElement;
    slider.style.setProperty('--pct', String(pct));
    if (wrap && wrap.classList.contains('range-wrap')) wrap.style.setProperty('--pct', String(pct));
}

function syncAllRangeFillIndicators(root = document) {
    const scope = root || document;
    scope.querySelectorAll('input[type="range"]').forEach((slider) => {
        syncSliderTooltip(slider);
    });
}

function parseNumberInput(rawValue) {
    const cleaned = String(rawValue || '').trim().replace(/[^0-9.+\-]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
}

function setSliderValueAndDispatch(slider, value) {
    if (!slider) return;
    const rawMin = parseFloat(slider.min);
    const rawMax = parseFloat(slider.max);
    const min = Number.isFinite(rawMin) ? rawMin : 0;
    const max = Number.isFinite(rawMax) ? rawMax : 100;
    const bounded = Math.max(min, Math.min(max, Number(value)));
    const rawStep = parseFloat(slider.step);
    const shouldSnapToStep = Number.isFinite(rawStep) && rawStep > 0 && slider.step !== 'any';
    const snapped = shouldSnapToStep
        ? min + Math.round((bounded - min) / rawStep) * rawStep
        : bounded;
    const decimals = shouldSnapToStep ? Math.min((String(rawStep).split('.')[1] || '').length, 6) : 4;
    slider.value = Number(snapped).toFixed(decimals);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
}

function bindPreciseSliderTextEntry(slider, triggerEl, label, unit = '') {
    if (!slider || !triggerEl || triggerEl.dataset.preciseEntryBound === '1') return;
    triggerEl.dataset.preciseEntryBound = '1';

    const openPrompt = () => {
        if (!fineTuningMode) return;
        const rawMin = parseFloat(slider.min);
        const rawMax = parseFloat(slider.max);
        const min = Number.isFinite(rawMin) ? rawMin : 0;
        const max = Number.isFinite(rawMax) ? rawMax : 100;
        const currentValue = parseFloat(slider.value);
        const currentDisplay = Number.isFinite(currentValue) ? currentValue : min;
        const input = window.prompt(`${label} (${min} to ${max}${unit ? ` ${unit}` : ''})`, `${currentDisplay}`);
        if (input == null) return;
        const parsed = parseNumberInput(input);
        if (parsed == null) return;
        setSliderValueAndDispatch(slider, parsed);
    };

    triggerEl.setAttribute('data-precise-label', label);
    triggerEl.setAttribute('role', 'button');
    triggerEl.setAttribute('tabindex', '0');
    triggerEl.setAttribute('aria-label', `${label}: click to type exact value`);

    triggerEl.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openPrompt();
    });

    triggerEl.addEventListener('keydown', (ev) => {
        if (!fineTuningMode) return;
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.preventDefault();
        openPrompt();
    });
}

function refreshPreciseSliderTextEntryState() {
    const enabled = !!fineTuningMode;
    document.querySelectorAll('.slider-tooltip[data-precise-entry-bound="1"]').forEach((el) => {
        const label = el.getAttribute('data-precise-label') || 'Value';
        if (enabled) {
            el.setAttribute('title', 'Click to type exact value');
            el.setAttribute('aria-label', `${label}: click to type exact value`);
            el.setAttribute('aria-disabled', 'false');
            el.setAttribute('tabindex', '0');
            el.dataset.preciseEntryEnabled = '1';
        } else {
            el.setAttribute('title', 'Enable Fine tuning to type exact values');
            el.setAttribute('aria-label', `${label}: enable Fine tuning to type exact values`);
            el.setAttribute('aria-disabled', 'true');
            el.setAttribute('tabindex', '-1');
            el.dataset.preciseEntryEnabled = '0';
        }
    });
}

function initPreciseSliderTextEntry() {
    document.querySelectorAll('.control-label.range-label').forEach((labelEl) => {
        const slider = labelEl.querySelector('input[type="range"]');
        const tip = labelEl.querySelector('.slider-tooltip');
        if (!slider || !tip) return;

        const titleText = (labelEl.querySelector('span')?.childNodes?.[0]?.textContent || slider.id || 'Value').trim();
        const unit = tip.textContent.includes('°') ? 'deg' : (tip.textContent.includes('%') ? '%' : '');
        bindPreciseSliderTextEntry(slider, tip, titleText, unit);
    });
}

initPreciseSliderTextEntry();

// ── Slider snap-point dots ────────────────────────────────────────────────────
function addSnapDots(slider) {
    const wrap = slider.closest('.range-wrap');
    if (!wrap || wrap.querySelector('.snap-dots')) return;
    const explicit = parseInt(slider.dataset.snapCount, 10);
    let n;
    if (!isNaN(explicit) && explicit >= 2 && explicit <= 24) {
        n = explicit; // visual-only markers, evenly spaced
    } else {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const step = parseFloat(slider.step) || 1;
        n = Math.round((max - min) / step) + 1;
        if (n < 2 || n > 24) return;
    }
    const dotsEl = document.createElement('div');
    dotsEl.className = 'snap-dots';
    dotsEl.setAttribute('role', 'presentation');
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const step = parseFloat(slider.step) || 1;

    const applySnapValue = (rawValue) => {
        const bounded = Math.max(min, Math.min(max, rawValue));
        const stepped = min + Math.round((bounded - min) / step) * step;
        const decimals = (String(step).split('.')[1] || '').length;
        slider.value = stepped.toFixed(Math.min(decimals, 6));
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
    };

    for (let i = 0; i < n; i++) {
        const ratio = i / (n - 1);
        const valueAtDot = min + ratio * (max - min);
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'snap-dot-btn';
        dot.style.left = `calc((var(--slider-thumb-size, 16px) / 2) + ${ratio} * (100% - var(--slider-thumb-size, 16px)))`;
        dot.setAttribute('tabindex', '-1');
        dot.setAttribute('aria-label', `Set to ${Math.round(valueAtDot)}`);
        dot.addEventListener('click', (ev) => {
            ev.preventDefault();
            applySnapValue(valueAtDot);
        });
        dotsEl.appendChild(dot);
    }
    wrap.appendChild(dotsEl);
}

function setSliderValueFromClientX(slider, clientX) {
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return;
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const step = parseFloat(slider.step) || 1;
    const thumbPx = parseFloat(getComputedStyle(slider).getPropertyValue('--slider-thumb-size')) || 16;
    const usable = Math.max(1, rect.width - thumbPx);
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left - (thumbPx / 2)) / usable));
    const raw = min + ratio * (max - min);
    const snapImmediately = !fineTuningMode && slider.dataset.immediateSnap === '1' && Number.isFinite(step) && step > 0;
    const snapped = snapImmediately
        ? min + Math.round((raw - min) / step) * step
        : raw;
    const decimals = snapImmediately
        ? Math.min((String(step).split('.')[1] || '').length, 6)
        : 4;
    const next = Number(snapped).toFixed(decimals);
    if (String(slider.value) === next) return;
    slider.value = next;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
}

function enableImmediateRangeDrag(slider) {
    if (!slider || slider.dataset.immediateDragBound === '1') return;
    slider.dataset.immediateDragBound = '1';

    let draggingPointerId = null;
    let restoreStepValue = null;

    slider.addEventListener('pointerdown', (ev) => {
        if (ev.button !== 0) return;
        draggingPointerId = ev.pointerId;
        if (!fineTuningMode && slider.dataset.snapCount && restoreStepValue == null) {
            restoreStepValue = slider.step;
            slider.step = 'any';
        }
        try { slider.setPointerCapture(ev.pointerId); } catch (e) { }
        setSliderValueFromClientX(slider, ev.clientX);
        ev.preventDefault();
    });

    slider.addEventListener('pointermove', (ev) => {
        if (draggingPointerId !== ev.pointerId) return;
        setSliderValueFromClientX(slider, ev.clientX);
        ev.preventDefault();
    });

    const finishDrag = (ev) => {
        if (draggingPointerId !== ev.pointerId) return;
        setSliderValueFromClientX(slider, ev.clientX);
        if (restoreStepValue != null) {
            slider.step = restoreStepValue;
            restoreStepValue = null;
        }
        try { slider.releasePointerCapture(ev.pointerId); } catch (e) { }
        draggingPointerId = null;
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        ev.preventDefault();
    };

    slider.addEventListener('pointerup', finishDrag);
    slider.addEventListener('pointercancel', finishDrag);
}

// Add snap dots and enforce snap behavior on all range sliders
document.querySelectorAll('input[type="range"]').forEach((slider) => {
    addSnapDots(slider);
    enableImmediateRangeDrag(slider);
});

// ── Snap-to-grid enforcement ──────────────────────────────────────────────────
let fineTuningMode = false;

// ── COLOR RULE CONFIGURATION ──────────────────────────────────────────────────
// Editable defaults are loaded from color-rules.json at startup.
const DEFAULT_COLOR_RULES = {
    modelShade: {
        jumpPercent: 5,
        snapCount: 9,
    },
    surfaceShade: {
        jumpPercent: 5,
        snapCount: 9,
    },
    shadeResponse: {
        lightenScale: 0.6,
        darkenScale: 1.0,
    },
    autoBrightness: {
        background: {
            shade: -100,
        },
        buildPlate: {
            shade: -100,
        },
    },
    presetShadeDefaults: {
        background: {
            white: -100,
            black: 100,
            modelcolor: 0,
            custom: 0,
        },
        buildPlate: {
            white: -100,
            black: 100,
            modelcolor: 0,
            custom: 0,
        },
        model: {
            ceramic: 0,
            ink: 0,
            chrome: 0,
            glass: 0,
            chocolate: 0,
            gumball: 0,
            gold: 0,
            custom: 0,
        },
    },
    partInteractionModes: {
        select: {
            base: {
                opacityPercent: 25,
                saturationPercent: 25,
            },
            selected: {
                opacityPercent: 100,
                saturationPercent: 100,
            },
            hoveredUnselected: {
                opacityPercent: 75,
                saturationPercent: 25,
            },
            hoveredSelected: {
                opacityPercent: 100,
                saturationPercent: 100,
            },
        },
        inspect: {
            base: {
                opacityPercent: 25,
                saturationPercent: 25,
            },
            hovered: {
                opacityPercent: 100,
                saturationPercent: 100,
            },
        },
    },
};

let colorRules = JSON.parse(JSON.stringify(DEFAULT_COLOR_RULES));

function mergePlainObject(target, source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return target;
    Object.entries(source).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};
            mergePlainObject(target[key], value);
        } else if (value !== undefined) {
            target[key] = value;
        }
    });
    return target;
}

function getColorRuleValue(path, fallback) {
    const parts = String(path || '').split('.').filter(Boolean);
    let cur = colorRules;
    for (const part of parts) {
        if (!cur || typeof cur !== 'object' || Array.isArray(cur) || !(part in cur)) return fallback;
        cur = cur[part];
    }
    return cur ?? fallback;
}

function getColorRuleNumber(path, fallback) {
    const n = parseFloat(getColorRuleValue(path, fallback));
    return Number.isFinite(n) ? n : fallback;
}

// Bind shade-system to live color rules as soon as the getter exists.
ShadeSystem.setColorRuleGetter(getColorRuleNumber);

async function loadColorRules() {
    try {
        const response = await fetch(new URL('./color-rules.json', import.meta.url), { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const loaded = await response.json();
        if (loaded?.modelTone && !loaded.modelShade) loaded.modelShade = loaded.modelTone;
        if (loaded?.presetToneDefaults && !loaded.presetShadeDefaults) loaded.presetShadeDefaults = loaded.presetToneDefaults;
        colorRules = mergePlainObject(JSON.parse(JSON.stringify(DEFAULT_COLOR_RULES)), loaded);
    } catch (error) {
        colorRules = JSON.parse(JSON.stringify(DEFAULT_COLOR_RULES));
        if (DEV_LOG) console.warn('[rotater] color-rules.json fallback to defaults', error);
    }
}

const AUTO_BRIGHTNESS_RULES = {
    get background() {
        return getColorRuleValue('autoBrightness.background', DEFAULT_COLOR_RULES.autoBrightness.background);
    },
    get buildPlate() {
        return getColorRuleValue('autoBrightness.buildPlate', DEFAULT_COLOR_RULES.autoBrightness.buildPlate);
    },
};

function getSliderEffectiveValue(slider) {
    if (!slider) return 0;
    const raw = parseFloat(slider.value);
    if (!Number.isFinite(raw)) return 0;
    if (fineTuningMode) return raw;

    if (slider.dataset.snapCount) {
        const n = parseInt(slider.dataset.snapCount, 10) || 5;
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        let closest = min;
        let minDist = Infinity;
        for (let i = 0; i < n; i++) {
            const pos = min + (i / (n - 1)) * (max - min);
            const dist = Math.abs(raw - pos);
            if (dist < minDist) {
                minDist = dist;
                closest = pos;
            }
        }
        return Number(closest.toFixed(4));
    }

    const step = parseFloat(slider.step);
    if (slider.dataset.immediateSnap === '1' && Number.isFinite(step) && step > 0) {
        const min = parseFloat(slider.min);
        return Number((min + Math.round((raw - min) / step) * step).toFixed(Math.min((String(step).split('.')[1] || '').length, 6)));
    }

    return raw;
}

function snapToGrid(slider) {
    if (fineTuningMode) return;
    const snapped = getSliderEffectiveValue(slider);
    if (parseFloat(slider.value) !== snapped) slider.value = String(snapped);
}

// Snap sliders when the interaction commits (mouse/touch release or keyboard commit).
// This preserves smooth dragging while still landing on the nearest snap point.
document.querySelectorAll('input[type="range"][data-snap-count]').forEach(slider => {
    slider.addEventListener('change', () => {
        const before = String(slider.value);
        snapToGrid(slider);
        // Always sync fill to snapped position, even if value didn't change
        syncSliderTooltip(slider);
        if (String(slider.value) !== before) {
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
});

// ── State ─────────────────────────────────────────────────────────────────────
let renderer, scene, camera, controls, mesh;
let ambientLight, keyLight, fillLight, rimLight, lightRig;
let shadowCatcher;
let buildPlateMesh;
let isExporting = false;
let isPaused = false;
let modelRadius = 1;
let currentFileName = 'model';
let tiltPhase = 0;
let swingBaseAz = 0, swingLastAz = 0;
let tiltBaseMeshRx = -Math.PI / 2;
let spinDir = 1; // 1 = clockwise, -1 = counter-clockwise
let rememberedTiltRange = TILT_RANGE_DEFAULT;
let lastRotateMode = rotateModeEl.value;
const renderDeltaClock = new THREE.Clock();
const rulerPartHoverRaycaster = new THREE.Raycaster();
const rulerPartHoverPointerNdc = new THREE.Vector2();
const rulerHoveredPartBoxSizeTmp = new THREE.Vector3();
const rulerHoveredPartBoxCenterTmp = new THREE.Vector3();
let rulerHoveredPartBoxWire = null;
let modelDims = null;  // { w, d, h } in mm (STL units: x=width, y=depth, z=height)
let exportCamDist = null; // stored export camera distance (fit-to-frame, independent of viewport zoom)
let exportCamElev = 0;   // stored export camera elevation (radians)
let exportCamZoom = 1;   // stored export camera projection zoom
let _cropBackupDist = null; // exportCamDist saved on crop-mode enter, restored on cancel
let _cropBackupElev = 0;
let _cropBackupZoom = 1;
let _cropBackupCameraZoom = 1;
let _shiftPanActive = false;
let _cropSx = 0, _cropSy = 0, _cropSw = 0, _cropSh = 0; // crop box pixel rect, updated each frame
let _cropLiveSyncArmed = false; // becomes true only after user adjusts camera during crop mode
let _hasRestoredExportFrame = false; // startup-only flag for applying persisted export framing
let pendingViewportOrbitRestore = null;
let autoDemoLoadSuppressed = false;
let autoDemoLoadScheduled = false;
let _pausedBeforeStillExport = null;
let buildPlateEnabled = true;
let buildPlateColor = null;
let lastManualBgShade = 0;
let buildPlateShade = BUILD_PLATE_DEFAULTS.shade;
let lastManualBuildPlateShade = BUILD_PLATE_DEFAULTS.shade;
let manualBuildPlateShadeBeforeAuto = BUILD_PLATE_DEFAULTS.shade;
let buildPlateFinish = BUILD_PLATE_DEFAULTS.finish; // matte | satin | gloss
let buildPlateShape = BUILD_PLATE_DEFAULTS.shape; // rectangle | rounded | circle
let buildPlateSizePreset = BUILD_PLATE_DEFAULTS.sizePreset;
let buildPlateWidth = BUILD_PLATE_DEFAULTS.width;
let buildPlateDepth = BUILD_PLATE_DEFAULTS.depth;
let dpadVisible = true;
let exportMotionControlsEnabled = true;
let _syncingExportMotionControls = false;
let autoUIAssistEnabled = true;
let exportCollapsedConfirmEnabled = true;
let uploadChoicePromptEnabled = true;
let uploadDefaultAction = 'newplate'; // newplate | replace
let autoLoadedDefaultBenchy = false;
const collapsedExportConfirmController = createCollapsedExportConfirmController({
    overlayEl: exportCollapsedConfirmOverlayEl,
});
const uploadActionController = createUploadActionController();
const uploadChoiceUiController = createUploadChoiceUiController({
    textEl: uploadChoiceTextEl,
    decisionEl: uploadChoiceDecisionEl,
    actionsRightEl: uploadChoiceActionsRightEl,
    fileListWrapEl: uploadChoiceFileListWrapEl,
    fileListEl: uploadChoiceFileListEl,
    showMoreBtn: btnUploadChoiceShowMore,
    previewLimit: 5,
});
let rulerHoverNoHitSinceMs = 0;
const textureTuneState = {
    light: TEXTURE_TUNE_DEFAULTS.light,
    contrast: TEXTURE_TUNE_DEFAULTS.contrast,
    highlights: TEXTURE_TUNE_DEFAULTS.highlights,
    shadows: TEXTURE_TUNE_DEFAULTS.shadows,
    shadowAzimuth: TEXTURE_TUNE_DEFAULTS.shadowAzimuth,
    shadowHeight: TEXTURE_TUNE_DEFAULTS.shadowHeight,
    metallicRoughness: TEXTURE_TUNE_DEFAULTS.metallicRoughness,
    metallicMetalness: TEXTURE_TUNE_DEFAULTS.metallicMetalness,
    metallicReflection: TEXTURE_TUNE_DEFAULTS.metallicReflection,
    phongRoughness: TEXTURE_TUNE_DEFAULTS.phongRoughness,
    phongReflection: TEXTURE_TUNE_DEFAULTS.phongReflection,
    matteRoughness: TEXTURE_TUNE_DEFAULTS.matteRoughness,
    matteReflection: TEXTURE_TUNE_DEFAULTS.matteReflection,
    lightLock: TEXTURE_TUNE_DEFAULTS.lightLock,
};

function syncLightRig() {
    if (!lightRig || !camera) return;
    const az = textureTuneState.lightLock ? getOrbitFrameStateFast().az : 0;
    lightRig.rotation.y = az;
    if (scene) scene.environmentRotation.y = az;
}

const orbitFrameStateStore = createOrbitFrameStateStore();
const viewportPerformanceState = createViewportPerformanceState();
let currentViewportPixelRatio = 0;

function getOrbitFrameStateFast() {
    return getOrbitFrameStateFastModule(camera, controls, orbitFrameStateStore);
}

function getOrbitFrameState() {
    return getOrbitFrameStateModule(camera, controls, orbitFrameStateStore);
}

function setCameraFromOrbitState(cam, target, dist, elev, az) {
    setCameraFromOrbitStateModule(cam, target, dist, elev, az);
}

function getCropFrameRect(w, h) {
    const safeW = Math.max(1, w);
    const safeH = Math.max(1, h);
    const { width: expW, height: expH } = getPreviewExportSize();
    const targetAspect = Math.max(1e-6, expW / Math.max(1, expH));

    const maxW = safeW * CROP_FRAME_UI_SCALE;
    const maxH = safeH * CROP_FRAME_UI_SCALE;

    let frameW = maxW;
    let frameH = frameW / targetAspect;
    if (frameH > maxH) {
        frameH = maxH;
        frameW = frameH * targetAspect;
    }

    const sw = Math.max(2, Math.round(frameW));
    const sh = Math.max(2, Math.round(frameH));
    const sx = Math.floor((safeW - sw) / 2);
    const sy = Math.floor((safeH - sh) / 2);
    return { sx, sy, sw, sh };
}

function getCropFrameVerticalScale() {
    const wrap = canvas?.parentElement;
    if (!wrap) return CROP_FRAME_UI_SCALE;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return CROP_FRAME_UI_SCALE;
    const sh = _cropSh > 0 ? _cropSh : getCropFrameRect(w, h).sh;
    return Math.max(1e-6, sh / h);
}

function syncExportCameraFromViewport() {
    if (!camera) return;
    const { dist, elev } = getOrbitFrameState();
    exportCamDist = dist;
    exportCamElev = elev;
    const cropScale = exportFrameEnabled ? getCropFrameVerticalScale() : 1;
    exportCamZoom = (camera.zoom || 1) / cropScale;
}

function tryApplyPendingViewportOrbitRestore() {
    if (!pendingViewportOrbitRestore || !camera || !controls) return false;
    try {
        const restore = pendingViewportOrbitRestore;
        const currentModelKey = getViewportOrbitModelKey();
        if (!restore.modelKey || restore.modelKey !== currentModelKey) {
            pendingViewportOrbitRestore = null;
            return false;
        }
        // Always restore around model center to avoid stale/off-model pan targets
        // that can place the camera on empty space after refresh.
        const target = new THREE.Vector3(0, 0, 0);
        const fitDist = Math.max(0.02, getViewportFitDistance());
        const minDist = Math.max(0.01, fitDist * ORBIT_MIN_DISTANCE_FACTOR);
        const maxDist = Math.max(minDist + 0.01, fitDist * ORBIT_MAX_DISTANCE_FACTOR);
        const visibilitySafeMinDist = Math.max(minDist, modelRadius * 1.05);
        const dist = THREE.MathUtils.clamp(Number(restore.dist) || fitDist, visibilitySafeMinDist, maxDist);
        const maxEl = THREE.MathUtils.degToRad(75);
        const elev = THREE.MathUtils.clamp(Number(restore.elev) || 0, -maxEl, maxEl);
        const az = Number(restore.az) || 0;

        setCameraFromOrbitState(camera, target, dist, elev, az);
        controls.target.copy(target);

        const restoredDist = camera.position.distanceTo(target);
        const isRestoreInvalid = !Number.isFinite(restoredDist)
            || restoredDist < Math.max(0.01, modelRadius * 1.02);
        if (isRestoreInvalid) {
            placeCamera();
        }

        updateOrbitDistanceLimits(true);
        controls.update();
        updateCameraClipPlanes(true);
        pendingViewportOrbitRestore = null;
        return true;
    } catch (_) {
        pendingViewportOrbitRestore = null;
        return false;
    }
}

function isCanvasPointInsideCropFrame(clientX, clientY) {
    const fc = document.getElementById('exportFrameCanvas');
    if (!fc) return true;
    const rect = fc.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return x >= _cropSx && x <= (_cropSx + _cropSw) && y >= _cropSy && y <= (_cropSy + _cropSh);
}

function getViewportPixelRatio() {
    return getViewportPixelRatioModule(
        window.devicePixelRatio || 1,
        VIEWPORT_AA_SCALE,
        VIEWPORT_PIXEL_RATIO_MIN,
        VIEWPORT_PIXEL_RATIO_MAX,
        viewportPerformanceState
    );
}

function applyViewportPixelRatioIfNeeded(force = false) {
    if (!renderer) return false;
    const nextPixelRatio = getViewportPixelRatio();
    if (!force && Math.abs(nextPixelRatio - currentViewportPixelRatio) < 0.001) return false;
    currentViewportPixelRatio = nextPixelRatio;
    renderer.setPixelRatio(nextPixelRatio);
    return true;
}

function getViewportFitDistance() {
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera?.fov ? camera.fov / 2 : 22.5));
    const aspect = camera?.aspect > 0 ? camera.aspect : 1;
    return modelRadius * Math.max(1, 1 / aspect) / Math.max(1e-6, tanHalfFov) * VIEWPORT_FIT_SCALE;
}

function updateOrbitDistanceLimits(clampCurrent = true) {
    if (!controls || !camera) return;
    const fitDist = Math.max(0.02, getViewportFitDistance());
    const minDist = Math.max(0.01, fitDist * ORBIT_MIN_DISTANCE_FACTOR);
    const maxDist = Math.max(minDist + 0.01, fitDist * ORBIT_MAX_DISTANCE_FACTOR);
    controls.minDistance = minDist;
    controls.maxDistance = maxDist;

    if (!clampCurrent) return;
    const { target, dist, elev, az } = getOrbitFrameState();
    const clampedDist = THREE.MathUtils.clamp(dist, minDist, maxDist);
    if (Math.abs(clampedDist - dist) > 1e-4) {
        setCameraFromOrbitState(camera, target, clampedDist, elev, az);
        controls.target.copy(target);
        controls.update();
    }

    updateCameraClipPlanes();
}

function updateCameraClipPlanes(force = false) {
    if (!camera) return;
    const tx = controls?.target?.x ?? 0;
    const ty = controls?.target?.y ?? 0;
    const tz = controls?.target?.z ?? 0;
    const dx = camera.position.x - tx;
    const dy = camera.position.y - ty;
    const dz = camera.position.z - tz;
    const dist = Math.max(0.001, Math.hypot(dx, dy, dz));
    const radius = Math.max(modelRadius || 1, 0.001);

    const clearance = dist - (radius * 1.08);
    let nextNear = clearance > 0 ? (clearance * 0.22) : Math.max(0.003, dist * 0.002);
    nextNear = Math.max(0.003, Math.min(nextNear, Math.max(0.8, radius * 0.6)));

    let nextFar = Math.max(nextNear + 8, dist + (radius * 9.5) + 40);
    if (buildPlateMesh?.visible) nextFar += Math.max(8, radius * 0.9);

    if (!Number.isFinite(nextNear) || !Number.isFinite(nextFar) || nextNear <= 0 || nextFar <= nextNear) return;
    if (!force && Math.abs(camera.near - nextNear) < 1e-5 && Math.abs(camera.far - nextFar) < 1e-2) return;

    camera.near = nextNear;
    camera.far = nextFar;
    camera.updateProjectionMatrix();
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initThree() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
    applyViewportPixelRatioIfNeeded(true);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.75;

    // RoomEnvironment provides neutral IBL so MeshStandardMaterial (metal
    // shading) has environment reflections — without it metalness hides the
    // diffuse and the model renders near-black.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = pmrem.fromScene(new RoomEnvironment(renderer)).texture;
    pmrem.dispose();

    scene = new THREE.Scene();
    scene.background = null;

    {
        const tone = bgOpacitySlider ? Math.round(getSliderEffectiveValue(bgOpacitySlider)) : 0;
        const c = computeTonedColor(bgPick.value, tone);
        if (renderer) renderer.setClearColor(c, 1);
    }
    // restoreSettings() can run before WebGL is initialized; re-apply here so
    // first paint honors auto-adjusted background immediately after hard refresh.
    if (isDynamicBg) updateDynamicBg();
    scene.environment = roomEnv; // IBL for metallic shading

    camera = new THREE.PerspectiveCamera(45, 1, 0.02, 5000);

    // Three-point lighting
    // Warm key (slightly amber) + cool fill + cool rim creates warm/cool contrast
    // that gives white/light models visible form definition without colour bias on
    // deeply-saturated models.
    lightRig = new THREE.Group();
    scene.add(lightRig);

    ambientLight = new THREE.AmbientLight(0xfff8f2, LIGHT_BASE.ambient);
    lightRig.add(ambientLight);
    keyLight = new THREE.DirectionalLight(0xfff6e8, LIGHT_BASE.key);
    keyLight.position.set(1.5, 2.0, 1.5);
    keyLight.castShadow = false;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.00008;
    keyLight.shadow.normalBias = 0.0025;
    keyLight.shadow.intensity = 0.62;
    keyLight.shadow.radius = 1.1;
    lightRig.add(keyLight);
    scene.add(keyLight.target);
    fillLight = new THREE.DirectionalLight(0xc8d8ff, LIGHT_BASE.fill);
    fillLight.position.set(-2, 0.5, -1);
    lightRig.add(fillLight);
    rimLight = new THREE.DirectionalLight(0xb8d0ff, LIGHT_BASE.rim);
    rimLight.position.set(-0.4, 1.8, -2.2);
    lightRig.add(rimLight);

    shadowCatcher = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.ShadowMaterial({ opacity: 0.28 })
    );
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.receiveShadow = true;
    if (shadowCatcher.material && shadowCatcher.material.isShadowMaterial) {
        // Keep ground shadows visible without depth-occluding the ruler grid.
        shadowCatcher.material.depthWrite = false;
    }
    shadowCatcher.renderOrder = -1;
    shadowCatcher.visible = false;
    scene.add(shadowCatcher);

    buildPlateMesh = new THREE.Mesh(
        createBuildPlateGeometry(buildPlateShape),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            toneMapped: false,
        })
    );
    buildPlateMesh.userData.shape = normalizeBuildPlateShape(buildPlateShape);
    buildPlateMesh.rotation.x = -Math.PI / 2;
    buildPlateMesh.receiveShadow = false;
    buildPlateMesh.castShadow = false;
    buildPlateMesh.visible = false;
    buildPlateMesh.renderOrder = -2;
    scene.add(buildPlateMesh);
    updateBuildPlateMaterial();

    applyTextureLighting();

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = BASE_ROTATE_SPEED * getSpeed() * spinDir;
    controls.enableZoom = true;
    // Right-drag should move only along vertical (up/down) using pan + axis lock.
    controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
    updateOrbitDistanceLimits(false);
    rightPanLockController.setDefaults({
        mouseButtons: controls.mouseButtons,
        touches: controls.touches,
    });
    controls.addEventListener('start', () => {
        if (!exportFrameEnabled) return;
        _cropLiveSyncArmed = true;
        syncExportCameraFromViewport();
    });
    controls.addEventListener('change', () => {
        if (rightPanLockController.isVerticalLockActive()) {
            rightPanLockController.enforceVerticalLock({ controls, camera });
        }
    });
    controls.addEventListener('end', () => {
        saveSettings();
    });

    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    // ResizeObserver keeps canvas in sync during sidebar transitions.
    // Throttled to one sync per animation frame so the WebGL resolution
    // tracks every step of the CSS transition without redundant calls.
    if (window.ResizeObserver) {
        let roPending = false;
        new ResizeObserver(() => {
            if (!roPending) {
                roPending = true;
                requestAnimationFrame(() => { syncCanvasSize(); roPending = false; });
            }
        }).observe(canvas.parentElement);
    }
    requestAnimationFrame(loop);
}

function syncCanvasSize() {
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;
    // Don't override the renderer size or camera aspect during export — the
    // export pipeline sets its own dimensions and restores them when done.
    if (isExporting) return;
    applyViewportPixelRatioIfNeeded();
    renderer.setSize(w, h, false); // false = don't touch CSS
    if (camera) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    updateOrbitDistanceLimits();
    updateEstimate();
    updateLiveRulerOverlay();
    // Re-render immediately after setSize clears the buffer so the browser
    // never composites a blank canvas (prevents the dark-flash during resize).
    if (scene && camera && !isExporting) renderer.render(scene, camera);
}

// ── Material ─────────────────────────────────────────────────────────────────
function getActiveShadingMode() {
    if (shadingEl.value === 'flat' || shadingEl.value === 'toon') return 'matte';
    return shadingEl.value;
}

function normalizeMaterialFamily(value, fallback = 'standard') {
    if (value == null || value === '') return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'metallic' || normalized === 'metal' || normalized === 'm') return 'metallic';
    if (normalized === 'clear' || normalized === 'glass' || normalized === 'transparent' || normalized === 'translucent' || normalized === 'c') return 'clear';
    if (normalized === 'standard' || normalized === 'std' || normalized === 'opaque' || normalized === 'phong' || normalized === 'matte' || normalized === 'flat' || normalized === 'toon' || normalized === 's') return 'standard';
    return fallback;
}

function getMaterialFamilyFromShading(shading) {
    const normalized = (shading === 'flat' || shading === 'toon') ? 'matte' : (shading || 'phong');
    if (normalized === 'metallic') return 'metallic';
    if (normalized === 'clear' || normalized === 'glass') return 'clear';
    return 'standard';
}

function getShadingForMaterialFamily(materialFamily, fallback = 'phong') {
    const family = normalizeMaterialFamily(materialFamily, 'standard');
    if (family === 'metallic') return 'metallic';
    if (family === 'clear') return 'clear';
    return (fallback === 'matte' || fallback === 'flat' || fallback === 'toon') ? 'matte' : 'phong';
}

function getMaterialFamilyFromPartSettings(settings = getSelectedPartSettings()) {
    return getMaterialFamilyFromShading(settings?.shading || getActiveShadingMode());
}

function normalizeBuildPlateShape(shape) {
    return (shape === 'rounded' || shape === 'circle') ? shape : 'rectangle';
}

function createBuildPlateGeometry(shape = 'rectangle') {
    const normalized = normalizeBuildPlateShape(shape);
    if (normalized === 'rectangle') return new THREE.PlaneGeometry(1, 1);

    if (normalized === 'circle') {
        const circle = new THREE.CircleGeometry(0.5, 56);
        circle.computeBoundingBox();
        return circle;
    }

    const hw = 0.5;
    const hh = 0.5;
    const r = 0.12;
    const outline = new THREE.Shape();
    outline.moveTo(-hw + r, -hh);
    outline.lineTo(hw - r, -hh);
    outline.quadraticCurveTo(hw, -hh, hw, -hh + r);
    outline.lineTo(hw, hh - r);
    outline.quadraticCurveTo(hw, hh, hw - r, hh);
    outline.lineTo(-hw + r, hh);
    outline.quadraticCurveTo(-hw, hh, -hw, hh - r);
    outline.lineTo(-hw, -hh + r);
    outline.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

    const geo = new THREE.ShapeGeometry(outline, 14);
    geo.computeBoundingBox();
    if (geo.boundingBox) {
        const pos = geo.attributes.position;
        const min = geo.boundingBox.min;
        const max = geo.boundingBox.max;
        const spanX = Math.max(1e-6, max.x - min.x);
        const spanY = Math.max(1e-6, max.y - min.y);
        const uv = new Float32Array(pos.count * 2);
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            uv[i * 2] = (x - min.x) / spanX;
            uv[(i * 2) + 1] = (y - min.y) / spanY;
        }
        geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    }
    return geo;
}

function syncBuildPlateShapeMesh() {
    if (!buildPlateMesh) return;
    const targetShape = normalizeBuildPlateShape(buildPlateShape);
    const activeShape = normalizeBuildPlateShape(buildPlateMesh.userData.shape || 'rectangle');
    if (activeShape === targetShape) return;
    const oldGeometry = buildPlateMesh.geometry;
    buildPlateMesh.geometry = createBuildPlateGeometry(targetShape);
    buildPlateMesh.userData.shape = targetShape;
    if (oldGeometry?.dispose) oldGeometry.dispose();
}

function createBuildPlateTexture(hexColor = null, finish = BUILD_PLATE_DEFAULTS.finish) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (!ctx) return null;

    const color = new THREE.Color(hexColor || getActiveBuildPlateBaseColor() || colorPick?.value || bgPick?.value || PALETTE.fallback);
    const base = {
        r: Math.round(color.r * 255),
        g: Math.round(color.g * 255),
        b: Math.round(color.b * 255),
    };
    const variance = finish === 'matte' ? 18 : (finish === 'gloss' ? 8 : 12);

    const img = ctx.createImageData(128, 128);
    for (let y = 0; y < 128; y++) {
        for (let x = 0; x < 128; x++) {
            const idx = (y * 128 + x) * 4;
            const noise = ((x * 73 + y * 151 + 97) % 37) - 18;
            const n = Math.round((noise / 18) * variance);
            img.data[idx] = Math.max(0, Math.min(255, base.r + n));
            img.data[idx + 1] = Math.max(0, Math.min(255, base.g + n));
            img.data[idx + 2] = Math.max(0, Math.min(255, base.b + n));
            img.data[idx + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);

    ctx.strokeStyle = finish === 'gloss' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let y = 0; y <= 128; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(128, y + 0.5);
        ctx.stroke();
    }
    for (let x = 0; x <= 128; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, 128);
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    if (renderer?.capabilities?.getMaxAnisotropy) {
        tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    }
    return tex;
}

function openAnchoredColorPicker(inputEl, anchorEl) {
    if (!inputEl) return;
    const rect = anchorEl?.getBoundingClientRect?.();
    const prevInlineStyles = inputEl.style.cssText;
    if (rect) {
        Object.assign(inputEl.style, {
            position: 'fixed',
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${Math.max(1, Math.floor(rect.width))}px`,
            height: `${Math.max(1, Math.floor(rect.height))}px`,
            clip: 'auto',
            pointerEvents: 'auto',
            opacity: '0',
            zIndex: '9999',
        });
    } else {
        Object.assign(inputEl.style, {
            width: '1px',
            height: '1px',
            pointerEvents: 'auto',
            opacity: '0',
        });
    }

    try { inputEl.showPicker(); } catch (_) { inputEl.click(); }

    setTimeout(() => {
        inputEl.style.cssText = prevInlineStyles;
    }, 260);
}

function updateBuildPlateMaterial(options = {}) {
    const skipTextureRefresh = options?.skipTextureRefresh === true;
    const skipControlSync = options?.skipControlSync === true;
    const shade = Math.max(-100, Math.min(100, Number(buildPlateShade) || 0));
    const baseHex = getActiveBuildPlateBaseColor();
    const toned = buildPlateAutoBrightnessEnabled
        ? computeBuildPlateAutoBrightnessColor(baseHex)
        : (activeBuildPlatePreset === 'modelcolor' ? baseHex : computeBuildPlateShadeColor(baseHex, shade));
    buildPlateShape = normalizeBuildPlateShape(buildPlateShape);
    buildPlateFinish = (buildPlateFinish === 'matte' || buildPlateFinish === 'gloss') ? buildPlateFinish : 'satin';

    if (buildPlateMesh && buildPlateMesh.material) {
        syncBuildPlateShapeMesh();
        buildPlateMesh.material.color.set(toned);

        if (!skipTextureRefresh) {
            const previousMap = buildPlateMesh.material.map;
            const repeatX = previousMap?.repeat?.x || Math.max(4, Math.round((buildPlateMesh.scale?.x || buildPlateWidth || 220) / 8));
            const repeatY = previousMap?.repeat?.y || Math.max(4, Math.round((buildPlateMesh.scale?.y || buildPlateDepth || 220) / 8));
            if (previousMap) {
                previousMap.dispose();
                buildPlateMesh.material.map = null;
            }
            if (BUILD_PLATE_TEXTURES_ENABLED) {
                buildPlateMesh.material.map = createBuildPlateTexture(toned, buildPlateFinish);
                buildPlateMesh.material.map.repeat.set(repeatX, repeatY);
            }
        }
        buildPlateMesh.material.needsUpdate = true;
    }

    if (skipControlSync) return;

    if (buildPlateControlsEl) buildPlateControlsEl.hidden = !buildPlateEnabled;
    if (buildPlateConfigBodyEl) buildPlateConfigBodyEl.hidden = false;
    if (buildPlateShadeSliderEl) buildPlateShadeSliderEl.value = String(Number(buildPlateShade) || 0);
    if (buildPlateShadeValEl) {
        const v = buildPlateShadeSliderEl
            ? Math.round(getSliderEffectiveValue(buildPlateShadeSliderEl))
            : (Number(buildPlateShade) || 0);
        buildPlateShadeValEl.textContent = (v >= 0 ? '+' : '') + String(v);
    }
    updateBuildPlateShadeControlVisibility();
    updateBuildPlateShadeSliderVisual();
    if (buildPlateColorPickerEl && /^#[0-9a-f]{6}$/i.test(buildPlateColor)) {
        buildPlateColorPickerEl.value = buildPlateColor;
    }
    if (buildPlateFinishWrapEl) {
        buildPlateFinishWrapEl.querySelectorAll('[data-plate-finish]').forEach((btn) => {
            const isActive = btn.getAttribute('data-plate-finish') === buildPlateFinish;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }
    if (buildPlateShapeWrapEl) {
        buildPlateShapeWrapEl.querySelectorAll('[data-plate-shape]').forEach((btn) => {
            const isActive = btn.getAttribute('data-plate-shape') === buildPlateShape;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }
    updateRulerGrid();
    updateCardResetButtonStates();
}

function clampBuildPlateSize(v, fallback = 220) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(80, Math.min(500, Math.round(n)));
}

function applyBuildPlateSizePreset(preset) {
    if (BUILD_PLATE_SIZE_PRESETS[preset]) {
        buildPlateSizePreset = preset;
        buildPlateWidth = BUILD_PLATE_SIZE_PRESETS[preset].w;
        buildPlateDepth = BUILD_PLATE_SIZE_PRESETS[preset].d;
        return;
    }
    buildPlateSizePreset = 'custom';
    buildPlateWidth = clampBuildPlateSize(buildPlateWidth, 220);
    buildPlateDepth = clampBuildPlateSize(buildPlateDepth, 220);
}

function syncBuildPlateSizeUI() {
    if (buildPlateSizePresetEl) buildPlateSizePresetEl.value = buildPlateSizePreset;
    if (buildPlateSizePresetModalEl) buildPlateSizePresetModalEl.value = buildPlateSizePreset;
    if (buildPlateCustomSizeRowEl) buildPlateCustomSizeRowEl.hidden = buildPlateSizePreset !== 'custom';
    if (buildPlateCustomSizeRowModalEl) buildPlateCustomSizeRowModalEl.hidden = buildPlateSizePreset !== 'custom';
    if (buildPlateCustomWidthEl) buildPlateCustomWidthEl.value = String(buildPlateWidth);
    if (buildPlateCustomWidthModalEl) buildPlateCustomWidthModalEl.value = String(buildPlateWidth);
    if (buildPlateCustomDepthEl) buildPlateCustomDepthEl.value = String(buildPlateDepth);
    if (buildPlateCustomDepthModalEl) buildPlateCustomDepthModalEl.value = String(buildPlateDepth);
}

function syncExportMotionControlsFromMain() {
    if (_syncingExportMotionControls) return;
    _syncingExportMotionControls = true;
    try {
        if (exportMotionControlsEl) exportMotionControlsEl.hidden = !exportMotionControlsEnabled;
        const mode = rotateModeEl.value || 'spin';
        if (exportMotionModeEl) exportMotionModeEl.value = mode;
        if (exportMotionSpeedEl) exportMotionSpeedEl.value = speedSlider.value;
        refreshExportMotionSpeedOptionLabels();

        if (exportMotionRangeEl && exportMotionRangeValEl && exportMotionRangeLabelEl) {
            const useWobbleRange = mode === 'wobble';
            const src = useWobbleRange ? wobbleSpinRangeSlider : tiltRangeSlider;
            exportMotionRangeEl.min = src.min;
            exportMotionRangeEl.max = src.max;
            exportMotionRangeEl.step = src.step;
            exportMotionRangeEl.value = src.value;
            exportMotionRangeValEl.textContent = `${src.value}°`;
            exportMotionRangeLabelEl.textContent = useWobbleRange ? 'Spin Range' : 'Range';
            syncSliderTooltip(exportMotionRangeEl);
        }
    } finally {
        _syncingExportMotionControls = false;
    }
}

function updateShadowCatcherPlacement() {
    if (!shadowCatcher || !mesh) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const y = box.min.y - Math.max(0.001, modelRadius * 0.006);
    const footprint = Math.max(size.x, size.z, 0.001);
    const modelHeight = Math.max(size.y, 0.001);
    shadowCatcher.position.set(center.x, y, center.z);

    if (buildPlateMesh) {
        const plateW = clampBuildPlateSize(buildPlateWidth, 220);
        const plateD = clampBuildPlateSize(buildPlateDepth, 220);
        const shape = normalizeBuildPlateShape(buildPlateShape);
        const scaleW = shape === 'circle' ? Math.min(plateW, plateD) : plateW;
        const scaleD = shape === 'circle' ? Math.min(plateW, plateD) : plateD;
        buildPlateMesh.position.set(center.x, y - Math.max(0.0005, modelRadius * 0.0012), center.z);
        buildPlateMesh.scale.set(scaleW, scaleD, 1);
        if (buildPlateMesh.material?.map) {
            const repeatX = Math.max(4, Math.round(scaleW / 8));
            const repeatY = Math.max(4, Math.round(scaleD / 8));
            buildPlateMesh.material.map.repeat.set(repeatX, repeatY);
        }
    }

    if (!keyLight) return;

    // Keep shadow direction tied to model size/tuning, then size catcher/frustum
    // from projected ground-run so long side-cast shadows do not get clipped.
    const heightGain = Math.max(0.4, Math.min(2.2, textureTuneState.shadowHeight / 100));
    const lightHeight = Math.max(
        center.y + modelRadius * 0.62,
        modelRadius * (0.82 + heightGain * 1.08)
    );
    const lightRadius = modelRadius * THREE.MathUtils.mapLinear(heightGain, 0.4, 2.2, 1.55, 0.72);
    const az = THREE.MathUtils.degToRad(textureTuneState.shadowAzimuth);

    keyLight.position.set(
        center.x + Math.sin(az) * lightRadius,
        lightHeight,
        center.z + Math.cos(az) * lightRadius
    );
    keyLight.target.position.copy(center);
    keyLight.target.updateMatrixWorld();

    const horizontalRun = Math.hypot(keyLight.position.x - center.x, keyLight.position.z - center.z);
    const verticalRun = Math.max(0.05, keyLight.position.y - y);
    const projectedShadowRun = modelHeight * (horizontalRun / verticalRun);
    const shadowReach = projectedShadowRun * 1.45;

    const catcherHalfSpan = Math.max(
        footprint * 2.2,
        footprint * 0.9 + shadowReach + modelRadius * 0.95
    );
    const catcherSize = Math.max(1, catcherHalfSpan * 2);
    shadowCatcher.scale.set(catcherSize, catcherSize, 1);

    const cam = keyLight.shadow.camera;
    const shadowSpan = Math.max(6, catcherHalfSpan * 1.45, modelRadius * 3.2);
    cam.near = 0.1;
    cam.far = Math.max(30, lightHeight + modelHeight * 4.6 + shadowReach * 2.8);
    cam.left = -shadowSpan;
    cam.right = shadowSpan;
    cam.top = shadowSpan;
    cam.bottom = -shadowSpan;
    cam.updateProjectionMatrix();

    keyLight.shadow.bias = -Math.max(0.00002, modelRadius * 0.0000015);
    keyLight.shadow.normalBias = Math.min(0.009, Math.max(0.0012, modelRadius * 0.00011));
}

function applyTextureLighting() {
    const gain = Math.max(0.4, Math.min(2, textureTuneState.light / 100));
    const contrast = Math.max(0.5, Math.min(4, textureTuneState.contrast / 100));
    const highlights = Math.max(0.4, Math.min(4, textureTuneState.highlights / 100));
    const inv = 1 / Math.sqrt(contrast);
    const fwd = Math.sqrt(contrast);
    const shadowsAmt = Math.max(0, Math.min(1, textureTuneState.shadows / 100));
    const shadowsOn = shadowsAmt > 0.001;
    const shadowBodyFactor = 1 - 0.78 * shadowsAmt;
    const shadowRimFactor = 1 - 0.62 * shadowsAmt;

    if (ambientLight) ambientLight.intensity = LIGHT_BASE.ambient * gain * inv * shadowBodyFactor;
    if (keyLight) keyLight.intensity = LIGHT_BASE.key * gain * contrast;
    if (fillLight) fillLight.intensity = LIGHT_BASE.fill * gain * inv * shadowBodyFactor * 0.92;
    if (rimLight) rimLight.intensity = LIGHT_BASE.rim * gain * fwd * Math.pow(highlights, 1.5) * shadowRimFactor;
    if (renderer) {
        renderer.toneMappingExposure = Math.max(0.2, Math.min(2.8,
            LIGHT_BASE.exposure * Math.pow(gain, 0.92)
        ));
        renderer.shadowMap.enabled = shadowsOn;
        renderer.shadowMap.needsUpdate = true;
    }
    if (keyLight) keyLight.castShadow = shadowsOn;
    if (keyLight?.shadow) {
        keyLight.shadow.intensity = shadowsOn ? (0.18 + shadowsAmt * 0.82) : 0;
        keyLight.shadow.needsUpdate = true;
    }
    if (mesh) {
        const mats = getMeshMaterials();
        const allTransmissive = mats.length > 0 && mats.every(m => m && 'transmission' in m && m.transmission > 0);
        mesh.castShadow = shadowsOn && !allTransmissive;
        // Avoid shadow acne/banding artifacts on broad flat STL faces.
        mesh.receiveShadow = false;
    }
    if (shadowCatcher) {
        // Keep projected shadows visible regardless of build plate toggle.
        shadowCatcher.visible = shadowsOn;
        if (shadowCatcher.material && shadowCatcher.material.isShadowMaterial) {
            const surfaceColor = getActiveRulerSurfaceColor();
            const lum = getColorRelativeLuminance(surfaceColor);
            const tintedShadow = surfaceColor.clone().lerp(new THREE.Color(0x000000), 0.78);
            shadowCatcher.material.color.copy(tintedShadow);
            const lumScale = THREE.MathUtils.lerp(0.72, 1.18, lum);
            shadowCatcher.material.opacity = shadowsOn
                ? (0.02 + shadowsAmt * 0.14 * lumScale)
                : 0.02;
            shadowCatcher.material.needsUpdate = true;
        }
    }
    if (buildPlateMesh) {
        buildPlateMesh.visible = !!(buildPlateEnabled && mesh);
        if (buildPlateMesh.material) buildPlateMesh.material.needsUpdate = true;
    }
}

function applyCurrentTextureTuning() {
    applyTextureLighting();
    const mats = getMeshMaterials();
    if (!mats.length) return;
    mats.forEach((mat, idx) => {
        if (!mat || !mat.isMeshStandardMaterial) return;
        const s = getPartSettings(idx);
        const mode = (s.shading === 'flat' || s.shading === 'toon') ? 'matte' : (s.shading || getActiveShadingMode());
        const materialFamily = normalizeMaterialFamily(s?.materialFamily, getMaterialFamilyFromShading(mode));
        if (mode === 'metallic') {
            mat.metalness = s.metallicMetalness / 100;
            mat.roughness = (100 - s.metallicRoughness) / 100;
            mat.envMapIntensity = (s.metallicReflection / 100) * (textureTuneState.highlights / 100);
        } else if (mode === 'clear' || mode === 'glass') {
            mat.metalness = 0;
            mat.roughness = Math.max(0.03, Math.min(0.35, (100 - s.phongRoughness) / 100));
            mat.envMapIntensity = Math.max(0.6, (s.phongReflection / 100) * (textureTuneState.highlights / 100));
            if ('transmission' in mat) mat.transmission = 0.88;
            if ('ior' in mat) mat.ior = 1.45;
            if ('thickness' in mat) mat.thickness = 0.65;
            mat.opacity = 0.92;
            mat.transparent = true;
            mat.depthWrite = false;
        } else if (mode === 'phong') {
            mat.metalness = 0;
            mat.roughness = (100 - s.phongRoughness) / 100;
            mat.envMapIntensity = (s.phongReflection / 100) * (textureTuneState.highlights / 100);
            if (materialFamily === 'ceramic') {
                if ('clearcoat' in mat) mat.clearcoat = 0.26;
                if ('clearcoatRoughness' in mat) mat.clearcoatRoughness = 0.34;
                mat.roughness = Math.max(0.18, Math.min(0.72, mat.roughness));
                mat.envMapIntensity *= 0.9;
            }
        } else {
            // Clay: matte non-metal baseline with faint environment response.
            mat.metalness = 0;
            mat.roughness = (100 - s.matteRoughness) / 100;
            mat.envMapIntensity = (s.matteReflection / 100) * (textureTuneState.highlights / 100);
        }
        mat.needsUpdate = true;
    });
}

function getMaterial(shading, baseColor, partSettings) {
    if (shading === "flat" || shading === "toon") shading = "matte"; // legacy value

    // Use per-part tone if available, otherwise fall back to the UI slider.
    const ps = partSettings || null;
    const toneVal = ps != null && ps.tone != null ? ps.tone : parseInt(opacitySlider ? opacitySlider.value : 0, 10);
    const baseC = computeTonedColor(baseColor, toneVal);

    // Per-part roughness/metalness when available; fall back to global textureTuneState.
    const matteRoughness  = ps != null && ps.matteRoughness  != null ? ps.matteRoughness  : textureTuneState.matteRoughness;
    const matteReflection = ps != null && ps.matteReflection != null ? ps.matteReflection : textureTuneState.matteReflection;
    const phongRoughness  = ps != null && ps.phongRoughness  != null ? ps.phongRoughness  : (textureTuneState.phongRoughness || 10);
    const phongReflection = ps != null && ps.phongReflection != null ? ps.phongReflection : (textureTuneState.phongReflection || 80);
    const metallicRoughness  = ps != null && ps.metallicRoughness  != null ? ps.metallicRoughness  : (textureTuneState.metallicRoughness || 30);
    const metallicMetalness  = ps != null && ps.metallicMetalness  != null ? ps.metallicMetalness  : (textureTuneState.metallicMetalness || 65);
    const metallicReflection = ps != null && ps.metallicReflection != null ? ps.metallicReflection : (textureTuneState.metallicReflection || 100);

    const materialFamily = normalizeMaterialFamily(ps?.materialFamily, getMaterialFamilyFromShading(shading));
    const isClear = materialFamily === 'clear' || shading === "clear" || shading === "glass";
    const isCeramicLike = materialFamily === 'ceramic' && shading === 'phong';
    const finalAlpha = isClear ? 0.92 : 1.0;

    const base = {
        color: baseC, side: THREE.DoubleSide, shadowSide: THREE.FrontSide,
        transparent: isClear,
        opacity: finalAlpha,
        depthWrite: !isClear
    };

    if (isClear) {
        return new THREE.MeshPhysicalMaterial({
            ...base,
            metalness: 0,
            roughness: Math.max(0.03, Math.min(0.35, (100 - phongRoughness) / 100)),
            envMapIntensity: Math.max(0.6, (phongReflection / 100) * (textureTuneState.highlights / 100)),
            transmission: 0.88,
            ior: 1.45,
            thickness: 0.65,
            attenuationColor: baseC.clone().lerp(new THREE.Color(0xffffff), 0.45),
            attenuationDistance: 1.6,
            clearcoat: 0.22,
            clearcoatRoughness: 0.18,
        });
    }
    if (shading === "matte") {
        return new THREE.MeshStandardMaterial({
            ...base,
            metalness: 0,
            roughness: (100 - matteRoughness) / 100,
            envMapIntensity: ((matteReflection || 0) / 100) * (textureTuneState.highlights / 100),
        });
    }
    if (shading === "phong" || shading === "clear" || shading === "glass") {
        if (isCeramicLike) {
            return new THREE.MeshPhysicalMaterial({
                ...base,
                metalness: 0,
                roughness: Math.max(0.18, Math.min(0.72, (100 - phongRoughness) / 100)),
                envMapIntensity: (phongReflection / 100) * (textureTuneState.highlights / 100) * 0.9,
                clearcoat: 0.26,
                clearcoatRoughness: 0.34,
            });
        }
        return new THREE.MeshStandardMaterial({
            ...base,
            metalness: 0,
            roughness: (100 - phongRoughness) / 100,
            envMapIntensity: (phongReflection / 100) * (textureTuneState.highlights / 100),
        });
    }
    return new THREE.MeshStandardMaterial({
        ...base,
        metalness: metallicMetalness / 100,
        roughness: (100 - metallicRoughness) / 100,
        envMapIntensity: (metallicReflection / 100) * (textureTuneState.highlights / 100),
    });
}

function stemFromFileName(name) {
    return String(name || 'model').replace(/\.stl$/i, '').trim() || 'model';
}

function isDefaultBenchyOnlyPlate() {
    return !!(
        autoLoadedDefaultBenchy
        && mesh
        && !isMultipartModel()
        && String(currentFileName || '').toLowerCase() === '3dbenchy'
        && Array.isArray(modelPartNames)
        && modelPartNames.length === 1
        && /3dbenchy\.stl$/i.test(String(modelPartNames[0] || ''))
    );
}

function getViewportOrbitModelKey() {
    const fileKey = String(currentFileName || 'model').trim().toLowerCase();
    if (!Array.isArray(modelPartNames) || !modelPartNames.length) return `${fileKey}::0`;
    const namesKey = modelPartNames.map((name) => String(name || '').trim().toLowerCase()).join('|');
    return `${fileKey}::${modelPartNames.length}::${namesKey}`;
}

function inferMultipartBaseName(names) {
    const stems = (Array.isArray(names) ? names : [])
        .map(stemFromFileName)
        .filter(Boolean);
    if (!stems.length) return 'model';
    if (stems.length === 1) return stems[0];

    let prefix = stems[0];
    for (let i = 1; i < stems.length; i++) {
        let j = 0;
        const next = stems[i];
        const max = Math.min(prefix.length, next.length);
        while (j < max && prefix[j].toLowerCase() === next[j].toLowerCase()) j += 1;
        prefix = prefix.slice(0, j);
        if (!prefix) break;
    }

    prefix = prefix.replace(/[\s_\-+([.{]+$/g, '').trim();
    if (prefix.length < 3) return stems[0];
    return prefix;
}

function getMultipartDisplayName(names) {
    const count = names?.length ?? 0;
    const base = inferMultipartBaseName(names);
    if (count <= 1) return `${base}.stl`;
    return `${base} (${count} parts).stl`;
}

function buildMultipartFileBase(names) {
    const count = names?.length ?? 0;
    const base = inferMultipartBaseName(names);
    return count > 1 ? `${base}_${count}parts` : base;
}

function truncatePartNameForUi(name, maxLength = 30) {
    const text = String(name || '').trim();
    if (!text) return '';
    const limit = Math.max(8, Math.floor(Number(maxLength) || 30));
    if (text.length <= limit) return text;
    return `${text.slice(0, Math.max(1, limit - 1)).trimEnd()}…`;
}

function isMultipartModel() {
    return Array.isArray(modelPartNames) && modelPartNames.length > 1;
}

function hasModelParts() {
    return Array.isArray(modelPartNames) && modelPartNames.length > 0;
}

function pruneBulkPartSelection() {
    if (!isMultipartModel()) {
        bulkSelectedPartIndices.clear();
        return;
    }
    const maxIndex = Math.max(0, modelPartNames.length - 1);
    const next = new Set();
    bulkSelectedPartIndices.forEach((idx) => {
        if (Number.isInteger(idx) && idx >= 0 && idx <= maxIndex) next.add(idx);
    });
    bulkSelectedPartIndices = next;
}

function getBulkSelectedPartIndices() {
    pruneBulkPartSelection();
    normalizeBulkSelectionForMode();
    return Array.from(bulkSelectedPartIndices).sort((a, b) => a - b);
}

function getEffectiveSelectedPartIndices() {
    if (!hasModelParts()) return [];
    const maxIndex = Math.max(0, modelPartNames.length - 1);
    const selected = getBulkSelectedPartIndices();
    if (selected.length) return selected;
    const fallback = Math.max(0, Math.min(modelPartSelected, maxIndex));
    return [fallback];
}

function getUiSelectedPartIndices() {
    if (!hasModelParts()) return [];
    if (!isMultipartModel()) return [Math.max(0, modelPartSelected)];
    return getBulkSelectedPartIndices();
}

function syncActivePartFromUiSelection() {
    if (!isMultipartModel()) return;
    const selected = getUiSelectedPartIndices();
    if (selected.length === 1) modelPartSelected = selected[0];
}

function setBulkPartSelectionForAll(selected) {
    if (!isMultipartModel()) {
        bulkSelectedPartIndices.clear();
        return;
    }
    if (!selected) {
        bulkSelectedPartIndices.clear();
        return;
    }
    const next = new Set();
    for (let i = 0; i < modelPartNames.length; i += 1) next.add(i);
    bulkSelectedPartIndices = next;
}

function setBulkPartSelected(index, selected) {
    if (!isMultipartModel()) return;
    const idx = parseInt(index, 10);
    if (!Number.isInteger(idx) || idx < 0 || idx >= modelPartNames.length) return;
    if (selected) bulkSelectedPartIndices.add(idx);
    else bulkSelectedPartIndices.delete(idx);
}

function normalizeBulkSelectionForMode() {
    if (!isMultipartModel()) {
        bulkSelectedPartIndices.clear();
        return;
    }
    if (rulerPartSelectMultiEnabled) return;
    const fallback = Math.max(0, Math.min(modelPartSelected, Math.max(0, modelPartNames.length - 1)));
    bulkSelectedPartIndices = new Set([fallback]);
    modelPartSelected = fallback;
}

function ensureModelPartDisplayOrder() {
    if (!Array.isArray(modelPartNames) || !modelPartNames.length) {
        modelPartDisplayOrder = [];
        return;
    }
    const count = modelPartNames.length;
    const source = Array.isArray(pendingModelPartDisplayOrder) && pendingModelPartDisplayOrder.length === count
        ? pendingModelPartDisplayOrder
        : (Array.isArray(modelPartDisplayOrder) ? modelPartDisplayOrder : []);
    const seen = new Set();
    const next = [];
    source.forEach((idx) => {
        const n = parseInt(idx, 10);
        if (!Number.isInteger(n) || n < 0 || n >= count || seen.has(n)) return;
        seen.add(n);
        next.push(n);
    });
    for (let i = 0; i < count; i += 1) {
        if (seen.has(i)) continue;
        seen.add(i);
        next.push(i);
    }
    modelPartDisplayOrder = next;
    pendingModelPartDisplayOrder = null;
}

function getOrderedPartIndices() {
    ensureModelPartDisplayOrder();
    return modelPartDisplayOrder.slice();
}

function movePartInDisplayOrder(fromIdx, toIdx) {
    ensureModelPartDisplayOrder();
    const source = modelPartDisplayOrder.indexOf(fromIdx);
    const target = modelPartDisplayOrder.indexOf(toIdx);
    if (source < 0 || target < 0 || source === target) return;
    const next = modelPartDisplayOrder.slice();
    const [moved] = next.splice(source, 1);
    next.splice(target, 0, moved);
    modelPartDisplayOrder = next;
}

function getBulkSelectionIconState(selectedCount, partCount) {
    if (!partCount || selectedCount <= 0) return 'none';
    if (selectedCount >= partCount) return 'all';
    return 'some';
}

function getBulkSelectIconSVG(state) {
    if (state === 'all') {
        return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>';
    }
    if (state === 'some') {
        return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 10H8v-2h8v2z"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"></path></svg>';
}

function getPartOptionMoreIconSVG() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="5" r="1.9" fill="currentColor"></circle><circle cx="12" cy="12" r="1.9" fill="currentColor"></circle><circle cx="12" cy="19" r="1.9" fill="currentColor"></circle></svg>';
}

function getPartVisibilityIconSVG(isHidden = false) {
    if (isHidden) {
        return '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M21.2002 20.4004L19.7998 21.7998L15.5996 17.6504C15.0165 17.8336 14.4293 17.9709 13.8379 18.0625C13.2462 18.1542 12.6333 18.2002 12 18.2002C9.48337 18.2002 7.24204 17.5039 5.27539 16.1123C3.30873 14.7206 1.88333 12.9169 1 10.7002C1.35 9.81686 1.79186 8.99564 2.3252 8.2373C2.85847 7.47911 3.46716 6.8001 4.15039 6.2002L1.40039 3.40039L2.7998 2L21.2002 20.4004ZM5.5498 7.60059C5.06659 8.03384 4.62452 8.50883 4.22461 9.02539C3.82473 9.54195 3.48346 10.1003 3.2002 10.7002C4.03349 12.3834 5.22889 13.7213 6.78711 14.7129C8.34544 15.7046 10.0833 16.2002 12 16.2002C12.3332 16.2002 12.6581 16.1793 12.9746 16.1377C13.2913 16.096 13.6169 16.05 13.9502 16L13.0498 15.0498C12.8666 15.0998 12.6919 15.1381 12.5254 15.1631C12.3587 15.1881 12.1833 15.2002 12 15.2002C10.75 15.2002 9.6875 14.7627 8.8125 13.8877C7.9375 13.0127 7.5 11.9502 7.5 10.7002C7.5 10.5169 7.51211 10.3415 7.53711 10.1748C7.56211 10.0083 7.60043 9.83357 7.65039 9.65039L5.5498 7.60059Z"></path><path fill="currentColor" d="M12 3.2002C14.5166 3.2002 16.758 3.89645 18.7246 5.28809C20.6913 6.67975 22.1167 8.48353 23 10.7002C22.6167 11.6835 22.1123 12.5958 21.4873 13.4375C20.8623 14.2792 20.1331 15.0171 19.2998 15.6504L17.8496 14.25C18.4828 13.7668 19.0455 13.2379 19.5371 12.6631C20.0288 12.0881 20.4498 11.4335 20.7998 10.7002C19.9665 9.01696 18.7711 7.67914 17.2129 6.6875C15.6546 5.69583 13.9167 5.2002 12 5.2002C11.5168 5.2002 11.0418 5.23316 10.5752 5.2998C10.1086 5.36647 9.65017 5.46726 9.2002 5.60059L7.65039 4.0498C8.33355 3.76658 9.03352 3.55472 9.75 3.41309C10.4667 3.27142 11.2167 3.2002 12 3.2002Z"></path><path fill="currentColor" d="M12 6.2002C13.25 6.2002 14.3125 6.6377 15.1875 7.5127C16.0625 8.38769 16.5 9.4502 16.5 10.7002C16.5 11.0335 16.467 11.3461 16.4004 11.6377C16.3337 11.9294 16.2329 12.2167 16.0996 12.5L14.6504 11.0498C14.8002 10.2666 14.5745 9.53378 13.9746 8.85059C13.3747 8.16736 12.6002 7.89996 11.6504 8.0498L10.2002 6.60059C10.4835 6.46725 10.7708 6.36647 11.0625 6.2998C11.3541 6.23315 11.6667 6.2002 12 6.2002Z"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 7C13.25 7 14.3125 7.4375 15.1875 8.3125C16.0625 9.1875 16.5 10.25 16.5 11.5C16.5 12.75 16.0625 13.8125 15.1875 14.6875C14.3125 15.5625 13.25 16 12 16C10.75 16 9.6875 15.5625 8.8125 14.6875C7.9375 13.8125 7.5 12.75 7.5 11.5C7.5 10.25 7.9375 9.1875 8.8125 8.3125C9.6875 7.4375 10.75 7 12 7ZM12 8.7998C11.25 8.7998 10.6129 9.06289 10.0879 9.58789C9.56289 10.1129 9.2998 10.75 9.2998 11.5C9.2998 12.25 9.56289 12.8871 10.0879 13.4121C10.6129 13.9371 11.25 14.2002 12 14.2002C12.75 14.2002 13.3871 13.9371 13.9121 13.4121C14.4371 12.8871 14.7002 12.25 14.7002 11.5C14.7002 10.75 14.4371 10.1129 13.9121 9.58789C13.3871 9.06289 12.75 8.7998 12 8.7998Z"></path><path fill="currentColor" d="M12 4C14.4333 4 16.6504 4.67878 18.6504 6.03711C20.6503 7.39544 22.1 9.2167 23 11.5C22.1 13.7833 20.6503 15.6046 18.6504 16.9629C16.6504 18.3212 14.4333 19 12 19C9.56667 19 7.34961 18.3212 5.34961 16.9629C3.34965 15.6046 1.89999 13.7833 1 11.5C1.89999 9.2167 3.34965 7.39544 5.34961 6.03711C7.34961 4.67878 9.56667 4 12 4ZM12 6C10.1167 6 8.38748 6.49567 6.8125 7.4873C5.23752 8.47896 4.03353 9.8167 3.2002 11.5C4.03353 13.1833 5.23752 14.521 6.8125 15.5127C8.38748 16.5043 10.1167 17 12 17C13.8833 17 15.6125 16.5043 17.1875 15.5127C18.7625 14.521 19.9665 13.1833 20.7998 11.5C19.9665 9.8167 18.7625 8.47896 17.1875 7.4873C15.6125 6.49567 13.8833 6 12 6Z"></path></svg>';
}

function getChevronDownIconSVG(size = 20) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"></path></svg>`;
}

function getKeyboardArrowDownIconSVG(size = 20) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="M16.6992 8C17.0659 8 17.375 8.125 17.625 8.375C17.8748 8.62491 18 8.93334 18 9.2998C18 9.66626 17.8747 9.97469 17.625 10.2246L12.9248 14.9248C12.7916 15.0581 12.6499 15.1545 12.5 15.2129C12.3501 15.2712 12.1831 15.2998 12 15.2998C11.8169 15.2998 11.6499 15.2711 11.5 15.2129C11.35 15.1546 11.2076 15.0581 11.0742 14.9248L6.375 10.2246C6.125 9.97461 6 9.66647 6 9.2998C6.00004 8.93322 6.12504 8.62496 6.375 8.375C6.62496 8.12516 6.93326 8 7.2998 8C7.66634 8.00007 7.97468 8.12507 8.22461 8.375L12 12.1504L15.7744 8.375C16.0243 8.12507 16.3327 8.00007 16.6992 8Z"></path></svg>`;
}

function getCloseIconSVG(size = 20) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="M17.7256 5.00038C18.0922 5.00873 18.4091 5.14585 18.6758 5.41249C18.9257 5.67905 19.0463 5.98747 19.0381 6.33729C19.0298 6.68729 18.9004 6.99641 18.6504 7.26307L13.9004 12.0873L18.6504 16.8627C18.9003 17.1126 19.0297 17.4166 19.0381 17.7748C19.0464 18.133 18.9256 18.4457 18.6758 18.7123C18.4091 18.9789 18.0922 19.117 17.7256 19.1254C17.3589 19.1337 17.0421 19.0043 16.7754 18.7377L12.0508 13.9379L7.27539 18.7377C7.00874 19.0043 6.69184 19.1337 6.3252 19.1254C5.95868 19.117 5.64256 18.9789 5.37598 18.7123C5.12598 18.4456 5.00436 18.1375 5.0127 17.7875C5.02107 17.4376 5.15047 17.1293 5.40039 16.8627L10.1504 12.0873L5.37598 7.26307C5.12598 6.99641 5 6.68729 5 6.33729C5.00009 5.98745 5.12607 5.67906 5.37598 5.41249C5.6425 5.14611 5.95881 5.00878 6.3252 5.00038C6.69186 4.99204 7.00872 5.12141 7.27539 5.38807L12.0508 10.1879L16.7754 5.38807C17.0421 5.12141 17.3589 4.99204 17.7256 5.00038Z"></path></svg>`;
}

let cancelBgShadeRevealAnimation = null;
let cancelBuildPlateShadeRevealAnimation = null;

function animateShadeSliderValue(slider, fromValue, toValue, onStep, onDone, durationMs = 260) {
    if (!slider) {
        if (typeof onDone === 'function') onDone();
        return () => {};
    }

    const from = Math.max(-100, Math.min(100, Number(fromValue) || 0));
    const to = Math.max(-100, Math.min(100, Number(toValue) || 0));

    let rafId = 0;
    let canceled = false;

    const finish = () => {
        if (typeof onDone === 'function') onDone();
    };

    if (Math.abs(to - from) < 0.0001) {
        slider.value = String(to);
        if (typeof onStep === 'function') onStep(to);
        finish();
        return () => {};
    }

    const start = performance.now();
    const duration = Math.max(120, Number(durationMs) || 260);

    const tick = (now) => {
        if (canceled) return;
        const t = Math.max(0, Math.min(1, (now - start) / duration));
        const eased = 1 - Math.pow(1 - t, 3);
        const nextValue = from + ((to - from) * eased);
        slider.value = String(nextValue);
        if (typeof onStep === 'function') onStep(nextValue);

        if (t < 1) {
            rafId = requestAnimationFrame(tick);
            return;
        }
        finish();
    };

    rafId = requestAnimationFrame(tick);

    return () => {
        canceled = true;
        if (rafId) cancelAnimationFrame(rafId);
    };
}

function updateAutoBgShadeControlVisibility() {
    const autoBgEnabled = !!document.getElementById('autoBgCheck')?.checked;
    const syncToModel = !autoBgEnabled && activeBgPreset === 'modelcolor';
    if (bgOpacitySlider) {
        const bgTone = syncToModel
            ? getComputedModelSyncTone(bgSyncPartIndex)
            : Math.max(-100, Math.min(100, parseInt(String(AUTO_BRIGHTNESS_RULES.background.shade), 10) || 0));
        if (syncToModel || autoBgEnabled) bgOpacitySlider.value = String(bgTone);
        syncBgShadeReadout();
        bgOpacitySlider.disabled = autoBgEnabled;
    }
    if (bgOpacitySliderLabel) bgOpacitySliderLabel.hidden = autoBgEnabled;
}

function updateBuildPlateShadeControlVisibility() {
    const autoOn = buildPlateAutoBrightnessEl
        ? !!buildPlateAutoBrightnessEl.checked
        : !!buildPlateAutoBrightnessEnabled;
    const syncToModel = !autoOn && activeBuildPlatePreset === 'modelcolor';
    buildPlateAutoBrightnessEnabled = autoOn;
    if (autoOn || syncToModel) {
        const autoShade = syncToModel
            ? getComputedModelSyncTone(buildPlateSyncPartIndex)
            : Math.max(-100, Math.min(100, parseInt(String(AUTO_BRIGHTNESS_RULES.buildPlate.shade), 10) || 0));
        buildPlateShade = autoShade;
        if (buildPlateShadeSliderEl) buildPlateShadeSliderEl.value = String(autoShade);
        syncBuildPlateShadeReadout();
    }
    if (buildPlateShadeRowEl) buildPlateShadeRowEl.hidden = autoOn;
    if (buildPlateShadeSliderEl) buildPlateShadeSliderEl.disabled = autoOn;
    syncBuildPlateShadeReadout();
    if (buildPlateAutoBrightnessEl && buildPlateAutoBrightnessEl.checked !== autoOn) {
        buildPlateAutoBrightnessEl.checked = autoOn;
    }
}

function getBulkSelectionSummaryText() {
    const total = modelPartNames.length;
    const selected = getUiSelectedPartIndices().length;
    if (!total) return '0 models';
    return `${selected}/${total} selected`;
}

function applyModelPartSelectorViewMode(mode, rerender = false) {
    modelPartSelectorViewMode = 'card';
    if (rerender) syncModelPartSelectorUI(true);
}

function maybeConfirmBgSyncChange(nextIdx) {
    if (!Number.isFinite(nextIdx) || nextIdx < 0) return false;
    if (activeBgPreset !== 'modelcolor') return true;
    if (bgSyncPartIndex === nextIdx) return true;
    return true;
}

function getModelPartEditTargetIndices() {
    if (isMultipartModel()) {
        return getEffectiveSelectedPartIndices();
    }
    return [Math.max(0, modelPartSelected)];
}

function applyToModelPartEditTargets(mutator) {
    const targets = getModelPartEditTargetIndices();
    const touched = [];
    targets.forEach((idx) => {
        const partSettings = getPartSettings(idx);
        mutator(partSettings, idx);
        if (customModelSettingsByPart && typeof customModelSettingsByPart === 'object') {
            customModelSettingsByPart[idx] = { ...partSettings };
        }
        touched.push(idx);
    });
    return touched;
}

function syncModelPartBulkUIState() {
    if (!modelPartSelectorMenu || modelPartSelectorMenu.hidden) return;
    const selectedCount = getUiSelectedPartIndices().length;
    const partCount = modelPartNames.length;
    if (modelPartSelectorText && isMultipartModel()) renderModelPartSelectorSummary();
    const multiActive = isModelPartPreviewMultiSelectActive();
    modelPartSelectorMenu.classList.toggle('is-multi-select-mode', multiActive);
    const toggleAllControl = modelPartSelectorMenu.querySelector('[data-bulk-action="toggle-all"]');
    const toggleAllWrap = toggleAllControl instanceof Element
        ? toggleAllControl.closest('.model-bulk-toggle-all')
        : null;
    if (toggleAllWrap instanceof HTMLElement) {
        toggleAllWrap.hidden = false;
        toggleAllWrap.setAttribute('aria-hidden', 'false');
    }
    if (toggleAllControl instanceof HTMLInputElement) {
        const allSelected = partCount > 0 && selectedCount >= partCount;
        const partiallySelected = selectedCount > 0 && selectedCount < partCount;
        if (multiActive) {
            toggleAllControl.checked = allSelected;
            toggleAllControl.indeterminate = partiallySelected;
        } else {
            toggleAllControl.checked = false;
            toggleAllControl.indeterminate = false;
        }
        toggleAllControl.tabIndex = 0;
        const labelText = (multiActive && allSelected) ? 'Clear selection' : 'Select all';
        toggleAllControl.title = labelText;
        toggleAllControl.setAttribute('aria-label', labelText);
    } else if (toggleAllControl) {
        const state = getBulkSelectionIconState(selectedCount, partCount);
        toggleAllControl.innerHTML = getBulkSelectIconSVG(state);
        toggleAllControl.title = selectedCount >= partCount ? 'Clear selection' : 'Select all';
        toggleAllControl.setAttribute('aria-label', toggleAllControl.title);
    }

    const selectionCountLabel = modelPartSelectorMenu.querySelector('[data-bulk-selection-count]');
    if (selectionCountLabel instanceof HTMLElement) {
        selectionCountLabel.hidden = false;
        selectionCountLabel.setAttribute('aria-hidden', 'false');
        selectionCountLabel.textContent = `${selectedCount}/${partCount} Selected`;
    }

    const multiToggle = modelPartSelectorMenu.querySelector('[data-bulk-action="toggle-multi"]');
    if (multiToggle) {
        const label = multiActive ? 'Multi-select on' : 'Multi-select off';
        multiToggle.classList.toggle('is-active', multiActive);
        multiToggle.setAttribute('aria-pressed', multiActive ? 'true' : 'false');
        multiToggle.title = label;
        multiToggle.setAttribute('aria-label', label);
        const multiToggleInput = multiToggle.querySelector('input[type="checkbox"]');
        if (multiToggleInput instanceof HTMLInputElement && multiToggleInput.checked !== multiActive) {
            multiToggleInput.checked = multiActive;
        }
        const switchState = multiToggle.querySelector('[data-bulk-switch-state]');
        if (switchState instanceof HTMLElement) {
            switchState.textContent = multiActive ? 'On' : 'Off';
        }
    }
}

function syncModelPartCheckboxStates() {
    if (!modelPartSelectorMenu || modelPartSelectorMenu.hidden) return;
    const effectiveSelection = new Set(getUiSelectedPartIndices());
    modelPartSelectorMenu.classList.toggle('has-multi-selection', effectiveSelection.size > 0);
    modelPartSelectorMenu.classList.toggle('has-empty-selection', effectiveSelection.size === 0);
    modelPartSelectorMenu.classList.toggle('is-multi-select-mode', isModelPartPreviewMultiSelectActive());
    modelPartSelectorMenu.querySelectorAll('.thumb-select-option-check-input[data-part-bulk-select]').forEach((inputEl) => {
        const idx = parseInt(inputEl.dataset.partBulkSelect || '-1', 10);
        inputEl.checked = effectiveSelection.has(idx);
    });
    modelPartSelectorMenu.querySelectorAll('.thumb-select-option').forEach((opt) => {
        const idx = parseInt(opt.dataset.partIndex || '-1', 10);
        opt.classList.toggle('is-selected', effectiveSelection.has(idx));
    });
}

function getPartActionTargetIndices(partIdx, scope = 'row') {
    const baseIdx = parseInt(partIdx, 10);
    if (!Number.isInteger(baseIdx) || baseIdx < 0) return [];
    const selected = getUiSelectedPartIndices();
    if (scope === 'selected') {
        if (selected.length > 0) return selected;
        return [baseIdx];
    }
    return [baseIdx];
}

function openSelectedPartsActionMenu(anchorEl) {
    if (!modelPartSelectorBtn || !anchorEl || !isMultipartModel()) return;
    const selected = getUiSelectedPartIndices();
    if (!selected.length) return;

    if (!modelPartSelectedActionsMenuEl) {
        modelPartSelectedActionsMenuEl = document.createElement('div');
        modelPartSelectedActionsMenuEl.className = 'part-option-actions';
        modelPartSelectedActionsMenuEl.hidden = true;
        modelPartSelectorBtn.appendChild(modelPartSelectedActionsMenuEl);
    }

    const settings = selected.map((idx) => getPartSettings(idx));
    const allHidden = settings.length > 0 && settings.every((s) => !!s?.hidden);
    const visibilityLabel = selected.length === 1 ? 'Show model' : 'Show selected models';
    const deleteLabel = selected.length === 1 ? 'Delete Model' : `Delete ${selected.length} Selected Models`;

    modelPartSelectedActionsMenuEl.innerHTML = `<button type="button" class="part-option-action part-option-action--toggle" data-part-action="visibility-toggle" data-part-index="${selected[0]}" data-part-action-scope="selected"><span>${visibilityLabel}</span><span class="option-switch${allHidden ? '' : ' is-on'}" aria-hidden="true"></span></button><button type="button" class="part-option-action part-option-action--danger" data-part-action="remove" data-part-index="${selected[0]}" data-part-action-scope="selected">${deleteLabel}</button>`;

    modelPartSelectedActionsMenuEl.querySelectorAll('.part-option-action').forEach((actionBtn) => {
        actionBtn.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            const action = actionBtn.dataset.partAction;
            const partIdx = parseInt(actionBtn.dataset.partIndex || '-1', 10);
            const scope = actionBtn.dataset.partActionScope || 'row';
            const targetPartIndices = getPartActionTargetIndices(partIdx, scope);
            if (!targetPartIndices.length) return;

            if (action === 'visibility-toggle') {
                const allTargetsHidden = targetPartIndices.every((idx) => !!getPartSettings(idx).hidden);
                targetPartIndices.forEach((targetIdx) => {
                    getPartSettings(targetIdx).hidden = !allTargetsHidden;
                });
                rebuildMeshMaterialsForCurrentShading();
                syncModelPartSelectorUI(true);
                saveSettings();
                closeModelPartActionMenus();
                return;
            }

            if (action === 'remove') {
                if (targetPartIndices.length > 1) {
                    if (!confirm(`Remove ${targetPartIndices.length} selected models?`)) return;
                    const descending = [...targetPartIndices].sort((a, b) => b - a);
                    for (const idx of descending) {
                        await removeMultipartPart(idx, { confirmRemoval: false });
                    }
                    closeModelPartActionMenus();
                    return;
                }
                await removeMultipartPart(targetPartIndices[0]);
                closeModelPartActionMenus();
            }
        });
    });

    closeModelPartActionMenus();
    modelPartSelectedActionsMenuEl.hidden = false;
    positionModelPartActionMenu(modelPartSelectedActionsMenuEl, anchorEl);
}

function setDisplayedFileName(name) {
    const safeName = String(name || 'model.stl');
    fileNameEl.textContent = safeName;
    fileNameEl.title = safeName;
}

function closeFileChipPartsMenu() {
    if (!fileChipPartsMenu) return;
    fileChipPartsMenu.hidden = true;
    if (btnFileChipExpand) btnFileChipExpand.setAttribute('aria-expanded', 'false');
}

function syncFileChipMultipartUI() {
    const multipart = isMultipartModel();
    if (btnFileChipExpand) btnFileChipExpand.hidden = !multipart;
    if (!multipart) closeFileChipPartsMenu();
}

function safeDownloadFileName(name, fallback = 'model.stl') {
    const raw = String(name || '').trim() || fallback;
    return raw.replace(/[\\/:*?"<>|]/g, '_');
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function rebuildFileChipPartsMenu() {
    if (!fileChipPartsMenu) return;
    fileChipPartsMenu.innerHTML = '';
    if (!isMultipartModel()) return;

    const canMutateFiles = !!modelPartFiles && modelPartFiles.length === modelPartNames.length;

    modelPartNames.forEach((name, idx) => {
        const row = document.createElement('div');
        row.className = 'file-chip-part-row';
        const canRemove = canMutateFiles && modelPartNames.length > 1;
        const nameEl = document.createElement('span');
        nameEl.className = 'file-chip-part-name';
        nameEl.textContent = name;
        nameEl.title = name;

        const replaceBtn = document.createElement('button');
        replaceBtn.type = 'button';
        replaceBtn.className = 'file-chip-part-btn';
        replaceBtn.dataset.action = 'replace';
        replaceBtn.dataset.partIndex = String(idx);
        replaceBtn.textContent = 'Replace';
        replaceBtn.disabled = !canMutateFiles;

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'file-chip-part-btn';
        addBtn.dataset.action = 'add';
        addBtn.dataset.partIndex = String(idx);
        addBtn.textContent = 'Add';
        addBtn.disabled = !canMutateFiles;
        addBtn.title = canMutateFiles ? 'Add one or more STL parts' : 'Part source files are unavailable for editing';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'file-chip-part-btn file-chip-part-btn--remove';
        removeBtn.dataset.action = 'remove';
        removeBtn.dataset.partIndex = String(idx);
        removeBtn.disabled = !canRemove;
        removeBtn.title = canMutateFiles ? (canRemove ? 'Remove this part' : 'A single remaining part cannot be removed here') : 'Part source files are unavailable for editing';
        removeBtn.setAttribute('aria-label', 'Remove this part');
        removeBtn.textContent = '×';

        row.append(nameEl, replaceBtn, addBtn, removeBtn);
        fileChipPartsMenu.appendChild(row);
    });
}

function createPartSettings(colorHex = colorPick.value) {
    const finishMode = finishControlGroupEl?.dataset.activeMode || getSelectedFinishMode();
    const finishValue = textureTuneRoughnessSlider
        ? clampFinishSliderValue(textureTuneRoughnessSlider.value)
        : modeStrengthToFinishSliderValue(finishMode, FINISH_MODE_DEFAULT_STRENGTH[finishMode] || 2);
    return {
        color: colorHex,
        tone: parseInt(opacitySlider ? opacitySlider.value : 0, 10) || 0,
        shading: shadingEl?.value || 'phong',
        materialFamily: getMaterialFamilyFromShading(shadingEl?.value || 'phong'),
        hidden: false,
        metallicRoughness: textureTuneState.metallicRoughness,
        metallicMetalness: textureTuneState.metallicMetalness,
        metallicReflection: textureTuneState.metallicReflection,
        phongRoughness: textureTuneState.phongRoughness,
        phongReflection: textureTuneState.phongReflection,
        matteRoughness: textureTuneState.matteRoughness,
        matteReflection: textureTuneState.matteReflection,
        finishMode,
        finishValue,
    };
}

function getPartSettings(index) {
    if (!modelPartSettings[index]) {
        modelPartSettings[index] = createPartSettings(modelPartBaseColors[index] || colorPick.value);
    }
    return modelPartSettings[index];
}

function getSelectedPartSettings() {
    return getPartSettings(modelPartSelected);
}

const FINISH_MODE_STOPS = {
    matte: [35, 25, 15],
    satin: [55, 65, 75],
    glossy: [80, 90, 98],
};
const FINISH_MODE_DEFAULT_STRENGTH = {
    matte: 2,
    satin: 2,
    glossy: 2,
};
const FINISH_MODE_ORDER = ['matte', 'satin', 'glossy'];

function clampFinishStrength(value) {
    return Math.max(1, Math.min(3, Math.round(value || 1)));
}

function clampFinishSliderValue(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 5;
    return Math.max(1, Math.min(9, num));
}

function modeStrengthToFinishSliderValue(mode, strength) {
    const idx = Math.max(0, FINISH_MODE_ORDER.indexOf(mode));
    return (idx * 3) + clampFinishStrength(strength);
}

function finishSliderValueToModeStrength(value) {
    const v = clampFinishSliderValue(value);
    const idx = Math.max(0, Math.min(FINISH_MODE_ORDER.length - 1, Math.floor((v - 1) / 3)));
    const mode = FINISH_MODE_ORDER[idx] || 'satin';
    const local = v - (idx * 3);
    const strength = fineTuningMode
        ? Math.max(1, Math.min(3, local))
        : clampFinishStrength(local);
    return { mode, strength };
}

function roughnessForModeStrength(mode, strength) {
    const stops = FINISH_MODE_STOPS[mode] || FINISH_MODE_STOPS.satin;
    const s = Math.max(1, Math.min(3, Number(strength) || 1));
    if (s <= 1) return stops[0];
    if (s >= 3) return stops[2];
    if (s <= 2) return stops[0] + (stops[1] - stops[0]) * (s - 1);
    return stops[1] + (stops[2] - stops[1]) * (s - 2);
}

function setFinishModeUI(mode) {
    finishModeButtons.forEach((btn) => {
        const active = btn.dataset.finishMode === mode;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
    const group = document.getElementById('finishControlGroup');
    if (group) group.dataset.activeMode = mode;
}

function getStoredFinishMode(settings) {
    const mode = settings?.finishMode;
    return FINISH_MODE_ORDER.includes(mode) ? mode : null;
}

function getStoredFinishSliderValue(settings) {
    if (!settings) return null;
    const raw = Number(settings.finishValue);
    return Number.isFinite(raw) ? clampFinishSliderValue(raw) : null;
}

function clearStoredFinishState(partSettings) {
    if (!partSettings) return;
    delete partSettings.finishMode;
    delete partSettings.finishValue;
}

function applyFinishModeValueToPartSettings(partSettings, finishMode, finishValue = null) {
    const mode = FINISH_MODE_ORDER.includes(finishMode) ? finishMode : getStoredFinishMode(partSettings) || 'satin';
    const normalizedValue = finishValue == null
        ? modeStrengthToFinishSliderValue(mode, FINISH_MODE_DEFAULT_STRENGTH[mode] || 2)
        : clampFinishSliderValue(finishValue);
    const { mode: resolvedMode, strength } = finishSliderValueToModeStrength(normalizedValue);
    const rough = roughnessForModeStrength(resolvedMode, strength);
    const modeBaseReflection = resolvedMode === 'matte' ? 22 : resolvedMode === 'satin' ? 40 : 62;
    const reflection = Math.max(6, Math.min(120, modeBaseReflection + ((2 - strength) * 8)));

    const currentFamily = getMaterialFamilyFromPartSettings(partSettings);
    if (currentFamily === 'standard') {
        partSettings.shading = 'phong';
    }
    partSettings.matteRoughness = rough;
    partSettings.metallicRoughness = rough;
    partSettings.phongRoughness = rough;
    partSettings.matteReflection = Math.max(4, reflection - 14);
    partSettings.phongReflection = reflection;
    partSettings.metallicReflection = Math.min(130, reflection + 10);
    partSettings.finishMode = resolvedMode;
    partSettings.finishValue = modeStrengthToFinishSliderValue(resolvedMode, strength);
    return partSettings;
}

function getFinishModeFromPartSettings(settings) {
    const storedMode = getStoredFinishMode(settings);
    if (storedMode) return storedMode;

    const shade = settings?.shading;
    if (shade === 'flat' || shade === 'toon') return 'matte';

    const selectedRough = Number(
        shade === 'metallic'
            ? (settings?.metallicRoughness ?? 62)
            : shade === 'matte'
                ? (settings?.matteRoughness ?? 62)
                : (settings?.phongRoughness ?? settings?.matteRoughness ?? settings?.metallicRoughness ?? 62)
    );
    const selectedReflection = Number(
        shade === 'metallic'
            ? (settings?.metallicReflection ?? 100)
            : shade === 'matte'
                ? (settings?.matteReflection ?? 10)
                : (settings?.phongReflection ?? settings?.matteReflection ?? settings?.metallicReflection ?? 40)
    );

    // Stored roughness sliders are inverted when mapped to Three.js roughness.
    // Lower effective roughness and higher reflection read as glossier.
    const effectiveRoughness = Math.max(0, Math.min(100, 100 - selectedRough));
    if (selectedReflection >= 120 || effectiveRoughness <= 22) return 'glossy';
    if (effectiveRoughness >= 58) return 'matte';
    return 'satin';
}

function getSelectedFinishMode() {
    const active = finishModeButtons.find((btn) => btn.classList.contains('is-active'));
    return active?.dataset.finishMode || 'satin';
}

function finishStrengthFromPartSettings(settings) {
    const mode = getFinishModeFromPartSettings(settings);
    const rough = mode === 'matte'
        ? settings.matteRoughness
        : mode === 'satin'
            ? settings.phongRoughness
            : settings.metallicRoughness;
    const stops = FINISH_MODE_STOPS[mode] || FINISH_MODE_STOPS.glossy;
    let nearest = 1;
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < stops.length; i++) {
        const d = Math.abs((rough ?? stops[0]) - stops[i]);
        if (d < best) {
            best = d;
            nearest = i + 1;
        }
    }
    return nearest;
}

function finishSliderValueFromPartSettings(settings) {
    const storedValue = getStoredFinishSliderValue(settings);
    if (storedValue != null) return storedValue;

    const mode = getFinishModeFromPartSettings(settings);
    const strength = finishStrengthFromPartSettings(settings);
    return modeStrengthToFinishSliderValue(mode, strength);
}

function updateFinishSliderVisual() {
    if (!textureTuneRoughnessSlider) return;
    const s = getSelectedPartSettings();
    const baseHex = s?.color || colorPick?.value || PALETTE.fallback;
    const matteHex = `#${computeTonedColor(baseHex, 35).getHexString()}`;
    const satinHex = `#${computeTonedColor(baseHex, 0).getHexString()}`;
    const glossHex = `#${computeTonedColor(baseHex, -35).getHexString()}`;
    textureTuneRoughnessSlider.classList.add('tone-gradient-slider');
    textureTuneRoughnessSlider.style.setProperty('--slider-fill', matteHex);
    textureTuneRoughnessSlider.style.setProperty('--slider-track-base', glossHex);
    textureTuneRoughnessSlider.style.setProperty('--slider-track-gradient', `linear-gradient(to right, ${matteHex} 0%, ${satinHex} 50%, ${glossHex} 100%)`);
}

function getShadeMaxDeltaPercent(rulePath) {
    const defaultRule = DEFAULT_COLOR_RULES[rulePath] || {};
    const jumpPercent = getColorRuleNumber(`${rulePath}.jumpPercent`, defaultRule.jumpPercent ?? 5);
    const snapCount = Math.max(3, Math.round(getColorRuleNumber(`${rulePath}.snapCount`, defaultRule.snapCount ?? 9)));
    return jumpPercent * Math.max(0, (snapCount - 1) / 2);
}


// Shade functions moved to modules/shade-system.js module
// Use ShadeSystem.blendShadeColor, etc. instead


function applyFinishControlsToSelectedPart(commit = false) {
    const defaultMode = getSelectedFinishMode();
    const defaultStrength = FINISH_MODE_DEFAULT_STRENGTH[defaultMode] || 2;
    const defaultValue = modeStrengthToFinishSliderValue(defaultMode, defaultStrength);
    const { mode, strength } = finishSliderValueToModeStrength(textureTuneRoughnessSlider?.value || defaultValue);
    const rough = roughnessForModeStrength(mode, strength);

    if (commit && textureTuneRoughnessSlider && !fineTuningMode) {
        textureTuneRoughnessSlider.value = String(modeStrengthToFinishSliderValue(mode, strength));
    }
    setFinishModeUI(mode);

    const targets = applyToModelPartEditTargets((partSettings) => {
        applyFinishModeValueToPartSettings(partSettings, mode, modeStrengthToFinishSliderValue(mode, strength));
    });
    shadingEl.value = getSelectedPartSettings().shading;
    if (textureTuneRoughnessVal) {
        const rawVal = Number(textureTuneRoughnessSlider?.value || modeStrengthToFinishSliderValue(mode, strength));
        textureTuneRoughnessVal.textContent = fineTuningMode
            ? rawVal.toFixed(1).replace(/\.0$/, '')
            : String(modeStrengthToFinishSliderValue(mode, strength));
    }
    return { mode, strength, targets };
}

function updateShadeSliderVisual() {
    if (!opacitySlider) return;
    const s = getSelectedPartSettings();
    const baseHex = s?.color || colorPick.value;
    const lightHex = `#${computeTonedColor(baseHex, -100).getHexString()}`;
    const darkHex = `#${computeTonedColor(baseHex, 100).getHexString()}`;
    opacitySlider.style.setProperty('--slider-fill', lightHex);
    opacitySlider.style.setProperty('--slider-track-base', darkHex);
    opacitySlider.style.setProperty('--slider-track-gradient', `linear-gradient(to right, ${lightHex} 0%, ${darkHex} 100%)`);
}

function updateBgShadeSliderVisual() {
    if (!bgOpacitySlider || !bgPick) return;
    const baseHex = getActiveBackgroundBaseColor();
    const lightHex = `#${computeSurfaceShadeColor(baseHex, -100).getHexString()}`;
    const darkHex = `#${computeSurfaceShadeColor(baseHex, 100).getHexString()}`;
    bgOpacitySlider.style.setProperty('--slider-fill', lightHex);
    bgOpacitySlider.style.setProperty('--slider-track-base', darkHex);
    bgOpacitySlider.style.setProperty('--slider-track-gradient', `linear-gradient(to right, ${lightHex} 0%, ${darkHex} 100%)`);
}

function syncBgShadeReadout() {
    if (!bgOpacitySlider) return;
    const tone = Math.round(getSliderEffectiveValue(bgOpacitySlider));
    const bgValEl = document.getElementById('bgOpacityVal');
    if (bgValEl) bgValEl.textContent = (tone >= 0 ? '+' : '') + tone;
    syncSliderTooltip(bgOpacitySlider);
}

function syncBuildPlateShadeReadout() {
    if (!buildPlateShadeSliderEl) return;
    const shade = Math.round(getSliderEffectiveValue(buildPlateShadeSliderEl));
    if (buildPlateShadeValEl) buildPlateShadeValEl.textContent = (shade >= 0 ? '+' : '') + shade;
    syncSliderTooltip(buildPlateShadeSliderEl);
}

function updateBuildPlateShadeSliderVisual() {
    if (!buildPlateShadeSliderEl) return;
    const baseHex = getActiveBuildPlateBaseColor();
    const lightHex = `#${computeBuildPlateShadeColor(baseHex, -100).getHexString()}`;
    const darkHex = `#${computeBuildPlateShadeColor(baseHex, 100).getHexString()}`;
    buildPlateShadeSliderEl.style.setProperty('--slider-fill', lightHex);
    buildPlateShadeSliderEl.style.setProperty('--slider-track-base', darkHex);
    buildPlateShadeSliderEl.style.setProperty('--slider-track-gradient', `linear-gradient(to right, ${lightHex} 0%, ${darkHex} 100%)`);
}

function syncUIFromSelectedPart() {
    const s = getSelectedPartSettings();
    colorPick.value = s.color || colorPick.value;
    if (opacitySlider) {
        opacitySlider.value = String(s.tone ?? 0);
        const toneVal = Math.round(getSliderEffectiveValue(opacitySlider));
        opacityVal.textContent = (toneVal >= 0 ? '+' : '') + toneVal;
        syncSliderTooltip(opacitySlider);
    }
    if (shadingEl) shadingEl.value = s.shading || shadingEl.value;

    textureTuneState.metallicRoughness = s.metallicRoughness;
    textureTuneState.metallicMetalness = s.metallicMetalness;
    textureTuneState.metallicReflection = s.metallicReflection;
    textureTuneState.phongRoughness = s.phongRoughness;
    textureTuneState.phongReflection = s.phongReflection;
    textureTuneState.matteRoughness = s.matteRoughness;
    textureTuneState.matteReflection = s.matteReflection;

    const finishMode = getFinishModeFromPartSettings(s);
    setFinishModeUI(finishMode);
    if (textureTuneRoughnessSlider) {
        textureTuneRoughnessSlider.value = String(finishSliderValueFromPartSettings(s));
        syncSliderTooltip(textureTuneRoughnessSlider);
    }
    if (textureTuneRoughnessVal && textureTuneRoughnessSlider) {
        textureTuneRoughnessVal.textContent = String(Math.round(clampFinishSliderValue(textureTuneRoughnessSlider.value)));
    }
    updateFinishSliderVisual();
    updateShadeSliderVisual();

    updateTextureTuneUI();
    updateColorSwatches();
    reconcileModelPresetFromSettings(true);
    updateModelSelection();
    updateCardResetButtonStates();
    updateModelCardSelectionVisibility();
}

// null = all parts dirty; a Set = only the indices in the set need re-rendering
let dirtyPartThumbs = null;

function queueModelPartThumbsRender(partIndices = null) {
    if (!modelPartSelectorBtn && !bgModelSyncSelectorBtn && !buildPlateModelSyncSelectorBtn) return;
    // Accumulate dirty indices. null means "all".
    if (partIndices === null) {
        dirtyPartThumbs = null;
    } else {
        const arr = Array.isArray(partIndices) ? partIndices : [partIndices];
        if (dirtyPartThumbs === null && !modelPartThumbsQueued) {
            dirtyPartThumbs = new Set();
        }
        if (dirtyPartThumbs instanceof Set) {
            arr.forEach(i => dirtyPartThumbs.add(i));
        }
    }
    if (modelPartThumbsQueued) return;
    modelPartThumbsQueued = true;
    requestAnimationFrame(() => {
        modelPartThumbsQueued = false;
        renderModelPartThumbnails();
    });
}

function shouldRenderThumbCanvas(canvasEl) {
    if (!canvasEl?.isConnected) return false;
    if (canvasEl === modelPartSelectorThumb || canvasEl === bgModelSyncSelectorThumb || canvasEl === buildPlateModelSyncSelectorThumb) {
        return true;
    }
    return canvasEl.offsetParent !== null;
}

function ensurePartThumbRenderResources() {
    const size = 512;
    if (!partThumbRenderTarget || partThumbRenderTarget.width !== size || partThumbRenderTarget.height !== size) {
        if (partThumbRenderTarget) partThumbRenderTarget.dispose();
        partThumbRenderTarget = new THREE.WebGLRenderTarget(size, size, {
            depthBuffer: true,
            stencilBuffer: false,
            samples: renderer?.capabilities?.isWebGL2 ? 4 : 0,
        });
        partThumbRenderTarget.texture.colorSpace = THREE.SRGBColorSpace;
        partThumbRenderTarget.texture.minFilter = THREE.LinearFilter;
        partThumbRenderTarget.texture.magFilter = THREE.LinearFilter;
        partThumbRenderTarget.texture.generateMipmaps = false;
    }
    if (!partThumbCamera) {
        partThumbCamera = new THREE.PerspectiveCamera(camera?.fov || 45, 1, camera?.near || 0.1, camera?.far || 5000);
    }
    if (!partThumbScratchCanvas) {
        partThumbScratchCanvas = document.createElement('canvas');
        partThumbScratchCanvas.width = size;
        partThumbScratchCanvas.height = size;
        partThumbScratchCtx = partThumbScratchCanvas.getContext('2d', { willReadFrequently: true });
    }
}

function getDefaultThumbCameraDistance() {
    const fov = partThumbCamera?.fov || camera?.fov || 45;
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    return modelRadius * Math.max(1, 1 / 1) / tanHalfFov * VIEWPORT_FIT_SCALE;
}

function getPartBounds(partIdx) {
    const cached = Array.isArray(multipartPartBounds) ? multipartPartBounds[partIdx] : null;
    if (cached?.center && Number.isFinite(cached?.radius)) {
        return {
            center: cached.center.clone(),
            radius: Math.max(0.001, cached.radius),
        };
    }

    if (!mesh?.geometry?.attributes?.position) {
        return { center: new THREE.Vector3(0, 0, 0), radius: Math.max(1, modelRadius || 1) };
    }
    const geometry = mesh.geometry;
    const posAttr = geometry.attributes.position;
    const groups = Array.isArray(geometry.groups) ? geometry.groups : [];
    const indexAttr = geometry.index;
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    let hasVertices = false;

    groups.forEach((group) => {
        if ((group?.materialIndex ?? 0) !== partIdx) return;
        const start = Math.max(0, group.start || 0);
        const end = Math.min(group.start + group.count, indexAttr ? indexAttr.count : posAttr.count);
        for (let i = start; i < end; i++) {
            const vertexIndex = indexAttr ? indexAttr.getX(i) : i;
            v.fromBufferAttribute(posAttr, vertexIndex);
            box.expandByPoint(v);
            hasVertices = true;
        }
    });

    if (!hasVertices) {
        const fallback = new THREE.Sphere();
        geometry.computeBoundingSphere();
        if (geometry.boundingSphere) fallback.copy(geometry.boundingSphere);
        return {
            center: fallback.center.clone(),
            radius: Math.max(0.001, fallback.radius || modelRadius || 1),
        };
    }

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.length() * 0.5, 0.001);
    return { center, radius };
}

function paintThumbFallback(canvasEl, partIdx) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    const resolvedPartIdx = Number.isInteger(partIdx) ? partIdx : 0;
    const fallbackHex = modelPartBaseColors[resolvedPartIdx] || colorPick?.value || PALETTE.fallback;
    const fillHex = `#${computeTonedColor(fallbackHex, 15).getHexString()}`;
    const shadeHex = `#${computeTonedColor(fallbackHex, 55).getHexString()}`;
    const glowHex = `#${computeTonedColor(fallbackHex, -35).getHexString()}`;
    const dstW = Math.max(1, canvasEl.width || 1);
    const dstH = Math.max(1, canvasEl.height || 1);
    ctx.clearRect(0, 0, dstW, dstH);
    ctx.fillStyle = fillHex;
    ctx.fillRect(0, 0, dstW, dstH);
    const r = Math.max(6, Math.floor(Math.min(dstW, dstH) * 0.38));
    const cx = Math.floor(dstW * 0.5);
    const cy = Math.floor(dstH * 0.5);
    const grad = ctx.createRadialGradient(cx - (r * 0.34), cy - (r * 0.42), Math.max(1, r * 0.2), cx, cy, r);
    grad.addColorStop(0, glowHex);
    grad.addColorStop(0.52, fillHex);
    grad.addColorStop(1, shadeHex);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
}

function renderSinglePartThumbnail(canvasEl, partIdx) {
    if (!canvasEl || !mesh || !renderer || !camera) {
        paintThumbFallback(canvasEl, 0);
        return;
    }
    const resolvedPartIdx = parseInt(partIdx, 10);
    if (!Number.isInteger(resolvedPartIdx) || resolvedPartIdx < 0 || resolvedPartIdx >= modelPartNames.length) {
        paintThumbFallback(canvasEl, 0);
        return;
    }
    const rect = canvasEl.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width || canvasEl.clientWidth || canvasEl.width || 1));
    let cssH = Math.max(1, Math.round(rect.height || canvasEl.clientHeight || canvasEl.height || 1));
    if (
        canvasEl.classList.contains('thumb-select-option-canvas')
        && canvasEl.closest('#modelPartSelectorMenu.model-selector-view--grid')
    ) {
        cssH = cssW;
    }
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const targetW = Math.max(1, Math.round(cssW * dpr));
    const targetH = Math.max(1, Math.round(cssH * dpr));
    if (canvasEl.width !== targetW || canvasEl.height !== targetH) {
        canvasEl.width = targetW;
        canvasEl.height = targetH;
    }
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    ensurePartThumbRenderResources();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const dstW = canvasEl.width;
    const dstH = canvasEl.height;
    const rtW = partThumbRenderTarget.width;
    const rtH = partThumbRenderTarget.height;
    const pixelBuf = new Uint8Array(rtW * rtH * 4);
    const mats = getMeshMaterials();
    const savedBg = scene.background;
    const savedClearColor = renderer.getClearColor(new THREE.Color());
    const savedClearAlpha = renderer.getClearAlpha();
    const savedTarget = renderer.getRenderTarget();
    const savedMeshRot = mesh.rotation.clone();
    const savedLightRigY = lightRig?.rotation?.y;
    const savedEnvRotY = scene?.environmentRotation?.y;
    const savedShadowCatcherVisible = shadowCatcher?.visible;
    const savedBuildPlateVisible = buildPlateMesh?.visible;
    const savedRulerGridVisible = rulerGridHelper?.visible;
    const savedRulerFootprintVisible = rulerFootprintHelper?.visible;
    const savedRulerHoveredPartBoxVisible = rulerHoveredPartBoxWire?.visible;
    const thumbScope = getSyncThumbScope(canvasEl);
    const syncBgHex = thumbScope ? getEffectiveSyncThumbBackgroundHex(thumbScope, resolvedPartIdx) : null;
    const saved = mats.map((m) => ({
        mat: m,
        transparent: m?.transparent,
        opacity: m?.opacity,
        depthWrite: m?.depthWrite,
        visible: typeof m?.visible === 'boolean' ? m.visible : true,
        emissiveHex: m?.emissive?.getHex?.() ?? 0,
        emissiveIntensity: m?.emissiveIntensity ?? 1,
        wireframe: m?.wireframe ?? false,
    }));

    mats.forEach((m, idx) => {
        if (!m) return;
        if (idx === resolvedPartIdx) {
            m.transparent = false;
            m.opacity = 1;
            m.depthWrite = true;
            m.visible = true;
        } else {
            m.transparent = true;
            m.opacity = 0;
            m.depthWrite = false;
            m.visible = false;
        }
        m.emissive.setHex(0x000000);
        m.emissiveIntensity = 1;
        m.wireframe = false;
        m.needsUpdate = true;
    });

    const partBounds = getPartBounds(resolvedPartIdx);
    const fov = camera.fov;
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const dist = (partBounds.radius / Math.max(0.01, tanHalfFov)) * 1.65;

    // Always render thumbnails from the imported baseline orientation.
    mesh.rotation.set(tiltBaseMeshRx, 0, 0);

    // Transform the geometry-local bounds center into world space using the baseline
    // mesh rotation (Z-up → Y-up, i.e. rotateX(-π/2)). Without this, the thumb camera
    // aims at the Z-up local position while the rendered mesh is already in Y-up world
    // space, which causes small offset parts (like a chain) to fall completely out of frame.
    const meshRotMatrix = new THREE.Matrix4().makeRotationX(tiltBaseMeshRx);
    const worldCenter = partBounds.center.clone().applyMatrix4(meshRotMatrix);

    partThumbCamera.fov = camera.fov;
    partThumbCamera.near = Math.max(0.0001, Math.min(camera.near || 0.1, dist * 0.2, partBounds.radius * 0.12));
    partThumbCamera.far = Math.max(partThumbCamera.near + 1, dist + Math.max(partBounds.radius * 6, 1));
    partThumbCamera.aspect = 1;
    partThumbCamera.up.set(0, 1, 0);
    partThumbCamera.position.set(worldCenter.x, worldCenter.y, worldCenter.z + dist);
    partThumbCamera.lookAt(worldCenter);
    partThumbCamera.updateProjectionMatrix();
    if (lightRig) lightRig.rotation.y = 0;
    if (scene?.environmentRotation) scene.environmentRotation.y = 0;
    if (shadowCatcher) shadowCatcher.visible = false;
    if (buildPlateMesh) buildPlateMesh.visible = false;
    if (rulerGridHelper) rulerGridHelper.visible = false;
    if (rulerFootprintHelper) rulerFootprintHelper.visible = false;
    if (rulerHoveredPartBoxWire) rulerHoveredPartBoxWire.visible = false;

    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(partThumbRenderTarget);
    renderer.clear(true, true, true);
    renderer.render(scene, partThumbCamera);
    renderer.readRenderTargetPixels(partThumbRenderTarget, 0, 0, rtW, rtH, pixelBuf);
    renderer.setRenderTarget(savedTarget);

    ctx.clearRect(0, 0, dstW, dstH);
    if (syncBgHex) {
        ctx.fillStyle = syncBgHex;
        ctx.fillRect(0, 0, dstW, dstH);
    }

    try {
        if (partThumbScratchCtx) {
            const imageData = partThumbScratchCtx.createImageData(rtW, rtH);
            let minX = rtW, minY = rtH, maxX = -1, maxY = -1;
            for (let y = 0; y < rtH; y++) {
                const srcRow = (rtH - 1 - y) * rtW * 4;
                const dstRow = y * rtW * 4;
                imageData.data.set(pixelBuf.subarray(srcRow, srcRow + rtW * 4), dstRow);
                for (let x = 0; x < rtW; x++) {
                    const a = pixelBuf[srcRow + (x * 4) + 3];
                    if (a > 0) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            partThumbScratchCtx.putImageData(imageData, 0, 0);

            if (maxX >= minX && maxY >= minY) {
                const w = maxX - minX + 1;
                const h = maxY - minY + 1;
                const side = Math.max(w, h);
                const pad = Math.max(4, Math.floor(side * 0.09));
                const cropSide = Math.min(Math.max(side + pad * 2, 1), rtW);
                const cx = Math.floor((minX + maxX) / 2);
                const cy = Math.floor((minY + maxY) / 2);
                let sx = Math.max(0, cx - Math.floor(cropSide / 2));
                let sy = Math.max(0, cy - Math.floor(cropSide / 2));
                if (sx + cropSide > rtW) sx = rtW - cropSide;
                if (sy + cropSide > rtH) sy = rtH - cropSide;
                ctx.drawImage(partThumbScratchCanvas, sx, sy, cropSide, cropSide, 0, 0, dstW, dstH);
            } else {
                const fallbackHex = modelPartBaseColors[resolvedPartIdx] || colorPick?.value || PALETTE.fallback;
                const fillHex = `#${computeTonedColor(fallbackHex, 15).getHexString()}`;
                const shadeHex = `#${computeTonedColor(fallbackHex, 55).getHexString()}`;
                const glowHex = `#${computeTonedColor(fallbackHex, -35).getHexString()}`;
                ctx.fillStyle = fillHex;
                ctx.fillRect(0, 0, dstW, dstH);
                const r = Math.max(6, Math.floor(Math.min(dstW, dstH) * 0.38));
                const cx2 = Math.floor(dstW * 0.5);
                const cy2 = Math.floor(dstH * 0.5);
                const grad = ctx.createRadialGradient(cx2 - (r * 0.34), cy2 - (r * 0.42), Math.max(1, r * 0.2), cx2, cy2, r);
                grad.addColorStop(0, glowHex);
                grad.addColorStop(0.52, fillHex);
                grad.addColorStop(1, shadeHex);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    } catch (_) {
        const fallbackHex = modelPartBaseColors[resolvedPartIdx] || colorPick?.value || PALETTE.fallback;
        const fillHex = `#${computeTonedColor(fallbackHex, 15).getHexString()}`;
        ctx.clearRect(0, 0, dstW, dstH);
        ctx.fillStyle = fillHex;
        ctx.fillRect(0, 0, dstW, dstH);
    }

    saved.forEach((s) => {
        if (!s?.mat) return;
        s.mat.transparent = s.transparent;
        s.mat.opacity = s.opacity;
        s.mat.depthWrite = s.depthWrite;
        s.mat.visible = s.visible;
        s.mat.emissive.setHex(s.emissiveHex);
        s.mat.emissiveIntensity = s.emissiveIntensity;
        s.mat.wireframe = s.wireframe;
        s.mat.needsUpdate = true;
    });

    scene.background = savedBg;
    renderer.setClearColor(savedClearColor, savedClearAlpha);
    renderer.setRenderTarget(savedTarget);
    mesh.rotation.copy(savedMeshRot);
    if (lightRig && Number.isFinite(savedLightRigY)) lightRig.rotation.y = savedLightRigY;
    if (scene?.environmentRotation && Number.isFinite(savedEnvRotY)) scene.environmentRotation.y = savedEnvRotY;
    if (shadowCatcher && typeof savedShadowCatcherVisible === 'boolean') shadowCatcher.visible = savedShadowCatcherVisible;
    if (buildPlateMesh && typeof savedBuildPlateVisible === 'boolean') buildPlateMesh.visible = savedBuildPlateVisible;
    if (rulerGridHelper && typeof savedRulerGridVisible === 'boolean') rulerGridHelper.visible = savedRulerGridVisible;
    if (rulerFootprintHelper && typeof savedRulerFootprintVisible === 'boolean') rulerFootprintHelper.visible = savedRulerFootprintVisible;
    if (rulerHoveredPartBoxWire && typeof savedRulerHoveredPartBoxVisible === 'boolean') rulerHoveredPartBoxWire.visible = savedRulerHoveredPartBoxVisible;
    // Live-view repaint is deferred to renderModelPartThumbnails() to avoid
    // one full-scene render per part (22 renders for 22 parts).
}

function renderMultipartSummaryThumbnail(canvasEl) {
    if (!canvasEl || !isMultipartModel()) return;
    const rect = canvasEl.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width || canvasEl.clientWidth || canvasEl.width || 1));
    const cssH = Math.max(1, Math.round(rect.height || canvasEl.clientHeight || canvasEl.height || 1));
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const targetW = Math.max(1, Math.round(cssW * dpr));
    const targetH = Math.max(1, Math.round(cssH * dpr));
    if (canvasEl.width !== targetW || canvasEl.height !== targetH) {
        canvasEl.width = targetW;
        canvasEl.height = targetH;
    }
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const selected = getUiSelectedPartIndices();
    if (selected.length === 1) {
        renderSinglePartThumbnail(canvasEl, selected[0]);
        return;
    }

    const tiles = selected.slice(0, 4);
    if (selected.length > 4) {
        tiles[3] = `+${selected.length - 3}`;
    }
    const tileCount = Math.max(1, tiles.length);
    const cols = 2;
    const rows = 2;
    const pad = Math.max(4, Math.round(canvasEl.width * 0.035));
    const gap = tileCount <= 1 ? 0 : Math.max(4, Math.round(canvasEl.width * 0.03));
    const cellW = Math.floor((canvasEl.width - pad * 2 - gap) / cols);
    const cellH = Math.floor((canvasEl.height - pad * 2 - gap) / rows);
    const tileSide = Math.max(1, Math.min(cellW, cellH));
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = tileSide;
    tempCanvas.height = tileSide;
    tempCanvas.style.width = `${tileSide}px`;
    tempCanvas.style.height = `${tileSide}px`;

    tiles.forEach((tile, tileIndex) => {
        const row = Math.floor(tileIndex / cols);
        const col = tileIndex % cols;
        const x = pad + col * (cellW + gap);
        const y = pad + row * (cellH + gap);

        ctx.fillStyle = 'rgba(245, 243, 255, 0.98)';
        ctx.strokeStyle = 'rgba(46, 43, 116, 0.88)';
        ctx.lineWidth = Math.max(2, Math.round(canvasEl.width * 0.018));
        const radius = Math.max(8, Math.round(canvasEl.width * 0.07));
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + cellW, y, x + cellW, y + cellH, radius);
        ctx.arcTo(x + cellW, y + cellH, x, y + cellH, radius);
        ctx.arcTo(x, y + cellH, x, y, radius);
        ctx.arcTo(x, y, x + cellW, y, radius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const drawX = x + Math.floor((cellW - tileSide) / 2);
        const drawY = y + Math.floor((cellH - tileSide) / 2);

        if (typeof tile === 'number') {
            renderSinglePartThumbnail(tempCanvas, tile);
            ctx.drawImage(tempCanvas, drawX, drawY, tileSide, tileSide);
        } else {
            ctx.fillStyle = PALETTE.text.partThumb;
            ctx.font = `700 ${Math.max(18, Math.round(cellW * 0.34))}px "Source Sans 3", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tile, x + cellW / 2, y + cellH / 2);
        }
    });
}

function renderModelPartThumbnails() {
    if (!modelPartThumbsWrap) return;
    const visible = hasModelParts() && !!mesh && !!renderer && !!camera;
    modelPartThumbsWrap.hidden = !visible;
    modelPartThumbsWrap.setAttribute('aria-hidden', String(!visible));
    if (!visible) return;

    if (modelPartSelectorThumb && isMultipartModel()) {
        renderMultipartSummaryThumbnail(modelPartSelectorThumb);
    }

    const dirty = dirtyPartThumbs; // snapshot; null = all
    dirtyPartThumbs = new Set(); // reset to empty (nothing newly dirty)

    let anyRendered = false;
    document.querySelectorAll('.js-part-thumb-preview').forEach((canvasEl) => {
        if (!shouldRenderThumbCanvas(canvasEl)) return;
        const idx = parseInt(canvasEl.dataset.partIndex, 10);
        if (!Number.isFinite(idx)) return;
        if (dirty !== null && !dirty.has(idx)) return; // skip clean parts
        renderSinglePartThumbnail(canvasEl, idx);
        anyRendered = true;
    });

    // Single live-view repaint after all thumbnail renders are done.
    if (anyRendered && scene && camera && !isExporting) renderer.render(scene, camera);

    if (modelPartSelectorMenu) {
        const uiSelectedIndices = new Set(getUiSelectedPartIndices());
        modelPartSelectorMenu.querySelectorAll('.thumb-select-option').forEach((opt) => {
            const idx = parseInt(opt.dataset.partIndex, 10);
            opt.classList.toggle('is-selected', uiSelectedIndices.has(idx));
        });
    }
    syncRulerHoverSelectorState();
    if (bgModelSyncSelectorMenu && activeBgPreset === 'modelcolor') {
        bgModelSyncSelectorMenu.querySelectorAll('.thumb-select-option').forEach((opt) => {
            const idx = parseInt(opt.dataset.partIndex, 10);
            opt.classList.toggle('is-selected', idx === bgSyncPartIndex);
        });
    }

    if (modelPartSelectorText) {
        renderModelPartSelectorSummary();
    }
    if (bgModelSyncSelectorText && activeBgPreset === 'modelcolor') {
        const selectedName = modelPartNames[bgSyncPartIndex] || `Part ${bgSyncPartIndex + 1}`;
        bgModelSyncSelectorText.textContent = `Sync: ${selectedName}`;
        bgModelSyncSelectorBtn.title = `Background sync: ${selectedName}`;
    }
    if (buildPlateModelSyncSelectorMenu && activeBuildPlatePreset === 'modelcolor') {
        buildPlateModelSyncSelectorMenu.querySelectorAll('.thumb-select-option').forEach((opt) => {
            const idx = parseInt(opt.dataset.partIndex, 10);
            opt.classList.toggle('is-bg-sync-source', idx === buildPlateSyncPartIndex);
        });
    }
    if (buildPlateModelSyncSelectorText && activeBuildPlatePreset === 'modelcolor') {
        const selectedName = modelPartNames[buildPlateSyncPartIndex] || `Part ${buildPlateSyncPartIndex + 1}`;
        buildPlateModelSyncSelectorText.textContent = `Sync: ${selectedName}`;
        buildPlateModelSyncSelectorBtn.title = `Surface sync: ${selectedName}`;
    }
}

function renderModelPartSelectorSummary() {
    if (!modelPartSelectorText || !modelPartSelectorBtn || !hasModelParts()) return;
    if (!isMultipartModel()) {
        updateModelCardSelectionVisibility();
        if (modelPartSelectorThumb) modelPartSelectorThumb.hidden = false;
        modelPartSelectorBtn.classList.remove('is-empty-selection');
        const selectedName = modelPartNames[modelPartSelected] || `Part ${modelPartSelected + 1}`;
        modelPartSelectorText.textContent = selectedName;
        modelPartSelectorBtn.title = selectedName;
        return;
    }

    const selectedIndices = getUiSelectedPartIndices();
    const selectedCount = selectedIndices.length;
    const totalCount = modelPartNames.length;
    updateModelCardSelectionVisibility();
    if (modelPartSelectorThumb) modelPartSelectorThumb.hidden = selectedCount === 0;
    modelPartSelectorBtn.classList.toggle('is-empty-selection', selectedCount === 0);
    const firstIndex = selectedIndices[0] ?? Math.max(0, modelPartSelected);
    const firstLabel = truncatePartNameForUi(modelPartNames[firstIndex] || `Part ${firstIndex + 1}`, 34);

    let titleText = '';
    if (selectedCount === 0) {
        titleText = 'No parts selected';
    } else {
        titleText = firstLabel;
    }

    const summaryText = `${selectedCount} of ${totalCount} selected`;

    modelPartSelectorText.textContent = '';

    const titleEl = document.createElement('span');
    titleEl.className = 'thumb-select-summary-title';
    titleEl.textContent = titleText;

    const metaEl = document.createElement('span');
    metaEl.className = 'thumb-select-summary-meta';

    const countEl = document.createElement('span');
    countEl.className = 'thumb-select-summary-count';
    countEl.textContent = summaryText;
    metaEl.append(countEl);
    modelPartSelectorText.append(titleEl, metaEl);
    modelPartSelectorBtn.title = `${titleText} - ${summaryText}`;
}

function closeThumbSelectMenus() {
    closeThumbSelectMenusByMode({ includeModelSelector: true });
}

function isModelPartFloatingCardOpen() {
    return isModelPartFloatingCardOpenController({ modelPartSelectorMenu });
}

function shouldUseFloatingModelPartSelector() {
    return shouldUseFloatingModelPartSelectorController({
        isMultipartModel,
        windowRef: window,
        minDesktopWidth: 900,
    });
}

function closeModelPartSelectorMenu(force = false) {
    return closeModelPartSelectorMenuController({
        force,
        modelPartSelectorMenu,
        modelPartSelectorBtn,
        isModelPartFloatingCardOpen,
        rulerPartSelectMultiEnabled,
        setRulerPartSelectMultiEnabled,
        setModelPartSelectorClosedByUser: (value) => { modelPartSelectorClosedByUser = !!value; },
        setModelPartMenuDragState: (value) => { _modelPartMenuDragState = value; },
        applyPartInteractionVisualsToMeshMaterials,
        syncRulerHoverSelectorState,
        updateRulerHUD,
    });
}

function closeThumbSelectMenusByMode(options = {}) {
    closeThumbSelectMenusByModeController({
        includeModelSelector: options.includeModelSelector !== false,
        closeModelPartSelectorMenu,
        bgModelSyncSelectorMenu,
        bgModelSyncSelectorBtn,
        buildPlateModelSyncSelectorMenu,
        buildPlateModelSyncSelectorBtn,
        resetSyncMenuFloatingStyle,
        closeModelPartActionMenus,
    });
}

function closeModelPartActionMenus() {
    if (activeModelPartActionMenuEl
        && _modelPartActionMenuOriginalParent
        && activeModelPartActionMenuEl.parentElement === document.body) {
        _modelPartActionMenuOriginalParent.appendChild(activeModelPartActionMenuEl);
    }
    _modelPartActionMenuOriginalParent = null;
    closeModelPartActionMenusModule({ modelPartSingleMenuBtn });
    activeModelPartActionMenuEl = null;
    activeModelPartActionAnchorEl = null;
}

function positionModelPartActionMenu(menuEl, anchorEl) {
    activeModelPartActionMenuEl = menuEl || null;
    activeModelPartActionAnchorEl = anchorEl || null;
    // Portal to body to escape any backdrop-filter/transform containing block on the floating panel.
    if (menuEl && menuEl.parentElement !== document.body) {
        _modelPartActionMenuOriginalParent = menuEl.parentElement || null;
        document.body.appendChild(menuEl);
    }
    positionModelPartActionMenuModule({
        menuEl,
        anchorEl,
        modelPartSelectorMenu,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
    });
}

function refreshModelPartActionMenuPosition() {
    const menuEl = activeModelPartActionMenuEl;
    const anchorEl = activeModelPartActionAnchorEl;
    if (!menuEl || !anchorEl) return;
    if (menuEl.hidden) {
        activeModelPartActionMenuEl = null;
        activeModelPartActionAnchorEl = null;
        return;
    }
    if (!menuEl.isConnected || !anchorEl.isConnected) {
        closeModelPartActionMenus();
        return;
    }
    if (modelPartSelectorMenu?.hidden && modelPartSelectorMenu?.contains(anchorEl)) {
        closeModelPartActionMenus();
        return;
    }
    positionModelPartActionMenuModule({
        menuEl,
        anchorEl,
        modelPartSelectorMenu,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
    });
}

function positionThumbSelectMenu(menuEl, anchorBtn) {
    if (!menuEl || !anchorBtn) return;
    if (menuEl === modelPartSelectorMenu) {
        const floatingDesktopMenu = shouldUseFloatingModelPartSelector();
        if (floatingDesktopMenu) {
            positionFloatingModelPartSelectorMenu(anchorBtn);
            return;
        }
        menuEl.classList.remove('thumb-select-menu--floating-card');
        const floatingHeader = menuEl.querySelector('.model-selector-floating-header');
        if (floatingHeader) floatingHeader.remove();
        menuEl.style.left = '';
        menuEl.style.top = '';
        menuEl.style.right = '';
        menuEl.style.bottom = '';
        menuEl.style.width = '';
        menuEl.style.height = '';
        menuEl.style.maxHeight = '';
    }
    const gap = 8;
    const viewportPad = 12;
    const minPanelHeight = 170;
    const btnRect = anchorBtn.getBoundingClientRect();
    const spaceBelow = Math.max(0, window.innerHeight - btnRect.bottom - viewportPad - gap);
    const spaceAbove = Math.max(0, btnRect.top - viewportPad - gap);
    const openAbove = spaceBelow < minPanelHeight && spaceAbove > spaceBelow;
    const available = Math.max(140, Math.floor((openAbove ? spaceAbove : spaceBelow)));
    menuEl.classList.toggle('thumb-select-menu--above', openAbove);
    menuEl.style.maxHeight = `${available}px`;
}

function resetSyncMenuFloatingStyle(menuEl) {
    resetSyncMenuFloatingStyleController(menuEl);
}

function positionSyncMenuAtAnchor(menuEl, anchorEl) {
    positionSyncMenuAtAnchorController({
        menuEl,
        anchorEl,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
    });
}

function resolveBgModelSyncAnchorEl() {
    return resolveModelSyncAnchorController({
        explicitAnchorEl: bgModelSyncMenuAnchorEl,
        fallbackAnchorId: 'bg-preset-modelcolor',
        fallbackBtn: bgModelSyncSelectorBtn,
        documentRef: document,
    });
}

function resolveBuildPlateModelSyncAnchorEl() {
    return resolveModelSyncAnchorController({
        explicitAnchorEl: buildPlateModelSyncMenuAnchorEl,
        fallbackAnchorId: 'build-plate-preset-modelcolor',
        fallbackBtn: buildPlateModelSyncSelectorBtn,
        documentRef: document,
    });
}

function openBgModelSyncMenu(anchorEl = null) {
    openSyncSourceMenuController({
        menuEl: bgModelSyncSelectorMenu,
        selectorBtn: bgModelSyncSelectorBtn,
        anchorEl,
        setAnchorEl: (value) => { bgModelSyncMenuAnchorEl = value; },
        resolveAnchorEl: resolveBgModelSyncAnchorEl,
        closeThumbSelectMenus,
        positionSyncMenuAtAnchor,
        queueModelPartThumbsRender,
    });
}

function openBuildPlateModelSyncMenu(anchorEl = null) {
    openSyncSourceMenuController({
        menuEl: buildPlateModelSyncSelectorMenu,
        selectorBtn: buildPlateModelSyncSelectorBtn,
        anchorEl,
        setAnchorEl: (value) => { buildPlateModelSyncMenuAnchorEl = value; },
        resolveAnchorEl: resolveBuildPlateModelSyncAnchorEl,
        closeThumbSelectMenus,
        positionSyncMenuAtAnchor,
        queueModelPartThumbsRender,
    });
}

function ensureModelPartFloatingHeader() {
    return ensureModelPartFloatingHeaderController({
        modelPartSelectorMenu,
        getCloseIconSVG,
        closeModelPartSelectorMenu,
        shouldUseFloatingModelPartSelector,
        setModelPartMenuDragState: (value) => { _modelPartMenuDragState = value; },
    });
}

function clampModelPartSelectorMenuPosition(left, top) {
    return clampModelPartSelectorMenuPositionController({
        modelPartSelectorMenu,
        left,
        top,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        pad: 8,
        minVisibleHeight: 220,
    });
}

function setModelPartSelectorMenuPosition(left, top, persist = true) {
    setModelPartSelectorMenuPositionController({
        modelPartSelectorMenu,
        left,
        top,
        persist,
        clampModelPartSelectorMenuPosition,
        storage: localStorage,
        storageKey: MODEL_PART_MENU_POS_STORAGE_KEY,
        viewportHeight: window.innerHeight,
    });
    refreshModelPartActionMenuPosition();
}

function restoreModelPartSelectorMenuPosition() {
    return restoreModelPartSelectorMenuPositionController({
        modelPartSelectorMenu,
        storage: localStorage,
        storageKey: MODEL_PART_MENU_POS_STORAGE_KEY,
        setModelPartSelectorMenuPosition,
    });
}

function positionFloatingModelPartSelectorMenu(anchorBtn) {
    positionFloatingModelPartSelectorMenuController({
        modelPartSelectorMenu,
        anchorBtn,
        ensureModelPartFloatingHeader,
        restoreModelPartSelectorMenuPosition,
        setModelPartSelectorMenuPosition,
    });
}

function initializeModelPartSelectorMenuDrag() {
    initializeModelPartSelectorMenuDragController({
        windowRef: window,
        getModelPartMenuDragState: () => _modelPartMenuDragState,
        setModelPartMenuDragState: (value) => { _modelPartMenuDragState = value; },
        modelPartSelectorMenu,
        setModelPartSelectorMenuPosition,
    });
}

initializeModelPartSelectorMenuDrag();

function trapMenuWheelScroll(menuEl) {
    if (!menuEl || menuEl.dataset.wheelTrapBound === '1') return;
    menuEl.dataset.wheelTrapBound = '1';

    const resolveScrollTarget = (startEl) => {
        let el = startEl;
        while (el && el !== document.body) {
            if (el.scrollHeight > el.clientHeight + 1) return el;
            el = el.parentElement;
        }
        return null;
    };

    menuEl.addEventListener('wheel', (ev) => {
        const deltaY = Number(ev.deltaY) || 0;
        if (!deltaY) return;

        const rawTarget = ev.target instanceof Element ? ev.target : menuEl;
        const scrollTarget = resolveScrollTarget(rawTarget) || resolveScrollTarget(menuEl);
        if (!scrollTarget) return;

        const maxScroll = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight);
        if (maxScroll <= 0) return;

        const prev = scrollTarget.scrollTop;
        const next = Math.max(0, Math.min(maxScroll, prev + deltaY));
        scrollTarget.scrollTop = next;
        if (next !== prev || (deltaY < 0 && prev <= 0) || (deltaY > 0 && prev >= maxScroll)) {
            ev.preventDefault();
        }
        ev.stopPropagation();
    }, { passive: false });
}

modelPartSelectorBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (modelPartSelectorBtn.classList.contains('is-static')) {
        // In single-model mode the static selector button spans the card and can
        // sit under the 3-dot action menu; treat clicks as backdrop dismisses.
        closeModelPartActionMenus();
        return;
    }
    const open = modelPartSelectorMenu && !modelPartSelectorMenu.hidden;
    if (open) {
        closeModelPartSelectorMenu(true);
        return;
    }
    modelPartSelectorClosedByUser = false;
    closeThumbSelectMenus();
    if (modelPartSelectorMenu && !open) {
        modelPartSelectorMenu.hidden = false;
        positionThumbSelectMenu(modelPartSelectorMenu, modelPartSelectorBtn);
        modelPartSelectorMenu.scrollTop = 0;
        modelPartSelectorBtn.setAttribute('aria-expanded', 'true');
        syncModelPartCheckboxStates();
        syncModelPartBulkUIState();
        applyPartInteractionVisualsToMeshMaterials();
        syncRulerHoverSelectorState();
        updateRulerHUD();
        queueModelPartThumbsRender();
    }
});

modelPartSingleMenuBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const menu = modelPartSingleActions;
    if (!menu) return;
    const willOpen = !!menu.hidden;
    closeThumbSelectMenusByMode({ includeModelSelector: false });
    if (!willOpen) return;
    menu.hidden = false;
    positionModelPartActionMenu(menu, ev.currentTarget);
    modelPartSingleMenuBtn.setAttribute('aria-expanded', 'true');
});

modelPartAddNextBtn?.addEventListener('click', () => {
    if (modelPartAddNextBtn.disabled) return;
    partAppendInput?.click();
});

bgModelSyncSelectorBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    openBgModelSyncMenu(bgModelSyncSelectorBtn);
});

bgModelSyncSelectorThumb?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    openBgModelSyncMenu(resolveBgModelSyncAnchorEl());
});

buildPlateModelSyncSelectorBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    openBuildPlateModelSyncMenu(buildPlateModelSyncSelectorBtn);
});

buildPlateModelSyncSelectorThumb?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    openBuildPlateModelSyncMenu(resolveBuildPlateModelSyncAnchorEl());
});

[modelPartSelectorMenu, bgModelSyncSelectorMenu, buildPlateModelSyncSelectorMenu].forEach((menuEl) => {
    trapMenuWheelScroll(menuEl?.querySelector?.('.model-selector-items') || menuEl);
});

modelPartSelectorMenu?.addEventListener('scroll', () => {
    refreshModelPartActionMenuPosition();
}, true);

window.addEventListener('resize', () => {
    if (modelPartSelectorMenu && !modelPartSelectorMenu.hidden && modelPartSelectorBtn) {
        positionThumbSelectMenu(modelPartSelectorMenu, modelPartSelectorBtn);
    } else if (modelPartSelectorMenu) {
        modelPartSelectorMenu.classList.remove('thumb-select-menu--floating-card');
        const floatingHeader = modelPartSelectorMenu.querySelector('.model-selector-floating-header');
        if (floatingHeader) floatingHeader.remove();
        modelPartSelectorMenu.style.left = '';
        modelPartSelectorMenu.style.top = '';
        modelPartSelectorMenu.style.right = '';
        modelPartSelectorMenu.style.bottom = '';
        modelPartSelectorMenu.style.width = '';
        modelPartSelectorMenu.style.height = '';
        modelPartSelectorMenu.style.maxHeight = '';
    }
    if (bgModelSyncSelectorMenu && !bgModelSyncSelectorMenu.hidden) {
        const bgAnchor = resolveBgModelSyncAnchorEl();
        if (bgAnchor) positionSyncMenuAtAnchor(bgModelSyncSelectorMenu, bgAnchor);
    }
    if (buildPlateModelSyncSelectorMenu && !buildPlateModelSyncSelectorMenu.hidden) {
        const buildPlateAnchor = resolveBuildPlateModelSyncAnchorEl();
        if (buildPlateAnchor) positionSyncMenuAtAnchor(buildPlateModelSyncSelectorMenu, buildPlateAnchor);
    }
});

document.addEventListener('click', (ev) => {
    if (isModelPartPreviewMultiSelectActive() && ev.target === canvas) return;
    const target = ev.target;
    if (!(target instanceof Node)) return;

    const clickedModelSelector = !!(
        modelPartSelectorMenu?.contains(target)
        || modelPartSelectorBtn?.contains(target)
    );
    const clickedBgSync = !!(
        bgModelSyncSelectorMenu?.contains(target)
        || bgModelSyncSelectorBtn?.contains(target)
        || bgModelSyncSelectorThumb?.contains(target)
    );
    const clickedBuildPlateSync = !!(
        buildPlateModelSyncSelectorMenu?.contains(target)
        || buildPlateModelSyncSelectorBtn?.contains(target)
        || buildPlateModelSyncSelectorThumb?.contains(target)
    );

    if (shouldCloseFloatingModelSelectorOnSingleClickController({
        target: target instanceof Element ? target : null,
        clickedModelSelector,
        isModelPartFloatingCardOpen,
    })) {
        closeModelPartSelectorMenu(true);
    }

    if (!clickedBgSync && bgModelSyncSelectorMenu) {
        bgModelSyncSelectorMenu.hidden = true;
        resetSyncMenuFloatingStyle(bgModelSyncSelectorMenu);
        if (bgModelSyncSelectorBtn) bgModelSyncSelectorBtn.setAttribute('aria-expanded', 'false');
    }
    if (!clickedBuildPlateSync && buildPlateModelSyncSelectorMenu) {
        buildPlateModelSyncSelectorMenu.hidden = true;
        resetSyncMenuFloatingStyle(buildPlateModelSyncSelectorMenu);
        if (buildPlateModelSyncSelectorBtn) buildPlateModelSyncSelectorBtn.setAttribute('aria-expanded', 'false');
    }
    closeFileChipPartsMenu();
    if (target instanceof Element) {
        const actionMenuEl = target.closest('.part-option-actions');
        const clickedActionToggle = !!target.closest('[data-part-more], #modelPartSingleMenuBtn');
        const clickedActionButton = !!target.closest('.part-option-action');
        // Clicking menu backdrop/padding should dismiss it, especially when the
        // menu overlaps the model card area.
        const clickedActionMenuBackdrop = !!actionMenuEl && !clickedActionButton;
        if (!actionMenuEl && !clickedActionToggle) {
            closeModelPartActionMenus();
        } else if (clickedActionMenuBackdrop) {
            closeModelPartActionMenus();
        }
    } else {
        closeModelPartActionMenus();
    }
});

window.addEventListener('resize', () => {
    refreshModelPartActionMenuPosition();
    closeModelPartActionMenus();
});

window.addEventListener('scroll', () => {
    closeModelPartActionMenus();
}, true);

document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModelPartActionMenus();
});

fileChipEl?.addEventListener('click', (ev) => {
    ev.stopPropagation();
});

function applyPresetIntoPartSettings(partSettings, presetUrlSettings, presetId = null) {
    partSettings.color = presetUrlSettings.color || partSettings.color;
    const hasExplicitFinish = presetUrlSettings.textureTuneFinishMode != null || presetUrlSettings.textureTuneFinishValue != null;
    const hasLegacyMaterialAppearance =
        presetUrlSettings.materialFamily != null ||
        presetUrlSettings.shading != null ||
        presetUrlSettings.textureTuneMetallicRoughness != null ||
        presetUrlSettings.textureTuneMetallicMetalness != null ||
        presetUrlSettings.textureTuneMetallicReflection != null ||
        presetUrlSettings.textureTunePhongRoughness != null ||
        presetUrlSettings.textureTunePhongReflection != null ||
        presetUrlSettings.textureTuneMatteRoughness != null ||
        presetUrlSettings.textureTuneMatteReflection != null;
    if (!hasExplicitFinish && hasLegacyMaterialAppearance) {
        clearStoredFinishState(partSettings);
    }
    if (presetUrlSettings.materialFamily != null) {
        partSettings.materialFamily = normalizeMaterialFamily(presetUrlSettings.materialFamily, 'standard');
        partSettings.shading = getShadingForMaterialFamily(partSettings.materialFamily, partSettings.shading || shadingEl?.value || 'phong');
    } else if (presetUrlSettings.shading) {
        const sh = presetUrlSettings.shading;
        partSettings.shading = (sh === 'flat' || sh === 'toon') ? 'matte' : sh;
        partSettings.materialFamily = getMaterialFamilyFromShading(partSettings.shading || 'phong');
    }
    if (presetId === 'ceramic' && partSettings.shading === 'phong') {
        partSettings.materialFamily = 'ceramic';
    } else if (presetId === 'glass' || presetId === 'clear') {
        partSettings.materialFamily = 'clear';
    } else if (!partSettings.materialFamily) {
        partSettings.materialFamily = getMaterialFamilyFromShading(partSettings.shading || shadingEl?.value || 'phong');
    }
    {
        const explicitTone = presetUrlSettings.tone != null ? parseInt(presetUrlSettings.tone, 10) : NaN;
        if (presetId) {
            // Model default table is authoritative when present; URL op is fallback only.
            const configuredTone = getModelPresetDefaultTone(presetId, null);
            const parsedConfiguredTone = parseInt(String(configuredTone), 10);
            if (Number.isFinite(parsedConfiguredTone)) {
                partSettings.tone = Math.max(-100, Math.min(100, parsedConfiguredTone));
            } else if (Number.isFinite(explicitTone)) {
                partSettings.tone = Math.max(-100, Math.min(100, explicitTone));
            } else if (!Number.isFinite(Number(partSettings.tone))) {
                partSettings.tone = 0;
            }
        } else if (Number.isFinite(explicitTone)) {
            partSettings.tone = Math.max(-100, Math.min(100, explicitTone));
        } else if (!Number.isFinite(Number(partSettings.tone))) {
            partSettings.tone = 0;
        }
    }
    if (presetUrlSettings.textureTuneMetallicRoughness != null) partSettings.metallicRoughness = Number(presetUrlSettings.textureTuneMetallicRoughness);
    if (presetUrlSettings.textureTuneMetallicMetalness != null) partSettings.metallicMetalness = Number(presetUrlSettings.textureTuneMetallicMetalness);
    if (presetUrlSettings.textureTuneMetallicReflection != null) partSettings.metallicReflection = Number(presetUrlSettings.textureTuneMetallicReflection);
    if (presetUrlSettings.textureTunePhongRoughness != null) partSettings.phongRoughness = Number(presetUrlSettings.textureTunePhongRoughness);
    if (presetUrlSettings.textureTunePhongReflection != null) partSettings.phongReflection = Number(presetUrlSettings.textureTunePhongReflection);
    if (presetUrlSettings.textureTuneMatteRoughness != null) partSettings.matteRoughness = Number(presetUrlSettings.textureTuneMatteRoughness);
    if (presetUrlSettings.textureTuneMatteReflection != null) partSettings.matteReflection = Number(presetUrlSettings.textureTuneMatteReflection);
    const partMaterialFamily = normalizeMaterialFamily(
        partSettings.materialFamily,
        getMaterialFamilyFromShading(partSettings.shading || shadingEl?.value || 'phong')
    );
    if (partMaterialFamily !== 'standard') {
        clearStoredFinishState(partSettings);
    }
    if (hasExplicitFinish && partMaterialFamily === 'standard') {
        applyFinishModeValueToPartSettings(
            partSettings,
            presetUrlSettings.textureTuneFinishMode,
            presetUrlSettings.textureTuneFinishValue
        );
    }
}

function hasExplicitUrlModelAppearanceParams(params = new URLSearchParams(location.search)) {
    return [
        'c', 'op', 'mf', 'sh', 'amp',
        'tl', 'tc', 'thi', 'ts', 'tsa', 'tll', 'tsh',
        'tmr', 'tmm', 'tme', 'tpr', 'tpe', 'tcr', 'tce',
        'tfm', 'tfv'
    ].some((key) => params.has(key));
}

function applyPendingUrlModelAppearanceOverride() {
    if (!pendingUrlModelAppearanceOverride || !Array.isArray(modelPartSettings) || !modelPartSettings.length) return;

    const override = pendingUrlModelAppearanceOverride;
    modelPartSettings = modelPartSettings.map((settings, idx) => {
        const color = modelPartBaseColors[idx] || settings?.color || colorPick.value;
        const next = { ...createPartSettings(color), ...settings, color };
        applyPresetIntoPartSettings(next, override);
        modelPartBaseColors[idx] = next.color || modelPartBaseColors[idx] || colorPick.value;
        return next;
    });

    if (override.activeModelPreset) activeModelPreset = override.activeModelPreset;
}

function getMeshMaterials() {
    if (!mesh || !mesh.material) return [];
    return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function disposeMaterials(materialLike) {
    if (!materialLike) return;
    const mats = Array.isArray(materialLike) ? materialLike : [materialLike];
    mats.forEach(mat => {
        try { mat?.dispose?.(); } catch (e) { }
    });
}

// Wrapper functions for shade system (module exported functions)
// These maintain the original script.js interface while delegating to modules/shade-system.js
function blendShadeColor(baseHex, shadeVal, maxDeltaPercent) {
    return ShadeSystem.blendShadeColor(baseHex, shadeVal, maxDeltaPercent);
}

function computeTonedColor(baseHex, toneVal) {
    const maxDelta = getShadeMaxDeltaPercent('modelShade');
    return ShadeSystem.computeTonedColor(baseHex, toneVal, maxDelta);
}

function computeSurfaceShadeColor(baseHex, shadeVal) {
    const maxDelta = getShadeMaxDeltaPercent('surfaceShade');
    return ShadeSystem.computeSurfaceShadeColor(baseHex, shadeVal, maxDelta);
}

function computeBuildPlateShadeColor(baseHex, shadeVal) {
    const maxDelta = getShadeMaxDeltaPercent('surfaceShade');
    return ShadeSystem.computeBuildPlateShadeColor(baseHex, shadeVal, maxDelta);
}

function computeBuildPlateAutoBrightnessColor(baseHex) {
    return ShadeSystem.computeBuildPlateAutoBrightnessColor(baseHex);
}

function syncDevModeToggleUI() {
    document.documentElement.classList.toggle('dev-mode', !!devModeEnabled);
    if (devModeToggleEl) devModeToggleEl.checked = !!devModeEnabled;
    if (devModeToggleModalEl) devModeToggleModalEl.checked = !!devModeEnabled;
    if (fpsReadoutEl) {
        fpsReadoutEl.hidden = !devModeEnabled;
        if (devModeEnabled && !fpsReadoutEl.textContent) fpsReadoutEl.textContent = 'FPS --';
    }
}

function setDevModeEnabled(enabled, persist = true) {
    devModeEnabled = !!enabled;
    document.documentElement.classList.toggle('dev-mode', devModeEnabled);
    if (!devModeEnabled) {
        fpsSampleAccumMs = 0;
        fpsSampleFrames = 0;
        if (fpsReadoutEl) fpsReadoutEl.textContent = '';
    }
    syncDevModeToggleUI();
    if (persist) saveSettings();
}

function updateFpsReadout(deltaSec) {
    if (!devModeEnabled || !fpsReadoutEl) return;
    const deltaMs = Math.max(0, Math.min(250, (Number(deltaSec) || 0) * 1000));
    fpsSampleAccumMs += deltaMs;
    fpsSampleFrames += 1;
    if (fpsSampleAccumMs < 300) return;
    const fps = (fpsSampleFrames * 1000) / Math.max(1, fpsSampleAccumMs);
    fpsReadoutEl.textContent = `FPS ${fps.toFixed(1)}`;
    fpsSampleAccumMs = 0;
    fpsSampleFrames = 0;
}


function getRulerInteractionMode() {
    if (!hasModelParts()) return null;
    if (isModelPartSelectorMenuOpen() || rulerPartSelectMultiEnabled || getUiSelectedPartIndices().length === 0) return 'select';
    return null;
}

function isModelPartSelectorMenuOpen() {
    return !!(modelPartSelectorMenu && !modelPartSelectorMenu.hidden && isMultipartModel());
}

function isModelPartPreviewMultiSelectActive() {
    return isModelPartSelectorMenuOpen() && rulerPartSelectMultiEnabled;
}

function isModelPartPreviewHoverSelectionActive() {
    return isModelPartSelectorMenuOpen() || rulerPartHoverEnabled || isMultipartModel();
}

function updateModelCardSelectionVisibility() {
    const hideControls = isMultipartModel() && getUiSelectedPartIndices().length === 0;
    if (quickPresetsBar) quickPresetsBar.hidden = hideControls;
    if (modelCardSliders) modelCardSliders.hidden = hideControls;
}

function getRulerInteractionModeVerb(mode = getRulerInteractionMode()) {
    if (mode === 'select') return 'selecting';
    return '';
}

function getPartInteractionVisualProfile(mode, stateKey, fallbackOpacityPercent, fallbackSaturationPercent) {
    const defaultStateRule = DEFAULT_COLOR_RULES.partInteractionModes?.[mode]?.[stateKey] || {};
    const opacityPercent = getColorRuleNumber(
        `partInteractionModes.${mode}.${stateKey}.opacityPercent`,
        defaultStateRule.opacityPercent ?? fallbackOpacityPercent
    );
    const saturationPercent = getColorRuleNumber(
        `partInteractionModes.${mode}.${stateKey}.saturationPercent`,
        defaultStateRule.saturationPercent ?? fallbackSaturationPercent
    );
    return {
        opacity: THREE.MathUtils.clamp(opacityPercent / 100, 0, 1),
        saturation: THREE.MathUtils.clamp(saturationPercent / 100, 0, 1),
    };
}

function getPartInteractionVisualState(partIndex, selectedSet) {
    const mode = getRulerInteractionMode();
    if (!mode) return { opacity: 1, saturation: 1 };
    if (mode === 'select') return { opacity: 1, saturation: 1 };

    const hasHoverTarget = !!(
        hasModelParts()
        && rulerHoveredPartIndex >= 0
        && rulerHoveredPartIndex < modelPartNames.length
    );
    const isHovered = hasHoverTarget && rulerHoveredPartIndex === partIndex;

    const isSelected = !!selectedSet?.has(partIndex);
    let visual;
    if (isSelected && isHovered) {
        visual = getPartInteractionVisualProfile('select', 'hoveredSelected', 100, 100);
    } else if (isSelected) {
        visual = getPartInteractionVisualProfile('select', 'selected', 100, 100);
    } else if (isHovered) {
        visual = getPartInteractionVisualProfile('select', 'hoveredUnselected', 75, 25);
    } else {
        visual = getPartInteractionVisualProfile('select', 'base', 25, 25);
    }

    // Keep geometry fully opaque in list/card selection workflows.
    return { ...visual, opacity: 1 };
}

function applyPartInteractionVisualsToMeshMaterials() {
    const mats = getMeshMaterials();
    if (!mats.length) return;

    const selectedSet = (getRulerInteractionMode() === 'select')
        ? new Set(getUiSelectedPartIndices())
        : null;
    const hsl = { h: 0, s: 0, l: 0 };

    mats.forEach((mat, idx) => {
        if (!mat) return;

        if (!mat.userData.partVisualBaseInitialized) {
            mat.userData.partVisualBaseInitialized = true;
            mat.userData.partVisualBaseOpacity = Number.isFinite(mat.opacity) ? mat.opacity : 1;
            mat.userData.partVisualBaseTransparent = !!mat.transparent;
            mat.userData.partVisualBaseDepthWrite = (typeof mat.depthWrite === 'boolean') ? mat.depthWrite : true;
        }

        const visual = getPartInteractionVisualState(idx, selectedSet);
        const baseOpacity = Number.isFinite(mat.userData.partVisualBaseOpacity)
            ? mat.userData.partVisualBaseOpacity
            : 1;
        const targetOpacity = THREE.MathUtils.clamp(baseOpacity * visual.opacity, 0, 1);

        mat.opacity = targetOpacity;
        mat.transparent = !!mat.userData.partVisualBaseTransparent || targetOpacity < (baseOpacity - 1e-4) || targetOpacity < 0.999;
        if (typeof mat.userData.partVisualBaseDepthWrite === 'boolean') {
            mat.depthWrite = mat.transparent ? false : mat.userData.partVisualBaseDepthWrite;
        }

        if (mat.color) {
            const baseHex = Number.isFinite(mat.userData.partVisualBaseColorHex)
                ? mat.userData.partVisualBaseColorHex
                : mat.color.getHex();
            mat.color.setHex(baseHex);
            if (visual.saturation < 0.999) {
                mat.color.getHSL(hsl);
                mat.color.setHSL(hsl.h, THREE.MathUtils.clamp(hsl.s * visual.saturation, 0, 1), hsl.l);
            }
        }

        mat.needsUpdate = true;
    });
}


function applyPartColorsToMesh(options = {}) {
    const syncBuildPlate = options?.syncBuildPlate !== false;
    const buildPlatePreview = options?.buildPlatePreview === true;
    const mats = getMeshMaterials();
    if (!mats.length) return;
    mats.forEach((mat, idx) => {
        if (!mat) return;
        if (!mat.userData.partVisualBaseInitialized) {
            mat.userData.partVisualBaseInitialized = true;
            mat.userData.partVisualBaseOpacity = Number.isFinite(mat.opacity) ? mat.opacity : 1;
            mat.userData.partVisualBaseTransparent = !!mat.transparent;
            mat.userData.partVisualBaseDepthWrite = (typeof mat.depthWrite === 'boolean') ? mat.depthWrite : true;
        }
        const s = getPartSettings(idx);
        const baseHex = s.color || modelPartBaseColors[idx] || colorPick.value;
        if (mat.color) {
            const toned = computeTonedColor(baseHex, s.tone ?? 0);
            mat.userData.partVisualBaseColorHex = toned.getHex();
            mat.color.setHex(mat.userData.partVisualBaseColorHex);
        }
        mat.visible = s.hidden !== true;
    });
    applyPartInteractionVisualsToMeshMaterials();
    if (syncBuildPlate && activeBuildPlatePreset === 'modelcolor') {
        updateBuildPlateMaterial(buildPlatePreview ? { skipTextureRefresh: true, skipControlSync: true } : undefined);
    }
}

function rebuildMeshMaterialsForCurrentShading() {
    if (!mesh) return;
    disposeMaterials(mesh.material);
    if (isMultipartModel()) {
        mesh.material = modelPartSettings.map((s, idx) => getMaterial(s.shading || shadingEl.value, s.color || modelPartBaseColors[idx], s));
    } else {
        const s = getPartSettings(0);
        mesh.material = getMaterial(s.shading || shadingEl.value, s.color || colorPick.value, s);
    }
    applyPartColorsToMesh();
    applyCurrentTextureTuning();
}

function syncModelPartSelectorUI(keepMenuOpen = false) {
    if (!modelPartThumbsWrap || !modelPartSelectorMenu || !modelPartSelectorBtn) return;
    const isVisible = hasModelParts();
    modelPartThumbsWrap.hidden = !isVisible;
    modelPartThumbsWrap.setAttribute('aria-hidden', String(!isVisible));
    if (!isVisible) {
        bulkSelectedPartIndices.clear();
        if (modelPartSelectorEl) modelPartSelectorEl.hidden = true;
        modelPartSelectorMenu.innerHTML = '';
        modelPartSelectorBtn.hidden = true;
        modelPartSelectorBtn.classList.remove('is-static');
        modelPartSelectorMenu.hidden = true;
        modelPartSelectorBtn.setAttribute('aria-expanded', 'false');
        if (modelPartSingleMenuRow) {
            modelPartSingleMenuRow.hidden = true;
            modelPartSingleMenuRow.setAttribute('aria-hidden', 'true');
        }
        if (modelPartSingleActions) {
            modelPartSingleActions.innerHTML = '';
            modelPartSingleActions.hidden = true;
        }
        if (modelPartSingleMenuBtn) modelPartSingleMenuBtn.setAttribute('aria-expanded', 'false');
        if (modelPartAddNextBtn) {
            modelPartAddNextBtn.hidden = true;
            modelPartAddNextBtn.disabled = true;
            modelPartAddNextBtn.title = '';
        }
        modelPartSelectorClosedByUser = false;
        syncRulerHoverSelectorState();
        return;
    }

    ensureModelPartDisplayOrder();
    const partCount = modelPartNames.length;
    const singleModel = partCount <= 1;
    const canMutateFiles = !!modelPartFiles && modelPartFiles.length === partCount;
    const canAppend = singleModel ? !!currentModelBuffer : canMutateFiles;
    const shouldAutoOpenMultipartMenu = !singleModel
        && shouldUseFloatingModelPartSelector()
        && !modelPartSelectorClosedByUser;
    const shouldKeepOpen = keepMenuOpen || shouldAutoOpenMultipartMenu;
    pruneBulkPartSelection();
    normalizeBulkSelectionForMode();
    if (modelPartSelectorEl) modelPartSelectorEl.hidden = false;
    modelPartSelectorBtn.hidden = false;
    modelPartSelectorBtn.classList.toggle('is-static', singleModel);
    modelPartSelectorBtn.classList.toggle('is-multipart-summary', !singleModel);
    modelPartSelectorMenu.hidden = !shouldKeepOpen;
    modelPartSelectorBtn.setAttribute('aria-expanded', shouldKeepOpen ? 'true' : 'false');

    if (modelPartSingleMenuRow) {
        modelPartSingleMenuRow.hidden = !singleModel;
        modelPartSingleMenuRow.setAttribute('aria-hidden', String(!singleModel));
    }
    if (modelPartSingleActions) {
        modelPartSingleActions.hidden = true;
        modelPartSingleActions.style.left = '';
        modelPartSingleActions.style.top = '';
    }
    if (modelPartSingleMenuBtn) modelPartSingleMenuBtn.setAttribute('aria-expanded', 'false');

    if (modelPartAddNextBtn) {
        modelPartAddNextBtn.hidden = false;
        modelPartAddNextBtn.disabled = !canAppend;
        modelPartAddNextBtn.title = canAppend
            ? 'Add one or more STL files as new model parts'
            : (singleModel
                ? 'Current model source is unavailable for add. Reload the model and try again.'
                : 'Part source files are unavailable for editing');
    }

    closeModelPartActionMenus();

    modelPartSelected = Math.max(0, Math.min(modelPartSelected, modelPartNames.length - 1));
    if (singleModel) modelPartSelected = 0;
    if (!singleModel) syncActivePartFromUiSelection();
    modelPartSelectorMenu.innerHTML = '';

    if (!singleModel) {
        const selectedCount = getUiSelectedPartIndices().length;
        const allSelected = partCount > 0 && selectedCount >= partCount;
        const bulkBar = document.createElement('div');
        bulkBar.className = 'model-bulk-bar';
        const multiActive = isModelPartPreviewMultiSelectActive();
        bulkBar.innerHTML = `<div class="model-bulk-bar-actions"><div class="model-bulk-selection"><label class="model-bulk-toggle-all" title="${allSelected ? 'Clear selection' : 'Select all'}" aria-label="${allSelected ? 'Clear selection' : 'Select all'}"><input type="checkbox" class="thumb-select-option-check-input" data-bulk-action="toggle-all"></label><span class="model-bulk-selection-count" data-bulk-selection-count>${selectedCount}/${partCount} Selected</span></div><button type="button" class="model-bulk-switch model-bulk-switch--multi${multiActive ? ' is-active' : ''}" data-bulk-action="toggle-multi" aria-pressed="${multiActive ? 'true' : 'false'}" title="${multiActive ? 'Multi-select on' : 'Multi-select off'}" aria-label="${multiActive ? 'Multi-select on' : 'Multi-select off'}"><span class="model-bulk-switch-label">Multi-select</span><span class="model-bulk-switch-track" aria-hidden="true"><span class="model-bulk-switch-thumb"><span class="model-bulk-switch-state" data-bulk-switch-state>${multiActive ? 'On' : 'Off'}</span></span></span></button></div>`;
        bulkBar.addEventListener('click', (ev) => ev.stopPropagation());
        bulkBar.querySelector('[data-bulk-action="toggle-all"]')?.addEventListener('change', (ev) => {
            ev.stopPropagation();
            const shouldSelectAll = !!ev.currentTarget.checked;
            if (shouldSelectAll && !rulerPartSelectMultiEnabled) {
                setRulerPartSelectMultiEnabled(true, true);
            }
            setBulkPartSelectionForAll(shouldSelectAll);
            if (!shouldSelectAll) {
                // Keep one active fallback selected for deterministic editing behavior.
                modelPartSelected = Math.max(0, Math.min(modelPartSelected, Math.max(0, modelPartNames.length - 1)));
            }
            syncActivePartFromUiSelection();
            applyPartInteractionVisualsToMeshMaterials();
            syncModelPartCheckboxStates();
            syncModelPartBulkUIState();
            saveSettings();
        });
        bulkBar.querySelector('[data-bulk-action="toggle-multi"]')?.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const enable = !rulerPartSelectMultiEnabled;
            setRulerPartSelectMultiEnabled(enable, true);
            syncModelPartBulkUIState();
        });
        modelPartSelectorMenu.appendChild(bulkBar);
        const modelSelectorItems = document.createElement('div');
        modelSelectorItems.className = 'model-selector-items';
        modelPartSelectorMenu.appendChild(modelSelectorItems);
        modelPartSelectorMenu.classList.remove('model-selector-view--card', 'model-selector-view--list', 'model-selector-view--grid');
        modelPartSelectorMenu.classList.add('model-selector-view--card');

        getOrderedPartIndices().forEach((idx) => {
            const name = modelPartNames[idx];
            const safeName = escapeHtml(name);
            const opt = document.createElement('div');
            opt.className = 'thumb-select-option';
            if (activeBgPreset === 'modelcolor' && idx === bgSyncPartIndex) opt.classList.add('is-bg-sync-source');
            opt.dataset.partIndex = String(idx);
            opt.draggable = !!window.matchMedia && window.matchMedia('(pointer:fine)').matches;
            opt.setAttribute('role', 'option');
            const settings = getPartSettings(idx);
            const visibilityLabel = 'Show model';
            const mutateDisabledAttr = canMutateFiles ? '' : ' disabled title="Part source files are unavailable for editing"';
            const bulkLabel = `Select part ${idx + 1} for bulk edit`;
            const syncOn = activeBgPreset === 'modelcolor' && idx === bgSyncPartIndex;
            opt.innerHTML = `<label class="thumb-select-option-check" title="${bulkLabel}" aria-label="${bulkLabel}"><input type="checkbox" class="thumb-select-option-check-input" data-part-bulk-select="${idx}"></label><button type="button" class="thumb-select-option-main" data-part-select="${idx}"><span class="thumb-select-option-thumb-wrap"><canvas class="thumb-select-option-canvas js-part-thumb-preview" data-part-index="${idx}" width="72" height="72" aria-hidden="true"></canvas></span><span class="thumb-select-option-text">Part ${idx + 1}: ${safeName}</span></button><button type="button" class="part-option-more" data-part-more="${idx}" aria-label="Part actions">${getPartOptionMoreIconSVG()}</button><div class="part-option-actions" hidden><button type="button" class="part-option-action" data-part-action="replace" data-part-index="${idx}" data-part-action-scope="row"${mutateDisabledAttr}>Replace STL</button><button type="button" class="part-option-action part-option-action--toggle" data-part-action="visibility-toggle" data-part-index="${idx}" data-part-action-scope="row"><span>${visibilityLabel}</span><span class="option-switch${settings.hidden ? '' : ' is-on'}" aria-hidden="true"></span></button><button type="button" class="part-option-action part-option-action--toggle" data-part-action="bg-sync-toggle" data-part-index="${idx}" data-part-action-scope="row"><span>Background Color Sync</span><span class="option-switch${syncOn ? ' is-on' : ''}" aria-hidden="true"></span></button><button type="button" class="part-option-action part-option-action--danger" data-part-action="remove" data-part-index="${idx}" data-part-action-scope="row"${mutateDisabledAttr}>Delete Model</button></div>`;

            const bulkCheck = opt.querySelector('[data-part-bulk-select]');
            const bulkCheckWrap = opt.querySelector('.thumb-select-option-check');
            bulkCheckWrap?.addEventListener('click', (ev) => ev.stopPropagation());
            if (bulkCheck) {
                // Set initial checked state based on effective selection
                const effectiveSelection = getUiSelectedPartIndices();
                bulkCheck.checked = effectiveSelection.includes(idx);
                bulkCheck.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                });
                bulkCheck.addEventListener('change', (ev) => {
                    ev.stopPropagation();
                    const isNowChecked = bulkCheck.checked;
                    // Add or remove from bulk selection
                    setBulkPartSelected(idx, isNowChecked);
                    syncActivePartFromUiSelection();
                    applyPartInteractionVisualsToMeshMaterials();
                    // Re-sync all states to ensure consistency
                    syncModelPartCheckboxStates();
                    syncModelPartBulkUIState();
                    saveSettings();
                }, false);
            }

            const bindPartDragSource = (sourceEl) => {
                if (!sourceEl || !opt.draggable) return;
                sourceEl.draggable = true;
                sourceEl.addEventListener('dragstart', (ev) => {
                    ev.dataTransfer?.setData('text/plain', String(idx));
                    ev.dataTransfer.effectAllowed = 'move';
                    opt.classList.add('is-dragging');
                });
                sourceEl.addEventListener('dragend', () => {
                    opt.classList.remove('is-dragging');
                });
            };
            bindPartDragSource(opt);
            bindPartDragSource(opt.querySelector('[data-part-select]'));
            opt.addEventListener('dragover', (ev) => {
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'move';
                opt.classList.add('is-drop-target');
            });
            opt.addEventListener('dragleave', () => {
                opt.classList.remove('is-drop-target');
            });
            opt.addEventListener('drop', (ev) => {
                ev.preventDefault();
                opt.classList.remove('is-drop-target');
                const fromIdx = parseInt(ev.dataTransfer?.getData('text/plain') || '-1', 10);
                const toIdx = idx;
                if (!Number.isInteger(fromIdx) || fromIdx < 0 || fromIdx === toIdx) return;
                movePartInDisplayOrder(fromIdx, toIdx);
                syncModelPartSelectorUI(true);
                saveSettings();
            });

            const applyPartCardSelectionClick = () => {
                clearPresetHoverPreview();
                const multiActive = isModelPartPreviewMultiSelectActive();
                if (multiActive) {
                    const isSelected = getUiSelectedPartIndices().includes(idx);
                    setBulkPartSelected(idx, !isSelected);
                    // Keep the last clicked part as the active fallback target.
                    modelPartSelected = idx;
                } else {
                    // Single-select row click: switch active part and replace bulk set.
                    modelPartSelected = idx;
                    bulkSelectedPartIndices.clear();
                    setBulkPartSelected(idx, true);
                }
                syncUIFromSelectedPart();
                applyPartColorsToMesh();
                if (!isModelPartFloatingCardOpen()) closeThumbSelectMenus();
                syncModelPartCheckboxStates();
                syncModelPartBulkUIState();
                saveSettings();
            };

            opt.querySelector('[data-part-select]')?.addEventListener('click', applyPartCardSelectionClick);

            opt.addEventListener('click', (ev) => {
                if (!(ev.target instanceof Element)) return;
                if (ev.target.closest('button,input,label,a,.part-option-actions')) return;
                clearPresetHoverPreview();
                applyPartCardSelectionClick();
            });

            opt.querySelector('[data-part-more]')?.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const menu = opt.querySelector('.part-option-actions');
                const willOpen = !!menu?.hidden;
                closeModelPartActionMenus();
                if (!menu || !willOpen) return;
                menu.hidden = false;
                positionModelPartActionMenu(menu, ev.currentTarget);
            });

            opt.querySelectorAll('.part-option-action').forEach((actionBtn) => {
                actionBtn.addEventListener('click', async (ev) => {
                    ev.stopPropagation();
                    const action = actionBtn.dataset.partAction;
                    const partIdx = parseInt(actionBtn.dataset.partIndex || '-1', 10);
                    const scope = actionBtn.dataset.partActionScope || 'row';
                    if (!Number.isFinite(partIdx) || partIdx < 0) return;
                    const targetPartIndices = getPartActionTargetIndices(partIdx, scope);

                    if (action === 'replace') {
                        pendingReplacePartIndex = partIdx;
                        partReplaceInput?.click();
                        return;
                    }

                    if (action === 'visibility-toggle') {
                        const allTargetsHidden = targetPartIndices.every((idx) => !!getPartSettings(idx).hidden);
                        targetPartIndices.forEach((targetIdx) => {
                            getPartSettings(targetIdx).hidden = !allTargetsHidden;
                        });
                        rebuildMeshMaterialsForCurrentShading();
                        syncModelPartSelectorUI(true);
                        saveSettings();
                        closeModelPartActionMenus();
                        return;
                    }

                    if (action === 'bg-sync-toggle') {
                        const isActiveSource = activeBgPreset === 'modelcolor' && bgSyncPartIndex === partIdx;
                        if (isActiveSource) {
                            if (!window.confirm('Turn off background color sync?')) return;
                            const fallbackPreset = BG_PRESETS.find((preset) => preset.id === lastNonModelBgPreset) || BG_PRESETS[0];
                            activeBgPreset = fallbackPreset?.id || 'white';
                            if (fallbackPreset?.color) {
                                if (isDynamicBg) applyBgPresetDefaultTone(fallbackPreset.id);
                                bgPick.value = fallbackPreset.color;
                                bgPick.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                            updateBgSelection();
                            syncModelPartSelectorUI(true);
                            saveSettings();
                            return;
                        }
                        if (!maybeConfirmBgSyncChange(partIdx)) return;
                        activeBgPreset = 'modelcolor';
                        bgSyncPartIndex = partIdx;
                        const syncColor = getModelSyncSourceColor();
                        bgPick.value = syncColor;
                        if (isDynamicBg) updateDynamicBg();
                        else applyBackgroundFromBaseColor(syncColor);
                        renderBgPresets();
                        updateBgSelection();
                        syncModelPartSelectorUI(true);
                        saveSettings();
                        return;
                    }

                    if (action === 'remove') {
                        if (targetPartIndices.length > 1) {
                            if (!confirm(`Remove ${targetPartIndices.length} selected models?`)) return;
                            const descending = [...targetPartIndices].sort((a, b) => b - a);
                            for (const idx of descending) {
                                await removeMultipartPart(idx, { confirmRemoval: false });
                            }
                            return;
                        }
                        await removeMultipartPart(partIdx);
                    }
                });
            });

            modelSelectorItems.appendChild(opt);
        });
    } else if (modelPartSingleActions) {
        const syncOn = activeBgPreset === 'modelcolor';
        const visibilityLabel = 'Show model';
        modelPartSingleActions.innerHTML = `<button type="button" class="part-option-action" data-single-action="replace">Replace STL</button><button type="button" class="part-option-action part-option-action--toggle" data-single-action="visibility-toggle"><span>${visibilityLabel}</span><span class="option-switch${getPartSettings(0).hidden ? '' : ' is-on'}" aria-hidden="true"></span></button><button type="button" class="part-option-action part-option-action--toggle" data-single-action="bg-sync-toggle"><span>Background Color Sync</span><span class="option-switch${syncOn ? ' is-on' : ''}" aria-hidden="true"></span></button>`;

        modelPartSingleActions.querySelectorAll('.part-option-action').forEach((actionBtn) => {
            actionBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const action = actionBtn.dataset.singleAction;
                if (action === 'replace') {
                    closeModelPartActionMenus();
                    openUploadFilePicker('replace');
                    return;
                }
                if (action === 'visibility-toggle') {
                    getPartSettings(0).hidden = !getPartSettings(0).hidden;
                    rebuildMeshMaterialsForCurrentShading();
                    syncModelPartSelectorUI(true);
                    saveSettings();
                    closeModelPartActionMenus();
                    return;
                }
                if (action === 'bg-sync-toggle') {
                    const partIdx = 0;
                    const isActiveSource = activeBgPreset === 'modelcolor' && bgSyncPartIndex === partIdx;
                    if (isActiveSource) {
                        if (!window.confirm('Turn off background color sync?')) return;
                        const fallbackPreset = BG_PRESETS.find((preset) => preset.id === lastNonModelBgPreset) || BG_PRESETS[0];
                        activeBgPreset = fallbackPreset?.id || 'white';
                        if (fallbackPreset?.color) {
                            if (isDynamicBg) applyBgPresetDefaultTone(fallbackPreset.id);
                            bgPick.value = fallbackPreset.color;
                            bgPick.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        updateBgSelection();
                        syncModelPartSelectorUI(true);
                        saveSettings();
                        closeModelPartActionMenus();
                        return;
                    }
                    if (!maybeConfirmBgSyncChange(partIdx)) return;
                    activeBgPreset = 'modelcolor';
                    bgSyncPartIndex = partIdx;
                    const syncColor = getModelSyncSourceColor();
                    bgPick.value = syncColor;
                    if (isDynamicBg) updateDynamicBg();
                    else applyBackgroundFromBaseColor(syncColor);
                    renderBgPresets();
                    updateBgSelection();
                    syncModelPartSelectorUI(true);
                    saveSettings();
                    closeModelPartActionMenus();
                    return;
                }
            });
        });
    }

    if (modelPartSelectorThumb) {
        if (singleModel) {
            modelPartSelectorThumb.classList.add('js-part-thumb-preview');
            modelPartSelectorThumb.dataset.partIndex = String(modelPartSelected);
        } else {
            modelPartSelectorThumb.classList.remove('js-part-thumb-preview');
            delete modelPartSelectorThumb.dataset.partIndex;
        }
    }

    if (!singleModel && modelPartSelectorMenu && modelPartSelectorBtn && !modelPartSelectorMenu.hidden) {
        positionThumbSelectMenu(modelPartSelectorMenu, modelPartSelectorBtn);
    }

    if (!singleModel && modelPartSelectorMenu && !modelPartSelectorMenu.hidden && modelPartSelectorMenu.classList.contains('thumb-select-menu--floating-card')) {
        ensureModelPartFloatingHeader();
    }

    syncUIFromSelectedPart();
    syncModelPartBulkUIState();
    syncBgModelSyncSourceUI();
    syncBuildPlateModelSyncSourceUI();
    syncRulerHoverSelectorState();
    queueModelPartThumbsRender();
}

function getModelSyncSourceColor() {
    return getComputedModelSyncColor(bgSyncPartIndex);
}

function getComputedModelSyncColor(syncPartIndex = 0) {
    const partCount = Math.max(1, modelPartNames.length, modelPartBaseColors.length, modelPartSettings.length);
    const rawIndex = parseInt(String(syncPartIndex), 10);
    const idx = Math.max(0, Math.min(Number.isFinite(rawIndex) ? rawIndex : 0, partCount - 1));
    const settings = (Array.isArray(modelPartSettings) && modelPartSettings[idx]) ? modelPartSettings[idx] : null;
    const baseHex = settings?.color || modelPartBaseColors[idx] || colorPick.value;
    const toneVal = Number.isFinite(Number(settings?.tone)) ? Number(settings.tone) : 0;
    return `#${computeTonedColor(baseHex, toneVal).getHexString()}`;
}

function getComputedModelSyncTone(syncPartIndex = 0) {
    const partCount = Math.max(1, modelPartNames.length, modelPartBaseColors.length, modelPartSettings.length);
    const rawIndex = parseInt(String(syncPartIndex), 10);
    const idx = Math.max(0, Math.min(Number.isFinite(rawIndex) ? rawIndex : 0, partCount - 1));
    const settings = (Array.isArray(modelPartSettings) && modelPartSettings[idx]) ? modelPartSettings[idx] : null;
    const toneVal = Number.isFinite(Number(settings?.tone)) ? Number(settings.tone) : 0;
    return Math.max(-100, Math.min(100, Math.round(toneVal)));
}

function getActiveBackgroundBaseColor() {
    if (activeBgPreset === 'white') return PALETTE.preset.white;
    if (activeBgPreset === 'black') return PALETTE.preset.black;
    if (activeBgPreset === 'modelcolor') return getModelSyncSourceColor() || bgPick?.value || PALETTE.fallback;
    return bgPick?.value || PALETTE.fallback;
}

function getBuildPlateSyncSourceColor() {
    return getComputedModelSyncColor(buildPlateSyncPartIndex);
}

function getActiveBuildPlateBaseColor() {
    if (activeBuildPlatePreset === 'white') return PALETTE.preset.white;
    if (activeBuildPlatePreset === 'black') return PALETTE.preset.black;
    if (activeBuildPlatePreset === 'modelcolor') return getBuildPlateSyncSourceColor();
    return buildPlateColor || getBuildPlateSyncSourceColor() || colorPick?.value || bgPick?.value || PALETTE.fallback;
}

function getSyncThumbScope(canvasEl) {
    if (!(canvasEl instanceof HTMLCanvasElement)) return null;
    if (
        canvasEl.id === 'bg-preset-modelcolor-canvas'
        || canvasEl.id === 'bgModelSyncSelectorThumb'
        || !!canvasEl.closest('#bgModelSyncSelectorMenu')
    ) {
        return 'background';
    }
    if (
        canvasEl.id === 'build-plate-preset-modelcolor-canvas'
        || canvasEl.id === 'buildPlateModelSyncSelectorThumb'
        || !!canvasEl.closest('#buildPlateModelSyncSelectorMenu')
    ) {
        return 'buildPlate';
    }
    return null;
}

function getEffectiveSyncThumbBackgroundHex(scope, partIdx) {
    const baseHex = getComputedModelSyncColor(partIdx);
    if (scope === 'background') {
        const autoOn = !!(document.getElementById('autoBgCheck')?.checked ?? isDynamicBg);
        const finalColor = autoOn ? computeAutoBrightnessColor(baseHex) : new THREE.Color(baseHex);
        return `#${finalColor.getHexString()}`;
    }
    if (scope === 'buildPlate') {
        const autoOn = buildPlateAutoBrightnessEl
            ? !!buildPlateAutoBrightnessEl.checked
            : !!buildPlateAutoBrightnessEnabled;
        const finalColor = autoOn ? computeBuildPlateAutoBrightnessColor(baseHex) : new THREE.Color(baseHex);
        return `#${finalColor.getHexString()}`;
    }
    return null;
}

function syncStoredBuildPlateColorToVisibleBase() {
    const visibleBase = getActiveBuildPlateBaseColor();
    if (/^#[0-9a-f]{6}$/i.test(visibleBase)) {
        buildPlateColor = visibleBase;
        if (buildPlateColorPickerEl) buildPlateColorPickerEl.value = visibleBase;
    }
}

function syncBgModelSyncSourceUI() {
    if (!bgModelSyncSourceWrap || !bgModelSyncSelectorMenu || !bgModelSyncSelectorBtn) return;
    const visible = activeBgPreset === 'modelcolor' && modelPartNames.length > 0;
    bgModelSyncSourceWrap.hidden = false;
    bgModelSyncSourceWrap.setAttribute('aria-hidden', 'true');
    if (!visible) {
        bgModelSyncSelectorMenu.innerHTML = '';
        bgModelSyncSelectorMenu.hidden = true;
        bgModelSyncSelectorBtn.setAttribute('aria-expanded', 'false');
        if (bgModelSyncSelectorText) bgModelSyncSelectorText.textContent = '';
        return;
    }

    bgSyncPartIndex = Math.max(0, Math.min(bgSyncPartIndex, modelPartNames.length - 1));
    bgModelSyncSelectorMenu.innerHTML = '';
    bgModelSyncSelectorMenu.hidden = true;
    bgModelSyncSelectorBtn.setAttribute('aria-expanded', 'false');
    modelPartNames.forEach((name, idx) => {
        const safeName = escapeHtml(name);
        const opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'thumb-select-option';
        if (idx === bgSyncPartIndex) opt.classList.add('is-bg-sync-source');
        opt.dataset.partIndex = String(idx);
        opt.setAttribute('role', 'option');
        opt.innerHTML = `<canvas class="thumb-select-option-canvas js-part-thumb-preview" data-part-index="${idx}" width="68" height="68" aria-hidden="true"></canvas><span class="thumb-select-option-text">${safeName}</span>`;
        const optCanvas = opt.querySelector('.thumb-select-option-canvas');
        paintThumbFallback(optCanvas, idx);
        opt.addEventListener('click', () => {
            if (!maybeConfirmBgSyncChange(idx)) return;
            bgSyncPartIndex = idx;
            activeBgPreset = 'modelcolor';
            if (activeBgPreset === 'modelcolor') {
                const syncColor = getModelSyncSourceColor();
                bgPick.value = syncColor;
                updateAutoBgShadeControlVisibility();
                if (isDynamicBg) updateDynamicBg();
                else applyBackgroundFromBaseColor(syncColor);
            }
            updateBgShadeSliderVisual();
            closeThumbSelectMenus();
            syncBgModelSyncSourceUI();
            saveSettings();
        });
        bgModelSyncSelectorMenu.appendChild(opt);
    });

    if (bgModelSyncSelectorThumb) {
        bgModelSyncSelectorThumb.classList.add('js-part-thumb-preview');
        bgModelSyncSelectorThumb.dataset.partIndex = String(bgSyncPartIndex);
        paintThumbFallback(bgModelSyncSelectorThumb, bgSyncPartIndex);
        renderSinglePartThumbnail(bgModelSyncSelectorThumb, bgSyncPartIndex);
    }
    const bgPresetThumbCanvas = document.getElementById('bg-preset-modelcolor-canvas');
    if (bgPresetThumbCanvas instanceof HTMLCanvasElement) {
        bgPresetThumbCanvas.classList.add('js-part-thumb-preview');
        bgPresetThumbCanvas.dataset.partIndex = String(bgSyncPartIndex);
        paintThumbFallback(bgPresetThumbCanvas, bgSyncPartIndex);
        renderSinglePartThumbnail(bgPresetThumbCanvas, bgSyncPartIndex);
    }
    if (bgModelSyncSelectorText) {
        const selectedName = modelPartNames[bgSyncPartIndex] || `Part ${bgSyncPartIndex + 1}`;
        bgModelSyncSelectorText.textContent = `Sync: ${selectedName}`;
        bgModelSyncSelectorBtn.title = `Background sync: ${selectedName}`;
        const bgPresetThumb = document.getElementById('bg-preset-modelcolor');
        if (bgPresetThumb) bgPresetThumb.title = `Model Sync: ${selectedName}`;
    }
    updateBgShadeSliderVisual();
    queueModelPartThumbsRender();
}

function applyPresetHoverPreview(preset) {
    if (!preset?.url || !mesh) return;
    const p = getURLSettings(preset.url);
    if (!p) return;

    if (!presetHoverPreviewSnapshot) {
        presetHoverPreviewSnapshot = {
            idx: modelPartSelected,
            settings: { ...getSelectedPartSettings() },
        };
    }

    const s = getSelectedPartSettings();
    applyPresetIntoPartSettings(s, p, preset.id);
    modelPartBaseColors[modelPartSelected] = s.color;
    if (activeBgPreset === 'modelcolor') bgPick.value = getModelSyncSourceColor();
    rebuildMeshMaterialsForCurrentShading();
    if (isDynamicBg) updateDynamicBg();
}

function clearPresetHoverPreview() {
    if (!presetHoverPreviewSnapshot) return;
    const idx = presetHoverPreviewSnapshot.idx;
    modelPartSettings[idx] = { ...presetHoverPreviewSnapshot.settings };
    modelPartBaseColors[idx] = modelPartSettings[idx].color;
    if (idx === modelPartSelected) syncUIFromSelectedPart();
    if (activeBgPreset === 'modelcolor') bgPick.value = getModelSyncSourceColor();
    presetHoverPreviewSnapshot = null;
    rebuildMeshMaterialsForCurrentShading();
    if (isDynamicBg) updateDynamicBg();
}

function attachPresetHoverPreview(el, preset) {
    if (!el || !preset?.url) return;
}

function loadPreparedGeometry(geo, name) {
    geo.computeBoundingBox();
    if (!geo.boundingBox) throw new Error('Could not compute model bounds.');

    // Preserve camera distance when replacing a model (maintain user's zoom level)
    let savedCamPos = null;
    if (mesh && camera) savedCamPos = camera.position.clone();

    if (mesh) {
        disposeRulerHoveredPartVisual();
        scene.remove(mesh);
        mesh.geometry.dispose();
        disposeMaterials(mesh.material);
    }

    const sz = new THREE.Vector3();
    geo.boundingBox.getSize(sz);
    modelRadius = Math.max(sz.x, sz.y, sz.z) / 2;
    modelDims = { w: sz.x, d: sz.y, h: sz.z };
    if (!isMultipartModel() || modelPartDimensions.length !== modelPartNames.length) {
        modelPartDimensions = [{ ...modelDims }];
    }
    if (!isMultipartModel() || modelPartBoundsBoxes.length !== modelPartNames.length) {
        modelPartBoundsBoxes = geo.boundingBox ? [geo.boundingBox.clone()] : [];
    }
    setRulerHoveredPartIndex(-1);

    const initialMaterial = isMultipartModel()
        ? modelPartSettings.map((s, idx) => getMaterial(s.shading || shadingEl.value, s.color || modelPartBaseColors[idx], s))
        : getMaterial(getPartSettings(0).shading || shadingEl.value, getPartSettings(0).color || colorPick.value, getPartSettings(0));
    mesh = new THREE.Mesh(geo, initialMaterial);
    mesh.rotation.x = -Math.PI / 2; // Z-up → Y-up
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    tiltBaseMeshRx = -Math.PI / 2;
    tiltPhase = 0;
    scene.add(mesh);
    applyPartColorsToMesh();
    updateShadowCatcherPlacement();
    applyCurrentTextureTuning();

    // Sync background color (matters when restoring settings before initThree)
    scene.background = null;

    {
        const tone = bgOpacitySlider ? Math.round(getSliderEffectiveValue(bgOpacitySlider)) : 0;
        const c = computeTonedColor(bgPick.value, tone);
        if (renderer) renderer.setClearColor(c, 1);
    }
    if (isDynamicBg) updateDynamicBg();
    updateRulerGrid();
    updateRulerHUD();
    updateLiveRulerOverlay();

    if (savedCamPos && camera) {
        // Maintain the user's current camera distance; preserve direction
        const savedDist = savedCamPos.length();
        camera.position.copy(savedCamPos.clone().normalize().multiplyScalar(savedDist));
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        updateOrbitDistanceLimits();
        controls.update();
    }
    // else: placeCamera() is deferred to the rAF below so syncCanvasSize() runs
    // first and camera.aspect is correct before we compute the fit distance.
    document.documentElement.classList.add('loaded');
    dismissStartupSplash();
    try { localStorage.setItem('rotater_hasSession', '1'); } catch (e) { }
    document.getElementById('compactBtnLabel').textContent = 'Upload';
    // Preserve pause state on model replace; only resume if not already paused.
    if (!isPaused) {
        controls.autoRotate = rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360);
        document.documentElement.classList.remove('rotation-paused');
        // iconPlayPause always visible
    } else {
        controls.autoRotate = false;
    }
    viewerSec.classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('controlsBar').classList.remove('hidden');
    document.documentElement.classList.add('startup-model-ready');
    if (!localStorage.getItem('rotater_hintDismissed')) {
        orbitHintBarEl?.classList.add('visible');
    }
    updateCropHintUI();
    syncModelPartSelectorUI();
    queueModelPartThumbsRender();
    updateEstimate();
    requestAnimationFrame(() => {
        syncCanvasSize();
        if (!savedCamPos) {
            placeCamera();
            tryApplyPendingViewportOrbitRestore();
            syncLightRig();
            renderer.render(scene, camera);
        }
        // Keep the live viewer on the real viewport fit/restore state.
        // Export framing should follow the live camera, not overwrite it on load.
        _hasRestoredExportFrame = false;
        storeExportCamera();
        queueModelPartThumbsRender();
    });

    const clearBtn = document.getElementById('btnClearModel');
    const clearBtnQuick = document.getElementById('btnClearModelQuick');
    if (clearBtn) {
        const isDemo = (currentFileName === '3dbenchy');
        const clearLabel = isDemo ? 'Load your own model' : 'Reset to Benchy';
        clearBtn.title = clearLabel;
        clearBtn.setAttribute('aria-label', clearLabel);
        if (clearBtnQuick) {
            clearBtnQuick.title = clearLabel;
            clearBtnQuick.setAttribute('aria-label', clearLabel);
        }
    }
    syncFileChipMultipartUI();
    rebuildFileChipPartsMenu();
}

// ── STL Loading ───────────────────────────────────────────────────────────────
async function loadSTLBuffer(buffer, name) {
    const geo = await parseSingleStlGeometry(buffer, name);

    // Preserve camera distance when replacing a model (maintain user's zoom level)
    // Center and orient (STL files from slicers are Z-up; Three.js is Y-up)
    geo.computeBoundingBox();
    const center = new THREE.Vector3();
    geo.boundingBox.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);
    geo.computeVertexNormals();

    modelPartNames = [name];
    modelPartBaseColors = [colorPick.value];
    modelPartSettings = [createPartSettings(colorPick.value)];
    customModelSettingsByPart = {};
    modelPartFiles = null;
    modelPartDisplayOrder = [0];
    pendingModelPartDisplayOrder = null;
    pendingBulkSelectedPartIndices = null;
    multipartPartBounds = null;
    modelPartDimensions = [];
    modelPartBoundsBoxes = [];
    currentModelBuffer = buffer;
    modelPartSelected = 0;
    bulkSelectedPartIndices.clear();
    applyPendingUrlModelAppearanceOverride();

    loadPreparedGeometry(geo, name);
}

async function loadMultipartSTLBuffers(buffers, names, partColors = null, partSettings = null) {
    if (!Array.isArray(buffers) || !buffers.length) return;

    modelPartNames = [...names];
    modelPartBaseColors = names.map((_, idx) => partColors?.[idx] || colorPick.value);
    modelPartSettings = names.map((_, idx) => {
        const base = createPartSettings(modelPartBaseColors[idx]);
        if (partSettings?.[idx]) return { ...base, ...partSettings[idx], color: partSettings[idx].color || base.color };
        return base;
    });
    ensureModelPartDisplayOrder();
    customModelSettingsByPart = {};
    currentModelBuffer = null;
    modelPartSelected = Math.max(0, Math.min(pendingModelPartSelected, modelPartNames.length - 1));
    bulkSelectedPartIndices.clear();
    if (Array.isArray(pendingBulkSelectedPartIndices)) {
        const maxIdx = Math.max(0, modelPartNames.length - 1);
        pendingBulkSelectedPartIndices.forEach((idx) => {
            if (Number.isInteger(idx) && idx >= 0 && idx <= maxIdx) bulkSelectedPartIndices.add(idx);
        });
    } else if (modelPartNames.length) {
        bulkSelectedPartIndices.add(modelPartSelected);
    }
    pendingBulkSelectedPartIndices = null;
    normalizeBulkSelectionForMode();
    syncActivePartFromUiSelection();
    applyPendingUrlModelAppearanceOverride();

    const parsedResult = await parseMultipartStlGeometries(buffers, names);
    const parsed = parsedResult.geometries;
    multipartPartBounds = parsedResult.partBounds;
    modelPartDimensions = parsedResult.partDimensions;
    modelPartBoundsBoxes = parsedResult.partBoxes;
    setRulerHoveredPartIndex(-1);

    const merged = BufferGeometryUtils.mergeGeometries(parsed, true);
    if (!merged) throw new Error('Could not merge multi-part STL geometry.');
    parsed.forEach(g => { if (g !== merged) g.dispose(); });

    loadPreparedGeometry(merged, getMultipartDisplayName(names));
}

function placeCamera() {
    if (!camera || !controls) return;
    updateOrbitDistanceLimits(false);
    const dist = getViewportFitDistance();
    camera.up.set(0, 1, 0);
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}

// Fit model into the export frame box (used by reset button when frame is active)
function fitToFrame() {
    if (!camera || !controls) return;
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const { sw, sh } = getCropFrameRect(w, h);
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // dist so model fills ~88% of the export frame, considering width and height constraints.
    const verticalScale = sh / h;
    const horizontalScale = sw / h;
    const frameScale = Math.max(1e-6, Math.min(verticalScale, horizontalScale));
    const dist = modelRadius / (0.88 * tanHalfFov * frameScale);
    const MAX_EL = Math.PI / 2 - 0.02;
    const el = Math.min(THREE.MathUtils.degToRad(ELEV_DEFAULT), MAX_EL);
    camera.up.set(0, 1, 0);
    camera.position.set(0, dist * Math.sin(el), dist * Math.cos(el));
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}

// Store the ideal export camera distance/elevation (fit-to-export-frame math).
// Called after model load and after camera reset so the export preview and
// captured frames always use this framing even if the user zooms the viewport.
function storeExportCamera() {
    if (!camera) return;
    const { dist, elev } = getOrbitFrameState();
    exportCamDist = dist;
    exportCamElev = elev;
    exportCamZoom = camera.zoom || 1;
}

// ── Render loop ───────────────────────────────────────────────────────────────
let _lastRulerOverlayUpdateMs = 0;

function loop() {
    requestAnimationFrame(loop);
    const deltaSec = Math.min(Math.max(renderDeltaClock.getDelta(), 0), 0.1);
    const phaseStep = (2 * Math.PI / Math.max(1e-6, getSecondsPerRevolution())) * deltaSec;
    if (!isExporting) {
        const viewportQualityChanged = updateViewportPerformanceStateModule(viewportPerformanceState, deltaSec, {
            enabled: !isExporting,
            minQualityScale: VIEWPORT_PERF_MIN_QUALITY_SCALE,
        });
        if (viewportQualityChanged) applyViewportPixelRatioIfNeeded();
        if (!isPaused && rotateModeEl.value === 'tilt' && mesh) {
            // Tilt: pitch the mesh around its X axis — camera orbits freely
            controls.autoRotate = false;
            controls.update(deltaSec);
            tiltPhase += phaseStep;
            const swing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value) / 2);
            mesh.rotation.x = tiltBaseMeshRx + Math.sin(tiltPhase) * swing;
        } else if (!isPaused && rotateModeEl.value === 'wobble' && mesh) {
            // Wobble: mesh tilt oscillation + full or arc spin
            const wobbleSpinRange = parseFloat(wobbleSpinRangeSlider.value);
            if (wobbleSpinRange >= 360) {
                controls.autoRotate = true;
                controls.update(deltaSec);
            } else {
                controls.autoRotate = false;
                controls.update(deltaSec);
                const { az: actualAz } = getOrbitFrameStateFast();
                let azDelta = actualAz - swingLastAz;
                if (azDelta > Math.PI) azDelta -= 2 * Math.PI;
                if (azDelta < -Math.PI) azDelta += 2 * Math.PI;
                swingBaseAz += azDelta;
            }
            tiltPhase += phaseStep;
            const tiltSwing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value) / 2);
            mesh.rotation.x = tiltBaseMeshRx + Math.sin(tiltPhase) * tiltSwing;
            if (wobbleSpinRange < 360) {
                const MAX_EL = Math.PI / 2 - 0.05;
                const spinRange = THREE.MathUtils.degToRad(wobbleSpinRange / 2);
                const { target, dist, elev } = getOrbitFrameStateFast();
                const el = THREE.MathUtils.clamp(elev, -MAX_EL, MAX_EL);
                const az = swingBaseAz + Math.sin(tiltPhase) * spinRange;
                setCameraFromOrbitState(camera, target, dist, el, az);
                controls.target.copy(target);
                swingLastAz = az;
            }
        } else if (!isPaused && rotateModeEl.value === 'spin' && parseFloat(tiltRangeSlider.value) < 360 && mesh) {
            // Spin with Range < 360°: azimuth oscillates ±range around user-orbitable base
            controls.autoRotate = false;
            controls.update(deltaSec); // apply user input first
            // Accumulate user-driven azimuth delta on top of the base
            const { target, dist, elev, az: actualAz } = getOrbitFrameStateFast();
            let azDelta = actualAz - swingLastAz;
            if (azDelta > Math.PI) azDelta -= 2 * Math.PI;
            if (azDelta < -Math.PI) azDelta += 2 * Math.PI;
            swingBaseAz += azDelta;
            tiltPhase += phaseStep;
            const MAX_EL = Math.PI / 2 - 0.05;
            const swingRange = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value) / 2);
            // Elevation is user-controlled (read from wherever they orbited to)
            const el = THREE.MathUtils.clamp(elev, -MAX_EL, MAX_EL);
            const az = swingBaseAz + Math.sin(tiltPhase) * swingRange;
            setCameraFromOrbitState(camera, target, dist, el, az);
            controls.target.copy(target);
            swingLastAz = az;
        } else {
            controls.autoRotate = !isPaused && (rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360));
            controls.update(deltaSec);
            // Keep spin base in sync while paused so resume is seamless
            if (camera && rotateModeEl.value === 'spin') {
                swingBaseAz = getOrbitFrameStateFast().az;
                swingLastAz = swingBaseAz;
            }
        }
        updateCameraClipPlanes();
        syncLightRig();
        const renderWithExportOptions = !!(exportFrameEnabled && !isExporting);
        const restoreViewportExportScene = renderWithExportOptions
            ? applyExportSceneForRender({ forceTransparent: !(exportBgColorEl?.checked ?? true) })
            : null;
        try {
            renderer.render(scene, camera);
        } finally {
            restoreViewportExportScene?.();
        }
        if (exportFrameEnabled) drawExportFrame();
        if (rulerEnabled || rulerPartHoverEnabled) {
            const now = performance.now();
            const overlayIntervalMs = getRulerInteractionMode() ? 28 : 80;
            if (now - _lastRulerOverlayUpdateMs >= overlayIntervalMs) {
                updateLiveRulerOverlay();
                _lastRulerOverlayUpdateMs = now;
            }
        }
        updateFpsReadout(deltaSec);
        updateExportPreview();
    }
}

// ── Export preview thumbnail ──────────────────────────────────────────────────
let _previewRt = null;
let _previewRtWidth = 0;
let _previewRtHeight = 0;
let _previewCam = null;
let _lastExportPreviewUpdateMs = 0;

const EXPORT_PREVIEW_DPR_MAX = 1;
const EXPORT_PREVIEW_INTERVAL_MS = 160;

function isExportPreviewActive() {
    return isExportPreviewActiveController({
        previewEl: document.getElementById('exportPreview'),
        renderer,
        camera,
        scene,
        exportOverlayEl: document.getElementById('exportOverlay'),
        previewDetailsEl: document.getElementById('exportPreviewDetails'),
    });
}

function applyExportSceneForRender({ forceTransparent = false } = {}) {
    return applyExportSceneForRenderController({
        forceTransparent,
        renderer,
        scene,
        three: THREE,
        exportBgColorEl,
        exportGridEl,
        exportBuildPlateEl,
        buildPlateEnabled,
        hasMesh: !!mesh,
        modelDims,
        getBuildPlateMesh: () => buildPlateMesh,
        getRulerGridHelper: () => rulerGridHelper,
        getRulerFootprintHelper: () => rulerFootprintHelper,
        getRulerState: () => ({
            rulerEnabled,
            rulerLinesVisible,
        }),
        setRulerState: (nextState) => {
            if (!nextState) return;
            rulerEnabled = !!nextState.rulerEnabled;
            rulerLinesVisible = !!nextState.rulerLinesVisible;
        },
        updateRulerGrid,
    });
}

function updateExportPreview(force = false) {
    runUpdateExportPreviewRuntimeController({
        force,
        nowMs: performance.now(),
        lastUpdateMs: _lastExportPreviewUpdateMs,
        intervalMs: EXPORT_PREVIEW_INTERVAL_MS,
        exportCameraState: {
            exportCamDist,
            exportCamElev,
            exportCamZoom,
        },
        exportFrameEnabled,
        canvasEl: canvas,
        renderer,
        scene,
        sourceCamera: camera,
        previewResources: {
            previewRt: _previewRt,
            previewRtWidth: _previewRtWidth,
            previewRtHeight: _previewRtHeight,
            previewCam: _previewCam,
        },
        getOrbitFrameState,
        getCropFrameVerticalScale,
        setCameraFromOrbitState,
        getCropFrameRect,
        drawRulerOverlay,
        exportFormatEl,
        exportBgColorEl,
        exportPreviewDprMax: EXPORT_PREVIEW_DPR_MAX,
        isPreviewActive: isExportPreviewActive,
        evaluateTimingController: evaluateExportPreviewTimingController,
        getPreviewExportSize,
        applyExportSceneForRender,
        devicePixelRatio: window.devicePixelRatio,
        setLastUpdateMs: (nextLastUpdateMs) => {
            _lastExportPreviewUpdateMs = nextLastUpdateMs;
        },
        setExportCameraState: (nextCameraState) => {
            exportCamDist = nextCameraState.exportCamDist;
            exportCamElev = nextCameraState.exportCamElev;
            exportCamZoom = nextCameraState.exportCamZoom;
        },
        setPreviewResources: (nextPreviewResources) => {
            _previewRt = nextPreviewResources.previewRt;
            _previewRtWidth = nextPreviewResources.previewRtWidth;
            _previewRtHeight = nextPreviewResources.previewRtHeight;
            _previewCam = nextPreviewResources.previewCam;
        },
    });
}

function refreshExportPreviewNow() {
    refreshExportPreviewNowRuntimeController({
        isPreviewActive: isExportPreviewActive,
        runForcedUpdate: () => updateExportPreview(true),
        requestAnimationFrameFn: requestAnimationFrame,
    });
}

// ── Export frame overlay ──────────────────────────────────────────────────
let exportFrameEnabled = false;
let exportWorkspaceActive = false;
let _cropAppliedCameraZoomScale = false;
let _modelPartMenuDragState = null;

const MODEL_PART_MENU_POS_STORAGE_KEY = 'rotater_modelPartMenuPos';
const exportPanelDragController = createExportPanelDragController({
    exportPanelEl,
    exportPanelHeaderEl,
    isDesktopV2Layout,
    isWorkspaceActive: () => exportWorkspaceActive,
});
exportPanelDragController.initializeExportPanelDrag();
function restoreExportPanelPosition() {
    exportPanelDragController.restoreExportPanelPosition();
}
const exportWorkspaceRuntimeController = createExportWorkspaceRuntimeController({
    rootEl: document.documentElement,
    canvas,
    exportBgColorEl,
    exportGridEl,
    exportBuildPlateEl,
    getRulerLinesVisible: () => rulerLinesVisible,
    getBuildPlateEnabled: () => buildPlateEnabled,
    setWorkspaceActive: (nextActive) => {
        exportWorkspaceActive = !!nextActive;
    },
    getWorkspaceActive: () => exportWorkspaceActive,
    updateExportPauseButtonUI,
    syncCanvasSize,
    restoreExportPanelPosition,
    enterCropMode,
    confirmCropMode,
    getExportFrameEnabled: () => exportFrameEnabled,
});
const exportCropUiController = createExportCropUiController({
    frameOverlayBtn,
    orbitHintTextEl,
    orbitHintBarEl,
});
const cropDimensionsDockController = createCropDimensionsDockController({
    cropDimensionsDock,
    exportFormatEl,
    rootEl: document.documentElement,
    getExportFrameCanvas: () => document.getElementById('exportFrameCanvas'),
    getCropFrameRect,
});
const rightPanLockController = createRightPanLockController();

function setExportWorkspaceActive(active) {
    exportWorkspaceRuntimeController.setExportWorkspaceActive(active);
}

function updateExportWorkspaceTransparencyPattern() {
    exportWorkspaceRuntimeController.updateExportWorkspaceTransparencyPattern();
}

function enterCropMode() {
    if (exportFrameEnabled) return;
    exportFrameEnabled = true;
    _cropBackupDist = exportCamDist;
    _cropBackupElev = exportCamElev;
    _cropBackupZoom = exportCamZoom;
    _cropAppliedCameraZoomScale = false;
    if (camera) _cropBackupCameraZoom = camera.zoom || 1;
    _cropLiveSyncArmed = true;
    syncExportCameraFromViewport();
    updateCropHintUI();
    updateFrameOverlayButtonUI();
    updateRulerHUD();
    refreshExportPreviewNow();
}

function openExportWorkspace() {
    exportWorkspaceRuntimeController.openExportWorkspace();
}

function closeExportWorkspace() {
    exportWorkspaceRuntimeController.closeExportWorkspace();
}

function updateFrameOverlayButtonUI() {
    exportCropUiController.updateFrameOverlayButtonUI(exportFrameEnabled);
}

function updateCropHintUI() {
    exportCropUiController.updateCropHintUI(exportFrameEnabled);
}

function beginRightPanVerticalLock() {
    rightPanLockController.beginVerticalLock({ controls, camera });
}

function enforceRightPanVerticalLock() {
    rightPanLockController.enforceVerticalLock({ controls, camera });
}

function endRightPanVerticalLock() {
    rightPanLockController.endVerticalLock();
}

function setShiftPanInteraction(active) {
    rightPanLockController.setShiftPanInteraction({
        active,
        controls,
        mousePanButton: THREE.MOUSE.PAN,
    });
}

function updateCropDimensionsDock(frameRect = null) {
    cropDimensionsDockController.updateCropDimensionsDock({
        frameRect,
        exportWorkspaceActive,
        exportFrameEnabled,
    });
}

function drawExportFrame() {
    const fc = document.getElementById('exportFrameCanvas');
    if (!fc) return;
    const wrap = fc.parentElement;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;
    if (fc.width !== w || fc.height !== h) { fc.width = w; fc.height = h; }

    const { sx, sy, sw, sh } = getCropFrameRect(w, h);
    const ctx = fc.getContext('2d');

    ctx.clearRect(0, 0, w, h);
    drawRulerOverlay(ctx, w, h, camera);

    if (exportFrameEnabled) {
        // Draw dim overlay directly on canvas — avoids hard CSS edges from backdrop-filter divs
        ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
        ctx.fillRect(0, 0, w, sy);                  // top
        ctx.fillRect(0, sy + sh, w, h - sy - sh);   // bottom
        ctx.fillRect(0, sy, sx, sh);                // left
        ctx.fillRect(sx + sw, sy, w - sx - sw, sh); // right

        // Corner bracket marks
        const cm = Math.max(8, Math.round(Math.min(sw, sh) * 0.07));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy + cm); ctx.lineTo(sx, sy); ctx.lineTo(sx + cm, sy);           // TL
        ctx.moveTo(sx + sw - cm, sy); ctx.lineTo(sx + sw, sy); ctx.lineTo(sx + sw, sy + cm);      // TR
        ctx.moveTo(sx, sy + sh - cm); ctx.lineTo(sx, sy + sh); ctx.lineTo(sx + cm, sy + sh);      // BL
        ctx.moveTo(sx + sw - cm, sy + sh); ctx.lineTo(sx + sw, sy + sh); ctx.lineTo(sx + sw, sy + sh - cm); // BR
        ctx.stroke();

        // Position the 4 transparent click-capture divs over the dim regions
        _cropSx = sx; _cropSy = sy; _cropSw = sw; _cropSh = sh;
        [['frameDimTop', 0, 0, w, sy],
        ['frameDimBottom', 0, sy + sh, w, h - sy - sh],
        ['frameDimLeft', 0, sy, sx, sh],
        ['frameDimRight', sx + sw, sy, w - sx - sw, sh]
        ].forEach(([id, l, t, dw, dh]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.left = l + 'px'; el.style.top = t + 'px';
            el.style.width = dw + 'px'; el.style.height = dh + 'px';
        });

        // Position corner drag handles at each frame corner
        const ch = 11; // half the hit-area size in px
        [['TL', sx, sy], ['TR', sx + sw, sy], ['BL', sx, sy + sh], ['BR', sx + sw, sy + sh]].forEach(([id, cx, cy]) => {
            const el = document.getElementById(`cropCorner${id}`);
            if (!el) return;
            el.style.left = (cx - ch) + 'px';
            el.style.top = (cy - ch) + 'px';
        });
        updateCropDimensionsDock({ sx, sy, sw, sh });
        document.documentElement.classList.add('crop-mode');
    } else {
        // Frame off: just clear — no hint brackets
        ctx.clearRect(0, 0, w, h);
        updateCropDimensionsDock();
        document.documentElement.classList.remove('crop-mode');
    }
}

function clearExportFrame() {
    // Dim is drawn on canvas each frame; just force-clear immediately for instant feedback
    const fc = document.getElementById('exportFrameCanvas');
    if (fc) fc.getContext('2d').clearRect(0, 0, fc.width, fc.height);
    _cropSx = 0; _cropSy = 0; _cropSw = 0; _cropSh = 0;
    updateCropDimensionsDock();
    document.documentElement.classList.remove('crop-mode');
}

// ── Ruler / dimensions HUD ────────────────────────────────────────────────────
function disposeRulerHoveredPartVisual() {
    if (!rulerHoveredPartBoxWire) return;
    if (rulerHoveredPartBoxWire.parent) rulerHoveredPartBoxWire.parent.remove(rulerHoveredPartBoxWire);
    if (rulerHoveredPartBoxWire.geometry?.dispose) rulerHoveredPartBoxWire.geometry.dispose();
    const mat = rulerHoveredPartBoxWire.material;
    if (Array.isArray(mat)) mat.forEach((entry) => entry?.dispose?.());
    else mat?.dispose?.();
    rulerHoveredPartBoxWire = null;
}

function ensureRulerHoveredPartVisual() {
    if (!mesh) return null;
    if (rulerHoveredPartBoxWire && rulerHoveredPartBoxWire.parent !== mesh) {
        disposeRulerHoveredPartVisual();
    }
    if (!rulerHoveredPartBoxWire) {
        const boxEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
        const boxMat = new THREE.LineDashedMaterial({
            color: '#f4f3ff',
            transparent: true,
            opacity: 1,
            dashSize: 0.08,
            gapSize: 0.05,
            depthTest: false,
            depthWrite: false,
        });
        rulerHoveredPartBoxWire = new THREE.LineSegments(boxEdges, boxMat);
        rulerHoveredPartBoxWire.computeLineDistances();
        rulerHoveredPartBoxWire.name = 'rulerHoveredPartBoxWire';
        rulerHoveredPartBoxWire.visible = false;
        rulerHoveredPartBoxWire.renderOrder = 40;
        rulerHoveredPartBoxWire.frustumCulled = false;
        mesh.add(rulerHoveredPartBoxWire);
    }
    return rulerHoveredPartBoxWire;
}

function syncRulerHoverSelectorState() {
    const activeHoverIndex = (hasModelParts() && rulerHoveredPartIndex >= 0) ? rulerHoveredPartIndex : -1;
    if (modelPartSelectorBtn) modelPartSelectorBtn.classList.toggle('is-ruler-hovering', activeHoverIndex >= 0);
    if (!modelPartSelectorMenu) return;
    modelPartSelectorMenu.querySelectorAll('.thumb-select-option').forEach((opt) => {
        const idx = parseInt(opt.dataset.partIndex, 10);
        opt.classList.toggle('is-ruler-hovered', idx === activeHoverIndex);
    });
}

function updateRulerHoveredPartVisual() {
    const canShowHoverBox = !!(
        mesh
        && hasModelParts()
        && rulerHoveredPartIndex >= 0
        && rulerHoveredPartIndex < modelPartBoundsBoxes.length
        && modelPartBoundsBoxes[rulerHoveredPartIndex]
    );

    if (!canShowHoverBox) {
        if (rulerHoveredPartBoxWire) rulerHoveredPartBoxWire.visible = false;
        return;
    }

    const hoverBox = ensureRulerHoveredPartVisual();
    if (!hoverBox) return;

    const contrastTheme = getRulerContrastTheme();
    const hoverMat = hoverBox.material;
    if (hoverMat?.color && contrastTheme?.labelText) {
        hoverMat.color.set(contrastTheme.labelText);
        hoverMat.opacity = 1;
    }

    const box = modelPartBoundsBoxes[rulerHoveredPartIndex];
    const size = box.getSize(rulerHoveredPartBoxSizeTmp);
    const center = box.getCenter(rulerHoveredPartBoxCenterTmp);
    hoverBox.position.copy(center);
    hoverBox.scale.set(
        Math.max(0.001, size.x),
        Math.max(0.001, size.y),
        Math.max(0.001, size.z)
    );
    hoverBox.visible = true;
}

function setRulerHoveredPartIndex(partIndex) {
    const normalized = (Number.isInteger(partIndex) && partIndex >= 0) ? partIndex : -1;
    if (rulerHoveredPartIndex === normalized) return;
    rulerHoveredPartIndex = normalized;
    updateRulerHoveredPartVisual();
    applyPartInteractionVisualsToMeshMaterials();
    syncRulerHoverSelectorState();
    if (hasModelParts()) updateRulerHUD();
}

function ensurePausedForInteractionMode() {
    const shouldForcePause = !!(hasModelParts() && rulerPartHoverEnabled);
    if (!shouldForcePause) {
        updatePauseControlAvailability();
        return;
    }
    if (rotateModeEl?.value === 'off') {
        updatePauseControlAvailability();
        return;
    }
    if (!isPaused) setPauseState(true, false, true);
    else updatePauseControlAvailability();
}

function setRulerPartHoverEnabled(enabled, persist = true) {
    const next = !!enabled;
    if (rulerPartHoverEnabled === next) {
        ensurePausedForInteractionMode();
        return;
    }
    rulerPartHoverEnabled = next;
    updateLiveRulerOverlay();
    ensurePausedForInteractionMode();
    updateRulerHUD();
    if (persist) saveSettings();
}

function setRulerPartSelectMultiEnabled(enabled, persist = true) {
    const next = !!enabled && isMultipartModel();
    if (next && rulerPartHoverEnabled) {
        rulerPartHoverEnabled = false;
    }
    if (!next) normalizeBulkSelectionForMode();
    if (rulerPartSelectMultiEnabled === next) {
        syncModelPartCheckboxStates();
        syncModelPartBulkUIState();
        updateRulerHUD();
        return;
    }
    rulerPartSelectMultiEnabled = next;
    if (!next) normalizeBulkSelectionForMode();
    if (!next && !rulerPartHoverEnabled) {
        setRulerHoveredPartIndex(-1);
    }
    applyPartInteractionVisualsToMeshMaterials();
    ensurePausedForInteractionMode();
    syncModelPartCheckboxStates();
    syncModelPartBulkUIState();
    updateRulerHUD();
    if (persist) saveSettings();
}

function getRulerDisplayedDims() {
    // Dims are shown in canvas 3D annotations only; never in the bottom HUD.
    return null;
}

function resolveHoveredPartIndexFromIntersection(intersection) {
    if (!intersection) return -1;

    if (hasModelParts() && modelPartNames.length === 1) return 0;

    const faceMaterialIndex = intersection.face?.materialIndex;
    if (Number.isInteger(faceMaterialIndex) && faceMaterialIndex >= 0) return faceMaterialIndex;

    const geometry = intersection.object?.geometry;
    const faceIndex = intersection.faceIndex;
    if (!geometry || !Number.isInteger(faceIndex)) return -1;

    const groups = Array.isArray(geometry.groups) ? geometry.groups : [];
    if (!groups.length) return -1;

    const triStart = faceIndex * 3;
    for (const group of groups) {
        const start = Math.max(0, Math.floor(Number(group.start) || 0));
        const count = Math.max(0, Math.floor(Number(group.count) || 0));
        if (triStart >= start && triStart < (start + count)) {
            return Number.isInteger(group.materialIndex) ? group.materialIndex : -1;
        }
    }

    return -1;
}

function resolveHoveredPartIndexFromPointerEvent(ev) {
    if (!canvas || !camera || !mesh || !hasModelParts()) return -1;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return -1;

    const x = (ev.clientX - rect.left) / rect.width;
    const y = (ev.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return -1;

    rulerPartHoverPointerNdc.set(x * 2 - 1, -(y * 2 - 1));
    rulerPartHoverRaycaster.setFromCamera(rulerPartHoverPointerNdc, camera);
    const hits = rulerPartHoverRaycaster.intersectObject(mesh, false);
    if (!hits.length) return -1;

    const partIndex = resolveHoveredPartIndexFromIntersection(hits[0]);
    if (!Number.isInteger(partIndex) || partIndex < 0 || partIndex >= modelPartNames.length) return -1;
    if (modelPartSettings?.[partIndex]?.hidden) return -1;
    return partIndex;
}

function selectModelPartFromRulerHover(partIndex, multiSelect = false) {
    const idx = Number.isInteger(partIndex) ? partIndex : -1;
    if (idx < 0 || idx >= modelPartNames.length) return;

    if (!isMultipartModel()) {
        modelPartSelected = 0;
        bulkSelectedPartIndices.clear();
    } else if (multiSelect) {
        const isSelected = bulkSelectedPartIndices.has(idx);
        setBulkPartSelected(idx, !isSelected);
        if (!bulkSelectedPartIndices.size) modelPartSelected = idx;
        syncActivePartFromUiSelection();
    } else {
        modelPartSelected = idx;
        bulkSelectedPartIndices.clear();
        setBulkPartSelected(idx, true);
        syncActivePartFromUiSelection();
    }

    syncUIFromSelectedPart();
    applyPartColorsToMesh();
    syncModelPartSelectorUI(!!(modelPartSelectorMenu && !modelPartSelectorMenu.hidden));
    syncModelPartCheckboxStates();
    syncModelPartBulkUIState();
    saveSettings();
}

function applyRulerBulkSelectionAndRefresh(selectAll) {
    if (!isMultipartModel()) return;
    setBulkPartSelectionForAll(!!selectAll);
    syncActivePartFromUiSelection();
    syncUIFromSelectedPart();
    applyPartColorsToMesh();
    syncModelPartSelectorUI(!!(modelPartSelectorMenu && !modelPartSelectorMenu.hidden));
    syncModelPartCheckboxStates();
    syncModelPartBulkUIState();
    updateRulerHUD();
    saveSettings();
}

function updateRulerPartHoverFromPointerEvent(ev) {
    if (!hasModelParts()) {
        rulerHoverNoHitSinceMs = 0;
        if (rulerHoveredPartIndex >= 0) setRulerHoveredPartIndex(-1);
        if (canvas) canvas.style.cursor = '';
        return;
    }

    const partIndex = resolveHoveredPartIndexFromPointerEvent(ev);
    if (partIndex < 0) {
        if (rulerHoveredPartIndex >= 0) {
            const now = performance.now();
            if (!rulerHoverNoHitSinceMs) {
                rulerHoverNoHitSinceMs = now;
                return;
            }
            if (now - rulerHoverNoHitSinceMs < 90) return;
        }
        rulerHoverNoHitSinceMs = 0;
        setRulerHoveredPartIndex(-1);
        if (canvas) canvas.style.cursor = '';
        return;
    }
    rulerHoverNoHitSinceMs = 0;
    setRulerHoveredPartIndex(partIndex);
    if (canvas) canvas.style.cursor = 'pointer';
}

function updateRulerHUD() {
    const inspectActive = !!(hasModelParts() && rulerPartHoverEnabled);
    const hasParts = hasModelParts();
    if (btnInspectMode) {
        const label = inspectActive ? 'Measurements on' : 'Measurements off';
        btnInspectMode.classList.toggle('is-active', inspectActive);
        btnInspectMode.setAttribute('aria-pressed', inspectActive ? 'true' : 'false');
        btnInspectMode.title = label;
        btnInspectMode.setAttribute('aria-label', label);
    }
    if (rulerModePickerEl) rulerModePickerEl.hidden = !hasParts;
    if (rulerHoverToggleEl) rulerHoverToggleEl.hidden = !hasParts;
    if (rulerSelectToggleEl) rulerSelectToggleEl.hidden = !isMultipartModel();

    const hud = document.getElementById('rulerHUD');
    if (!hud) return;
    hud.hidden = true;
    document.documentElement.classList.toggle('ruler-visible', false);
    if (!modelDims) return;

    const dims = getRulerDisplayedDims();
    hud.classList.toggle('is-dims-hidden', !dims || !rulerEnabled);
    const rulerUnitSelect = document.getElementById('rulerUnitSelect');
    if (rulerUnitSelect) rulerUnitSelect.value = rulerUnit;
    if (rulerUnitSelectModalEl) rulerUnitSelectModalEl.value = rulerUnit;
    document.getElementById('rulerL').textContent = dims ? formatRulerValue(dims.d) : '—';
    document.getElementById('rulerW').textContent = dims ? formatRulerValue(dims.w) : '—';
    document.getElementById('rulerH').textContent = dims ? formatRulerValue(dims.h) : '—';
}

function rulerUnitSuffix() {
    return (rulerUnit === 'imperial') ? 'in' : 'mm';
}

function formatRulerValue(mm) {
    const raw = (rulerUnit === 'imperial') ? (mm / 25.4) : mm;
    return (rulerUnit === 'imperial') ? raw.toFixed(2) : raw.toFixed(1);
}

function formatRulerLabel(prefix, mm) {
    return `${formatRulerValue(mm)} ${rulerUnitSuffix()} ${prefix}`;
}

function projectToCanvas(point, cam, width, height) {
    const projected = point.clone().project(cam);
    return new THREE.Vector2(
        (projected.x * 0.5 + 0.5) * width,
        (-projected.y * 0.5 + 0.5) * height
    );
}

function drawArrowCap(ctx, from, to, size = 7) {
    const dir = to.clone().sub(from);
    const len = dir.length();
    if (len < 1e-3) return;
    dir.divideScalar(len);
    const perp = new THREE.Vector2(-dir.y, dir.x);
    const back = to.clone().sub(dir.clone().multiplyScalar(size));
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(back.x + perp.x * size * 0.55, back.y + perp.y * size * 0.55);
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(back.x - perp.x * size * 0.55, back.y - perp.y * size * 0.55);
    ctx.stroke();
}

function drawRoundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, width * 0.5, height * 0.5));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawMeasurementLabel(ctx, text, position, align = 'center') {
    const contrastTheme = getRulerContrastTheme();
    ctx.save();
    const transform = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
    const scaleX = transform?.a || 1;
    const scaleY = transform?.d || 1;
    const logicalWidth = (ctx.canvas.width || 0) / Math.max(1, Math.abs(scaleX));
    const logicalHeight = (ctx.canvas.height || 0) / Math.max(1, Math.abs(scaleY));
    const canvasMin = Math.max(120, Math.min(logicalWidth, logicalHeight));
    const isCompactCanvas = canvasMin < 260;
    const scale = isCompactCanvas
        ? Math.max(0.58, Math.min(0.82, canvasMin / 320))
        : Math.max(0.72, Math.min(1, canvasMin / 560));
    const fontSize = Math.round(13 * scale);
    const padX = Math.round(10 * scale);
    const padY = Math.round(7 * scale);
    const radius = Math.round(10 * scale);
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    const metrics = ctx.measureText(text);
    const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.75;
    const descent = metrics.actualBoundingBoxDescent || fontSize * 0.28;
    const boxW = Math.ceil(metrics.width + padX * 2 + fontSize * 0.5);
    const boxH = Math.max(fontSize + padY * 2, ascent + descent + padY * 2);
    const edgePad = Math.max(4, Math.round(6 * scale));
    let boxX = position.x - boxW / 2;
    if (align === 'left') boxX = position.x;
    else if (align === 'right') boxX = position.x - boxW;
    boxX = Math.max(edgePad, Math.min(logicalWidth - edgePad - boxW, boxX));
    const boxCenterX = boxX + boxW / 2;
    const y = Math.max(edgePad + boxH / 2, Math.min(logicalHeight - edgePad - boxH / 2, position.y));
    const boxY = y - boxH / 2;
    const baselineY = y + (ascent - descent) * 0.5;
    ctx.fillStyle = contrastTheme.labelFill;
    ctx.strokeStyle = contrastTheme.labelStroke;
    ctx.lineWidth = 1;
    drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, radius);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = contrastTheme.labelText || PALETTE.text.measurement;
    ctx.textAlign = 'center';
    ctx.fillText(text, boxCenterX, baselineY);
    ctx.restore();
}

function drawMeasurement(ctx, start, end, text, center, options = {}) {
    const contrastTheme = getRulerContrastTheme();
    const {
        offset = 24,
        labelOffset = 22,
        extension = 6,
        align = 'center',
        dashed = false,
        showConnectors = true,
        showArrows = true,
    } = options;
    const edge = end.clone().sub(start);
    const edgeLen = edge.length();
    if (edgeLen < 8) return;
    const dir = edge.clone().divideScalar(edgeLen);
    let normal = new THREE.Vector2(-dir.y, dir.x);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const outward = mid.clone().sub(center);
    if (outward.dot(normal) < 0) normal.multiplyScalar(-1);
    const offsetVec = normal.clone().multiplyScalar(offset);
    const a = start.clone().add(offsetVec);
    const b = end.clone().add(offsetVec);

    ctx.strokeStyle = contrastTheme.lineStroke;
    ctx.lineWidth = 2;
    ctx.setLineDash(dashed ? [7, 5] : []);
    ctx.beginPath();
    if (showConnectors) {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(a.x, a.y);
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(b.x, b.y);
    }
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (showArrows) {
        drawArrowCap(ctx, b, a, extension);
        drawArrowCap(ctx, a, b, extension);
    }

    const labelPos = a.clone().add(b).multiplyScalar(0.5).add(normal.multiplyScalar(labelOffset));
    drawMeasurementLabel(ctx, text, labelPos, align);
}

function drawRulerOverlay(ctx, width, height, cam, options = {}) {
    if (!RULER_DYNAMIC_LINES_ENABLED) return;
    if (!rulerEnabled || !rulerLinesVisible || !modelDims) return;
    try {
        const contrastTheme = getRulerContrastTheme();
        const layout = options.layout || getRulerScreenLayout(width, height, cam, options.safeArea);
        if (!layout) return;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = contrastTheme.lineStroke;
        ctx.lineWidth = layout.lineWidth;
        ctx.beginPath();
        ctx.moveTo(layout.widthLine.x1, layout.widthLine.y1);
        ctx.lineTo(layout.widthLine.x2, layout.widthLine.y2);
        ctx.moveTo(layout.heightLine.x1, layout.heightLine.y1);
        ctx.lineTo(layout.heightLine.x2, layout.heightLine.y2);
        ctx.moveTo(layout.depthLine.x1, layout.depthLine.y1);
        ctx.lineTo(layout.depthLine.x2, layout.depthLine.y2);
        ctx.stroke();

        drawMeasurementLabel(ctx, formatRulerLabel('Width', modelDims.w), new THREE.Vector2(layout.widthLabel.x, layout.widthLabel.y), layout.widthLabel.align || 'center');
        drawMeasurementLabel(ctx, formatRulerLabel('Height', modelDims.h), new THREE.Vector2(layout.heightLabel.x, layout.heightLabel.y), layout.heightLabel.align || 'left');
        drawMeasurementLabel(ctx, formatRulerLabel('Length', modelDims.d), new THREE.Vector2(layout.depthLabel.x, layout.depthLabel.y), layout.depthLabel.align || 'left');
        ctx.restore();
    } catch (e) {
        return;
    }
}

function formatRulerIncrementLabel(mm, includeUnit = false) {
    const raw = (rulerUnit === 'imperial') ? (mm / 25.4) : mm;
    const rounded = (rulerUnit === 'imperial')
        ? (raw >= 10 ? Math.round(raw).toString() : raw.toFixed(1).replace(/\.0$/, ''))
        : Math.round(raw).toString();
    if (!includeUnit) return rounded;
    return `${rounded} ${rulerUnitSuffix()}`;
}

function drawRulerHoverGridIncrements(ctx, width, height, cam) {
    if (!rulerEnabled || !getRulerInteractionMode() || !rulerLinesVisible || !mesh || !cam) return;
    const contrastTheme = getRulerContrastTheme();

    const spanX = Math.max(20, rulerGridSpanX || clampBuildPlateSize(buildPlateWidth, BUILD_PLATE_DEFAULTS.width));
    const spanZ = Math.max(20, rulerGridSpanZ || clampBuildPlateSize(buildPlateDepth, BUILD_PLATE_DEFAULTS.depth));
    const stepMm = Math.max(1, rulerGridStepMm || getRulerGridIncrementStepMm(Math.max(spanX, spanZ)));
    const centerX = rulerGridHelper?.position?.x ?? buildPlateMesh?.position?.x ?? 0;
    const centerZ = rulerGridHelper?.position?.z ?? buildPlateMesh?.position?.z ?? 0;
    const gridY = rulerGridHelper?.position?.y ?? buildPlateMesh?.position?.y ?? 0;
    const halfX = spanX * 0.5;
    const halfZ = spanZ * 0.5;

    const frontMid = projectToCanvas(new THREE.Vector3(centerX, gridY, centerZ - halfZ), cam, width, height);
    const backMid = projectToCanvas(new THREE.Vector3(centerX, gridY, centerZ + halfZ), cam, width, height);
    const leftMid = projectToCanvas(new THREE.Vector3(centerX - halfX, gridY, centerZ), cam, width, height);
    const rightMid = projectToCanvas(new THREE.Vector3(centerX + halfX, gridY, centerZ), cam, width, height);
    if (!Number.isFinite(frontMid.x) || !Number.isFinite(frontMid.y)
        || !Number.isFinite(backMid.x) || !Number.isFinite(backMid.y)
        || !Number.isFinite(leftMid.x) || !Number.isFinite(leftMid.y)
        || !Number.isFinite(rightMid.x) || !Number.isFinite(rightMid.y)) {
        return;
    }

    const labelEdgeZ = (frontMid.y > backMid.y) ? (centerZ - halfZ) : (centerZ + halfZ);
    const labelEdgeX = (leftMid.x < rightMid.x) ? (centerX - halfX) : (centerX + halfX);

    const ticksX = Math.max(1, Math.floor(spanX / stepMm));
    const ticksZ = Math.max(1, Math.floor(spanZ / stepMm));
    const compact = width < 720 || height < 560;
    const tiny = width < 560 || height < 440;
    const maxLabelsX = tiny ? 5 : (compact ? 7 : 12);
    const maxLabelsZ = tiny ? 4 : (compact ? 6 : 12);
    const skipX = Math.max(1, Math.ceil((ticksX + 1) / maxLabelsX));
    const skipZ = Math.max(1, Math.ceil((ticksZ + 1) / maxLabelsZ));

    ctx.save();
    ctx.font = tiny
        ? '600 9px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        : (compact
            ? '600 10px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            : '600 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
    ctx.fillStyle = contrastTheme.tickText;
    ctx.strokeStyle = contrastTheme.tickStroke;
    ctx.lineWidth = 1;
    ctx.textBaseline = 'middle';

    ctx.textAlign = 'center';
    for (let i = 0; i <= ticksX; i += skipX) {
        const distMm = Math.min(spanX, i * stepMm);
        const worldX = (centerX - halfX) + distMm;
        const pt = projectToCanvas(new THREE.Vector3(worldX, gridY, labelEdgeZ), cam, width, height);
        if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) continue;
        const label = formatRulerIncrementLabel(distMm, i === 0);
        const tickDir = (labelEdgeZ < centerZ) ? -1 : 1;
        const tickLen = tiny ? 4 : 6;
        const textOffset = tiny ? 12 : 16;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x, pt.y + (tickDir * tickLen));
        ctx.stroke();
        ctx.fillText(label, pt.x, pt.y + (tickDir * textOffset));
    }

    ctx.textAlign = (labelEdgeX < centerX) ? 'right' : 'left';
    for (let i = 0; i <= ticksZ; i += skipZ) {
        const distMm = Math.min(spanZ, i * stepMm);
        const worldZ = (centerZ - halfZ) + distMm;
        const pt = projectToCanvas(new THREE.Vector3(labelEdgeX, gridY, worldZ), cam, width, height);
        if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) continue;
        const label = formatRulerIncrementLabel(distMm, i === 0);
        const tickDir = (labelEdgeX < centerX) ? -1 : 1;
        const tickLen = tiny ? 4 : 6;
        const textOffset = tiny ? 9 : 12;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + (tickDir * tickLen), pt.y);
        ctx.stroke();
        ctx.fillText(label, pt.x + (tickDir * textOffset), pt.y);
    }
    ctx.restore();
}

function getSelectedPartsUnionBoxForInspect() {
    if (!isMultipartModel() || !Array.isArray(modelPartBoundsBoxes) || !modelPartBoundsBoxes.length) return null;
    const selected = getUiSelectedPartIndices();
    if (selected.length < 2) return null;

    let union = null;
    selected.forEach((idx) => {
        if (!Number.isInteger(idx) || idx < 0 || idx >= modelPartBoundsBoxes.length) return;
        if (modelPartSettings?.[idx]?.hidden) return;
        const partBox = modelPartBoundsBoxes[idx];
        if (!partBox || partBox.isEmpty?.()) return;
        if (!union) union = partBox.clone();
        else union.union(partBox);
    });

    if (!union || union.isEmpty?.()) return null;
    return union;
}

function drawRulerHoverPartContextualDims(ctx, width, height, cam) {
    if (!rulerPartHoverEnabled || !hasModelParts() || !mesh || !cam) return;
    const selectedUnionBox = getSelectedPartsUnionBoxForInspect();
    const useGroupedSelection = !!selectedUnionBox;

    if (!useGroupedSelection && (rulerHoveredPartIndex < 0 || rulerHoveredPartIndex >= modelPartBoundsBoxes.length)) return;

    const partBox = useGroupedSelection
        ? selectedUnionBox
        : modelPartBoundsBoxes[rulerHoveredPartIndex];
    if (!partBox || partBox.isEmpty?.()) return;

    const min = partBox.min;
    const max = partBox.max;
    const cornersLocal = [
        new THREE.Vector3(min.x, min.y, min.z), // 0
        new THREE.Vector3(max.x, min.y, min.z), // 1
        new THREE.Vector3(min.x, max.y, min.z), // 2
        new THREE.Vector3(max.x, max.y, min.z), // 3
        new THREE.Vector3(min.x, min.y, max.z), // 4
        new THREE.Vector3(max.x, min.y, max.z), // 5
        new THREE.Vector3(min.x, max.y, max.z), // 6
        new THREE.Vector3(max.x, max.y, max.z), // 7
    ];
    const cornersScreen = cornersLocal.map((point) => projectToCanvas(point.clone().applyMatrix4(mesh.matrixWorld), cam, width, height));
    if (cornersScreen.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return;

    const center = cornersScreen.reduce((acc, point) => {
        acc.x += point.x;
        acc.y += point.y;
        return acc;
    }, new THREE.Vector2(0, 0)).multiplyScalar(1 / cornersScreen.length);

    const findBestAxisEdge = (axisBit) => {
        let best = null;
        for (let base = 0; base < 8; base += 1) {
            if (base & axisBit) continue;
            const pair = base | axisBit;
            const a = cornersScreen[base];
            const b = cornersScreen[pair];
            const len = a.distanceTo(b);
            if (!best || len > best.len) best = { a, b, len };
        }
        return best;
    };

    const hoveredDims = useGroupedSelection
        ? (() => {
            const size = partBox.getSize(new THREE.Vector3());
            return { w: size.x, d: size.y, h: size.z };
        })()
        : ((rulerHoveredPartIndex >= 0 && rulerHoveredPartIndex < modelPartDimensions.length)
            ? modelPartDimensions[rulerHoveredPartIndex]
            : modelDims);
    if (!hoveredDims) return;

    const axisSpecs = [
        { axisBit: 2, label: 'L', value: hoveredDims.d, offset: 20, labelOffset: 14 },
        { axisBit: 1, label: 'W', value: hoveredDims.w, offset: 16, labelOffset: 14 },
        { axisBit: 4, label: 'H', value: hoveredDims.h, offset: 16, labelOffset: 14 },
    ];

    axisSpecs.forEach((spec) => {
        const edge = findBestAxisEdge(spec.axisBit);
        if (!edge || edge.len < 18 || !Number.isFinite(spec.value)) return;
        const text = `${spec.label} ${formatRulerValue(spec.value)} ${rulerUnitSuffix()}`;
        drawMeasurement(ctx, edge.a, edge.b, text, center, {
            offset: spec.offset,
            labelOffset: spec.labelOffset,
            dashed: true,
            showConnectors: false,
            showArrows: true,
        });
    });
}

function getRulerScreenLayout(width, height, cam = camera, safeArea = null) {
    if (!modelDims) return null;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const edge = 10;
    const area = {
        top: safeArea?.top ?? edge,
        right: safeArea?.right ?? edge,
        bottom: safeArea?.bottom ?? edge,
        left: safeArea?.left ?? edge,
    };
    if (!mesh || !cam) return null;

    const geometry = mesh.geometry;
    if (!geometry) return null;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box || box.isEmpty()) return null;

    const min = box.min;
    const max = box.max;
    const corners = [
        new THREE.Vector3(min.x, min.y, min.z),
        new THREE.Vector3(max.x, min.y, min.z),
        new THREE.Vector3(min.x, max.y, min.z),
        new THREE.Vector3(max.x, max.y, min.z),
        new THREE.Vector3(min.x, min.y, max.z),
        new THREE.Vector3(max.x, min.y, max.z),
        new THREE.Vector3(min.x, max.y, max.z),
        new THREE.Vector3(max.x, max.y, max.z),
    ].map((point) => projectToCanvas(point.clone().applyMatrix4(mesh.matrixWorld), cam, width, height));

    const valid = corners.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (valid.length < 8) return null;

    const minX = Math.min(...valid.map((p) => p.x));
    const maxX = Math.max(...valid.map((p) => p.x));
    const minY = Math.min(...valid.map((p) => p.y));
    const maxY = Math.max(...valid.map((p) => p.y));

    const useCompactLiveLayout = !!safeArea && typeof window !== 'undefined'
        && (window.innerWidth < 1100 || window.innerHeight < 820);
    if (useCompactLiveLayout) {
        const spanX = Math.max(24, maxX - minX);
        const spanY = Math.max(24, maxY - minY);
        const pad = clamp(Math.min(width, height) * 0.05, 12, 30);
        const depthOffsetX = clamp(spanX * 0.22, 14, 50);
        const depthOffsetY = clamp(spanY * 0.16, 9, 34);
        const widthY = clamp(maxY + pad * 0.85, edge, height - edge);
        const heightX = clamp(maxX + pad, edge, width - edge);
        const centerX = clamp((minX + maxX) / 2, edge, width - edge);
        const centerY = clamp((minY + maxY) / 2, edge, height - edge);
        const lineWidth = clamp(Math.min(width, height) * 0.0035, 1.5, 2.8);
        const labelBottom = height - Math.min(area.bottom, 64);

        return {
            lineWidth,
            widthLine: {
                x1: clamp(minX, edge, width - edge),
                y1: widthY,
                x2: clamp(maxX, edge, width - edge),
                y2: widthY
            },
            heightLine: {
                x1: heightX,
                y1: clamp(minY, edge, height - edge),
                x2: heightX,
                y2: clamp(maxY, edge, height - edge)
            },
            depthLine: {
                x1: clamp(maxX - depthOffsetX, edge, width - edge),
                y1: clamp(maxY - depthOffsetY * 0.5, edge, height - edge),
                x2: clamp(maxX + pad * 0.45, edge, width - edge),
                y2: clamp(maxY - depthOffsetY * 1.15, edge, height - edge)
            },
            widthLabel: {
                x: centerX,
                y: clamp(widthY + 22, area.top + 54, labelBottom),
                align: 'center'
            },
            heightLabel: {
                x: clamp(heightX + 12, area.left, width - area.right),
                y: clamp(centerY, area.top + 20, labelBottom),
                align: 'left'
            },
            depthLabel: {
                x: clamp(heightX - 18, area.left, width - area.right),
                y: clamp(maxY - depthOffsetY * 1.2 - 8, area.top + 20, labelBottom),
                align: 'right'
            },
        };
    }

    const center = new THREE.Vector2(
        valid.reduce((sum, p) => sum + p.x, 0) / valid.length,
        valid.reduce((sum, p) => sum + p.y, 0) / valid.length
    );

    const getEdgeCandidates = (pairs) => {
        const out = [];
        for (const [a, b] of pairs) {
            const p1 = corners[a];
            const p2 = corners[b];
            const len = p1.distanceTo(p2);
            if (!Number.isFinite(len) || len < 10) continue;
            const mid = p1.clone().add(p2).multiplyScalar(0.5);
            out.push({ p1: p1.clone(), p2: p2.clone(), mid, len });
        }
        return out;
    };

    const pickEdge = (candidates, scoreFn) => {
        let best = null;
        let bestScore = -Infinity;
        for (const edge of candidates) {
            const score = scoreFn(edge.mid, edge.p1, edge.p2, edge.len);
            if (score > bestScore) {
                bestScore = score;
                best = { p1: edge.p1.clone(), p2: edge.p2.clone(), mid: edge.mid.clone(), len: edge.len };
            }
        }
        return best;
    };

    const xPairs = [[0, 1], [2, 3], [4, 5], [6, 7]];
    const yPairs = [[0, 2], [1, 3], [4, 6], [5, 7]];
    const zPairs = [[0, 4], [1, 5], [2, 6], [3, 7]];

    const widthEdge = pickEdge(getEdgeCandidates(xPairs), (mid, _p1, _p2, len) => mid.y + len * 0.08);
    const heightEdge = pickEdge(getEdgeCandidates(yPairs), (mid, _p1, _p2, len) => mid.x + len * 0.08);
    const depthEdge = pickEdge(getEdgeCandidates(zPairs), (mid, p1, p2, len) => {
        const slope = Math.abs((p2.y - p1.y) / Math.max(1e-3, p2.x - p1.x));
        return mid.x + mid.y * 0.55 + slope * 24 + len * 0.04;
    });

    if (!widthEdge || !heightEdge || !depthEdge) return null;

    const buildLine = (edgeData, offsetPx, labelOffsetPx, forceAlign = null) => {
        const dir = edgeData.p2.clone().sub(edgeData.p1);
        const len = dir.length();
        if (len < 1) return null;
        dir.multiplyScalar(1 / len);
        let normal = new THREE.Vector2(-dir.y, dir.x);
        const outward = edgeData.mid.clone().sub(center);
        if (outward.dot(normal) < 0) normal.multiplyScalar(-1);
        const lineStart = edgeData.p1.clone().add(normal.clone().multiplyScalar(offsetPx));
        const lineEnd = edgeData.p2.clone().add(normal.clone().multiplyScalar(offsetPx));
        const labelPos = lineStart.clone().add(lineEnd).multiplyScalar(0.5).add(normal.clone().multiplyScalar(labelOffsetPx));
        return {
            line: {
                x1: clamp(lineStart.x, area.left, width - area.right),
                y1: clamp(lineStart.y, area.top, height - area.bottom),
                x2: clamp(lineEnd.x, area.left, width - area.right),
                y2: clamp(lineEnd.y, area.top, height - area.bottom),
            },
            label: {
                x: clamp(labelPos.x, area.left, width - area.right),
                y: clamp(labelPos.y, area.top, height - area.bottom),
                align: forceAlign || (Math.abs(normal.x) < 0.25 ? 'center' : (normal.x > 0 ? 'left' : 'right')),
            }
        };
    };

    const widthMeasure = buildLine(widthEdge, 18, 18, 'center');
    const heightMeasure = buildLine(heightEdge, 16, 18, null);
    const depthMeasure = buildLine(depthEdge, 12, 16, null);
    if (!widthMeasure || !heightMeasure || !depthMeasure) return null;

    const lineWidth = clamp(Math.min(width, height) * 0.0035, 1.5, 2.8);

    return {
        lineWidth,
        widthLine: widthMeasure.line,
        heightLine: heightMeasure.line,
        depthLine: depthMeasure.line,
        widthLabel: widthMeasure.label,
        heightLabel: heightMeasure.label,
        depthLabel: depthMeasure.label,
    };
}

function getLiveRulerSafeArea(wrap) {
    const safe = { top: 12, right: 12, bottom: 12, left: 12 };
    if (!wrap) return safe;
    const wrapRect = wrap.getBoundingClientRect();
    const projectRect = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        return {
            left: rect.left - wrapRect.left,
            top: rect.top - wrapRect.top,
            right: rect.right - wrapRect.left,
            bottom: rect.bottom - wrapRect.top,
            width: rect.width,
            height: rect.height,
        };
    };

    const topRight = projectRect('.canvas-top-right');
    if (topRight) {
        safe.top = Math.max(safe.top, topRight.bottom + 8);
    }

    const hint = projectRect('.orbit-hint-bar.visible');
    if (hint) safe.top = Math.max(safe.top, hint.bottom + 8);

    const bottomCenter = projectRect('.canvas-bottom-center');
    if (bottomCenter) safe.bottom = Math.max(safe.bottom, Math.max(0, wrapRect.height - bottomCenter.top) + 8);

    const bottomLeft = projectRect('.canvas-overlay-bl');
    if (bottomLeft) {
        safe.bottom = Math.max(safe.bottom, Math.max(0, wrapRect.height - bottomLeft.top) + 8);
        safe.left = Math.max(safe.left, bottomLeft.right + 8);
    }

    const bottomRight = projectRect('.canvas-overlay-br');
    if (bottomRight) {
        safe.bottom = Math.max(safe.bottom, Math.max(0, wrapRect.height - bottomRight.top) + 8);
    }

    const camNav = projectRect('.cam-nav');
    if (camNav) {
        safe.right = Math.max(safe.right, Math.max(0, wrapRect.width - camNav.left) + 12);
        safe.bottom = Math.max(safe.bottom, Math.max(0, wrapRect.height - camNav.top) + 8);
    }

    return safe;
}

function getProjectedMeshScreenBounds(width, height, cam = camera) {
    if (!mesh || !cam) return null;
    const pos = mesh.geometry?.attributes?.position;
    if (!pos || pos.count < 8) return null;

    const worldPoint = new THREE.Vector3();
    const clipPoint = new THREE.Vector3();
    const xs = [];
    const ys = [];
    const step = Math.max(1, Math.floor(pos.count / 2200));

    for (let i = 0; i < pos.count; i += step) {
        worldPoint.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
        clipPoint.copy(worldPoint).project(cam);
        if (!Number.isFinite(clipPoint.x) || !Number.isFinite(clipPoint.y) || !Number.isFinite(clipPoint.z)) continue;
        const x = (clipPoint.x * 0.5 + 0.5) * width;
        const y = (-clipPoint.y * 0.5 + 0.5) * height;
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        xs.push(x);
        ys.push(y);
    }

    if (xs.length < 24) return null;
    xs.sort((a, b) => a - b);
    ys.sort((a, b) => a - b);
    const lo = Math.floor((xs.length - 1) * 0.02);
    const hi = Math.ceil((xs.length - 1) * 0.98);

    return {
        minX: xs[lo],
        maxX: xs[hi],
        minY: ys[lo],
        maxY: ys[hi],
    };
}

function ensureRulerOverlayEl() {
    if (rulerOverlayEl) return rulerOverlayEl;
    const wrap = canvas?.parentElement;
    if (!wrap) return null;
    const overlay = document.createElement('canvas');
    overlay.id = 'rulerOverlay';
    Object.assign(overlay.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '6',
    });
    wrap.appendChild(overlay);
    rulerOverlayEl = overlay;
    return overlay;
}

function updateLiveRulerOverlay() {
    const overlay = ensureRulerOverlayEl();
    if (!overlay) return;
    updateRulerGrid();

    const canRenderRulerOverlay = !!(modelDims && viewerSec && !viewerSec.classList.contains('hidden'));
    const interactionModeActive = !!hasModelParts();
    const showDynamicLines = !!(canRenderRulerOverlay && !interactionModeActive && RULER_DYNAMIC_LINES_ENABLED && rulerLinesVisible);
    const hasInspectSelectionGroup = !!(isMultipartModel() && getUiSelectedPartIndices().length > 1);
    const showHoverContextualDims = !!(canRenderRulerOverlay && rulerPartHoverEnabled && (rulerHoveredPartIndex >= 0 || hasInspectSelectionGroup));
    const showHoverIncrements = false;

    if (!showDynamicLines && !showHoverContextualDims && !showHoverIncrements) {
        overlay.style.display = 'none';
        const ctx = overlay.getContext?.('2d');
        if (ctx) ctx.clearRect(0, 0, overlay.width || 0, overlay.height || 0);
        return;
    }

    overlay.style.display = '';
    const wrap = canvas?.parentElement;
    if (!wrap) return;
    const cssW = wrap.clientWidth;
    const cssH = wrap.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pxW = Math.max(2, Math.round(cssW * dpr));
    const pxH = Math.max(2, Math.round(cssH * dpr));
    if (overlay.width !== pxW || overlay.height !== pxH) {
        overlay.width = pxW;
        overlay.height = pxH;
    }
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    if (showDynamicLines) {
        const layout = getRulerScreenLayout(cssW, cssH, camera, getLiveRulerSafeArea(wrap));
        if (layout) drawRulerOverlay(ctx, cssW, cssH, camera, { layout });
    }
    if (showHoverIncrements) {
        drawRulerHoverGridIncrements(ctx, cssW, cssH, camera);
    }
    if (showHoverContextualDims) {
        drawRulerHoverPartContextualDims(ctx, cssW, cssH, camera);
    }
}

function disposeRulerFootprintHelper() {
    if (!rulerFootprintHelper) return;
    if (scene) scene.remove(rulerFootprintHelper);
    rulerFootprintHelper.traverse((obj) => {
        if (obj.geometry?.dispose) {
            try { obj.geometry.dispose(); } catch (e) { }
        }
        if (obj.material) disposeMaterials(obj.material);
    });
    rulerFootprintHelper = null;
    rulerFootprintSignature = '';
}

function getRulerFootprintStepMm(spanMm) {
    const base = (rulerUnit === 'imperial') ? 25.4 : 10;
    const maxGuides = 120;
    let step = base;
    while (spanMm / step > maxGuides) step *= 2;
    return step;
}

function buildRulerFootprintHelper(minX, maxX, minZ, maxZ, stepMm) {
    const group = new THREE.Group();
    group.name = 'rulerFootprintHelper';

    const edgePositions = [];
    const guidePositions = [];
    const addSegment = (arr, x1, z1, x2, z2) => {
        arr.push(x1, 0, z1, x2, 0, z2);
    };

    addSegment(edgePositions, minX, minZ, maxX, minZ);
    addSegment(edgePositions, maxX, minZ, maxX, maxZ);
    addSegment(edgePositions, maxX, maxZ, minX, maxZ);
    addSegment(edgePositions, minX, maxZ, minX, minZ);

    const eps = 1e-3;
    const edgeThreshold = Math.max(0.4, stepMm * 0.08);

    const startX = Math.ceil((minX - eps) / stepMm) * stepMm;
    for (let x = startX; x <= maxX + eps; x += stepMm) {
        if (Math.abs(x - minX) <= edgeThreshold || Math.abs(x - maxX) <= edgeThreshold) continue;
        addSegment(guidePositions, x, minZ, x, maxZ);
    }

    const startZ = Math.ceil((minZ - eps) / stepMm) * stepMm;
    for (let z = startZ; z <= maxZ + eps; z += stepMm) {
        if (Math.abs(z - minZ) <= edgeThreshold || Math.abs(z - maxZ) <= edgeThreshold) continue;
        addSegment(guidePositions, minX, z, maxX, z);
    }

    const createLineSet = (positions, color, opacity, renderOrder) => {
        if (!positions.length) return;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const mat = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
            depthWrite: false,
            depthTest: true,
            toneMapped: false,
        });
        const lines = new THREE.LineSegments(geo, mat);
        lines.renderOrder = renderOrder;
        group.add(lines);
    };

    createLineSet(guidePositions, 0x7e7a99, 0.26, -0.8);
    createLineSet(edgePositions, 0xa9a4cb, 0.62, -0.75);
    return group;
}

function updateRulerFootprintHelper(worldBox, gridY) {
    if (!scene || !worldBox || worldBox.isEmpty()) {
        if (rulerFootprintHelper) rulerFootprintHelper.visible = false;
        return;
    }

    const minX = worldBox.min.x;
    const maxX = worldBox.max.x;
    const minZ = worldBox.min.z;
    const maxZ = worldBox.max.z;
    const spanX = Math.max(0, maxX - minX);
    const spanZ = Math.max(0, maxZ - minZ);
    if (spanX < 0.2 || spanZ < 0.2) {
        if (rulerFootprintHelper) rulerFootprintHelper.visible = false;
        return;
    }

    const span = Math.max(spanX, spanZ);
    const stepMm = getRulerFootprintStepMm(span);
    const quant = Math.max(0.5, stepMm * 0.25);
    const q = (value) => Math.round(value / quant) * quant;
    const signature = [
        q(minX).toFixed(2),
        q(maxX).toFixed(2),
        q(minZ).toFixed(2),
        q(maxZ).toFixed(2),
        q(gridY).toFixed(2),
        stepMm.toFixed(3),
        rulerUnit,
    ].join('|');

    if (!rulerFootprintHelper || rulerFootprintSignature !== signature) {
        disposeRulerFootprintHelper();
        rulerFootprintHelper = buildRulerFootprintHelper(minX, maxX, minZ, maxZ, stepMm);
        scene.add(rulerFootprintHelper);
        rulerFootprintSignature = signature;
    }

    if (!rulerFootprintHelper) return;
    rulerFootprintHelper.visible = true;
    rulerFootprintHelper.position.set(0, gridY + 0.03, 0);
}

function getRulerGridIncrementStepMm(spanMm) {
    const span = Math.max(20, Number(spanMm) || 0);
    if (rulerUnit === 'imperial') {
        if (span <= 320) return 25.4;     // 1 in
        if (span <= 620) return 50.8;     // 2 in
        return 101.6;                     // 4 in
    }
    if (span <= 260) return 10;
    if (span <= 520) return 25;
    if (span <= 1000) return 50;
    return 100;
}

function getColorRelativeLuminance(color) {
    const toLinear = (channel) => {
        if (channel <= 0.04045) return channel / 12.92;
        return Math.pow((channel + 0.055) / 1.055, 2.4);
    };
    const r = toLinear(color.r);
    const g = toLinear(color.g);
    const b = toLinear(color.b);
    return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

function getActiveRulerSurfaceColor() {
    if (buildPlateEnabled && buildPlateMesh?.visible) {
        const baseHex = getActiveBuildPlateBaseColor();
        if (buildPlateAutoBrightnessEnabled) return computeBuildPlateAutoBrightnessColor(baseHex);
        return computeBuildPlateShadeColor(baseHex, Number(buildPlateShade) || 0);
    }

    const baseHex = activeBgPreset === 'modelcolor'
        ? getModelSyncSourceColor()
        : (bgPick?.value || PALETTE.fallback);
    if (isDynamicBg) return computeAutoBrightnessColor(baseHex);
    const tone = bgOpacitySlider ? Math.round(getSliderEffectiveValue(bgOpacitySlider)) : 0;
    return computeTonedColor(baseHex, tone);
}

function getRulerContrastTheme() {
    const surfaceColor = getActiveRulerSurfaceColor();
    const lum = getColorRelativeLuminance(surfaceColor);
    const whiteContrast = 1.05 / Math.max(0.0001, lum + 0.05);
    const blackContrast = (lum + 0.05) / 0.05;

    if (whiteContrast >= blackContrast) {
        return {
            gridCenter: 0xf7f7fb,
            gridLines: 0xe2e2ed,
            gridOpacity: 0.62,
            lineStroke: 'rgba(246, 245, 255, 0.86)',
            labelFill: 'rgba(20, 19, 30, 0.88)',
            labelStroke: 'rgba(255, 255, 255, 0.18)',
            labelText: '#f4f3ff',
            tickText: 'rgba(246, 245, 255, 0.9)',
            tickStroke: 'rgba(230, 227, 255, 0.58)',
        };
    }

    return {
        gridCenter: 0x17171f,
        gridLines: 0x2a2a36,
        gridOpacity: 0.64,
        lineStroke: 'rgba(20, 20, 28, 0.82)',
        labelFill: 'rgba(255, 255, 255, 0.96)',
        labelStroke: 'rgba(20, 20, 28, 0.12)',
        labelText: '#15122b',
        tickText: 'rgba(35, 31, 80, 0.86)',
        tickStroke: 'rgba(58, 52, 122, 0.52)',
    };
}

function updateRulerGrid() {
    if (!scene) return;
    const shouldShow = !!(rulerEnabled && rulerLinesVisible && mesh && modelDims && viewerSec && !viewerSec.classList.contains('hidden'));
    if (!shouldShow) {
        if (rulerGridHelper) rulerGridHelper.visible = false;
        if (rulerFootprintHelper) rulerFootprintHelper.visible = false;
        rulerGridSpanX = 0;
        rulerGridSpanZ = 0;
        rulerGridStepMm = 0;
        return;
    }

    const worldBox = new THREE.Box3().setFromObject(mesh);
    if (!worldBox || worldBox.isEmpty()) {
        if (rulerGridHelper) rulerGridHelper.visible = false;
        if (rulerFootprintHelper) rulerFootprintHelper.visible = false;
        rulerGridSpanX = 0;
        rulerGridSpanZ = 0;
        rulerGridStepMm = 0;
        return;
    }

    const plateSpanX = clampBuildPlateSize(buildPlateWidth, BUILD_PLATE_DEFAULTS.width);
    const plateSpanZ = clampBuildPlateSize(buildPlateDepth, BUILD_PLATE_DEFAULTS.depth);
    const plateShape = normalizeBuildPlateShape(buildPlateShape);
    let targetSpanX = Math.max(40, plateSpanX);
    let targetSpanZ = Math.max(40, plateSpanZ);
    if (buildPlateMesh?.visible && plateShape === 'circle') {
        const plateDiameter = Math.max(40, Math.min(plateSpanX, plateSpanZ));
        const inscribedSquareSpan = plateDiameter * Math.SQRT1_2;
        targetSpanX = inscribedSquareSpan;
        targetSpanZ = inscribedSquareSpan;
    } else if (buildPlateMesh?.visible && plateShape === 'rounded') {
        targetSpanX *= 0.96;
        targetSpanZ *= 0.96;
    }
    const targetSize = Math.max(targetSpanX, targetSpanZ);
    const stepMm = getRulerGridIncrementStepMm(targetSize);
    const divisions = Math.max(4, Math.min(200, Math.round(targetSize / Math.max(1, stepMm))));

    const contrastTheme = getRulerContrastTheme();

    if (!rulerGridHelper || Math.abs(rulerGridSize - targetSize) > 0.5 || divisions !== rulerGridDivisions) {
        if (rulerGridHelper) scene.remove(rulerGridHelper);
        rulerGridHelper = new THREE.GridHelper(targetSize, divisions, contrastTheme.gridCenter, contrastTheme.gridLines);
        const mats = Array.isArray(rulerGridHelper.material) ? rulerGridHelper.material : [rulerGridHelper.material];
        mats.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = contrastTheme.gridOpacity;
            mat.depthWrite = false;
            mat.depthTest = true;
        });
        rulerGridHelper.renderOrder = -1;
        scene.add(rulerGridHelper);
        rulerGridSize = targetSize;
        rulerGridDivisions = divisions;
    } else {
        if (typeof rulerGridHelper.setColors === 'function') {
            rulerGridHelper.setColors(contrastTheme.gridCenter, contrastTheme.gridLines);
        }
        const mats = Array.isArray(rulerGridHelper.material) ? rulerGridHelper.material : [rulerGridHelper.material];
        mats.forEach((mat) => {
            mat.opacity = contrastTheme.gridOpacity;
            mat.needsUpdate = true;
        });
    }

    rulerGridHelper.visible = true;
    const modelGap = Math.max(0.4, modelRadius * 0.02);
    let gridY = worldBox.min.y - modelGap;
    const worldCenter = worldBox.getCenter(new THREE.Vector3());
    let gridCenterX = worldCenter.x;
    let gridCenterZ = worldCenter.z;
    if (buildPlateMesh?.visible) {
        const plateLift = Math.max(0.08, targetSize * 0.00035, modelRadius * 0.0018);
        gridY = buildPlateMesh.position.y + plateLift;
        gridCenterX = buildPlateMesh.position.x;
        gridCenterZ = buildPlateMesh.position.z;
    }
    rulerGridHelper.position.set(gridCenterX, gridY, gridCenterZ);
    rulerGridSpanX = targetSpanX;
    rulerGridSpanZ = targetSpanZ;
    rulerGridStepMm = stepMm;
    if (RULER_FOOTPRINT_ENABLED) {
        updateRulerFootprintHelper(worldBox, gridY);
    } else if (rulerFootprintHelper) {
        rulerFootprintHelper.visible = false;
    }
}

// ── Persistence (IndexedDB for binary, localStorage for settings) ───────────
const DB_NAME = 'rotater';
const DB_STORE = 'files';

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(DB_STORE);
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}

async function saveFileToIDB(name, buffer) {
    try {
        const db = await openDB();
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put({ name, buffer }, 'stl');
    } catch (e) {
        console.warn('Could not save STL to IndexedDB:', e);
    }
}

async function saveFilesToIDB(parts, displayName) {
    try {
        const db = await openDB();
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put({
            kind: 'multipart',
            name: displayName,
            parts: parts.map(p => ({ name: p.name, buffer: p.buffer, color: p.color, settings: p.settings }))
        }, 'stl');
    } catch (e) {
        console.warn('Could not save multi-part STL to IndexedDB:', e);
    }
}

async function loadFileFromIDB() {
    try {
        const db = await openDB();
        return await new Promise((resolve, reject) => {
            const req = db.transaction(DB_STORE).objectStore(DB_STORE).get('stl');
            req.onsuccess = e => resolve(e.target.result ?? null);
            req.onerror = e => reject(e.target.error);
        });
    } catch (e) {
        return null;
    }
}

async function clearIDB() {
    try {
        const db = await openDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(DB_STORE, 'readwrite');
            tx.objectStore(DB_STORE).delete('stl');
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e?.target?.error || tx.error || new Error('Failed clearing IndexedDB store'));
            tx.onabort = (e) => reject(e?.target?.error || tx.error || new Error('Aborted clearing IndexedDB store'));
        });
    } catch (e) {
        console.warn('Could not clear IndexedDB:', e);
    }
}

const SETTINGS_KEY = 'rotater_settings';

const settingsUrlSyncController = createSettingsUrlSyncController({
    onSync: () => settingsToURL(),
});

function flushSettingsToURL() {
    settingsUrlSyncController.flush();
}

function scheduleSettingsToURL(delayMs = 120) {
    settingsUrlSyncController.schedule(delayMs);
}

function saveSettings() {
    const options = arguments[0] || {};
    const immediateUrlSync = !!options?.immediateUrlSync;
    if (DEV_LOG) console.log(`[rotater] saveSettings called at ${Date.now()}`);
    if (suppressSave) {
        if (DEV_LOG) console.log(`[rotater] saveSettings suppressed at ${Date.now()}`);
        return;
    }
    const orbitState = (camera && controls) ? getOrbitFrameStateFast() : null;
    const orbitTarget = orbitState?.target;
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
            color: colorPick.value,
            tone: opacitySlider ? opacitySlider.value : 0,
            bgOpacity: bgOpacitySlider ? bgOpacitySlider.value : "0",
            bgManualShade: String(lastManualBgShade),
            bg: bgPick.value,
            shading: shadingEl.value,
            speed: speedSlider.value,

            rotateMode: rotateModeEl.value,
            tiltRange: tiltRangeSlider.value,
            wobbleSpinRange: wobbleSpinRangeSlider.value,
            spinDir: spinDir,
            paused: isPaused ? '1' : '0',
            gifLoop: document.getElementById('gifLoop')?.checked ? '1' : '0',

            exportQuality: document.getElementById('exportQuality')?.value ?? 'std',
            exportFormat: exportFormatEl?.value ?? 'gif',
            exportDimensions: getSelectedExportDimensionsId(),
            exportTransparent: document.getElementById('exportTransparent')?.checked ? '1' : '0',
            gifDither: document.getElementById('gifDither')?.checked ? '1' : '0',
            exportBuildPlate: document.getElementById('exportBuildPlate')?.checked ? '1' : '0',
            jpegQuality: document.getElementById('jpegQuality')?.value ?? '90',
            textureTuneOpen: textureTunePanel && !textureTunePanel.hidden ? '1' : '0',
            textureTuneLight: String(textureTuneState.light),
            textureTuneContrast: String(textureTuneState.contrast),
            textureTuneHighlights: String(textureTuneState.highlights),
            textureTuneShadows: textureTuneState.shadows > 0 ? '1' : '0',
            textureTuneShadowStrength: String(textureTuneState.shadows),
            textureTuneShadowAzimuth: String(textureTuneState.shadowAzimuth),
            textureTuneLightLock: textureTuneState.lightLock ? '1' : '0',
            textureTuneShadowHeight: String(textureTuneState.shadowHeight),
            textureTuneMetallicRoughness: String(textureTuneState.metallicRoughness),
            textureTuneMetallicMetalness: String(textureTuneState.metallicMetalness),
            textureTuneMetallicReflection: String(textureTuneState.metallicReflection),
            textureTunePhongRoughness: String(textureTuneState.phongRoughness),
            textureTunePhongReflection: String(textureTuneState.phongReflection),
            textureTuneMatteRoughness: String(textureTuneState.matteRoughness),
            textureTuneMatteReflection: String(textureTuneState.matteReflection),
            exportCamDist: exportCamDist,
            exportCamElev: exportCamElev,
            exportCamZoom: exportCamZoom,
            viewportCamDist: orbitState?.dist,
            viewportCamElev: orbitState?.elev,
            viewportCamAz: orbitState?.az,
            viewportCamTargetX: orbitTarget?.x,
            viewportCamTargetY: orbitTarget?.y,
            viewportCamTargetZ: orbitTarget?.z,
            viewportCamModelKey: getViewportOrbitModelKey(),
            autoBgAdjust: document.getElementById('autoBgCheck')?.checked ? '1' : '0',
            rulerVisible: rulerEnabled ? '1' : '0',
            rulerUnit: rulerUnit,
            rulerGridVisible: rulerLinesVisible ? '1' : '0',
            rulerPartHover: rulerPartHoverEnabled ? '1' : '0',
            rulerPartSelectMulti: rulerPartSelectMultiEnabled ? '1' : '0',
            buildPlate: buildPlateEnabled ? '1' : '0',
            buildPlatePreset: activeBuildPlatePreset,
            buildPlateSyncPartIndex: String(buildPlateSyncPartIndex || 0),
            buildPlateAutoBrightness: buildPlateAutoBrightnessEnabled ? '1' : '0',
            buildPlateColor: buildPlateColor,
            buildPlateShade: String(buildPlateShade),
            buildPlateManualShade: String(lastManualBuildPlateShade),
            buildPlateFinish: buildPlateFinish,
            buildPlateShape: buildPlateShape,
            buildPlateSizePreset: buildPlateSizePreset,
            buildPlateWidth: String(buildPlateWidth),
            buildPlateDepth: String(buildPlateDepth),
            showDpad: dpadVisible ? '1' : '0',
            uploadChoicePrompt: uploadChoicePromptEnabled ? '1' : '0',
            uploadDefaultAction: uploadDefaultAction,
            devMode: devModeEnabled ? '1' : '0',
            activeBgPreset: activeBgPreset,
            activeModelPreset: activeModelPreset,
            modelPartSelected: String(modelPartSelected || 0),
            modelPartBulkSelected: getBulkSelectedPartIndices().join(','),
            bgSyncPartIndex: String(bgSyncPartIndex || 0),
        }));
    } catch (e) { }
    if (DEV_LOG) {
        try {
            console.log('[rotater] saveSettings ->', {
                color: colorPick?.value,
                shading: shadingEl?.value,
                activeModelPreset,
                activeBgPreset,
                textureTuneState,
                url: location.search,
                localStorage: localStorage.getItem(SETTINGS_KEY)
            });
        } catch (e) { }
    }
    if (immediateUrlSync) flushSettingsToURL();
    else scheduleSettingsToURL();
}

function restoreSettings() {
    suppressSave = true;
    pendingViewportOrbitRestore = null;
    if (DEV_LOG) console.log(`[rotater] restoreSettings start at ${Date.now()}`);
    try {
        const urlS = getURLSettings(location.search);
        const urlParams = new URLSearchParams(location.search);
        pendingUrlModelAppearanceOverride = (urlS && hasExplicitUrlModelAppearanceParams(urlParams)) ? urlS : null;
        let localS = {};
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) localS = JSON.parse(saved) || {};
        } catch (e) { }

        let skipDefaultPresetOnce = false;
        try {
            skipDefaultPresetOnce = sessionStorage.getItem(SKIP_DEFAULT_PRESET_ONCE_KEY) === '1';
            if (skipDefaultPresetOnce) sessionStorage.removeItem(SKIP_DEFAULT_PRESET_ONCE_KEY);
        } catch (_) { }

        const defaultSearchStr = (!skipDefaultPresetOnce && typeof DEFAULT_SETTINGS_URL !== 'undefined' && DEFAULT_SETTINGS_URL.includes('?'))
            ? '?' + DEFAULT_SETTINGS_URL.split('?')[1] : '';
        const defaultS = getURLSettings(defaultSearchStr) || {};

        // Merge order: Default presets <- Local storage <- URL params
        let s = { ...defaultS, ...localS };
        if (urlS) {
            s = { ...s };
            Object.entries(urlS).forEach(([k, v]) => {
                if (v !== null && v !== undefined) {
                    // Only override activeModelPreset/activeBgPreset from URL if
                    // they were explicitly present in the URL (amp/abp params).
                    // Otherwise keep the localStorage value.
                    if (k === 'activeModelPreset' && !urlParams.has('amp')) return;
                    if (k === 'activeBgPreset' && !urlParams.has('abp')) return;
                    s[k] = v;
                }
            });
        }
        if (DEV_LOG) console.log('[rotater] merged settings', s);

        const clamp = (v, min, max, fallback) => {
            const n = parseFloat(v);
            return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
        };

        if (s && Object.keys(s).length > 0) {
            if (s.shading === 'flat' || s.shading === 'toon') s.shading = 'matte'; // migrate legacy modes
            if (s.color) colorPick.value = s.color;
            if ((s.tone !== undefined || s.opacity !== undefined) && opacitySlider) {
                let toneRestored;
                if (s.tone !== undefined) {
                    // New format: tone is -100..100
                    toneRestored = clamp(s.tone, -100, 100, 0);
                } else {
                    // Old format: opacity was 0-100; values like 100 (fully opaque) map to tone 0
                    const oldVal = parseFloat(s.opacity);
                    toneRestored = (Number.isFinite(oldVal) && oldVal > 0 && oldVal <= 100) ? 0 : clamp(s.opacity, -100, 100, 0);
                }
                opacitySlider.value = toneRestored;
                const actualTone = Math.round(getSliderEffectiveValue(opacitySlider));
                opacityVal.textContent = (actualTone >= 0 ? '+' : '') + actualTone;
            }
            if (s.bgOpacity !== undefined && bgOpacitySlider) {
                const bgTone = Math.max(-100, Math.min(100, parseInt(s.bgOpacity, 10) || 0));
                bgOpacitySlider.value = bgTone;
                const actualBgTone = Math.round(getSliderEffectiveValue(bgOpacitySlider));
                const bgValEl = document.getElementById('bgOpacityVal');
                if (bgValEl) bgValEl.textContent = (actualBgTone >= 0 ? '+' : '') + actualBgTone;
            }
            if (s.bgManualShade != null) {
                const manualShade = parseInt(String(s.bgManualShade), 10);
                if (Number.isFinite(manualShade)) {
                    lastManualBgShade = Math.max(-100, Math.min(100, manualShade));
                }
            }
            if (s.bg) bgPick.value = s.bg;
            if (s.shading) {
                shadingEl.value = s.shading;
                // Ensure the preview material matches the restored shading immediately.
                // Some restores set UI values programmatically which do not fire the
                // shading change handler; rebuild material(s) directly when a
                // mesh is present so the preview no longer shows the wrong shader.
                if (mesh) {
                    rebuildMeshMaterialsForCurrentShading();
                }
            }
            if (s.speed != null) {
                speedSlider.value = s.speed;
            }

            if (s.textureTuneLight != null) textureTuneState.light = clamp(s.textureTuneLight, 40, 200, TEXTURE_TUNE_DEFAULTS.light);
            if (s.textureTuneContrast != null) textureTuneState.contrast = clamp(s.textureTuneContrast, 0, 200, TEXTURE_TUNE_DEFAULTS.contrast);
            if (s.textureTuneHighlights != null) textureTuneState.highlights = clamp(s.textureTuneHighlights, 0, 200, TEXTURE_TUNE_DEFAULTS.highlights);
            if (s.textureTuneShadowStrength != null) {
                textureTuneState.shadows = clamp(s.textureTuneShadowStrength, 0, 100, TEXTURE_TUNE_DEFAULTS.shadows);
            } else if (s.textureTuneShadows != null) {
                const legacyOn = (s.textureTuneShadows === true || s.textureTuneShadows === '1' || s.textureTuneShadows === 1);
                textureTuneState.shadows = legacyOn ? Math.max(40, TEXTURE_TUNE_DEFAULTS.shadows) : 0;
            }
            if (s.textureTuneShadowAzimuth != null) textureTuneState.shadowAzimuth = clamp(s.textureTuneShadowAzimuth, 0, 360, TEXTURE_TUNE_DEFAULTS.shadowAzimuth);
            if (s.textureTuneLightLock != null) textureTuneState.lightLock = (s.textureTuneLightLock === '1' || s.textureTuneLightLock === true || s.textureTuneLightLock === 1);
            if (s.textureTuneShadowHeight != null) textureTuneState.shadowHeight = clamp(s.textureTuneShadowHeight, 40, 220, TEXTURE_TUNE_DEFAULTS.shadowHeight);
            if (s.textureTuneMetallicRoughness != null) textureTuneState.metallicRoughness = clamp(s.textureTuneMetallicRoughness, 0, 100, TEXTURE_TUNE_DEFAULTS.metallicRoughness);
            if (s.textureTuneMetallicMetalness != null) textureTuneState.metallicMetalness = clamp(s.textureTuneMetallicMetalness, 0, 100, TEXTURE_TUNE_DEFAULTS.metallicMetalness);
            if (s.textureTuneMetallicReflection != null) textureTuneState.metallicReflection = clamp(s.textureTuneMetallicReflection, 0, 200, TEXTURE_TUNE_DEFAULTS.metallicReflection);
            if (s.textureTunePhongRoughness != null) textureTuneState.phongRoughness = clamp(s.textureTunePhongRoughness, 0, 100, TEXTURE_TUNE_DEFAULTS.phongRoughness);
            if (s.textureTunePhongReflection != null) textureTuneState.phongReflection = clamp(s.textureTunePhongReflection, 0, 200, TEXTURE_TUNE_DEFAULTS.phongReflection);
            if (s.textureTuneMatteRoughness != null) textureTuneState.matteRoughness = clamp(s.textureTuneMatteRoughness, 0, 100, TEXTURE_TUNE_DEFAULTS.matteRoughness);
            if (s.textureTuneMatteReflection != null) textureTuneState.matteReflection = clamp(s.textureTuneMatteReflection, 0, 200, TEXTURE_TUNE_DEFAULTS.matteReflection);

            if (textureTunePanel && s.textureTuneOpen != null) {
                const isOpen = (s.textureTuneOpen === true || s.textureTuneOpen === '1' || s.textureTuneOpen === 1);
                textureTunePanel.hidden = !isOpen;
                textureTuneBtn?.setAttribute('aria-expanded', String(isOpen));
            }

            if (s.rotateMode === 'off') { s.rotateMode = null; }
            if (s.rotateMode) rotateModeEl.value = s.rotateMode;
            const m = rotateModeEl.value;
            if (s.tiltRange) tiltRangeSlider.value = s.tiltRange;
            if (s.wobbleSpinRange) wobbleSpinRangeSlider.value = s.wobbleSpinRange;
            if (m === 'tilt') rememberedTiltRange = normalizeTiltRangeValue(tiltRangeSlider.value);
            lastRotateMode = m;
            if (s.spinDir != null) spinDir = parseFloat(s.spinDir) < 0 ? -1 : 1;
            if (s.paused != null) {
                isPaused = (s.paused === true || s.paused === '1' || s.paused === 1);
            }
            if (m === 'tilt' || m === 'spin' || m === 'wobble') updateRangeSliderForMode(m);
            else tiltRangeVal.textContent = (s.tiltRange || tiltRangeSlider.value) + '°';
            document.documentElement.classList.toggle('tilt-mode', m === 'tilt' || m === 'spin' || m === 'wobble');
            document.documentElement.classList.toggle('wobble-mode', m === 'wobble');
            updateSpinDirUI();
            // Restore gifLoop checkbox
            const gifLoopEl = document.getElementById('gifLoop');
            if (s.gifLoop != null) {
                const loopOn = (s.gifLoop === true || s.gifLoop === '1' || s.gifLoop === 1);
                if (gifLoopEl) gifLoopEl.checked = loopOn;
            }

            // Restore quality selects (legacy: exportQuality/exportRes → both gif and video)
            const legacyQ = s.exportQuality ?? (s.exportRes === '1080' ? 'high' : s.exportRes === '480' ? 'web' : null) ?? 'std';
            const eq = s.exportQuality ?? s.gifQuality ?? s.videoQuality ?? legacyQ;
            setExportQualityValue(eq);
            if (s.exportDimensions) setSelectedExportDimensionsId(s.exportDimensions);
            // Restore export format
            if (s.exportFormat && exportFormatEl) {
                exportFormatEl.value = s.exportFormat;
                applyExportFormat(s.exportFormat);
            }
            // (exportAdvanced no longer used in new UI)
            if (s.jpegQuality) {
                const qEl = document.getElementById('jpegQuality');
                if (qEl) { qEl.value = s.jpegQuality; document.getElementById('jpegQualityVal').textContent = s.jpegQuality + '%'; }
            }
            // mp4 repeat removed — no restore needed
            // Restore transparent background checkbox (unified for GIF + PNG)
            // Legacy keys: animBg ("has bg" = !transparent), imageTransparent, imageBg, exportTransparentBg
            if (s.exportTransparent != null) {
                const on = (s.exportTransparent === true || s.exportTransparent === '1' || s.exportTransparent === 1);
                const a = document.getElementById('exportTransparent'); if (a) a.checked = on;
                const b = document.getElementById('exportTransparentPng'); if (b) b.checked = on;
            } else if (s.imageTransparent != null) {
                const on = (s.imageTransparent === true || s.imageTransparent === '1' || s.imageTransparent === 1);
                const a = document.getElementById('exportTransparent'); if (a) a.checked = on;
                const b = document.getElementById('exportTransparentPng'); if (b) b.checked = on;
            } else if (s.animBg != null) {
                // animBg=1 meant "has background" so transparent = !animBg
                const on = !(s.animBg === true || s.animBg === '1' || s.animBg === 1);
                const a = document.getElementById('exportTransparent'); if (a) a.checked = on;
                const b = document.getElementById('exportTransparentPng'); if (b) b.checked = on;
            } else if (s.exportTransparentBg != null) {
                const on = (s.exportTransparentBg === true || s.exportTransparentBg === '1' || s.exportTransparentBg === 1);
                const a = document.getElementById('exportTransparent'); if (a) a.checked = on;
                const b = document.getElementById('exportTransparentPng'); if (b) b.checked = on;
            }
            if (s.gifDither != null) {
                const isOn = (s.gifDither === true || s.gifDither === '1' || s.gifDither === 1);
                const el = document.getElementById('gifDither');
                if (el) el.checked = isOn;
            }
            if (s.exportBuildPlate != null) {
                const isOn = (s.exportBuildPlate === true || s.exportBuildPlate === '1' || s.exportBuildPlate === 1);
                if (exportBuildPlateEl) exportBuildPlateEl.checked = isOn;
            }

            // Restore persisted export framing (used by preview/export and crop mode).
            if (s.exportCamDist != null) {
                const d = parseFloat(s.exportCamDist);
                if (Number.isFinite(d) && d > 0) {
                    exportCamDist = d;
                    _hasRestoredExportFrame = true;
                }
            }
            if (s.exportCamElev != null) {
                const e = parseFloat(s.exportCamElev);
                if (Number.isFinite(e)) exportCamElev = e;
            }
            if (s.exportCamZoom != null) {
                const z = parseFloat(s.exportCamZoom);
                if (Number.isFinite(z) && z > 0) exportCamZoom = z;
            }

            {
                const dist = parseFloat(s.viewportCamDist);
                const elev = parseFloat(s.viewportCamElev);
                const az = parseFloat(s.viewportCamAz);
                const tx = parseFloat(s.viewportCamTargetX);
                const ty = parseFloat(s.viewportCamTargetY);
                const tz = parseFloat(s.viewportCamTargetZ);
                const modelKey = typeof s.viewportCamModelKey === 'string' ? s.viewportCamModelKey : '';
                const hasRestoreState = Number.isFinite(dist) && dist > 0
                    && Number.isFinite(elev)
                    && Number.isFinite(az)
                    && Number.isFinite(tx)
                    && Number.isFinite(ty)
                    && Number.isFinite(tz)
                    && modelKey.length > 0;
                if (hasRestoreState) {
                    pendingViewportOrbitRestore = { dist, elev, az, tx, ty, tz, modelKey };
                }
            }
        }
        // Restore auto BG adjust and preset selections
        if (s.autoBgAdjust != null) {
            const on = (s.autoBgAdjust === '1' || s.autoBgAdjust === true || s.autoBgAdjust === 1);
            const el = document.getElementById('autoBgCheck');
            if (el) el.checked = on;
            isDynamicBg = on;
            if (bgOpacitySlider) {
                bgOpacitySlider.value = on
                    ? String(AUTO_BRIGHTNESS_RULES.background.shade)
                    : String(getBgPresetDefaultTone(activeBgPreset));
            }
        }
        if (s.rulerVisible != null) {
            const on = (s.rulerVisible === '1' || s.rulerVisible === true || s.rulerVisible === 1);
            const el = document.getElementById('rulerToggle');
            if (el) el.checked = on;
            rulerEnabled = on;
        }
        if (s.rulerGridVisible != null) {
            rulerLinesVisible = (s.rulerGridVisible === '1' || s.rulerGridVisible === true || s.rulerGridVisible === 1);
        } else if (s.rulerLinesVisible != null) {
            rulerLinesVisible = (s.rulerLinesVisible === '1' || s.rulerLinesVisible === true || s.rulerLinesVisible === 1);
        }
        if (s.buildPlate != null) {
            buildPlateEnabled = (s.buildPlate === '1' || s.buildPlate === true || s.buildPlate === 1);
        }
        if (s.buildPlatePreset === 'white' || s.buildPlatePreset === 'black' || s.buildPlatePreset === 'modelcolor' || s.buildPlatePreset === 'custom') {
            activeBuildPlatePreset = s.buildPlatePreset;
            if (activeBuildPlatePreset !== 'modelcolor') lastNonModelBuildPlatePreset = activeBuildPlatePreset;
        }
        {
            // Prefer localStorage over URL (same pattern as bgSyncPartIndex) so a stale
            // shared/bookmarked URL never overwrites the user's locally-saved selection.
            const bpsiRaw = localS.buildPlateSyncPartIndex ?? s.buildPlateSyncPartIndex;
            if (bpsiRaw != null) {
                const idx = parseInt(bpsiRaw, 10);
                buildPlateSyncPartIndex = Number.isFinite(idx) ? Math.max(0, idx) : 0;
            }
        }
        if (s.buildPlateAutoBrightness != null) {
            buildPlateAutoBrightnessEnabled = (s.buildPlateAutoBrightness === '1' || s.buildPlateAutoBrightness === true || s.buildPlateAutoBrightness === 1);
            if (buildPlateAutoBrightnessEl) buildPlateAutoBrightnessEl.checked = buildPlateAutoBrightnessEnabled;
        }
        if (typeof s.buildPlateColor === 'string' && /^[0-9a-f]{6}$/i.test(s.buildPlateColor)) {
            buildPlateColor = `#${s.buildPlateColor}`;
        } else if (typeof s.buildPlateColor === 'string' && /^#[0-9a-f]{6}$/i.test(s.buildPlateColor)) {
            buildPlateColor = s.buildPlateColor;
        } else if (s.buildPlateTexture != null) {
            buildPlateColor = null;
        }
        if (activeBuildPlatePreset === 'white') buildPlateColor = PALETTE.preset.white;
        else if (activeBuildPlatePreset === 'black') buildPlateColor = PALETTE.preset.black;
        else if (activeBuildPlatePreset === 'modelcolor') buildPlateColor = null;
        let hasExplicitManualBuildPlateShade = false;
        if (s.buildPlateManualShade != null) {
            const manualShade = parseInt(s.buildPlateManualShade, 10);
            if (Number.isFinite(manualShade)) {
                lastManualBuildPlateShade = Math.max(-100, Math.min(100, manualShade));
                manualBuildPlateShadeBeforeAuto = lastManualBuildPlateShade;
                hasExplicitManualBuildPlateShade = true;
            }
        }
        if (s.buildPlateShade != null) {
            const shade = parseInt(s.buildPlateShade, 10);
            if (Number.isFinite(shade)) {
                buildPlateShade = Math.max(-100, Math.min(100, shade));
                if (!buildPlateAutoBrightnessEnabled && !hasExplicitManualBuildPlateShade) {
                    lastManualBuildPlateShade = buildPlateShade;
                    manualBuildPlateShadeBeforeAuto = lastManualBuildPlateShade;
                }
            }
        }
        if (activeBuildPlatePreset === 'white' || activeBuildPlatePreset === 'black') {
            buildPlateColor = PALETTE.preset[activeBuildPlatePreset];
            buildPlateShade = getBuildPlatePresetDefaultTone(activeBuildPlatePreset);
        } else if (activeBuildPlatePreset === 'modelcolor') {
            buildPlateColor = null;
        }
        // Ensure cache is initialized for toggling auto OFF when no explicit manual shade was restored.
        if (buildPlateAutoBrightnessEnabled && !hasExplicitManualBuildPlateShade) {
            lastManualBuildPlateShade = getBuildPlatePresetDefaultTone(activeBuildPlatePreset);
            manualBuildPlateShadeBeforeAuto = lastManualBuildPlateShade;
        }
        buildPlateFinish = BUILD_PLATE_DEFAULTS.finish;
        if (s.buildPlateShape === 'rounded' || s.buildPlateShape === 'rectangle' || s.buildPlateShape === 'circle') {
            buildPlateShape = s.buildPlateShape;
        }
        if (s.buildPlateSizePreset != null) {
            const preset = String(s.buildPlateSizePreset);
            if (preset === 'custom' || BUILD_PLATE_SIZE_PRESETS[preset]) {
                buildPlateSizePreset = preset;
            }
        }
        if (s.buildPlateWidth != null) buildPlateWidth = clampBuildPlateSize(s.buildPlateWidth, BUILD_PLATE_DEFAULTS.width);
        if (s.buildPlateDepth != null) buildPlateDepth = clampBuildPlateSize(s.buildPlateDepth, BUILD_PLATE_DEFAULTS.depth);
        if (buildPlateSizePreset !== 'custom' && BUILD_PLATE_SIZE_PRESETS[buildPlateSizePreset]) {
            buildPlateWidth = BUILD_PLATE_SIZE_PRESETS[buildPlateSizePreset].w;
            buildPlateDepth = BUILD_PLATE_SIZE_PRESETS[buildPlateSizePreset].d;
        }
        exportMotionControlsEnabled = true;
        if (s.showDpad != null) {
            dpadVisible = (s.showDpad === '1' || s.showDpad === true || s.showDpad === 1);
        }
        if (s.devMode != null) {
            devModeEnabled = (s.devMode === '1' || s.devMode === true || s.devMode === 1);
        } else {
            devModeEnabled = false;
        }
        autoUIAssistEnabled = true;
        exportCollapsedConfirmEnabled = true;
        if (s.uploadChoicePrompt != null) {
            uploadChoicePromptEnabled = (s.uploadChoicePrompt === '1' || s.uploadChoicePrompt === true || s.uploadChoicePrompt === 1);
        }
        if (s.uploadDefaultAction === 'replace' || s.uploadDefaultAction === 'newplate') {
            uploadDefaultAction = s.uploadDefaultAction;
        } else if (s.uploadDefaultAction === 'add') {
            // Legacy migration: old "add" behavior maps to "replace" in the simplified picker.
            uploadDefaultAction = 'replace';
        }
        if (exportGridEl) exportGridEl.checked = rulerLinesVisible;
        if (exportBuildPlateEl && s.exportBuildPlate == null) exportBuildPlateEl.checked = buildPlateEnabled;
        if (s.rulerUnit === 'imperial' || s.rulerUnit === 'i' || s.rulerUnit === 'in') rulerUnit = 'imperial';
        else if (s.rulerUnit === 'metric' || s.rulerUnit === 'm' || s.rulerUnit === 'mm') rulerUnit = 'metric';
        if (s.rulerPartHover != null) {
            rulerPartHoverEnabled = (s.rulerPartHover === '1' || s.rulerPartHover === true || s.rulerPartHover === 1);
        }
        if (s.rulerPartSelectMulti != null) {
            rulerPartSelectMultiEnabled = (s.rulerPartSelectMulti === '1' || s.rulerPartSelectMulti === true || s.rulerPartSelectMulti === 1);
        } else {
            rulerPartSelectMultiEnabled = false;
        }
        rulerPartSelectMultiEnabled = rulerPartSelectMultiEnabled && isMultipartModel();
        if (rulerPartSelectMultiEnabled && rulerPartHoverEnabled) {
            rulerPartHoverEnabled = false;
        }
        if (!rulerPartHoverEnabled && !rulerPartSelectMultiEnabled) rulerHoveredPartIndex = -1;
        if (s.activeBgPreset) activeBgPreset = s.activeBgPreset;
        if (s.activeModelPreset) activeModelPreset = s.activeModelPreset;
        if ((activeBgPreset === 'white' || activeBgPreset === 'black') && bgOpacitySlider) {
            bgOpacitySlider.value = String(getBgPresetDefaultTone(activeBgPreset));
        }
        if (s.modelPartSelected != null) {
            const idx = parseInt(s.modelPartSelected, 10);
            pendingModelPartSelected = Number.isFinite(idx) ? Math.max(0, idx) : 0;
        }
        if (s.modelPartBulkSelected != null) {
            const raw = String(s.modelPartBulkSelected || '').trim();
            if (!raw) {
                pendingBulkSelectedPartIndices = [];
            } else {
                const parsed = raw
                    .split(',')
                    .map((token) => parseInt(token, 10))
                    .filter((idx) => Number.isInteger(idx) && idx >= 0);
                pendingBulkSelectedPartIndices = Array.from(new Set(parsed));
            }
        } else {
            pendingBulkSelectedPartIndices = null;
        }
        if (s.bgSyncPartIndex != null || s.modelSyncPart != null) {
            const idx = parseInt(s.bgSyncPartIndex ?? s.modelSyncPart, 10);
            bgSyncPartIndex = Number.isFinite(idx) ? Math.max(0, idx) : 0;
        }

        if (pendingUrlModelAppearanceOverride && modelPartSettings.length) {
            applyPendingUrlModelAppearanceOverride();
            if (mesh) rebuildMeshMaterialsForCurrentShading();
        }

        // Always apply mode-based classes/slider setup — even when s is null (settings reset)
        const curMode = rotateModeEl.value;
        document.documentElement.classList.toggle('tilt-mode', curMode === 'tilt' || curMode === 'spin' || curMode === 'wobble');
        document.documentElement.classList.toggle('wobble-mode', curMode === 'wobble');
        if (curMode === 'tilt' || curMode === 'spin' || curMode === 'wobble') updateRangeSliderForMode(curMode);
        if (curMode === 'off') isPaused = false;
        setPauseState(isPaused, false, true);
        ensurePausedForInteractionMode();
        updateShadingThumbs();
        updateColorSwatches();
        updateTextureTuneUI();
        applyTextureLighting();
        syncExportQualitySliderFromSelect();
        // Ensure preset/thumb UI reflects restored selections
        try { updateModelSelection(); } catch (e) { }
        try { updateBgSelection(); } catch (e) { }
        // Try to infer a matching quick preset now that settings have been restored
        try { reconcileModelPresetFromSettings(); } catch (e) { }
        try { updateModelSelection(); } catch (e) { }
        // If auto-bg was restored, ensure the dynamic background is applied
        try { if (isDynamicBg) updateDynamicBg(); } catch (e) { }
        updateRulerHUD();
        if (buildPlateToggleEl) buildPlateToggleEl.checked = buildPlateEnabled;
        syncBuildPlateSizeUI();
        exportMotionControlsEnabled = true;
        if (exportMotionControlsEl) exportMotionControlsEl.hidden = false;
        if (showDpadToggleEl) showDpadToggleEl.checked = dpadVisible;
        syncDevModeToggleUI();
        applyDpadVisibility();
        updateBuildPlateMaterial();
        updateAutoBgShadeControlVisibility();
        updateBuildPlateShadeControlVisibility();
        syncExportMotionControlsFromMain();
        syncAllRangeFillIndicators();
        if (bgOpacitySlider) updateBgShadeSliderVisual();
        if (bgOpacitySlider) {
            bgOpacitySlider.value = isDynamicBg
                ? String(AUTO_BRIGHTNESS_RULES.background.shade)
                : String(getBgPresetDefaultTone(activeBgPreset));
            syncBgShadeReadout();
            updateBgShadeSliderVisual();
            if (!isDynamicBg) {
                lastManualBgShade = Math.round(getSliderEffectiveValue(bgOpacitySlider));
            }
        }
        updateTiltRangeReset();
        wobbleSpinRangeResetBtn.classList.toggle('is-changed', parseFloat(wobbleSpinRangeSlider.value) !== WOBBLE_SPIN_RANGE_DEFAULT);
        speedResetBtn?.classList.toggle('is-changed', parseInt(speedSlider.value, 10) !== SPEED_DEFAULT);
        // Init export format panel (if format wasn't restored above, default to gif)
        if (!exportFormatEl?.value || !document.getElementById(`exportOpts-${exportFormatEl.value}`)) {
            applyExportFormat('gif');
        }
        updateCardResetButtonStates();
    } catch (e) { }
    // Done applying restored settings; re-enable saves and persist final state
    try {
        suppressSave = false;
        if (DEV_LOG) console.log(`[rotater] restoreSettings applied, final state at ${Date.now()}`,
            {
                activeModelPreset,
                activeBgPreset,
                shading: shadingEl?.value,
                color: colorPick?.value,
                textureTuneState,
                url: location.search,
                localStorage: localStorage.getItem(SETTINGS_KEY)
            });
        saveSettings();
    } catch (e) { /* non-fatal */ }
}

// ── URL / shareable settings ─────────────────────────────────────────────────────────────
function getURLSettings(searchStr = location.search) {
    const p = new URLSearchParams(searchStr);
    // Require at least one known key to treat URL as settings-bearing
    if (!p.has('c') && !p.has('mf') && !p.has('sh') && !p.has('rm') && !p.has('amp') && !p.has('ef')) return null;
    const g = (k) => p.has(k) ? p.get(k) : null;
    const rawMaterialFamily = p.has('mf') ? p.get('mf') : g('sh');
    const materialFamily = (p.has('mf') || p.has('sh')) ? normalizeMaterialFamily(rawMaterialFamily) : null;
    const shading = materialFamily
        ? getShadingForMaterialFamily(materialFamily, g('sh') || 'phong')
        : g('sh');
    return {
        // Core appearance
        color: p.has('c') ? '#' + p.get('c') : null,
        bg: p.has('b') ? '#' + p.get('b') : null,
        tone: p.has('op') ? p.get('op') : null,
        materialFamily,
        shading,
        // Animation
        rotateMode: g('rm'),
        speed: g('sp'),
        tiltRange: g('tr'),
        wobbleSpinRange: g('wsr'),
        spinDir: p.has('sd') ? (p.get('sd') === '-1' ? -1 : 1) : null,
        gifLoop: p.has('gl') ? p.get('gl') === '1' : null,
        // Export
        exportFormat: g('ef'),
        exportQuality: g('eq'),
        exportDimensions: g('ed'),
        exportTransparent: p.has('et') ? p.get('et') : null,
        gifDither: p.has('gd') ? p.get('gd') : null,
        jpegQuality: g('jq'),
        textureTuneOpen: p.has('tto') ? p.get('tto') : null,
        // Texture tune
        textureTuneLight: g('tl'),
        textureTuneContrast: g('tc'),
        textureTuneHighlights: g('thi'),
        textureTuneShadowStrength: g('ts'),
        textureTuneShadowAzimuth: g('tsa'),
        textureTuneLightLock: p.has('tll') ? p.get('tll') : null,
        textureTuneShadowHeight: g('tsh'),
        textureTuneMetallicRoughness: g('tmr'),
        textureTuneMetallicMetalness: g('tmm'),
        textureTuneMetallicReflection: g('tme'),
        textureTunePhongRoughness: g('tpr'),
        textureTunePhongReflection: g('tpe'),
        textureTuneMatteRoughness: g('tcr'),
        textureTuneMatteReflection: g('tce'),
        textureTuneFinishMode: g('tfm'),
        textureTuneFinishValue: g('tfv'),
        // Export camera framing
        exportCamDist: g('ecd'),
        exportCamElev: g('ece'),
        exportCamZoom: g('ecz'),
        // Auto BG + active presets
        autoBgAdjust: g('aba'),
        rulerVisible: g('rv'),
        rulerUnit: g('ru'),
        rulerGridVisible: g('rg'),
        rulerPartHover: g('rh'),
        rulerPartSelectMulti: g('rs'),
        buildPlate: g('bp'),
        buildPlatePreset: g('bpr'),
        buildPlateSyncPartIndex: g('bpsp'),
        buildPlateAutoBrightness: g('bpab'),
        buildPlateColor: g('bpc'),
        buildPlateShade: g('bps'),
        buildPlateManualShade: g('bpms'),
        buildPlateFinish: g('bpf'),
        buildPlateShape: g('bpsh'),
        buildPlateSizePreset: g('bpp'),
        buildPlateWidth: g('bpw'),
        buildPlateDepth: g('bpd'),
        buildPlateTexture: g('bpt'),
        rulerLinesVisible: g('rl'),
        activeBgPreset: g('abp'),
        activeModelPreset: g('amp'),
        modelSyncPart: g('bsp'),
        uploadChoicePrompt: g('uap'),
        uploadDefaultAction: p.has('uam') ? (p.get('uam') === 'r' ? 'replace' : 'newplate') : null,
        devMode: g('dv'),
    };
}

function settingsToURL() {
    const p = new URLSearchParams();
    const selectedPartSettings = getSelectedPartSettings();
    // Core appearance
    p.set('c', colorPick.value.replace('#', ''));
    p.set('b', bgPick.value.replace('#', ''));
    p.set('op', String(Math.round(getSliderEffectiveValue(opacitySlider)) || 0));
    p.set('mf', getMaterialFamilyFromPartSettings(selectedPartSettings));
    // Animation
    p.set('rm', rotateModeEl.value);
    p.set('sp', speedSlider.value);
    p.set('tr', tiltRangeSlider.value);
    p.set('wsr', wobbleSpinRangeSlider.value);
    p.set('sd', String(spinDir));
    p.set('gl', document.getElementById('gifLoop')?.checked ? '1' : '0');
    // Export format/quality/options
    const fmt = exportFormatEl?.value ?? 'gif';
    p.set('ef', fmt);
    p.set('eq', document.getElementById('exportQuality')?.value ?? 'std');
    const dim = getSelectedExportDimensionsId();
    if (dim) p.set('ed', dim);
    p.set('et', document.getElementById('exportTransparent')?.checked ? '1' : '0');
    p.set('gd', document.getElementById('gifDither')?.checked ? '1' : '0');
    const jq = document.getElementById('jpegQuality')?.value;
    if (jq != null) p.set('jq', jq);
    // Texture tune panel state
    p.set('tto', (textureTunePanel && !textureTunePanel.hidden) ? '1' : '0');
    // Texture tune values are always serialized so presets capture full model finish state.
    const tt = textureTuneState;
    p.set('tl', String(tt.light));
    p.set('tc', String(tt.contrast));
    p.set('thi', String(tt.highlights));
    p.set('ts', String(tt.shadows));
    p.set('tsa', String(tt.shadowAzimuth));
    p.set('tll', tt.lightLock ? '1' : '0');
    p.set('tsh', String(tt.shadowHeight));
    p.set('tmr', String(tt.metallicRoughness));
    p.set('tmm', String(tt.metallicMetalness));
    p.set('tme', String(tt.metallicReflection));
    p.set('tpr', String(tt.phongRoughness));
    p.set('tpe', String(tt.phongReflection));
    p.set('tcr', String(tt.matteRoughness));
    p.set('tce', String(tt.matteReflection));
    p.set('tfm', getFinishModeFromPartSettings(selectedPartSettings));
    p.set('tfv', String(finishSliderValueFromPartSettings(selectedPartSettings)));
    // Export camera framing
    if (exportCamDist != null && Number.isFinite(exportCamDist) && exportCamDist > 0)
        p.set('ecd', exportCamDist.toFixed(4));
    if (exportCamElev != null && Number.isFinite(exportCamElev))
        p.set('ece', exportCamElev.toFixed(4));
    if (exportCamZoom != null && Number.isFinite(exportCamZoom) && exportCamZoom !== 1)
        p.set('ecz', exportCamZoom.toFixed(4));
    // Persist explicit values for settings whose defaults may differ between builds.
    p.set('aba', isDynamicBg ? '1' : '0');
    p.set('rv', rulerEnabled ? '1' : '0');
    if (rulerUnit === 'imperial') p.set('ru', 'i');
    if (!rulerLinesVisible) p.set('rg', '0');
    if (rulerPartHoverEnabled) p.set('rh', '1');
    if (rulerPartSelectMultiEnabled) p.set('rs', '1');
    if (!buildPlateEnabled) p.set('bp', '0');
    p.set('bpr', activeBuildPlatePreset || 'modelcolor');
    if (buildPlateSyncPartIndex > 0) p.set('bpsp', String(buildPlateSyncPartIndex));
    p.set('bpab', buildPlateAutoBrightnessEnabled ? '1' : '0');
    if (buildPlateColor && /^#[0-9a-f]{6}$/i.test(buildPlateColor)) {
        p.set('bpc', buildPlateColor.replace('#', ''));
    }
    if (Number.isFinite(Number(buildPlateShade))) p.set('bps', String(buildPlateShade));
    if (Number.isFinite(Number(lastManualBuildPlateShade))) p.set('bpms', String(lastManualBuildPlateShade));
    p.set('bpf', buildPlateFinish || BUILD_PLATE_DEFAULTS.finish);
    if (buildPlateShape !== 'rectangle') p.set('bpsh', normalizeBuildPlateShape(buildPlateShape));
    if (buildPlateSizePreset && buildPlateSizePreset !== '220x220') p.set('bpp', buildPlateSizePreset);
    if (buildPlateWidth !== 220) p.set('bpw', String(buildPlateWidth));
    if (buildPlateDepth !== 220) p.set('bpd', String(buildPlateDepth));
    p.set('abp', activeBgPreset || 'modelcolor');
    p.set('amp', activeModelPreset || 'custom');
    if (bgSyncPartIndex > 0) p.set('bsp', String(bgSyncPartIndex));
    if (!uploadChoicePromptEnabled) p.set('uap', '0');
    if (uploadDefaultAction === 'replace') p.set('uam', 'r');
    if (devModeEnabled) p.set('dv', '1');
    history.replaceState(null, '', '?' + p.toString());
}

async function restoreSession() {
    // Always show the full viewer shell first so startup is consistent:
    // Splash -> full UI (no model yet) -> full UI with model.
    document.documentElement.classList.add('startup-shell-ready');
    document.documentElement.classList.remove('startup-model-ready');
    if (!renderer) initThree();
    viewerSec?.classList.remove('hidden');
    document.getElementById('emptyState')?.classList.add('hidden');
    document.getElementById('controlsBar')?.classList.remove('hidden');
    const compactBtnLabel = document.getElementById('compactBtnLabel');
    if (compactBtnLabel) compactBtnLabel.textContent = 'Upload';
    updateCropHintUI();

    if (DEV_LOG) console.log(`[rotater] restoreSession: calling restoreSettings at ${Date.now()}`);
    restoreSettings();
    // Do not keep the splash up while heavy saved-model restore/parsing continues.
    dismissStartupSplash();
    updateColorSwatches(); // guaranteed init even if restoreSettings throws
    const saved = await loadFileFromIDB();
    if (!saved) {
        scheduleAutoDemoModelLoad();
        return;
    }
    const isMultipart = Array.isArray(saved.parts) && saved.parts.length > 1;
    const displayName = isMultipart
        ? (saved.name || getMultipartDisplayName(saved.parts.map(p => p.name)))
        : saved.name;
    setDisplayedFileName(displayName);
    currentFileName = isMultipart
        ? buildMultipartFileBase(saved.parts.map(p => p.name))
        : stemFromFileName(saved.name);
    if (!renderer) initThree();
    controls.autoRotateSpeed = BASE_ROTATE_SPEED * getSpeed() * spinDir;
    if (DEV_LOG) console.log(`[rotater] restoreSession: calling loadSTLBuffer for user file at ${Date.now()}`);
    try {
        if (isMultipart) {
            modelPartFiles = saved.parts.map(p => ({ name: p.name, buffer: p.buffer }));
            // URL model appearance params represent selected-part state; when restoring
            // a saved multipart session, preserve each part's persisted appearance.
            pendingUrlModelAppearanceOverride = null;
            await loadMultipartSTLBuffers(
                saved.parts.map(p => p.buffer),
                saved.parts.map(p => p.name),
                saved.parts.map(p => p.color || colorPick.value),
                saved.parts.map(p => p.settings || null),
            );
        } else {
            modelPartFiles = null;
            await loadSTLBuffer(saved.buffer, saved.name);
        }
    } catch (err) {
        setStatus('Saved model could not be restored: ' + (err?.message || 'validation failed.'));
        console.error(err);
        setTimeout(() => setStatus(''), 5200);
        scheduleAutoDemoModelLoad();
    }
}

function suppressAutoDemoModelLoad() {
    autoDemoLoadSuppressed = true;
}

function runWhenBrowserIdle(task, timeoutMs = AUTO_LOAD_BENCHY_IDLE_TIMEOUT_MS) {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => task(), { timeout: timeoutMs });
        return;
    }
    setTimeout(task, 0);
}

function scheduleAutoDemoModelLoad() {
    if (autoDemoLoadScheduled || autoDemoLoadSuppressed) return;
    autoDemoLoadScheduled = true;
    if (DEV_LOG) console.log(`[rotater] restoreSession: scheduling demo model load at ${Date.now()}`);
    const runLoad = async () => {
        const hasExplicitModelName = !!currentFileName && currentFileName !== 'model' && currentFileName !== '3dbenchy';
        if (autoDemoLoadSuppressed || mesh || hasExplicitModelName) {
            dismissStartupSplash();
            return;
        }
        try {
            const loaded = await loadBenchyModel({ clearStoredModel: false, markAsDefaultAuto: true });
            if (!loaded) {
                dismissStartupSplash();
                return;
            }
            dismissStartupSplash();
        } catch (e) {
            dismissStartupSplash();
            /* no demo available — stay on landing page */
        }
    };

    if (AUTO_LOAD_BENCHY_ON_IDLE) runWhenBrowserIdle(runLoad);
    else requestAnimationFrame(() => setTimeout(runLoad, 0));
}

function dismissStartupSplash() {
    requestAnimationFrame(() => {
        document.documentElement.classList.remove('booting');
    });
}

// ── UI events ─────────────────────────────────────────────────────────────────
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(reader.error || new Error('Failed to read STL file.'));
        reader.readAsArrayBuffer(file);
    });
}

function openUploadFilePicker(action = null) {
    uploadActionController.setPendingAction(action);
    if (fileInput) fileInput.click();
}

async function requestUploadFlowFromButtons() {
    suppressAutoDemoModelLoad();
    dismissStartupSplash();

    if (isDefaultBenchyOnlyPlate()) {
        uploadActionController.setPendingAction('newplate');
        fileInput?.click();
        return;
    }

    if (mesh && uploadChoiceOverlayEl) {
        setUploadChoiceFiles([]);
        if (uploadChoiceTextEl) uploadChoiceTextEl.textContent = 'Drop STL or ZIP files here, or click Browse.';
        uploadChoiceDropZoneEl?.classList.remove('is-dragover');
        uploadChoiceOverlayEl.hidden = false;
        return;
    }

    uploadActionController.clearPendingAction();
    fileInput?.click();
}

async function handlePickedUploadFiles(fileList, requestedActionOverride = null) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const stlFiles = files.filter((file) => /\.stl$/i.test(file?.name || ''));
    const zipFiles = files.filter((file) => /\.zip$/i.test(file?.name || ''));
    if (!stlFiles.length && !zipFiles.length) {
        setStatus('Select STL or ZIP files only.');
        setTimeout(() => setStatus(''), 2800);
        return;
    }

    const stlActionOverride = normalizeUploadAction(requestedActionOverride, null);

    if (stlFiles.length) {
        await handleFiles(stlFiles, stlActionOverride);
    }

    for (const zipFile of zipFiles) {
        await importRotaterPackage(zipFile);
    }
}

async function handleFiles(fileList, requestedActionOverride = null) {
    dismissStartupSplash();
    const files = Array.from(fileList || []).filter(f => f?.name?.toLowerCase?.().endsWith('.stl'));
    if (!files.length) return;
    validateIncomingStlFileBatch(files, 'Upload');

    const skipPromptForDefaultBenchy = isDefaultBenchyOnlyPlate();

    let requestedAction = normalizeUploadAction(requestedActionOverride, 'newplate');

    if (mesh && !requestedActionOverride) {
        if (skipPromptForDefaultBenchy) {
            requestedAction = 'newplate';
        } else {
            requestedAction = await promptUploadChoice(files);
            if (requestedAction !== 'replace' && requestedAction !== 'append' && requestedAction !== 'newplate') {
                return;
            }
        }
    }

    autoLoadedDefaultBenchy = false;

    if (!mesh) requestedAction = 'newplate';

    if (mesh && requestedAction === 'append') {
        try {
            await appendSTLPartsToCurrentModel(files);
        } catch (err) {
            setStatus('Error: ' + (err?.message || 'Failed to add model(s) to plate.'));
            console.error(err);
            setTimeout(() => setStatus(''), 5000);
        }
        return;
    }

    if (mesh && requestedAction === 'replace') {
        if (isMultipartModel()) {
            if (files.length !== 1) {
                setStatus('Replace supports one STL at a time for multipart. Use New Plate for multiple files.');
                setTimeout(() => setStatus(''), 3200);
                return;
            }
            try {
                await replaceMultipartPart(Math.max(0, modelPartSelected), files[0]);
                saveSettings();
            } catch (err) {
                setStatus('Error: ' + (err?.message || 'Failed to replace STL part.'));
                console.error(err);
                setTimeout(() => setStatus(''), 5000);
            }
            return;
        }
        // Single-model replace falls through to same load path as new plate.
    }

    const isMultipart = files.length > 1;
    const displayName = isMultipart ? getMultipartDisplayName(files.map(f => f.name)) : files[0].name;
    setDisplayedFileName(displayName);
    currentFileName = isMultipart
        ? buildMultipartFileBase(files.map(f => f.name))
        : stemFromFileName(files[0].name);
    if (!renderer) initThree();

    if (isMultipart) {
        try {
            const parts = await Promise.all(files.map(async (file) => {
                const buffer = await readFileAsArrayBuffer(file);
                validateStlBufferFast(file.name, buffer);
                return {
                    name: file.name,
                    buffer,
                    color: colorPick.value,
                    settings: createPartSettings(colorPick.value),
                };
            }));
            await saveFilesToIDB(parts, displayName);
            saveSettings();
            modelPartFiles = parts.map(p => ({ name: p.name, buffer: p.buffer }));
            await loadMultipartSTLBuffers(parts.map(p => p.buffer), parts.map(p => p.name), parts.map(p => p.color));
        } catch (err) {
            setStatus('Error: ' + (err?.message || 'Failed to load STL parts.'));
            console.error(err);
            setTimeout(() => setStatus(''), 5000);
        }
        return;
    }

    try {
        const file = files[0];
        const buffer = await readFileAsArrayBuffer(file);
        validateStlBufferFast(file.name, buffer);
        await saveFileToIDB(file.name, buffer);
        modelPartFiles = null;
        saveSettings();
        await loadSTLBuffer(buffer, file.name);
    } catch (err) {
        setStatus('Error: ' + (err?.message || 'Failed to load STL file.'));
        console.error(err);
        setTimeout(() => setStatus(''), 5000);
    }
}

async function appendSTLPartsToCurrentModel(fileList) {
    const files = Array.from(fileList || []).filter((f) => f?.name?.toLowerCase?.().endsWith('.stl'));
    if (!files.length) return;
    validateIncomingStlFileBatch(files, 'Append');
    if (!mesh) {
        await handleFiles(files);
        return;
    }

    const incoming = await Promise.all(files.map(async (file) => {
        const color = colorPick.value;
        const buffer = await readFileAsArrayBuffer(file);
        validateStlBufferFast(file.name, buffer);
        return {
            name: file.name,
            buffer,
            color,
            settings: createPartSettings(color),
        };
    }));

    let existingFiles = [];
    let existingNames = [];
    let existingColors = [];
    let existingSettings = [];

    if (isMultipartModel()) {
        if (!modelPartFiles || modelPartFiles.length !== modelPartNames.length) {
            throw new Error('Current multipart source files are unavailable for append. Re-import the package and try again.');
        }
        existingFiles = modelPartFiles.map((part) => ({ name: part.name, buffer: part.buffer }));
        existingNames = [...modelPartNames];
        existingColors = modelPartNames.map((_, idx) => {
            const s = getPartSettings(idx);
            return s.color || modelPartBaseColors[idx] || colorPick.value;
        });
        existingSettings = modelPartNames.map((_, idx) => {
            const s = getPartSettings(idx);
            const c = existingColors[idx] || colorPick.value;
            return { ...createPartSettings(c), ...s, color: c };
        });
    } else {
        const singleName = modelPartNames[0] || `${currentFileName || 'model'}.stl`;
        if (!currentModelBuffer) {
            throw new Error('Current model source is unavailable for append. Reload this model and try again.');
        }
        const s = getPartSettings(0);
        const c = s.color || modelPartBaseColors[0] || colorPick.value;
        existingFiles = [{ name: singleName, buffer: currentModelBuffer }];
        existingNames = [singleName];
        existingColors = [c];
        existingSettings = [{ ...createPartSettings(c), ...s, color: c }];
    }

    const nextFiles = [
        ...existingFiles,
        ...incoming.map((part) => ({ name: part.name, buffer: part.buffer })),
    ];
    const nextNames = [...existingNames, ...incoming.map((part) => part.name)];
    const nextColors = [...existingColors, ...incoming.map((part) => part.color || colorPick.value)];
    const nextSettings = [
        ...existingSettings,
        ...incoming.map((part, idx) => {
            const c = nextColors[existingSettings.length + idx] || colorPick.value;
            return { ...createPartSettings(c), ...part.settings, color: c };
        }),
    ];

    const displayName = getMultipartDisplayName(nextNames);

    await saveFilesToIDB(nextFiles.map((part, idx) => ({
        name: part.name,
        buffer: part.buffer,
        color: nextColors[idx] || colorPick.value,
        settings: nextSettings[idx] || createPartSettings(nextColors[idx] || colorPick.value),
    })), displayName);

    modelPartFiles = nextFiles;
    ensureModelPartDisplayOrder();
    pendingModelPartDisplayOrder = [...modelPartDisplayOrder, ...incoming.map((_, idx) => existingNames.length + idx)];
    pendingModelPartSelected = Math.max(0, nextFiles.length - incoming.length);
    setDisplayedFileName(displayName);
    currentFileName = buildMultipartFileBase(nextNames);
    await loadMultipartSTLBuffers(nextFiles.map((part) => part.buffer), nextNames, nextColors, nextSettings);
    rebuildFileChipPartsMenu();
    syncFileChipMultipartUI();
    saveSettings();
}

const IMPORT_ZIP_LIMITS = {
    maxArchiveBytes: 64 * 1024 * 1024,
    maxEntryCount: 300,
    maxStlCount: 120,
    maxSingleEntryBytes: 96 * 1024 * 1024,
    maxTotalExtractedBytes: 220 * 1024 * 1024,
    maxCompressionRatio: 160,
    maxPackageJsonChars: 1_000_000,
};

function normalizeZipEntryPath(path) {
    const raw = String(path || '').replace(/\\/g, '/').trim();
    if (!raw) return null;
    if (/^[a-zA-Z]:\//.test(raw) || raw.startsWith('/')) return null;
    const parts = raw.split('/').filter(Boolean);
    if (!parts.length) return null;
    if (parts.some((seg) => seg === '.' || seg === '..')) return null;
    return parts.join('/');
}

function getZipEntryBaseName(path) {
    const clean = normalizeZipEntryPath(path);
    const base = clean ? clean.split('/').pop() : 'model.stl';
    return safeDownloadFileName(base || 'model.stl', 'model.stl');
}

async function importRotaterPackage(zipFile) {
    if (!zipFile || !/\.zip$/i.test(zipFile.name || '')) {
        throw new Error('Please select a valid .zip package.');
    }
    if (zipFile.size > IMPORT_ZIP_LIMITS.maxArchiveBytes) {
        throw new Error('Package is too large. Use a ZIP smaller than 64 MB.');
    }

    const zip = await JSZip.loadAsync(zipFile, { createFolders: false });
    const entries = Object.values(zip.files || {}).filter((entry) => !entry.dir);
    if (!entries.length) throw new Error('Package is empty.');
    if (entries.length > IMPORT_ZIP_LIMITS.maxEntryCount) {
        throw new Error('Package has too many files.');
    }

    const packageEntries = [];
    let packageJsonEntry = null;

    for (const entry of entries) {
        const safePath = normalizeZipEntryPath(entry.name);
        if (!safePath) {
            throw new Error('Package contains unsafe file paths.');
        }
        const lower = safePath.toLowerCase();
        const isStl = lower.endsWith('.stl');
        const isPackageJson = lower.endsWith('package.json');

        if (!isStl && !isPackageJson) {
            throw new Error(`Unsupported file in package: ${safePath}`);
        }

        const expectedSize = Number(entry?._data?.uncompressedSize);
        const compressedSize = Number(entry?._data?.compressedSize);
        if (Number.isFinite(expectedSize) && expectedSize > IMPORT_ZIP_LIMITS.maxSingleEntryBytes) {
            throw new Error(`File is too large in package: ${safePath}`);
        }
        if (Number.isFinite(expectedSize) && Number.isFinite(compressedSize) && expectedSize > 0) {
            if (compressedSize <= 0) {
                throw new Error(`Package entry has suspicious compression data: ${safePath}`);
            }
            const ratio = expectedSize / compressedSize;
            if (ratio > IMPORT_ZIP_LIMITS.maxCompressionRatio) {
                throw new Error(`Package entry has suspicious compression ratio: ${safePath}`);
            }
        }

        if (isPackageJson) {
            if (packageJsonEntry) throw new Error('Package contains multiple package.json files.');
            packageJsonEntry = entry;
            continue;
        }

        packageEntries.push({ entry, safePath });
    }

    if (!packageEntries.length) throw new Error('No STL files found in package.');
    if (packageEntries.length > IMPORT_ZIP_LIMITS.maxStlCount) {
        throw new Error('Package contains too many STL files.');
    }

    let packageJson = null;
    if (packageJsonEntry) {
        try {
            const jsonText = await packageJsonEntry.async('string');
            if (jsonText.length > IMPORT_ZIP_LIMITS.maxPackageJsonChars) {
                throw new Error('package.json is too large.');
            }
            const parsed = JSON.parse(jsonText);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                packageJson = parsed;
            }
        } catch (err) {
            throw new Error('package.json is invalid.');
        }
    }

    const modelOrder = Array.isArray(packageJson?.model?.partNames)
        ? packageJson.model.partNames.slice(0, IMPORT_ZIP_LIMITS.maxStlCount).map((n) => String(n || '').toLowerCase())
        : null;

    const parts = [];
    let totalExtractedBytes = 0;
    let totalEstimatedTriangles = 0;
    for (let idx = 0; idx < packageEntries.length; idx++) {
        const item = packageEntries[idx];
        const buffer = await item.entry.async('arraybuffer');
        const size = buffer?.byteLength || 0;
        if (size > IMPORT_ZIP_LIMITS.maxSingleEntryBytes) {
            throw new Error(`File is too large in package: ${item.safePath}`);
        }
        validateStlBufferFast(item.safePath, buffer);
        totalExtractedBytes += size;
        if (totalExtractedBytes > IMPORT_ZIP_LIMITS.maxTotalExtractedBytes) {
            throw new Error('Package extract size is too large.');
        }
        const estTriangles = estimateBinaryStlTriangleCount(buffer);
        if (Number.isFinite(estTriangles)) {
            totalEstimatedTriangles += estTriangles;
            if (totalEstimatedTriangles > IMPORT_STL_LIMITS.maxTrianglesTotal) {
                throw new Error('Package triangle budget is too large.');
            }
        }
        parts.push({
            idx,
            name: getZipEntryBaseName(item.safePath),
            buffer,
        });
    }

    if (modelOrder && modelOrder.length) {
        parts.sort((a, b) => {
            const ai = modelOrder.indexOf(a.name.toLowerCase());
            const bi = modelOrder.indexOf(b.name.toLowerCase());
            const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
            const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
            return av - bv || a.idx - b.idx;
        });
    }

    const incomingLabel = parts.length > 1 ? `${parts.length} STL files` : `"${parts[0].name}"`;
    if (mesh && !confirm(`Replace current model with ${incomingLabel}?`)) return;
    autoLoadedDefaultBenchy = false;

    if (packageJson?.settings && typeof packageJson.settings === 'object' && !Array.isArray(packageJson.settings)) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(packageJson.settings));
            // Strip current URL params so restoreSettings() reads only the
            // localStorage values we just wrote; saveSettings() inside
            // restoreSettings() will update the URL from the applied state.
            history.replaceState(null, '', location.pathname);
            restoreSettings();
        } catch (_) { }
    }

    if (!renderer) initThree();

    if (parts.length > 1) {
        const packageName = String(packageJson?.name || '').trim();
        const displayName = packageName
            ? safeDownloadFileName(packageName, getMultipartDisplayName(parts.map((p) => p.name)))
            : getMultipartDisplayName(parts.map((p) => p.name));
        const importParts = parts.map((part, idx) => {
            const rawColor = packageJson?.model?.partColors?.[idx];
            const savedColor = /^#[0-9a-f]{6}$/i.test(String(rawColor || '')) ? String(rawColor) : colorPick.value;
            const rawSettings = packageJson?.model?.partSettings?.[idx];
            const savedSettings = (rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings))
                ? rawSettings
                : null;
            return {
                name: part.name,
                buffer: part.buffer,
                color: savedColor,
                settings: savedSettings
                    ? { ...createPartSettings(savedColor), ...savedSettings, color: savedColor }
                    : createPartSettings(savedColor),
            };
        });
        await saveFilesToIDB(importParts, displayName);
        modelPartFiles = importParts.map((part) => ({ name: part.name, buffer: part.buffer }));
        setDisplayedFileName(displayName);
        currentFileName = buildMultipartFileBase(importParts.map((part) => part.name));
        await loadMultipartSTLBuffers(
            importParts.map((part) => part.buffer),
            importParts.map((part) => part.name),
            importParts.map((part) => part.color),
            importParts.map((part) => part.settings),
        );
    } else {
        await saveFileToIDB(parts[0].name, parts[0].buffer);
        modelPartFiles = null;
        setDisplayedFileName(parts[0].name);
        currentFileName = stemFromFileName(parts[0].name);
        await loadSTLBuffer(parts[0].buffer, parts[0].name);
    }

    saveSettings();
}

async function replaceMultipartPart(partIdx, file) {
    if (!file || !isMultipartModel() || !modelPartFiles || modelPartFiles.length !== modelPartNames.length) return;
    validateIncomingStlFileBatch([file], 'Replace');
    const index = Math.max(0, Math.min(partIdx, modelPartFiles.length - 1));
    const buffer = await readFileAsArrayBuffer(file);
    validateStlBufferFast(file.name, buffer);

    const nextFiles = modelPartFiles.map((part) => ({ ...part }));
    nextFiles[index] = { name: file.name, buffer };
    const nextNames = nextFiles.map((part) => part.name);
    const nextColors = modelPartBaseColors.map((c) => c || colorPick.value);
    const nextSettings = modelPartSettings.map((s, idx) => ({ ...getPartSettings(idx), ...s, color: nextColors[idx] || colorPick.value }));
    const displayName = getMultipartDisplayName(nextNames);

    await saveFilesToIDB(nextFiles.map((part, idx) => ({
        name: part.name,
        buffer: part.buffer,
        color: nextColors[idx] || colorPick.value,
        settings: nextSettings[idx] || createPartSettings(nextColors[idx] || colorPick.value),
    })), displayName);

    modelPartFiles = nextFiles;
    pendingModelPartSelected = Math.min(index, nextFiles.length - 1);
    setDisplayedFileName(displayName);
    currentFileName = buildMultipartFileBase(nextNames);
    await loadMultipartSTLBuffers(nextFiles.map((part) => part.buffer), nextNames, nextColors, nextSettings);
    rebuildFileChipPartsMenu();
    syncFileChipMultipartUI();
}

async function removeMultipartPart(partIdx, options = {}) {
    const { confirmRemoval = true } = options;
    if (!isMultipartModel() || !modelPartFiles || modelPartFiles.length !== modelPartNames.length) return;
    if (modelPartFiles.length <= 1) return;
    const index = Math.max(0, Math.min(partIdx, modelPartFiles.length - 1));
    if (confirmRemoval && !confirm(`Remove part \"${modelPartNames[index]}\"?`)) return;
    ensureModelPartDisplayOrder();
    const nextFiles = modelPartFiles.filter((_, idx) => idx !== index);
    const nextNames = nextFiles.map((part) => part.name);
    const nextColors = modelPartBaseColors.filter((_, idx) => idx !== index);
    const nextSettings = modelPartSettings.filter((_, idx) => idx !== index).map((s, idx) => ({ ...s, color: nextColors[idx] || s.color || colorPick.value }));
    const nextSelected = modelPartSelected > index
        ? (modelPartSelected - 1)
        : (modelPartSelected === index ? Math.max(0, index - 1) : modelPartSelected);

    if (nextFiles.length === 1) {
        await saveFileToIDB(nextFiles[0].name, nextFiles[0].buffer);
        currentFileName = stemFromFileName(nextFiles[0].name);
        setDisplayedFileName(nextFiles[0].name);
        modelPartFiles = null;
        await loadSTLBuffer(nextFiles[0].buffer, nextFiles[0].name);

        // Preserve the surviving model's visual settings when collapsing multipart -> single.
        const survivingColor = nextColors[0] || colorPick.value;
        const survivingSettings = {
            ...createPartSettings(survivingColor),
            ...(nextSettings[0] || {}),
            color: survivingColor,
        };
        modelPartBaseColors = [survivingColor];
        modelPartSettings = [survivingSettings];
        modelPartSelected = 0;
        colorPick.value = survivingColor;
        if (mesh) rebuildMeshMaterialsForCurrentShading();
        syncUIFromSelectedPart();
    } else {
        pendingModelPartDisplayOrder = modelPartDisplayOrder
            .filter((idx) => idx !== index)
            .map((idx) => (idx > index ? idx - 1 : idx));
        const displayName = getMultipartDisplayName(nextNames);
        await saveFilesToIDB(nextFiles.map((part, idx) => ({
            name: part.name,
            buffer: part.buffer,
            color: nextColors[idx] || colorPick.value,
            settings: nextSettings[idx] || createPartSettings(nextColors[idx] || colorPick.value),
        })), displayName);
        modelPartFiles = nextFiles;
        pendingModelPartSelected = Math.max(0, Math.min(nextSelected, nextFiles.length - 1));
        setDisplayedFileName(displayName);
        currentFileName = buildMultipartFileBase(nextNames);
        await loadMultipartSTLBuffers(nextFiles.map((part) => part.buffer), nextNames, nextColors, nextSettings);
    }

    rebuildFileChipPartsMenu();
    syncFileChipMultipartUI();
}

[
    btnUploadStlPrimary,
    btnUploadStlCanvas,
    btnUploadStlSidebar,
].forEach((btn) => {
    btn?.addEventListener('click', () => {
        requestUploadFlowFromButtons();
    });
});

fileInput.addEventListener('change', async (e) => {
    suppressAutoDemoModelLoad();
    const requestedAction = uploadActionController.consumePendingAction();
    try {
        await handlePickedUploadFiles(e.target.files, requestedAction);
    } catch (err) {
        setStatus('Error: ' + (err?.message || 'Failed to import file(s).'));
        console.error(err);
        setTimeout(() => setStatus(''), 5000);
    }
    // Allow re-selecting the same file(s) to retrigger change.
    e.target.value = '';
});

btnFileChipExpand?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (btnFileChipExpand.hidden) return;
    const isOpen = fileChipPartsMenu && !fileChipPartsMenu.hidden;
    closeFileChipPartsMenu();
    if (!isOpen && fileChipPartsMenu) {
        rebuildFileChipPartsMenu();
        fileChipPartsMenu.hidden = false;
        btnFileChipExpand.setAttribute('aria-expanded', 'true');
    }
});

fileChipPartsMenu?.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    const targetBtn = ev.target?.closest?.('button[data-action][data-part-index]');
    if (!targetBtn) return;
    const action = targetBtn.dataset.action;

    if (action === 'add') {
        partAppendInput?.click();
        return;
    }

    const partIdx = parseInt(targetBtn.dataset.partIndex || '-1', 10);
    if (!Number.isFinite(partIdx) || partIdx < 0) return;

    if (action === 'replace') {
        const partName = modelPartNames[partIdx] || `Part ${partIdx + 1}`;
        if (!confirm(`Replace STL for ${partName}?`)) return;
        pendingReplacePartIndex = partIdx;
        partReplaceInput?.click();
        return;
    }
    if (action === 'remove') {
        await removeMultipartPart(partIdx);
    }
});

partReplaceInput?.addEventListener('change', async (ev) => {
    const idx = pendingReplacePartIndex;
    pendingReplacePartIndex = -1;
    const file = ev.target?.files?.[0];
    if (!file || idx < 0) {
        ev.target.value = '';
        return;
    }
    try {
        await replaceMultipartPart(idx, file);
    } catch (err) {
        setStatus('Error: ' + (err?.message || 'Failed to replace STL part.'));
        console.error(err);
        setTimeout(() => setStatus(''), 5000);
    }
    ev.target.value = '';
});

partAppendInput?.addEventListener('change', async (ev) => {
    const files = Array.from(ev.target?.files || []);
    if (!files.length) {
        ev.target.value = '';
        return;
    }
    try {
        await appendSTLPartsToCurrentModel(files);
    } catch (err) {
        setStatus('Error: ' + (err?.message || 'Failed to add STL part(s).'));
        console.error(err);
        setTimeout(() => setStatus(''), 5000);
    }
    ev.target.value = '';
});

const PLAY_PAUSE_ICON_PATHS = {
    play: '<path d="M6.69824 17.6097V6.39024C6.69824 5.98558 6.84083 5.64866 7.12599 5.37949C7.41133 5.11016 7.74341 4.97549 8.12224 4.97549C8.24141 4.97549 8.36416 4.99316 8.49049 5.02849C8.61683 5.06383 8.74224 5.12316 8.86674 5.20649L17.7065 10.8032C17.9308 10.9406 18.0981 11.1169 18.2082 11.3322C18.3182 11.5476 18.3732 11.7712 18.3732 12.003C18.3732 12.2348 18.3162 12.4574 18.202 12.6707C18.0877 12.8841 17.9225 13.0594 17.7065 13.1967L8.86674 18.7935C8.74224 18.8768 8.61499 18.9362 8.48499 18.9715C8.35499 19.0068 8.23133 19.0245 8.11399 19.0245C7.74066 19.0245 7.41133 18.8898 7.12599 18.6205C6.84083 18.3513 6.69824 18.0144 6.69824 17.6097Z" fill="currentColor"></path>',
    pause: '<path d="M16.4974 19.982C15.7016 19.982 15.0316 19.7103 14.4874 19.167C13.9433 18.6235 13.6712 17.9521 13.6712 17.1527V6.80325C13.6712 6.00958 13.9429 5.33958 14.4864 4.79325C15.0299 4.24708 15.7013 3.974 16.5007 3.974C17.2943 3.974 17.9643 4.24708 18.5104 4.79325C19.0568 5.33958 19.3299 6.00958 19.3299 6.80325V17.1527C19.3299 17.9521 19.0568 18.6235 18.5104 19.167C17.9641 19.7103 17.2931 19.982 16.4974 19.982ZM7.49917 19.982C6.70551 19.982 6.03559 19.7103 5.48942 19.167C4.94309 18.6235 4.66992 17.9521 4.66992 17.1527V6.80325C4.66992 6.00958 4.94309 5.33958 5.48942 4.79325C6.03576 4.24708 6.70676 3.974 7.50242 3.974C8.29826 3.974 8.96826 4.24708 9.51242 4.79325C10.0566 5.33958 10.3287 6.00958 10.3287 6.80325V17.1527C10.3287 17.9521 10.0569 18.6235 9.51342 19.167C8.96992 19.7103 8.29851 19.982 7.49917 19.982Z" fill="currentColor"></path>',
};

function syncPlayPauseIcon(svgEl, iconName) {
    if (!svgEl) return;
    svgEl.innerHTML = PLAY_PAUSE_ICON_PATHS[iconName] || PLAY_PAUSE_ICON_PATHS.pause;
}

function updateExportPauseButtonUI() {
    const btn = document.getElementById('btnExportPause');
    if (btn) {
        btn.hidden = !exportWorkspaceActive;
        btn.style.display = exportWorkspaceActive ? 'flex' : 'none';
    }
    if (btnPause) {
        btnPause.hidden = !!exportWorkspaceActive;
        btnPause.style.display = exportWorkspaceActive ? 'none' : '';
    }
    if (btn) btn.classList.toggle('is-paused', isPaused);
    btnPause?.classList.toggle('is-playing', !isPaused);
    const nextIcon = isPaused ? 'play' : 'pause';
    syncPlayPauseIcon(iconPlayPause, nextIcon);
    syncPlayPauseIcon(iconExportPlayPause, nextIcon);
    updatePauseControlAvailability();
}

function getPauseInteractionLockMessage() {
    return '';
}

function updatePauseControlAvailability() {
    const lockedMessage = getPauseInteractionLockMessage();
    const isLocked = !!lockedMessage;
    const activeLabel = isPaused ? 'Play rotation' : 'Pause rotation';

    const applyButtonState = (btnEl) => {
        if (!btnEl) return;
        if ('disabled' in btnEl) btnEl.disabled = isLocked;
        btnEl.classList.toggle('is-locked', isLocked);
        btnEl.setAttribute('aria-disabled', isLocked ? 'true' : 'false');
        btnEl.setAttribute('aria-label', isLocked ? lockedMessage : activeLabel);
        btnEl.title = isLocked ? lockedMessage : activeLabel;
    };

    applyButtonState(btnPause);
    applyButtonState(document.getElementById('btnExportPause'));
}

function setPauseState(nextPaused, persist = true, allowLockedResume = false) {
    if (rotateModeEl.value === 'off') nextPaused = false;

    if (!nextPaused && !allowLockedResume && getPauseInteractionLockMessage()) {
        updatePauseControlAvailability();
        return false;
    }

    isPaused = !!nextPaused;
    if (controls) {
        controls.autoRotate = !isPaused && (rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360));
    }
    document.documentElement.classList.toggle('rotation-paused', isPaused);
    updateExportPauseButtonUI();
    if (persist) saveSettings();
    return true;
}

function applyDpadVisibility() {
    document.documentElement.classList.toggle('dpad-hidden', !dpadVisible);
}

function togglePause() {
    if (rotateModeEl.value === 'off') return;
    setPauseState(!isPaused, true, false);
}

function toggleSpinDir() {
    spinDir = -spinDir;
    if (controls) controls.autoRotateSpeed = BASE_ROTATE_SPEED * getSpeed() * spinDir;
    updateSpinDirUI();
    saveSettings();
}

function updateSpinDirUI() {
    const spinLabel = document.getElementById('spinModeLabel');
    if (spinLabel) {
        const title = spinDir > 0
            ? 'Rotation: CC (click Spin again for CCW)'
            : 'Rotation: CCW (click Spin again for CC)';
        spinLabel.title = title;
        spinLabel.setAttribute('aria-label', title);
    }
    document.documentElement.classList.toggle('spin-ccw', spinDir < 0);
}

function updateTiltRangeReset() {
    const m = rotateModeEl.value;
    const def = m === 'spin' ? SPIN_RANGE_DEFAULT : TILT_RANGE_DEFAULT;
    tiltRangeResetBtn.classList.toggle('is-changed', parseFloat(tiltRangeSlider.value) !== def);
}

function normalizeSpinRangeValue(value) {
    const v = Number.isFinite(Number(value)) ? Number(value) : SPIN_RANGE_DEFAULT;
    const clamped = Math.max(45, Math.min(360, v));
    return Math.max(45, Math.min(360, 45 * Math.round(clamped / 45)));
}

function normalizeTiltRangeValue(value) {
    const v = Number.isFinite(Number(value)) ? Number(value) : TILT_RANGE_DEFAULT;
    const clamped = Math.max(10, Math.min(50, v));
    return Math.max(10, Math.min(50, 10 * Math.round(clamped / 10)));
}

function forceSpinRangeDefault() {
    tiltRangeSlider.value = String(SPIN_RANGE_DEFAULT);
    tiltRangeVal.textContent = `${SPIN_RANGE_DEFAULT}°`;
    syncSliderTooltip(tiltRangeSlider);
}

btnPause.addEventListener('click', togglePause);
document.getElementById('btnExportPause')?.addEventListener('click', togglePause);
updateExportPauseButtonUI();
applyDpadVisibility();

// Re-clicking active Spin card toggles CC/CCW; other active cards toggle pause.
// Use delegated handlers so clicks on any nested element in the card behave consistently.
const rotateOptionWasChecked = new WeakMap();
document.addEventListener('pointerdown', (ev) => {
    const label = ev.target?.closest?.('.rotation-option');
    if (!label) return;
    const input = label.querySelector('input[name="rotateMode"]');
    if (!input) return;
    rotateOptionWasChecked.set(input, !!input.checked);
});
document.addEventListener('click', (ev) => {
    const label = ev.target?.closest?.('.rotation-option');
    if (!label) return;
    const input = label.querySelector('input[name="rotateMode"]');
    if (!input) return;
    const wasChecked = rotateOptionWasChecked.get(input) === true;
    rotateOptionWasChecked.delete(input);
    if (!wasChecked) return;
    if (input.value === 'spin') toggleSpinDir();
    else togglePause();
});
document.addEventListener('keydown', e => {
    const target = e.target;
    const isEditableTarget = !!(
        target
        && (
            target.tagName === 'INPUT'
            || target.tagName === 'TEXTAREA'
            || target.tagName === 'SELECT'
            || target.isContentEditable
        )
    );

    // Space: always pause/resume outside editable fields.
    if (e.code === 'Space' && !isEditableTarget) {
        e.preventDefault();
        e.stopPropagation();
        togglePause();
        return;
    }
    // Escape: collapse preview only when currently expanded.
    if (e.code === 'Escape') {
        const previewExpanded = document.documentElement.classList.contains('sidebar-collapsed');
        if (previewExpanded) {
            e.preventDefault();
            e.stopPropagation();
            const btnToggleSidepanels = document.getElementById('btnToggleSidepanels');
            if (btnToggleSidepanels) btnToggleSidepanels.click();
        }
        return;
    }
    // Arrow keys: D-pad orbit snap (only when not typing in an input)
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.code === 'ArrowLeft') { e.preventDefault(); snapOrbit(-1, 0); }
    if (e.code === 'ArrowRight') { e.preventDefault(); snapOrbit(1, 0); }
    if (e.code === 'ArrowUp') { e.preventDefault(); snapOrbit(0, -1); }
    if (e.code === 'ArrowDown') { e.preventDefault(); snapOrbit(0, 1); }
});

function snapCamera(azimuth, elevation) {
    if (!camera) return;
    const { target, dist } = getOrbitFrameState();
    const el = THREE.MathUtils.clamp(elevation, -(Math.PI / 2 - 0.01), Math.PI / 2 - 0.01);
    // Zero any residual damping velocity so the snap is instant with no post-snap drift
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = true;
    setCameraFromOrbitState(camera, target, dist, el, azimuth);
    // Avoid gimbal lock on near-vertical views
    camera.up.set(0, Math.abs(elevation) > Math.PI / 4 ? 0 : 1, Math.abs(elevation) > Math.PI / 4 ? (elevation > 0 ? -1 : 1) : 0);
    camera.lookAt(target);
    controls.target.copy(target);
    controls.update();
    if (exportFrameEnabled) {
        _cropLiveSyncArmed = true;
        syncExportCameraFromViewport();
    }
    renderer.render(scene, camera);
}

// Orbit snap buttons — move camera only, mesh never moves
function snapOrbit(azDir, elDir) {
    if (!camera) return;
    const STEP = Math.PI / 4; // 45° snap increment
    const MAX_EL = Math.PI / 2 - 0.01;
    const { elev, az: baseAz } = getOrbitFrameState();
    let el = THREE.MathUtils.clamp(elev, -MAX_EL, MAX_EL);
    let az = baseAz;
    if (azDir !== 0) {
        const eps = 1e-6;
        az = azDir > 0
            ? Math.ceil((az + eps) / STEP) * STEP
            : Math.floor((az - eps) / STEP) * STEP;
    }
    if (elDir !== 0) {
        const eps = 1e-6;
        el = elDir > 0
            ? Math.min(Math.ceil((el + eps) / STEP) * STEP, MAX_EL)
            : Math.max(Math.floor((el - eps) / STEP) * STEP, -MAX_EL);
    }
    snapCamera(az, el);
}

document.getElementById('btnCamLeft').addEventListener('click', () => snapOrbit(-1, 0));
document.getElementById('btnCamRight').addEventListener('click', () => snapOrbit(1, 0));
document.getElementById('btnCamUp').addEventListener('click', () => snapOrbit(0, -1));
document.getElementById('btnCamDown').addEventListener('click', () => snapOrbit(0, 1));
document.getElementById('btnCamReset').addEventListener('click', () => {
    if (!camera) return;
    // Level to 0° elevation, preserve azimuth, fit to full viewport with breathing room.
    // Use getOrbitFrameState() so azimuth is relative to controls.target (correct even after pan).
    const { az } = getOrbitFrameState();
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const aspect = camera.aspect > 0 ? camera.aspect : 1;
    const newDist = modelRadius * Math.max(1, 1 / aspect) / tanHalfFov * VIEWPORT_FIT_SCALE;
    camera.up.set(0, 1, 0);
    camera.position.set(newDist * Math.sin(az), 0, newDist * Math.cos(az));
    camera.lookAt(0, 0, 0);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
    tiltBaseMeshRx = -Math.PI / 2;
    tiltPhase = 0;
    if (mesh) mesh.rotation.x = tiltBaseMeshRx;
    storeExportCamera();
    // In Tilt/Wobble mode, pause so the model holds the neutral level position
    const m = rotateModeEl.value;
    if ((m === 'tilt' || m === 'wobble') && !isPaused) {
        setPauseState(true, false, true);
    }
    // This camera move is programmatic (no OrbitControls end event), so
    // persist immediately to keep refresh aligned with the reframed view.
    saveSettings({ immediateUrlSync: true });
    renderer.render(scene, camera);
});

document.getElementById('btnExportPng').addEventListener('click', async () => {
    if (!mesh) return;
    // Pause if not already
    if (!isPaused) {
        setPauseState(true, false, true);
    }
    const isTransparent = document.getElementById('exportTransparentPng')?.checked ?? false;

    try {
        const blob = await renderStillImageBlob('image/png', { transparent: isTransparent });
        download(blob, buildExportFilename('png'), 'image/png');
    } catch (err) {
        setStatus('Error: ' + err.message);
        console.error(err);
        setTimeout(() => setStatus(''), 5000);
    }
});

document.getElementById('btnExportJpeg').addEventListener('click', async () => {
    if (!mesh) return;
    if (!isPaused) {
        setPauseState(true, false, true);
    }
    const { quality } = EXPORT.image;
    try {
        const blob = await renderStillImageBlob('image/jpeg', { quality, transparent: false });
        download(blob, buildExportFilename('jpg'), 'image/jpeg');
    } catch (err) {
        setStatus('Error: ' + err.message);
        console.error(err);
        setTimeout(() => setStatus(''), 5000);
    }
});

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    suppressAutoDemoModelLoad();
    handleFiles(e.dataTransfer.files);
});

function updateShadingThumbs() {
    // Thumbnails use fixed blueberry palette — static previews are clearer.
}

function updateColorSwatches() {
    //    document.getElementById('colorSwatch').style.background = colorPick.value;
    //    document.getElementById('bgSwatch').style.background = bgPick.value;
}

function setTextureTunePanelOpen(open) {
    if (!textureTunePanel) return;
    textureTunePanel.hidden = !open;
    if (textureTuneBtn) textureTuneBtn.setAttribute('aria-expanded', String(open));
    if (open) updateTextureTuneUI();
}

function isTextureNewBadgeDismissed() {
    try { return localStorage.getItem(TEXTURE_NEWS_DISMISSED_KEY) === '1'; } catch (e) { return false; }
}

function setTextureNewBadgeDismissed(hidden) {
    try { localStorage.setItem(TEXTURE_NEWS_DISMISSED_KEY, hidden ? '1' : '0'); } catch (e) { }
}

function dismissTextureNewBadge() {
    if (textureTuneNewBadge) textureTuneNewBadge.hidden = true;
    setTextureNewBadgeDismissed(true);
}

function initTextureNewsUI() {
    if (!textureTuneNewBadge) return;

    if (isTextureNewBadgeDismissed()) {
        textureTuneNewBadge.hidden = true;
        return;
    }

    textureTuneNewBadge.hidden = false;
}

function updateTextureTuneUI() {
    const mode = getActiveShadingMode();
    const isStandard = mode === 'metallic' || mode === 'phong' || mode === 'matte';
    if (textureTuneContrastRow) textureTuneContrastRow.hidden = false;
    if (textureTuneHighlightsRow) textureTuneHighlightsRow.hidden = false;
    if (textureTuneShadowRow) textureTuneShadowRow.hidden = false;
    if (textureTuneLightSourceRow) textureTuneLightSourceRow.hidden = false;
    if (textureTuneLightLockBox) textureTuneLightLockBox.checked = textureTuneState.lightLock;
    if (textureTuneLightHeightRow) textureTuneLightHeightRow.hidden = false;
    const showFinishSlider = isStandard && fineTuningMode;
    if (finishControlGroupEl) finishControlGroupEl.hidden = !isStandard;
    if (textureTuneRoughnessRow) textureTuneRoughnessRow.hidden = !showFinishSlider;
    if (textureTuneMetalnessRow) textureTuneMetalnessRow.hidden = mode !== 'metallic';

    if (textureTuneLightSlider) {
        textureTuneLightSlider.value = String(textureTuneState.light);
        syncSliderTooltip(textureTuneLightSlider);
    }
    if (textureTuneLightVal) textureTuneLightVal.textContent = getCenteredLightingReadout(textureTuneLightSlider);

    if (textureTuneContrastSlider) {
        textureTuneContrastSlider.value = String(textureTuneState.contrast);
        syncSliderTooltip(textureTuneContrastSlider);
    }
    if (textureTuneContrastVal) textureTuneContrastVal.textContent = getCenteredLightingReadout(textureTuneContrastSlider);

    if (textureTuneHighlightsSlider) {
        textureTuneHighlightsSlider.value = String(textureTuneState.highlights);
        syncSliderTooltip(textureTuneHighlightsSlider);
    }
    if (textureTuneHighlightsVal) textureTuneHighlightsVal.textContent = getCenteredLightingReadout(textureTuneHighlightsSlider);

    if (textureTuneShadowsSlider) {
        textureTuneShadowsSlider.value = String(textureTuneState.shadows);
        syncSliderTooltip(textureTuneShadowsSlider);
    }
    if (textureTuneShadowsVal) textureTuneShadowsVal.textContent = getCenteredLightingReadout(textureTuneShadowsSlider);

    if (textureTuneLightSourceSlider) {
        textureTuneLightSourceSlider.value = String(textureTuneState.shadowAzimuth);
        syncSliderTooltip(textureTuneLightSourceSlider);
    }
    if (textureTuneLightSourceVal) textureTuneLightSourceVal.textContent = getCenteredLightingReadout(textureTuneLightSourceSlider);

    if (textureTuneLightLockBox) {
        textureTuneLightLockBox.checked = textureTuneState.lightLock;
    }

    if (textureTuneLightHeightSlider) {
        textureTuneLightHeightSlider.value = String(textureTuneState.shadowHeight);
        syncSliderTooltip(textureTuneLightHeightSlider);
    }
    if (textureTuneLightHeightVal) textureTuneLightHeightVal.textContent = getCenteredLightingReadout(textureTuneLightHeightSlider);

    if (isStandard && textureTuneRoughnessSlider) {
        const s = getSelectedPartSettings();
        setFinishModeUI(getFinishModeFromPartSettings(s));
        textureTuneRoughnessSlider.value = String(finishSliderValueFromPartSettings(s));
        updateFinishSliderVisual();
        if (textureTuneRoughnessVal) {
            textureTuneRoughnessVal.textContent = String(Math.round(clampFinishSliderValue(textureTuneRoughnessSlider.value)));
        }
        syncSliderTooltip(textureTuneRoughnessSlider);
    }

    if (textureTuneMetalnessSlider) {
        textureTuneMetalnessSlider.value = String(textureTuneState.metallicMetalness);
        syncSliderTooltip(textureTuneMetalnessSlider);
    }
    if (textureTuneMetalnessVal) textureTuneMetalnessVal.textContent = `${Math.round(textureTuneState.metallicMetalness)}%`;
}

function getCenteredLightingReadout(slider) {
    if (!slider) return '+0';
    const rawMin = parseFloat(slider.min);
    const rawMax = parseFloat(slider.max);
    const min = Number.isFinite(rawMin) ? rawMin : 0;
    const max = Number.isFinite(rawMax) ? rawMax : 100;
    const snapCountRaw = parseInt(slider.dataset.snapCount, 10);
    const snapCount = Number.isInteger(snapCountRaw) && snapCountRaw >= 3 ? snapCountRaw : 5;
    const step = (max - min) / Math.max(1, snapCount - 1);
    const value = getSliderEffectiveValue(slider);
    const index = Math.max(0, Math.min(snapCount - 1, Math.round((value - min) / Math.max(1e-9, step))));
    const midpoint = (snapCount - 1) / 2;
    const normalized = (index - midpoint) / Math.max(1, midpoint);
    const delta = Math.round(normalized * 100);
    return `${delta >= 0 ? '+' : ''}${delta}`;
}

function updateRangeSliderForMode(mode) {
    if (mode === 'spin') {
        tiltRangeSlider.min = '45';
        tiltRangeSlider.max = '360';
        tiltRangeSlider.step = '45';
        forceSpinRangeDefault();
        const tiltTicksEl = document.getElementById('tiltRangeTicks');
        if (tiltTicksEl) tiltTicksEl.innerHTML = '<span>45°</span><span>360°</span>';
    } else {  // tilt or wobble: tilt-amplitude range
        tiltRangeSlider.min = '10';
        tiltRangeSlider.max = '50';
        tiltRangeSlider.step = '10';
        if (parseFloat(tiltRangeSlider.value) > 50) tiltRangeSlider.value = String(TILT_RANGE_DEFAULT);
        if (parseFloat(tiltRangeSlider.value) < 10) tiltRangeSlider.value = '10';
        const tiltTicksEl = document.getElementById('tiltRangeTicks');
        if (tiltTicksEl) tiltTicksEl.innerHTML = '<span>10°</span><span>50°</span>';
    }
    tiltRangeVal.textContent = tiltRangeSlider.value + '°';
    syncSliderTooltip(tiltRangeSlider);
    const labelText = document.getElementById('tiltRangeLabelText');
    if (labelText) labelText.textContent = 'Range';
    updateTiltRangeReset();
}

function persistCurrentMultipartParts({ immediate = false } = {}) {
    if (!isMultipartModel() || !modelPartFiles || modelPartFiles.length !== modelPartNames.length) return;
    _multipartPersistScheduler.schedule({ immediate });
}

const _multipartPersistScheduler = createMultipartPersistScheduler({
    delayMs: 140,
    onCommit: () => {
        const displayName = getMultipartDisplayName(modelPartNames);
        saveFilesToIDB(modelPartFiles.map((part, idx) => ({
            name: part.name,
            buffer: part.buffer,
            color: modelPartBaseColors[idx] || colorPick.value,
            settings: modelPartSettings[idx] ? { ...modelPartSettings[idx] } : createPartSettings(modelPartBaseColors[idx] || colorPick.value),
        })), displayName);
    },
});

const colorPickPreviewScheduler = createRafPreviewScheduler({
    onFrame: () => {
        applyColorPickPreview();
    },
});

const colorCommitQueue = createDeferredCommitQueue({
    delayMs: 100,
    onFlush: (thumbTargets) => {
        updateShadingThumbs();
        updateColorSwatches();
        persistCurrentMultipartParts({ immediate: true });
        saveSettings();
        if (thumbTargets !== null) queueModelPartThumbsRender(thumbTargets);
    },
});

const modelPresetCommitQueue = createDeferredCommitQueue({
    delayMs: 120,
    onFlush: (thumbTargets) => {
        persistCurrentMultipartParts({ immediate: true });
        if (thumbTargets !== null) queueModelPartThumbsRender(thumbTargets);
        saveSettings();
    },
});

const modelToneCommitQueue = createDeferredCommitQueue({
    delayMs: 120,
    onFlush: (thumbTargets) => {
        if (activeBuildPlatePreset === 'modelcolor') {
            updateBuildPlateMaterial();
            refreshExportPreviewNow();
        }
        updateShadingThumbs();
        updateColorSwatches();
        persistCurrentMultipartParts({ immediate: true });
        saveSettings();
        if (thumbTargets !== null) queueModelPartThumbsRender(thumbTargets);
    },
});

const finishCommitQueue = createDeferredCommitQueue({
    delayMs: 120,
    onFlush: (thumbTargets) => {
        persistCurrentMultipartParts({ immediate: true });
        if (thumbTargets !== null) queueModelPartThumbsRender(thumbTargets);
        saveSettings();
    },
});

function applyColorPickPreview() {
    if (isMultipartModel()) {
        const targets = applyToModelPartEditTargets((partSettings, idx) => {
            partSettings.color = colorPick.value;
            modelPartBaseColors[idx] = colorPick.value;
        });
        scheduleColorCommit(targets);
    } else {
        modelPartBaseColors = [colorPick.value];
        getPartSettings(0).color = colorPick.value;
        scheduleColorCommit(0);
    }

    if (mesh) applyPartColorsToMesh({ buildPlatePreview: activeBuildPlatePreset === 'modelcolor' });
    updateShadeSliderVisual();
    if (activeBgPreset === 'modelcolor') {
        bgPick.value = getModelSyncSourceColor();
        if (isDynamicBg) updateDynamicBg();
        else applyBackgroundFromBaseColor(bgPick.value);
        updateBgShadeSliderVisual();
    }
}

function flushColorPickPreview() {
    colorPickPreviewScheduler.flush();
}

function scheduleColorPickPreview() {
    colorPickPreviewScheduler.schedule();
}

function flushColorCommit() {
    colorCommitQueue.flush();
}

function scheduleColorCommit(thumbTargets = null) {
    colorCommitQueue.schedule(thumbTargets);
}

function flushModelPresetCommit() {
    modelPresetCommitQueue.flush();
}

function scheduleModelPresetCommit(thumbTargets = null) {
    modelPresetCommitQueue.schedule(thumbTargets);
}

function flushModelToneCommit() {
    modelToneCommitQueue.flush();
}

function scheduleModelToneCommit(thumbTargets = null) {
    modelToneCommitQueue.schedule(thumbTargets);
}

function flushFinishCommit() {
    finishCommitQueue.flush();
}

function scheduleFinishCommit(thumbTargets = null) {
    finishCommitQueue.schedule(thumbTargets);
}

colorPick.addEventListener('input', (ev) => {
    scheduleColorPickPreview();
});
colorPick.addEventListener('change', () => {
    flushColorPickPreview();
    flushColorCommit();
    flushModelPresetCommit();
});
if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
        const toneVal = Math.round(getSliderEffectiveValue(opacitySlider));
        opacityVal.textContent = (toneVal >= 0 ? '+' : '') + toneVal;
        syncSliderTooltip(opacitySlider);
        const targets = applyToModelPartEditTargets((partSettings) => {
            partSettings.tone = toneVal;
        });
        if (mesh) applyPartColorsToMesh({ buildPlatePreview: activeBuildPlatePreset === 'modelcolor' });
        if (activeBgPreset === 'modelcolor') {
            const syncColor = getModelSyncSourceColor();
            bgPick.value = syncColor;
            updateAutoBgShadeControlVisibility();
            if (isDynamicBg) updateDynamicBg();
            else applyBackgroundFromBaseColor(syncColor);
            updateBgShadeSliderVisual();
        }
        updateShadeSliderVisual();
        scheduleModelToneCommit(targets);
    });
    opacitySlider.addEventListener('change', () => {
        flushModelToneCommit();
    });
}

if (bgOpacitySlider) {
    bgOpacitySlider.addEventListener('input', () => {
        const bgTone = Math.round(getSliderEffectiveValue(bgOpacitySlider));
        if (!isDynamicBg) lastManualBgShade = bgTone;
        document.getElementById('bgOpacityVal').textContent = (bgTone >= 0 ? '+' : '') + bgTone;
        syncSliderTooltip(bgOpacitySlider);
        updateBgShadeSliderVisual();

        const baseHex = getActiveBackgroundBaseColor();
        const c = computeSurfaceShadeColor(baseHex, bgTone);
        if (renderer) renderer.setClearColor(c, 1);
        updateBuildPlateMaterial();
        if (isDynamicBg) updateDynamicBg();
        saveSettings();
    });
    bgOpacitySlider.addEventListener('change', () => {
        saveSettings();
    });
}


bgPick.addEventListener('input', () => {
    scene.background = null;

    {
        const tone = bgOpacitySlider ? Math.round(getSliderEffectiveValue(bgOpacitySlider)) : 0;
        const baseHex = getActiveBackgroundBaseColor();
        const c = computeSurfaceShadeColor(baseHex, tone);
        if (renderer) renderer.setClearColor(c, 1);
    }
    updateBuildPlateMaterial({ skipTextureRefresh: true });
    updateBgShadeSliderVisual();
    if (isDynamicBg) updateDynamicBg();
});

bgPick.addEventListener('change', () => {
    updateBuildPlateMaterial();
    updateBgShadeSliderVisual();
    if (isDynamicBg) updateDynamicBg();
    updateShadingThumbs();
    updateColorSwatches();
    saveSettings();
});

textureTuneBtn?.addEventListener('click', () => {
    const isOpen = !(textureTunePanel?.hidden ?? true);
    setTextureTunePanelOpen(!isOpen);
    if (!isOpen) dismissTextureNewBadge();
    saveSettings();
});

textureTuneLightSlider?.addEventListener('input', () => {
    textureTuneState.light = parseFloat(textureTuneLightSlider.value);
    updateTextureTuneUI();
    applyCurrentTextureTuning();
    saveSettings();
});

textureTuneContrastSlider?.addEventListener('input', () => {
    textureTuneState.contrast = parseFloat(textureTuneContrastSlider.value);
    updateTextureTuneUI();
    applyCurrentTextureTuning();
    saveSettings();
});

textureTuneHighlightsSlider?.addEventListener('input', () => {
    textureTuneState.highlights = parseFloat(textureTuneHighlightsSlider.value);
    updateTextureTuneUI();
    applyCurrentTextureTuning();
    saveSettings();
});

textureTuneShadowsSlider?.addEventListener('input', () => {
    textureTuneState.shadows = parseFloat(textureTuneShadowsSlider.value);
    updateTextureTuneUI();
    applyCurrentTextureTuning();
    saveSettings();
});

textureTuneLightSourceSlider?.addEventListener('input', () => {
    textureTuneState.shadowAzimuth = parseFloat(textureTuneLightSourceSlider.value);
    updateTextureTuneUI();
    if (mesh) updateShadowCatcherPlacement();
    applyCurrentTextureTuning();
    saveSettings();
});

textureTuneLightLockBox?.addEventListener('change', () => {
    textureTuneState.lightLock = !!textureTuneLightLockBox?.checked;
    updateTextureTuneUI();
    syncLightRig();
    if (!isExporting && renderer && scene && camera) renderer.render(scene, camera);
    saveSettings();
});

textureTuneLightHeightSlider?.addEventListener('input', () => {
    textureTuneState.shadowHeight = parseFloat(textureTuneLightHeightSlider.value);
    updateTextureTuneUI();
    if (mesh) updateShadowCatcherPlacement();
    applyCurrentTextureTuning();
    saveSettings();
});

textureTuneRoughnessSlider?.addEventListener('input', () => {
    syncSliderTooltip(textureTuneRoughnessSlider);
    updateFinishSliderVisual();
    const { targets } = applyFinishControlsToSelectedPart();
    applyCurrentTextureTuning();
    scheduleFinishCommit(targets);
});

textureTuneRoughnessSlider?.addEventListener('change', () => {
    updateFinishSliderVisual();
    const { targets } = applyFinishControlsToSelectedPart(true);
    applyCurrentTextureTuning();
    scheduleFinishCommit(targets);
    flushFinishCommit();
});

finishModeButtons.forEach((btn) => btn.addEventListener('click', () => {
    const mode = btn.dataset.finishMode || 'satin';
    if (textureTuneRoughnessSlider) {
        textureTuneRoughnessSlider.value = String(modeStrengthToFinishSliderValue(mode, 2));
    }
    syncSliderTooltip(textureTuneRoughnessSlider);
    updateFinishSliderVisual();
    const { targets } = applyFinishControlsToSelectedPart(true);
    applyCurrentTextureTuning();
    scheduleFinishCommit(targets);
    flushFinishCommit();
}));

textureTuneMetalnessSlider?.addEventListener('input', () => {
    const targets = applyToModelPartEditTargets((partSettings) => {
        partSettings.metallicMetalness = parseFloat(textureTuneMetalnessSlider.value);
    });
    syncUIFromSelectedPart();
    updateTextureTuneUI();
    applyCurrentTextureTuning();
    persistCurrentMultipartParts();
    queueModelPartThumbsRender(targets);
    saveSettings();
});

shadingEl.addEventListener('change', () => {
    if (shadingEl.value === 'flat' || shadingEl.value === 'toon') shadingEl.value = 'matte';
    const targets = applyToModelPartEditTargets((partSettings) => {
        clearStoredFinishState(partSettings);
        partSettings.shading = shadingEl.value;
        partSettings.materialFamily = getMaterialFamilyFromShading(shadingEl.value);
    });
    updateTextureTuneUI();
    if (mesh) rebuildMeshMaterialsForCurrentShading();
    persistCurrentMultipartParts({ immediate: true });
    queueModelPartThumbsRender(targets);
    saveSettings();
});

document.querySelectorAll('#gifLoop, #gifDither').forEach(el =>
    el.addEventListener('change', saveSettings)
);

const EXPORT_QUALITY_ORDER = ['web', 'std', 'high'];
const EXPORT_QUALITY_LABELS = {
    web: 'Low',
    std: 'Medium',
    high: 'High',
};

function syncExportQualitySliderFromSelect() {
    const q = document.getElementById('exportQuality');
    if (!q) return;
    const value = EXPORT_QUALITY_ORDER.includes(q.value) ? q.value : 'std';
    const idx = Math.max(0, EXPORT_QUALITY_ORDER.indexOf(value));
    if (exportQualitySliderEl) {
        exportQualitySliderEl.value = String(idx);
        syncSliderTooltip(exportQualitySliderEl);
    }
    if (exportQualityValEl) exportQualityValEl.textContent = EXPORT_QUALITY_LABELS[value] || 'Medium';
}

function setExportQualityValue(value) {
    const q = document.getElementById('exportQuality');
    if (!q) return;
    q.value = EXPORT_QUALITY_ORDER.includes(value) ? value : 'std';
    syncExportQualitySliderFromSelect();
}

syncExportQualitySliderFromSelect();

if (exportGridEl) {
    exportGridEl.checked = rulerLinesVisible;
}
if (exportBuildPlateEl) {
    exportBuildPlateEl.checked = buildPlateEnabled;
}

document.getElementById('exportQuality')?.addEventListener('change', () => {
    syncExportQualitySliderFromSelect();
    updateEstimate();
    refreshExportPreviewNow();
    saveSettings();
});

exportQualitySliderEl?.addEventListener('input', () => {
    const idx = Math.max(0, Math.min(2, Math.round(parseFloat(exportQualitySliderEl.value) || 1)));
    setExportQualityValue(EXPORT_QUALITY_ORDER[idx]);
    updateEstimate();
    refreshExportPreviewNow();
    saveSettings();
});

exportGridEl?.addEventListener('change', () => {
    const on = !!exportGridEl.checked;
    rulerLinesVisible = on;
    if (rulerToggleEl) rulerToggleEl.checked = on;
    updateRulerHUD();
    updateLiveRulerOverlay();
    refreshExportPreviewNow();
    saveSettings();
});
exportBuildPlateEl?.addEventListener('change', () => {
    const on = !!exportBuildPlateEl.checked;
    buildPlateEnabled = on;
    if (buildPlateToggleEl) buildPlateToggleEl.checked = on;
    updateBuildPlateMaterial();
    applyTextureLighting();
    updateShadowCatcherPlacement();
    refreshExportPreviewNow();
    saveSettings();
});
exportDimensionInputs.forEach(input => {
    input.addEventListener('change', () => {
        if (!input.checked) return;
        if (exportFrameEnabled) syncExportCameraFromViewport();
        updateCropDimensionsDock();
        updateEstimate();
        refreshExportPreviewNow();
        saveSettings();
    });
});

// ── Export format switcher ────────────────────────────────────────────────────
const FORMAT_LABELS = {
    gif: 'Export GIF',
    mp4: 'Export MP4',
    png: 'Export PNG',
    jpg: 'Export JPEG',
};
const FORMAT_SHORT_LABELS = {
    gif: 'Export GIF',
    mp4: 'Export MP4',
    png: 'Export PNG',
    jpg: 'Export JPEG',
};
const FORMAT_BTNS = { gif: 'btnExportGif', mp4: 'btnExportVideo', png: 'btnExportPng', jpg: 'btnExportJpeg' };

const EXPORT_OPTION_VISIBILITY = {
    gif: {
        gifLoop: true,
        gifDither: true,
        exportBgColor: true,
        exportGrid: true,
        exportBuildPlate: true,
    },
    mp4: {
        gifLoop: false,
        gifDither: false,
        exportBgColor: true,
        exportGrid: true,
        exportBuildPlate: true,
    },
    png: {
        gifLoop: false,
        gifDither: false,
        exportBgColor: true,
        exportGrid: true,
        exportBuildPlate: true,
    },
    jpg: {
        gifLoop: false,
        gifDither: false,
        exportBgColor: true,
        exportGrid: true,
        exportBuildPlate: true,
    },
};

function setExportQuickOptionVisible(inputId, visible) {
    const input = document.getElementById(inputId);
    const label = input?.closest('.gif-option-check');
    if (!input || !label) return;
    label.hidden = !visible;
    input.disabled = !visible;
}

function applyExportQuickOptionsForFormat(fmt) {
    const vis = EXPORT_OPTION_VISIBILITY[fmt] || EXPORT_OPTION_VISIBILITY.gif;
    Object.keys(EXPORT_OPTION_VISIBILITY.gif).forEach((inputId) => {
        setExportQuickOptionVisible(inputId, !!vis[inputId]);
    });
}

function handleExportFormatAutoPause(fmt) {
    const isStill = fmt === 'png' || fmt === 'jpg';
    const isAnimated = fmt === 'gif' || fmt === 'mp4';

    if (isStill) {
        if (_pausedBeforeStillExport === null) _pausedBeforeStillExport = isPaused;
        if (!isPaused) togglePause();
        return;
    }

    if (isAnimated && _pausedBeforeStillExport !== null) {
        const wasPaused = _pausedBeforeStillExport;
        _pausedBeforeStillExport = null;
        if (isPaused !== wasPaused) togglePause();
    }
}

function updateExportActionLabels(fmt = exportFormatEl?.value ?? exportFormatCollapsedEl?.value ?? 'gif') {
    updateExportActionLabelsController(fmt, {
        exportPanelEl,
        btnExportLabel,
        btnExportCollapsedLabel,
        formatShortLabels: FORMAT_SHORT_LABELS,
        formatLabels: FORMAT_LABELS,
    });
}

function syncExportFormatTabs(fmt) {
    syncExportFormatTabsController(fmt, {
        exportFormatTabEls,
    });
}

function applyExportFormat(fmt) {
    applyExportFormatController(fmt, {
        exportFormatEl,
        exportMiniFormatEl,
        exportFormatCollapsedEl,
        forEachExportFormatOpts: (cb) => {
            document.querySelectorAll('.export-format-opts').forEach(cb);
        },
        getExportOptsEl: (formatId) => document.getElementById(`exportOpts-${formatId}`),
        applyExportQuickOptionsForFormat,
        handleExportFormatAutoPause,
        exportMotionControlsEl,
        updateCropDimensionsDock,
        updateExportActionLabels,
        syncExportFormatTabs,
        updateEstimate,
        refreshExportPreviewNow,
        queueDesktopV2RailLayoutSync,
    });
}

bindExportFormatTabHandlersController({
    exportFormatTabEls,
    onApply: applyExportFormat,
    onSave: saveSettings,
});

function applyExportPanelState(collapsed) {
    if (!exportPanelEl || !exportPanelBodyEl) return;

    // Export in overlay mode always stays expanded.
    exportPanelEl.classList.remove('is-collapsed');
    exportPanelBodyEl.hidden = false;
    if (btnToggleExportPanel) btnToggleExportPanel.setAttribute('aria-expanded', 'true');
    if (exportPanelCollapsedBarEl) {
        exportPanelCollapsedBarEl.hidden = true;
        exportPanelCollapsedBarEl.setAttribute('aria-hidden', 'true');
    }

    updateExportActionLabels();
    refreshExportPreviewNow();
    queueDesktopV2RailLayoutSync();
}

bindExportFormatSelectChangeHandlersController({
    exportFormatEl,
    exportMiniFormatEl,
    exportFormatCollapsedEl,
    onApply: applyExportFormat,
    onSave: saveSettings,
});

bindExportPreviewDetailsToggleController({
    previewDetailsEl: document.getElementById('exportPreviewDetails'),
    onRefreshPreview: refreshExportPreviewNow,
    onQueueRailLayoutSync: queueDesktopV2RailLayoutSync,
});

btnToggleExportPanel?.addEventListener('click', () => {
    handleExportPanelToggleController({
        exportPanelEl,
        applyExportPanelState,
        persistExportPanelCollapsedState: (collapsed) => {
            persistExportPanelCollapsedStateController(collapsed);
        },
    });
});

function renderCollapsedExportSummary(fmt) {
    renderCollapsedExportSummaryController(fmt, {
        summaryEl: exportCollapsedConfirmSummaryEl,
        exportQualityOrder: EXPORT_QUALITY_ORDER,
        exportQualityLabels: EXPORT_QUALITY_LABELS,
        speedSecondsPerRev: SPEED_SECONDS_PER_REV,
        speedDefault: SPEED_DEFAULT,
        speedSlider,
        exportGridEl,
        exportBuildPlateEl,
        exportBgColorEl,
        buildPlateEnabled,
        applyExportFormat,
        saveSettings,
        setExportQualityValue,
        updateEstimate,
        refreshExportPreviewNow,
        getExportFormatForDurationLabels,
        formatRotationTimeOptionLabel,
    });
}

function closeCollapsedExportConfirm(shouldContinue) {
    collapsedExportConfirmController.close(shouldContinue);
}

function promptCollapsedExportConfirm(fmt) {
    if (!exportCollapsedConfirmOverlayEl || !exportCollapsedConfirmEnabled) return Promise.resolve(true);
    renderCollapsedExportSummary(fmt);
    if (exportCollapsedDontShowEl) exportCollapsedDontShowEl.checked = false;
    return collapsedExportConfirmController.open();
}

function setUploadChoiceStepState(hasFiles) {
    uploadChoiceUiController.setStepState(hasFiles);
}

function syncUploadChoicePromptText() {
    uploadChoiceUiController.syncPromptText();
}

function renderUploadChoiceFileList() {
    uploadChoiceUiController.renderFileList();
}

function setUploadChoiceFiles(fileList) {
    uploadChoiceUiController.setFiles(fileList);
}

function closeUploadChoicePrompt(action = 'cancel') {
    if (uploadChoiceOverlayEl) uploadChoiceOverlayEl.hidden = true;
    uploadChoiceDropZoneEl?.classList.remove('is-dragover');
    setUploadChoiceFiles([]);
    uploadActionController.resolvePrompt(action);
}

function promptUploadChoice(files) {
    if (!mesh) return Promise.resolve('newplate');
    if (!uploadChoiceOverlayEl) return Promise.resolve(uploadDefaultAction || 'newplate');

    setUploadChoiceFiles(files);
    syncUploadChoicePromptText();
    uploadChoiceDropZoneEl?.classList.remove('is-dragover');
    uploadChoiceOverlayEl.hidden = false;

    return uploadActionController.beginPrompt();
}

function resetAllWarnings() {
    exportCollapsedConfirmEnabled = true;
    uploadChoicePromptEnabled = true;
    uploadDefaultAction = 'newplate';

    saveSettings();
    setStatus('Warning dialogs reset.');
    setTimeout(() => setStatus(''), 1800);
}

async function resetEverything() {
    await resetSettingsOnly();
}

function clearRotaterLocalSettings() {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (key.startsWith('rotater') || key === SETTINGS_KEY) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => {
            try { localStorage.removeItem(key); } catch (_) { }
        });
    } catch (_) { }
}

async function resetSettingsOnly() {
    const ok = confirm(
        'Reset settings?\n\nThis clears saved Rotater settings (including lighting effects and animation) and reloads the app. Your STL/project files stay on the build plate.'
    );
    if (!ok) return;

    suppressSave = true;
    clearRotaterLocalSettings();

    try { localStorage.setItem('rotater_hasSession', '1'); } catch (_) { }
    try {
        history.replaceState({}, '', location.pathname);
    } catch (_) { }

    setStatus('Settings reset. Reloading...');
    setTimeout(() => {
        location.reload();
    }, 120);
}

async function triggerExportWithAssist(fmt) {
    const format = fmt || exportFormatEl?.value || exportFormatCollapsedEl?.value || 'gif';
    const isCollapsed = !!exportPanelEl?.classList.contains('is-collapsed');

    if (isCollapsed && autoUIAssistEnabled) {
        applyExportFormat(format);
        applyExportPanelState(false);
        persistExportPanelCollapsedStateController(false);

        const proceed = await promptCollapsedExportConfirm(format);
        if (!proceed) return;
        if (exportCollapsedDontShowEl?.checked) {
            exportCollapsedConfirmEnabled = false;
            saveSettings();
        }
    }

    const effectiveFormat = exportFormatEl?.value || exportFormatCollapsedEl?.value || format;
    document.getElementById(FORMAT_BTNS[effectiveFormat])?.click();
}

document.getElementById('btnExport')?.addEventListener('click', async () => {
    const fmt = exportFormatEl?.value ?? 'gif';
    await triggerExportWithAssist(fmt);
});

document.getElementById('btnMiniExport')?.addEventListener('click', async () => {
    const fmt = exportMiniFormatEl?.value ?? exportFormatEl?.value ?? 'gif';
    await triggerExportWithAssist(fmt);
});

document.getElementById('btnExportCollapsed')?.addEventListener('click', async () => {
    const fmt = exportFormatCollapsedEl?.value ?? exportFormatEl?.value ?? 'gif';
    await triggerExportWithAssist(fmt);
});

window.addEventListener('resize', () => updateExportActionLabels());

// exportBgColor checkbox is canonical in UI; transparent inputs are kept for compatibility
function syncTransparentCheckboxes(sourceId = 'exportBgColor') {
    syncTransparentCheckboxesController(sourceId, {
        transparentEl: document.getElementById('exportTransparent'),
        transparentPngEl: document.getElementById('exportTransparentPng'),
        bgToggleEl: document.getElementById('exportBgColor'),
        exportPreviewWrapEl: document.querySelector('.export-preview-wrap'),
        updateExportWorkspaceTransparencyPattern,
        updateEstimate,
        saveSettings,
        refreshExportPreviewNow,
    });
}
document.getElementById('exportBgColor')?.addEventListener('change', () => syncTransparentCheckboxes('exportBgColor'));
document.getElementById('exportTransparent')?.addEventListener('change', () => syncTransparentCheckboxes('exportTransparent'));
document.getElementById('exportTransparentPng')?.addEventListener('change', () => syncTransparentCheckboxes('exportTransparentPng'));
document.getElementById('jpegQuality').addEventListener('input', function () {
    document.getElementById('jpegQualityVal').textContent = this.value + '%';
    updateEstimate();
    refreshExportPreviewNow();
    saveSettings();
});

if (exportMotionModeEl) {
    exportMotionModeEl.addEventListener('change', () => {
        rotateModeEl.value = exportMotionModeEl.value;
        document.querySelector(`input[name="rotateMode"][value="${exportMotionModeEl.value}"]`)?.dispatchEvent(new Event('change'));
    });
}

if (exportMotionSpeedEl) {
    exportMotionSpeedEl.addEventListener('change', () => {
        speedSlider.value = exportMotionSpeedEl.value;
        speedSlider.dispatchEvent(new Event('change'));
    });
}

if (exportMotionRangeEl) {
    exportMotionRangeEl.addEventListener('input', () => {
        const mode = rotateModeEl.value || 'spin';
        if (mode === 'wobble') {
            wobbleSpinRangeSlider.value = exportMotionRangeEl.value;
            wobbleSpinRangeSlider.dispatchEvent(new Event('input'));
        } else {
            tiltRangeSlider.value = exportMotionRangeEl.value;
            tiltRangeSlider.dispatchEvent(new Event('input'));
        }
    });
}

rotateModeEl.addEventListener('change', () => {
    const m = rotateModeEl.value;
    const previousMode = lastRotateMode;

    if (previousMode === 'tilt') rememberedTiltRange = normalizeTiltRangeValue(tiltRangeSlider.value);

    if (m === 'spin') {
        forceSpinRangeDefault();
    } else if (m === 'tilt') {
        tiltRangeSlider.value = String(rememberedTiltRange);
    }

    lastRotateMode = m;

    // switching mode resumes rotation unless inspect/select mode is locking pause
    if (isPaused) {
        setPauseState(false, false, false);
    }
    // Restore mesh to neutral when leaving tilt/wobble modes
    if (m !== 'tilt' && m !== 'wobble' && mesh) {
        tiltBaseMeshRx = -Math.PI / 2;
        mesh.rotation.x = tiltBaseMeshRx;
    }
    tiltPhase = 0;
    if ((m === 'spin' || m === 'wobble') && camera) {
        swingBaseAz = getOrbitFrameState().az;
        swingLastAz = swingBaseAz;
    }
    if ((m === 'tilt' || m === 'wobble') && mesh) {
        tiltBaseMeshRx = -Math.PI / 2;
        mesh.rotation.x = tiltBaseMeshRx;
    }
    if (controls) controls.autoRotate = !isPaused && (m === 'spin' || (m === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360));
    document.documentElement.classList.toggle('tilt-mode', m === 'tilt' || m === 'spin' || m === 'wobble');
    document.documentElement.classList.toggle('wobble-mode', m === 'wobble');
    if (m === 'tilt' || m === 'spin' || m === 'wobble') updateRangeSliderForMode(m);
    if (m === 'spin') forceSpinRangeDefault();
    ensurePausedForInteractionMode();
    syncExportMotionControlsFromMain();
    saveSettings();
});

tiltRangeSlider.addEventListener('input', () => {
    tiltRangeVal.textContent = tiltRangeSlider.value + '°';
    syncSliderTooltip(tiltRangeSlider);
    if (rotateModeEl.value === 'tilt') rememberedTiltRange = normalizeTiltRangeValue(tiltRangeSlider.value);
    updateTiltRangeReset();
    syncExportMotionControlsFromMain();
    saveSettings();
});

wobbleSpinRangeSlider.addEventListener('input', () => {
    wobbleSpinRangeVal.textContent = wobbleSpinRangeSlider.value + '°';
    syncSliderTooltip(wobbleSpinRangeSlider);
    wobbleSpinRangeResetBtn.classList.toggle('is-changed', parseFloat(wobbleSpinRangeSlider.value) !== WOBBLE_SPIN_RANGE_DEFAULT);
    if (rotateModeEl.value === 'wobble' && controls) {
        const fullSpin = parseFloat(wobbleSpinRangeSlider.value) >= 360;
        controls.autoRotate = !isPaused && fullSpin;
        if (camera) {
            swingBaseAz = Math.atan2(camera.position.x, camera.position.z);
            swingLastAz = swingBaseAz;
        }
    }
    syncExportMotionControlsFromMain();
    saveSettings();
});

tiltRangeResetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const def = rotateModeEl.value === 'spin' ? SPIN_RANGE_DEFAULT : TILT_RANGE_DEFAULT;
    tiltRangeSlider.value = def;
    tiltRangeSlider.dispatchEvent(new Event('input'));
});

wobbleSpinRangeResetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    wobbleSpinRangeSlider.value = WOBBLE_SPIN_RANGE_DEFAULT;
    wobbleSpinRangeSlider.dispatchEvent(new Event('input'));
});

function midpointForRangeInput(input) {
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const step = parseFloat(input.step) || 1;
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return input.value;
    const midpoint = (min + max) / 2;
    const snapped = min + Math.round((midpoint - min) / step) * step;
    return String(Math.max(min, Math.min(max, snapped)));
}

function resetCardSlidersToMiddle(sliderIds) {
    sliderIds.forEach((id) => {
        const input = document.getElementById(id);
        if (!(input instanceof HTMLInputElement) || input.type !== 'range') return;
        input.value = midpointForRangeInput(input);
        input.dispatchEvent(new Event('input'));
    });
}

const CARD_RESET_LIGHTING_SLIDERS = [
    'textureTuneShadows',
    'textureTuneLightSource',
    'textureTuneLight',
    'textureTuneLightHeight',
    'textureTuneContrast',
    'textureTuneHighlights',
];

const CARD_RESET_ANIMATION_SLIDERS = [
    'tiltRangeSlider',
    'wobbleSpinRangeSlider',
];

function animationSlidersMatchDefaults() {
    return parseFloat(tiltRangeSlider?.value || String(SPIN_RANGE_DEFAULT)) === SPIN_RANGE_DEFAULT
        && parseFloat(wobbleSpinRangeSlider?.value || String(WOBBLE_SPIN_RANGE_DEFAULT)) === WOBBLE_SPIN_RANGE_DEFAULT;
}

function sliderMatchesResetMidpoint(id) {
    const input = document.getElementById(id);
    if (!(input instanceof HTMLInputElement) || input.type !== 'range') return true;
    return String(input.value) === String(midpointForRangeInput(input));
}

function getVisualResetPartSettings(index) {
    const defaults = getModelResetDefaultsFromFirstTimeState();
    return {
        color: defaults.color,
        tone: defaults.tone,
        shading: defaults.shading,
        hidden: false,
        metallicRoughness: defaults.metallicRoughness,
        metallicMetalness: defaults.metallicMetalness,
        metallicReflection: defaults.metallicReflection,
        phongRoughness: defaults.phongRoughness,
        phongReflection: defaults.phongReflection,
        matteRoughness: defaults.matteRoughness,
        matteReflection: defaults.matteReflection,
    };
}

let _cachedModelResetDefaults = null;

function getModelResetDefaultsFromFirstTimeState() {
    if (_cachedModelResetDefaults) return _cachedModelResetDefaults;

    const clamp = (value, min, max, fallback) => {
        const n = parseFloat(value);
        return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
    };

    const defaultSearchStr = typeof DEFAULT_SETTINGS_URL !== 'undefined' && DEFAULT_SETTINGS_URL.includes('?')
        ? '?' + DEFAULT_SETTINGS_URL.split('?')[1]
        : '';
    const s = defaultSearchStr ? (getURLSettings(defaultSearchStr) || {}) : {};

    _cachedModelResetDefaults = {
        color: (typeof s.color === 'string' && /^#[0-9a-f]{6}$/i.test(s.color)) ? s.color : '#b4aed6',
        tone: clamp(s.tone, -100, 100, 0),
        shading: (s.shading === 'phong' || s.shading === 'matte' || s.shading === 'metallic' || s.shading === 'clear' || s.shading === 'glass')
            ? s.shading
            : 'phong',
        metallicRoughness: clamp(s.textureTuneMetallicRoughness, 0, 100, TEXTURE_TUNE_DEFAULTS.metallicRoughness),
        metallicMetalness: clamp(s.textureTuneMetallicMetalness, 0, 100, TEXTURE_TUNE_DEFAULTS.metallicMetalness),
        metallicReflection: clamp(s.textureTuneMetallicReflection, 0, 200, TEXTURE_TUNE_DEFAULTS.metallicReflection),
        phongRoughness: clamp(s.textureTunePhongRoughness, 0, 100, TEXTURE_TUNE_DEFAULTS.phongRoughness),
        phongReflection: clamp(s.textureTunePhongReflection, 0, 200, TEXTURE_TUNE_DEFAULTS.phongReflection),
        matteRoughness: clamp(s.textureTuneMatteRoughness, 0, 100, TEXTURE_TUNE_DEFAULTS.matteRoughness),
        matteReflection: clamp(s.textureTuneMatteReflection, 0, 200, TEXTURE_TUNE_DEFAULTS.matteReflection),
        activeModelPreset: (typeof s.activeModelPreset === 'string' && s.activeModelPreset.trim()) ? s.activeModelPreset.trim() : 'custom',
    };

    return _cachedModelResetDefaults;
}

function setCardResetButtonState(button, isDirty) {
    if (!button) return;
    button.disabled = !isDirty;
    button.classList.toggle('is-active', isDirty);
    button.setAttribute('aria-disabled', isDirty ? 'false' : 'true');
}

let _cardResetStateRaf = 0;
function scheduleCardResetButtonStatesUpdate() {
    if (_cardResetStateRaf) return;
    _cardResetStateRaf = requestAnimationFrame(() => {
        _cardResetStateRaf = 0;
        updateCardResetButtonStates();
    });
}

function updateCardResetButtonStates() {
    const modelDirty = getModelPartEditTargetIndices().some((idx) => {
        const partSettings = getPartSettings(idx);
        const defaults = getVisualResetPartSettings(idx);
        return (
            partSettings.color !== defaults.color
            || (partSettings.tone ?? 0) !== defaults.tone
            || (partSettings.shading || 'phong') !== defaults.shading
            || partSettings.hidden === true
            || Number(partSettings.metallicRoughness) !== defaults.metallicRoughness
            || Number(partSettings.metallicMetalness) !== defaults.metallicMetalness
            || Number(partSettings.metallicReflection) !== defaults.metallicReflection
            || Number(partSettings.phongRoughness) !== defaults.phongRoughness
            || Number(partSettings.phongReflection) !== defaults.phongReflection
            || Number(partSettings.matteRoughness) !== defaults.matteRoughness
            || Number(partSettings.matteReflection) !== defaults.matteReflection
        );
    });

    const bgAutoOn = !!(document.getElementById('autoBgCheck')?.checked ?? isDynamicBg);
    const bgShadeValue = parseInt(String(bgOpacitySlider?.value || AUTO_BRIGHTNESS_RULES.background.shade), 10) || 0;
    const backgroundDirty = (activeBgPreset || 'modelcolor') !== 'modelcolor'
        || bgSyncPartIndex !== 0
        || !bgAutoOn
        || (!bgAutoOn && bgShadeValue !== AUTO_BRIGHTNESS_RULES.background.shade);

    const rulerToggle = document.getElementById('rulerToggle');
    const normalizedPlateColor = String(buildPlateColor || '').toLowerCase();
    const buildPlateDirty = !!(rulerToggle && !rulerToggle.checked)
        || !!(buildPlateToggleEl && !buildPlateToggleEl.checked)
        || (activeBuildPlatePreset || 'modelcolor') !== 'modelcolor'
        || !buildPlateAutoBrightnessEnabled
        || normalizedPlateColor !== ''
        || (!buildPlateAutoBrightnessEnabled && (parseInt(String(buildPlateShade), 10) || 0) !== BUILD_PLATE_DEFAULTS.shade)
        || (buildPlateShape || BUILD_PLATE_DEFAULTS.shape) !== BUILD_PLATE_DEFAULTS.shape;

    const lightingSliderDefaults = {
        textureTuneShadows: TEXTURE_TUNE_DEFAULTS.shadows,
        textureTuneLightSource: TEXTURE_TUNE_DEFAULTS.shadowAzimuth,
        textureTuneLight: TEXTURE_TUNE_DEFAULTS.light,
        textureTuneLightHeight: TEXTURE_TUNE_DEFAULTS.shadowHeight,
        textureTuneContrast: TEXTURE_TUNE_DEFAULTS.contrast,
        textureTuneHighlights: TEXTURE_TUNE_DEFAULTS.highlights,
    };
    const lightingDirty = CARD_RESET_LIGHTING_SLIDERS.some((id) => {
        const input = document.getElementById(id);
        if (!(input instanceof HTMLInputElement) || input.type !== 'range') return false;
        return parseFloat(input.value) !== lightingSliderDefaults[id];
    }) || textureTuneState.lightLock !== TEXTURE_TUNE_DEFAULTS.lightLock;

    const speedValue = parseInt(speedSlider?.value || String(SPEED_DEFAULT), 10);
    const animationDirty = speedValue !== SPEED_DEFAULT
        || (rotateModeEl?.value || 'spin') !== 'spin'
        || !animationSlidersMatchDefaults();

    const exportDirty = (exportFormatEl?.value || 'gif') !== 'gif'
        || (document.getElementById('exportQuality')?.value || 'std') !== 'std'
        || !!(document.getElementById('gifLoop') && !document.getElementById('gifLoop').checked)
        || !!document.getElementById('gifDither')?.checked
        || !!(exportBgColorEl && !exportBgColorEl.checked)
        || !!(exportGridEl && !exportGridEl.checked)
        || !!(exportBuildPlateEl && !exportBuildPlateEl.checked)
        || (exportMotionModeEl?.value || 'spin') !== 'spin'
        || parseInt(exportMotionSpeedEl?.value || String(SPEED_DEFAULT), 10) !== SPEED_DEFAULT
        || parseInt(exportMotionRangeEl?.value || '360', 10) !== 360
        || parseInt(document.getElementById('jpegQuality')?.value || '90', 10) !== 90;

    setCardResetButtonState(btnResetModelCard, modelDirty);
    setCardResetButtonState(btnResetBackgroundCard, backgroundDirty);
    setCardResetButtonState(btnResetBuildPlateCard, buildPlateDirty);
    setCardResetButtonState(btnResetLightingCard, lightingDirty);
    setCardResetButtonState(btnResetAnimationCard, animationDirty);
    setCardResetButtonState(btnResetExportCard, exportDirty);
}

btnResetModelCard?.addEventListener('click', () => {
    const targets = getModelPartEditTargetIndices();
    if (!targets.length) return;

    const changed = targets.some((idx) => {
        const partSettings = getPartSettings(idx);
        const defaults = getVisualResetPartSettings(idx);
        return (
            partSettings.color !== defaults.color
            || (partSettings.tone ?? 0) !== defaults.tone
            || (partSettings.shading || 'phong') !== defaults.shading
            || partSettings.hidden === true
            || Number(partSettings.metallicRoughness) !== defaults.metallicRoughness
            || Number(partSettings.metallicMetalness) !== defaults.metallicMetalness
            || Number(partSettings.metallicReflection) !== defaults.metallicReflection
            || Number(partSettings.phongRoughness) !== defaults.phongRoughness
            || Number(partSettings.phongReflection) !== defaults.phongReflection
            || Number(partSettings.matteRoughness) !== defaults.matteRoughness
            || Number(partSettings.matteReflection) !== defaults.matteReflection
        );
    });
    if (!changed) return;

    targets.forEach((idx) => {
        const partSettings = getPartSettings(idx);
        const defaults = getVisualResetPartSettings(idx);
        Object.assign(partSettings, defaults);
        modelPartBaseColors[idx] = defaults.color;
        if (customModelSettingsByPart && typeof customModelSettingsByPart === 'object') {
            customModelSettingsByPart[idx] = { ...partSettings };
        }
    });

    activeModelPreset = getModelResetDefaultsFromFirstTimeState().activeModelPreset;
    syncUIFromSelectedPart();
    rebuildMeshMaterialsForCurrentShading();
    applyPartColorsToMesh();
    applyCurrentTextureTuning();

    if (activeBgPreset === 'modelcolor') {
        const syncColor = getModelSyncSourceColor();
        bgPick.value = syncColor;
        if (isDynamicBg) updateDynamicBg();
        else applyBackgroundFromBaseColor(syncColor);
    }

    renderModelPresets();
    if (activeBuildPlatePreset === 'modelcolor') updateBuildPlateSelection();
    queueModelPartThumbsRender(targets);
    persistCurrentMultipartParts({ immediate: true });
    saveSettings();
    updateCardResetButtonStates();
});

btnResetBackgroundCard?.addEventListener('click', () => {
    activeBgPreset = 'modelcolor';
    lastNonModelBgPreset = 'custom';
    bgSyncPartIndex = 0;
    isDynamicBg = true;
    const autoBgCheck = document.getElementById('autoBgCheck');
    if (autoBgCheck) autoBgCheck.checked = true;
    if (bgOpacitySlider) {
        bgOpacitySlider.value = String(AUTO_BRIGHTNESS_RULES.background.shade);
        bgOpacitySlider.dispatchEvent(new Event('input', { bubbles: true }));
    }
    bgPick.value = getModelSyncSourceColor();
    updateDynamicBg();
    updateBgSelection();
    syncBgModelSyncSourceUI();
    if (bgModelSyncSelectorThumb) {
        paintThumbFallback(bgModelSyncSelectorThumb, bgSyncPartIndex);
        renderSinglePartThumbnail(bgModelSyncSelectorThumb, bgSyncPartIndex);
    }
    queueModelPartThumbsRender([bgSyncPartIndex]);
    saveSettings();
    updateCardResetButtonStates();
});

btnResetBuildPlateCard?.addEventListener('click', () => {
    const gridToggle = document.getElementById('rulerToggle');
    if (gridToggle) {
        gridToggle.checked = true;
        gridToggle.dispatchEvent(new Event('change'));
    }
    if (buildPlateToggleEl) {
        buildPlateToggleEl.checked = true;
        buildPlateToggleEl.dispatchEvent(new Event('change'));
    }
    activeBuildPlatePreset = 'modelcolor';
    lastNonModelBuildPlatePreset = 'custom';
    buildPlateSyncPartIndex = 0;
    buildPlateAutoBrightnessEnabled = true;
    if (buildPlateAutoBrightnessEl) buildPlateAutoBrightnessEl.checked = true;
    buildPlateColor = null;
    buildPlateShade = AUTO_BRIGHTNESS_RULES.buildPlate.shade;
    buildPlateFinish = BUILD_PLATE_DEFAULTS.finish;
    buildPlateShape = BUILD_PLATE_DEFAULTS.shape;
    buildPlateSizePreset = BUILD_PLATE_DEFAULTS.sizePreset;
    buildPlateWidth = BUILD_PLATE_DEFAULTS.width;
    buildPlateDepth = BUILD_PLATE_DEFAULTS.depth;
    updateBuildPlateMaterial();
    updateBuildPlateSelection();
    refreshExportPreviewNow();
    saveSettings();
    updateCardResetButtonStates();
});

btnResetLightingCard?.addEventListener('click', () => {
    const lightingSliderDefaults = {
        textureTuneShadows: TEXTURE_TUNE_DEFAULTS.shadows,
        textureTuneLightSource: TEXTURE_TUNE_DEFAULTS.shadowAzimuth,
        textureTuneLight: TEXTURE_TUNE_DEFAULTS.light,
        textureTuneLightHeight: TEXTURE_TUNE_DEFAULTS.shadowHeight,
        textureTuneContrast: TEXTURE_TUNE_DEFAULTS.contrast,
        textureTuneHighlights: TEXTURE_TUNE_DEFAULTS.highlights,
    };
    CARD_RESET_LIGHTING_SLIDERS.forEach((id) => {
        const input = document.getElementById(id);
        if (!(input instanceof HTMLInputElement) || input.type !== 'range') return;
        input.value = String(lightingSliderDefaults[id] ?? midpointForRangeInput(input));
        input.dispatchEvent(new Event('input'));
    });
    if (textureTuneLightLockBox) {
        textureTuneLightLockBox.checked = TEXTURE_TUNE_DEFAULTS.lightLock;
        textureTuneLightLockBox.dispatchEvent(new Event('change'));
    }
    updateCardResetButtonStates();
});

btnResetAnimationCard?.addEventListener('click', () => {
    rotateModeEl.value = 'spin';
    document.querySelector('input[name="rotateMode"][value="spin"]')?.dispatchEvent(new Event('change', { bubbles: true }));
    speedSlider.value = String(SPEED_DEFAULT);
    speedSlider.dispatchEvent(new Event('change'));
    tiltRangeSlider.value = String(SPIN_RANGE_DEFAULT);
    tiltRangeSlider.dispatchEvent(new Event('input', { bubbles: true }));
    wobbleSpinRangeSlider.value = String(WOBBLE_SPIN_RANGE_DEFAULT);
    wobbleSpinRangeSlider.dispatchEvent(new Event('input', { bubbles: true }));
    updateCardResetButtonStates();
});

btnResetExportCard?.addEventListener('click', () => {
    exportFormatEl && (exportFormatEl.value = 'gif');
    exportFormatEl?.dispatchEvent(new Event('change'));
    setExportQualityValue('std');
    document.getElementById('gifLoop') && (document.getElementById('gifLoop').checked = true);
    document.getElementById('gifDither') && (document.getElementById('gifDither').checked = false);
    exportBgColorEl && (exportBgColorEl.checked = true);
    exportBgColorEl?.dispatchEvent(new Event('change'));
    exportGridEl && (exportGridEl.checked = true);
    exportGridEl?.dispatchEvent(new Event('change'));
    exportBuildPlateEl && (exportBuildPlateEl.checked = true);
    exportBuildPlateEl?.dispatchEvent(new Event('change'));
    if (exportMotionModeEl) {
        exportMotionModeEl.value = 'spin';
        exportMotionModeEl.dispatchEvent(new Event('change'));
    }
    if (exportMotionSpeedEl) {
        exportMotionSpeedEl.value = String(SPEED_DEFAULT);
        exportMotionSpeedEl.dispatchEvent(new Event('change'));
    }
    if (exportMotionRangeEl) {
        exportMotionRangeEl.value = '360';
        exportMotionRangeEl.dispatchEvent(new Event('input'));
    }
    const jpegQualityEl = document.getElementById('jpegQuality');
    if (jpegQualityEl) {
        jpegQualityEl.value = '90';
        jpegQualityEl.dispatchEvent(new Event('input'));
    }
    syncExportQualitySliderFromSelect();
    updateEstimate();
    refreshExportPreviewNow();
    saveSettings();
    updateCardResetButtonStates();
});

[
    'opacitySlider',
    'textureTuneRoughness',
    'bgOpacitySlider',
    'buildPlateShadeSlider',
    'textureTuneShadows',
    'textureTuneLightSource',
    'textureTuneLight',
    'textureTuneLightHeight',
    'textureTuneContrast',
    'textureTuneHighlights',
    'tiltRangeSlider',
    'wobbleSpinRangeSlider',
    'speedSlider',
].forEach((id) => {
    const input = document.getElementById(id);
    input?.addEventListener('input', scheduleCardResetButtonStatesUpdate);
    input?.addEventListener('change', scheduleCardResetButtonStatesUpdate);
});

document.getElementById('rulerToggle')?.addEventListener('change', scheduleCardResetButtonStatesUpdate);
buildPlateToggleEl?.addEventListener('change', scheduleCardResetButtonStatesUpdate);
buildPlateColorPickerEl?.addEventListener('input', scheduleCardResetButtonStatesUpdate);
buildPlateAutoBrightnessEl?.addEventListener('change', scheduleCardResetButtonStatesUpdate);
[
    'exportFormat',
    'exportFormatCollapsed',
    'exportMotionMode',
    'exportMotionSpeed',
    'exportMotionRange',
    'exportQuality',
    'gifLoop',
    'gifDither',
    'exportBgColor',
    'exportGrid',
    'exportBuildPlate',
    'jpegQuality',
].forEach((id) => {
    const input = document.getElementById(id);
    input?.addEventListener('input', scheduleCardResetButtonStatesUpdate);
    input?.addEventListener('change', scheduleCardResetButtonStatesUpdate);
});

scheduleCardResetButtonStatesUpdate();

document.querySelector('.orbit-hint-dismiss')?.addEventListener('click', () => {
    orbitHintBarEl?.classList.remove('visible');
    try { localStorage.setItem('rotater_hintDismissed', '1'); } catch (e) { }
});

const handleClearModelRequest = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    // If currently showing benchy (no user file in IDB), X = replace (open picker)
    if (currentFileName === '3dbenchy') {
        document.getElementById('fileInput').click();
        return;
    }
    if (!confirm('Reset to 3D Benchy?')) return;
    await loadBenchyModel();
};

async function clearBuildPlateModels() {
    suppressAutoDemoModelLoad();

    if (mesh) {
        disposeRulerHoveredPartVisual();
        scene.remove(mesh);
        mesh.geometry.dispose();
        disposeMaterials(mesh.material);
        mesh = null;
    }

    await clearIDB();

    currentModelBuffer = null;
    modelPartNames = [];
    modelPartBaseColors = [];
    modelPartSettings = [];
    customModelSettingsByPart = {};
    modelPartFiles = null;
    modelPartDisplayOrder = [];
    pendingModelPartDisplayOrder = null;
    pendingBulkSelectedPartIndices = null;
    multipartPartBounds = null;
    modelPartDimensions = [];
    modelPartBoundsBoxes = [];
    modelPartSelected = 0;
    bulkSelectedPartIndices.clear();
    bgSyncPartIndex = 0;
    buildPlateSyncPartIndex = 0;
    modelDims = null;
    modelRadius = 1;
    currentFileName = 'model';

    setDisplayedFileName('No model loaded');
    setRulerHoveredPartIndex(-1);
    closeThumbSelectMenus();
    closeFileChipPartsMenu();
    syncModelPartSelectorUI();
    syncBgModelSyncSourceUI();
    syncBuildPlateModelSyncSourceUI();
    syncFileChipMultipartUI();
    rebuildFileChipPartsMenu();
    updateRulerHUD();
    updateLiveRulerOverlay();

    const compactBtnLabel = document.getElementById('compactBtnLabel');
    if (compactBtnLabel) compactBtnLabel.textContent = 'Upload';

    setStatus('Build plate cleared.');
    setTimeout(() => setStatus(''), 1800);
}

document.getElementById('btnClearModel')?.addEventListener('click', handleClearModelRequest);
document.getElementById('btnClearModelQuick')?.addEventListener('click', handleClearModelRequest);
const clearBuildPlateHandler = async () => {
    if (!mesh) {
        setStatus('Build plate is already empty.');
        setTimeout(() => setStatus(''), 1800);
        return;
    }
    if (!confirm('Clear build plate?\n\nThis removes all loaded STL models and keeps your settings.')) return;
    await clearBuildPlateModels();
};
btnClearBuildPlateEl?.addEventListener('click', clearBuildPlateHandler);
document.getElementById('btnClearBuildPlate-modal')?.addEventListener('click', clearBuildPlateHandler);

async function loadBenchyModel({ clearStoredModel = true, markAsDefaultAuto = false } = {}) {
    try {
        const resp = await fetch('./benchy.stl');
        if (!resp.ok) return false;
        const buffer = await resp.arrayBuffer();
        if (clearStoredModel) await clearIDB();
        setDisplayedFileName('3dbenchy.stl');
        currentFileName = '3dbenchy';
        if (!renderer) initThree();
        controls.autoRotateSpeed = BASE_ROTATE_SPEED * getSpeed() * spinDir;
        await loadSTLBuffer(buffer, '3dbenchy.stl');
        // Benchy should always load into a predictable level + reframed camera
        // state, but only after the first load frame has applied fit/restore.
        await new Promise((resolve) => {
            requestAnimationFrame(() => {
                document.getElementById('btnCamReset')?.click();
                resolve();
            });
        });
        autoLoadedDefaultBenchy = !!markAsDefaultAuto;
        return true;
    } catch (e) {
        return false;
    }
}

document.getElementById('btnLoadBenchy')?.addEventListener('click', async () => {
    if (currentFileName !== '3dbenchy') {
        if (!confirm('Load 3D Benchy test model?')) return;
    }
    await loadBenchyModel();
});
document.getElementById('btnLoadBenchy-modal')?.addEventListener('click', async () => {
    if (currentFileName !== '3dbenchy') {
        if (!confirm('Load 3D Benchy test model?')) return;
    }
    await loadBenchyModel();
});

// ── Theme toggle ──────────────────────────────────────────────────────────────

function applyTheme(theme) {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    try { localStorage.setItem('rotater-theme', theme); } catch (e) { }
    const isDark = theme === 'dark';
    const iconPathD = isDark
        // bedtime_off icon — dark mode is on, click to switch to light
        ? 'M13.35 10.65C14.25 11.55 15.3167 12.2417 16.55 12.725C17.7833 13.2083 19.1 13.45 20.5 13.45C21.0333 13.45 21.45 13.6667 21.75 14.1C22.05 14.5333 22.1083 15 21.925 15.5C21.7917 15.8833 21.6167 16.2708 21.4 16.6625C21.1833 17.0542 20.9333 17.45 20.65 17.85C20.3833 18.2 20.0292 18.3875 19.5875 18.4125C19.1458 18.4375 18.7583 18.2833 18.425 17.95L6.025 5.55C5.70833 5.23333 5.55833 4.85417 5.575 4.4125C5.59167 3.97083 5.775 3.61667 6.125 3.35C6.425 3.11667 6.74583 2.90417 7.0875 2.7125C7.42917 2.52083 7.81667 2.33333 8.25 2.15C8.78333 1.91667 9.2875 1.94583 9.7625 2.2375C10.2375 2.52917 10.4833 2.94167 10.5 3.475C10.5333 4.90833 10.7917 6.2375 11.275 7.4625C11.7583 8.6875 12.45 9.75 13.35 10.65ZM17.8 23.9L15.6 21.725C15.05 21.925 14.4833 22.075 13.9 22.175C13.3167 22.275 12.7167 22.325 12.1 22.325C10.6667 22.325 9.31667 22.05 8.05 21.5C6.78333 20.95 5.67917 20.2042 4.7375 19.2625C3.79583 18.3208 3.05 17.2167 2.5 15.95C1.95 14.6833 1.675 13.3333 1.675 11.9C1.675 11.2833 1.725 10.6833 1.825 10.1C1.925 9.51667 2.075 8.95 2.275 8.4L0.15 6.275C-0.116667 6.00833 -0.25 5.69167 -0.25 5.325C-0.25 4.95833 -0.116667 4.64167 0.15 4.375C0.416667 4.10833 0.733333 3.975 1.1 3.975C1.46667 3.975 1.78333 4.10833 2.05 4.375L19.65 22.025C19.9 22.2917 20.025 22.6042 20.025 22.9625C20.025 23.3208 19.9 23.625 19.65 23.875C19.4 24.125 19.0917 24.2542 18.725 24.2625C18.3583 24.2708 18.05 24.15 17.8 23.9Z'
        // bedtime icon — light mode is on, click to switch to dark
        : 'M12.0998 22.325C10.6665 22.325 9.31647 22.05 8.0498 21.5C6.78314 20.95 5.67897 20.2041 4.7373 19.2625C3.79564 18.3208 3.0498 17.2166 2.4998 15.95C1.9498 14.6833 1.6748 13.3333 1.6748 11.9C1.6748 9.76664 2.25814 7.81664 3.4248 6.04997C4.59147 4.28331 6.16647 3.01664 8.1498 2.24997C8.68314 2.03331 9.1873 2.07081 9.6623 2.36247C10.1373 2.65414 10.3831 3.06664 10.3998 3.59997C10.4331 4.94997 10.679 6.24164 11.1373 7.47498C11.5956 8.70831 12.2998 9.79998 13.2498 10.75C14.1998 11.7 15.2915 12.4083 16.5248 12.875C17.7581 13.3416 19.0498 13.575 20.3998 13.575C20.9331 13.575 21.3498 13.7875 21.6498 14.2125C21.9498 14.6375 22.0081 15.1 21.8248 15.6C21.0915 17.65 19.8331 19.2833 18.0498 20.5C16.2665 21.7166 14.2831 22.325 12.0998 22.325Z';
    const label = document.getElementById('themeToggleLabel');
    const path = document.getElementById('themeToggleIconPath');
    if (label) label.textContent = isDark ? 'Light mode' : 'Dark mode';
    if (themeToggleRailLabel) themeToggleRailLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
    if (themeToggleRailLabelModal) themeToggleRailLabelModal.textContent = isDark ? 'Light mode' : 'Dark mode';
    if (path) path.setAttribute('d', iconPathD);
    if (themeToggleRailIconPath) themeToggleRailIconPath.setAttribute('d', iconPathD);
    if (themeToggleRailIconPathModal) themeToggleRailIconPathModal.setAttribute('d', iconPathD);
}

// Sync label/icon to whatever theme was applied on load
applyTheme(document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light');

document.getElementById('btnThemeToggle').addEventListener('click', () => {
    applyTheme(document.documentElement.classList.contains('theme-dark') ? 'light' : 'dark');
    queueDesktopV2RailLayoutSync();
});

function handleSpeedSelectionChange() {
    const v = getSpeed();
    if (controls) controls.autoRotateSpeed = BASE_ROTATE_SPEED * v * spinDir;
    speedResetBtn?.classList.toggle('is-changed', parseInt(speedSlider.value, 10) !== SPEED_DEFAULT);
    syncExportMotionControlsFromMain();
    updateEstimate();
    saveSettings();
}

speedSlider.addEventListener('change', handleSpeedSelectionChange);
speedSlider.addEventListener('input', handleSpeedSelectionChange);

speedResetBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    speedSlider.value = SPEED_DEFAULT;
    speedSlider.dispatchEvent(new Event('change'));
});

// ── Sidebar tabs ───────────────────────────────────────────────────────────────────

function normalizeSidebarTab(tab) {
    if (tab === 'light' || tab === 'animation' || tab === 'studio') return 'effects';
    return tab;
}

function isDesktopV2Layout() {
    return window.matchMedia('(min-width: 1200px)').matches;
}

function isTabletTabsLayout() {
    return window.matchMedia('(min-width: 900px) and (max-width: 1199px)').matches;
}

const desktopV2RailLayoutController = createDesktopV2RailLayoutController();
let desktopV2DockDefaultApplied = false;

function syncDesktopV2RailLayout() {
    desktopV2RailLayoutController.sync();
}

function queueDesktopV2RailLayoutSync() {
    desktopV2RailLayoutController.queue();
}

function disconnectDesktopV2RailObserver() {
    desktopV2RailLayoutController.disconnectObserver();
}

function ensureDesktopV2RailObserver() {
    desktopV2RailLayoutController.ensureObserver();
}

function applyMobileAccordionState(panelName) {
    const panel = normalizeSidebarTab(panelName || 'theme');
    document.querySelectorAll('.sidebar-tab').forEach((btn) => {
        const active = btn.dataset.tab === panel;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.mobile-panel-toggle').forEach((btn) => {
        const expanded = btn.dataset.mobilePanel === panel;
        btn.setAttribute('aria-expanded', String(expanded));
    });
    document.querySelectorAll('.tab-panel').forEach((panelEl) => {
        const expanded = panelEl.dataset.panel === panel;
        panelEl.hidden = false;
        panelEl.classList.toggle('is-mobile-open', expanded);
        Array.from(panelEl.children).forEach((child) => {
            if (child.classList && child.classList.contains('mobile-panel-toggle')) return;
            child.hidden = !expanded;
        });
    });
    try { localStorage.setItem('rotater_mobileAccordionPanel', panel); } catch (_) { }
}

function applyDesktopV2Layout() {
    const desktopV2 = isDesktopV2Layout();
    const tabletTabs = isTabletTabsLayout();
    document.documentElement.classList.toggle('layout-v2-desktop', desktopV2);
    document.documentElement.classList.toggle('layout-tablet-tabs', tabletTabs);
    document.documentElement.classList.toggle('layout-mobile-accordion', !desktopV2 && !tabletTabs);

    const exportOverlayEl = document.getElementById('exportOverlay');
    const openExportBtn = document.getElementById('btnOpenExportModal');
    if (desktopV2) {
        if (openExportBtn) {
            openExportBtn.hidden = false;
        }
        // Desktop rail shows both Theme and Effects cards side-by-side.
        document.querySelectorAll('.sidebar-tab').forEach((btn) => {
            const active = btn.dataset.tab === 'theme';
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', String(active));
        });
        document.querySelectorAll('.mobile-panel-toggle').forEach((btn) => {
            btn.setAttribute('aria-expanded', String(btn.dataset.mobilePanel === 'theme'));
        });
        document.querySelectorAll('.tab-panel').forEach((panel) => {
            panel.classList.remove('is-mobile-open');
            panel.hidden = false;
            Array.from(panel.children).forEach((child) => {
                if (child.classList && child.classList.contains('mobile-panel-toggle')) return;
                child.hidden = false;
            });
        });
        try { localStorage.setItem('rotater_activeTab', 'theme'); } catch (_) { }
        if (!desktopV2DockDefaultApplied) {
            applyAppSettingsDockState(true);
            try { localStorage.setItem('rotater_appSettingsCollapsed', '1'); } catch (_) { }
            desktopV2DockDefaultApplied = true;
        }
        ensureDesktopV2RailObserver();
        queueDesktopV2RailLayoutSync();
    } else {
        if (openExportBtn) {
            openExportBtn.hidden = false;
        }
        if (exportOverlayEl) exportOverlayEl.hidden = true;
        // Close export workspace cleanly when switching to mobile/tablet,
        // otherwise crop-mode UI can remain visible after resize.
        closeExportWorkspace();
        disconnectDesktopV2RailObserver();
        document.documentElement.style.removeProperty('--desktop-v2-effects-top');
        document.documentElement.style.removeProperty('--desktop-v2-effects-max-height');
        desktopV2DockDefaultApplied = false;
        let panel = 'theme';
        try {
            panel = localStorage.getItem('rotater_mobileAccordionPanel')
                || localStorage.getItem('rotater_activeTab')
                || 'theme';
        } catch (_) { }
        if (tabletTabs) switchTab(panel);
        else applyMobileAccordionState(panel);
    }
}

function applyAppSettingsDockState(collapsed) {
    const dock = document.getElementById('appSettingsDock');
    const body = document.getElementById('appSettingsDockBody');
    const toggle = document.getElementById('btnToggleAppSettings');
    if (!dock || !body || !toggle) return;

    dock.classList.toggle('is-collapsed', !!collapsed);
    body.hidden = !!collapsed;
    toggle.setAttribute('aria-expanded', String(!collapsed));
    queueDesktopV2RailLayoutSync();
}

function applySidepanelsHiddenState(hidden, persist = true) {
    const next = !!hidden;
    const root = document.documentElement;
    root.classList.toggle('sidepanels-hidden', next);
    // Keep legacy class in sync for existing layout/CSS hooks.
    root.classList.toggle('sidebar-collapsed', next);

    if (btnToggleSidepanelsEl) {
        btnToggleSidepanelsEl.classList.toggle('is-hidden', next);
        btnToggleSidepanelsEl.setAttribute('aria-label', next ? 'Exit expanded preview' : 'Expand preview');
        btnToggleSidepanelsEl.title = next ? 'Exit expanded preview' : 'Expand preview';
    }

    const collapseBtn = document.getElementById('btnCollapseSidebar');
    if (collapseBtn) {
        collapseBtn.title = next ? 'Show sidepanels' : 'Hide sidepanels';
    }

    if (persist) {
        try {
            localStorage.setItem('rotater_sidepanelsHidden', next ? '1' : '0');
            localStorage.setItem('rotater_sidebarCollapsed', next ? '1' : '0');
        } catch (_) { }
    }

    syncCanvasSize();
}

function toggleSidepanelsHiddenState(persist = true) {
    const hidden = document.documentElement.classList.contains('sidepanels-hidden');
    applySidepanelsHiddenState(!hidden, persist);
}

function switchTab(tab) {
    const normalizedTab = normalizeSidebarTab(tab);
    if (document.documentElement.classList.contains('layout-mobile-accordion')) {
        applyMobileAccordionState(normalizedTab);
        try { localStorage.setItem('rotater_activeTab', normalizedTab); } catch (_) { }
        return;
    }
    document.querySelectorAll('.sidebar-tab').forEach(btn => {
        const active = btn.dataset.tab === normalizedTab;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('is-mobile-open');
        Array.from(panel.children).forEach((child) => {
            if (child.classList && child.classList.contains('mobile-panel-toggle')) return;
            child.hidden = false;
        });
        panel.hidden = panel.dataset.panel !== normalizedTab;
    });
    try { localStorage.setItem('rotater_activeTab', normalizedTab); } catch (_) { }
}

document.querySelectorAll('.sidebar-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('.mobile-panel-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
        applyMobileAccordionState(btn.dataset.mobilePanel || 'theme');
    });
});

// Restore active tab
try {
    const savedTab = localStorage.getItem('rotater_activeTab');
    const normalizedSavedTab = normalizeSidebarTab(savedTab);
    if (normalizedSavedTab && document.querySelector(`.sidebar-tab[data-tab="${normalizedSavedTab}"]`)) {
        switchTab(normalizedSavedTab);
    }
} catch (_) { }

try {
    const dockCollapsed = localStorage.getItem('rotater_appSettingsCollapsed');
    applyAppSettingsDockState(dockCollapsed !== '0');
} catch (_) {
    applyAppSettingsDockState(true);
}

restoreExportPanelCollapsedStateController({
    applyExportPanelState,
    fallback: false,
});

document.getElementById('btnToggleAppSettings')?.addEventListener('click', () => {
    const dock = document.getElementById('appSettingsDock');
    if (!dock) return;
    const collapsed = !dock.classList.contains('is-collapsed');
    applyAppSettingsDockState(collapsed);
    try { localStorage.setItem('rotater_appSettingsCollapsed', collapsed ? '1' : '0'); } catch (_) { }
});

document.getElementById('btnThemeToggleRail')?.addEventListener('click', () => {
    document.getElementById('btnThemeToggle')?.click();
});
if (btnThemeToggleRailModalEl) {
    btnThemeToggleRailModalEl.addEventListener('click', () => {
        document.getElementById('btnThemeToggle')?.click();
    });
}

applyDesktopV2Layout();
try {
    const shouldRestoreExportWorkspace = isDesktopV2Layout() && localStorage.getItem('rotater_exportWorkspaceActive') === '1';
    if (shouldRestoreExportWorkspace) openExportWorkspace();
} catch (_) { }
window.addEventListener('resize', () => {
    applyDesktopV2Layout();
});

function setupCardHeaderControls() {
    const cards = Array.from(document.querySelectorAll('.controls-section-box'));
    cards.forEach((card) => {
        const header = card.querySelector('.box-heading-row, .controls-row--section-header');
        if (!header || header.querySelector('.card-collapse-btn')) return;

        const heading = header.querySelector('.box-heading, .section-heading');
        const resetBtn = header.querySelector('.copy-link-btn--compact');
        if (heading && resetBtn) {
            resetBtn.classList.add('card-reset-btn');
            heading.insertAdjacentElement('afterend', resetBtn);
        }

        const collapseBtn = document.createElement('button');
        collapseBtn.type = 'button';
        collapseBtn.className = 'card-collapse-btn';
        collapseBtn.setAttribute('aria-expanded', 'true');
        collapseBtn.setAttribute('title', 'Collapse card');
        collapseBtn.setAttribute('aria-label', 'Collapse card');
        collapseBtn.innerHTML = `<span aria-hidden="true">${getChevronDownIconSVG(18)}</span>`;
        const toggleCardCollapsed = () => {
            const collapsed = card.classList.toggle('is-collapsed');
            closeThumbSelectMenus();
            closeFileChipPartsMenu();
            collapseBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            collapseBtn.title = collapsed ? 'Expand card' : 'Collapse card';
            collapseBtn.setAttribute('aria-label', collapsed ? 'Expand card' : 'Collapse card');
        };
        header.classList.add('card-header-toggle');
        header.addEventListener('click', (ev) => {
            if (ev.target instanceof Element && ev.target.closest('button, a, input, select, textarea, label')) return;
            toggleCardCollapsed();
        });
        collapseBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            toggleCardCollapsed();
        });
        header.appendChild(collapseBtn);
    });
}

setupCardHeaderControls();

// ── Show All / Show Less toggles for slider sections ─────────────────────────
function initShowAll(toggleId, extraId, storeKey) {
    const toggle = document.getElementById(toggleId);
    const extra = document.getElementById(extraId);
    if (!toggle || !extra) return;
    const labelAll = toggle.dataset.labelAll || 'Show All';
    const labelLess = toggle.dataset.labelLess || 'Show Less';
    // Restore persisted expanded state
    try {
        if (localStorage.getItem(storeKey) === '1') {
            extra.hidden = false;
            toggle.textContent = labelLess;
        }
    } catch (_) { }
    toggle.addEventListener('click', () => {
        const wasHidden = extra.hidden;
        extra.hidden = !wasHidden;
        toggle.textContent = wasHidden ? labelLess : labelAll;
        try { localStorage.setItem(storeKey, wasHidden ? '1' : '0'); } catch (_) { }
    });
}
initShowAll('advModelToggle', 'advModelExtra', 'rotater_advModelCollapsed');
initShowAll('advLightToggle', 'advLightExtra', 'rotater_advLightCollapsed');

function applyFineTuningUIState(enabled) {
    fineTuningMode = !!enabled;
    document.documentElement.classList.toggle('fine-tuning-enabled', fineTuningMode);

    // Use the authored fine-step increment so centered/default slider positions stay stable.
    document.querySelectorAll('input[type="range"][data-snap-count]').forEach(slider => {
        if (fineTuningMode) {
            if (!slider.dataset.originalStep) slider.dataset.originalStep = slider.step;
            slider.step = slider.dataset.fineStep || 'any';
        } else if (slider.dataset.originalStep) {
            slider.step = slider.dataset.originalStep;
        }
    });

    // In fine tuning mode, keep labels visible but disable clickable snap dots.
    document.querySelectorAll('.snap-dot-btn').forEach(el => {
        el.style.opacity = fineTuningMode ? '0.35' : '';
        el.style.pointerEvents = fineTuningMode ? 'none' : '';
    });

    refreshPreciseSliderTextEntryState();
}

// Fine Tuning toggle
const fineTuningCheckEl = document.getElementById('fineTuningCheck');
if (fineTuningCheckEl) {
    applyFineTuningUIState(fineTuningCheckEl.checked);
    updateTextureTuneUI();
    syncAllRangeFillIndicators();
    const fineTuningHandler = () => {
        applyFineTuningUIState(fineTuningCheckEl.checked);

        if (!fineTuningMode) {
            const activeMode = finishControlGroupEl?.dataset.activeMode || getSelectedPartSettings().finishMode || 'satin';
            setFinishModeUI(activeMode);
            if (textureTuneRoughnessSlider) {
                textureTuneRoughnessSlider.value = String(modeStrengthToFinishSliderValue(activeMode, 2));
                syncSliderTooltip(textureTuneRoughnessSlider);
            }
            applyFinishControlsToSelectedPart();
            if (mesh) rebuildMeshMaterialsForCurrentShading();
        }
        updateTextureTuneUI();
        persistCurrentMultipartParts();
        queueModelPartThumbsRender();
        saveSettings();
    };
    fineTuningCheckEl.addEventListener('change', fineTuningHandler);
    if (fineTuningCheckModalEl) {
        fineTuningCheckModalEl.addEventListener('change', () => {
            fineTuningCheckEl.checked = fineTuningCheckModalEl.checked;
            fineTuningHandler();
        });
    }
}

exportMotionControlsEnabled = true;
if (exportMotionControlsEl) exportMotionControlsEl.hidden = false;

if (showDpadToggleEl) {
    showDpadToggleEl.checked = dpadVisible;
    const dpadHandler = () => {
        dpadVisible = !!showDpadToggleEl.checked;
        applyDpadVisibility();
        saveSettings();
    };
    showDpadToggleEl.addEventListener('change', dpadHandler);
    if (showDpadToggleModalEl) {
        showDpadToggleModalEl.checked = dpadVisible;
        showDpadToggleModalEl.addEventListener('change', () => {
            showDpadToggleEl.checked = showDpadToggleModalEl.checked;
            dpadHandler();
        });
    }
}

if (devModeToggleEl) {
    devModeToggleEl.checked = !!devModeEnabled;
    const devModeHandler = () => {
        setDevModeEnabled(!!devModeToggleEl.checked, true);
    };
    devModeToggleEl.addEventListener('change', devModeHandler);
    if (devModeToggleModalEl) {
        devModeToggleModalEl.checked = !!devModeEnabled;
        devModeToggleModalEl.addEventListener('change', () => {
            devModeToggleEl.checked = devModeToggleModalEl.checked;
            devModeHandler();
        });
    }
}

if (buildPlateSizePresetEl) {
    buildPlateSizePresetEl.value = buildPlateSizePreset;
    const buildPlateChangeHandler = () => {
        applyBuildPlateSizePreset(buildPlateSizePresetEl.value);
        if (buildPlateSizePresetModalEl) buildPlateSizePresetModalEl.value = buildPlateSizePresetEl.value;
        syncBuildPlateSizeUI();
        if (mesh) updateShadowCatcherPlacement();
        refreshExportPreviewNow();
        saveSettings();
    };
    buildPlateSizePresetEl.addEventListener('change', buildPlateChangeHandler);
    if (buildPlateSizePresetModalEl) {
        buildPlateSizePresetModalEl.value = buildPlateSizePreset;
        buildPlateSizePresetModalEl.addEventListener('change', () => {
            buildPlateSizePresetEl.value = buildPlateSizePresetModalEl.value;
            buildPlateChangeHandler();
        });
    }
}

if (buildPlateCustomWidthEl) {
    const customWidthHandler = () => {
        buildPlateSizePreset = 'custom';
        buildPlateWidth = clampBuildPlateSize(buildPlateCustomWidthEl.value, buildPlateWidth);
        if (buildPlateSizePresetEl) buildPlateSizePresetEl.value = 'custom';
        if (buildPlateSizePresetModalEl) buildPlateSizePresetModalEl.value = 'custom';
        syncBuildPlateSizeUI();
        if (mesh) updateShadowCatcherPlacement();
        refreshExportPreviewNow();
        saveSettings();
    };
    buildPlateCustomWidthEl.addEventListener('input', customWidthHandler);
    if (buildPlateCustomWidthModalEl) {
        buildPlateCustomWidthModalEl.addEventListener('input', () => {
            buildPlateCustomWidthEl.value = buildPlateCustomWidthModalEl.value;
            customWidthHandler();
        });
    }
}

if (buildPlateCustomDepthEl) {
    const customDepthHandler = () => {
        buildPlateSizePreset = 'custom';
        buildPlateDepth = clampBuildPlateSize(buildPlateCustomDepthEl.value, buildPlateDepth);
        if (buildPlateSizePresetEl) buildPlateSizePresetEl.value = 'custom';
        if (buildPlateSizePresetModalEl) buildPlateSizePresetModalEl.value = 'custom';
        syncBuildPlateSizeUI();
        if (mesh) updateShadowCatcherPlacement();
        refreshExportPreviewNow();
        saveSettings();
    };
    buildPlateCustomDepthEl.addEventListener('input', customDepthHandler);
    if (buildPlateCustomDepthModalEl) {
        buildPlateCustomDepthModalEl.addEventListener('input', () => {
            buildPlateCustomDepthEl.value = buildPlateCustomDepthModalEl.value;
            customDepthHandler();
        });
    }
}

syncBuildPlateSizeUI();
syncExportMotionControlsFromMain();

btnExportCollapsedConfirmClose?.addEventListener('click', () => closeCollapsedExportConfirm(false));
btnExportCollapsedConfirmCancel?.addEventListener('click', () => closeCollapsedExportConfirm(false));
btnExportCollapsedConfirmContinue?.addEventListener('click', () => closeCollapsedExportConfirm(true));
exportCollapsedConfirmOverlayEl?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCollapsedExportConfirm(false);
});

btnUploadChoiceClose?.addEventListener('click', () => closeUploadChoicePrompt('cancel'));
btnUploadChoiceCancel?.addEventListener('click', () => closeUploadChoicePrompt('cancel'));
btnUploadChoiceReplace?.addEventListener('click', () => closeUploadChoicePrompt('append'));
btnUploadChoiceNewPlate?.addEventListener('click', () => closeUploadChoicePrompt('newplate'));
btnUploadChoiceShowMore?.addEventListener('click', () => {
    uploadChoiceUiController.toggleShowAll();
});

uploadChoiceFileListEl?.addEventListener('click', (ev) => {
    const btn = ev.target?.closest?.('[data-remove-file-index]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.removeFileIndex, 10);
    uploadChoiceUiController.removeFileAtIndex(idx);
});

async function handleUploadChoiceDroppedFiles(fileList) {
    closeUploadChoicePrompt('cancel');
    uploadActionController.clearPendingAction();
    try {
        await handlePickedUploadFiles(fileList, null);
    } catch (err) {
        setStatus('Error: ' + (err?.message || 'Failed to import file(s).'));
        console.error(err);
        setTimeout(() => setStatus(''), 5000);
    }
}

if (uploadChoiceDropZoneEl) {
    let dragDepth = 0;
    const setDragOverState = (active) => {
        uploadChoiceDropZoneEl.classList.toggle('is-dragover', !!active);
    };

    uploadChoiceDropZoneEl.addEventListener('click', () => {
        closeUploadChoicePrompt('cancel');
        uploadActionController.clearPendingAction();
        openUploadFilePicker(null);
    });

    uploadChoiceDropZoneEl.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDepth += 1;
        setDragOverState(true);
    });

    uploadChoiceDropZoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverState(true);
    });

    ['dragleave', 'dragend'].forEach((eventName) => {
        uploadChoiceDropZoneEl.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragDepth = Math.max(0, dragDepth - 1);
            if (!dragDepth) setDragOverState(false);
        });
    });

    uploadChoiceDropZoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDepth = 0;
        setDragOverState(false);
        const files = e.dataTransfer?.files;
        if (!files?.length) return;
        handleUploadChoiceDroppedFiles(files);
    });
}

uploadChoiceOverlayEl?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeUploadChoicePrompt('cancel');
});
uploadChoiceOverlayEl?.addEventListener('dragover', (e) => {
    e.preventDefault();
});
uploadChoiceOverlayEl?.addEventListener('drop', (e) => {
    e.preventDefault();
});

if (resetWarningsToggleEl) {
    const resetWarningsHandler = (e) => {
        e.preventDefault();
        resetAllWarnings();
    };
    resetWarningsToggleEl.addEventListener('click', resetWarningsHandler);
    document.getElementById('resetWarningsToggle-modal')?.addEventListener('click', resetWarningsHandler);
}

if (btnResetEverythingEl) {
    const handler = async (e) => {
        e.preventDefault();
        await resetSettingsOnly();
    };
    btnResetEverythingEl.addEventListener('click', handler);
    document.getElementById('btnResetEverything-modal')?.addEventListener('click', handler);
}

// ── Sidebar collapse toggle ──────────────────────────────────────────────────────
document.getElementById('btnCollapseSidebar')?.addEventListener('click', () => {
    toggleSidepanelsHiddenState(true);
});
btnToggleSidepanelsEl?.addEventListener('click', () => {
    toggleSidepanelsHiddenState(true);
});
// Restore collapse state
try {
    const stored = localStorage.getItem('rotater_sidepanelsHidden');
    const legacy = localStorage.getItem('rotater_sidebarCollapsed');
    const shouldHide = (stored === '1') || (stored == null && legacy === '1');
    applySidepanelsHiddenState(shouldHide, false);
} catch (e) { }

['btnOpenExportModal', 'btnOpenExportModalMobile', 'btnOpenExportModalMini'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', () => {
        openExportWorkspace();
    });
});

document.getElementById('btnOpenExportModalCanvas')?.addEventListener('click', () => {
    openExportWorkspace();
});

document.getElementById('btnExportWorkspaceClose')?.addEventListener('click', () => {
    closeExportWorkspace();
});

document.getElementById('btnExportWorkspaceCloseHeader')?.addEventListener('click', () => {
    closeExportWorkspace();
});

document.getElementById('btnCopyLink')?.addEventListener('click', function () {
    saveSettings();
    settingsToURL();
    const url = location.href;
    const btn = this;
    const labelEl = btn.querySelector('[data-copy-link-label]') || btn;
    const prev = labelEl.textContent;
    navigator.clipboard.writeText(url).then(() => {
        labelEl.textContent = 'Copied!';
        setTimeout(() => { labelEl.textContent = prev; }, 1800);
    }).catch(() => {
        labelEl.textContent = 'Copy failed';
        setTimeout(() => { labelEl.textContent = prev; }, 1800);
    });
});

document.getElementById('btnCopyImageClipboard')?.addEventListener('click', async function () {
    if (!mesh) return;
    const btn = this;
    const labelEl = btn.querySelector('[data-copy-image-label]') || btn;
    const prev = labelEl.textContent;

    const format = exportFormatEl?.value === 'jpg' ? 'jpg' : 'png';
    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpg' ? EXPORT.image.quality : undefined;

    if (!navigator.clipboard || typeof window.ClipboardItem !== 'function') {
        labelEl.textContent = 'Clipboard unavailable';
        setTimeout(() => { labelEl.textContent = prev; }, 1800);
        return;
    }

    try {
        if (!isPaused) setPauseState(true, false, true);
        const blob = await renderStillImageBlob(mime, { quality, transparent: false });
        await navigator.clipboard.write([new ClipboardItem({ [mime]: blob })]);
        labelEl.textContent = 'Image copied';
    } catch (err) {
        labelEl.textContent = 'Copy failed';
        console.error(err);
    } finally {
        setTimeout(() => { labelEl.textContent = prev; }, 1800);
    }
});

btnDownloadPackage?.addEventListener('click', async () => {
    if (!mesh) return;
    let prev = '';
    try {
        prev = btnDownloadPackage.innerHTML;
        btnDownloadPackage.textContent = 'Preparing ZIP...';
        btnDownloadPackage.disabled = true;
        saveSettings();
        settingsToURL();
        const settings = (() => {
            try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
            catch (_) { return {}; }
        })();
        const base = safeDownloadFileName(currentFileName || stemFromFileName(modelPartNames[0] || 'model'));
        const zip = new JSZip();
        const packageJson = {
            app: 'rotater',
            version: typeof ROTATER_BUILD !== 'undefined' ? ROTATER_BUILD : 'dev',
            exportedAt: new Date().toISOString(),
            shareURL: location.href,
            multipart: isMultipartModel(),
            model: {
                currentFileName,
                partNames: [...modelPartNames],
                ...(isMultipartModel() && modelPartBaseColors.length > 1 ? {
                    partColors: [...modelPartBaseColors],
                    partSettings: modelPartSettings.map(s => ({ ...s })),
                } : {}),
                selectedPart: modelPartSelected,
            },
            settings,
        };

        zip.file(`${base}/package.json`, JSON.stringify(packageJson, null, 2));

        if (isMultipartModel() && modelPartFiles && modelPartFiles.length) {
            modelPartFiles.forEach((part, idx) => {
                const partName = safeDownloadFileName(part.name || `part-${idx + 1}.stl`, `part-${idx + 1}.stl`);
                zip.file(`${base}/models/${partName}`, part.buffer);
            });
        } else if (currentModelBuffer) {
            const singleName = safeDownloadFileName(modelPartNames[0] || `${base}.stl`, `${base}.stl`);
            zip.file(`${base}/models/${singleName}`, currentModelBuffer);
        } else {
            packageJson.warning = 'STL source unavailable in current session; settings only.';
            zip.file(`${base}/package.json`, JSON.stringify(packageJson, null, 2));
        }

        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        download(zipBlob, `${base}_rotater-project.zip`, 'application/zip');
        btnDownloadPackage.textContent = 'ZIP downloaded';
        setTimeout(() => { btnDownloadPackage.innerHTML = prev; }, 1600);
    } catch (err) {
        console.error(err);
        setStatus('Could not build ZIP package.');
        btnDownloadPackage.innerHTML = prev;
    } finally {
        btnDownloadPackage.disabled = false;
    }
});

// ── Help overlay ──────────────────────────────────────────────────────────────
const helpOverlayEl = document.getElementById('helpOverlay');
const helpPanelEl = helpOverlayEl?.querySelector('.help-panel') || null;
const btnHelpCanvasEl = document.getElementById('btnHelpCanvas');
const buildUpdateBadgeEl = document.getElementById('buildUpdateBadge');
const BUILD_SEEN_KEY = 'rotater_build_seen';

function getCurrentBuildVersion() {
    return typeof ROTATER_BUILD !== 'undefined' ? ROTATER_BUILD : (window.ROTATER_BUILD || 'dev');
}

function isBuildUpdateSeen() {
    try {
        return localStorage.getItem(BUILD_SEEN_KEY) === getCurrentBuildVersion();
    } catch (e) {
        return true;
    }
}

function markBuildUpdateSeen() {
    try {
        localStorage.setItem(BUILD_SEEN_KEY, getCurrentBuildVersion());
    } catch (e) { }
}

function syncBuildUpdateBadge() {
    if (!buildUpdateBadgeEl) return;
    buildUpdateBadgeEl.hidden = isBuildUpdateSeen();
}

function positionHelpOverlay() {
    if (!helpOverlayEl || !helpPanelEl || !btnHelpCanvasEl) return;
    const rect = btnHelpCanvasEl.getBoundingClientRect();
    const margin = 10;
    const panelWidth = helpPanelEl.offsetWidth || 300;
    const maxLeft = Math.max(margin, window.innerWidth - panelWidth - margin);
    const left = Math.max(margin, Math.min(rect.right - panelWidth, maxLeft));
    const top = Math.max(margin, rect.bottom + 8);
    helpPanelEl.style.left = `${left}px`;
    helpPanelEl.style.top = `${top}px`;
}

btnHelpCanvasEl?.addEventListener('click', () => {
    if (!helpOverlayEl) return;
    markBuildUpdateSeen();
    syncBuildUpdateBadge();
    helpOverlayEl.hidden = false;
    positionHelpOverlay();
});
document.getElementById('btnHelpClose')?.addEventListener('click', () => {
    document.getElementById('helpOverlay').hidden = true;
});
document.getElementById('helpOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('helpOverlay').hidden = true;
});
window.addEventListener('resize', () => {
    if (helpOverlayEl && !helpOverlayEl.hidden) positionHelpOverlay();
});

syncBuildUpdateBadge();

// ── App Settings overlay ──────────────────────────────────────────────────────
const appSettingsOverlayEl = document.getElementById('appSettingsOverlay');
const appSettingsPanelEl = appSettingsOverlayEl?.querySelector('.app-settings-panel') || null;
const btnAppSettingsCanvasEl = document.getElementById('btnAppSettingsCanvas');

function positionAppSettingsOverlay() {
    if (!appSettingsOverlayEl || !appSettingsPanelEl || !btnAppSettingsCanvasEl) return;
    const helpRect = document.getElementById('btnHelpCanvas')?.getBoundingClientRect() || { right: 0, bottom: 0 };
    const settingsRect = btnAppSettingsCanvasEl.getBoundingClientRect();
    const margin = 10;
    const panelWidth = appSettingsPanelEl.offsetWidth || 340;
    const maxLeft = Math.max(margin, window.innerWidth - panelWidth - margin);
    const left = Math.max(margin, Math.min(settingsRect.right - panelWidth, maxLeft));
    const top = Math.max(margin, settingsRect.bottom + 8);
    appSettingsPanelEl.style.left = `${left}px`;
    appSettingsPanelEl.style.top = `${top}px`;
}

btnAppSettingsCanvasEl?.addEventListener('click', () => {
    if (!appSettingsOverlayEl) return;
    if (!appSettingsOverlayEl.hidden) {
        appSettingsOverlayEl.hidden = true;
        return;
    }
    appSettingsOverlayEl.hidden = false;
    positionAppSettingsOverlay();
});
document.getElementById('btnAppSettingsClose')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (appSettingsOverlayEl) appSettingsOverlayEl.hidden = true;
});
document.addEventListener('click', (e) => {
    if (!appSettingsOverlayEl || appSettingsOverlayEl.hidden) return;
    const target = e.target;
    if (!(target instanceof Node)) return;
    if (appSettingsPanelEl?.contains(target)) return;
    if (btnAppSettingsCanvasEl?.contains(target)) return;
    appSettingsOverlayEl.hidden = true;
});
window.addEventListener('resize', () => {
    if (appSettingsOverlayEl && !appSettingsOverlayEl.hidden) positionAppSettingsOverlay();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && exportCollapsedConfirmOverlayEl && !exportCollapsedConfirmOverlayEl.hidden) {
        closeCollapsedExportConfirm(false);
        return;
    }
    if (e.key === 'Escape' && uploadChoiceOverlayEl && !uploadChoiceOverlayEl.hidden) {
        closeUploadChoicePrompt('cancel');
        return;
    }
    if (e.key === 'Escape' && exportWorkspaceActive) {
        closeExportWorkspace();
        return;
    }
    if (e.key === 'Escape' && !document.getElementById('helpOverlay').hidden) {
        document.getElementById('helpOverlay').hidden = true;
    }
});

// ── Export frame overlay toggle ───────────────────────────────────────────────
frameOverlayBtn?.addEventListener('click', () => {
    if (exportFrameEnabled) {
        confirmCropMode();
        return;
    }
    enterCropMode();
});

function cancelCropMode() {
    if (!exportFrameEnabled) return;
    // Restore saved export framing and pop viewport back to standard scale
    if (_cropBackupDist !== null) {
        exportCamDist = _cropBackupDist;
        exportCamElev = _cropBackupElev;
        exportCamZoom = _cropBackupZoom;
    } else {
        exportCamDist = null;
    }
    exportFrameEnabled = false;
    updateCropHintUI();
    updateFrameOverlayButtonUI();
    _cropLiveSyncArmed = false;
    _cropAppliedCameraZoomScale = false;
    clearExportFrame();
    updateRulerHUD();
    saveSettings();
}

function confirmCropMode() {
    if (!exportFrameEnabled) return;
    // Commit current live crop framing.
    syncExportCameraFromViewport();
    exportFrameEnabled = false;
    updateCropHintUI();
    updateFrameOverlayButtonUI();
    _cropLiveSyncArmed = false;
    _cropAppliedCameraZoomScale = false;
    clearExportFrame();
    updateRulerHUD();
    saveSettings();
}

updateFrameOverlayButtonUI();

canvas?.addEventListener('pointerdown', (e) => {
    if (!isCanvasOrbitClickGuardEligible(e)) return;
    _pendingCanvasOrbitDrag = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startEvent: {
            pointerId: e.pointerId,
            pointerType: e.pointerType,
            isPrimary: e.isPrimary,
            button: e.button,
            buttons: e.buttons,
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
            pressure: e.pressure,
            tangentialPressure: e.tangentialPressure,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
            twist: e.twist,
            width: e.width,
            height: e.height,
        },
        activated: false,
    };
    e.stopImmediatePropagation();
}, true);

window.addEventListener('pointermove', (e) => {
    if (!_pendingCanvasOrbitDrag || !_pendingCanvasOrbitDrag.startEvent || !e.isTrusted) return;
    if (e.pointerId !== _pendingCanvasOrbitDrag.pointerId) return;
    if (_pendingCanvasOrbitDrag.activated) return;

    const dx = e.clientX - _pendingCanvasOrbitDrag.startX;
    const dy = e.clientY - _pendingCanvasOrbitDrag.startY;
    if ((dx * dx) + (dy * dy) < (CANVAS_ORBIT_CLICK_DRAG_THRESHOLD_PX * CANVAS_ORBIT_CLICK_DRAG_THRESHOLD_PX)) {
        e.stopImmediatePropagation();
        return;
    }

    _pendingCanvasOrbitDrag.activated = true;
    dispatchSyntheticCanvasPointer('pointerdown', _pendingCanvasOrbitDrag.startEvent);
    dispatchSyntheticCanvasPointer('pointermove', e);
    e.stopImmediatePropagation();
}, true);

canvas?.addEventListener('click', (e) => {
    closeModelPartActionMenus();
    if (exportWorkspaceActive) {
        // In Share workspace, a single non-drag canvas click should close.
        // Exception: when crop framing is active, keep inside-frame clicks interactive.
        if (!exportFrameEnabled || !isCanvasPointInsideCropFrame(e.clientX, e.clientY)) {
            closeExportWorkspace();
            return;
        }
    }

    if (isModelPartFloatingCardOpen()) {
        closeModelPartSelectorMenu(true);
        return;
    }

    if (!hasModelParts()) return;
    const partIndex = resolveHoveredPartIndexFromPointerEvent(e);
    if (partIndex < 0) {
        if (!isModelPartPreviewMultiSelectActive() && !isModelPartFloatingCardOpen()) closeThumbSelectMenus();
        return;
    }
    selectModelPartFromRulerHover(partIndex, isModelPartPreviewMultiSelectActive());
    if (!isModelPartPreviewMultiSelectActive() && !isModelPartFloatingCardOpen()) closeThumbSelectMenus();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && exportFrameEnabled) {
        cancelCropMode();
        return;
    }
    if (e.key === 'Escape') {
        if (isModelPartFloatingCardOpen()) {
            closeModelPartSelectorMenu(true);
            return;
        }
        closeThumbSelectMenus();
    }
    if ((e.key === 'Enter' || e.key === 'Return') && exportFrameEnabled) confirmCropMode();
});

document.addEventListener('keyup', e => {
    if (e.key === 'Shift' && _shiftPanActive) {
        _shiftPanActive = false;
        setShiftPanInteraction(false);
    }
});

window.addEventListener('blur', () => {
    if (_shiftPanActive) {
        _shiftPanActive = false;
        setShiftPanInteraction(false);
    }
    endRightPanVerticalLock();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Shift' && !_shiftPanActive) {
        _shiftPanActive = true;
        setShiftPanInteraction(true);
    }
});

canvas?.addEventListener('pointerdown', (e) => {
    if (e.button === 2) {
        beginRightPanVerticalLock();
        return;
    }
    if (e.button !== 0) return;
    if (e.shiftKey) {
        _shiftPanActive = true;
        setShiftPanInteraction(true);
        return;
    }
    if (_shiftPanActive) {
        _shiftPanActive = false;
        setShiftPanInteraction(false);
    }
}, true);

window.addEventListener('pointerup', (e) => {
    if (_pendingCanvasOrbitDrag && e.isTrusted && e.pointerId === _pendingCanvasOrbitDrag.pointerId) {
        if (_pendingCanvasOrbitDrag.activated) {
            dispatchSyntheticCanvasPointer('pointerup', e);
            e.stopImmediatePropagation();
        }
        _pendingCanvasOrbitDrag = null;
    }
    if (e.button === 2) endRightPanVerticalLock();
}, true);

window.addEventListener('pointercancel', () => {
    if (_pendingCanvasOrbitDrag) {
        if (_pendingCanvasOrbitDrag.activated) {
            dispatchSyntheticCanvasPointer('pointercancel', _pendingCanvasOrbitDrag.startEvent);
        }
        _pendingCanvasOrbitDrag = null;
    }
    endRightPanVerticalLock();
}, true);

canvas?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

canvas?.addEventListener('pointermove', (e) => {
    if (!isModelPartPreviewHoverSelectionActive()) return;
    updateRulerPartHoverFromPointerEvent(e);
}, { passive: true });

canvas?.addEventListener('pointerleave', () => {
    if (canvas) canvas.style.cursor = '';
    setRulerHoveredPartIndex(-1);
});

canvas?.addEventListener('pointercancel', () => {
    if (canvas) canvas.style.cursor = '';
    setRulerHoveredPartIndex(-1);
});

const exportPreviewCanvas = document.getElementById('exportPreview');
const exportPreviewWrap = exportPreviewCanvas?.closest('.export-preview-wrap');
const exportPreviewForwardHost = exportPreviewWrap || exportPreviewCanvas;

function forwardPreviewPointerToMainCanvas(e) {
    if (!canvas || !controls) return;
    const init = {
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        isPrimary: e.isPrimary,
        button: e.button,
        buttons: e.buttons,
        clientX: e.clientX,
        clientY: e.clientY,
        screenX: e.screenX,
        screenY: e.screenY,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        pressure: e.pressure,
        tangentialPressure: e.tangentialPressure,
        tiltX: e.tiltX,
        tiltY: e.tiltY,
        twist: e.twist,
        width: e.width,
        height: e.height,
        bubbles: true,
        cancelable: true,
        composed: true,
    };
    try {
        canvas.dispatchEvent(new PointerEvent(e.type, init));
    } catch (_) {
        if (e.type === 'pointercancel') return;
        const fallbackType = e.type.replace('pointer', 'mouse');
        canvas.dispatchEvent(new MouseEvent(fallbackType, init));
    }
}

function isCanvasOrbitClickGuardEligible(e) {
    return !!(
        canvas
        && controls
        && e?.isTrusted
        && e.target === canvas
        && e.button === 0
        && !e.shiftKey
        && !e.altKey
        && !e.ctrlKey
        && !e.metaKey
        && !_cropCornerDrag
    );
}

function dispatchSyntheticCanvasPointer(type, source) {
    if (!canvas || !source) return;
    const init = {
        pointerId: source.pointerId,
        pointerType: source.pointerType,
        isPrimary: source.isPrimary,
        button: source.button,
        buttons: source.buttons,
        clientX: source.clientX,
        clientY: source.clientY,
        screenX: source.screenX,
        screenY: source.screenY,
        ctrlKey: source.ctrlKey,
        shiftKey: source.shiftKey,
        altKey: source.altKey,
        metaKey: source.metaKey,
        pressure: source.pressure,
        tangentialPressure: source.tangentialPressure,
        tiltX: source.tiltX,
        tiltY: source.tiltY,
        twist: source.twist,
        width: source.width,
        height: source.height,
        bubbles: true,
        cancelable: true,
        composed: true,
    };
    try {
        canvas.dispatchEvent(new PointerEvent(type, init));
    } catch (_) {
        if (type === 'pointercancel') return;
        canvas.dispatchEvent(new MouseEvent(type.replace('pointer', 'mouse'), init));
    }
}

if (exportPreviewForwardHost) {
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((eventName) => {
        exportPreviewForwardHost.addEventListener(eventName, (e) => {
            if (!canvas || !controls) return;
            e.preventDefault();
            e.stopPropagation();
            forwardPreviewPointerToMainCanvas(e);
        }, { passive: false });
    });

    exportPreviewForwardHost.addEventListener('wheel', (e) => {
        if (!canvas || !controls) return;
        e.preventDefault();
        e.stopPropagation();
        const forwarded = new WheelEvent('wheel', {
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
            clientX: e.clientX,
            clientY: e.clientY,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
            bubbles: true,
            cancelable: true,
        });
        canvas.dispatchEvent(forwarded);
    }, { passive: false });

    exportPreviewForwardHost.addEventListener('contextmenu', (e) => {
        if (!canvas || !controls) return;
        e.preventDefault();
        e.stopPropagation();
        canvas.dispatchEvent(new MouseEvent('contextmenu', {
            clientX: e.clientX,
            clientY: e.clientY,
            bubbles: true,
            cancelable: true,
        }));
    });
}

// ── Crop corner drag to snap aspect ratio ─────────────────────────────────────
let _cropCornerDrag = null; // { id, startX, startY, initW, initH } or null
let _pendingCanvasOrbitDrag = null;

['TL', 'TR', 'BL', 'BR'].forEach(cid => {
    const el = document.getElementById(`cropCorner${cid}`);
    if (!el) return;
    el.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation();
        _cropCornerDrag = {
            id: cid, startX: e.clientX, startY: e.clientY,
            initW: _cropSw || 100, initH: _cropSh || 100
        };
    });
    el.addEventListener('touchstart', e => {
        e.preventDefault(); e.stopPropagation();
        const t = e.touches[0];
        _cropCornerDrag = {
            id: cid, startX: t.clientX, startY: t.clientY,
            initW: _cropSw || 100, initH: _cropSh || 100
        };
    }, { passive: false });
});

function _applyCropCornerDrag(clientX, clientY) {
    if (!_cropCornerDrag || !exportFrameEnabled) return;
    const { id, startX, startY, initW, initH } = _cropCornerDrag;
    const dx = clientX - startX;
    const dy = clientY - startY;
    let dw, dh;
    if (id === 'BR') { dw = dx; dh = dy; }
    else if (id === 'BL') { dw = -dx; dh = dy; }
    else if (id === 'TR') { dw = dx; dh = -dy; }
    else { dw = -dx; dh = -dy; } // TL
    const newAspect = Math.max(0.1, Math.min(10, (initW + dw) / Math.max(1, initH + dh)));
    const best = nearestDimensionPreset(newAspect);
    if (best !== getSelectedExportDimensionsId()) {
        setSelectedExportDimensionsId(best);
        if (exportFrameEnabled) syncExportCameraFromViewport();
        updateCropDimensionsDock();
        updateEstimate();
        refreshExportPreviewNow();
        saveSettings();
    }
}

document.addEventListener('mousemove', e => _applyCropCornerDrag(e.clientX, e.clientY));
document.addEventListener('mouseup', () => { _cropCornerDrag = null; });
document.addEventListener('touchmove', e => {
    if (_cropCornerDrag) _applyCropCornerDrag(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
document.addEventListener('touchend', () => { _cropCornerDrag = null; });

// ── Export helpers ────────────────────────────────────────────────────────────
const exportProgressOverlayController = createExportProgressOverlayController({
    getOverlayEl: () => document.getElementById('exportProgressOverlay'),
    getLabelEl: () => document.getElementById('exportProgressOverlayLabel'),
    getFillEl: () => document.getElementById('exportProgressOverlayFill'),
});

function showExportProgressOverlay(msg) {
    exportProgressOverlayController.showExportProgressOverlay(msg);
}

function updateExportProgressOverlay(msg, done, total) {
    exportProgressOverlayController.updateExportProgressOverlay(msg, done, total);
}

function hideExportProgressOverlay() {
    exportProgressOverlayController.hideExportProgressOverlay();
}

const exportStatusController = createExportStatusController({
    statusEl,
    animStatusEl,
    getAnimProgressEl: () => document.getElementById('animProgress'),
    getAnimProgressFillEl: () => document.getElementById('animProgressFill'),
    onUpdateExportProgressOverlay: updateExportProgressOverlay,
});

const setStatus = (msg) => {
    exportStatusController.setStatus(msg);
};

const setAnimStatus = (msg, done, total) => {
    exportStatusController.setAnimStatus(msg, done, total);
};

const exportProgressTimingController = createExportProgressTimingController({
    nowMs: () => performance.now(),
    requestAnimationFrameFn: requestAnimationFrame,
    onPaintStatus: setAnimStatus,
});

async function maybePaintExportProgress(msg, done, total, force = false) {
    await exportProgressTimingController.maybePaintExportProgress(msg, done, total, force);
}

const exportBusyStateController = createExportBusyStateController({
    btnGif,
    btnVideo,
    btnPng,
    getJpegBtn: () => document.getElementById('btnExportJpeg'),
    getMainBtn: () => document.getElementById('btnExport'),
    setIsExporting: (nextExporting) => {
        isExporting = !!nextExporting;
    },
    showExportProgressOverlay,
    hideExportProgressOverlay,
});

const setExporting = v => {
    exportBusyStateController.setExporting(v);
};

const exportDownloadController = createExportDownloadController({
    createObjectUrl: (blob) => URL.createObjectURL(blob),
    revokeObjectUrl: (href) => URL.revokeObjectURL(href),
    createAnchor: ({ href, download }) => Object.assign(document.createElement('a'), {
        href,
        download,
    }),
    scheduleRevoke: (fn, delayMs) => setTimeout(fn, delayMs),
});

function download(data, filename, type) {
    exportDownloadController.download(data, filename, type);
}

const exportFilenameController = createExportFilenameController({
    getExportQuality: () => document.getElementById('exportQuality')?.value ?? 'std',
    getGifLoopEnabled: () => document.getElementById('gifLoop')?.checked ?? true,
    getGifDitherEnabled: () => document.getElementById('gifDither')?.checked ?? false,
    getTransparentEnabled: () => document.getElementById('exportTransparent')?.checked ?? false,
    getTransparentPngEnabled: () => document.getElementById('exportTransparentPng')?.checked,
    getImagePresetTag: () => EXPORT.image.presetTag,
    getCurrentFileName: () => currentFileName,
    getRotateMode: () => rotateModeEl.value || 'spin',
});

function getQualityTag() {
    return exportFilenameController.getQualityTag();
}

function getExportModifierTags(format) {
    return exportFilenameController.getExportModifierTags(format);
}

function buildExportFilename(format) {
    return exportFilenameController.buildExportFilename(format);
}

async function renderStillImageBlob(type, { quality = 0.92, transparent = false } = {}) {
    if (!renderer || !camera || !scene || !mesh) throw new Error('Viewer is not ready.');

    if (exportFrameEnabled) syncExportCameraFromViewport();

    const { width: W, height: H } = getImageExportSize();
    const format = type === 'image/jpeg' ? 'jpg' : 'png';
    validateExportWorkload({ format, width: W, height: H, fps: 1, frames: 1 });

    const savedAspect = camera.aspect;
    const savedZoom = camera.zoom;
    const savedCamPos = camera.position.clone();
    const savedUp = camera.up.clone();
    const savedTarget = controls?.target ? controls.target.clone() : new THREE.Vector3(0, 0, 0);

    const { target, dist, elev, az } = getOrbitFrameState();
    const exportDist = (exportFrameEnabled && exportCamDist !== null) ? exportCamDist : dist;
    const exportElev = (exportFrameEnabled && exportCamDist !== null) ? exportCamElev : elev;
    const exportZoom = (exportFrameEnabled && exportCamDist !== null) ? (exportCamZoom || 1) : (camera.zoom || 1);

    // Render directly to the main canvas at export resolution so tone-mapping,
    // antialiasing and color-space encoding are identical to the live viewport.
    // Render at 2× (SSAA) then downscale — the bilinear downscale blends the
    // extra samples, eliminating sub-pixel stairstepping on thin/diagonal edges.
    const SSAA = 2;
    const savedPR = renderer.getPixelRatio();
    const wrap = canvas.parentElement;
    const savedViewW = Math.max(1, wrap.clientWidth);
    const savedViewH = Math.max(1, wrap.clientHeight);
    renderer.setPixelRatio(1);
    renderer.setSize(W * SSAA, H * SSAA, false); // 2× buffer, CSS unchanged

    camera.aspect = W / H;
    camera.zoom = exportZoom;
    setCameraFromOrbitState(camera, target, exportDist, exportElev, az);
    camera.updateProjectionMatrix();
    const restoreExportScene = applyExportSceneForRender({ forceTransparent: transparent });
    try {
        syncLightRig();
        renderer.render(scene, camera);
    } finally {
        restoreExportScene();
    }

    // Synchronously copy the export frame to an offscreen canvas BEFORE any
    // await, so the main renderer/camera can be restored within the same JS
    // task — preventing the animation loop from seeing the oversized canvas.
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const outCtx = out.getContext('2d', { willReadFrequently: true });
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(canvas, 0, 0, W, H); // downscale 2× → SSAA
    drawRulerOverlay(outCtx, W, H, camera);

    // Restore camera exactly as the user had it, synchronously.
    camera.position.copy(savedCamPos);
    camera.up.copy(savedUp);
    camera.aspect = savedAspect;
    camera.zoom = savedZoom;
    camera.lookAt(savedTarget);
    camera.updateProjectionMatrix();
    if (controls?.target) controls.target.copy(savedTarget);
    controls?.update?.();

    // Restore renderer to the viewport size before yielding execution.
    renderer.setPixelRatio(savedPR);
    renderer.setSize(savedViewW, savedViewH, false);
    camera.aspect = savedViewW / savedViewH;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera); // repaint the visible frame immediately

    // Now encode from the offscreen copy — the main canvas is already restored.
    const blob = await new Promise(resolve => {
        if (type === 'image/jpeg') {
            out.toBlob(resolve, type, quality);
        } else {
            out.toBlob(resolve, type);
        }
    });
    if (!blob) throw new Error('Could not encode exported image.');
    return blob;
}

// Capture N frames by orbiting the camera, return array of Uint8ClampedArrays
async function captureFrames(n, dims = null, transparent = false) {
    const { width: W, height: H } = dims ?? getImageExportSize();
    validateExportWorkload({ format: 'capture', width: W, height: H, fps: EXPORT.gif.fps, frames: n });
    const frames = [];

    // Ensure export framing reflects the latest zoom/orbit right before capture.
    if (exportFrameEnabled) syncExportCameraFromViewport();

    // Render directly to the main canvas at 2x resolution for SSAA
    const SSAA = 2;
    const savedPR = renderer.getPixelRatio();
    const wrap = canvas.parentElement;
    const savedViewW = Math.max(1, wrap.clientWidth);
    const savedViewH = Math.max(1, wrap.clientHeight);
    renderer.setPixelRatio(1);
    renderer.setSize(W * SSAA, H * SSAA, false); // 2× buffer, CSS unchanged

    const savedAspect = camera.aspect;
    const savedZoom = camera.zoom;
    camera.aspect = W / H;
    const restoreExportScene = applyExportSceneForRender({ forceTransparent: transparent });

    const { target, dist, elev, az } = getOrbitFrameState();
    // Use stored export framing only in crop mode; otherwise mirror the live viewport.
    const exportDist = (exportFrameEnabled && exportCamDist !== null) ? exportCamDist : dist;
    const exportElev = (exportFrameEnabled && exportCamDist !== null) ? exportCamElev : elev;

    const exportZoom = (exportFrameEnabled && exportCamDist !== null)
        ? (exportCamZoom || 1)
        : (camera.zoom || 1);

    camera.zoom = exportZoom;
    camera.updateProjectionMatrix();
    const savedCamPos = camera.position.clone();
    const isTilt = rotateModeEl.value === 'tilt';
    const isWobble = rotateModeEl.value === 'wobble';
    const isSpinLimited = rotateModeEl.value === 'spin' && parseFloat(tiltRangeSlider.value) < 360;
    const isWobbleArc = isWobble && parseFloat(wobbleSpinRangeSlider.value) < 360;
    const baseEl = exportElev;
    const tiltSwing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value) / 2);
    const wobbleSpinSwing = THREE.MathUtils.degToRad(parseFloat(wobbleSpinRangeSlider.value) / 2);
    const spinSign = spinDir > 0 ? -1 : 1;
    const MAX_EL = Math.PI / 2 - 0.05;
    const savedMeshRx = mesh ? mesh.rotation.x : 0;

    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const outCtx = out.getContext('2d', { willReadFrequently: true });
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';

    try {
        for (let i = 0; i < n; i++) {
            if (isTilt) {
                mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * i / n) * tiltSwing;
                // Keep camera at export distance, same azimuth/elevation as starting position
                setCameraFromOrbitState(camera, target, exportDist, exportElev, az);
            } else if (isWobbleArc) {
                // Wobble arc: mesh tilts AND camera arcs (< 360° spin range)
                mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * i / n) * tiltSwing;
                const el = Math.min(baseEl, MAX_EL);
                const azimuth = az + Math.sin(2 * Math.PI * i / n) * wobbleSpinSwing;
                setCameraFromOrbitState(camera, target, exportDist, el, azimuth);
            } else if (isWobble) {
                // Wobble full spin: mesh tilts AND camera spins 360°
                mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * i / n) * tiltSwing;
                const azimuth = az + spinSign * (2 * Math.PI * i) / n;
                setCameraFromOrbitState(camera, target, exportDist, exportElev, azimuth);
            } else if (isSpinLimited) {
                const el = Math.min(baseEl, MAX_EL);
                const azimuth = az + Math.sin(2 * Math.PI * i / n) * tiltSwing;
                setCameraFromOrbitState(camera, target, exportDist, el, azimuth);
            } else {
                const azimuth = az + spinSign * (2 * Math.PI * i) / n;
                setCameraFromOrbitState(camera, target, exportDist, exportElev, azimuth);
            }

            syncLightRig();
            renderer.render(scene, camera);
            outCtx.clearRect(0, 0, W, H);
            outCtx.drawImage(canvas, 0, 0, W, H);
            drawRulerOverlay(outCtx, W, H, camera);
            frames.push(new Uint8ClampedArray(outCtx.getImageData(0, 0, W, H).data));

            await maybePaintExportProgress(`Capturing… ${i + 1} / ${n}`, i + 1, n);
        }
    } finally {
        restoreExportScene();
    }
    if (mesh) mesh.rotation.x = savedMeshRx;
    camera.position.copy(savedCamPos);
    camera.lookAt(target);
    camera.aspect = savedAspect;
    camera.zoom = savedZoom;
    camera.updateProjectionMatrix();

    // Restore renderer to the viewport size before yielding execution.
    renderer.setPixelRatio(savedPR);
    renderer.setSize(savedViewW, savedViewH, false);
    camera.aspect = savedViewW / savedViewH;
    camera.updateProjectionMatrix();
    controls.update();
    renderer.render(scene, camera); // Refresh visible canvas before encoding begins
    return frames;
}

const exportGifRuntimeController = createExportGifRuntimeController({
    getHasMesh: () => !!mesh,
    setExporting,
    requestAnimationFrameFn: requestAnimationFrame,
    getControls: () => controls,
    getExportGifConfig: () => EXPORT.gif,
    getImageExportSize,
    exportFrames,
    validateExportWorkload,
    setStatus,
    getTransparentEnabled: () => document.getElementById('exportTransparent')?.checked ?? false,
    captureFrames,
    setAnimStatus,
    scheduleYield: () => new Promise((resolve) => setTimeout(resolve, 0)),
    createGifEncoder: () => GIFEncoder(),
    quantize,
    applyPalette,
    applyPaletteDithered,
    maybePaintExportProgress,
    download,
    buildExportFilename,
    getAutoRotateRestoreState: () => !isPaused && (rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360)),
    setControlsAutoRotate: (enabled) => {
        if (controls) controls.autoRotate = !!enabled;
    },
    scheduleClearAnimStatus: () => {
        setTimeout(() => {
            setAnimStatus('');
            setStatus('');
        }, 5000);
    },
});

const exportMp4PreflightController = createExportMp4PreflightController({
    getExportFrameEnabled: () => exportFrameEnabled,
    syncExportCameraFromViewport,
    getMp4Config: () => EXPORT.mp4,
    getImageExportSize,
    exportFrames,
    validateExportWorkload,
    setStatus,
    setAnimStatus,
    scheduleClearStatus: (delayMs) => {
        setTimeout(() => {
            setStatus('');
            setAnimStatus('');
        }, delayMs);
    },
});
const exportMp4EncoderQueueController = createExportMp4EncoderQueueController({
    nowMs: () => performance.now(),
    setTimeoutFn: (fn, delayMs) => setTimeout(fn, delayMs),
    clearTimeoutFn: (id) => clearTimeout(id),
    maybePaintExportProgress,
});
const exportMp4CodecConfigController = createExportMp4CodecConfigController();
const exportMp4ScenePrepController = createExportMp4ScenePrepController({
    createCanvas: () => document.createElement('canvas'),
    applyExportSceneForRender,
});
const exportMp4RuntimeController = createExportMp4RuntimeController({
    getHasMesh: () => !!mesh,
    hasVideoEncoderSupport: () => typeof VideoEncoder !== 'undefined',
    preflightController: exportMp4PreflightController,
    setExporting,
    requestAnimationFrameFn: requestAnimationFrame,
    setControlsAutoRotate: (enabled) => {
        if (controls) controls.autoRotate = !!enabled;
    },
    setStatus,
    setAnimStatus,
    getAutoRotateRestoreState: () => !isPaused && (rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360)),
    scheduleClearStatus: (delayMs) => {
        setTimeout(() => {
            setStatus('');
            setAnimStatus('');
        }, delayMs);
    },
});

// ── Floyd-Steinberg dithering ────────────────────────────────────────────────
function applyPaletteDithered(data, palette, width, height) {
    // Build a 5-bit-per-channel LUT (32³ = 32768 slots) for fast nearest-color lookup.
    // At most 32768 linear searches (≤256 palette entries each) instead of one per pixel.
    const lut = new Int16Array(32768).fill(-1);
    function nearestFast(r, g, b) {
        const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
        if (lut[key] >= 0) return lut[key];
        let best = 0, bestD = Infinity;
        for (let c = 0; c < palette.length; c++) {
            const dr = r - palette[c][0], dg = g - palette[c][1], db = b - palette[c][2];
            const d = dr * dr + dg * dg + db * db;
            if (d < bestD) { bestD = d; best = c; }
        }
        return (lut[key] = best);
    }
    const errors = new Float32Array(data.length);
    const indices = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = Math.max(0, Math.min(255, data[i] + errors[i]));
            const g = Math.max(0, Math.min(255, data[i + 1] + errors[i + 1]));
            const b = Math.max(0, Math.min(255, data[i + 2] + errors[i + 2]));
            const idx = nearestFast(r, g, b);
            indices[y * width + x] = idx;
            const pr = palette[idx][0], pg = palette[idx][1], pb = palette[idx][2];
            const er = r - pr, eg = g - pg, eb = b - pb;
            if (x + 1 < width) { errors[i + 4] += er * 7 / 16; errors[i + 5] += eg * 7 / 16; errors[i + 6] += eb * 7 / 16; }
            if (y + 1 < height) {
                const ni = ((y + 1) * width + x) * 4;
                if (x > 0) { errors[ni - 4] += er * 3 / 16; errors[ni - 3] += eg * 3 / 16; errors[ni - 2] += eb * 3 / 16; }
                errors[ni] += er * 5 / 16; errors[ni + 1] += eg * 5 / 16; errors[ni + 2] += eb * 5 / 16;
                if (x + 1 < width) { errors[ni + 4] += er * 1 / 16; errors[ni + 5] += eg * 1 / 16; errors[ni + 6] += eb * 1 / 16; }
            }
        }
    }
    return indices;
}

// ── GIF export ────────────────────────────────────────────────────────────────
btnGif.addEventListener('click', async () => {
    await exportGifRuntimeController.runGifExport();
});

// ── Video export (H.264 MP4 via WebCodecs + mp4-muxer) ───────────────────────
btnVideo.addEventListener('click', async () => {
    await exportMp4RuntimeController.runMp4Export({
        runEncodeFlow: async ({ fps, bitrate, W, H, n, totalFrames }) => {

        // Render directly to the main canvas at 2x resolution for SSAA
        const SSAA = 2;
        const savedPR = renderer.getPixelRatio();
        const wrap = canvas.parentElement;
        const savedViewW = Math.max(1, wrap.clientWidth);
        const savedViewH = Math.max(1, wrap.clientHeight);
        renderer.setPixelRatio(1);
        renderer.setSize(W * SSAA, H * SSAA, false); // 2× buffer, CSS unchanged

        const savedAspect = camera.aspect;
        const savedZoom = camera.zoom;
        camera.aspect = W / H;

        const muxer = new Muxer({
            target: new ArrayBufferTarget(),
            video: { codec: 'avc', width: W, height: H },
            fastStart: 'in-memory',
        });

        let encoderError = null;
        const encoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: e => { encoderError = e; },
        });
        // avc1.4200XX — Baseline profile
        // level 3.1 (0x1f) up to 720p, level 4.0 (0x28) up to 1080p, level 5.1 (0x33) up to 4K/2048x2048
        exportMp4CodecConfigController.configureMp4Encoder({
            encoder,
            width: W,
            height: H,
            bitrate,
            fps,
        });

        const { target, dist, elev, az } = getOrbitFrameState();
        // Use stored export framing only in crop mode; otherwise mirror the live viewport.
        const exportDist = (exportFrameEnabled && exportCamDist !== null) ? exportCamDist : dist;
        const exportElev = (exportFrameEnabled && exportCamDist !== null) ? exportCamElev : elev;

        const exportZoom = (exportFrameEnabled && exportCamDist !== null)
            ? (exportCamZoom || 1)
            : (camera.zoom || 1);

        camera.zoom = exportZoom;
        camera.updateProjectionMatrix();
        const savedCamPos = camera.position.clone();
        const isTilt = rotateModeEl.value === 'tilt';
        const isWobble = rotateModeEl.value === 'wobble';
        const isSpinLimited = rotateModeEl.value === 'spin' && parseFloat(tiltRangeSlider.value) < 360;
        const isWobbleArc = isWobble && parseFloat(wobbleSpinRangeSlider.value) < 360;
        const baseEl = exportElev;
        const tiltSwing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value) / 2);
        const wobbleSpinSwing = THREE.MathUtils.degToRad(parseFloat(wobbleSpinRangeSlider.value) / 2);
        const spinSign = spinDir > 0 ? -1 : 1;
        const MAX_EL = Math.PI / 2 - 0.05;
        const savedMeshRx = mesh ? mesh.rotation.x : 0;
        const {
            out,
            outCtx,
            restoreExportScene,
        } = exportMp4ScenePrepController.prepareMp4Scene({
            width: W,
            height: H,
            exportBgColorChecked: exportBgColorEl?.checked ?? true,
        });
        if (!out || !outCtx) {
            throw new Error('Could not prepare MP4 export canvas.');
        }

        try {
            for (let f = 0; f < totalFrames; f++) {
                if (isTilt) {
                    mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * f / n) * tiltSwing;
                    setCameraFromOrbitState(camera, target, exportDist, exportElev, az);
                } else if (isWobbleArc) {
                    // Wobble arc: mesh tilts AND camera arcs
                    mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * f / n) * tiltSwing;
                    const el = Math.min(baseEl, MAX_EL);
                    const azimuth = az + Math.sin(2 * Math.PI * f / n) * wobbleSpinSwing;
                    setCameraFromOrbitState(camera, target, exportDist, el, azimuth);
                } else if (isWobble) {
                    // Wobble full spin: mesh tilts AND camera spins 360°
                    mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * f / n) * tiltSwing;
                    const azimuth = az + spinSign * (2 * Math.PI * f) / n;
                    setCameraFromOrbitState(camera, target, exportDist, exportElev, azimuth);
                } else if (isSpinLimited) {
                    const el = Math.min(baseEl, MAX_EL);
                    const azimuth = az + Math.sin(2 * Math.PI * f / n) * tiltSwing;
                    setCameraFromOrbitState(camera, target, exportDist, el, azimuth);
                } else {
                    const azimuth = az + spinSign * (2 * Math.PI * f) / n;
                    setCameraFromOrbitState(camera, target, exportDist, exportElev, azimuth);
                }

                syncLightRig();
                renderer.render(scene, camera);
                outCtx.clearRect(0, 0, W, H);
                outCtx.drawImage(canvas, 0, 0, W, H);
                drawRulerOverlay(outCtx, W, H, camera);

                const timestamp = Math.round(f * (1_000_000 / fps));
                const frame = new VideoFrame(out, { timestamp });
                if (encoderError) { frame.close(); throw encoderError; }
                if (encoder.state === 'closed') { frame.close(); throw new Error('VideoEncoder closed unexpectedly — try a lower resolution or bitrate.'); }
                await exportMp4EncoderQueueController.waitForEncoderQueue({
                    encoder,
                    getEncoderError: () => encoderError,
                    maxQueue: 24,
                    frameIndex: f,
                    total: totalFrames,
                });
                encoder.encode(frame, { keyFrame: f % 30 === 0 });
                frame.close();

                await maybePaintExportProgress(`Encoding… ${f + 1} / ${totalFrames}`, f + 1, totalFrames);
            }

            setAnimStatus('Finalizing video…', totalFrames, totalFrames);
            await new Promise(r => setTimeout(r, 0));
            await encoder.flush();
            if (encoderError) throw encoderError;
            muxer.finalize();
        } finally {
            restoreExportScene();
        }

        if (mesh) mesh.rotation.x = savedMeshRx;
        camera.position.copy(savedCamPos);
        camera.lookAt(target);
        camera.aspect = savedAspect;
        camera.zoom = savedZoom;
        camera.updateProjectionMatrix();

        renderer.setPixelRatio(savedPR);
        renderer.setSize(savedViewW, savedViewH, false);
        camera.aspect = savedViewW / savedViewH;
        camera.updateProjectionMatrix();

        controls.update();
        renderer.render(scene, camera); // Refresh visible canvas before download

        download(muxer.target.buffer, buildExportFilename('mp4'), 'video/mp4');
        setAnimStatus('MP4 saved ✓');
        },
    });
});

// ── Restore on load ───────────────────────────────────────────────────────────
initTextureNewsUI();

function finishRestoreSessionState() {
    // Remove anti-FOUC guard once session restore attempt is complete,
    // whether it succeeded (html.loaded is set) or not.
    // Ensure preview reflects restored transparent setting immediately
    try { syncTransparentCheckboxes('exportTransparent'); } catch (e) { }
    document.documentElement.classList.add('loaded');
    dismissStartupSplash();
    document.documentElement.classList.remove('has-session');
}

requestAnimationFrame(() => {
    setTimeout(() => {
        loadColorRules().finally(() => {
            initPresetGallery();
            updateShadeSliderVisual();
            updateBgShadeSliderVisual();
            updateBuildPlateShadeSliderVisual();
        }).then(() => restoreSession()).finally(finishRestoreSessionState);
    }, 0);
});

let QUICK_PRESETS = [];

function reconcileModelPresetFromSettings(force = false) {
    // If presets aren't loaded yet or the user already has a non-custom active
    // preset, nothing to do.
    if (!QUICK_PRESETS || QUICK_PRESETS.length === 0) return;
    if (!force && activeModelPreset && activeModelPreset !== 'custom') return;

    activeModelPreset = 'custom';

    const selectedSettings = getSelectedPartSettings();
    const curMaterialFamily = getMaterialFamilyFromPartSettings(selectedSettings);
    const curColor = colorPick?.value ? colorPick.value.toLowerCase() : null;
    const curFinishMode = getFinishModeFromPartSettings(selectedSettings);
    const curFinishValue = finishSliderValueFromPartSettings(selectedSettings);
    for (const preset of QUICK_PRESETS) {
        if (!preset || !preset.url) continue;
        try {
            const p = getURLSettings(preset.url);
            if (!p) continue;
            const presetMaterialFamily = p.materialFamily || getMaterialFamilyFromShading(p.shading || 'phong');
            // Match by material family first, then color when provided by preset
            if (presetMaterialFamily && curMaterialFamily && presetMaterialFamily === curMaterialFamily) {
                // Compare roughness/reflection using the current family's active tuning channel.
                const isMetallic = presetMaterialFamily === 'metallic';
                const isClear = presetMaterialFamily === 'clear';
                if (!isMetallic && !isClear) {
                    const presetFinishMode = p.finishMode || null;
                    const presetFinishValue = p.finishValue != null ? clampFinishSliderValue(p.finishValue) : null;
                    const finishModeMatches = !presetFinishMode || presetFinishMode === curFinishMode;
                    const finishValueMatches = presetFinishValue == null || presetFinishValue === curFinishValue;
                    if ((!p.color || (curColor && p.color.toLowerCase() === curColor)) && finishModeMatches && finishValueMatches) {
                        activeModelPreset = preset.id;
                        return;
                    }
                }
                const presetRough = isMetallic
                    ? (p.textureTuneMetallicRoughness != null ? String(p.textureTuneMetallicRoughness) : null)
                    : isClear
                        ? (p.textureTunePhongRoughness != null ? String(p.textureTunePhongRoughness) : null)
                        : (p.textureTuneMatteRoughness != null ? String(p.textureTuneMatteRoughness) : null);
                const presetRefl = isMetallic
                    ? (p.textureTuneMetallicReflection != null ? String(p.textureTuneMetallicReflection) : null)
                    : isClear
                        ? (p.textureTunePhongReflection != null ? String(p.textureTunePhongReflection) : null)
                        : (p.textureTuneMatteReflection != null ? String(p.textureTuneMatteReflection) : null);
                const curRough = isMetallic
                    ? (selectedSettings?.metallicRoughness != null ? String(selectedSettings.metallicRoughness) : null)
                    : isClear
                        ? (selectedSettings?.phongRoughness != null ? String(selectedSettings.phongRoughness) : null)
                        : (selectedSettings?.matteRoughness != null ? String(selectedSettings.matteRoughness) : null);
                const curRefl = isMetallic
                    ? (selectedSettings?.metallicReflection != null ? String(selectedSettings.metallicReflection) : null)
                    : isClear
                        ? (selectedSettings?.phongReflection != null ? String(selectedSettings.phongReflection) : null)
                        : (selectedSettings?.matteReflection != null ? String(selectedSettings.matteReflection) : null);

                const roughMatches = !presetRough || (curRough && presetRough === curRough);
                const reflMatches = !presetRefl || (curRefl && presetRefl === curRefl);

                if (!p.color || (curColor && p.color.toLowerCase() === curColor)) {
                    if (roughMatches && reflMatches) {
                        activeModelPreset = preset.id;
                        return;
                    }
                }
            }
        } catch (e) { /* ignore parsing errors */ }
    }
}

fetch('presets.json')
    .then(r => r.json())
    .then(data => {
        QUICK_PRESETS = data;
        // Try to infer which preset matches restored settings before rendering
        try { reconcileModelPresetFromSettings(); } catch (e) { }
        renderModelPresets();
    })
    .catch(err => console.error("Could not load presets.json", err));

const BG_PRESETS = [
    { id: 'white', name: 'White', color: PALETTE.preset.white },
    { id: 'black', name: 'Black', color: PALETTE.preset.black },
    { id: 'modelcolor', name: 'Model Sync', color: null }
];

const BUILD_PLATE_PRESETS = [
    { id: 'white', name: 'White', color: PALETTE.preset.white },
    { id: 'black', name: 'Black', color: PALETTE.preset.black },
    { id: 'modelcolor', name: 'Model Sync', color: null }
];

function getBgPresetDefaultTone(presetId) {
    return getPresetShadeDefault('background', presetId, 0);
}

function getBuildPlatePresetDefaultTone(presetId) {
    return getPresetShadeDefault('buildPlate', presetId, 0);
}

function getModelPresetDefaultTone(presetId, fallback = 0) {
    return getPresetShadeDefault('model', presetId, fallback);
}

function getPresetShadeDefault(scope, presetId, fallback = 0) {
    const safeScope = (scope === 'buildPlate' || scope === 'model') ? scope : 'background';
    const key = String(presetId || '').trim().toLowerCase();
    const raw = getColorRuleValue(`presetShadeDefaults.${safeScope}.${key}`, null);
    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(-100, Math.min(100, parsed));
    return fallback;
}

function getShadeStopValues(rulePath) {
    const defaultRule = DEFAULT_COLOR_RULES[rulePath] || {};
    const snapCount = Math.max(3, Math.round(getColorRuleNumber(`${rulePath}.snapCount`, defaultRule.snapCount ?? 9)));
    if (snapCount === 1) return [0];
    const step = 200 / (snapCount - 1);
    return Array.from({ length: snapCount }, (_, idx) => Math.round(-100 + (step * idx)));
}

function getManualBgTone() {
    return bgOpacitySlider ? Math.round(getSliderEffectiveValue(bgOpacitySlider)) : AUTO_BRIGHTNESS_RULES.background.shade;
}

function applyBackgroundFromBaseColor(baseHex) {
    if (!renderer) return;
    if (isDynamicBg) {
        renderer.setClearColor(computeAutoBrightnessColor(baseHex), 1);
        return;
    }
    if (activeBgPreset === 'modelcolor') {
        renderer.setClearColor(baseHex, 1);
        return;
    }
    renderer.setClearColor(computeSurfaceShadeColor(baseHex, getManualBgTone()), 1);
}

function computeAutoBrightnessColor(baseHex) {
    return ShadeSystem.computeBackgroundAutoBrightnessColor(baseHex);
}

// Moved to modules/shade-system.js module


function applyBgPresetDefaultTone(presetId) {
    if (!bgOpacitySlider) return;
    const tone = getBgPresetDefaultTone(presetId);
    bgOpacitySlider.value = String(tone);
    bgOpacitySlider.dispatchEvent(new Event('input', { bubbles: true }));
}

function updateDynamicBg() {
    if (!isDynamicBg || !renderer) return;
    let baseHex;
    if (activeBgPreset === 'modelcolor') {
        baseHex = getModelSyncSourceColor();
    } else {
        baseHex = bgPick.value;
    }
    renderer.setClearColor(computeAutoBrightnessColor(baseHex), 1);
}

// Hook model color changes to update dynamic bg and Model preset swatch
colorPick.addEventListener('input', updateDynamicBg);
colorPick.addEventListener('input', updateFinishSliderVisual);
colorPick.addEventListener('input', () => {
    // Update model custom swatch fill
    const svgCircle = document.querySelector('#customModelThumb circle');
    if (svgCircle) svgCircle.setAttribute('fill', colorPick.value);
    // If Model bg preset is active, update the actual bg
    if (activeBgPreset === 'modelcolor') {
        const syncColor = getModelSyncSourceColor();
        bgPick.value = syncColor;
        // Only apply directly to renderer if auto-adjust is off
        // (updateDynamicBg above handles it when isDynamicBg is true)
        if (!isDynamicBg) {
            applyBackgroundFromBaseColor(syncColor);
        }
    }
});

// SVG rainbow ring for custom swatches — matches the provided design SVG
function rainbowRingSvg(svgId, fillColor) {
    const gid = `rr-${svgId}`;
    return `<svg id="${svgId}" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44" fill="none" style="display:block;cursor:pointer;"><circle cx="22" cy="22" r="19.5" fill="${fillColor}" stroke="url(#${gid})" stroke-width="3"/><defs><radialGradient id="${gid}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(43 18) rotate(156.894) scale(43.7)"><stop stop-color="${PALETTE.gradient.rainbow1}"/><stop offset="0.240385" stop-color="${PALETTE.gradient.rainbow2}"/><stop offset="0.538462" stop-color="${PALETTE.gradient.rainbow3}"/><stop offset="0.740385" stop-color="${PALETTE.gradient.rainbow4}"/><stop offset="0.9375" stop-color="${PALETTE.gradient.rainbow5}"/></radialGradient></defs></svg>`;
}

let customModelSettingsByPart = {};

function storeCustomSettings() {
    const idx = Math.max(0, modelPartSelected || 0);
    const s = getSelectedPartSettings();
    customModelSettingsByPart[idx] = { ...s };
}

function updateModelSelection() {
    document.querySelectorAll('#quickPresetsBar .shading-option').forEach(el => el.classList.remove('is-selected'));

    if (activeModelPreset === 'custom') {
        const customOpt = document.querySelector('#quickPresetsBar .custom-color-option');
        if (customOpt) customOpt.classList.add('is-selected');
        // Show sphere fill + overlay when selected
        const svgCircle = document.querySelector('#customModelThumb circle');
        if (svgCircle) svgCircle.setAttribute('fill', colorPick.value);
        const overlay = document.getElementById('customModelSphereOverlay');
        if (overlay) {
            overlay.style.display = 'block';
            overlay.style.background = 'radial-gradient(circle at 36% 32%, rgba(255,255,255,0.6) 5%, transparent 40%, rgba(0,0,0,0.3) 100%)';
        }
    } else {
        // Blank the custom swatch when not selected
        const svgCircle = document.querySelector('#customModelThumb circle');
        if (svgCircle) svgCircle.setAttribute('fill', 'transparent');
        const overlay = document.getElementById('customModelSphereOverlay');
        if (overlay) overlay.style.display = 'none';

        if (activeModelPreset.startsWith('custom-slot-')) {
            const slotIdx = activeModelPreset.replace('custom-slot-', '');
            const slotInner = document.getElementById('custom-slot-' + slotIdx);
            if (slotInner) {
                const parentOpt = slotInner.closest('.shading-option');
                if (parentOpt) parentOpt.classList.add('is-selected');
            }
        } else {
            const presetInner = document.getElementById('model-preset-' + activeModelPreset);
            if (presetInner) {
                const parentOpt = presetInner.closest('.shading-option');
                if (parentOpt) parentOpt.classList.add('is-selected');
            }
        }
    }
}

// Hook all manual changes to revert to custom mode (trusted user events only)
[colorPick, shadingEl].forEach(el => {
    if (el) el.addEventListener('input', (ev) => {
        if (!ev.isTrusted) return;
        activeModelPreset = 'custom';
        storeCustomSettings();
        updateModelSelection();
    });
    if (el) el.addEventListener('change', (ev) => {
        if (!ev.isTrusted) return;
        activeModelPreset = 'custom';
        storeCustomSettings();
        updateModelSelection();
    });
});
if (opacitySlider) {
    opacitySlider.addEventListener('input', (ev) => {
        if (!ev.isTrusted) return;
        activeModelPreset = 'custom';
        storeCustomSettings();
        updateModelSelection();
    });
}

function applyModelPresetOnly(preset) {
    if (!preset?.url) return;
    const p = getURLSettings(preset.url);
    if (!p) return;

    const targetIndices = getModelPartEditTargetIndices();
    const prevClearLikeByTarget = new Map();
    targetIndices.forEach((idx) => {
        const prevShading = getPartSettings(idx)?.shading;
        prevClearLikeByTarget.set(idx, prevShading === 'clear' || prevShading === 'glass');
    });

    const targets = applyToModelPartEditTargets((partSettings, idx) => {
        applyPresetIntoPartSettings(partSettings, p, preset.id);
        modelPartBaseColors[idx] = partSettings.color;
    });
    syncUIFromSelectedPart();

    if (mesh) {
        const needsRebuild = targets.some((idx) => {
            const prevClearLike = !!prevClearLikeByTarget.get(idx);
            const nextShading = getPartSettings(idx)?.shading;
            const nextClearLike = nextShading === 'clear' || nextShading === 'glass';
            return prevClearLike !== nextClearLike;
        });
        if (needsRebuild) {
            rebuildMeshMaterialsForCurrentShading();
        } else {
            applyPartColorsToMesh();
            applyCurrentTextureTuning();
        }
    }
    // Keep each part's custom baseline aligned to its latest preset-applied state.
    targets.forEach((idx) => {
        customModelSettingsByPart[idx] = { ...getPartSettings(idx) };
    });

    activeModelPreset = preset.id;

    // If background is already synced to model color, re-sync to the new color.
    if (activeBgPreset === 'modelcolor') {
        bgPick.value = getModelSyncSourceColor();
        if (isDynamicBg) updateDynamicBg();
        else renderer && renderer.setClearColor(new THREE.Color(bgPick.value), 1);
    }

    updateTextureTuneUI();
    updateShadingThumbs();
    updateColorSwatches();
    updateModelSelection();
    updateBgSelection();
    scheduleModelPresetCommit(targets);
}


function renderModelPresets() {
    const bar = document.getElementById('quickPresetsBar');
    if (!bar) return;

    bar.innerHTML = '';
    bar.style.display = 'grid';
    bar.style.gridTemplateColumns = 'repeat(4, 1fr)';
    bar.style.gap = '8px';

    // Always show all 7 named presets + Custom (8 total)
    QUICK_PRESETS.forEach((preset) => {
        const wrap = document.createElement('div');
        wrap.className = 'thumb-card-wrap';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.alignItems = 'center';

        const ts = preset.thumb || {
            bg: preset.color || PALETTE.fallback,
            overlay: 'radial-gradient(circle at 36% 32%, rgba(255,255,255,0.6) 5%, transparent 40%, rgba(0,0,0,0.3) 100%)',
            extra: '',
        };
        wrap.innerHTML = `
            <label class="shading-option preset-option" title="Apply ${preset.name}">
                <span class="shading-thumb" id="model-preset-${preset.id}" style="border-radius:50%;width:44px;height:44px;background-color:${ts.bg};position:relative;overflow:hidden;background-clip:padding-box;${ts.extra || ''}">
                    <span style="position:absolute;inset:0;background:${ts.overlay};"></span>
                </span>
            </label>
            <span class="thumb-label">${preset.name}</span>
        `;
        const actionArea = wrap.querySelector('.shading-option');
        actionArea.addEventListener('click', () => {
            clearPresetHoverPreview();
            if (activeModelPreset === 'custom') storeCustomSettings();

            if (preset.url) {
                applyModelPresetOnly(preset);
            } else {
                activeModelPreset = preset.id;
            }
            updateModelSelection();
            saveSettings();
        });
        bar.appendChild(wrap);
    });

    // Custom preset slot (always at position 8) — blank until selected
    const customWrap = document.createElement('div');
    customWrap.className = 'thumb-card-wrap';
    customWrap.style.display = 'flex';
    customWrap.style.flexDirection = 'column';
    customWrap.style.alignItems = 'center';

    // Always render with transparent fill; updateModelSelection will fill when active
    customWrap.innerHTML = `
        <label class="shading-option custom-color-option" title="Custom color — click to pick" style="cursor:pointer;position:relative;">
            ${rainbowRingSvg('customModelThumb', 'transparent')}
            <span id="customModelSphereOverlay" style="position:absolute;inset:3px;border-radius:50%;pointer-events:none;display:none;"></span>
        </label>
        <span class="thumb-label">Custom</span>
    `;

    customWrap.querySelector('.shading-option').addEventListener('click', () => {
        activeModelPreset = 'custom';
        const details = document.getElementById('advSettingsDetails');
        if (details) details.open = true;
        // Expand the extra sliders if hidden
        const advExtra = document.getElementById('advModelExtra');
        const advToggle = document.getElementById('advModelToggle');
        if (advExtra && advExtra.hidden) {
            advExtra.hidden = false;
            if (advToggle) advToggle.textContent = advToggle.dataset.labelLess || 'Show Less';
            try { localStorage.setItem('rotater_advModelCollapsed', '1'); } catch (_) { }
        }
        const idx = Math.max(0, modelPartSelected || 0);
        const currentSettings = { ...getSelectedPartSettings() };
        const preservedFinishMode = getFinishModeFromPartSettings(currentSettings);
        const preservedFinishValue = finishSliderValueFromPartSettings(currentSettings);
        const customModelSettings = customModelSettingsByPart[idx] || { ...currentSettings };

        // Restore the part's custom profile but preserve the current finish state
        // so clicking Custom never forces Gloss/Satin/Matte changes.
        // If coming from Clear/Glass, reset to phong so custom color is solid.
        const resolvedShading = (currentSettings.shading === 'clear' || currentSettings.shading === 'glass')
            ? 'phong' : currentSettings.shading;
        modelPartSettings[idx] = {
            ...customModelSettings,
            shading: resolvedShading,
            metallicRoughness: currentSettings.metallicRoughness,
            metallicMetalness: currentSettings.metallicMetalness,
            metallicReflection: currentSettings.metallicReflection,
            phongRoughness: currentSettings.phongRoughness,
            phongReflection: currentSettings.phongReflection,
            matteRoughness: currentSettings.matteRoughness,
            matteReflection: currentSettings.matteReflection,
            finishMode: preservedFinishMode,
            finishValue: preservedFinishValue,
        };
        // Keep stored finish metadata and material tuning in lockstep.
        applyFinishModeValueToPartSettings(modelPartSettings[idx], preservedFinishMode, preservedFinishValue);
        modelPartBaseColors[idx] = modelPartSettings[idx].color || modelPartBaseColors[idx] || colorPick.value;
        activeModelPreset = 'custom';
        syncUIFromSelectedPart();
        if (mesh) rebuildMeshMaterialsForCurrentShading();
        persistCurrentMultipartParts();
        queueModelPartThumbsRender();
        updateModelSelection();
        // Open picker near the clicked swatch so browser anchoring is stable.
        const swatch = customWrap.querySelector('.shading-option');
        const rect = swatch?.getBoundingClientRect?.();
        const prev = {
            position: colorPick.style.position,
            left: colorPick.style.left,
            top: colorPick.style.top,
            width: colorPick.style.width,
            height: colorPick.style.height,
            clip: colorPick.style.clip,
            pointerEvents: colorPick.style.pointerEvents,
            opacity: colorPick.style.opacity,
        };
        if (rect) {
            Object.assign(colorPick.style, {
                position: 'absolute',
                left: `${rect.left + window.scrollX}px`,
                top: `${rect.top + window.scrollY}px`,
                width: `${Math.max(1, Math.floor(rect.width))}px`,
                height: `${Math.max(1, Math.floor(rect.height))}px`,
                clip: 'auto',
                pointerEvents: 'auto',
                opacity: '0',
            });
        } else {
            colorPick.style.width = '1px';
            colorPick.style.height = '1px';
            colorPick.style.pointerEvents = 'auto';
        }
        try { colorPick.showPicker(); } catch (e) { colorPick.click(); }
        setTimeout(() => {
            Object.assign(colorPick.style, {
                position: prev.position || 'absolute',
                left: prev.left || '',
                top: prev.top || '',
                width: prev.width || '0px',
                height: prev.height || '0px',
                clip: prev.clip || 'rect(0,0,0,0)',
                pointerEvents: prev.pointerEvents || 'none',
                opacity: prev.opacity || '0',
            });
        }, 240);
    });
    customWrap.querySelector('.shading-option').addEventListener('mouseenter', clearPresetHoverPreview);
    customWrap.querySelector('.shading-option').addEventListener('focus', clearPresetHoverPreview);
    bar.appendChild(customWrap);

    // Initial call
    requestAnimationFrame(updateModelSelection);
}


function updateBgSelection() {
    document.querySelectorAll('#bgPresetsBar .shading-option').forEach(el => el.classList.remove('is-selected'));

    if (activeBgPreset === 'custom') {
        const customBgInner = document.getElementById('customBgThumb');
        if (customBgInner) {
            const parentOpt = customBgInner.closest('.shading-option');
            if (parentOpt) parentOpt.classList.add('is-selected');
        }
        // Fill the swatch with current bg color + sphere overlay when selected
        const svgCircle = document.querySelector('#customBgThumb circle');
        if (svgCircle) svgCircle.setAttribute('fill', bgPick.value);
        const overlay = document.getElementById('customBgSphereOverlay');
        if (overlay) {
            overlay.style.display = 'block';
            overlay.style.background = 'radial-gradient(circle at 36% 32%, rgba(255,255,255,0.5) 5%, transparent 40%, rgba(0,0,0,0.25) 100%)';
        }
    } else {
        // Blank the custom swatch
        const svgCircle = document.querySelector('#customBgThumb circle');
        if (svgCircle) svgCircle.setAttribute('fill', 'transparent');
        const overlay = document.getElementById('customBgSphereOverlay');
        if (overlay) overlay.style.display = 'none';

        const bgInner = document.getElementById('bg-preset-' + activeBgPreset);
        if (bgInner) {
            const parentOpt = bgInner.closest('.shading-option');
            if (parentOpt) parentOpt.classList.add('is-selected');
        }
    }
    updateBgShadeSliderVisual();
    syncBgModelSyncSourceUI();
    syncModelPartSelectorUI();
}

function updateBuildPlateSelection() {
    document.querySelectorAll('#buildPlatePresetsBar .shading-option').forEach(el => el.classList.remove('is-selected'));

    if (activeBuildPlatePreset === 'custom') {
        const customThumb = document.getElementById('customBuildPlateThumb');
        if (customThumb) {
            const parentOpt = customThumb.closest('.shading-option');
            if (parentOpt) parentOpt.classList.add('is-selected');
        }
        const svgCircle = document.querySelector('#customBuildPlateThumb circle');
        if (svgCircle) svgCircle.setAttribute('fill', buildPlateColor || getActiveBuildPlateBaseColor());
        const overlay = document.getElementById('customBuildPlateSphereOverlay');
        if (overlay) {
            overlay.style.display = 'block';
            overlay.style.background = 'radial-gradient(circle at 36% 32%, rgba(255,255,255,0.5) 5%, transparent 40%, rgba(0,0,0,0.25) 100%)';
        }
    } else {
        const svgCircle = document.querySelector('#customBuildPlateThumb circle');
        if (svgCircle) svgCircle.setAttribute('fill', 'transparent');
        const overlay = document.getElementById('customBuildPlateSphereOverlay');
        if (overlay) overlay.style.display = 'none';

        const presetThumb = document.getElementById('build-plate-preset-' + activeBuildPlatePreset);
        if (presetThumb) {
            const parentOpt = presetThumb.closest('.shading-option');
            if (parentOpt) parentOpt.classList.add('is-selected');
        }
    }
    syncBuildPlateModelSyncSourceUI();
}

function syncBuildPlateModelSyncSourceUI() {
    if (!buildPlateModelSyncSourceWrap || !buildPlateModelSyncSelectorMenu || !buildPlateModelSyncSelectorBtn) return;
    const visible = activeBuildPlatePreset === 'modelcolor' && modelPartNames.length > 0;
    buildPlateModelSyncSourceWrap.hidden = false;
    buildPlateModelSyncSourceWrap.setAttribute('aria-hidden', 'true');
    if (!visible) {
        buildPlateModelSyncSelectorMenu.innerHTML = '';
        buildPlateModelSyncSelectorMenu.hidden = true;
        buildPlateModelSyncSelectorBtn.setAttribute('aria-expanded', 'false');
        if (buildPlateModelSyncSelectorText) buildPlateModelSyncSelectorText.textContent = '';
        return;
    }

    buildPlateSyncPartIndex = Math.max(0, Math.min(buildPlateSyncPartIndex, modelPartNames.length - 1));
    buildPlateModelSyncSelectorMenu.innerHTML = '';
    buildPlateModelSyncSelectorMenu.hidden = true;
    buildPlateModelSyncSelectorBtn.setAttribute('aria-expanded', 'false');
    modelPartNames.forEach((name, idx) => {
        const safeName = escapeHtml(name);
        const opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'thumb-select-option';
        if (idx === buildPlateSyncPartIndex) opt.classList.add('is-bg-sync-source');
        opt.dataset.partIndex = String(idx);
        opt.setAttribute('role', 'option');
        opt.innerHTML = `<canvas class="thumb-select-option-canvas js-part-thumb-preview" data-part-index="${idx}" width="68" height="68" aria-hidden="true"></canvas><span class="thumb-select-option-text">${safeName}</span>`;
        const optCanvas = opt.querySelector('.thumb-select-option-canvas');
        paintThumbFallback(optCanvas, idx);
        opt.addEventListener('click', () => {
            buildPlateSyncPartIndex = idx;
            activeBuildPlatePreset = 'modelcolor';
            closeThumbSelectMenus();
            updateBuildPlateMaterial();
            updateBuildPlateSelection();
            refreshExportPreviewNow();
            saveSettings();
        });
        buildPlateModelSyncSelectorMenu.appendChild(opt);
    });

    if (buildPlateModelSyncSelectorThumb) {
        buildPlateModelSyncSelectorThumb.classList.add('js-part-thumb-preview');
        buildPlateModelSyncSelectorThumb.dataset.partIndex = String(buildPlateSyncPartIndex);
        paintThumbFallback(buildPlateModelSyncSelectorThumb, buildPlateSyncPartIndex);
        renderSinglePartThumbnail(buildPlateModelSyncSelectorThumb, buildPlateSyncPartIndex);
    }
    const buildPresetThumbCanvas = document.getElementById('build-plate-preset-modelcolor-canvas');
    if (buildPresetThumbCanvas instanceof HTMLCanvasElement) {
        buildPresetThumbCanvas.classList.add('js-part-thumb-preview');
        buildPresetThumbCanvas.dataset.partIndex = String(buildPlateSyncPartIndex);
        paintThumbFallback(buildPresetThumbCanvas, buildPlateSyncPartIndex);
        renderSinglePartThumbnail(buildPresetThumbCanvas, buildPlateSyncPartIndex);
    }
    if (buildPlateModelSyncSelectorText) {
        const selectedName = modelPartNames[buildPlateSyncPartIndex] || `Part ${buildPlateSyncPartIndex + 1}`;
        buildPlateModelSyncSelectorText.textContent = `Sync: ${selectedName}`;
        buildPlateModelSyncSelectorBtn.title = `Surface sync: ${selectedName}`;
        const buildPresetThumb = document.getElementById('build-plate-preset-modelcolor');
        if (buildPresetThumb) buildPresetThumb.title = `Model Sync: ${selectedName}`;
    }
    updateBuildPlateShadeControlVisibility();
    queueModelPartThumbsRender();
}

// Hook manual color-picker changes to switch to custom (only real user interaction, not preset dispatch)
bgPick.addEventListener('input', (ev) => {
    if (ev.isTrusted) {
        activeBgPreset = 'custom';
        updateBgSelection();
    }
});

// Wire Auto-adjust checkbox
const autoBgCheckEl = document.getElementById('autoBgCheck');
if (autoBgCheckEl) {
    autoBgCheckEl.addEventListener('change', () => {
        if (typeof cancelBgShadeRevealAnimation === 'function') {
            cancelBgShadeRevealAnimation();
            cancelBgShadeRevealAnimation = null;
        }

        const nextAutoBg = !!autoBgCheckEl.checked;
        const wasAutoBg = !!isDynamicBg;
        const autoShade = Math.max(-100, Math.min(100, parseInt(String(AUTO_BRIGHTNESS_RULES.background.shade), 10) || 0));

        if (nextAutoBg && !wasAutoBg && bgOpacitySlider) {
            const fromShade = Math.max(-100, Math.min(100, Math.round(getSliderEffectiveValue(bgOpacitySlider)) || 0));
            lastManualBgShade = fromShade;
            isDynamicBg = false;
            bgOpacitySlider.value = String(fromShade);
            bgOpacitySlider.disabled = false;
            if (bgOpacitySliderLabel) bgOpacitySliderLabel.hidden = false;
            syncBgShadeReadout();
            updateBgShadeSliderVisual();

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    cancelBgShadeRevealAnimation = animateShadeSliderValue(
                        bgOpacitySlider,
                        fromShade,
                        autoShade,
                        (nextValue) => {
                            const tone = Math.max(-100, Math.min(100, Math.round(nextValue) || 0));
                            const baseColor = (activeBgPreset === 'modelcolor') ? getModelSyncSourceColor() : getActiveBackgroundBaseColor();
                            if (activeBgPreset === 'modelcolor') bgPick.value = baseColor;
                            if (renderer) renderer.setClearColor(computeSurfaceShadeColor(baseColor, tone), 1);
                            syncBgShadeReadout();
                            updateBgShadeSliderVisual();
                        },
                        () => {
                            cancelBgShadeRevealAnimation = null;
                            isDynamicBg = true;
                            updateAutoBgShadeControlVisibility();
                            updateDynamicBg();
                            syncBgShadeReadout();
                            updateBgShadeSliderVisual();
                            saveSettings();
                            updateCardResetButtonStates();
                        }
                    );
                });
            });
            return;
        }

        isDynamicBg = nextAutoBg;

        if (bgOpacitySlider && nextAutoBg) {
            lastManualBgShade = Math.max(-100, Math.min(100, Math.round(getSliderEffectiveValue(bgOpacitySlider)) || 0));
            bgOpacitySlider.value = String(autoShade);
        }

        updateAutoBgShadeControlVisibility();

        if (!nextAutoBg && wasAutoBg && bgOpacitySlider) {
            const manualShade = Number(lastManualBgShade);
            const targetShade = Number.isFinite(manualShade)
                ? Math.max(-100, Math.min(100, Math.round(manualShade)))
                : getBgPresetDefaultTone(activeBgPreset);

            bgOpacitySlider.value = String(autoShade);

            if (typeof cancelBgShadeRevealAnimation === 'function') {
                cancelBgShadeRevealAnimation();
                cancelBgShadeRevealAnimation = null;
            }

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    cancelBgShadeRevealAnimation = animateShadeSliderValue(
                        bgOpacitySlider,
                        autoShade,
                        targetShade,
                        (nextValue) => {
                            const tone = Math.max(-100, Math.min(100, Math.round(nextValue) || 0));
                            const baseColor = (activeBgPreset === 'modelcolor') ? getModelSyncSourceColor() : getActiveBackgroundBaseColor();
                            if (activeBgPreset === 'modelcolor') bgPick.value = baseColor;
                            if (renderer) renderer.setClearColor(computeSurfaceShadeColor(baseColor, tone), 1);
                            syncBgShadeReadout();
                            updateBgShadeSliderVisual();
                        },
                        () => {
                            cancelBgShadeRevealAnimation = null;
                            bgOpacitySlider.dispatchEvent(new Event('input', { bubbles: true }));
                            saveSettings();
                            updateCardResetButtonStates();
                        }
                    );
                });
            });
            return;
        }

        if (nextAutoBg) updateDynamicBg();
        else {
            // Restore base preset color when turning auto-adjust off
            if (activeBgPreset === 'modelcolor') {
                const syncColor = getModelSyncSourceColor();
                bgPick.value = syncColor;
                applyBackgroundFromBaseColor(syncColor);
            } else if (activeBgPreset === 'custom') {
                bgPick.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                const preset = BG_PRESETS.find(p => p.id === activeBgPreset);
                if (preset && preset.color) bgPick.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        syncBgShadeReadout();
        updateBgShadeSliderVisual();
        saveSettings();
        updateCardResetButtonStates();
    });
}
updateAutoBgShadeControlVisibility();

const rulerToggleEl = document.getElementById('rulerToggle');
if (rulerToggleEl) {
    rulerToggleEl.checked = !!rulerLinesVisible;
    rulerToggleEl.addEventListener('change', () => {
        rulerLinesVisible = rulerToggleEl.checked;
        if (!rulerLinesVisible && !rulerPartHoverEnabled) setRulerHoveredPartIndex(-1);
        if (exportGridEl) exportGridEl.checked = rulerLinesVisible;
        updateRulerHUD();
        updateLiveRulerOverlay();
        refreshExportPreviewNow();
        saveSettings();
    });
}

if (buildPlateToggleEl) {
    buildPlateToggleEl.checked = buildPlateEnabled;
    buildPlateToggleEl.addEventListener('change', () => {
        buildPlateEnabled = !!buildPlateToggleEl.checked;
        if (exportBuildPlateEl) exportBuildPlateEl.checked = buildPlateEnabled;
        updateBuildPlateMaterial();
        applyTextureLighting();
        updateShadowCatcherPlacement();
        refreshExportPreviewNow();
        saveSettings();
    });
}

if (buildPlateColorPickerEl) {
    buildPlateColorPickerEl.addEventListener('input', () => {
        buildPlateColor = buildPlateColorPickerEl.value;
        activeBuildPlatePreset = 'custom';
        lastNonModelBuildPlatePreset = 'custom';
        updateBuildPlateSelection();
        updateBuildPlateMaterial();
        refreshExportPreviewNow();
        saveSettings();
    });
}

if (buildPlateAutoBrightnessEl) {
    buildPlateAutoBrightnessEl.addEventListener('change', () => {
        if (typeof cancelBuildPlateShadeRevealAnimation === 'function') {
            cancelBuildPlateShadeRevealAnimation();
            cancelBuildPlateShadeRevealAnimation = null;
        }

        const nextAuto = !!buildPlateAutoBrightnessEl.checked;
        const wasAuto = !!buildPlateAutoBrightnessEnabled;
        const autoShade = Math.max(-100, Math.min(100, parseInt(String(AUTO_BRIGHTNESS_RULES.buildPlate.shade), 10) || 0));

        if (nextAuto && !wasAuto && buildPlateShadeSliderEl) {
            const fromShade = Math.max(-100, Math.min(100, Math.round(getSliderEffectiveValue(buildPlateShadeSliderEl)) || 0));
            lastManualBuildPlateShade = fromShade;
            manualBuildPlateShadeBeforeAuto = fromShade;
            buildPlateAutoBrightnessEnabled = false;
            buildPlateShade = fromShade;
            buildPlateShadeSliderEl.value = String(fromShade);
            syncBuildPlateShadeReadout();
            if (buildPlateShadeRowEl) buildPlateShadeRowEl.hidden = false;
            buildPlateShadeSliderEl.disabled = false;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    cancelBuildPlateShadeRevealAnimation = animateShadeSliderValue(
                        buildPlateShadeSliderEl,
                        fromShade,
                        autoShade,
                        (nextValue) => {
                            buildPlateShade = Math.max(-100, Math.min(100, Math.round(nextValue) || 0));
                            syncBuildPlateShadeReadout();
                            updateBuildPlateMaterial();
                            refreshExportPreviewNow();
                        },
                        () => {
                            cancelBuildPlateShadeRevealAnimation = null;
                            buildPlateAutoBrightnessEnabled = true;
                            buildPlateShade = autoShade;
                            buildPlateShadeSliderEl.value = String(autoShade);
                            updateBuildPlateShadeControlVisibility();
                            updateBuildPlateMaterial();
                            refreshExportPreviewNow();
                            saveSettings();
                            updateCardResetButtonStates();
                        }
                    );
                });
            });
            return;
        }

        buildPlateAutoBrightnessEnabled = nextAuto;

        if (buildPlateAutoBrightnessEnabled) {
            const manualShade = buildPlateShadeSliderEl
                ? Math.max(-100, Math.min(100, Math.round(getSliderEffectiveValue(buildPlateShadeSliderEl)) || 0))
                : Math.max(-100, Math.min(100, parseInt(String(buildPlateShade), 10) || 0));
            lastManualBuildPlateShade = manualShade;
            manualBuildPlateShadeBeforeAuto = manualShade;
            if (buildPlateShadeSliderEl) buildPlateShadeSliderEl.value = String(autoShade);
            buildPlateShade = autoShade;
        } else {
            const rememberedShade = Number(lastManualBuildPlateShade);
            const fallbackShade = getBuildPlatePresetDefaultTone(activeBuildPlatePreset);
            const targetShade = Number.isFinite(rememberedShade)
                ? Math.max(-100, Math.min(100, Math.round(rememberedShade)))
                : fallbackShade;
            buildPlateShade = targetShade;
            lastManualBuildPlateShade = targetShade;
            manualBuildPlateShadeBeforeAuto = targetShade;
        }

        syncBuildPlateShadeReadout();
        updateBuildPlateShadeControlVisibility();

        if (!nextAuto && wasAuto && buildPlateShadeSliderEl) {
            buildPlateShadeSliderEl.value = String(autoShade);

            if (typeof cancelBuildPlateShadeRevealAnimation === 'function') {
                cancelBuildPlateShadeRevealAnimation();
                cancelBuildPlateShadeRevealAnimation = null;
            }

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    cancelBuildPlateShadeRevealAnimation = animateShadeSliderValue(
                        buildPlateShadeSliderEl,
                        autoShade,
                        buildPlateShade,
                        (nextValue) => {
                            buildPlateShade = Math.max(-100, Math.min(100, Math.round(nextValue) || 0));
                            syncBuildPlateShadeReadout();
                            updateBuildPlateMaterial();
                            refreshExportPreviewNow();
                        },
                        () => {
                            cancelBuildPlateShadeRevealAnimation = null;
                            buildPlateShadeSliderEl.dispatchEvent(new Event('input', { bubbles: true }));
                            saveSettings();
                            updateCardResetButtonStates();
                        }
                    );
                });
            });
            return;
        }

        updateBuildPlateMaterial();
        refreshExportPreviewNow();
        saveSettings();
        updateCardResetButtonStates();
    });
}

updateBuildPlateShadeControlVisibility();

if (buildPlateShadeSliderEl) {
    buildPlateShadeSliderEl.addEventListener('input', () => {
        buildPlateShade = Math.max(-100, Math.min(100, Math.round(getSliderEffectiveValue(buildPlateShadeSliderEl)) || 0));

        if (!buildPlateAutoBrightnessEnabled && activeBuildPlatePreset === 'modelcolor') {
            const partCount = Math.max(1, modelPartNames.length, modelPartBaseColors.length, modelPartSettings.length);
            const idx = Math.max(0, Math.min(parseInt(String(buildPlateSyncPartIndex), 10) || 0, partCount - 1));
            const settings = getPartSettings(idx);
            settings.tone = buildPlateShade;
            if (idx === modelPartSelected && opacitySlider) {
                opacitySlider.value = String(buildPlateShade);
                opacityVal.textContent = (buildPlateShade >= 0 ? '+' : '') + buildPlateShade;
                syncSliderTooltip(opacitySlider);
                updateShadeSliderVisual();
            }
            if (mesh) applyPartColorsToMesh({ buildPlatePreview: true });
            if (activeBgPreset === 'modelcolor' && !isDynamicBg && idx === bgSyncPartIndex) {
                const syncColor = getModelSyncSourceColor();
                bgPick.value = syncColor;
                applyBackgroundFromBaseColor(syncColor);
                updateAutoBgShadeControlVisibility();
                updateBgShadeSliderVisual();
            }
            scheduleModelToneCommit([idx]);
            return;
        }

        if (!buildPlateAutoBrightnessEnabled) {
            lastManualBuildPlateShade = buildPlateShade;
            manualBuildPlateShadeBeforeAuto = buildPlateShade;
        }
        updateBuildPlateMaterial();
        refreshExportPreviewNow();
        saveSettings();
    });
    buildPlateShadeSliderEl.addEventListener('change', () => {
        if (!buildPlateAutoBrightnessEnabled && activeBuildPlatePreset === 'modelcolor') {
            flushModelToneCommit();
            return;
        }
        refreshExportPreviewNow();
        saveSettings();
    });
}

if (buildPlateFinishWrapEl) {
    buildPlateFinishWrapEl.addEventListener('click', (ev) => {
        const btn = ev.target?.closest?.('[data-plate-finish]');
        if (!btn) return;
        const finish = btn.getAttribute('data-plate-finish');
        if (finish !== 'matte' && finish !== 'satin' && finish !== 'gloss') return;
        buildPlateFinish = finish;
        updateBuildPlateMaterial();
        refreshExportPreviewNow();
        saveSettings();
    });
}

if (buildPlateShapeWrapEl) {
    buildPlateShapeWrapEl.addEventListener('click', (ev) => {
        const btn = ev.target?.closest?.('[data-plate-shape]');
        if (!btn) return;
        const shape = btn.getAttribute('data-plate-shape');
        if (shape !== 'rectangle' && shape !== 'rounded' && shape !== 'circle') return;
        buildPlateShape = shape;
        updateBuildPlateMaterial();
        updateShadowCatcherPlacement();
        refreshExportPreviewNow();
        saveSettings();
    });
}

const rulerUnitSelectEl = document.getElementById('rulerUnitSelect');
const _updateRulerUnitFromSelect = (sourceEl) => {
    rulerUnit = sourceEl?.value === 'imperial' ? 'imperial' : 'metric';
    if (rulerUnitSelectEl && rulerUnitSelectEl !== sourceEl) rulerUnitSelectEl.value = rulerUnit;
    if (rulerUnitSelectModalEl && rulerUnitSelectModalEl !== sourceEl) rulerUnitSelectModalEl.value = rulerUnit;
    updateRulerHUD();
    updateLiveRulerOverlay();
    refreshExportPreviewNow();
    saveSettings();
};
if (rulerUnitSelectEl) {
    rulerUnitSelectEl.value = rulerUnit;
    rulerUnitSelectEl.addEventListener('change', () => _updateRulerUnitFromSelect(rulerUnitSelectEl));
}
if (rulerUnitSelectModalEl) {
    rulerUnitSelectModalEl.value = rulerUnit;
    rulerUnitSelectModalEl.addEventListener('change', () => _updateRulerUnitFromSelect(rulerUnitSelectModalEl));
}

if (btnInspectMode) {
    btnInspectMode.addEventListener('click', () => {
        setRulerPartHoverEnabled(!rulerPartHoverEnabled, true);
    });
}

function renderBgPresets() {
    const bar = document.getElementById('bgPresetsBar');
    if (!bar) return;

    bar.innerHTML = '';
    bar.style.display = 'grid';
    bar.style.gridTemplateColumns = 'repeat(4, 1fr)';
    bar.style.gap = '6px';

    BG_PRESETS.forEach((preset) => {
        const wrap = document.createElement('div');
        wrap.className = 'thumb-card-wrap';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.alignItems = 'center';

        const swatchInner = preset.id === 'modelcolor'
            ? `<span class="shading-thumb" id="bg-preset-${preset.id}" style="border-radius:50%;width:44px;height:44px;position:relative;overflow:hidden;cursor:pointer;background-color:#f6f5ff;border:1.5px solid color-mix(in srgb, var(--palette-blueberry-300) 64%, white 36%);display:flex;align-items:center;justify-content:center;"><canvas id="bg-preset-modelcolor-canvas" class="js-part-thumb-preview" data-part-index="${bgSyncPartIndex}" width="56" height="56" aria-hidden="true" style="width:44px;height:44px;border-radius:50%;display:block;"></canvas></span>`
            : `<span class="shading-thumb" id="bg-preset-${preset.id}" style="border-radius:50%;width:44px;height:44px;position:relative;overflow:hidden;cursor:pointer;background-color:${preset.color};border:1.5px solid ${preset.id === 'white' ? PALETTE.preset.bgBorderLight : (preset.id === 'black' ? PALETTE.preset.bgBorderDark : 'transparent')};"></span>`;

        wrap.innerHTML = `
            <label class="shading-option preset-option" title="${preset.name} background">
                ${swatchInner}
            </label>
            <span class="thumb-label">${preset.name}</span>
        `;

        const actionArea = wrap.querySelector('.shading-option');
        actionArea.addEventListener('click', (ev) => {
            if (preset.id === 'modelcolor') {
                if (preset.id === activeBgPreset) {
                    ev.stopPropagation();
                    syncBgModelSyncSourceUI();
                    openBgModelSyncMenu(document.getElementById('bg-preset-modelcolor') || actionArea);
                    return;
                }
            }
            if (preset.id === activeBgPreset && preset.id !== 'white' && preset.id !== 'black') return;

            activeBgPreset = preset.id;
            if (preset.id !== 'modelcolor') lastNonModelBgPreset = preset.id;
            // Respect existing auto-adjust state
            const autoBg = document.getElementById('autoBgCheck');
            isDynamicBg = autoBg ? autoBg.checked : false;
            if (preset.id === 'modelcolor') {
                const syncColor = getModelSyncSourceColor();
                if (!isDynamicBg) applyBgPresetDefaultTone('modelcolor');
                bgPick.value = syncColor;
                if (isDynamicBg) updateDynamicBg();
                else applyBackgroundFromBaseColor(syncColor);
            } else {
                if (!isDynamicBg && (preset.id === 'white' || preset.id === 'black')) applyBgPresetDefaultTone(preset.id);
                bgPick.value = preset.color;
                bgPick.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (isDynamicBg) updateDynamicBg();
            updateBgSelection();
        });
        bar.appendChild(wrap);
    });

    // Custom Bg swatch — blank until selected
    const customWrap = document.createElement('div');
    customWrap.className = 'thumb-card-wrap';
    customWrap.style.display = 'flex';
    customWrap.style.flexDirection = 'column';
    customWrap.style.alignItems = 'center';

    customWrap.innerHTML = `
        <label class="shading-option custom-color-option" title="Custom background — click to pick" style="cursor:pointer;position:relative;">
            ${rainbowRingSvg('customBgThumb', 'transparent')}
            <span id="customBgSphereOverlay" style="position:absolute;inset:3px;border-radius:50%;pointer-events:none;display:none;"></span>
        </label>
        <span class="thumb-label">Custom</span>
    `;
    bar.appendChild(customWrap);

    const labelEl = customWrap.querySelector('.shading-option');
    if (labelEl) {
        labelEl.addEventListener('click', (ev) => {
            ev.preventDefault();
            // Keep custom background aligned with the visible auto-adjust toggle.
            const autoBg = document.getElementById('autoBgCheck');
            isDynamicBg = autoBg ? autoBg.checked : false;
            activeBgPreset = 'custom';
            lastNonModelBgPreset = 'custom';
            updateBgSelection();
            const input = document.getElementById('bgPicker');
            if (!input) return;
            openAnchoredColorPicker(input, labelEl);
        });
    }

    if (!bgPick._presetListenerAdded) {
        bgPick.addEventListener('input', () => {
            const svgCircle = document.querySelector('#customBgThumb circle');
            if (svgCircle && activeBgPreset === 'custom') svgCircle.setAttribute('fill', bgPick.value);
        });
        bgPick._presetListenerAdded = true;
    }

    requestAnimationFrame(updateBgSelection);

}


function renderBuildPlatePresets() {
    const bar = document.getElementById('buildPlatePresetsBar');
    if (!bar) return;

    bar.innerHTML = '';
    bar.style.display = 'grid';
    bar.style.gridTemplateColumns = 'repeat(4, 1fr)';
    bar.style.gap = '6px';

    BUILD_PLATE_PRESETS.forEach((preset) => {
        const wrap = document.createElement('div');
        wrap.className = 'thumb-card-wrap';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.alignItems = 'center';

        const swatchInner = preset.id === 'modelcolor'
            ? `<span class="shading-thumb" id="build-plate-preset-${preset.id}" style="border-radius:50%;width:44px;height:44px;position:relative;overflow:hidden;cursor:pointer;background-color:#f6f5ff;border:1.5px solid color-mix(in srgb, var(--palette-blueberry-300) 64%, white 36%);display:flex;align-items:center;justify-content:center;"><canvas id="build-plate-preset-modelcolor-canvas" class="js-part-thumb-preview" data-part-index="${buildPlateSyncPartIndex}" width="56" height="56" aria-hidden="true" style="width:44px;height:44px;border-radius:50%;display:block;"></canvas></span>`
            : `<span class="shading-thumb" id="build-plate-preset-${preset.id}" style="border-radius:50%;width:44px;height:44px;position:relative;overflow:hidden;cursor:pointer;background-color:${preset.color};border:1.5px solid ${preset.id === 'white' ? PALETTE.preset.bgBorderLight : (preset.id === 'black' ? PALETTE.preset.bgBorderDark : 'transparent')};"></span>`;

        wrap.innerHTML = `
            <label class="shading-option preset-option" title="${preset.name} surface color">
                ${swatchInner}
            </label>
            <span class="thumb-label">${preset.name}</span>
        `;

        const actionArea = wrap.querySelector('.shading-option');
        actionArea.addEventListener('click', (ev) => {
            if (preset.id === 'modelcolor') {
                if (preset.id === activeBuildPlatePreset) {
                    ev.stopPropagation();
                    syncBuildPlateModelSyncSourceUI();
                    openBuildPlateModelSyncMenu(document.getElementById('build-plate-preset-modelcolor') || actionArea);
                    return;
                }
            }
            if (preset.id === activeBuildPlatePreset && preset.id !== 'white' && preset.id !== 'black') return;

            activeBuildPlatePreset = preset.id;
            if (preset.id !== 'modelcolor') lastNonModelBuildPlatePreset = preset.id;
            if (preset.id === 'modelcolor') {
                buildPlateColor = null;
                buildPlateShade = buildPlateAutoBrightnessEnabled
                    ? AUTO_BRIGHTNESS_RULES.buildPlate.shade
                    : getBuildPlatePresetDefaultTone('modelcolor');
                if (!buildPlateAutoBrightnessEnabled) {
                    lastManualBuildPlateShade = getBuildPlatePresetDefaultTone('modelcolor');
                    manualBuildPlateShadeBeforeAuto = lastManualBuildPlateShade;
                }
                if (buildPlateShadeSliderEl) {
                    buildPlateShadeSliderEl.value = String(buildPlateShade);
                    syncBuildPlateShadeReadout();
                }
            } else if (preset.id === 'white' || preset.id === 'black') {
                buildPlateColor = preset.color;
                buildPlateShade = getBuildPlatePresetDefaultTone(preset.id);
                if (!buildPlateAutoBrightnessEnabled) {
                    lastManualBuildPlateShade = buildPlateShade;
                    manualBuildPlateShadeBeforeAuto = lastManualBuildPlateShade;
                }
                if (buildPlateShadeSliderEl) {
                    buildPlateShadeSliderEl.value = String(buildPlateShade);
                    syncBuildPlateShadeReadout();
                }
            }
            updateBuildPlateMaterial();
            updateBuildPlateSelection();
            refreshExportPreviewNow();
            saveSettings();
        });
        bar.appendChild(wrap);
    });

    const customWrap = document.createElement('div');
    customWrap.className = 'thumb-card-wrap';
    customWrap.style.display = 'flex';
    customWrap.style.flexDirection = 'column';
    customWrap.style.alignItems = 'center';

    customWrap.innerHTML = `
        <label class="shading-option custom-color-option" title="Custom surface color" style="cursor:pointer;position:relative;">
            ${rainbowRingSvg('customBuildPlateThumb', 'transparent')}
            <span id="customBuildPlateSphereOverlay" style="position:absolute;inset:3px;border-radius:50%;pointer-events:none;display:none;"></span>
        </label>
        <span class="thumb-label">Custom</span>
    `;
    bar.appendChild(customWrap);

    const labelEl = customWrap.querySelector('.shading-option');
    if (labelEl) {
        labelEl.addEventListener('click', () => {
            syncStoredBuildPlateColorToVisibleBase();
            activeBuildPlatePreset = 'custom';
            lastNonModelBuildPlatePreset = 'custom';
            updateBuildPlateMaterial();
            updateBuildPlateSelection();
            refreshExportPreviewNow();
            saveSettings();
            openAnchoredColorPicker(buildPlateColorPickerEl, labelEl);
        });
    }

    requestAnimationFrame(updateBuildPlateSelection);
}



function renderModelShadeSelector() {
    const sel = document.getElementById('modelShadeSelector');
    if (!sel) return;
    sel.innerHTML = '';
    const values = getShadeStopValues('modelShade');
    const currentVal = parseInt(opacitySlider ? opacitySlider.value : 0, 10);
    values.forEach((val) => {
        const dot = document.createElement('div');
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.borderRadius = '50%';
        dot.style.cursor = 'pointer';
        // Show actual model color at each tone stop.
        const baseC = computeTonedColor(colorPick ? colorPick.value : PALETTE.preset.modelShadeFallback, val);
        dot.style.backgroundColor = '#' + baseC.getHexString();
        dot.onclick = () => {
            if (opacitySlider) {
                opacitySlider.value = String(val);
                opacitySlider.dispatchEvent(new Event('input', { bubbles: true }));
            }
            renderModelShadeSelector();
        };
        // active state
        if (currentVal === val) {
            dot.style.border = '2px solid var(--palette-blueberry-500)';
            dot.style.transform = 'scale(1.2)';
        } else {
            dot.style.border = '1px solid var(--border-color)';
            dot.style.transform = 'scale(1)';
        }
        sel.appendChild(dot);
    });
}

// Re-render dots when a shade change is committed, not on every drag sample.
if (opacitySlider) {
    opacitySlider.addEventListener('change', () => {
        renderModelShadeSelector();
    });
}

function initPresetGallery() {
    renderModelPresets();
    renderBgPresets();
    renderBuildPlatePresets();
    renderModelShadeSelector();
}
initPresetGallery();
