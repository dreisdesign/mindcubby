import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { GIFEncoder, quantize, applyPalette, nearestColorIndex } from 'gifenc';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import JSZip from 'jszip';

// Paste any Rotater URL here to use it as the default settings for first-time visitors
const DEFAULT_SETTINGS_URL = 'https://dreisdesign.github.io/mindcubby/3d/apps/rotater/?c=b4aed6&b=8d8ab7&sh=phong&rm=spin&sp=1&tr=360&wsr=360&sd=1&gl=1&ef=gif&eq=std&ed=square&et=0&gd=0&jq=90&tto=1&tl=75&tc=200&thi=250&ts=100&tsa=0&tsh=115&tpr=100&tpe=125&tcr=100&tce=200&ecd=106.4679&ece=0.0000&rv=1&rg=1';

// ── Defaults ─────────────────────────────────────────────────────────────────
// Export quality presets — base short-edge size + fps + bitrate.
// GIF/MP4 remain square; still images can use common aspect presets.
const QUALITY_PRESETS = {
    web: { size: 480, fps: 15, bitrate: 4_000_000 },
    std: { size: 1080, fps: 24, bitrate: 8_000_000 },
    high: { size: 2048, fps: 30, bitrate: 16_000_000 },
};

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
            fps: p.fps,
            loop: document.getElementById('gifLoop')?.checked ?? true,
            dither: document.getElementById('gifDither')?.checked ?? false,
        };
    },
    get mp4() {
        const v = document.getElementById('exportQuality')?.value ?? 'std';
        const p = QUALITY_PRESETS[v] ?? QUALITY_PRESETS.std;
        return {
            size: p.size,
            fps: p.fps,
            bitrate: p.bitrate,
            loops: 0, // single play
        };
    },
    get image() {
        const { width, height, presetId, presetTag } = getImageExportSize();
        return {
            quality: parseInt(document.getElementById('jpegQuality')?.value ?? 92, 10) / 100,
            width,
            height,
            presetId,
            presetTag,
        };
    },
};
const BASE_ROTATE_SPEED = 2.5; // OrbitControls units: 2.0 = 1 rev/60s at 60fps
const SPEED_VALS = [0.5, 1, 2, 3, 5]; // non-linear snap points for speed slider indices 0–4
const SPEED_DEFAULT = 1; // index into SPEED_VALS
function getSpeed() { return SPEED_VALS[parseInt(speedSlider.value)] ?? 1; }
const TILT_RANGE_DEFAULT = 20;
const SPIN_RANGE_DEFAULT = 360;
const WOBBLE_SPIN_RANGE_DEFAULT = 360;
const ELEV_DEFAULT = 0; // Used by placeCamera() and fitToFrame() for default camera elevation
const CROP_FRAME_UI_SCALE = 0.82; // Keeps a visual margin around the crop guide
const VIEWPORT_FIT_SCALE = 1.55; // Smaller than 1.8 so default/reset framing is less zoomed out
const LIGHT_BASE = { ambient: 0.45, key: 1.9, fill: 0.30, rim: 0.92, exposure: 0.75 };
const TEXTURE_TUNE_DEFAULTS = {
    light: 100,
    contrast: 100,
    highlights: 100,
    shadows: 45,
    shadowAzimuth: 48,
    shadowHeight: 100,
    metallicRoughness: 30,
    metallicMetalness: 65,
    metallicReflection: 100,
    phongRoughness: 62,
    phongReflection: 40,
    matteRoughness: 88,
    matteReflection: 10,
    lightLock: true,
};

// Returns frame count that gives 1 revolution matching the live rotation speed
function exportFrames(fps = EXPORT.gif.fps) {
    const speed = controls ? Math.abs(controls.autoRotateSpeed) : BASE_ROTATE_SPEED;
    const secsPerRev = 60 / speed;
    return Math.round(fps * secsPerRev);
}

function updateEstimate() {
    if (!btnGif) return;
    const { fps: gFps } = EXPORT.gif;
    const { fps: mFps } = EXPORT.mp4;

    // GIF — frames + duration only (file size estimate removed; too variable to be reliable)
    const gN = exportFrames(gFps);
    const gSecs = (gN / gFps).toFixed(1);
    btnGif.title = `Save animated GIF`;
    const gifEstEl = document.getElementById('gifEst');
    if (gifEstEl) gifEstEl.innerHTML = `${gN} frames &middot; <b class="export-info-time">${gSecs}s</b>`;

    // MP4 — duration only
    const mN = exportFrames(mFps);
    const mSecs = (mN / mFps).toFixed(1);
    btnVideo.title = `Save MP4 video`;
    const mp4EstEl = document.getElementById('mp4Est');
    if (mp4EstEl) mp4EstEl.innerHTML = `<b class="export-info-time">${mSecs}s</b>`;

    // Image — based on selected export dimensions
    const imgEstPng = document.getElementById('imgEstPng');
    const imgEstJpg = document.getElementById('imgEstJpg');
    if (imgEstPng || imgEstJpg) {
        const { width: pw, height: ph } = getImageExportSize();
        const pngMB = (pw * ph * 3 * 0.25 / (1024 * 1024)).toFixed(2);
        const jpegMB = (pw * ph * EXPORT.image.quality * 0.21 / (1024 * 1024)).toFixed(2);
        if (imgEstPng) imgEstPng.textContent = `~${pngMB} MB · ${pw}×${ph}px`;
        if (imgEstJpg) imgEstJpg.textContent = `~${jpegMB} MB · ${pw}×${ph}px`;
    }
}

// ── DOM ───────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const viewerSec = document.getElementById('viewerSection');
const colorPick = document.getElementById('colorPicker');
const opacitySlider = document.getElementById('opacitySlider');
const opacityVal = document.getElementById('opacityVal');
const quickPresetsBar = document.getElementById('quickPresetsBar');
const modelPartThumbsWrap = document.getElementById('modelPartThumbsWrap');
const modelPartSelectorBtn = document.getElementById('modelPartSelectorBtn');
const modelPartSelectorMenu = document.getElementById('modelPartSelectorMenu');
const modelPartSelectorThumb = document.getElementById('modelPartSelectorThumb');
const modelPartSelectorText = document.getElementById('modelPartSelectorText');
const bgModelSyncSourceWrap = document.getElementById('bgModelSyncSourceWrap');
const bgModelSyncSelectorBtn = document.getElementById('bgModelSyncSelectorBtn');
const bgModelSyncSelectorMenu = document.getElementById('bgModelSyncSelectorMenu');
const bgModelSyncSelectorThumb = document.getElementById('bgModelSyncSelectorThumb');
const bgModelSyncSelectorText = document.getElementById('bgModelSyncSelectorText');
const bgPick = document.getElementById('bgPicker');
const bgOpacitySlider = document.getElementById('bgOpacitySlider');
const shadingEl = document.getElementById('shadingSelect');
const speedSlider = document.getElementById('speedSlider');
const speedVal = document.getElementById('speedVal');

const btnGif = document.getElementById('btnExportGif');
const btnVideo = document.getElementById('btnExportVideo');
const btnPng = document.getElementById('btnExportPng');
const btnExportLabel = document.getElementById('btnExportLabel');
const exportFormatEl = document.getElementById('exportFormat');
const exportFormatCollapsedEl = document.getElementById('exportFormatCollapsed');
const exportPanelEl = document.querySelector('.export-modal-panel');
const exportPanelBodyEl = document.getElementById('exportPanelBody');
const btnToggleExportPanel = document.getElementById('btnToggleExportPanel');
const exportPanelCollapsedBarEl = document.getElementById('exportPanelCollapsedBar');
const btnExportCollapsedLabel = document.getElementById('btnExportCollapsedLabel');
const exportQualitySliderEl = document.getElementById('exportQualitySlider');
const exportQualityValEl = document.getElementById('exportQualityVal');
const exportGridEl = document.getElementById('exportGrid');
const exportDimensionInputs = Array.from(document.querySelectorAll('input[name="exportDimensions"]'));
const cropDimensionsDock = document.getElementById('cropDimensionsDock');
const statusEl = document.getElementById('exportStatus');
const animStatusEl = document.getElementById('exportStatusAnim');
const fileNameEl = document.getElementById('fileName');
const fileChipEl = document.getElementById('fileChip');
const fileChipPartsMenu = document.getElementById('fileChipPartsMenu');
const btnFileChipExpand = document.getElementById('btnFileChipExpand');
const partReplaceInput = document.getElementById('partReplaceInput');
const btnDownloadPackage = document.getElementById('btnDownloadPackage');
const btnPause = document.getElementById('btnPause');
const iconPause = document.getElementById('iconPause');
const iconPlay = document.getElementById('iconPlay');
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
const finishModeButtons = Array.from(document.querySelectorAll('.finish-mode-btn'));
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
// Dev logging and a flag used to suppress saveSettings() while programmatically
// applying restored settings so we don't overwrite localStorage/URL mid-restore.
// Capture passthrough URL params (e.g. debug=1) once at startup so they survive
// URL rewrites done by settingsToURL().
const APP_PARAM_KEYS = new Set([
    'c', 'b', 'op', 'sh', 'rm', 'sp', 'tr', 'wsr', 'sd', 'gl', 'ef', 'eq', 'ed', 'et', 'gd', 'jq',
    'tto', 'tl', 'tc', 'thi', 'ts', 'tsa', 'tll', 'tsh', 'tmr', 'tmm', 'tme', 'tpr', 'tpe', 'tcr', 'tce',
    'rv', 'ru', 'rl', 'rg',
    'ecd', 'ece', 'ecz', 'aba', 'abp', 'amp', 'bsp'
]);
const _passthroughParams = (() => {
    const p = new URLSearchParams(location.search);
    const out = new URLSearchParams();
    p.forEach((v, k) => { if (!APP_PARAM_KEYS.has(k)) out.set(k, v); });
    return out;
})();
// DEV_LOG: also persist in localStorage so it survives URL rewrites
let DEV_LOG = _passthroughParams.has('debug') || location.search.includes('debug=1');
try {
    if (DEV_LOG) localStorage.setItem('rotater_devlog', '1');
    else if (localStorage.getItem('rotater_devlog') === '1') DEV_LOG = true;
} catch (e) { }
let suppressSave = false;
// Declared early so restoreSettings() (called before these would otherwise be
// initialized by their let declarations later in the file) can safely read/write them.
let activeModelPreset = 'custom';
let activeBgPreset = 'custom';
let isDynamicBg = false;
let rulerEnabled = true;
let rulerUnit = 'metric';
let rulerLinesVisible = true;
let rulerOverlayEl = null;
let rulerGridHelper = null;
let rulerGridSize = 0;
const RULER_DYNAMIC_LINES_ENABLED = false;
const TEXTURE_NEWS_DISMISSED_KEY = 'rotater_textureNewsDismissed';
let modelPartNames = [];
let modelPartBaseColors = [];
let modelPartSettings = [];
let modelPartFiles = null;
let modelPartSelected = 0;
let pendingModelPartSelected = 0;
let bgSyncPartIndex = 0;
let lastNonModelBgPreset = 'white';
let presetHoverPreviewSnapshot = null;
let modelPartThumbsQueued = false;
let partThumbRenderTarget = null;
let partThumbCamera = null;
let partThumbScratchCanvas = null;
let partThumbScratchCtx = null;
let multipartPartBounds = null;
let pendingReplacePartIndex = -1;
let currentModelBuffer = null;


// ── Slider tooltip sync ───────────────────────────────────────────────────────
function syncSliderTooltip(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const pct = (parseFloat(slider.value) - min) / (max - min);
    const wrap = slider.parentElement;
    if (wrap && wrap.classList.contains('range-wrap')) wrap.style.setProperty('--pct', pct);
}

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
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    const next = raw.toFixed(4);
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
        if (slider.dataset.snapCount && restoreStepValue == null) {
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

function snapToGrid(slider) {
    if (fineTuningMode) return;
    const n = parseInt(slider.dataset.snapCount, 10) || 5;
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const v = parseFloat(slider.value);
    let closest = min;
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
        const pos = min + (i / (n - 1)) * (max - min);
        const d = Math.abs(v - pos);
        if (d < minDist) { minDist = d; closest = pos; }
    }
    const snapped = Number(closest.toFixed(4));
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
let isExporting = false;
let isPaused = false;
let modelRadius = 1;
let currentFileName = 'model';
let tiltPhase = 0;
let swingBaseAz = 0, swingLastAz = 0;
let tiltBaseMeshRx = -Math.PI / 2;
let spinDir = 1; // 1 = clockwise, -1 = counter-clockwise
let modelDims = null;  // { w, d, h } in mm (STL units: x=width, y=depth, z=height)
let exportCamDist = null; // stored export camera distance (fit-to-frame, independent of viewport zoom)
let exportCamElev = 0;   // stored export camera elevation (radians)
let exportCamZoom = 1;   // stored export camera projection zoom
let _cropBackupDist = null; // exportCamDist saved on crop-mode enter, restored on cancel
let _cropBackupElev = 0;
let _cropBackupZoom = 1;
let _cropBackupCameraZoom = 1;
let _cropBackupEnableRotate = true;
let _cropBackupMouseButtons = null;
let _cropBackupTouches = null;
let _cropSx = 0, _cropSy = 0, _cropSw = 0, _cropSh = 0; // crop box pixel rect, updated each frame
let _cropLiveSyncArmed = false; // becomes true only after user adjusts camera during crop mode
let _hasRestoredExportFrame = false; // startup-only flag for applying persisted export framing
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
    const az = textureTuneState.lightLock ? getOrbitFrameState().az : 0;
    lightRig.rotation.y = az;
    if (scene) scene.environmentRotation.y = az;
}

function getOrbitFrameState() {
    const target = controls?.target ? controls.target.clone() : new THREE.Vector3(0, 0, 0);
    const offset = camera.position.clone().sub(target);
    const dist = Math.max(offset.length(), 1e-6);
    const elev = Math.asin(Math.max(-1, Math.min(1, offset.y / dist)));
    const az = Math.atan2(offset.x, offset.z);
    return { target, dist, elev, az };
}

function setCameraFromOrbitState(cam, target, dist, elev, az) {
    cam.position.set(
        target.x + dist * Math.cos(elev) * Math.sin(az),
        target.y + dist * Math.sin(elev),
        target.z + dist * Math.cos(elev) * Math.cos(az)
    );
    cam.lookAt(target);
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

// ── Init ──────────────────────────────────────────────────────────────────────
function initThree() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
        const tone = bgOpacitySlider ? parseInt(bgOpacitySlider.value, 10) : 0;
        const c = computeTonedColor(bgPick.value, tone);
        if (renderer) renderer.setClearColor(c, 1);
    }
    // restoreSettings() can run before WebGL is initialized; re-apply here so
    // first paint honors auto-adjusted background immediately after hard refresh.
    if (isDynamicBg) updateDynamicBg();
    scene.environment = roomEnv; // IBL for metallic shading

    camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1e6);

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
    shadowCatcher.visible = false;
    scene.add(shadowCatcher);

    applyTextureLighting();

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.5;
    controls.enableZoom = true;
    controls.addEventListener('start', () => {
        if (!exportFrameEnabled) return;
        _cropLiveSyncArmed = true;
        syncExportCameraFromViewport();
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
    renderer.setSize(w, h, false); // false = don't touch CSS
    if (camera) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
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

function updateShadowCatcherPlacement() {
    if (!shadowCatcher || !mesh) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const y = box.min.y - Math.max(0.001, modelRadius * 0.006);
    const footprint = Math.max(size.x, size.z, 0.001);
    const modelHeight = Math.max(size.y, 0.001);
    shadowCatcher.position.set(center.x, y, center.z);

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
        mesh.castShadow = shadowsOn;
        mesh.receiveShadow = false;
    }
    if (shadowCatcher) {
        shadowCatcher.visible = shadowsOn;
        if (shadowCatcher.material && shadowCatcher.material.isShadowMaterial) {
            shadowCatcher.material.opacity = shadowsOn ? (0.02 + shadowsAmt * 0.16) : 0.02;
            shadowCatcher.material.needsUpdate = true;
        }
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
        if (mode === 'metallic') {
            mat.metalness = s.metallicMetalness / 100;
            mat.roughness = (100 - s.metallicRoughness) / 100;
            mat.envMapIntensity = (s.metallicReflection / 100) * (textureTuneState.highlights / 100);
        } else if (mode === 'phong') {
            mat.metalness = 0;
            mat.roughness = (100 - s.phongRoughness) / 100;
            mat.envMapIntensity = (s.phongReflection / 100) * (textureTuneState.highlights / 100);
        } else {
            // Clay: matte non-metal baseline with faint environment response.
            mat.metalness = 0;
            mat.roughness = (100 - s.matteRoughness) / 100;
            mat.envMapIntensity = (s.matteReflection / 100) * (textureTuneState.highlights / 100);
        }
        mat.needsUpdate = true;
    });
}

function getMaterial(shading, baseColor) {
    if (shading === "flat" || shading === "toon") shading = "matte"; // legacy value

    // Tone: keep hue/sat, only adjust brightness around the original color.
    const toneVal = parseInt(opacitySlider ? opacitySlider.value : 0, 10);
    const baseC = computeTonedColor(baseColor, toneVal);

    const isClear = (shading === "clear" || shading === "glass");
    const finalAlpha = isClear ? 0.35 : 1.0;

    const base = {
        color: baseC, side: THREE.DoubleSide, shadowSide: THREE.FrontSide,
        transparent: isClear,
        opacity: finalAlpha,
        depthWrite: !isClear
    };

    if (shading === "matte") {
        return new THREE.MeshStandardMaterial({
            ...base,
            metalness: 0,
            roughness: (100 - textureTuneState.matteRoughness) / 100,
            envMapIntensity: ((textureTuneState.matteReflection || 0) / 100) * (textureTuneState.highlights / 100),
        });
    }
    if (shading === "phong" || shading === "clear" || shading === "glass") {
        return new THREE.MeshStandardMaterial({
            ...base,
            metalness: 0,
            roughness: (100 - (textureTuneState.phongRoughness || 10)) / 100,
            envMapIntensity: ((textureTuneState.phongReflection || 80) / 100) * (textureTuneState.highlights / 100),
        });
    }
    return new THREE.MeshStandardMaterial({
        ...base,
        metalness: (textureTuneState.metallicMetalness || 65) / 100,
        roughness: (100 - (textureTuneState.metallicRoughness || 30)) / 100,
        envMapIntensity: ((textureTuneState.metallicReflection || 100) / 100) * (textureTuneState.highlights / 100),
    });
}

function stemFromFileName(name) {
    return String(name || 'model').replace(/\.stl$/i, '').trim() || 'model';
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

function isMultipartModel() {
    return Array.isArray(modelPartNames) && modelPartNames.length > 1;
}

function hasModelParts() {
    return Array.isArray(modelPartNames) && modelPartNames.length > 0;
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

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'file-chip-part-btn file-chip-part-btn--remove';
        removeBtn.dataset.action = 'remove';
        removeBtn.dataset.partIndex = String(idx);
        removeBtn.disabled = !canRemove;
        removeBtn.title = canMutateFiles ? (canRemove ? 'Remove this part' : 'A single remaining part cannot be removed here') : 'Part source files are unavailable for editing';
        removeBtn.setAttribute('aria-label', 'Remove this part');
        removeBtn.textContent = '×';

        row.append(nameEl, replaceBtn, removeBtn);
        fileChipPartsMenu.appendChild(row);
    });
}

function createPartSettings(colorHex = colorPick.value) {
    return {
        color: colorHex,
        tone: parseInt(opacitySlider ? opacitySlider.value : 0, 10) || 0,
        shading: shadingEl?.value || 'phong',
        hidden: false,
        metallicRoughness: textureTuneState.metallicRoughness,
        metallicMetalness: textureTuneState.metallicMetalness,
        metallicReflection: textureTuneState.metallicReflection,
        phongRoughness: textureTuneState.phongRoughness,
        phongReflection: textureTuneState.phongReflection,
        matteRoughness: textureTuneState.matteRoughness,
        matteReflection: textureTuneState.matteReflection,
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
    const strength = clampFinishStrength(local);
    return { mode, strength };
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

function getFinishModeFromPartSettings(settings) {
    const shade = settings?.shading;
    if (shade === 'matte' || shade === 'flat' || shade === 'toon') return 'matte';
    if (shade === 'phong') return 'satin';
    return 'glossy';
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
    const mode = getFinishModeFromPartSettings(settings);
    const strength = finishStrengthFromPartSettings(settings);
    return modeStrengthToFinishSliderValue(mode, strength);
}

function applyFinishControlsToSelectedPart(commit = false) {
    const s = getSelectedPartSettings();
    const defaultMode = getSelectedFinishMode();
    const defaultStrength = FINISH_MODE_DEFAULT_STRENGTH[defaultMode] || 2;
    const defaultValue = modeStrengthToFinishSliderValue(defaultMode, defaultStrength);
    const { mode, strength } = finishSliderValueToModeStrength(textureTuneRoughnessSlider?.value || defaultValue);
    const rough = (FINISH_MODE_STOPS[mode] || FINISH_MODE_STOPS.glossy)[strength - 1];

    if (commit && textureTuneRoughnessSlider) {
        textureTuneRoughnessSlider.value = String(modeStrengthToFinishSliderValue(mode, strength));
    }
    setFinishModeUI(mode);

    s.shading = mode === 'matte' ? 'matte' : mode === 'satin' ? 'phong' : 'metallic';
    shadingEl.value = s.shading;
    s.matteRoughness = rough;
    s.metallicRoughness = rough;
    s.phongRoughness = rough;
    if (textureTuneRoughnessVal) textureTuneRoughnessVal.textContent = String(modeStrengthToFinishSliderValue(mode, strength));
}

function updateShadeSliderVisual() {
    if (!opacitySlider) return;
    const s = getSelectedPartSettings();
    const baseHex = s?.color || colorPick.value;
    const toneVal = parseInt(s?.tone ?? opacitySlider.value ?? 0, 10) || 0;
    const tonedHex = `#${computeTonedColor(baseHex, toneVal).getHexString()}`;
    opacitySlider.style.setProperty('--slider-fill', tonedHex);
}

function updateBgShadeSliderVisual() {
    if (!bgOpacitySlider || !bgPick) return;
    const toneVal = parseInt(bgOpacitySlider.value, 10) || 0;
    const c = computeTonedColor(bgPick.value, toneVal);
    bgOpacitySlider.style.setProperty('--slider-fill', `#${c.getHexString()}`);
}

function syncUIFromSelectedPart() {
    const s = getSelectedPartSettings();
    colorPick.value = s.color || colorPick.value;
    if (opacitySlider) {
        opacitySlider.value = String(s.tone ?? 0);
        const toneVal = parseInt(opacitySlider.value, 10);
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
    }
    if (textureTuneRoughnessVal) textureTuneRoughnessVal.textContent = textureTuneRoughnessSlider?.value || '1';
    updateShadeSliderVisual();

    updateTextureTuneUI();
    updateColorSwatches();
    reconcileModelPresetFromSettings(true);
    updateModelSelection();
}

function queueModelPartThumbsRender() {
    if (!modelPartSelectorBtn && !bgModelSyncSelectorBtn) return;
    if (modelPartThumbsQueued) return;
    modelPartThumbsQueued = true;
    requestAnimationFrame(() => {
        modelPartThumbsQueued = false;
        renderModelPartThumbnails();
    });
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

function renderSinglePartThumbnail(canvasEl, partIdx) {
    if (!canvasEl || !mesh || !renderer || !camera) return;
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
    const savedRulerGridVisible = rulerGridHelper?.visible;
    const saved = mats.map((m) => ({
        mat: m,
        transparent: m?.transparent,
        opacity: m?.opacity,
        depthWrite: m?.depthWrite,
        emissiveHex: m?.emissive?.getHex?.() ?? 0,
        emissiveIntensity: m?.emissiveIntensity ?? 1,
        wireframe: m?.wireframe ?? false,
    }));

    mats.forEach((m, idx) => {
        if (!m) return;
        if (idx === partIdx) {
            m.transparent = false;
            m.opacity = 1;
            m.depthWrite = true;
        } else {
            m.transparent = true;
            m.opacity = 0;
            m.depthWrite = false;
        }
        m.emissive.setHex(0x000000);
        m.emissiveIntensity = 1;
        m.wireframe = false;
        m.needsUpdate = true;
    });

    const partBounds = getPartBounds(partIdx);
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
    if (rulerGridHelper) rulerGridHelper.visible = false;

    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(partThumbRenderTarget);
    renderer.clear(true, true, true);
    renderer.render(scene, partThumbCamera);
    renderer.readRenderTargetPixels(partThumbRenderTarget, 0, 0, rtW, rtH, pixelBuf);
    renderer.setRenderTarget(savedTarget);

    ctx.clearRect(0, 0, dstW, dstH);

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
            const pad = Math.max(6, Math.floor(side * 0.14));
            const cropSide = Math.min(Math.max(side + pad * 2, 1), rtW);
            const cx = Math.floor((minX + maxX) / 2);
            const cy = Math.floor((minY + maxY) / 2);
            let sx = Math.max(0, cx - Math.floor(cropSide / 2));
            let sy = Math.max(0, cy - Math.floor(cropSide / 2));
            if (sx + cropSide > rtW) sx = rtW - cropSide;
            if (sy + cropSide > rtH) sy = rtH - cropSide;
            ctx.drawImage(partThumbScratchCanvas, sx, sy, cropSide, cropSide, 0, 0, dstW, dstH);
        } else {
            ctx.drawImage(partThumbScratchCanvas, 0, 0, rtW, rtH, 0, 0, dstW, dstH);
        }
    }

    saved.forEach((s) => {
        if (!s?.mat) return;
        s.mat.transparent = s.transparent;
        s.mat.opacity = s.opacity;
        s.mat.depthWrite = s.depthWrite;
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
    if (rulerGridHelper && typeof savedRulerGridVisible === 'boolean') rulerGridHelper.visible = savedRulerGridVisible;
    renderer.render(scene, camera);
}

function renderModelPartThumbnails() {
    if (!modelPartThumbsWrap) return;
    const visible = hasModelParts() && !!mesh && !!renderer && !!camera;
    modelPartThumbsWrap.hidden = !visible;
    modelPartThumbsWrap.setAttribute('aria-hidden', String(!visible));
    if (!visible) return;

    document.querySelectorAll('.js-part-thumb-preview').forEach((canvasEl) => {
        const idx = parseInt(canvasEl.dataset.partIndex, 10);
        if (Number.isFinite(idx)) renderSinglePartThumbnail(canvasEl, idx);
    });

    if (modelPartSelectorMenu) {
        modelPartSelectorMenu.querySelectorAll('.thumb-select-option').forEach((opt) => {
            const idx = parseInt(opt.dataset.partIndex, 10);
            opt.classList.toggle('is-selected', idx === modelPartSelected);
        });
    }
    if (bgModelSyncSelectorMenu && activeBgPreset === 'modelcolor') {
        bgModelSyncSelectorMenu.querySelectorAll('.thumb-select-option').forEach((opt) => {
            const idx = parseInt(opt.dataset.partIndex, 10);
            opt.classList.toggle('is-selected', idx === bgSyncPartIndex);
        });
    }

    if (modelPartSelectorText) {
        const selectedName = modelPartNames[modelPartSelected] || `Part ${modelPartSelected + 1}`;
        modelPartSelectorText.textContent = selectedName;
        modelPartSelectorBtn.title = selectedName;
    }
    if (bgModelSyncSelectorText && activeBgPreset === 'modelcolor') {
        const selectedName = modelPartNames[bgSyncPartIndex] || `Part ${bgSyncPartIndex + 1}`;
        bgModelSyncSelectorText.textContent = selectedName;
        bgModelSyncSelectorBtn.title = selectedName;
    }
}

function closeThumbSelectMenus() {
    if (modelPartSelectorMenu) modelPartSelectorMenu.hidden = true;
    if (modelPartSelectorBtn) modelPartSelectorBtn.setAttribute('aria-expanded', 'false');
    if (bgModelSyncSelectorMenu) bgModelSyncSelectorMenu.hidden = true;
    if (bgModelSyncSelectorBtn) bgModelSyncSelectorBtn.setAttribute('aria-expanded', 'false');
    closeModelPartActionMenus();
}

function closeModelPartActionMenus() {
    document.querySelectorAll('.part-option-actions').forEach((menu) => {
        menu.hidden = true;
        menu.style.left = '';
        menu.style.top = '';
    });
}

function positionModelPartActionMenu(menuEl, anchorEl) {
    if (!menuEl || !anchorEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const sideGap = 10;
    const maxMenuW = Math.max(160, Math.min(220, window.innerWidth - (sideGap * 2)));
    menuEl.style.width = `${maxMenuW}px`;

    const menuRect = menuEl.getBoundingClientRect();
    const menuW = Math.max(160, Math.min(maxMenuW, menuRect.width || maxMenuW));
    const menuH = Math.max(120, menuRect.height || 138);

    let left = anchorRect.right - menuW;
    left = Math.max(sideGap, Math.min(left, window.innerWidth - menuW - sideGap));

    let top = anchorRect.bottom + 8;
    if (top + menuH > window.innerHeight - sideGap) {
        top = anchorRect.top - menuH - 8;
    }
    top = Math.max(sideGap, Math.min(top, window.innerHeight - menuH - sideGap));

    menuEl.style.left = `${Math.round(left)}px`;
    menuEl.style.top = `${Math.round(top)}px`;
}

modelPartSelectorBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const open = modelPartSelectorMenu && !modelPartSelectorMenu.hidden;
    closeThumbSelectMenus();
    if (modelPartSelectorMenu && !open) {
        modelPartSelectorMenu.hidden = false;
        modelPartSelectorBtn.setAttribute('aria-expanded', 'true');
    }
});

bgModelSyncSelectorBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const open = bgModelSyncSelectorMenu && !bgModelSyncSelectorMenu.hidden;
    closeThumbSelectMenus();
    if (bgModelSyncSelectorMenu && !open) {
        bgModelSyncSelectorMenu.hidden = false;
        bgModelSyncSelectorBtn.setAttribute('aria-expanded', 'true');
    }
});

document.addEventListener('click', () => {
    closeThumbSelectMenus();
    closeFileChipPartsMenu();
    closeModelPartActionMenus();
});

window.addEventListener('resize', () => {
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

function applyPresetIntoPartSettings(partSettings, presetUrlSettings) {
    partSettings.color = presetUrlSettings.color || partSettings.color;
    if (presetUrlSettings.shading) {
        const sh = presetUrlSettings.shading;
        partSettings.shading = (sh === 'flat' || sh === 'toon') ? 'matte' : sh;
    }
    if (presetUrlSettings.tone != null) {
        const t = parseInt(presetUrlSettings.tone, 10);
        if (Number.isFinite(t)) partSettings.tone = Math.max(-100, Math.min(100, t));
    }
    if (presetUrlSettings.textureTuneMetallicRoughness != null) partSettings.metallicRoughness = Number(presetUrlSettings.textureTuneMetallicRoughness);
    if (presetUrlSettings.textureTuneMetallicMetalness != null) partSettings.metallicMetalness = Number(presetUrlSettings.textureTuneMetallicMetalness);
    if (presetUrlSettings.textureTuneMetallicReflection != null) partSettings.metallicReflection = Number(presetUrlSettings.textureTuneMetallicReflection);
    if (presetUrlSettings.textureTunePhongRoughness != null) partSettings.phongRoughness = Number(presetUrlSettings.textureTunePhongRoughness);
    if (presetUrlSettings.textureTunePhongReflection != null) partSettings.phongReflection = Number(presetUrlSettings.textureTunePhongReflection);
    if (presetUrlSettings.textureTuneMatteRoughness != null) partSettings.matteRoughness = Number(presetUrlSettings.textureTuneMatteRoughness);
    if (presetUrlSettings.textureTuneMatteReflection != null) partSettings.matteReflection = Number(presetUrlSettings.textureTuneMatteReflection);
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

function computeTonedColor(baseHex, toneVal) {
    const baseC = new THREE.Color(baseHex);
    const rgb = { r: baseC.r, g: baseC.g, b: baseC.b };
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    const delta = max - min;

    let h = 0;
    if (delta > 1e-6) {
        if (max === rgb.r) h = ((rgb.g - rgb.b) / delta) % 6;
        else if (max === rgb.g) h = ((rgb.b - rgb.r) / delta) + 2;
        else h = ((rgb.r - rgb.g) / delta) + 4;
        h /= 6;
        if (h < 0) h += 1;
    }
    const s = max <= 1e-6 ? 0 : delta / max;
    const v = max;

    const amount = Math.max(0, Math.min(1, Math.abs(toneVal) / 100));
    const maxShift = 0.30; // slider extremes are +/-30% brightness from baseline
    let outV = v;
    if (toneVal < 0) outV = Math.min(1, v * (1 + (maxShift * amount))); // brighter side
    if (toneVal > 0) outV = Math.max(0, v * (1 - (maxShift * amount))); // darker side

    const i = Math.floor(h * 6);
    const f = (h * 6) - i;
    const p = outV * (1 - s);
    const q = outV * (1 - f * s);
    const t = outV * (1 - (1 - f) * s);
    const sextant = ((i % 6) + 6) % 6;
    let r = outV, g = t, b = p;
    if (sextant === 1) { r = q; g = outV; b = p; }
    if (sextant === 2) { r = p; g = outV; b = t; }
    if (sextant === 3) { r = p; g = q; b = outV; }
    if (sextant === 4) { r = t; g = p; b = outV; }
    if (sextant === 5) { r = outV; g = p; b = q; }

    baseC.setRGB(r, g, b);
    return baseC;
}

function applyPartColorsToMesh() {
    const mats = getMeshMaterials();
    if (!mats.length) return;
    mats.forEach((mat, idx) => {
        if (!mat || !mat.color) return;
        const s = getPartSettings(idx);
        const baseHex = s.color || modelPartBaseColors[idx] || colorPick.value;
        mat.color.set(computeTonedColor(baseHex, s.tone ?? 0));
        mat.visible = s.hidden !== true;
        mat.needsUpdate = true;
    });
}

function rebuildMeshMaterialsForCurrentShading() {
    if (!mesh) return;
    disposeMaterials(mesh.material);
    if (isMultipartModel()) {
        mesh.material = modelPartSettings.map((s, idx) => getMaterial(s.shading || shadingEl.value, s.color || modelPartBaseColors[idx]));
    } else {
        const s = getPartSettings(0);
        mesh.material = getMaterial(s.shading || shadingEl.value, s.color || colorPick.value);
    }
    applyPartColorsToMesh();
    applyCurrentTextureTuning();
}

function syncModelPartSelectorUI() {
    if (!modelPartThumbsWrap || !modelPartSelectorMenu || !modelPartSelectorBtn) return;
    const isVisible = hasModelParts();
    modelPartThumbsWrap.hidden = !isVisible;
    modelPartThumbsWrap.setAttribute('aria-hidden', String(!isVisible));
    if (!isVisible) {
        modelPartSelectorMenu.innerHTML = '';
        modelPartSelectorBtn.hidden = true;
        modelPartSelectorMenu.hidden = true;
        modelPartSelectorBtn.setAttribute('aria-expanded', 'false');
        return;
    }

    modelPartSelectorBtn.hidden = false;
    modelPartSelectorMenu.hidden = true;
    modelPartSelectorBtn.setAttribute('aria-expanded', 'false');
    closeModelPartActionMenus();

    modelPartSelected = Math.max(0, Math.min(modelPartSelected, modelPartNames.length - 1));
    modelPartSelectorMenu.innerHTML = '';

    modelPartNames.forEach((name, idx) => {
        const opt = document.createElement('div');
        opt.className = 'thumb-select-option';
        opt.dataset.partIndex = String(idx);
        opt.setAttribute('role', 'option');
        const settings = getPartSettings(idx);
        const hideLabel = settings.hidden ? 'Show' : 'Hide';
        opt.innerHTML = `<button type="button" class="thumb-select-option-main" data-part-select="${idx}"><canvas class="thumb-select-option-canvas js-part-thumb-preview" data-part-index="${idx}" width="72" height="72" aria-hidden="true"></canvas><span class="thumb-select-option-text">Part ${idx + 1}: ${name}</span></button><button type="button" class="part-option-more" data-part-more="${idx}" aria-label="Part actions">\u22ee</button><div class="part-option-actions" hidden><button type="button" class="part-option-action" data-part-action="replace" data-part-index="${idx}">Replace STL</button><button type="button" class="part-option-action" data-part-action="hide" data-part-index="${idx}">${hideLabel}</button><button type="button" class="part-option-action part-option-action--danger" data-part-action="remove" data-part-index="${idx}">Delete Model</button></div>`;

        opt.querySelector('[data-part-select]')?.addEventListener('click', () => {
            clearPresetHoverPreview();
            modelPartSelected = idx;
            syncUIFromSelectedPart();
            applyPartColorsToMesh();
            applyCurrentTextureTuning();
            closeThumbSelectMenus();
            syncModelPartSelectorUI();
            saveSettings();
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
                if (!Number.isFinite(partIdx) || partIdx < 0) return;

                if (action === 'replace') {
                    pendingReplacePartIndex = partIdx;
                    partReplaceInput?.click();
                    return;
                }

                if (action === 'hide') {
                    const partSettings = getPartSettings(partIdx);
                    partSettings.hidden = !partSettings.hidden;
                    applyPartColorsToMesh();
                    syncModelPartSelectorUI();
                    saveSettings();
                    return;
                }

                if (action === 'remove') {
                    await removeMultipartPart(partIdx);
                }
            });
        });

        modelPartSelectorMenu.appendChild(opt);
    });

    if (modelPartSelectorThumb) {
        modelPartSelectorThumb.classList.add('js-part-thumb-preview');
        modelPartSelectorThumb.dataset.partIndex = String(modelPartSelected);
    }

    syncUIFromSelectedPart();
    syncBgModelSyncSourceUI();
    queueModelPartThumbsRender();
}

function getModelSyncSourceColor() {
    if (!isMultipartModel()) return colorPick.value;
    const idx = Math.max(0, Math.min(bgSyncPartIndex, modelPartBaseColors.length - 1));
    return modelPartBaseColors[idx] || colorPick.value;
}

function syncBgModelSyncSourceUI() {
    if (!bgModelSyncSourceWrap || !bgModelSyncSelectorMenu || !bgModelSyncSelectorBtn) return;
    const visible = activeBgPreset === 'modelcolor' && isMultipartModel();
    bgModelSyncSourceWrap.hidden = !visible;
    bgModelSyncSourceWrap.setAttribute('aria-hidden', String(!visible));
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
        const opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'thumb-select-option';
        opt.dataset.partIndex = String(idx);
        opt.setAttribute('role', 'option');
        opt.innerHTML = `<canvas class="thumb-select-option-canvas js-part-thumb-preview" data-part-index="${idx}" width="68" height="68" aria-hidden="true"></canvas><span class="thumb-select-option-text">${name}</span>`;
        opt.addEventListener('click', () => {
            bgSyncPartIndex = idx;
            if (activeBgPreset === 'modelcolor') {
                const syncColor = getModelSyncSourceColor();
                bgPick.value = syncColor;
                if (isDynamicBg) updateDynamicBg();
                else renderer && renderer.setClearColor(new THREE.Color(syncColor), 1);
            }
            closeThumbSelectMenus();
            syncBgModelSyncSourceUI();
            saveSettings();
        });
        bgModelSyncSelectorMenu.appendChild(opt);
    });

    if (bgModelSyncSelectorThumb) {
        bgModelSyncSelectorThumb.classList.add('js-part-thumb-preview');
        bgModelSyncSelectorThumb.dataset.partIndex = String(bgSyncPartIndex);
    }
    if (bgModelSyncSelectorText) {
        const selectedName = modelPartNames[bgSyncPartIndex] || `Part ${bgSyncPartIndex + 1}`;
        bgModelSyncSelectorText.textContent = selectedName;
        bgModelSyncSelectorBtn.title = selectedName;
    }
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
    applyPresetIntoPartSettings(s, p);
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
        scene.remove(mesh);
        mesh.geometry.dispose();
        disposeMaterials(mesh.material);
    }

    const sz = new THREE.Vector3();
    geo.boundingBox.getSize(sz);
    modelRadius = Math.max(sz.x, sz.y, sz.z) / 2;
    modelDims = { w: sz.x, d: sz.y, h: sz.z };

    const initialMaterial = isMultipartModel()
        ? modelPartSettings.map((s, idx) => getMaterial(s.shading || shadingEl.value, s.color || modelPartBaseColors[idx]))
        : getMaterial(getPartSettings(0).shading || shadingEl.value, getPartSettings(0).color || colorPick.value);
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
        const tone = bgOpacitySlider ? parseInt(bgOpacitySlider.value, 10) : 0;
        const c = computeTonedColor(bgPick.value, tone);
        if (renderer) renderer.setClearColor(c, 1);
    }
    if (isDynamicBg) updateDynamicBg();
    updateRulerHUD();
    updateLiveRulerOverlay();

    if (savedCamPos && camera) {
        // Maintain the user's current camera distance; preserve direction
        const savedDist = savedCamPos.length();
        camera.position.copy(savedCamPos.clone().normalize().multiplyScalar(savedDist));
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
    }
    // else: placeCamera() is deferred to the rAF below so syncCanvasSize() runs
    // first and camera.aspect is correct before we compute the fit distance.
    document.documentElement.classList.add('loaded');
    try { localStorage.setItem('rotater_hasSession', '1'); } catch (e) { }
    document.getElementById('compactBtnLabel').textContent = 'Upload STL';
    // Reset pause state on new load
    isPaused = false;
    controls.autoRotate = rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360);
    document.documentElement.classList.remove('rotation-paused');
    iconPause.style.display = '';
    iconPlay.style.display = 'none';
    viewerSec.classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('controlsBar').classList.remove('hidden');
    if (!localStorage.getItem('rotater_hintDismissed')) {
        orbitHintBarEl?.classList.add('visible');
    }
    updateCropHintUI();
    syncModelPartSelectorUI();
    queueModelPartThumbsRender();
    updateEstimate();
    requestAnimationFrame(() => {
        syncCanvasSize();
        if (!savedCamPos) { placeCamera(); syncLightRig(); renderer.render(scene, camera); }
        if (_hasRestoredExportFrame && Number.isFinite(exportCamDist) && exportCamDist > 0) {
            const { target, az } = getOrbitFrameState();
            setCameraFromOrbitState(camera, target, exportCamDist, exportCamElev, az);
            camera.zoom = exportCamZoom || 1;
            camera.updateProjectionMatrix();
            controls.target.copy(target);
            controls.update();
            syncLightRig();
            renderer.render(scene, camera);
            _hasRestoredExportFrame = false;
        } else {
            storeExportCamera();
        }
        queueModelPartThumbsRender();
    });

    const clearBtn = document.getElementById('btnClearModel');
    if (clearBtn) {
        const isDemo = (currentFileName === '3dbenchy');
        const clearLabel = isDemo ? 'Load your own model' : 'Reset to Benchy';
        clearBtn.title = clearLabel;
        clearBtn.setAttribute('aria-label', clearLabel);
    }
    syncFileChipMultipartUI();
    rebuildFileChipPartsMenu();
}

// ── STL Loading ───────────────────────────────────────────────────────────────
function loadSTLBuffer(buffer, name) {
    const geo = new STLLoader().parse(buffer);

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
    multipartPartBounds = null;
    currentModelBuffer = buffer;
    modelPartSelected = 0;

    loadPreparedGeometry(geo, name);
}

function loadMultipartSTLBuffers(buffers, names, partColors = null, partSettings = null) {
    if (!Array.isArray(buffers) || !buffers.length) return;

    modelPartNames = [...names];
    modelPartBaseColors = names.map((_, idx) => partColors?.[idx] || colorPick.value);
    modelPartSettings = names.map((_, idx) => {
        const base = createPartSettings(modelPartBaseColors[idx]);
        if (partSettings?.[idx]) return { ...base, ...partSettings[idx], color: partSettings[idx].color || base.color };
        return base;
    });
    customModelSettingsByPart = {};
    currentModelBuffer = null;
    modelPartSelected = Math.max(0, Math.min(pendingModelPartSelected, modelPartNames.length - 1));

    const parsed = [];
    const unionBox = new THREE.Box3();
    const loader = new STLLoader();
    for (const buffer of buffers) {
        const geo = loader.parse(buffer);
        geo.computeBoundingBox();
        if (geo.boundingBox) unionBox.union(geo.boundingBox);
        parsed.push(geo);
    }

    const center = unionBox.getCenter(new THREE.Vector3());
    const computedPartBounds = [];
    for (const geo of parsed) {
        geo.translate(-center.x, -center.y, -center.z);
        geo.computeBoundingBox();
        const box = geo.boundingBox;
        if (box) {
            const boundsCenter = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            computedPartBounds.push({
                center: boundsCenter,
                radius: Math.max(size.length() * 0.5, 0.001),
            });
        } else {
            computedPartBounds.push({ center: new THREE.Vector3(0, 0, 0), radius: Math.max(0.001, modelRadius || 1) });
        }
        geo.computeVertexNormals();
    }
    multipartPartBounds = computedPartBounds;

    const merged = BufferGeometryUtils.mergeGeometries(parsed, true);
    if (!merged) throw new Error('Could not merge multi-part STL geometry.');
    parsed.forEach(g => { if (g !== merged) g.dispose(); });

    loadPreparedGeometry(merged, getMultipartDisplayName(names));
}

function placeCamera() {
    if (!camera || !controls) return;
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const aspect = camera.aspect > 0 ? camera.aspect : 1;
    // Pull back far enough so the full model fits with breathing room.
    // Math.max(1, 1/aspect) pushes camera further on portrait-ish canvases
    // where the horizontal axis is constraining.
    const dist = modelRadius * Math.max(1, 1 / aspect) / tanHalfFov * VIEWPORT_FIT_SCALE;
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
    if (!isExporting) {
        if (!isPaused && rotateModeEl.value === 'tilt' && mesh) {
            // Tilt: pitch the mesh around its X axis — camera orbits freely
            controls.autoRotate = false;
            controls.update();
            tiltPhase += (2 * Math.PI / 3600) * BASE_ROTATE_SPEED * getSpeed();
            const swing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value) / 2);
            mesh.rotation.x = tiltBaseMeshRx + Math.sin(tiltPhase) * swing;
        } else if (!isPaused && rotateModeEl.value === 'wobble' && mesh) {
            // Wobble: mesh tilt oscillation + full or arc spin
            const wobbleSpinRange = parseFloat(wobbleSpinRangeSlider.value);
            if (wobbleSpinRange >= 360) {
                controls.autoRotate = true;
                controls.update();
            } else {
                controls.autoRotate = false;
                controls.update();
                const actualAz = Math.atan2(camera.position.x, camera.position.z);
                let azDelta = actualAz - swingLastAz;
                if (azDelta > Math.PI) azDelta -= 2 * Math.PI;
                if (azDelta < -Math.PI) azDelta += 2 * Math.PI;
                swingBaseAz += azDelta;
            }
            tiltPhase += (2 * Math.PI / 3600) * BASE_ROTATE_SPEED * getSpeed();
            const tiltSwing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value) / 2);
            mesh.rotation.x = tiltBaseMeshRx + Math.sin(tiltPhase) * tiltSwing;
            if (wobbleSpinRange < 360) {
                const MAX_EL = Math.PI / 2 - 0.05;
                const spinRange = THREE.MathUtils.degToRad(wobbleSpinRange / 2);
                const dist = camera.position.length();
                const el = THREE.MathUtils.clamp(Math.asin(camera.position.y / dist), -MAX_EL, MAX_EL);
                const az = swingBaseAz + Math.sin(tiltPhase) * spinRange;
                camera.position.set(
                    dist * Math.cos(el) * Math.sin(az),
                    dist * Math.sin(el),
                    dist * Math.cos(el) * Math.cos(az),
                );
                camera.lookAt(0, 0, 0);
                swingLastAz = az;
            }
        } else if (!isPaused && rotateModeEl.value === 'spin' && parseFloat(tiltRangeSlider.value) < 360 && mesh) {
            // Spin with Range < 360°: azimuth oscillates ±range around user-orbitable base
            controls.autoRotate = false;
            controls.update(); // apply user input first
            // Accumulate user-driven azimuth delta on top of the base
            const actualAz = Math.atan2(camera.position.x, camera.position.z);
            let azDelta = actualAz - swingLastAz;
            if (azDelta > Math.PI) azDelta -= 2 * Math.PI;
            if (azDelta < -Math.PI) azDelta += 2 * Math.PI;
            swingBaseAz += azDelta;
            tiltPhase += (2 * Math.PI / 3600) * BASE_ROTATE_SPEED * getSpeed();
            const MAX_EL = Math.PI / 2 - 0.05;
            const swingRange = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value) / 2);
            const dist = camera.position.length();
            // Elevation is user-controlled (read from wherever they orbited to)
            const el = THREE.MathUtils.clamp(Math.asin(camera.position.y / dist), -MAX_EL, MAX_EL);
            const az = swingBaseAz + Math.sin(tiltPhase) * swingRange;
            camera.position.set(
                dist * Math.cos(el) * Math.sin(az),
                dist * Math.sin(el),
                dist * Math.cos(el) * Math.cos(az),
            );
            camera.lookAt(0, 0, 0);
            swingLastAz = az;
        } else {
            controls.autoRotate = !isPaused && (rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360));
            controls.update();
            // Keep spin base in sync while paused so resume is seamless
            if (camera && rotateModeEl.value === 'spin') {
                swingBaseAz = Math.atan2(camera.position.x, camera.position.z);
                swingLastAz = swingBaseAz;
            }
        }
        syncLightRig();
        renderer.render(scene, camera);
        if (exportFrameEnabled) drawExportFrame();
        if (rulerEnabled) {
            const now = performance.now();
            if (now - _lastRulerOverlayUpdateMs >= 120) {
                updateLiveRulerOverlay();
                _lastRulerOverlayUpdateMs = now;
            }
        }
        updateExportPreview();
    }
}

// ── Export preview thumbnail ──────────────────────────────────────────────────
let _previewTick = 0;
let _previewRt = null;
let _previewRtWidth = 0;
let _previewRtHeight = 0;
let _previewCam = null;

function isExportPreviewActive() {
    const pv = document.getElementById('exportPreview');
    if (!pv || !renderer || !camera || !scene) return false;

    const exportOverlay = document.getElementById('exportOverlay');
    if (exportOverlay?.hidden) return false;

    const previewDetails = document.getElementById('exportPreviewDetails');
    if (previewDetails && !previewDetails.open) return false;

    const panelBody = pv.closest('.export-modal-body');
    if (!panelBody) return false;
    if (panelBody.offsetParent === null) return false;

    return true;
}

function updateExportPreview(force = false) {
    if (!isExportPreviewActive()) return;
    if (force) _previewTick = 0;
    if (!force) {
        const stride = exportFrameEnabled ? 1 : 4;
        if (++_previewTick % stride !== 0) return;
    }
    const pv = document.getElementById('exportPreview');
    if (!pv) return;
    if (exportCamDist === null) return; // not ready yet

    const fmt = exportFormatEl?.value ?? 'gif';
    const { width: expW, height: expH } = getPreviewExportSize(fmt);
    const previewWrap = pv.parentElement;
    const isTransparentPreview = (fmt === 'gif')
        ? (document.getElementById('exportTransparent')?.checked ?? false)
        : (fmt === 'png')
            ? ((document.getElementById('exportTransparentPng')?.checked
                ?? document.getElementById('exportTransparent')?.checked
                ?? false))
            : false;
    if (previewWrap) {
        previewWrap.style.aspectRatio = '1 / 1';
        const transparentOn = (fmt === 'gif')
            ? (document.getElementById('exportTransparent')?.checked ?? false)
            : (fmt === 'png')
                ? ((document.getElementById('exportTransparentPng')?.checked
                    ?? document.getElementById('exportTransparent')?.checked
                    ?? false))
                : false;
        previewWrap.classList.toggle('is-transparent', transparentOn);
    }

    const wrap = canvas?.parentElement;
    const cw = wrap ? wrap.clientWidth : pv.offsetWidth || 160;
    const ch = wrap ? wrap.clientHeight : pv.offsetWidth || 160;

    const cssW = cw;
    const cssH = ch;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Determine the true aspect ratio we want the mini preview canvas to have.
    // In crop mode, we preview the ENTIRE viewport (to show the semi-transparent black overlay).
    // In normal mode, we preview exactly the cropped region being exported.
    const previewW = exportFrameEnabled ? cw : expW;
    const previewH = exportFrameEnabled ? ch : expH;

    // Scale so the largest dimension fits inside a ~160px box to avoid rendering a huge proxy.
    const maxDim = Math.max(previewW, previewH);
    const boxSize = pv.parentElement?.clientWidth || 160;
    const previewScale = boxSize / Math.max(1, maxDim);

    const pxW = Math.max(2, Math.round(previewW * previewScale * dpr));
    const pxH = Math.max(2, Math.round(previewH * previewScale * dpr));

    if (pv.width !== pxW || pv.height !== pxH) { pv.width = pxW; pv.height = pxH; }

    const cwAspect = Math.max(1, cw) / Math.max(1, ch);

    if (exportFrameEnabled) {
        const { dist, elev } = getOrbitFrameState();
        const cropScale = getCropFrameVerticalScale();
        exportCamDist = dist;
        exportCamElev = elev;
        exportCamZoom = (camera.zoom || 1) / cropScale;

        // In crop mode, sample directly from the visible canvas so the mini
        // preview matches the on-screen tone/contrast exactly.
        if (!isTransparentPreview) {
            const wrap = canvas?.parentElement;
            if (wrap) {
                const cw = wrap.clientWidth;
                const ch = wrap.clientHeight;
                const { sx, sy, sw, sh } = getCropFrameRect(cw, ch);
                const srcScaleX = canvas.width / Math.max(1, cw);
                const srcScaleY = canvas.height / Math.max(1, ch);
                const ctx2d = pv.getContext('2d');
                if (ctx2d) {
                    ctx2d.clearRect(0, 0, pxW, pxH);
                    // Draw entire uncropped viewport
                    ctx2d.drawImage(
                        canvas,
                        0, 0, canvas.width, canvas.height,
                        0, 0, pxW, pxH
                    );

                    // Draw dim overlay over the crop region
                    const scaleX = pxW / cw;
                    const scaleY = pxH / ch;
                    ctx2d.fillStyle = 'rgba(0, 0, 0, 0.45)';
                    ctx2d.fillRect(0, 0, pxW, sy * scaleY);                  // top
                    ctx2d.fillRect(0, (sy + sh) * scaleY, pxW, pxH - (sy + sh) * scaleY);   // bottom
                    ctx2d.fillRect(0, sy * scaleY, sx * scaleX, sh * scaleY);                // left
                    ctx2d.fillRect((sx + sw) * scaleX, sy * scaleY, pxW - (sx + sw) * scaleX, sh * scaleY); // right

                    // Corner marks
                    const cm = Math.max(2, Math.round(Math.min(sw * scaleX, sh * scaleY) * 0.07));
                    ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.65)';
                    ctx2d.lineWidth = 1.5;
                    ctx2d.beginPath();

                    const minX = sx * scaleX;
                    const minY = sy * scaleY;
                    const maxX = (sx + sw) * scaleX;
                    const maxY = (sy + sh) * scaleY;

                    // TL
                    ctx2d.moveTo(minX, minY + cm); ctx2d.lineTo(minX, minY); ctx2d.lineTo(minX + cm, minY);
                    // TR
                    ctx2d.moveTo(maxX - cm, minY); ctx2d.lineTo(maxX, minY); ctx2d.lineTo(maxX, minY + cm);
                    // BL
                    ctx2d.moveTo(minX, maxY - cm); ctx2d.lineTo(minX, maxY); ctx2d.lineTo(minX + cm, maxY);
                    // BR
                    ctx2d.moveTo(maxX - cm, maxY); ctx2d.lineTo(maxX, maxY); ctx2d.lineTo(maxX, maxY - cm);
                    ctx2d.stroke();
                    drawRulerOverlay(ctx2d, pxW, pxH, camera);
                    return;
                }
            }
        }
    }

    // In normal (non-crop) mode, for non-transparent formats: sample the main
    // canvas with a centered aspect-ratio crop matching the export dimensions.
    // This guarantees the preview perfectly matches what will be exported —
    // same tone mapping, same AA, same colors — with zero render overhead.
    if (!exportFrameEnabled && !isTransparentPreview) {
        const wrap = canvas?.parentElement;
        if (wrap) {
            const cw = wrap.clientWidth;
            const ch = wrap.clientHeight;
            const exportAspect = expW / Math.max(1, expH);
            const canvasAspect = cw / Math.max(1, ch);
            let sx, sy, sw, sh;
            if (exportAspect <= canvasAspect) {
                // Export narrower than canvas: letterbox sides
                sh = ch;
                sw = ch * exportAspect;
                sx = (cw - sw) / 2;
                sy = 0;
            } else {
                // Export wider than canvas: letterbox top/bottom
                sw = cw;
                sh = cw / exportAspect;
                sx = 0;
                sy = (ch - sh) / 2;
            }
            const srcScaleX = canvas.width / Math.max(1, cw);
            const srcScaleY = canvas.height / Math.max(1, ch);
            const ctx2d = pv.getContext('2d');
            if (ctx2d) {
                ctx2d.clearRect(0, 0, pxW, pxH);
                ctx2d.drawImage(
                    canvas,
                    sx * srcScaleX,
                    sy * srcScaleY,
                    sw * srcScaleX,
                    sh * srcScaleY,
                    0,
                    0,
                    pxW,
                    pxH
                );
                drawRulerOverlay(ctx2d, pxW, pxH, camera);
                return;
            }
        }
    }

    // Fallback: WebGLRenderTarget for transparent exports
    if (!_previewRt || _previewRtWidth !== pxW || _previewRtHeight !== pxH) {
        if (_previewRt) _previewRt.dispose();
        _previewRtWidth = pxW;
        _previewRtHeight = pxH;
        _previewRt = new THREE.WebGLRenderTarget(pxW, pxH, {
            samples: renderer.capabilities.isWebGL2 ? 4 : 0,
        });
        _previewRt.texture.colorSpace = THREE.SRGBColorSpace;
    }

    if (!_previewCam) {
        _previewCam = new THREE.PerspectiveCamera(45, 1, 0.01, 1e6);
    }

    // We want the transparent render to geometrically match the mini preview canvas layout.
    // In crop mode, pxW/pxH has the main viewport's aspect ratio.
    // In non-crop mode, pxW/pxH has the specific export format's aspect ratio.
    _previewCam.fov = camera.fov;
    _previewCam.near = camera.near;
    _previewCam.far = camera.far;
    _previewCam.up.copy(camera.up);
    _previewCam.aspect = pxW / pxH;
    _previewCam.updateProjectionMatrix();

    if (exportFrameEnabled) {
        const { target, dist, elev, az } = getOrbitFrameState();
        setCameraFromOrbitState(_previewCam, target, dist, elev, az);
        _previewCam.zoom = camera.zoom || 1; // Uncropped zoom!
        _previewCam.updateProjectionMatrix();
    } else {
        const { target, dist: liveDist, elev: liveElev, az } = getOrbitFrameState();
        setCameraFromOrbitState(_previewCam, target, liveDist, liveElev, az);
        _previewCam.zoom = camera.zoom || 1;
        _previewCam.updateProjectionMatrix();
    }

    const savedBg = scene.background;
    const savedClearColor = renderer.getClearColor(new THREE.Color());
    const savedClearAlpha = renderer.getClearAlpha();
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(_previewRt);
    renderer.render(scene, _previewCam);
    renderer.setRenderTarget(null);
    scene.background = savedBg;
    renderer.setClearColor(savedClearColor, savedClearAlpha);

    const buf = new Uint8Array(pxW * pxH * 4);
    renderer.readRenderTargetPixels(_previewRt, 0, 0, pxW, pxH, buf);
    const imgData = pv.getContext('2d').createImageData(pxW, pxH);
    for (let row = 0; row < pxH; row++) {
        const srcRow = (pxH - 1 - row) * pxW * 4;
        imgData.data.set(buf.subarray(srcRow, srcRow + pxW * 4), row * pxW * 4);
    }

    const ctx2d = pv.getContext('2d');
    ctx2d.putImageData(imgData, 0, 0);

    if (exportFrameEnabled) {
        const { sx, sy, sw, sh } = getCropFrameRect(cw, ch);
        const scaleX = pxW / cw;
        const scaleY = pxH / ch;
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx2d.fillRect(0, 0, pxW, sy * scaleY);
        ctx2d.fillRect(0, (sy + sh) * scaleY, pxW, pxH - (sy + sh) * scaleY);
        ctx2d.fillRect(0, sy * scaleY, sx * scaleX, sh * scaleY);
        ctx2d.fillRect((sx + sw) * scaleX, sy * scaleY, pxW - (sx + sw) * scaleX, sh * scaleY);

        const cm = Math.max(2, Math.round(Math.min(sw * scaleX, sh * scaleY) * 0.07));
        ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();
        const minX = sx * scaleX;
        const minY = sy * scaleY;
        const maxX = (sx + sw) * scaleX;
        const maxY = (sy + sh) * scaleY;

        ctx2d.moveTo(minX, minY + cm); ctx2d.lineTo(minX, minY); ctx2d.lineTo(minX + cm, minY);
        ctx2d.moveTo(maxX - cm, minY); ctx2d.lineTo(maxX, minY); ctx2d.lineTo(maxX, minY + cm);
        ctx2d.moveTo(minX, maxY - cm); ctx2d.lineTo(minX, maxY); ctx2d.lineTo(minX + cm, maxY);
        ctx2d.moveTo(maxX - cm, maxY); ctx2d.lineTo(maxX, maxY); ctx2d.lineTo(maxX, maxY - cm);
        ctx2d.stroke();
    }
    drawRulerOverlay(ctx2d, pxW, pxH, _previewCam);
}

function refreshExportPreviewNow() {
    if (!isExportPreviewActive()) return;
    try { updateExportPreview(true); } catch (e) { }
    requestAnimationFrame(() => {
        try { updateExportPreview(true); } catch (e) { }
    });
}

// ── Export frame overlay ──────────────────────────────────────────────────
let exportFrameEnabled = false;
let _hintVisibleBeforeCrop = null;

function updateFrameOverlayButtonUI() {
    if (!frameOverlayBtn) return;
    frameOverlayBtn.setAttribute('aria-pressed', String(exportFrameEnabled));
    if (exportFrameEnabled) {
        frameOverlayBtn.classList.add('is-crop-confirm');
        frameOverlayBtn.title = 'Apply crop (Enter)';
        frameOverlayBtn.setAttribute('aria-label', 'Apply crop');
        return;
    }
    frameOverlayBtn.classList.remove('is-crop-confirm');
    frameOverlayBtn.title = 'Show export frame';
    frameOverlayBtn.setAttribute('aria-label', 'Show export frame');
}

function updateCropHintUI() {
    if (orbitHintTextEl) {
        orbitHintTextEl.textContent = exportFrameEnabled
            ? 'Drag to pan crop · Scroll to zoom'
            : 'Drag to orbit · Scroll to zoom · Right-drag to pan';
    }
    if (!orbitHintBarEl) return;
    if (exportFrameEnabled) {
        if (_hintVisibleBeforeCrop === null) {
            _hintVisibleBeforeCrop = orbitHintBarEl.classList.contains('visible');
        }
        orbitHintBarEl.classList.add('visible');
        return;
    }
    if (_hintVisibleBeforeCrop === false) orbitHintBarEl.classList.remove('visible');
    _hintVisibleBeforeCrop = null;
}

function updateCropDimensionsDock(frameRect = null) {
    const showDimensions = !!exportFormatEl?.value; // all formats support aspect presets
    const useDock = showDimensions && exportFrameEnabled && !!cropDimensionsDock;

    if (!cropDimensionsDock) return;
    if (!useDock) {
        cropDimensionsDock.hidden = true;
        cropDimensionsDock.setAttribute('aria-hidden', 'true');
        return;
    }

    cropDimensionsDock.hidden = false;
    cropDimensionsDock.setAttribute('aria-hidden', 'false');

    const fc = document.getElementById('exportFrameCanvas');
    const wrap = fc?.parentElement;
    if (!wrap) return;
    const w = fc?.width || wrap.clientWidth;
    const h = fc?.height || wrap.clientHeight;
    if (!w || !h) return;

    const rect = frameRect ?? getCropFrameRect(w, h);
    if (!rect || rect.sw <= 0 || rect.sh <= 0) return;

    const gap = Math.round(Math.max(8, Math.min(18, rect.sw * 0.032)));
    const dockW = cropDimensionsDock.offsetWidth || 52;
    const dockH = cropDimensionsDock.offsetHeight || 214;
    const top = Math.max(8, Math.min(h - dockH - 8, rect.sy + (rect.sh - dockH) / 2));

    // Keep the crop shapes in crop mode aligned right rigidly
    const rightOffset = 16;
    const left = Math.max(8, w - dockW - rightOffset);

    cropDimensionsDock.style.left = `${Math.round(left)}px`;
    cropDimensionsDock.style.top = `${Math.round(top)}px`;
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

    const cc = document.getElementById('cropControls');
    if (exportFrameEnabled) {
        // Draw dim overlay directly on canvas — avoids hard CSS edges from backdrop-filter divs
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
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

        // Position the crop controls div to match the crop frame
        if (cc) {
            cc.hidden = false;
            cc.removeAttribute('aria-hidden');
        }
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
        if (cc) { cc.hidden = true; cc.setAttribute('aria-hidden', 'true'); }
        updateCropDimensionsDock();
        document.documentElement.classList.remove('crop-mode');
    }
}

function clearExportFrame() {
    // Dim is drawn on canvas each frame; just force-clear immediately for instant feedback
    const fc = document.getElementById('exportFrameCanvas');
    if (fc) fc.getContext('2d').clearRect(0, 0, fc.width, fc.height);
    _cropSx = 0; _cropSy = 0; _cropSw = 0; _cropSh = 0;
    const cc = document.getElementById('cropControls');
    if (cc) { cc.hidden = true; cc.setAttribute('aria-hidden', 'true'); }
    updateCropDimensionsDock();
    document.documentElement.classList.remove('crop-mode');
}

// ── Ruler / dimensions HUD ────────────────────────────────────────────────────
function updateRulerHUD() {
    const hud = document.getElementById('rulerHUD');
    if (!hud) return;
    hud.hidden = !modelDims || !rulerEnabled;
    document.documentElement.classList.toggle('ruler-visible', !!modelDims && !!rulerEnabled);
    const linesSwitch = document.getElementById('rulerLinesSwitch');
    const linesToggle = document.getElementById('rulerLinesToggle');
    if (linesSwitch) linesSwitch.hidden = !modelDims || !rulerEnabled;
    if (linesToggle) {
        linesToggle.checked = rulerLinesVisible;
        linesToggle.setAttribute('aria-label', rulerLinesVisible ? 'Hide ruler grid' : 'Show ruler grid');
    }
    if (!modelDims) return;
    const unitEl = document.getElementById('rulerUnitVal');
    const unitToggle = document.getElementById('rulerUnitToggle');
    if (unitEl) unitEl.textContent = (rulerUnit === 'imperial') ? 'in' : 'mm';
    if (unitToggle) {
        const next = (rulerUnit === 'imperial') ? 'Metric' : 'Imperial';
        unitToggle.textContent = next;
        unitToggle.setAttribute('aria-label', `Switch to ${next.toLowerCase()} units`);
    }
    document.getElementById('rulerW').textContent = formatRulerValue(modelDims.w);
    document.getElementById('rulerD').textContent = formatRulerValue(modelDims.d);
    document.getElementById('rulerH').textContent = formatRulerValue(modelDims.h);
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
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.strokeStyle = 'rgba(20,20,28,0.12)';
    ctx.lineWidth = 1;
    drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, radius);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#15122b';
    ctx.textAlign = 'center';
    ctx.fillText(text, boxCenterX, baselineY);
    ctx.restore();
}

function drawMeasurement(ctx, start, end, text, center, options = {}) {
    const { offset = 24, labelOffset = 22, extension = 6, align = 'center' } = options;
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

    ctx.strokeStyle = 'rgba(35, 35, 42, 0.78)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(a.x, a.y);
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(b.x, b.y);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    drawArrowCap(ctx, b, a, extension);
    drawArrowCap(ctx, a, b, extension);

    const labelPos = a.clone().add(b).multiplyScalar(0.5).add(normal.multiplyScalar(labelOffset));
    drawMeasurementLabel(ctx, text, labelPos, align);
}

function drawRulerOverlay(ctx, width, height, cam, options = {}) {
    if (!RULER_DYNAMIC_LINES_ENABLED) return;
    if (!rulerEnabled || !rulerLinesVisible || !modelDims) return;
    try {
        const layout = options.layout || getRulerScreenLayout(width, height, cam, options.safeArea);
        if (!layout) return;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(20, 20, 28, 0.82)';
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
    if (!RULER_DYNAMIC_LINES_ENABLED) {
        overlay.style.display = 'none';
        const ctx = overlay.getContext?.('2d');
        if (ctx) ctx.clearRect(0, 0, overlay.width || 0, overlay.height || 0);
        return;
    }
    if (!rulerEnabled || !rulerLinesVisible || !modelDims || !viewerSec || viewerSec.classList.contains('hidden')) {
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
    const layout = getRulerScreenLayout(cssW, cssH, camera, getLiveRulerSafeArea(wrap));
    if (!layout) {
        overlay.style.display = 'none';
        return;
    }
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
    drawRulerOverlay(ctx, cssW, cssH, camera, { layout });
}

function updateRulerGrid() {
    if (!scene) return;
    const shouldShow = !!(rulerEnabled && rulerLinesVisible && mesh && modelDims && viewerSec && !viewerSec.classList.contains('hidden'));
    if (!shouldShow) {
        if (rulerGridHelper) rulerGridHelper.visible = false;
        return;
    }

    const worldBox = new THREE.Box3().setFromObject(mesh);
    if (!worldBox || worldBox.isEmpty()) {
        if (rulerGridHelper) rulerGridHelper.visible = false;
        return;
    }

    const targetSize = Math.max(40, Math.ceil((Math.max(modelDims.w, modelDims.d) * 1.6) / 5) * 5);
    const divisions = Math.max(8, Math.min(42, Math.round(targetSize / 6)));

    if (!rulerGridHelper || Math.abs(rulerGridSize - targetSize) > 0.5) {
        if (rulerGridHelper) scene.remove(rulerGridHelper);
        rulerGridHelper = new THREE.GridHelper(targetSize, divisions, 0x3f3b52, 0x6f6a8f);
        const mats = Array.isArray(rulerGridHelper.material) ? rulerGridHelper.material : [rulerGridHelper.material];
        mats.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = 0.5;
            mat.depthWrite = false;
        });
        rulerGridHelper.renderOrder = -1;
        scene.add(rulerGridHelper);
        rulerGridSize = targetSize;
    }

    rulerGridHelper.visible = true;
    rulerGridHelper.position.set(0, worldBox.min.y - 0.4, 0);
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
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).delete('stl');
    } catch (e) {
        console.warn('Could not clear IndexedDB:', e);
    }
}

const SETTINGS_KEY = 'rotater_settings';

function saveSettings() {
    if (DEV_LOG) console.log(`[rotater] saveSettings called at ${Date.now()}`);
    if (suppressSave) {
        if (DEV_LOG) console.log(`[rotater] saveSettings suppressed at ${Date.now()}`);
        return;
    }
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
            color: colorPick.value,
            tone: opacitySlider ? opacitySlider.value : 0,
            bgOpacity: bgOpacitySlider ? bgOpacitySlider.value : "0",
            bg: bgPick.value,
            shading: shadingEl.value,
            speed: speedSlider.value,

            rotateMode: rotateModeEl.value,
            tiltRange: tiltRangeSlider.value,
            wobbleSpinRange: wobbleSpinRangeSlider.value,
            spinDir: spinDir,
            gifLoop: document.getElementById('gifLoop')?.checked ? '1' : '0',

            exportQuality: document.getElementById('exportQuality')?.value ?? 'std',
            exportFormat: exportFormatEl?.value ?? 'gif',
            exportDimensions: getSelectedExportDimensionsId(),
            exportTransparent: document.getElementById('exportTransparent')?.checked ? '1' : '0',
            gifDither: document.getElementById('gifDither')?.checked ? '1' : '0',
            jpegQuality: document.getElementById('jpegQuality')?.value ?? '92',
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
            autoBgAdjust: document.getElementById('autoBgCheck')?.checked ? '1' : '0',
            rulerVisible: rulerEnabled ? '1' : '0',
            rulerUnit: rulerUnit,
            rulerGridVisible: rulerLinesVisible ? '1' : '0',
            activeBgPreset: activeBgPreset,
            activeModelPreset: activeModelPreset,
            modelPartSelected: String(modelPartSelected || 0),
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
    settingsToURL();
}

function restoreSettings() {
    suppressSave = true;
    if (DEV_LOG) console.log(`[rotater] restoreSettings start at ${Date.now()}`);
    try {
        const urlS = getURLSettings(location.search);
        let localS = {};
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) localS = JSON.parse(saved) || {};
        } catch (e) { }

        const defaultSearchStr = typeof DEFAULT_SETTINGS_URL !== 'undefined' && DEFAULT_SETTINGS_URL.includes('?')
            ? '?' + DEFAULT_SETTINGS_URL.split('?')[1] : '';
        const defaultS = getURLSettings(defaultSearchStr) || {};

        // Merge order: Default presets <- Local storage <- URL params
        let s = { ...defaultS, ...localS };
        if (urlS) {
            s = { ...s };
            const urlParams = new URLSearchParams(location.search);
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
                const actualTone = parseInt(opacitySlider.value, 10);
                opacityVal.textContent = (actualTone >= 0 ? '+' : '') + actualTone;
            }
            if (s.bgOpacity !== undefined && bgOpacitySlider) {
                const bgTone = Math.max(-100, Math.min(100, parseInt(s.bgOpacity, 10) || 0));
                bgOpacitySlider.value = bgTone;
                const actualBgTone = parseInt(bgOpacitySlider.value, 10);
                const bgValEl = document.getElementById('bgOpacityVal');
                if (bgValEl) bgValEl.textContent = (actualBgTone >= 0 ? '+' : '') + actualBgTone;
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
                speedSlider.value = s.speed; // browser quantizes to nearest step (0–4)
                speedVal.textContent = getSpeed() + '×';
            }

            if (s.textureTuneLight != null) textureTuneState.light = clamp(s.textureTuneLight, 40, 200, TEXTURE_TUNE_DEFAULTS.light);
            if (s.textureTuneContrast != null) textureTuneState.contrast = clamp(s.textureTuneContrast, 50, 200, TEXTURE_TUNE_DEFAULTS.contrast);
            if (s.textureTuneHighlights != null) textureTuneState.highlights = clamp(s.textureTuneHighlights, 40, 250, TEXTURE_TUNE_DEFAULTS.highlights);
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
            if (s.spinDir != null) spinDir = parseFloat(s.spinDir) < 0 ? -1 : 1;
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
        }
        // Restore auto BG adjust and preset selections
        if (s.autoBgAdjust != null) {
            const on = (s.autoBgAdjust === '1' || s.autoBgAdjust === true || s.autoBgAdjust === 1);
            const el = document.getElementById('autoBgCheck');
            if (el) el.checked = on;
            isDynamicBg = on;
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
        if (exportGridEl) exportGridEl.checked = rulerLinesVisible;
        if (s.rulerUnit === 'imperial' || s.rulerUnit === 'i' || s.rulerUnit === 'in') rulerUnit = 'imperial';
        else if (s.rulerUnit === 'metric' || s.rulerUnit === 'm' || s.rulerUnit === 'mm') rulerUnit = 'metric';
        if (s.activeBgPreset) activeBgPreset = s.activeBgPreset;
        if (s.activeModelPreset) activeModelPreset = s.activeModelPreset;
        if (s.modelPartSelected != null) {
            const idx = parseInt(s.modelPartSelected, 10);
            pendingModelPartSelected = Number.isFinite(idx) ? Math.max(0, idx) : 0;
        }
        if (s.bgSyncPartIndex != null || s.modelSyncPart != null) {
            const idx = parseInt(s.bgSyncPartIndex ?? s.modelSyncPart, 10);
            bgSyncPartIndex = Number.isFinite(idx) ? Math.max(0, idx) : 0;
        }

        // Always apply mode-based classes/slider setup — even when s is null (settings reset)
        const curMode = rotateModeEl.value;
        document.documentElement.classList.toggle('tilt-mode', curMode === 'tilt' || curMode === 'spin' || curMode === 'wobble');
        document.documentElement.classList.toggle('wobble-mode', curMode === 'wobble');
        if (curMode === 'tilt' || curMode === 'spin' || curMode === 'wobble') updateRangeSliderForMode(curMode);
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
        syncSliderTooltip(speedSlider);
        syncSliderTooltip(tiltRangeSlider);
        syncSliderTooltip(wobbleSpinRangeSlider);
        if (opacitySlider) syncSliderTooltip(opacitySlider);
        if (bgOpacitySlider) { syncSliderTooltip(bgOpacitySlider); updateBgShadeSliderVisual(); }
        updateTiltRangeReset();
        wobbleSpinRangeResetBtn.classList.toggle('is-changed', parseFloat(wobbleSpinRangeSlider.value) !== WOBBLE_SPIN_RANGE_DEFAULT);
        speedResetBtn.classList.toggle('is-changed', parseInt(speedSlider.value) !== SPEED_DEFAULT);
        // Init export format panel (if format wasn't restored above, default to gif)
        if (!exportFormatEl?.value || !document.getElementById(`exportOpts-${exportFormatEl.value}`)) {
            applyExportFormat('gif');
        }
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
    if (!p.has('c') && !p.has('sh') && !p.has('rm') && !p.has('amp') && !p.has('ef')) return null;
    const g = (k) => p.has(k) ? p.get(k) : null;
    return {
        // Core appearance
        color: p.has('c') ? '#' + p.get('c') : null,
        bg: p.has('b') ? '#' + p.get('b') : null,
        tone: p.has('op') ? p.get('op') : null,
        shading: g('sh'),
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
        // Export camera framing
        exportCamDist: g('ecd'),
        exportCamElev: g('ece'),
        exportCamZoom: g('ecz'),
        // Auto BG + active presets
        autoBgAdjust: g('aba'),
        rulerVisible: g('rv'),
        rulerUnit: g('ru'),
        rulerGridVisible: g('rg'),
        rulerLinesVisible: g('rl'),
        activeBgPreset: g('abp'),
        activeModelPreset: g('amp'),
        modelSyncPart: g('bsp'),
    };
}

function settingsToURL() {
    const p = new URLSearchParams();
    // Core appearance
    p.set('c', colorPick.value.replace('#', ''));
    p.set('b', bgPick.value.replace('#', ''));
    if (opacitySlider && opacitySlider.value !== '0') p.set('op', opacitySlider.value);
    p.set('sh', shadingEl.value);
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
    // Texture tune values (only non-default to keep URLs short)
    const tt = textureTuneState;
    const D = TEXTURE_TUNE_DEFAULTS;
    if (tt.light !== D.light) p.set('tl', String(tt.light));
    if (tt.contrast !== D.contrast) p.set('tc', String(tt.contrast));
    if (tt.highlights !== D.highlights) p.set('thi', String(tt.highlights));
    if (tt.shadows !== D.shadows) p.set('ts', String(tt.shadows));
    if (tt.shadowAzimuth !== D.shadowAzimuth) p.set('tsa', String(tt.shadowAzimuth));
    if (tt.lightLock !== D.lightLock) p.set('tll', tt.lightLock ? '1' : '0');
    if (tt.shadowHeight !== D.shadowHeight) p.set('tsh', String(tt.shadowHeight));
    if (tt.metallicRoughness !== D.metallicRoughness) p.set('tmr', String(tt.metallicRoughness));
    if (tt.metallicMetalness !== D.metallicMetalness) p.set('tmm', String(tt.metallicMetalness));
    if (tt.metallicReflection !== D.metallicReflection) p.set('tme', String(tt.metallicReflection));
    if (tt.phongRoughness !== D.phongRoughness) p.set('tpr', String(tt.phongRoughness));
    if (tt.phongReflection !== D.phongReflection) p.set('tpe', String(tt.phongReflection));
    if (tt.matteRoughness !== D.matteRoughness) p.set('tcr', String(tt.matteRoughness));
    if (tt.matteReflection !== D.matteReflection) p.set('tce', String(tt.matteReflection));
    // Export camera framing
    if (exportCamDist != null && Number.isFinite(exportCamDist) && exportCamDist > 0)
        p.set('ecd', exportCamDist.toFixed(4));
    if (exportCamElev != null && Number.isFinite(exportCamElev))
        p.set('ece', exportCamElev.toFixed(4));
    if (exportCamZoom != null && Number.isFinite(exportCamZoom) && exportCamZoom !== 1)
        p.set('ecz', exportCamZoom.toFixed(4));
    // Auto BG adjust + active presets
    if (isDynamicBg) p.set('aba', '1');
    if (rulerEnabled) p.set('rv', '1');
    if (rulerUnit === 'imperial') p.set('ru', 'i');
    if (!rulerLinesVisible) p.set('rg', '0');
    if (activeBgPreset && activeBgPreset !== 'custom') p.set('abp', activeBgPreset);
    if (activeModelPreset && activeModelPreset !== 'custom') p.set('amp', activeModelPreset);
    if (bgSyncPartIndex > 0) p.set('bsp', String(bgSyncPartIndex));
    // Re-inject passthrough params captured at startup (e.g. debug=1)
    _passthroughParams.forEach((v, k) => { if (!p.has(k)) p.set(k, v); });
    history.replaceState(null, '', '?' + p.toString());
}

async function restoreSession() {
    if (DEV_LOG) console.log(`[rotater] restoreSession: calling restoreSettings at ${Date.now()}`);
    restoreSettings();
    updateColorSwatches(); // guaranteed init even if restoreSettings throws
    const saved = await loadFileFromIDB();
    if (!saved) {
        if (DEV_LOG) console.log(`[rotater] restoreSession: loading demo model at ${Date.now()}`);
        // Load the demo model (not saved to IDB — user's own files take priority)
        try {
            const resp = await fetch('./benchy.stl');
            if (!resp.ok) return;
            const buffer = await resp.arrayBuffer();
            setDisplayedFileName('3dbenchy.stl');
            currentFileName = '3dbenchy';
            modelPartNames = ['3dbenchy.stl'];
            modelPartBaseColors = [colorPick.value];
            modelPartSettings = [createPartSettings(colorPick.value)];
            modelPartFiles = null;
            modelPartSelected = 0;
            if (!renderer) initThree();
            controls.autoRotateSpeed = BASE_ROTATE_SPEED * getSpeed() * spinDir;
            if (DEV_LOG) console.log(`[rotater] restoreSession: calling loadSTLBuffer for demo at ${Date.now()}`);
            loadSTLBuffer(buffer, '3dbenchy.stl');
            saveSettings();
        } catch (e) { /* no demo available — stay on landing page */ }
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
    if (isMultipart) {
        modelPartFiles = saved.parts.map(p => ({ name: p.name, buffer: p.buffer }));
        loadMultipartSTLBuffers(
            saved.parts.map(p => p.buffer),
            saved.parts.map(p => p.name),
            saved.parts.map(p => p.color || colorPick.value),
            saved.parts.map(p => p.settings || null),
        );
    } else {
        modelPartFiles = null;
        loadSTLBuffer(saved.buffer, saved.name);
    }
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

async function handleFiles(fileList) {
    const files = Array.from(fileList || []).filter(f => f?.name?.toLowerCase?.().endsWith('.stl'));
    if (!files.length) return;

    const isMultipart = files.length > 1;
    const displayName = isMultipart ? getMultipartDisplayName(files.map(f => f.name)) : files[0].name;
    setDisplayedFileName(displayName);
    currentFileName = isMultipart
        ? buildMultipartFileBase(files.map(f => f.name))
        : stemFromFileName(files[0].name);
    if (!renderer) initThree();

    if (isMultipart) {
        try {
            const parts = await Promise.all(files.map(async (file) => ({
                name: file.name,
                buffer: await readFileAsArrayBuffer(file),
                color: colorPick.value,
                settings: createPartSettings(colorPick.value),
            })));
            await saveFilesToIDB(parts, displayName);
            saveSettings();
            modelPartFiles = parts.map(p => ({ name: p.name, buffer: p.buffer }));
            loadMultipartSTLBuffers(parts.map(p => p.buffer), parts.map(p => p.name), parts.map(p => p.color));
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
        await saveFileToIDB(file.name, buffer);
        modelPartFiles = null;
        saveSettings();
        loadSTLBuffer(buffer, file.name);
    } catch (err) {
        setStatus('Error: ' + (err?.message || 'Failed to load STL file.'));
        console.error(err);
        setTimeout(() => setStatus(''), 5000);
    }
}

async function replaceMultipartPart(partIdx, file) {
    if (!file || !isMultipartModel() || !modelPartFiles || modelPartFiles.length !== modelPartNames.length) return;
    const index = Math.max(0, Math.min(partIdx, modelPartFiles.length - 1));
    const buffer = await readFileAsArrayBuffer(file);

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
    loadMultipartSTLBuffers(nextFiles.map((part) => part.buffer), nextNames, nextColors, nextSettings);
    rebuildFileChipPartsMenu();
    syncFileChipMultipartUI();
}

async function removeMultipartPart(partIdx) {
    if (!isMultipartModel() || !modelPartFiles || modelPartFiles.length !== modelPartNames.length) return;
    if (modelPartFiles.length <= 1) return;
    const index = Math.max(0, Math.min(partIdx, modelPartFiles.length - 1));
    if (!confirm(`Remove part \"${modelPartNames[index]}\"?`)) return;
    const nextFiles = modelPartFiles.filter((_, idx) => idx !== index);
    const nextNames = nextFiles.map((part) => part.name);
    const nextColors = modelPartBaseColors.filter((_, idx) => idx !== index);
    const nextSettings = modelPartSettings.filter((_, idx) => idx !== index).map((s, idx) => ({ ...s, color: nextColors[idx] || s.color || colorPick.value }));

    if (nextFiles.length === 1) {
        await saveFileToIDB(nextFiles[0].name, nextFiles[0].buffer);
        currentFileName = stemFromFileName(nextFiles[0].name);
        setDisplayedFileName(nextFiles[0].name);
        modelPartFiles = null;
        loadSTLBuffer(nextFiles[0].buffer, nextFiles[0].name);
    } else {
        const displayName = getMultipartDisplayName(nextNames);
        await saveFilesToIDB(nextFiles.map((part, idx) => ({
            name: part.name,
            buffer: part.buffer,
            color: nextColors[idx] || colorPick.value,
            settings: nextSettings[idx] || createPartSettings(nextColors[idx] || colorPick.value),
        })), displayName);
        modelPartFiles = nextFiles;
        pendingModelPartSelected = Math.max(0, Math.min(modelPartSelected, nextFiles.length - 1));
        setDisplayedFileName(displayName);
        currentFileName = buildMultipartFileBase(nextNames);
        loadMultipartSTLBuffers(nextFiles.map((part) => part.buffer), nextNames, nextColors, nextSettings);
    }

    rebuildFileChipPartsMenu();
    syncFileChipMultipartUI();
}

fileInput.addEventListener('change', e => {
    handleFiles(e.target.files);
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
    const partIdx = parseInt(targetBtn.dataset.partIndex || '-1', 10);
    if (!Number.isFinite(partIdx) || partIdx < 0) return;
    const action = targetBtn.dataset.action;

    if (action === 'replace') {
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

function togglePause() {
    if (rotateModeEl.value === 'off') return;
    isPaused = !isPaused;
    controls.autoRotate = !isPaused && (rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360));
    document.documentElement.classList.toggle('rotation-paused', isPaused);
    iconPause.style.display = isPaused ? 'none' : '';
    iconPlay.style.display = isPaused ? '' : 'none';
    btnPause.setAttribute('aria-label', isPaused ? 'Resume rotation' : 'Pause rotation');
    btnPause.title = isPaused ? 'Resume rotation' : 'Pause rotation';
}

function toggleSpinDir() {
    spinDir = -spinDir;
    if (controls) controls.autoRotateSpeed = BASE_ROTATE_SPEED * getSpeed() * spinDir;
    updateSpinDirUI();
    saveSettings();
}

function updateSpinDirUI() {
    const spinLabel = document.getElementById('spinModeLabel');
    if (spinLabel) spinLabel.title = spinDir > 0 ? 'Switch to counter-clockwise' : 'Switch to clockwise';
    document.documentElement.classList.toggle('spin-ccw', spinDir < 0);
}

function updateTiltRangeReset() {
    const m = rotateModeEl.value;
    const def = m === 'spin' ? SPIN_RANGE_DEFAULT : TILT_RANGE_DEFAULT;
    tiltRangeResetBtn.classList.toggle('is-changed', parseFloat(tiltRangeSlider.value) !== def);
}

btnPause.addEventListener('click', togglePause);

// Re-clicking active Spin card toggles CW/CCW; other active cards toggle pause
document.querySelectorAll('input[name="rotateMode"]').forEach(input => {
    const label = input.closest('label');
    if (!label) return;
    let wasChecked = false;
    label.addEventListener('mousedown', () => { wasChecked = input.checked; });
    label.addEventListener('click', () => {
        if (!wasChecked) return;
        if (input.value === 'spin') toggleSpinDir();
        else togglePause();
    });
});
document.addEventListener('keydown', e => {
    // Space: pause/resume
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        togglePause();
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
    const dist = camera.position.length();
    const el = THREE.MathUtils.clamp(elevation, -(Math.PI / 2 - 0.01), Math.PI / 2 - 0.01);
    // Zero any residual damping velocity so the snap is instant with no post-snap drift
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = true;
    camera.position.set(
        dist * Math.cos(el) * Math.sin(azimuth),
        dist * Math.sin(el),
        dist * Math.cos(el) * Math.cos(azimuth),
    );
    // Avoid gimbal lock on near-vertical views
    camera.up.set(0, Math.abs(elevation) > Math.PI / 4 ? 0 : 1, Math.abs(elevation) > Math.PI / 4 ? (elevation > 0 ? -1 : 1) : 0);
    camera.lookAt(0, 0, 0);
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
    const dist = camera.position.length();
    let el = Math.asin(Math.max(-1, Math.min(1, camera.position.y / dist)));
    let az = Math.atan2(camera.position.x, camera.position.z);
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
        isPaused = true;
        controls.autoRotate = false;
        iconPause.style.display = 'none';
        iconPlay.style.display = '';
        btnPause.setAttribute('aria-label', 'Resume rotation');
        btnPause.title = 'Resume rotation';
        document.documentElement.classList.add('rotation-paused');
    }
    renderer.render(scene, camera);
});

document.getElementById('btnExportPng').addEventListener('click', async () => {
    if (!mesh) return;
    // Pause if not already
    if (!isPaused) {
        isPaused = true;
        controls.autoRotate = false;
        iconPause.style.display = 'none';
        iconPlay.style.display = '';
        btnPause.setAttribute('aria-label', 'Resume rotation');
        btnPause.title = 'Resume rotation';
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
        isPaused = true;
        controls.autoRotate = false;
        iconPause.style.display = 'none';
        iconPlay.style.display = '';
        btnPause.setAttribute('aria-label', 'Resume rotation');
        btnPause.title = 'Resume rotation';
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
    if (textureTuneRoughnessRow) textureTuneRoughnessRow.hidden = !isStandard;
    if (textureTuneMetalnessRow) textureTuneMetalnessRow.hidden = mode !== 'metallic';

    if (textureTuneLightSlider) {
        textureTuneLightSlider.value = String(textureTuneState.light);
        syncSliderTooltip(textureTuneLightSlider);
    }
    if (textureTuneLightVal) textureTuneLightVal.textContent = `${Math.round(textureTuneState.light)}%`;

    if (textureTuneContrastSlider) {
        textureTuneContrastSlider.value = String(textureTuneState.contrast);
        syncSliderTooltip(textureTuneContrastSlider);
    }
    if (textureTuneContrastVal) textureTuneContrastVal.textContent = `${Math.round(textureTuneState.contrast)}%`;

    if (textureTuneHighlightsSlider) {
        textureTuneHighlightsSlider.value = String(textureTuneState.highlights);
        syncSliderTooltip(textureTuneHighlightsSlider);
    }
    if (textureTuneHighlightsVal) textureTuneHighlightsVal.textContent = `${Math.round(textureTuneState.highlights)}%`;

    if (textureTuneShadowsSlider) {
        textureTuneShadowsSlider.value = String(textureTuneState.shadows);
        syncSliderTooltip(textureTuneShadowsSlider);
    }
    if (textureTuneShadowsVal) textureTuneShadowsVal.textContent = `${Math.round(textureTuneState.shadows)}%`;

    if (textureTuneLightSourceSlider) {
        textureTuneLightSourceSlider.value = String(textureTuneState.shadowAzimuth);
        syncSliderTooltip(textureTuneLightSourceSlider);
    }
    if (textureTuneLightSourceVal) textureTuneLightSourceVal.textContent = `${Math.round(textureTuneState.shadowAzimuth)}°`;

    if (textureTuneLightLockBox) {
        textureTuneLightLockBox.checked = textureTuneState.lightLock;
    }

    if (textureTuneLightHeightSlider) {
        textureTuneLightHeightSlider.value = String(textureTuneState.shadowHeight);
        syncSliderTooltip(textureTuneLightHeightSlider);
    }
    if (textureTuneLightHeightVal) textureTuneLightHeightVal.textContent = `${Math.round(textureTuneState.shadowHeight)}%`;

    if (isStandard && textureTuneRoughnessSlider) {
        const s = getSelectedPartSettings();
        setFinishModeUI(getFinishModeFromPartSettings(s));
        textureTuneRoughnessSlider.value = String(finishSliderValueFromPartSettings(s));
        if (textureTuneRoughnessVal) {
            textureTuneRoughnessVal.textContent = textureTuneRoughnessSlider.value;
        }
        syncSliderTooltip(textureTuneRoughnessSlider);
    }

    if (textureTuneMetalnessSlider) {
        textureTuneMetalnessSlider.value = String(textureTuneState.metallicMetalness);
        syncSliderTooltip(textureTuneMetalnessSlider);
    }
    if (textureTuneMetalnessVal) textureTuneMetalnessVal.textContent = `${Math.round(textureTuneState.metallicMetalness)}%`;
}

function updateRangeSliderForMode(mode) {
    if (mode === 'spin') {
        tiltRangeSlider.min = '45';
        tiltRangeSlider.max = '360';
        tiltRangeSlider.step = '45';
        if (parseFloat(tiltRangeSlider.value) > 360 || parseFloat(tiltRangeSlider.value) < 45) tiltRangeSlider.value = String(SPIN_RANGE_DEFAULT);
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

function persistCurrentMultipartParts() {
    if (!isMultipartModel() || !modelPartFiles || modelPartFiles.length !== modelPartNames.length) return;
    const displayName = getMultipartDisplayName(modelPartNames);
    saveFilesToIDB(modelPartFiles.map((part, idx) => ({
        name: part.name,
        buffer: part.buffer,
        color: modelPartBaseColors[idx] || colorPick.value,
        settings: modelPartSettings[idx] ? { ...modelPartSettings[idx] } : createPartSettings(modelPartBaseColors[idx] || colorPick.value),
    })), displayName);
}

colorPick.addEventListener('input', (ev) => {
    if (isMultipartModel()) {
        const s = getSelectedPartSettings();
        s.color = colorPick.value;
        modelPartBaseColors[modelPartSelected] = colorPick.value;
    } else {
        modelPartBaseColors = [colorPick.value];
        getPartSettings(0).color = colorPick.value;
    }

    if (mesh) applyPartColorsToMesh();
    persistCurrentMultipartParts();
    updateShadingThumbs();
    updateColorSwatches();
    updateShadeSliderVisual();
    queueModelPartThumbsRender();
    if (activeBgPreset === 'modelcolor') {
        bgPick.value = getModelSyncSourceColor();
        if (isDynamicBg) updateDynamicBg();
        else renderer && renderer.setClearColor(new THREE.Color(bgPick.value), 1);
    }
    saveSettings();
});
if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
        const toneVal = parseInt(opacitySlider.value, 10);
        opacityVal.textContent = (toneVal >= 0 ? '+' : '') + toneVal;
        syncSliderTooltip(opacitySlider);
        getSelectedPartSettings().tone = toneVal;
        if (mesh) applyPartColorsToMesh();
        updateShadingThumbs();
        persistCurrentMultipartParts();
        updateShadeSliderVisual();
        queueModelPartThumbsRender();
        saveSettings();
    });
}

if (bgOpacitySlider) {
    bgOpacitySlider.addEventListener('input', () => {
        const bgTone = parseInt(bgOpacitySlider.value, 10);
        document.getElementById('bgOpacityVal').textContent = (bgTone >= 0 ? '+' : '') + bgTone;
        syncSliderTooltip(bgOpacitySlider);
        updateBgShadeSliderVisual();
        const tone = parseInt(bgOpacitySlider.value, 10);
        const c = computeTonedColor(bgPick.value, tone);
        if (renderer) renderer.setClearColor(c, 1);
        if (isDynamicBg) updateDynamicBg();
        saveSettings();
    });
}


bgPick.addEventListener('input', () => {
    scene.background = null;

    {
        const tone = bgOpacitySlider ? parseInt(bgOpacitySlider.value, 10) : 0;
        const c = computeTonedColor(bgPick.value, tone);
        if (renderer) renderer.setClearColor(c, 1);
    }
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
    // Light lock is always on; ignore user changes to hidden checkbox
    textureTuneState.lightLock = true;
    if (textureTuneLightLockBox) textureTuneLightLockBox.checked = true;
    updateTextureTuneUI();
    if (!isExporting) renderer.render(scene, camera);
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
    applyFinishControlsToSelectedPart(false);
    applyCurrentTextureTuning();
    persistCurrentMultipartParts();
    queueModelPartThumbsRender();
    saveSettings();
});

textureTuneRoughnessSlider?.addEventListener('change', () => {
    applyFinishControlsToSelectedPart(true);
    applyCurrentTextureTuning();
    persistCurrentMultipartParts();
    queueModelPartThumbsRender();
    saveSettings();
});

finishModeButtons.forEach((btn) => btn.addEventListener('click', () => {
    const mode = btn.dataset.finishMode || 'satin';
    setFinishModeUI(mode);
    if (textureTuneRoughnessSlider) {
        textureTuneRoughnessSlider.value = String(modeStrengthToFinishSliderValue(mode, 2));
    }
    applyFinishControlsToSelectedPart(true);
    syncSliderTooltip(textureTuneRoughnessSlider);
    applyCurrentTextureTuning();
    persistCurrentMultipartParts();
    queueModelPartThumbsRender();
    saveSettings();
}));

textureTuneMetalnessSlider?.addEventListener('input', () => {
    getSelectedPartSettings().metallicMetalness = parseFloat(textureTuneMetalnessSlider.value);
    syncUIFromSelectedPart();
    updateTextureTuneUI();
    applyCurrentTextureTuning();
    persistCurrentMultipartParts();
    queueModelPartThumbsRender();
    saveSettings();
});

shadingEl.addEventListener('change', () => {
    if (shadingEl.value === 'flat' || shadingEl.value === 'toon') shadingEl.value = 'matte';
    getSelectedPartSettings().shading = shadingEl.value;
    updateTextureTuneUI();
    if (mesh) rebuildMeshMaterialsForCurrentShading();
    persistCurrentMultipartParts();
    queueModelPartThumbsRender();
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

document.getElementById('exportQuality')?.addEventListener('change', () => {
    syncExportQualitySliderFromSelect();
    updateEstimate();
    refreshExportPreviewNow();
    saveSettings();
});

exportQualitySliderEl?.addEventListener('input', () => {
    const idx = Math.max(0, Math.min(2, parseInt(exportQualitySliderEl.value, 10) || 1));
    setExportQualityValue(EXPORT_QUALITY_ORDER[idx]);
    updateEstimate();
    refreshExportPreviewNow();
    saveSettings();
});

exportGridEl?.addEventListener('change', () => {
    rulerLinesVisible = !!exportGridEl.checked;
    const linesToggle = document.getElementById('rulerLinesToggle');
    if (linesToggle) linesToggle.checked = rulerLinesVisible;
    updateRulerHUD();
    updateLiveRulerOverlay();
    refreshExportPreviewNow();
    saveSettings();
});
exportDimensionInputs.forEach(input => {
    input.addEventListener('change', () => {
        if (!input.checked) return;
        updateCropDimensionsDock();
        updateEstimate();
        refreshExportPreviewNow();
        saveSettings();
    });
});

// ── Export format switcher ────────────────────────────────────────────────────
const FORMAT_LABELS = {
    gif: 'Export Animated GIF',
    mp4: 'Export MP4 Video',
    png: 'Export PNG Image',
    jpg: 'Export JPEG Image',
};
const FORMAT_SHORT_LABELS = {
    gif: 'GIF',
    mp4: 'MP4',
    png: 'PNG',
    jpg: 'JPEG',
};
const FORMAT_BTNS = { gif: 'btnExportGif', mp4: 'btnExportVideo', png: 'btnExportPng', jpg: 'btnExportJpeg' };

const EXPORT_OPTION_VISIBILITY = {
    gif: {
        gifLoop: true,
        gifDither: true,
        exportTransparent: true,
        exportGrid: true,
    },
    mp4: {
        gifLoop: false,
        gifDither: false,
        exportTransparent: false,
        exportGrid: true,
    },
    png: {
        gifLoop: false,
        gifDither: false,
        exportTransparent: true,
        exportGrid: true,
    },
    jpg: {
        gifLoop: false,
        gifDither: false,
        exportTransparent: false,
        exportGrid: true,
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

function updateExportActionLabels(fmt = exportFormatEl?.value ?? exportFormatCollapsedEl?.value ?? 'gif') {
    const panelWidth = exportPanelEl?.offsetWidth ?? 0;
    const useShortPrimaryLabel = !!exportPanelEl?.classList.contains('is-collapsed') || (panelWidth > 0 && panelWidth < 360);
    if (btnExportLabel) btnExportLabel.textContent = (useShortPrimaryLabel ? FORMAT_SHORT_LABELS[fmt] : FORMAT_LABELS[fmt]) ?? 'Export';
    if (btnExportCollapsedLabel) btnExportCollapsedLabel.textContent = FORMAT_SHORT_LABELS[fmt] ?? 'Export';
}

function applyExportFormat(fmt) {
    if (exportFormatEl && exportFormatEl.value !== fmt) exportFormatEl.value = fmt;
    if (exportFormatCollapsedEl && exportFormatCollapsedEl.value !== fmt) exportFormatCollapsedEl.value = fmt;
    document.querySelectorAll('.export-format-opts').forEach(el => { el.hidden = true; });
    const opts = document.getElementById(`exportOpts-${fmt}`);
    if (opts) opts.hidden = false;
    applyExportQuickOptionsForFormat(fmt);
    updateCropDimensionsDock();
    updateExportActionLabels(fmt);
    updateEstimate();
    refreshExportPreviewNow();
    queueDesktopV2RailLayoutSync();
}

function applyExportPanelState(collapsed) {
    if (!exportPanelEl || !exportPanelBodyEl || !btnToggleExportPanel) return;

    exportPanelEl.classList.toggle('is-collapsed', !!collapsed);
    exportPanelBodyEl.hidden = !!collapsed;
    btnToggleExportPanel.setAttribute('aria-expanded', String(!collapsed));
    if (exportPanelCollapsedBarEl) {
        exportPanelCollapsedBarEl.hidden = !collapsed;
        exportPanelCollapsedBarEl.setAttribute('aria-hidden', String(!collapsed));
    }

    updateExportActionLabels();
    if (!collapsed) refreshExportPreviewNow();
    queueDesktopV2RailLayoutSync();
}

exportFormatEl?.addEventListener('change', function () {
    applyExportFormat(this.value);
    saveSettings();
});

exportFormatCollapsedEl?.addEventListener('change', function () {
    applyExportFormat(this.value);
    saveSettings();
});

document.getElementById('exportPreviewDetails')?.addEventListener('toggle', () => {
    refreshExportPreviewNow();
    queueDesktopV2RailLayoutSync();
});

btnToggleExportPanel?.addEventListener('click', () => {
    if (!exportPanelEl) return;
    const collapsed = !exportPanelEl.classList.contains('is-collapsed');
    applyExportPanelState(collapsed);
    try { localStorage.setItem('rotater_exportPanelCollapsed', collapsed ? '1' : '0'); } catch (_) { }
});

// Main export button dispatches to hidden per-format button
document.getElementById('btnExport')?.addEventListener('click', () => {
    const fmt = exportFormatEl?.value ?? 'gif';
    document.getElementById(FORMAT_BTNS[fmt])?.click();
});

document.getElementById('btnExportCollapsed')?.addEventListener('click', () => {
    const fmt = exportFormatCollapsedEl?.value ?? exportFormatEl?.value ?? 'gif';
    document.getElementById(FORMAT_BTNS[fmt])?.click();
});

window.addEventListener('resize', () => updateExportActionLabels());

// exportTransparent / exportTransparentPng toggles: sync each other + update estimate
function syncTransparentCheckboxes(sourceId) {
    const val = document.getElementById(sourceId)?.checked ?? false;
    const ids = ['exportTransparent', 'exportTransparentPng'];
    ids.forEach(id => { if (id !== sourceId) { const el = document.getElementById(id); if (el) el.checked = val; } });
    // Update preview wrapper visual and refresh preview immediately
    const wrap = document.querySelector('.export-preview-wrap');
    if (wrap) {
        wrap.classList.toggle('is-transparent', val);
    }
    updateEstimate(); saveSettings();
    refreshExportPreviewNow();
}
document.getElementById('exportTransparent')?.addEventListener('change', () => syncTransparentCheckboxes('exportTransparent'));
document.getElementById('exportTransparentPng')?.addEventListener('change', () => syncTransparentCheckboxes('exportTransparentPng'));
document.getElementById('jpegQuality').addEventListener('input', function () {
    document.getElementById('jpegQualityVal').textContent = this.value + '%';
    updateEstimate();
    refreshExportPreviewNow();
    saveSettings();
});

rotateModeEl.addEventListener('change', () => {
    const m = rotateModeEl.value;
    // switching mode resumes rotation
    if (isPaused) {
        isPaused = false;
        iconPause.style.display = '';
        iconPlay.style.display = 'none';
        document.documentElement.classList.remove('rotation-paused');
    }
    // Restore mesh to neutral when leaving tilt/wobble modes
    if (m !== 'tilt' && m !== 'wobble' && mesh) {
        tiltBaseMeshRx = -Math.PI / 2;
        mesh.rotation.x = tiltBaseMeshRx;
    }
    tiltPhase = 0;
    if ((m === 'spin' || m === 'wobble') && camera) {
        swingBaseAz = Math.atan2(camera.position.x, camera.position.z);
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
    saveSettings();
});

tiltRangeSlider.addEventListener('input', () => {
    tiltRangeVal.textContent = tiltRangeSlider.value + '°';
    syncSliderTooltip(tiltRangeSlider);
    updateTiltRangeReset();
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

document.getElementById('btnResetSettings').addEventListener('click', () => {
    try {
        localStorage.removeItem(SETTINGS_KEY);
        // Keep session mode so reload does not briefly show the empty upload page.
        localStorage.setItem('rotater_hasSession', '1');
        localStorage.setItem('rotater_hintDismissed', '1');
    } catch (e) { }
    history.replaceState(null, '', location.pathname);
    location.reload();
});

document.querySelector('.orbit-hint-dismiss')?.addEventListener('click', () => {
    orbitHintBarEl?.classList.remove('visible');
    try { localStorage.setItem('rotater_hintDismissed', '1'); } catch (e) { }
});

document.getElementById('btnClearModel').addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    // If currently showing benchy (no user file in IDB), X = replace (open picker)
    if (currentFileName === '3dbenchy') {
        document.getElementById('fileInput').click();
        return;
    }
    if (!confirm('Reset to 3D Benchy?')) return;
    try {
        const resp = await fetch('./benchy.stl');
        if (!resp.ok) return;
        const buffer = await resp.arrayBuffer();
        await clearIDB();
        setDisplayedFileName('3dbenchy.stl');
        currentFileName = '3dbenchy';
        if (!renderer) initThree();
        controls.autoRotateSpeed = BASE_ROTATE_SPEED * getSpeed() * spinDir;
        loadSTLBuffer(buffer, '3dbenchy.stl');
    } catch (e) { }
});

// ── Theme toggle ──────────────────────────────────────────────────────────────

function applyTheme(theme) {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    try { localStorage.setItem('rotater-theme', theme); } catch (e) { }
    const isDark = theme === 'dark';
    const label = document.getElementById('themeToggleLabel');
    const path = document.getElementById('themeToggleIconPath');
    if (label) label.textContent = isDark ? 'Turn On Light Mode' : 'Turn On Dark Mode';
    if (path) path.setAttribute('d', isDark
        // bedtime_off icon — dark mode is on, click to switch to light
        ? 'M13.35 10.65C14.25 11.55 15.3167 12.2417 16.55 12.725C17.7833 13.2083 19.1 13.45 20.5 13.45C21.0333 13.45 21.45 13.6667 21.75 14.1C22.05 14.5333 22.1083 15 21.925 15.5C21.7917 15.8833 21.6167 16.2708 21.4 16.6625C21.1833 17.0542 20.9333 17.45 20.65 17.85C20.3833 18.2 20.0292 18.3875 19.5875 18.4125C19.1458 18.4375 18.7583 18.2833 18.425 17.95L6.025 5.55C5.70833 5.23333 5.55833 4.85417 5.575 4.4125C5.59167 3.97083 5.775 3.61667 6.125 3.35C6.425 3.11667 6.74583 2.90417 7.0875 2.7125C7.42917 2.52083 7.81667 2.33333 8.25 2.15C8.78333 1.91667 9.2875 1.94583 9.7625 2.2375C10.2375 2.52917 10.4833 2.94167 10.5 3.475C10.5333 4.90833 10.7917 6.2375 11.275 7.4625C11.7583 8.6875 12.45 9.75 13.35 10.65ZM17.8 23.9L15.6 21.725C15.05 21.925 14.4833 22.075 13.9 22.175C13.3167 22.275 12.7167 22.325 12.1 22.325C10.6667 22.325 9.31667 22.05 8.05 21.5C6.78333 20.95 5.67917 20.2042 4.7375 19.2625C3.79583 18.3208 3.05 17.2167 2.5 15.95C1.95 14.6833 1.675 13.3333 1.675 11.9C1.675 11.2833 1.725 10.6833 1.825 10.1C1.925 9.51667 2.075 8.95 2.275 8.4L0.15 6.275C-0.116667 6.00833 -0.25 5.69167 -0.25 5.325C-0.25 4.95833 -0.116667 4.64167 0.15 4.375C0.416667 4.10833 0.733333 3.975 1.1 3.975C1.46667 3.975 1.78333 4.10833 2.05 4.375L19.65 22.025C19.9 22.2917 20.025 22.6042 20.025 22.9625C20.025 23.3208 19.9 23.625 19.65 23.875C19.4 24.125 19.0917 24.2542 18.725 24.2625C18.3583 24.2708 18.05 24.15 17.8 23.9Z'
        // bedtime icon — light mode is on, click to switch to dark
        : 'M12.0998 22.325C10.6665 22.325 9.31647 22.05 8.0498 21.5C6.78314 20.95 5.67897 20.2041 4.7373 19.2625C3.79564 18.3208 3.0498 17.2166 2.4998 15.95C1.9498 14.6833 1.6748 13.3333 1.6748 11.9C1.6748 9.76664 2.25814 7.81664 3.4248 6.04997C4.59147 4.28331 6.16647 3.01664 8.1498 2.24997C8.68314 2.03331 9.1873 2.07081 9.6623 2.36247C10.1373 2.65414 10.3831 3.06664 10.3998 3.59997C10.4331 4.94997 10.679 6.24164 11.1373 7.47498C11.5956 8.70831 12.2998 9.79998 13.2498 10.75C14.1998 11.7 15.2915 12.4083 16.5248 12.875C17.7581 13.3416 19.0498 13.575 20.3998 13.575C20.9331 13.575 21.3498 13.7875 21.6498 14.2125C21.9498 14.6375 22.0081 15.1 21.8248 15.6C21.0915 17.65 19.8331 19.2833 18.0498 20.5C16.2665 21.7166 14.2831 22.325 12.0998 22.325Z'
    );
}

// Sync label/icon to whatever theme was applied on load
applyTheme(document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light');

document.getElementById('btnThemeToggle').addEventListener('click', () => {
    applyTheme(document.documentElement.classList.contains('theme-dark') ? 'light' : 'dark');
    queueDesktopV2RailLayoutSync();
});

speedSlider.addEventListener('input', () => {
    const v = getSpeed();
    speedVal.textContent = v + '×';
    syncSliderTooltip(speedSlider);
    if (controls) controls.autoRotateSpeed = BASE_ROTATE_SPEED * v * spinDir;
    speedResetBtn.classList.toggle('is-changed', parseInt(speedSlider.value) !== SPEED_DEFAULT);
    updateEstimate();
    saveSettings();
});

speedResetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    speedSlider.value = SPEED_DEFAULT;
    speedSlider.dispatchEvent(new Event('input'));
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

let desktopV2RailObserver = null;
let desktopV2RailRafId = 0;
let desktopV2DockDefaultApplied = false;

function syncDesktopV2RailLayout() {
    const root = document.documentElement;
    if (!root.classList.contains('layout-v2-desktop')) {
        root.style.removeProperty('--desktop-v2-effects-top');
        root.style.removeProperty('--desktop-v2-effects-max-height');
        return;
    }

    const appDock = document.getElementById('appSettingsDock');
    if (!appDock) return;

    const railTop = 16;
    const railBottom = 16;
    const railGap = 12;

    const appDockHeight = Math.ceil(appDock.getBoundingClientRect().height || 0);
    const effectsTop = railTop;
    const effectsMaxHeight = Math.max(150, Math.floor(window.innerHeight - effectsTop - railGap - appDockHeight - railBottom));

    root.style.setProperty('--desktop-v2-effects-top', `${effectsTop}px`);
    root.style.setProperty('--desktop-v2-effects-max-height', `${effectsMaxHeight}px`);
}

function queueDesktopV2RailLayoutSync() {
    if (desktopV2RailRafId) cancelAnimationFrame(desktopV2RailRafId);
    desktopV2RailRafId = requestAnimationFrame(() => {
        desktopV2RailRafId = 0;
        syncDesktopV2RailLayout();
    });
}

function disconnectDesktopV2RailObserver() {
    if (desktopV2RailObserver) {
        desktopV2RailObserver.disconnect();
        desktopV2RailObserver = null;
    }
}

function ensureDesktopV2RailObserver() {
    if (!window.ResizeObserver || desktopV2RailObserver) return;

    desktopV2RailObserver = new ResizeObserver(() => {
        queueDesktopV2RailLayoutSync();
    });

    const exportPanel = document.querySelector('.export-modal-panel');
    const appDock = document.getElementById('appSettingsDock');
    if (exportPanel) desktopV2RailObserver.observe(exportPanel);
    if (appDock) desktopV2RailObserver.observe(appDock);
}

function applyMobileAccordionState(panelName) {
    const panel = normalizeSidebarTab(panelName || 'theme');
    document.querySelectorAll('.mobile-panel-toggle').forEach((btn) => {
        const expanded = btn.dataset.mobilePanel === panel;
        btn.setAttribute('aria-expanded', String(expanded));
    });
    document.querySelectorAll('.tab-panel').forEach((panelEl) => {
        panelEl.hidden = panelEl.dataset.panel !== panel;
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
        document.documentElement.classList.remove('sidebar-collapsed');
        try { localStorage.setItem('rotater_sidebarCollapsed', '0'); } catch (_) { }
        if (exportOverlayEl) exportOverlayEl.hidden = false;
        if (openExportBtn) openExportBtn.hidden = true;
        refreshExportPreviewNow();
        switchTab('theme');
        if (!desktopV2DockDefaultApplied) {
            applyAppSettingsDockState(true);
            try { localStorage.setItem('rotater_appSettingsCollapsed', '1'); } catch (_) { }
            desktopV2DockDefaultApplied = true;
        }
        ensureDesktopV2RailObserver();
        queueDesktopV2RailLayoutSync();
    } else {
        if (tabletTabs) {
            document.documentElement.classList.remove('sidebar-collapsed');
            try { localStorage.setItem('rotater_sidebarCollapsed', '0'); } catch (_) { }
        }
        if (openExportBtn) openExportBtn.hidden = false;
        if (exportOverlayEl) exportOverlayEl.hidden = true;
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

try {
    const exportCollapsed = localStorage.getItem('rotater_exportPanelCollapsed');
    applyExportPanelState(exportCollapsed === '1');
} catch (_) {
    applyExportPanelState(false);
}

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

applyDesktopV2Layout();
window.addEventListener('resize', () => {
    applyDesktopV2Layout();
});

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

    // Toggle step attribute so browser doesn't snap when fine tuning is on.
    document.querySelectorAll('input[type="range"][data-snap-count]').forEach(slider => {
        if (fineTuningMode) {
            if (!slider.dataset.originalStep) slider.dataset.originalStep = slider.step;
            slider.step = 'any';
        } else if (slider.dataset.originalStep) {
            slider.step = slider.dataset.originalStep;
        }
    });

    // Show/hide snap dots based on mode.
    document.querySelectorAll('.snap-dots').forEach(el => {
        el.style.opacity = fineTuningMode ? '0' : '';
        el.style.pointerEvents = fineTuningMode ? 'none' : '';
    });
}

// Fine Tuning toggle
const fineTuningCheckEl = document.getElementById('fineTuningCheck');
if (fineTuningCheckEl) {
    applyFineTuningUIState(fineTuningCheckEl.checked);
    fineTuningCheckEl.addEventListener('change', () => {
        applyFineTuningUIState(fineTuningCheckEl.checked);

        if (!fineTuningMode) {
            applyFinishControlsToSelectedPart();
            if (mesh) rebuildMeshMaterialsForCurrentShading();
        }
        updateTextureTuneUI();
        persistCurrentMultipartParts();
        queueModelPartThumbsRender();
        saveSettings();
    });
}

// ── Sidebar collapse toggle ──────────────────────────────────────────────────────
document.getElementById('btnCollapseSidebar')?.addEventListener('click', () => {
    const collapsed = document.documentElement.classList.toggle('sidebar-collapsed');
    const btn = document.getElementById('btnCollapseSidebar');
    if (btn) btn.title = collapsed ? 'Expand panel' : 'Collapse panel';
    try { localStorage.setItem('rotater_sidebarCollapsed', collapsed ? '1' : '0'); } catch (e) { }
    syncCanvasSize(); // immediate; ResizeObserver handles transition frames
});
// Restore collapse state
try {
    if (localStorage.getItem('rotater_sidebarCollapsed') === '1') {
        document.documentElement.classList.add('sidebar-collapsed');
        const btn = document.getElementById('btnCollapseSidebar');
        if (btn) btn.title = 'Expand panel';
    }
} catch (e) { }

document.getElementById('btnOpenExportModal')?.addEventListener('click', () => {
    document.getElementById('exportOverlay').hidden = false;
    refreshExportPreviewNow();
});

document.getElementById('btnExportClose')?.addEventListener('click', () => {
    if (isDesktopV2Layout()) return;
    document.getElementById('exportOverlay').hidden = true;
});

document.getElementById('exportOverlay')?.addEventListener('click', (e) => {
    if (isDesktopV2Layout()) return;
    if (e.target === e.currentTarget) document.getElementById('exportOverlay').hidden = true;
});

btnDownloadPackage?.addEventListener('click', async () => {
    if (!mesh) return;
    let prev = '';
    try {
        prev = btnDownloadPackage.innerHTML;
        btnDownloadPackage.textContent = 'Packaging...';
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
        download(zipBlob, `${base}_rotater-package.zip`, 'application/zip');
        btnDownloadPackage.textContent = 'Downloaded';
        setTimeout(() => { btnDownloadPackage.innerHTML = prev; }, 1600);
    } catch (err) {
        console.error(err);
        setStatus('Could not build ZIP package.');
        btnDownloadPackage.innerHTML = prev;
    } finally {
        btnDownloadPackage.disabled = false;
    }
});

// ── Info overlay ──────────────────────────────────────────────────────────────
document.getElementById('btnInfo').addEventListener('click', () => {
    document.getElementById('infoOverlay').hidden = false;
});
document.getElementById('btnInfoClose').addEventListener('click', () => {
    document.getElementById('infoOverlay').hidden = true;
});
document.getElementById('infoOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('infoOverlay').hidden = true;
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !isDesktopV2Layout() && !document.getElementById('exportOverlay').hidden) {
        document.getElementById('exportOverlay').hidden = true;
        return;
    }
    if (e.key === 'Escape' && !document.getElementById('infoOverlay').hidden) {
        document.getElementById('infoOverlay').hidden = true;
    }
});

// ── Export frame overlay toggle ───────────────────────────────────────────────
frameOverlayBtn?.addEventListener('click', () => {
    if (exportFrameEnabled) {
        confirmCropMode();
        return;
    }
    exportFrameEnabled = true;
    if (exportFrameEnabled) {
        // Entering crop mode: back up framing and physically zoom viewport so object seamlessly shrinks into crop UI
        _cropBackupDist = exportCamDist;
        _cropBackupElev = exportCamElev;
        _cropBackupZoom = exportCamZoom;
        if (camera) {
            _cropBackupCameraZoom = camera.zoom || 1;
            camera.zoom = _cropBackupCameraZoom * CROP_FRAME_UI_SCALE;
            camera.updateProjectionMatrix();
        }
        if (controls) {
            _cropBackupEnableRotate = controls.enableRotate;
            _cropBackupMouseButtons = { ...controls.mouseButtons };
            _cropBackupTouches = { ...controls.touches };
            controls.enableRotate = false;
            controls.enablePan = true;
            controls.screenSpacePanning = true;
            controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
            controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
            controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
            controls.touches.ONE = THREE.TOUCH.PAN;
            controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
        }
        _cropLiveSyncArmed = true;
        syncExportCameraFromViewport();
    }
    updateCropHintUI();
    updateFrameOverlayButtonUI();
    updateRulerHUD();
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
    if (camera) {
        camera.zoom = _cropBackupCameraZoom || 1;
        camera.updateProjectionMatrix();
    }
    if (controls) {
        controls.enableRotate = _cropBackupEnableRotate;
        if (_cropBackupMouseButtons) controls.mouseButtons = { ..._cropBackupMouseButtons };
        if (_cropBackupTouches) controls.touches = { ..._cropBackupTouches };
    }
    exportFrameEnabled = false;
    updateCropHintUI();
    updateFrameOverlayButtonUI();
    _cropLiveSyncArmed = false;
    clearExportFrame();
    updateRulerHUD();
    saveSettings();
}

function confirmCropMode() {
    if (!exportFrameEnabled) return;
    // Commit current live crop framing.
    syncExportCameraFromViewport();
    // Revert the viewport's physical *0.82 shrink so it bounds to the canvas instead of the crop UI
    if (camera) {
        camera.zoom = (camera.zoom || 1) / CROP_FRAME_UI_SCALE;
        camera.updateProjectionMatrix();
    }
    if (controls) {
        controls.enableRotate = _cropBackupEnableRotate;
        if (_cropBackupMouseButtons) controls.mouseButtons = { ..._cropBackupMouseButtons };
        if (_cropBackupTouches) controls.touches = { ..._cropBackupTouches };
    }
    exportFrameEnabled = false;
    updateCropHintUI();
    updateFrameOverlayButtonUI();
    _cropLiveSyncArmed = false;
    clearExportFrame();
    updateRulerHUD();
    saveSettings();
}

document.getElementById('btnCancelCrop').addEventListener('click', cancelCropMode);
document.getElementById('btnConfirmCrop')?.addEventListener('click', confirmCropMode);
updateFrameOverlayButtonUI();

// Click outside (dim regions) intentionally does NOT cancel — use the buttons or Esc/Enter

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && exportFrameEnabled) cancelCropMode();
    if ((e.key === 'Enter' || e.key === 'Return') && exportFrameEnabled) confirmCropMode();
});

// ── Crop corner drag to snap aspect ratio ─────────────────────────────────────
let _cropCornerDrag = null; // { id, startX, startY, initW, initH } or null

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
const setStatus = msg => { statusEl.textContent = msg; };
const setAnimStatus = (msg, done, total) => {
    if (animStatusEl) animStatusEl.textContent = msg;
    const prog = document.getElementById('animProgress');
    const fill = document.getElementById('animProgressFill');
    if (prog && fill) {
        const show = done != null && total != null && total > 0;
        prog.hidden = !show;
        if (show) fill.style.width = `${Math.round(done / total * 100)}%`;
    }
};
const setExporting = v => {
    isExporting = v;
    btnGif.disabled = v;
    btnVideo.disabled = v;
    if (btnPng) btnPng.disabled = v;
    const jpegBtn = document.getElementById('btnExportJpeg');
    if (jpegBtn) jpegBtn.disabled = v;
    const mainBtn = document.getElementById('btnExport');
    if (mainBtn) mainBtn.disabled = v;
};

function download(data, filename, type) {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: filename,
    });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function getQualityTag() {
    const q = document.getElementById('exportQuality')?.value ?? 'std';
    return ({ web: 'low', std: 'medium', high: 'high' }[q]) || q;
}

function getExportModifierTags(format) {
    const tags = [];
    if (format === 'gif') {
        const loopOn = document.getElementById('gifLoop')?.checked ?? true;
        tags.push(loopOn ? 'loop' : 'noloop');
        if (document.getElementById('gifDither')?.checked) tags.push('dither');
        if (document.getElementById('exportTransparent')?.checked) tags.push('transparent');
    } else if (format === 'png' || format === 'jpg') {
        if (EXPORT.image.presetTag) tags.push(EXPORT.image.presetTag);
        if (format !== 'png') return tags;
        const transparentPng = document.getElementById('exportTransparentPng')?.checked
            ?? document.getElementById('exportTransparent')?.checked
            ?? false;
        if (transparentPng) tags.push('transparent');
    }
    return tags;
}

function buildExportFilename(format) {
    const ext = ({ gif: 'gif', mp4: 'mp4', png: 'png', jpg: 'jpg' }[format]) || format;
    const base = `Rotater_${currentFileName}`;
    const mode = rotateModeEl.value || 'spin';
    const quality = getQualityTag();
    const modifiers = getExportModifierTags(format);
    return [base, mode, quality, ...modifiers].join('_') + '.' + ext;
}

async function renderStillImageBlob(type, { quality = 0.92, transparent = false } = {}) {
    if (!renderer || !camera || !scene || !mesh) throw new Error('Viewer is not ready.');

    if (exportFrameEnabled) syncExportCameraFromViewport();

    const { width: W, height: H } = getImageExportSize();

    const savedAspect = camera.aspect;
    const savedZoom = camera.zoom;
    const savedCamPos = camera.position.clone();
    const savedUp = camera.up.clone();
    const savedTarget = controls?.target ? controls.target.clone() : new THREE.Vector3(0, 0, 0);
    const savedBg = scene.background;
    const savedClearColor = renderer.getClearColor(new THREE.Color());
    const savedClearAlpha = renderer.getClearAlpha();

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

    if (transparent) {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
    }

    syncLightRig();
    renderer.render(scene, camera);

    // Synchronously copy the export frame to an offscreen canvas BEFORE any
    // await, so the main renderer/camera can be restored within the same JS
    // task — preventing the animation loop from seeing the oversized canvas.
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const outCtx = out.getContext('2d');
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(canvas, 0, 0, W, H); // downscale 2× → SSAA
    drawRulerOverlay(outCtx, W, H, camera);

    // Restore scene + camera exactly as the user had them, synchronously.
    if (transparent) {
        scene.background = savedBg;
        renderer.setClearColor(savedClearColor, savedClearAlpha);
    }
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

    const savedBg = scene.background;
    const savedClearColor = renderer.getClearColor(new THREE.Color());
    const savedClearAlpha = renderer.getClearAlpha();
    if (transparent) {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
    }

    const { target, dist, elev, az } = getOrbitFrameState();
    // Use stored export framing only in crop mode; otherwise mirror the live viewport.
    const exportDist = (exportFrameEnabled && exportCamDist !== null) ? exportCamDist : dist;
    const exportElev = (exportFrameEnabled && exportCamDist !== null) ? exportCamElev : elev;

    let exportZoom;
    if (exportFrameEnabled && exportCamDist !== null) {
        exportZoom = exportCamZoom || 1;
    } else {
        const canvasAspect = savedViewW / Math.max(1, savedViewH);
        const exportAspect = W / H;
        exportZoom = camera.zoom || 1;
        if (exportAspect > canvasAspect) {
            exportZoom *= (exportAspect / canvasAspect);
        }
    }

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
    const outCtx = out.getContext('2d');
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';

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

        if (i % 12 === 0) {
            setAnimStatus(`Capturing… ${i + 1} / ${n}`, i + 1, n);
            await new Promise(r => setTimeout(r, 0));
        }
    }

    if (transparent) {
        scene.background = savedBg;
        renderer.setClearColor(savedClearColor, savedClearAlpha);
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
    if (!mesh) return;
    setExporting(true);
    controls.autoRotate = false;

    try {
        const { fps, loop, dither } = EXPORT.gif;
        const { width: W, height: H } = getImageExportSize();
        const isTransparent = document.getElementById('exportTransparent')?.checked ?? false;
        const frames = await captureFrames(exportFrames(fps), { width: W, height: H }, isTransparent);
        const delay = Math.round(1000 / fps);

        setAnimStatus('Encoding GIF…');
        await new Promise(r => setTimeout(r, 0));

        const repeat = loop ? 0 : -1;
        const gif = GIFEncoder();
        for (let i = 0; i < frames.length; i++) {
            let index, palette;
            if (isTransparent) {
                // Reserve palette index 255 as transparent; quantize using 255 colors
                const pal = quantize(frames[i], 255);
                // gifenc writeFrame needs a 2D [[r,g,b],...] palette — pad to 256 entries so index 255 is the transparent slot
                const fullPal = pal.slice();
                while (fullPal.length < 256) fullPal.push([0, 0, 0]);
                // applyPalette uses an internal rgb565 hash LUT — O(1) per pixel after warm-up.
                // Then stamp 255 over transparent pixels in a single cheap pass.
                const indices = applyPalette(frames[i], pal);
                for (let px = 0; px < W * H; px++) {
                    if (frames[i][px * 4 + 3] < 128) indices[px] = 255;
                }
                gif.writeFrame(indices, W, H, { palette: fullPal, delay, transparent: true, transparentIndex: 255, ...(i === 0 && { repeat }) });
            } else {
                palette = quantize(frames[i], 256);
                index = dither
                    ? applyPaletteDithered(frames[i], palette, W, H)
                    : applyPalette(frames[i], palette);
                gif.writeFrame(index, W, H, { palette, delay, ...(i === 0 && { repeat }) });
            }

            if (i % 16 === 0) {
                setAnimStatus(`Encoding… ${i + 1} / ${frames.length}`, i + 1, frames.length);
                await new Promise(r => setTimeout(r, 0));
            }
        }

        gif.finish();
        download(gif.bytes(), buildExportFilename('gif'), 'image/gif');
        setAnimStatus('GIF saved ✓');
    } catch (err) {
        setAnimStatus('Error: ' + err.message);
        console.error(err);
    } finally {
        setExporting(false);
        controls.autoRotate = !isPaused && (rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360));
        setTimeout(() => setAnimStatus(''), 5000);
    }
});

// ── Video export (H.264 MP4 via WebCodecs + mp4-muxer) ───────────────────────
btnVideo.addEventListener('click', async () => {
    if (!mesh) return;
    if (typeof VideoEncoder === 'undefined') {
        setAnimStatus('Error: WebCodecs not supported in this browser (use Chrome/Edge/Safari 16.4+).');
        return;
    }
    setExporting(true);
    controls.autoRotate = false;

    try {
        if (exportFrameEnabled) syncExportCameraFromViewport();
        const { fps, bitrate, loops } = EXPORT.mp4;
        const { width: W, height: H } = getImageExportSize();
        const n = exportFrames(fps);
        const totalFrames = n * (loops + 1);

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
        const totalPixels = W * H;
        const avcLevel = totalPixels > 2097152 ? '33' : (totalPixels > 921600 ? '28' : '1f');
        encoder.configure({
            codec: `avc1.4200${avcLevel}`,
            width: W,
            height: H,
            bitrate: bitrate,
            framerate: fps,
        });

        const { target, dist, elev, az } = getOrbitFrameState();
        // Use stored export framing only in crop mode; otherwise mirror the live viewport.
        const exportDist = (exportFrameEnabled && exportCamDist !== null) ? exportCamDist : dist;
        const exportElev = (exportFrameEnabled && exportCamDist !== null) ? exportCamElev : elev;

        let exportZoom;
        if (exportFrameEnabled && exportCamDist !== null) {
            exportZoom = exportCamZoom || 1;
        } else {
            const canvasAspect = savedViewW / Math.max(1, savedViewH);
            const exportAspect = W / H;
            exportZoom = camera.zoom || 1;
            if (exportAspect > canvasAspect) {
                exportZoom *= (exportAspect / canvasAspect);
            }
        }

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
        const outCtx = out.getContext('2d');
        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = 'high';

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
            encoder.encode(frame, { keyFrame: f % 30 === 0 });
            frame.close();

            if (f % 12 === 0) {
                setAnimStatus(`Encoding… ${f + 1} / ${totalFrames}`, f + 1, totalFrames);
                await new Promise(r => setTimeout(r, 0));
            }
        }

        await encoder.flush();
        if (encoderError) throw encoderError;
        muxer.finalize();

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
    } catch (err) {
        setAnimStatus('Error: ' + err.message);
        console.error(err);
    } finally {
        setExporting(false);
        controls.autoRotate = !isPaused && (rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360));
        setTimeout(() => setAnimStatus(''), 5000);
    }
});

// ── Restore on load ───────────────────────────────────────────────────────────
initTextureNewsUI();

restoreSession().finally(() => {
    // Remove anti-FOUC guard once session restore attempt is complete,
    // whether it succeeded (html.loaded is set) or not.
    // Ensure preview reflects restored transparent setting immediately
    try { syncTransparentCheckboxes('exportTransparent'); } catch (e) { }
    document.documentElement.classList.remove('has-session');
});

// ── Preset Gallery ──────────────────────────────────────────────────────────
// Accurate per-material sphere visuals (used by model presets + BG model swatch)
const THUMB_STYLES = {
    chrome: {
        bg: '#d0d0d0',
        overlay: 'radial-gradient(circle at 30% 25%, #fff 0%, rgba(255,255,255,0.8) 6%, rgba(180,180,180,0.2) 22%, transparent 45%), radial-gradient(circle at 70% 75%, rgba(0,0,0,0.7) 0%, transparent 55%)'
    },
    ink: {
        bg: '#0d0d0d',
        overlay: 'radial-gradient(circle at 32% 27%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 8%, transparent 28%), radial-gradient(circle at 68% 72%, rgba(255,255,255,0.04) 0%, transparent 40%)'
    },
    ceramic: {
        bg: '#fef8f0',
        overlay: 'radial-gradient(circle at 38% 30%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 22%, rgba(230,210,190,0.25) 50%, rgba(190,165,140,0.45) 100%)'
    },
    glass: {
        bg: 'rgba(210,245,252,0.35)',
        overlay: 'radial-gradient(circle at 28% 24%, #fff 0%, rgba(255,255,255,0.6) 7%, rgba(200,242,255,0.15) 28%, transparent 48%), radial-gradient(circle at 68% 70%, rgba(200,242,255,0.3) 0%, transparent 50%), radial-gradient(circle at 52% 52%, rgba(100,200,240,0.08) 0%, transparent 70%)',
        extra: 'border: 1px solid rgba(130,210,240,0.55);'
    },
    chocolate: {
        bg: '#3a1c06',
        overlay: 'radial-gradient(circle at 36% 30%, rgba(180,110,50,0.55) 0%, rgba(120,65,20,0.25) 18%, transparent 48%), radial-gradient(circle at 65% 70%, rgba(0,0,0,0.7) 0%, transparent 55%)'
    },
    gumball: {
        bg: '#ff8fb5',
        overlay: 'radial-gradient(circle at 34% 28%, rgba(255,255,255,0.78) 0%, rgba(255,230,240,0.45) 18%, transparent 46%), radial-gradient(circle at 66% 72%, rgba(210,60,110,0.28) 0%, transparent 50%)'
    },
    gold: {
        bg: '#f5c400',
        overlay: 'radial-gradient(circle at 30% 26%, rgba(255,255,220,0.95) 0%, rgba(255,235,100,0.6) 10%, rgba(240,190,0,0.2) 28%, transparent 48%), radial-gradient(circle at 68% 72%, rgba(140,90,0,0.75) 0%, transparent 55%)'
    }
};

let QUICK_PRESETS = [];

function reconcileModelPresetFromSettings(force = false) {
    // If presets aren't loaded yet or the user already has a non-custom active
    // preset, nothing to do.
    if (!QUICK_PRESETS || QUICK_PRESETS.length === 0) return;
    if (!force && activeModelPreset && activeModelPreset !== 'custom') return;

    activeModelPreset = 'custom';

    const curShade = shadingEl?.value;
    const curColor = colorPick?.value ? colorPick.value.toLowerCase() : null;
    for (const preset of QUICK_PRESETS) {
        if (!preset || !preset.url) continue;
        try {
            const p = getURLSettings(preset.url);
            if (!p) continue;
            // Match by shading first, then color when provided by preset
            if (p.shading && curShade && p.shading === curShade) {
                // If the preset encodes matte/roughness values, prefer a stricter match
                const presetRough = p.textureTuneMatteRoughness != null ? String(p.textureTuneMatteRoughness) : null;
                const presetRefl = p.textureTuneMatteReflection != null ? String(p.textureTuneMatteReflection) : null;
                const curRough = typeof textureTuneState !== 'undefined' && textureTuneState.matteRoughness != null ? String(textureTuneState.matteRoughness) : null;
                const curRefl = typeof textureTuneState !== 'undefined' && textureTuneState.matteReflection != null ? String(textureTuneState.matteReflection) : null;

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
    { id: 'white', name: 'White', color: '#ffffff' },
    { id: 'black', name: 'Black', color: '#000000' },
    { id: 'modelcolor', name: 'Model', color: null }
];

function updateDynamicBg() {
    if (!isDynamicBg || !renderer) return;
    let baseHex;
    if (activeBgPreset === 'modelcolor') {
        baseHex = getModelSyncSourceColor();
    } else {
        baseHex = bgPick.value;
    }
    const c = new THREE.Color(baseHex);
    const hsl = {};
    c.getHSL(hsl);
    // Push L toward white while preserving H and S (no desaturation)
    hsl.l = hsl.l + (0.92 - hsl.l) * 0.75;
    renderer.setClearColor(new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l), 1);
}

// Hook model color changes to update dynamic bg and Model preset swatch
colorPick.addEventListener('input', updateDynamicBg);
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
            renderer && renderer.setClearColor(new THREE.Color(syncColor), 1);
        }
    }
});

// SVG rainbow ring for custom swatches — matches the provided design SVG
function rainbowRingSvg(svgId, fillColor) {
    const gid = `rr-${svgId}`;
    return `<svg id="${svgId}" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44" fill="none" style="display:block;cursor:pointer;"><circle cx="22" cy="22" r="19.5" fill="${fillColor}" stroke="url(#${gid})" stroke-width="3"/><defs><radialGradient id="${gid}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(43 18) rotate(156.894) scale(43.7)"><stop stop-color="#FF0909"/><stop offset="0.240385" stop-color="#FF9D00"/><stop offset="0.538462" stop-color="#FFF718"/><stop offset="0.740385" stop-color="#84FF00"/><stop offset="0.9375" stop-color="#8C00FF"/></radialGradient></defs></svg>`;
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

    const s = getSelectedPartSettings();
    applyPresetIntoPartSettings(s, p);
    modelPartBaseColors[modelPartSelected] = s.color;
    syncUIFromSelectedPart();

    if (mesh) rebuildMeshMaterialsForCurrentShading();
    persistCurrentMultipartParts();

    // Keep each part's custom baseline aligned to its latest preset-applied state.
    storeCustomSettings();

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
    queueModelPartThumbsRender();
    updateModelSelection();
    updateBgSelection();
    saveSettings();
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

        const ts = THUMB_STYLES[preset.id] || { bg: preset.color, overlay: 'radial-gradient(circle at 36% 32%, rgba(255,255,255,0.6) 5%, transparent 40%, rgba(0,0,0,0.3) 100%)' };
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
        };
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
    syncBgModelSyncSourceUI();
    syncModelPartSelectorUI();
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
        isDynamicBg = autoBgCheckEl.checked;
        if (isDynamicBg) updateDynamicBg();
        else {
            // Restore base preset color when turning auto-adjust off
            if (activeBgPreset === 'modelcolor') {
                renderer && renderer.setClearColor(new THREE.Color(getModelSyncSourceColor()), 1);
            } else if (activeBgPreset === 'custom') {
                bgPick.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                const preset = BG_PRESETS.find(p => p.id === activeBgPreset);
                if (preset && preset.color) bgPick.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    });
}

const rulerToggleEl = document.getElementById('rulerToggle');
if (rulerToggleEl) {
    rulerToggleEl.checked = !!rulerEnabled;
    rulerToggleEl.addEventListener('change', () => {
        rulerEnabled = rulerToggleEl.checked;
        updateRulerHUD();
        updateLiveRulerOverlay();
        refreshExportPreviewNow();
        saveSettings();
    });
}

const rulerUnitToggleEl = document.getElementById('rulerUnitToggle');
if (rulerUnitToggleEl) {
    rulerUnitToggleEl.addEventListener('click', () => {
        rulerUnit = (rulerUnit === 'metric') ? 'imperial' : 'metric';
        updateRulerHUD();
        updateLiveRulerOverlay();
        refreshExportPreviewNow();
        saveSettings();
    });
}

const rulerLinesToggleEl = document.getElementById('rulerLinesToggle');
if (rulerLinesToggleEl) {
    rulerLinesToggleEl.addEventListener('change', () => {
        rulerLinesVisible = !!rulerLinesToggleEl.checked;
        updateRulerHUD();
        updateLiveRulerOverlay();
        saveSettings();
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
            ? `<span class="shading-thumb" id="bg-preset-${preset.id}" style="border-radius:50%;width:44px;height:44px;position:relative;overflow:hidden;cursor:pointer;background-color:transparent;display:flex;align-items:center;justify-content:center;"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.2 12.05C7.2 12.65 7.308 13.246 7.524 13.838C7.74 14.43 8.072 14.979 8.52 15.485L8.565 15.53V14.815C8.565 14.476 8.685 14.186 8.925 13.945C9.165 13.705 9.455 13.585 9.795 13.585C10.135 13.585 10.425 13.705 10.665 13.945C10.905 14.186 11.025 14.476 11.025 14.815V18.695C11.025 19.034 10.905 19.324 10.665 19.565C10.425 19.805 10.135 19.925 9.795 19.925H5.91C5.57 19.925 5.28 19.805 5.04 19.565C4.8 19.324 4.68 19.034 4.68 18.695C4.68 18.355 4.8 18.065 5.04 17.825C5.28 17.584 5.57 17.464 5.91 17.464H7.08L7.035 17.419C6.249 16.633 5.671 15.783 5.301 14.869C4.931 13.955 4.746 13.015 4.746 12.05C4.746 10.515 5.145 9.106 5.943 7.823C6.741 6.539 7.816 5.575 9.168 4.931C9.445 4.793 9.722 4.808 10 4.978C10.277 5.147 10.469 5.393 10.577 5.715C10.669 6.023 10.657 6.331 10.542 6.639C10.426 6.947 10.223 7.186 9.93 7.355C9.1 7.832 8.435 8.485 7.935 9.315C7.435 10.146 7.2 11.057 7.2 12.05ZM16.8 12C16.8 11.4 16.692 10.804 16.476 10.212C16.26 9.62 15.928 9.071 15.48 8.565L15.435 8.52V9.235C15.435 9.575 15.315 9.864 15.075 10.105C14.835 10.345 14.545 10.465 14.205 10.465C13.865 10.465 13.575 10.345 13.335 10.105C13.095 9.864 12.975 9.575 12.975 9.235V5.35C12.975 5.01 13.095 4.72 13.335 4.48C13.575 4.239 13.865 4.12 14.205 4.12H18.09C18.43 4.12 18.72 4.239 18.96 4.48C19.2 4.72 19.32 5.01 19.32 5.35C19.32 5.689 19.2 5.979 18.96 6.22C18.72 6.46 18.43 6.58 18.09 6.58H16.92L16.965 6.625C17.751 7.411 18.329 8.261 18.699 9.175C19.069 10.089 19.254 11.03 19.254 12C19.254 13.535 18.855 14.944 18.057 16.227C17.259 17.511 16.184 18.475 14.832 19.119C14.555 19.257 14.277 19.242 14 19.073C13.723 18.903 13.531 18.657 13.423 18.335C13.331 18.028 13.343 17.72 13.458 17.412C13.574 17.104 13.777 16.864 14.07 16.695C14.9 16.218 15.565 15.565 16.065 14.735C16.565 13.905 16.8 12.993 16.8 12Z" fill="currentColor"/></svg></span>`
            : `<span class="shading-thumb" id="bg-preset-${preset.id}" style="border-radius:50%;width:44px;height:44px;position:relative;overflow:hidden;cursor:pointer;background-color:${preset.color};border:1.5px solid ${preset.id === 'white' ? '#b8b6ca' : (preset.id === 'black' ? '#5d5a74' : 'transparent')};"></span>`;

        wrap.innerHTML = `
            <label class="shading-option preset-option" title="${preset.name} background">
                ${swatchInner}
            </label>
            <span class="thumb-label">${preset.name}</span>
        `;

        const actionArea = wrap.querySelector('.shading-option');
        actionArea.addEventListener('click', () => {
            activeBgPreset = preset.id;
            if (preset.id !== 'modelcolor') lastNonModelBgPreset = preset.id;
            // Respect existing auto-adjust state
            const autoBg = document.getElementById('autoBgCheck');
            isDynamicBg = autoBg ? autoBg.checked : false;
            if (preset.id === 'modelcolor') {
                const syncColor = getModelSyncSourceColor();
                bgPick.value = syncColor;
                if (isDynamicBg) updateDynamicBg();
                else renderer && renderer.setClearColor(new THREE.Color(syncColor), 1);
            } else {
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
            if (typeof input.showPicker === 'function') {
                try { input.showPicker(); } catch (e) { input.click(); }
                return;
            }
            const thumb = customWrap.querySelector('.shading-thumb');
            if (thumb) {
                const rect = thumb.getBoundingClientRect();
                const prev = { position: input.style.position, left: input.style.left, top: input.style.top, width: input.style.width, height: input.style.height, clip: input.style.clip, pointerEvents: input.style.pointerEvents };
                Object.assign(input.style, { position: 'absolute', left: `${rect.left + window.scrollX}px`, top: `${rect.top + window.scrollY}px`, width: `${rect.width}px`, height: `${rect.height}px`, clip: 'auto', pointerEvents: 'auto' });
                input.click();
                setTimeout(() => {
                    Object.assign(input.style, { position: prev.position || 'absolute', left: prev.left || '', top: prev.top || '', width: prev.width || '0px', height: prev.height || '0px', clip: prev.clip || 'rect(0,0,0,0)', pointerEvents: prev.pointerEvents || 'none' });
                }, 800);
            } else {
                input.click();
            }
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



function renderModelShadeSelector() {
    const sel = document.getElementById('modelShadeSelector');
    if (!sel) return;
    sel.innerHTML = '';
    // Tone dots: 0 is baseline color; ends are bounded +/-20% brightness.
    const values = [-100, -75, -50, -25, 0, 25, 50, 75, 100];
    const currentVal = parseInt(opacitySlider ? opacitySlider.value : 0, 10);
    values.forEach((val) => {
        const dot = document.createElement('div');
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.borderRadius = '50%';
        dot.style.cursor = 'pointer';
        // Show actual model color at each tone stop.
        const baseC = computeTonedColor(colorPick ? colorPick.value : '#2e2b74', val);
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

// Add an event listener to opacitySlider to re-render the dots when loaded from localstorage
if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
        renderModelShadeSelector();
    });
}

function initPresetGallery() {
    renderModelPresets();
    renderBgPresets();
    renderModelShadeSelector();
}
initPresetGallery();
