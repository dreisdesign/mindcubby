import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { GIFEncoder, quantize, applyPalette, nearestColorIndex } from 'gifenc';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import JSZip from 'jszip';

// Paste any Rotater URL here to use it as the default settings for first-time visitors
const DEFAULT_SETTINGS_URL = 'https://dreisdesign.github.io/mindcubby/3d/apps/rotater/?c=b4aed6&b=8d8ab7&sh=phong&rm=spin&sp=2&tr=360&wsr=360&sd=1&gl=1&ef=gif&eq=std&ed=square&et=0&gd=0&jq=90&tto=1&tl=75&tc=200&thi=250&ts=100&tsa=0&tsh=115&tpr=100&tpe=125&tcr=100&tce=200&ecd=106.4679&ece=0.0000&rv=1&rg=1&aba=1&abp=modelcolor&bpr=modelcolor&bpab=1';

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
    return Math.max(baseFps, Math.min(60, minSmoothFps));
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
        black: '#000000',
        bgThumb: '#d0d0d0',
        ink: '#0d0d0d',
        ceramic: '#fef8f0',
        glassBorder: 'rgba(130,210,240,0.55)',
        chocolate: '#3a1c06',
        gumball: '#ff8fb5',
        gold: '#f5c400',
        bgBorderLight: '#b8b6ca',
        bgBorderDark: '#5d5a74',
        modelToneFallback: '#2e2b74',
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
const btnUploadStlPrimary = document.getElementById('btnUploadStlPrimary');
const btnUploadStlCanvas = document.getElementById('btnUploadStlCanvas');
const btnUploadStlSidebar = document.getElementById('btnUploadStlSidebar');
const dropZone = document.getElementById('dropZone');
const viewerSec = document.getElementById('viewerSection');
const colorPick = document.getElementById('colorPicker');
const opacitySlider = document.getElementById('opacitySlider');
const opacityVal = document.getElementById('opacityVal');
const quickPresetsBar = document.getElementById('quickPresetsBar');
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
const modelUndoToast = document.getElementById('modelUndoToast');
const modelUndoToastText = document.getElementById('modelUndoToastText');
const btnModelUndoToast = document.getElementById('btnModelUndoToast');
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
const uploadChoiceDontShowEl = document.getElementById('uploadChoiceDontShow');
const uploadChoiceDropZoneEl = document.getElementById('uploadChoiceDropZone');
const uploadChoiceBrowseBtnEl = document.getElementById('btnUploadChoiceBrowse');
const btnUploadChoiceClose = document.getElementById('btnUploadChoiceClose');
const btnUploadChoiceCancel = document.getElementById('btnUploadChoiceCancel');
const btnUploadChoiceImport = document.getElementById('btnUploadChoiceImport');
const btnUploadChoiceAdd = document.getElementById('btnUploadChoiceAdd');
const btnUploadChoiceReplace = document.getElementById('btnUploadChoiceReplace');
const btnDownloadPackage = document.getElementById('btnDownloadPackage');
const exportMotionControlsToggleEl = document.getElementById('exportMotionControlsToggle');
const exportMotionControlsEl = document.getElementById('exportMotionControls');
const exportMotionModeEl = document.getElementById('exportMotionMode');
const exportMotionSpeedEl = document.getElementById('exportMotionSpeed');
const exportMotionRangeEl = document.getElementById('exportMotionRange');
const exportMotionRangeLabelEl = document.getElementById('exportMotionRangeLabel');
const exportMotionRangeValEl = document.getElementById('exportMotionRangeVal');
const autoUIAssistToggleEl = document.getElementById('autoUIAssistToggle');
const exportCollapsedConfirmToggleEl = document.getElementById('exportCollapsedConfirmToggle');
const resetWarningsToggleEl = document.getElementById('resetWarningsToggle');
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
const btnResetModelCard = document.getElementById('btnResetModelCard');
const btnResetBackgroundCard = document.getElementById('btnResetBackgroundCard');
const btnResetBuildPlateCard = document.getElementById('btnResetBuildPlateCard');
const btnResetLightingCard = document.getElementById('btnResetLightingCard');
const btnResetAnimationCard = document.getElementById('btnResetAnimationCard');
const btnResetExportCard = document.getElementById('btnResetExportCard');
// Dev logging and a flag used to suppress saveSettings() while programmatically
// applying restored settings so we don't overwrite localStorage/URL mid-restore.
// Capture passthrough URL params (e.g. debug=1) once at startup so they survive
// URL rewrites done by settingsToURL().
const APP_PARAM_KEYS = new Set([
    'c', 'b', 'op', 'sh', 'rm', 'sp', 'tr', 'wsr', 'sd', 'gl', 'ef', 'eq', 'ed', 'et', 'gd', 'jq',
    'tto', 'tl', 'tc', 'thi', 'ts', 'tsa', 'tll', 'tsh', 'tmr', 'tmm', 'tme', 'tpr', 'tpe', 'tcr', 'tce',
    'rv', 'ru', 'rl', 'rg',
    'ecd', 'ece', 'ecz', 'aba', 'abp', 'amp', 'bsp',
    'bp', 'bpc', 'bpt', 'bps', 'bpf', 'bpp', 'bpw', 'bpd', 'bpsh',
    'uap', 'uam'
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
let activeBgPreset = 'modelcolor';
let activeBuildPlatePreset = 'modelcolor';
let isDynamicBg = true;
let buildPlateAutoBrightnessEnabled = true;
let rulerEnabled = true;
let rulerUnit = 'metric';
let rulerLinesVisible = true;
let rulerOverlayEl = null;
let rulerGridHelper = null;
let rulerGridSize = 0;
let rulerFootprintHelper = null;
let rulerFootprintSignature = '';
const RULER_DYNAMIC_LINES_ENABLED = false;
const RULER_FOOTPRINT_ENABLED = false;
const TEXTURE_NEWS_DISMISSED_KEY = 'rotater_textureNewsDismissed';
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
const MODEL_UNDO_LIMIT = 24;
let modelUndoStack = [];
let suppressModelUndoCapture = false;
let modelPartThumbsQueued = false;
let partThumbRenderTarget = null;
let partThumbCamera = null;
let partThumbScratchCanvas = null;
let partThumbScratchCtx = null;
let multipartPartBounds = null;
let pendingUrlModelAppearanceOverride = null;
let pendingReplacePartIndex = -1;
let currentModelBuffer = null;
let bulkSelectedPartIndices = new Set();
let modelPartSelectorViewMode = 'card';
let multipartPersistTimer = 0;
let modelUndoToastTimer = 0;
let modelUndoToastLastShownAt = 0;

const BULK_SELECT_ICON_PATHS = {
    none: 'M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z',
    some: 'M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM16 14H8V12H16V14ZM19 19H5V5H19V19Z',
    all: 'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-9 14-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9Z',
};

const MODEL_SELECTOR_VIEW_MODES = ['card', 'grid'];

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

// ── SHADE RANGE CONFIGURATION ──────────────────────────────────────────────────
// SHADE_RANGE_PERCENT: Maximum lightness adjustment range (0-100%)
// Example: 40 = slider can adjust by ±40% of the HSL lightness range
// For white (L=100%): ranges from 100% (slider -100) to 60% (slider +100)
// For black (L=0%): ranges from 40% (slider -100) to 0% (slider +100)
const SHADE_RANGE_PERCENT = 40;

const AUTO_BRIGHTNESS_RULES = {
    // DEFAULT: Slider value when auto-brightness is enabled
    background: { shade: -100 },
    buildPlate: { shade: -100 },
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
const renderDeltaClock = new THREE.Clock();
let modelDims = null;  // { w, d, h } in mm (STL units: x=width, y=depth, z=height)
let exportCamDist = null; // stored export camera distance (fit-to-frame, independent of viewport zoom)
let exportCamElev = 0;   // stored export camera elevation (radians)
let exportCamZoom = 1;   // stored export camera projection zoom
let _cropBackupDist = null; // exportCamDist saved on crop-mode enter, restored on cancel
let _cropBackupElev = 0;
let _cropBackupZoom = 1;
let _cropBackupCameraZoom = 1;
let _controlsDefaultMouseButtons = null;
let _controlsDefaultTouches = null;
let _shiftPanActive = false;
let _rightPanVerticalLockActive = false;
let _rightPanVerticalLock = null;
let _cropSx = 0, _cropSy = 0, _cropSw = 0, _cropSh = 0; // crop box pixel rect, updated each frame
let _cropLiveSyncArmed = false; // becomes true only after user adjusts camera during crop mode
let _hasRestoredExportFrame = false; // startup-only flag for applying persisted export framing
let autoDemoLoadSuppressed = false;
let autoDemoLoadScheduled = false;
let _pausedBeforeStillExport = null;
let buildPlateEnabled = true;
let buildPlateColor = null;
let buildPlateShade = BUILD_PLATE_DEFAULTS.shade;
let buildPlateFinish = BUILD_PLATE_DEFAULTS.finish; // matte | satin | gloss
let buildPlateShape = BUILD_PLATE_DEFAULTS.shape; // rectangle | rounded | circle
let buildPlateSizePreset = BUILD_PLATE_DEFAULTS.sizePreset;
let buildPlateWidth = BUILD_PLATE_DEFAULTS.width;
let buildPlateDepth = BUILD_PLATE_DEFAULTS.depth;
let exportMotionControlsEnabled = true;
let _syncingExportMotionControls = false;
let autoUIAssistEnabled = true;
let exportCollapsedConfirmEnabled = true;
let _exportCollapsedConfirmResolver = null;
let uploadChoicePromptEnabled = true;
let uploadDefaultAction = 'replace'; // replace | add
let _uploadChoiceResolver = null;
let pendingUploadAction = null; // replace | add | import (set before opening file picker)
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

const _orbitStateScratch = {
    target: new THREE.Vector3(),
    dist: 1,
    elev: 0,
    az: 0,
};
const _orbitOffsetScratch = new THREE.Vector3();

function getOrbitFrameStateFast() {
    const target = controls?.target || _orbitStateScratch.target.set(0, 0, 0);
    _orbitStateScratch.target.copy(target);
    _orbitOffsetScratch.copy(camera.position).sub(target);
    const dist = Math.max(_orbitOffsetScratch.length(), 1e-6);
    _orbitStateScratch.dist = dist;
    _orbitStateScratch.elev = Math.asin(Math.max(-1, Math.min(1, _orbitOffsetScratch.y / dist)));
    _orbitStateScratch.az = Math.atan2(_orbitOffsetScratch.x, _orbitOffsetScratch.z);
    return _orbitStateScratch;
}

function getOrbitFrameState() {
    const s = getOrbitFrameStateFast();
    return {
        target: s.target.clone(),
        dist: s.dist,
        elev: s.elev,
        az: s.az,
    };
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

function isCanvasPointInsideCropFrame(clientX, clientY) {
    const fc = document.getElementById('exportFrameCanvas');
    if (!fc) return true;
    const rect = fc.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return x >= _cropSx && x <= (_cropSx + _cropSw) && y >= _cropSy && y <= (_cropSy + _cropSh);
}

function getViewportPixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    return Math.min(Math.max(dpr * VIEWPORT_AA_SCALE, VIEWPORT_PIXEL_RATIO_MIN), VIEWPORT_PIXEL_RATIO_MAX);
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
    renderer.setPixelRatio(getViewportPixelRatio());
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
    updateOrbitDistanceLimits(false);
    _controlsDefaultMouseButtons = { ...controls.mouseButtons };
    _controlsDefaultTouches = { ...controls.touches };
    controls.addEventListener('start', () => {
        if (!exportFrameEnabled) return;
        _cropLiveSyncArmed = true;
        syncExportCameraFromViewport();
    });
    controls.addEventListener('change', () => {
        if (_rightPanVerticalLockActive) enforceRightPanVerticalLock();
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
    renderer.setPixelRatio(getViewportPixelRatio());
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
            position: 'absolute',
            left: `${rect.left + window.scrollX}px`,
            top: `${rect.top + window.scrollY}px`,
            width: `${Math.max(1, Math.floor(rect.width))}px`,
            height: `${Math.max(1, Math.floor(rect.height))}px`,
            clip: 'auto',
            pointerEvents: 'auto',
            opacity: '0',
            zIndex: '200',
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

function updateBuildPlateMaterial() {
    const shade = Math.max(-100, Math.min(100, Number(buildPlateShade) || 0));
    const baseHex = getActiveBuildPlateBaseColor();
    const toned = buildPlateAutoBrightnessEnabled
        ? computeBuildPlateAutoBrightnessColor(baseHex)
        : computeBuildPlateShadeColor(baseHex, shade);
    buildPlateShape = normalizeBuildPlateShape(buildPlateShape);
    buildPlateFinish = (buildPlateFinish === 'matte' || buildPlateFinish === 'gloss') ? buildPlateFinish : 'satin';

    if (buildPlateMesh && buildPlateMesh.material) {
        syncBuildPlateShapeMesh();
        buildPlateMesh.material.color.set(toned);

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
        buildPlateMesh.material.needsUpdate = true;
    }

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
    if (buildPlateCustomSizeRowEl) buildPlateCustomSizeRowEl.hidden = buildPlateSizePreset !== 'custom';
    if (buildPlateCustomWidthEl) buildPlateCustomWidthEl.value = String(buildPlateWidth);
    if (buildPlateCustomDepthEl) buildPlateCustomDepthEl.value = String(buildPlateDepth);
}

function syncExportMotionControlsFromMain() {
    if (_syncingExportMotionControls) return;
    _syncingExportMotionControls = true;
    try {
        if (exportMotionControlsEl) exportMotionControlsEl.hidden = !exportMotionControlsEnabled;
        const mode = rotateModeEl.value || 'spin';
        if (exportMotionModeEl) exportMotionModeEl.value = mode;
        if (exportMotionSpeedEl) exportMotionSpeedEl.value = speedSlider.value;

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
        mesh.castShadow = shadowsOn;
        mesh.receiveShadow = false;
    }
    if (shadowCatcher) {
        // Keep projected shadows visible regardless of build plate toggle.
        shadowCatcher.visible = shadowsOn;
        if (shadowCatcher.material && shadowCatcher.material.isShadowMaterial) {
            shadowCatcher.material.opacity = shadowsOn ? (0.02 + shadowsAmt * 0.16) : 0.02;
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
            roughness: (100 - matteRoughness) / 100,
            envMapIntensity: ((matteReflection || 0) / 100) * (textureTuneState.highlights / 100),
        });
    }
    if (shading === "phong" || shading === "clear" || shading === "glass") {
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

function getChevronDownIconSVG(size = 20) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"></path></svg>`;
}

function hideModelUndoToast() {
    if (!modelUndoToast) return;
    modelUndoToast.hidden = true;
    modelUndoToast.setAttribute('aria-hidden', 'true');
    if (modelUndoToastTimer) {
        window.clearTimeout(modelUndoToastTimer);
        modelUndoToastTimer = 0;
    }
}

function showModelUndoToast(message = 'Model updated') {
    if (!modelUndoToast || !btnModelUndoToast || !modelUndoStack.length) return;
    const now = Date.now();
    if (now - modelUndoToastLastShownAt < 300 && !modelUndoToast.hidden) {
        if (modelUndoToastTimer) window.clearTimeout(modelUndoToastTimer);
        modelUndoToastTimer = window.setTimeout(hideModelUndoToast, 5000);
        return;
    }
    modelUndoToastLastShownAt = now;
    if (modelUndoToastText) modelUndoToastText.textContent = message;
    modelUndoToast.hidden = false;
    modelUndoToast.setAttribute('aria-hidden', 'false');
    if (modelUndoToastTimer) window.clearTimeout(modelUndoToastTimer);
    modelUndoToastTimer = window.setTimeout(hideModelUndoToast, 5000);
}

function updateAutoBgShadeControlVisibility() {
    const autoBgEnabled = !!document.getElementById('autoBgCheck')?.checked;
    if (bgOpacitySliderLabel) bgOpacitySliderLabel.hidden = autoBgEnabled;
    if (bgOpacitySlider) bgOpacitySlider.disabled = autoBgEnabled;
}

function updateBuildPlateShadeControlVisibility() {
    const autoOn = buildPlateAutoBrightnessEl
        ? !!buildPlateAutoBrightnessEl.checked
        : !!buildPlateAutoBrightnessEnabled;
    buildPlateAutoBrightnessEnabled = autoOn;
    if (buildPlateShadeRowEl) buildPlateShadeRowEl.hidden = autoOn;
    if (buildPlateShadeSliderEl) buildPlateShadeSliderEl.disabled = autoOn;
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
    const nextMode = MODEL_SELECTOR_VIEW_MODES.includes(mode) ? mode : 'card';
    modelPartSelectorViewMode = nextMode;
    try { localStorage.setItem('rotater_modelPartSelectorViewMode', nextMode); } catch (_) { }
    if (rerender) syncModelPartSelectorUI(true);
}

function cloneModelUndoState() {
    return {
        activeModelPreset,
        activeBgPreset,
        bgSyncPartIndex,
        modelPartSelected,
        modelPartSelectorViewMode,
        modelPartBaseColors: Array.isArray(modelPartBaseColors) ? [...modelPartBaseColors] : [],
        modelPartSettings: Array.isArray(modelPartSettings) ? modelPartSettings.map((settings) => ({ ...settings })) : [],
        customModelSettingsByPart: customModelSettingsByPart && typeof customModelSettingsByPart === 'object'
            ? Object.fromEntries(Object.entries(customModelSettingsByPart).map(([key, value]) => [key, { ...value }]))
            : null,
    };
}

function pushModelUndoState(options = {}) {
    const { showToast = false } = options;
    if (suppressModelUndoCapture) return;
    const snapshot = cloneModelUndoState();
    const lastSnapshot = modelUndoStack[modelUndoStack.length - 1];
    if (lastSnapshot && JSON.stringify(lastSnapshot) === JSON.stringify(snapshot)) return;
    modelUndoStack.push(snapshot);
    if (modelUndoStack.length > MODEL_UNDO_LIMIT) modelUndoStack.shift();
    updateCardResetButtonStates();
    if (showToast) showModelUndoToast();
}

function restoreModelUndoState(snapshot) {
    if (!snapshot) return;
    suppressModelUndoCapture = true;
    activeModelPreset = snapshot.activeModelPreset || '';
    activeBgPreset = snapshot.activeBgPreset || activeBgPreset;
    bgSyncPartIndex = Math.max(0, Math.min(parseInt(String(snapshot.bgSyncPartIndex ?? 0), 10) || 0, Math.max(0, modelPartNames.length - 1)));
    modelPartSelected = Math.max(0, Math.min(parseInt(String(snapshot.modelPartSelected ?? 0), 10) || 0, Math.max(0, modelPartNames.length - 1)));
    modelPartSelectorViewMode = MODEL_SELECTOR_VIEW_MODES.includes(snapshot.modelPartSelectorViewMode)
        ? snapshot.modelPartSelectorViewMode
        : modelPartSelectorViewMode;
    if (Array.isArray(snapshot.modelPartBaseColors)) modelPartBaseColors = [...snapshot.modelPartBaseColors];
    if (Array.isArray(snapshot.modelPartSettings)) modelPartSettings = snapshot.modelPartSettings.map((settings) => ({ ...settings }));
    if (snapshot.customModelSettingsByPart && typeof snapshot.customModelSettingsByPart === 'object') {
        customModelSettingsByPart = Object.fromEntries(Object.entries(snapshot.customModelSettingsByPart).map(([key, value]) => [key, { ...value }]));
    }
    syncUIFromSelectedPart();
    rebuildMeshMaterialsForCurrentShading();
    applyPartColorsToMesh();
    applyCurrentTextureTuning();
    renderModelPresets();
    renderBgPresets();
    if (activeBgPreset === 'modelcolor') {
        const syncColor = getModelSyncSourceColor();
        bgPick.value = syncColor;
        if (isDynamicBg) updateDynamicBg();
        else applyBackgroundFromBaseColor(syncColor);
    }
    syncModelPartSelectorUI();
    queueModelPartThumbsRender();
    saveSettings();
    suppressModelUndoCapture = false;
    updateCardResetButtonStates();
}

function undoLastModelChange() {
    const snapshot = modelUndoStack.pop();
    if (!snapshot) return;
    restoreModelUndoState(snapshot);
    hideModelUndoToast();
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
    let captured = false;
    targets.forEach((idx) => {
        const partSettings = getPartSettings(idx);
        if (!captured) {
            pushModelUndoState({ showToast: targets.length > 1 });
            captured = true;
        }
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
    const toggleAllControl = modelPartSelectorMenu.querySelector('[data-bulk-action="toggle-all"]');
    if (toggleAllControl instanceof HTMLInputElement) {
        const allSelected = partCount > 0 && selectedCount >= partCount;
        const partiallySelected = selectedCount > 0 && selectedCount < partCount;
        toggleAllControl.checked = allSelected;
        toggleAllControl.indeterminate = partiallySelected;
        const labelText = allSelected ? 'Clear selection' : 'Select all';
        toggleAllControl.title = labelText;
        toggleAllControl.setAttribute('aria-label', labelText);
    } else if (toggleAllControl) {
        const state = getBulkSelectionIconState(selectedCount, partCount);
        toggleAllControl.innerHTML = getBulkSelectIconSVG(state);
        toggleAllControl.title = selectedCount >= partCount ? 'Clear selection' : 'Select all';
        toggleAllControl.setAttribute('aria-label', toggleAllControl.title);
    }
}

function syncModelPartCheckboxStates() {
    if (!modelPartSelectorMenu || modelPartSelectorMenu.hidden) return;
    const effectiveSelection = new Set(getUiSelectedPartIndices());
    modelPartSelectorMenu.classList.toggle('has-multi-selection', effectiveSelection.size > 0);
    modelPartSelectorMenu.querySelectorAll('.thumb-select-option-check-input[data-part-bulk-select]').forEach((inputEl) => {
        const idx = parseInt(inputEl.dataset.partBulkSelect || '-1', 10);
        inputEl.checked = effectiveSelection.has(idx);
    });
}

function getPartActionTargetIndices(partIdx) {
    const baseIdx = parseInt(partIdx, 10);
    if (!Number.isInteger(baseIdx) || baseIdx < 0) return [];
    const selected = getUiSelectedPartIndices();
    if (selected.length > 1 && selected.includes(baseIdx)) return selected;
    return [baseIdx];
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

function getFinishModeFromPartSettings(settings) {
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
        partSettings.shading = 'phong';
        partSettings.matteRoughness = rough;
        partSettings.metallicRoughness = rough;
        partSettings.phongRoughness = rough;
        const modeBaseReflection = mode === 'matte' ? 22 : mode === 'satin' ? 40 : 62;
        const reflection = Math.max(6, Math.min(120, modeBaseReflection + ((2 - strength) * 8)));
        partSettings.matteReflection = Math.max(4, reflection - 14);
        partSettings.phongReflection = reflection;
        partSettings.metallicReflection = Math.min(130, reflection + 10);
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
        if (idx === resolvedPartIdx) {
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

    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(partThumbRenderTarget);
    renderer.clear(true, true, true);
    renderer.render(scene, partThumbCamera);
    renderer.readRenderTargetPixels(partThumbRenderTarget, 0, 0, rtW, rtH, pixelBuf);
    renderer.setRenderTarget(savedTarget);

    ctx.clearRect(0, 0, dstW, dstH);

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
    if (modelPartSelectorThumb) modelPartSelectorThumb.hidden = selectedCount === 0;
    modelPartSelectorBtn.classList.toggle('is-empty-selection', selectedCount === 0);
    const firstIndex = selectedIndices[0] ?? Math.max(0, modelPartSelected);
    const firstLabel = modelPartNames[firstIndex] || `Part ${firstIndex + 1}`;

    let titleText = '';
    if (selectedCount === 0) {
        titleText = 'No parts selected';
    } else if (selectedCount <= 1) {
        titleText = `Part ${firstIndex + 1}: ${firstLabel}`;
    } else if (selectedCount === 2) {
        titleText = `Parts ${selectedIndices[0] + 1} and ${selectedIndices[1] + 1}`;
    } else {
        titleText = `Parts ${selectedIndices[0] + 1} +${selectedCount - 1} more`;
    }

    const summaryText = `(${selectedCount}/${totalCount} Selected)`;

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
    if (modelPartSelectorMenu) modelPartSelectorMenu.hidden = true;
    if (modelPartSelectorBtn) modelPartSelectorBtn.setAttribute('aria-expanded', 'false');
    if (bgModelSyncSelectorMenu) bgModelSyncSelectorMenu.hidden = true;
    if (bgModelSyncSelectorBtn) bgModelSyncSelectorBtn.setAttribute('aria-expanded', 'false');
    if (buildPlateModelSyncSelectorMenu) buildPlateModelSyncSelectorMenu.hidden = true;
    if (buildPlateModelSyncSelectorBtn) buildPlateModelSyncSelectorBtn.setAttribute('aria-expanded', 'false');
    closeModelPartActionMenus();
}

function closeModelPartActionMenus() {
    document.querySelectorAll('.part-option-actions').forEach((menu) => {
        menu.hidden = true;
        menu.style.left = '';
        menu.style.top = '';
    });
    if (modelPartSingleMenuBtn) modelPartSingleMenuBtn.setAttribute('aria-expanded', 'false');
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

function positionThumbSelectMenu(menuEl, anchorBtn) {
    if (!menuEl || !anchorBtn) return;
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

function trapMenuWheelScroll(menuEl) {
    if (!menuEl || menuEl.dataset.wheelTrapBound === '1') return;
    menuEl.dataset.wheelTrapBound = '1';
    menuEl.addEventListener('wheel', (ev) => {
        const deltaY = ev.deltaY || 0;
        if (!deltaY) return;
        const maxScroll = Math.max(0, menuEl.scrollHeight - menuEl.clientHeight);
        if (maxScroll <= 0) {
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }
        const prev = menuEl.scrollTop;
        const next = Math.max(0, Math.min(maxScroll, prev + deltaY));
        menuEl.scrollTop = next;
        if (next !== prev || (deltaY < 0 && prev <= 0) || (deltaY > 0 && prev >= maxScroll)) {
            ev.preventDefault();
        }
        ev.stopPropagation();
    }, { passive: false });
}

modelPartSelectorBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (modelPartSelectorBtn.classList.contains('is-static')) return;
    const open = modelPartSelectorMenu && !modelPartSelectorMenu.hidden;
    closeThumbSelectMenus();
    if (modelPartSelectorMenu && !open) {
        modelPartSelectorMenu.hidden = false;
        positionThumbSelectMenu(modelPartSelectorMenu, modelPartSelectorBtn);
        modelPartSelectorMenu.scrollTop = 0;
        modelPartSelectorBtn.setAttribute('aria-expanded', 'true');
        queueModelPartThumbsRender();
    }
});

modelPartSingleMenuBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const menu = modelPartSingleActions;
    if (!menu) return;
    const willOpen = !!menu.hidden;
    closeThumbSelectMenus();
    closeModelPartActionMenus();
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
    const open = bgModelSyncSelectorMenu && !bgModelSyncSelectorMenu.hidden;
    closeThumbSelectMenus();
    if (bgModelSyncSelectorMenu && !open) {
        bgModelSyncSelectorMenu.hidden = false;
        positionThumbSelectMenu(bgModelSyncSelectorMenu, bgModelSyncSelectorBtn);
        bgModelSyncSelectorMenu.scrollTop = 0;
        bgModelSyncSelectorBtn.setAttribute('aria-expanded', 'true');
        queueModelPartThumbsRender();
    }
});

buildPlateModelSyncSelectorBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const open = buildPlateModelSyncSelectorMenu && !buildPlateModelSyncSelectorMenu.hidden;
    closeThumbSelectMenus();
    if (buildPlateModelSyncSelectorMenu && !open) {
        buildPlateModelSyncSelectorMenu.hidden = false;
        positionThumbSelectMenu(buildPlateModelSyncSelectorMenu, buildPlateModelSyncSelectorBtn);
        buildPlateModelSyncSelectorMenu.scrollTop = 0;
        buildPlateModelSyncSelectorBtn.setAttribute('aria-expanded', 'true');
        queueModelPartThumbsRender();
    }
});

[modelPartSelectorMenu, bgModelSyncSelectorMenu, buildPlateModelSyncSelectorMenu].forEach((menuEl) => {
    trapMenuWheelScroll(menuEl);
});

window.addEventListener('resize', () => {
    if (modelPartSelectorMenu && !modelPartSelectorMenu.hidden && modelPartSelectorBtn) {
        positionThumbSelectMenu(modelPartSelectorMenu, modelPartSelectorBtn);
    }
    if (bgModelSyncSelectorMenu && !bgModelSyncSelectorMenu.hidden && bgModelSyncSelectorBtn) {
        positionThumbSelectMenu(bgModelSyncSelectorMenu, bgModelSyncSelectorBtn);
    }
    if (buildPlateModelSyncSelectorMenu && !buildPlateModelSyncSelectorMenu.hidden && buildPlateModelSyncSelectorBtn) {
        positionThumbSelectMenu(buildPlateModelSyncSelectorMenu, buildPlateModelSyncSelectorBtn);
    }
});

btnModelUndoToast?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    undoLastModelChange();
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

function hasExplicitUrlModelAppearanceParams(params = new URLSearchParams(location.search)) {
    return [
        'c', 'op', 'sh', 'amp',
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

function computeTonedColor(baseHex, toneVal) {
    const baseC = new THREE.Color(baseHex);
    const hsl = { h: 0, s: 0, l: 0 };
    baseC.getHSL(hsl);
    const amount = Math.max(0, Math.min(1, Math.abs(toneVal) / 100));

    if (toneVal < 0) {
        const lift = hsl.l < 0.08 ? 0.56 : 0.30;
        hsl.l = Math.min(1, hsl.l + (1 - hsl.l) * lift * amount);
    } else if (toneVal > 0) {
        hsl.l = Math.max(0, hsl.l * (1 - 0.45 * amount));
    }

    if (hsl.s < 0.02 && hsl.l > 0.02) hsl.s = 0.02;
    baseC.setHSL(hsl.h, hsl.s, hsl.l);
    return baseC;
}

function computeSurfaceShadeColor(baseHex, shadeVal) {
    // Slider range: -100 (brightest) to +100 (darkest)
    // All colors use the same formula — no special casing needed:
    //   Slider left  (-100): L += (1 - L) * SHADE_RANGE_PERCENT%  → pushes toward white
    //   Slider center (0)  : no change
    //   Slider right (+100): L -= L * SHADE_RANGE_PERCENT%         → pushes toward black
    //
    // White  (L=1.0): -100 → L:100%,  0 → L:80%,  +100 → L:60%  (if range=40%)
    // Black  (L=0.0): -100 → L:40%,   0 → L:0%,   +100 → L:0%   (if range=40%)
    // Blue   (L=0.5): -100 → L:70%,   0 → L:50%,  +100 → L:30%  (if range=40%)
    const baseC = new THREE.Color(baseHex);
    const hsl = { h: 0, s: 0, l: 0 };
    baseC.getHSL(hsl);

    const t = shadeVal / 100; // -1.0 to +1.0
    const rangeScale = SHADE_RANGE_PERCENT / 100;

    if (t < 0) {
        // Brighten: lift toward white
        hsl.l = Math.min(1, hsl.l + (1 - hsl.l) * (-t) * rangeScale);
    } else if (t > 0) {
        // Darken: push toward black
        hsl.l = Math.max(0, hsl.l - hsl.l * t * rangeScale);
    }

    if (hsl.s < 0.02 && hsl.l > 0.02) hsl.s = 0.02;
    baseC.setHSL(hsl.h, hsl.s, hsl.l);
    return baseC;
}

function computeBuildPlateShadeColor(baseHex, shadeVal) {
    return computeSurfaceShadeColor(baseHex, shadeVal);
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
    if (activeBuildPlatePreset === 'modelcolor') updateBuildPlateMaterial();
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
        return;
    }

    ensureModelPartDisplayOrder();
    const partCount = modelPartNames.length;
    const singleModel = partCount <= 1;
    const canMutateFiles = !!modelPartFiles && modelPartFiles.length === partCount;
    const canAppend = singleModel ? !!currentModelBuffer : canMutateFiles;
    pruneBulkPartSelection();
    if (modelPartSelectorEl) modelPartSelectorEl.hidden = false;
    modelPartSelectorBtn.hidden = false;
    modelPartSelectorBtn.classList.toggle('is-static', singleModel);
    modelPartSelectorBtn.classList.toggle('is-multipart-summary', !singleModel);
    modelPartSelectorMenu.hidden = !keepMenuOpen;
    modelPartSelectorBtn.setAttribute('aria-expanded', keepMenuOpen ? 'true' : 'false');

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
        bulkBar.innerHTML = `<div class="model-bulk-bar-actions"><label class="model-bulk-toggle-all" title="${allSelected ? 'Clear selection' : 'Select all'}" aria-label="${allSelected ? 'Clear selection' : 'Select all'}"><input type="checkbox" class="thumb-select-option-check-input" data-bulk-action="toggle-all"></label><div class="model-bulk-view" role="group" aria-label="Model selector view"><button type="button" class="model-bulk-view-btn${modelPartSelectorViewMode === 'card' ? ' is-active' : ''}" data-model-view="card">Card</button><button type="button" class="model-bulk-view-btn${modelPartSelectorViewMode === 'grid' ? ' is-active' : ''}" data-model-view="grid">Grid</button></div></div>`;
        bulkBar.addEventListener('click', (ev) => ev.stopPropagation());
        bulkBar.querySelector('[data-bulk-action="toggle-all"]')?.addEventListener('change', (ev) => {
            ev.stopPropagation();
            const shouldSelectAll = !!ev.currentTarget.checked;
            setBulkPartSelectionForAll(shouldSelectAll);
            if (!shouldSelectAll) {
                // Keep one active fallback selected for deterministic editing behavior.
                modelPartSelected = Math.max(0, Math.min(modelPartSelected, Math.max(0, modelPartNames.length - 1)));
            }
            syncActivePartFromUiSelection();
            syncModelPartCheckboxStates();
            syncModelPartBulkUIState();
            queueModelPartThumbsRender();
            saveSettings();
        });
        bulkBar.querySelectorAll('[data-model-view]').forEach((btn) => btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            applyModelPartSelectorViewMode(btn.dataset.modelView, true);
        }));
        modelPartSelectorMenu.appendChild(bulkBar);
        modelPartSelectorMenu.classList.remove('model-selector-view--card', 'model-selector-view--list', 'model-selector-view--grid');
        modelPartSelectorMenu.classList.add(`model-selector-view--${modelPartSelectorViewMode}`);

        getOrderedPartIndices().forEach((idx) => {
            const name = modelPartNames[idx];
            const opt = document.createElement('div');
            opt.className = 'thumb-select-option';
            if (activeBgPreset === 'modelcolor' && idx === bgSyncPartIndex) opt.classList.add('is-bg-sync-source');
            opt.dataset.partIndex = String(idx);
            opt.draggable = !!window.matchMedia && window.matchMedia('(pointer:fine)').matches;
            opt.setAttribute('role', 'option');
            const settings = getPartSettings(idx);
            const hideLabel = settings.hidden ? 'Show' : 'Hide';
            const mutateDisabledAttr = canMutateFiles ? '' : ' disabled title="Part source files are unavailable for editing"';
            const bulkLabel = `Select part ${idx + 1} for bulk edit`;
            const syncOn = activeBgPreset === 'modelcolor' && idx === bgSyncPartIndex;
            opt.innerHTML = `<label class="thumb-select-option-check" title="${bulkLabel}" aria-label="${bulkLabel}"><input type="checkbox" class="thumb-select-option-check-input" data-part-bulk-select="${idx}"></label><button type="button" class="thumb-select-option-main" data-part-select="${idx}"><span class="thumb-select-option-thumb-wrap"><canvas class="thumb-select-option-canvas js-part-thumb-preview" data-part-index="${idx}" width="72" height="72" aria-hidden="true"></canvas><span class="thumb-select-sync-badge" aria-hidden="true">Sync</span></span><span class="thumb-select-option-text">Part ${idx + 1}: ${name}</span></button><button type="button" class="part-option-more" data-part-more="${idx}" aria-label="Part actions">${getPartOptionMoreIconSVG()}</button><div class="part-option-actions" hidden><button type="button" class="part-option-action" data-part-action="replace" data-part-index="${idx}"${mutateDisabledAttr}>Replace STL</button><button type="button" class="part-option-action" data-part-action="hide" data-part-index="${idx}">${hideLabel}</button><button type="button" class="part-option-action part-option-action--toggle" data-part-action="bg-sync-toggle" data-part-index="${idx}"><span>Background Color Sync</span><span class="option-switch${syncOn ? ' is-on' : ''}" aria-hidden="true"></span></button><button type="button" class="part-option-action part-option-action--danger" data-part-action="remove" data-part-index="${idx}"${mutateDisabledAttr}>Delete Model</button></div>`;

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
                    // Re-sync all states to ensure consistency
                    syncModelPartCheckboxStates();
                    syncModelPartBulkUIState();
                    queueModelPartThumbsRender();
                    saveSettings();
                }, false);
            }

            opt.addEventListener('dragstart', (ev) => {
                ev.dataTransfer?.setData('text/plain', String(idx));
                ev.dataTransfer.effectAllowed = 'move';
                opt.classList.add('is-dragging');
            });
            opt.addEventListener('dragend', () => {
                opt.classList.remove('is-dragging');
            });
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

            opt.querySelector('[data-part-select]')?.addEventListener('click', () => {
                clearPresetHoverPreview();
                // Main row click is single-select: switch active part and replace bulk set.
                modelPartSelected = idx;
                bulkSelectedPartIndices.clear();
                setBulkPartSelected(idx, true);
                syncUIFromSelectedPart();
                applyPartColorsToMesh();
                applyCurrentTextureTuning();
                closeThumbSelectMenus();
                syncModelPartCheckboxStates();
                syncModelPartBulkUIState();
                queueModelPartThumbsRender();
                saveSettings();
            });

            opt.querySelector('[data-part-more]')?.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const menu = opt.querySelector('.part-option-actions');
                const willOpen = !!menu?.hidden;
                closeModelPartActionMenus();
                if (!menu || !willOpen) return;
                menu.hidden = false;
                menu.addEventListener('click', (event) => event.stopPropagation());
                positionModelPartActionMenu(menu, ev.currentTarget);
            });

            opt.querySelectorAll('.part-option-action').forEach((actionBtn) => {
                actionBtn.addEventListener('click', async (ev) => {
                    ev.stopPropagation();
                    const action = actionBtn.dataset.partAction;
                    const partIdx = parseInt(actionBtn.dataset.partIndex || '-1', 10);
                    if (!Number.isFinite(partIdx) || partIdx < 0) return;
                    const targetPartIndices = getPartActionTargetIndices(partIdx);

                    if (action === 'replace') {
                        pendingReplacePartIndex = partIdx;
                        partReplaceInput?.click();
                        return;
                    }

                    if (action === 'hide') {
                        pushModelUndoState({ showToast: targetPartIndices.length > 1 });
                        const partSettings = getPartSettings(partIdx);
                        const nextHidden = !partSettings.hidden;
                        targetPartIndices.forEach((idx) => {
                            const settings = getPartSettings(idx);
                            settings.hidden = nextHidden;
                        });
                        applyPartColorsToMesh();
                        syncModelPartSelectorUI();
                        saveSettings();
                        return;
                    }

                    if (action === 'bg-sync-toggle') {
                        const isActiveSource = activeBgPreset === 'modelcolor' && bgSyncPartIndex === partIdx;
                        if (isActiveSource) {
                            if (!window.confirm('Turn off background color sync?')) return;
                            pushModelUndoState();
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
                        pushModelUndoState();
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

            modelPartSelectorMenu.appendChild(opt);
        });
    } else if (modelPartSingleActions) {
        const settings = getPartSettings(0);
        const hideLabel = settings.hidden ? 'Show Model' : 'Hide Model';
        const syncOn = activeBgPreset === 'modelcolor';
        modelPartSingleActions.innerHTML = `<button type="button" class="part-option-action" data-single-action="replace">Replace STL</button><button type="button" class="part-option-action" data-single-action="hide">${hideLabel}</button><button type="button" class="part-option-action part-option-action--toggle" data-single-action="bg-sync-toggle"><span>Background Color Sync</span><span class="option-switch${syncOn ? ' is-on' : ''}" aria-hidden="true"></span></button>`;

        modelPartSingleActions.querySelectorAll('.part-option-action').forEach((actionBtn) => {
            actionBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const action = actionBtn.dataset.singleAction;
                if (action === 'replace') {
                    closeModelPartActionMenus();
                    openUploadFilePicker('replace');
                    return;
                }
                if (action === 'hide') {
                    const partSettings = getPartSettings(0);
                    partSettings.hidden = !partSettings.hidden;
                    applyPartColorsToMesh();
                    syncModelPartSelectorUI();
                    saveSettings();
                    closeModelPartActionMenus();
                    return;
                }
                if (action === 'bg-sync-toggle') {
                    const partIdx = 0;
                    const isActiveSource = activeBgPreset === 'modelcolor' && bgSyncPartIndex === partIdx;
                    if (isActiveSource) {
                        if (!window.confirm('Turn off background color sync?')) return;
                        pushModelUndoState();
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
                    pushModelUndoState();
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

    syncUIFromSelectedPart();
    syncModelPartBulkUIState();
    syncBgModelSyncSourceUI();
    syncBuildPlateModelSyncSourceUI();
    queueModelPartThumbsRender();
}

function getModelSyncSourceColor() {
    if (!isMultipartModel()) return modelPartBaseColors[0] || colorPick.value;
    const idx = Math.max(0, Math.min(bgSyncPartIndex, modelPartBaseColors.length - 1));
    return modelPartBaseColors[idx] || colorPick.value;
}

function getActiveBackgroundBaseColor() {
    if (activeBgPreset === 'white') return PALETTE.preset.white;
    if (activeBgPreset === 'black') return PALETTE.preset.black;
    if (activeBgPreset === 'modelcolor') return getModelSyncSourceColor() || bgPick?.value || PALETTE.fallback;
    return bgPick?.value || PALETTE.fallback;
}

function getBuildPlateSyncSourceColor() {
    if (!isMultipartModel()) return modelPartBaseColors[0] || colorPick.value;
    const idx = Math.max(0, Math.min(buildPlateSyncPartIndex, modelPartBaseColors.length - 1));
    return modelPartBaseColors[idx] || colorPick.value;
}

function getActiveBuildPlateBaseColor() {
    if (activeBuildPlatePreset === 'white') return PALETTE.preset.white;
    if (activeBuildPlatePreset === 'black') return PALETTE.preset.black;
    if (activeBuildPlatePreset === 'modelcolor') return getBuildPlateSyncSourceColor();
    return buildPlateColor || getBuildPlateSyncSourceColor() || colorPick?.value || bgPick?.value || PALETTE.fallback;
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
        if (idx === bgSyncPartIndex) opt.classList.add('is-bg-sync-source');
        opt.dataset.partIndex = String(idx);
        opt.setAttribute('role', 'option');
        opt.innerHTML = `<canvas class="thumb-select-option-canvas js-part-thumb-preview" data-part-index="${idx}" width="68" height="68" aria-hidden="true"></canvas><span class="thumb-select-option-text">${name}</span><span class="thumb-select-sync-badge" aria-hidden="true">Sync</span>`;
        opt.addEventListener('click', () => {
            if (!maybeConfirmBgSyncChange(idx)) return;
            pushModelUndoState();
            bgSyncPartIndex = idx;
            activeBgPreset = 'modelcolor';
            if (activeBgPreset === 'modelcolor') {
                const syncColor = getModelSyncSourceColor();
                bgPick.value = syncColor;
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
    }
    if (bgModelSyncSelectorText) {
        const selectedName = modelPartNames[bgSyncPartIndex] || `Part ${bgSyncPartIndex + 1}`;
        bgModelSyncSelectorText.textContent = `Sync: ${selectedName}`;
        bgModelSyncSelectorBtn.title = `Background sync: ${selectedName}`;
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
    document.getElementById('compactBtnLabel').textContent = 'Upload STL';
    // Preserve pause state on model replace; only resume if not already paused.
    if (!isPaused) {
        controls.autoRotate = rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360);
        document.documentElement.classList.remove('rotation-paused');
        iconPause.style.display = '';
        iconPlay.style.display = 'none';
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
        if (!savedCamPos) { placeCamera(); syncLightRig(); renderer.render(scene, camera); }
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
    modelPartDisplayOrder = [0];
    pendingModelPartDisplayOrder = null;
    pendingBulkSelectedPartIndices = null;
    multipartPartBounds = null;
    currentModelBuffer = buffer;
    modelPartSelected = 0;
    bulkSelectedPartIndices.clear();
    applyPendingUrlModelAppearanceOverride();

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
    syncActivePartFromUiSelection();
    applyPendingUrlModelAppearanceOverride();

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

function applyExportSceneForRender({ forceTransparent = false } = {}) {
    if (!renderer || !scene) return () => { };

    const includeBg = !!(exportBgColorEl?.checked ?? true);
    const includeGrid = !!(exportGridEl?.checked ?? true);
    const includeBuildPlate = !!(exportBuildPlateEl ? exportBuildPlateEl.checked : buildPlateEnabled);
    const transparent = forceTransparent || !includeBg;

    const savedBg = scene.background;
    const savedClearColor = renderer.getClearColor(new THREE.Color());
    const savedClearAlpha = renderer.getClearAlpha();
    const savedBuildPlateVisible = buildPlateMesh?.visible;
    const savedRulerGridVisible = rulerGridHelper?.visible;
    const savedRulerFootprintVisible = rulerFootprintHelper?.visible;

    if (buildPlateMesh) {
        buildPlateMesh.visible = !!(includeBuildPlate && buildPlateEnabled && mesh);
    }

    const showGrid = !!(includeGrid && mesh);
    if (showGrid && !rulerGridHelper && modelDims && scene) {
        // Create the grid helper on demand for export even if ruler is off in main view
        const _savedEnabled = rulerEnabled;
        const _savedVisible = rulerLinesVisible;
        rulerEnabled = true;
        rulerLinesVisible = true;
        updateRulerGrid();
        rulerEnabled = _savedEnabled;
        rulerLinesVisible = _savedVisible;
        if (rulerGridHelper) rulerGridHelper.visible = false;
        if (rulerFootprintHelper) rulerFootprintHelper.visible = false;
    }
    if (rulerGridHelper) rulerGridHelper.visible = showGrid;
    if (rulerFootprintHelper) rulerFootprintHelper.visible = showGrid;

    if (transparent) {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
    }

    return () => {
        scene.background = savedBg;
        renderer.setClearColor(savedClearColor, savedClearAlpha);
        if (buildPlateMesh && typeof savedBuildPlateVisible === 'boolean') buildPlateMesh.visible = savedBuildPlateVisible;
        // If rulerGridHelper was null before (created on demand for export), hide it after; otherwise restore
        if (rulerGridHelper) rulerGridHelper.visible = typeof savedRulerGridVisible === 'boolean' ? savedRulerGridVisible : false;
        if (rulerFootprintHelper) rulerFootprintHelper.visible = typeof savedRulerFootprintVisible === 'boolean' ? savedRulerFootprintVisible : false;
    };
}

function updateExportPreview(force = false) {
    if (!isExportPreviewActive()) return;
    if (force) _previewTick = 0;
    if (!force) {
        const stride = exportFrameEnabled ? 2 : 4;
        if (++_previewTick % stride !== 0) return;
    }
    const pv = document.getElementById('exportPreview');
    if (!pv) return;
    if (exportCamDist === null) return; // not ready yet

    const fmt = exportFormatEl?.value ?? 'gif';
    const { width: expW, height: expH } = getPreviewExportSize(fmt);
    const previewWrap = pv.parentElement;
    const bgEnabled = exportBgColorEl?.checked ?? true;
    const isTransparentPreview = !bgEnabled || ((fmt === 'gif')
        ? (document.getElementById('exportTransparent')?.checked ?? false)
        : (fmt === 'png')
            ? ((document.getElementById('exportTransparentPng')?.checked
                ?? document.getElementById('exportTransparent')?.checked
                ?? false))
            : false);
    if (previewWrap) {
        previewWrap.style.aspectRatio = '1 / 1';
        previewWrap.classList.toggle('is-transparent', isTransparentPreview);
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
    }

    // Render preview from export-effective scene state so it always matches export toggles.
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

    const restoreExportScene = applyExportSceneForRender({ forceTransparent: isTransparentPreview });
    try {
        renderer.setRenderTarget(_previewRt);
        renderer.render(scene, _previewCam);
        renderer.setRenderTarget(null);
    } finally {
        restoreExportScene();
    }

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
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.58)';
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
let exportWorkspaceActive = false;
let _cropAppliedCameraZoomScale = false;
let _exportPanelDragState = null;

function clampExportPanelPosition(left, top) {
    if (!exportPanelEl) return { left, top };
    const rect = exportPanelEl.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    return {
        left: Math.max(8, Math.min(maxLeft, left)),
        top: Math.max(8, Math.min(maxTop, top)),
    };
}

function setExportPanelPosition(left, top, persist = true) {
    if (!exportPanelEl) return;
    const clamped = clampExportPanelPosition(left, top);
    exportPanelEl.style.left = `${Math.round(clamped.left)}px`;
    exportPanelEl.style.top = `${Math.round(clamped.top)}px`;
    exportPanelEl.style.transform = 'none';
    exportPanelEl.style.right = 'auto';
    exportPanelEl.style.bottom = 'auto';
    if (!persist) return;
    try {
        localStorage.setItem('rotater_exportPanelPos', JSON.stringify({ left: Math.round(clamped.left), top: Math.round(clamped.top) }));
    } catch (_) { }
}

function restoreExportPanelPosition() {
    if (!exportPanelEl || !isDesktopV2Layout()) return;
    try {
        const raw = localStorage.getItem('rotater_exportPanelPos');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || !Number.isFinite(parsed.left) || !Number.isFinite(parsed.top)) return;
        setExportPanelPosition(parsed.left, parsed.top, false);
    } catch (_) { }
}

function initializeExportPanelDrag() {
    if (!exportPanelEl || !exportPanelHeaderEl) return;
    const onPointerMove = (ev) => {
        if (!_exportPanelDragState) return;
        const nextLeft = _exportPanelDragState.startLeft + (ev.clientX - _exportPanelDragState.startX);
        const nextTop = _exportPanelDragState.startTop + (ev.clientY - _exportPanelDragState.startY);
        setExportPanelPosition(nextLeft, nextTop, false);
    };

    const onPointerUp = () => {
        if (!_exportPanelDragState) return;
        const rect = exportPanelEl.getBoundingClientRect();
        setExportPanelPosition(rect.left, rect.top, true);
        exportPanelHeaderEl.classList.remove('is-dragging');
        _exportPanelDragState = null;
    };

    exportPanelHeaderEl.addEventListener('pointerdown', (ev) => {
        if (!isDesktopV2Layout() || !exportWorkspaceActive) return;
        if (ev.button !== 0) return;
        if (ev.target instanceof Element && ev.target.closest('button,a,input,select,label,textarea')) return;
        const rect = exportPanelEl.getBoundingClientRect();
        _exportPanelDragState = {
            startX: ev.clientX,
            startY: ev.clientY,
            startLeft: rect.left,
            startTop: rect.top,
        };
        exportPanelHeaderEl.classList.add('is-dragging');
        exportPanelHeaderEl.setPointerCapture?.(ev.pointerId);
        ev.preventDefault();
    });

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', () => {
        if (!isDesktopV2Layout() || !exportWorkspaceActive) return;
        const rect = exportPanelEl.getBoundingClientRect();
        setExportPanelPosition(rect.left, rect.top, false);
    });
}

initializeExportPanelDrag();

function setExportWorkspaceActive(active) {
    exportWorkspaceActive = !!active;
    document.documentElement.classList.toggle('export-workspace-active', exportWorkspaceActive);
    const exportOverlayEl = document.getElementById('exportOverlay');
    if (exportOverlayEl) exportOverlayEl.hidden = !exportWorkspaceActive;
    updateExportWorkspaceTransparencyPattern();
    try { localStorage.setItem('rotater_exportWorkspaceActive', exportWorkspaceActive ? '1' : '0'); } catch (_) { }
    syncCanvasSize();
    requestAnimationFrame(() => syncCanvasSize());
}

function updateExportWorkspaceTransparencyPattern() {
    const wrap = canvas?.parentElement;
    if (!wrap) return;
    const transparent = !!(exportWorkspaceActive && !(exportBgColorEl?.checked ?? true));
    wrap.classList.toggle('is-export-transparent', transparent);
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
    setExportWorkspaceActive(true);
    requestAnimationFrame(() => restoreExportPanelPosition());
    enterCropMode();
}

function closeExportWorkspace() {
    if (exportFrameEnabled) confirmCropMode();
    setExportWorkspaceActive(false);
}

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
            ? 'Drag to orbit · Scroll to zoom · Hold Shift + drag to pan'
            : 'Drag to orbit · Scroll to zoom · Right-drag up/down · Hold Shift + drag to pan';
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

function beginRightPanVerticalLock() {
    if (!controls || !camera) return;
    _rightPanVerticalLockActive = true;
    _rightPanVerticalLock = {
        targetX: controls.target.x,
        targetZ: controls.target.z,
        cameraX: camera.position.x,
        cameraZ: camera.position.z,
    };
}

function enforceRightPanVerticalLock() {
    if (!_rightPanVerticalLockActive || !_rightPanVerticalLock || !controls || !camera) return;
    controls.target.x = _rightPanVerticalLock.targetX;
    controls.target.z = _rightPanVerticalLock.targetZ;
    camera.position.x = _rightPanVerticalLock.cameraX;
    camera.position.z = _rightPanVerticalLock.cameraZ;
}

function endRightPanVerticalLock() {
    _rightPanVerticalLockActive = false;
    _rightPanVerticalLock = null;
}

function setShiftPanInteraction(active) {
    if (!controls) return;
    if (active) {
        controls.enablePan = true;
        controls.screenSpacePanning = true;
        controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
        return;
    }
    if (_controlsDefaultMouseButtons) controls.mouseButtons = { ..._controlsDefaultMouseButtons };
    if (_controlsDefaultTouches) controls.touches = { ..._controlsDefaultTouches };
}

function updateCropDimensionsDock(frameRect = null) {
    const showDimensions = !!exportFormatEl?.value; // all formats support aspect presets
    const inExportWorkspace = !!(exportWorkspaceActive && document.documentElement.classList.contains('export-workspace-active'));
    const useDock = showDimensions && !!cropDimensionsDock && (inExportWorkspace || exportFrameEnabled);

    if (!cropDimensionsDock) return;
    if (!useDock) {
        cropDimensionsDock.hidden = true;
        cropDimensionsDock.setAttribute('aria-hidden', 'true');
        return;
    }

    cropDimensionsDock.hidden = false;
    cropDimensionsDock.setAttribute('aria-hidden', 'false');

    // In export workspace the crop dock lives inside the export card, not on-canvas.
    if (inExportWorkspace) {
        cropDimensionsDock.style.left = '';
        cropDimensionsDock.style.top = '';
        return;
    }

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
function updateRulerHUD() {
    const hud = document.getElementById('rulerHUD');
    if (!hud) return;
    hud.hidden = !modelDims || !rulerEnabled;
    document.documentElement.classList.toggle('ruler-visible', !!modelDims && !!rulerEnabled);
    if (!modelDims) return;
    const unitEl = document.getElementById('rulerUnitVal');
    const unitToggle = document.getElementById('rulerUnitToggle');
    if (unitEl) unitEl.textContent = (rulerUnit === 'imperial') ? 'in' : 'mm';
    const next = (rulerUnit === 'imperial') ? 'Metric' : 'Imperial';
    if (unitToggle) unitToggle.setAttribute('aria-label', `Switch to ${next.toLowerCase()} units`);
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
    ctx.fillStyle = PALETTE.text.measurement;
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

function updateRulerGrid() {
    if (!scene) return;
    const shouldShow = !!(rulerEnabled && rulerLinesVisible && mesh && modelDims && viewerSec && !viewerSec.classList.contains('hidden'));
    if (!shouldShow) {
        if (rulerGridHelper) rulerGridHelper.visible = false;
        if (rulerFootprintHelper) rulerFootprintHelper.visible = false;
        return;
    }

    const worldBox = new THREE.Box3().setFromObject(mesh);
    if (!worldBox || worldBox.isEmpty()) {
        if (rulerGridHelper) rulerGridHelper.visible = false;
        if (rulerFootprintHelper) rulerFootprintHelper.visible = false;
        return;
    }

    const targetSize = Math.max(40, Math.ceil((Math.max(modelDims.w, modelDims.d) * 1.6) / 5) * 5);
    const divisions = Math.max(8, Math.min(42, Math.round(targetSize / 6)));

    const getColorRelativeLuminance = (color) => {
        const toLinear = (channel) => {
            if (channel <= 0.04045) return channel / 12.92;
            return Math.pow((channel + 0.055) / 1.055, 2.4);
        };
        const r = toLinear(color.r);
        const g = toLinear(color.g);
        const b = toLinear(color.b);
        return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    };

    const getActiveGridSurfaceColor = () => {
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
    };

    const getGridContrastPalette = () => {
        const surfaceColor = getActiveGridSurfaceColor();
        const lum = getColorRelativeLuminance(surfaceColor);

        const whiteContrast = 1.05 / Math.max(0.0001, lum + 0.05);
        const blackContrast = (lum + 0.05) / 0.05;
        if (whiteContrast >= blackContrast) {
            return { center: 0xf7f7fb, lines: 0xe2e2ed, opacity: 0.62 };
        }
        return { center: 0x17171f, lines: 0x2a2a36, opacity: 0.64 };
    };

    const palette = getGridContrastPalette();

    if (!rulerGridHelper || Math.abs(rulerGridSize - targetSize) > 0.5) {
        if (rulerGridHelper) scene.remove(rulerGridHelper);
        rulerGridHelper = new THREE.GridHelper(targetSize, divisions, palette.center, palette.lines);
        const mats = Array.isArray(rulerGridHelper.material) ? rulerGridHelper.material : [rulerGridHelper.material];
        mats.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = palette.opacity;
            mat.depthWrite = false;
            mat.depthTest = true;
        });
        rulerGridHelper.renderOrder = -1;
        scene.add(rulerGridHelper);
        rulerGridSize = targetSize;
    } else {
        if (typeof rulerGridHelper.setColors === 'function') {
            rulerGridHelper.setColors(palette.center, palette.lines);
        }
        const mats = Array.isArray(rulerGridHelper.material) ? rulerGridHelper.material : [rulerGridHelper.material];
        mats.forEach((mat) => {
            mat.opacity = palette.opacity;
            mat.needsUpdate = true;
        });
    }

    rulerGridHelper.visible = true;
    const modelGap = Math.max(0.4, modelRadius * 0.02);
    let gridY = worldBox.min.y - modelGap;
    if (buildPlateMesh?.visible) {
        gridY = buildPlateMesh.position.y + Math.max(0.03, modelRadius * 0.0012);
    }
    rulerGridHelper.position.set(0, gridY, 0);
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
            autoBgAdjust: document.getElementById('autoBgCheck')?.checked ? '1' : '0',
            rulerVisible: rulerEnabled ? '1' : '0',
            rulerUnit: rulerUnit,
            rulerGridVisible: rulerLinesVisible ? '1' : '0',
            buildPlate: buildPlateEnabled ? '1' : '0',
            buildPlatePreset: activeBuildPlatePreset,
            buildPlateSyncPartIndex: String(buildPlateSyncPartIndex || 0),
            buildPlateAutoBrightness: buildPlateAutoBrightnessEnabled ? '1' : '0',
            buildPlateColor: buildPlateColor,
            buildPlateShade: String(buildPlateShade),
            buildPlateFinish: buildPlateFinish,
            buildPlateShape: buildPlateShape,
            buildPlateSizePreset: buildPlateSizePreset,
            buildPlateWidth: String(buildPlateWidth),
            buildPlateDepth: String(buildPlateDepth),
            exportMotionControls: exportMotionControlsEnabled ? '1' : '0',
            autoUIAssist: autoUIAssistEnabled ? '1' : '0',
            exportCollapsedConfirm: exportCollapsedConfirmEnabled ? '1' : '0',
            uploadChoicePrompt: uploadChoicePromptEnabled ? '1' : '0',
            uploadDefaultAction: uploadDefaultAction,
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
    settingsToURL();
}

function restoreSettings() {
    suppressSave = true;
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

        const defaultSearchStr = typeof DEFAULT_SETTINGS_URL !== 'undefined' && DEFAULT_SETTINGS_URL.includes('?')
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
        if (s.buildPlate != null) {
            buildPlateEnabled = (s.buildPlate === '1' || s.buildPlate === true || s.buildPlate === 1);
        }
        if (s.buildPlatePreset === 'white' || s.buildPlatePreset === 'black' || s.buildPlatePreset === 'modelcolor' || s.buildPlatePreset === 'custom') {
            activeBuildPlatePreset = s.buildPlatePreset;
            if (activeBuildPlatePreset !== 'modelcolor') lastNonModelBuildPlatePreset = activeBuildPlatePreset;
        }
        if (s.buildPlateSyncPartIndex != null) {
            const idx = parseInt(s.buildPlateSyncPartIndex, 10);
            buildPlateSyncPartIndex = Number.isFinite(idx) ? Math.max(0, idx) : 0;
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
        if (s.buildPlateShade != null) {
            const shade = parseInt(s.buildPlateShade, 10);
            if (Number.isFinite(shade)) buildPlateShade = Math.max(-100, Math.min(100, shade));
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
        if (s.exportMotionControls != null) {
            exportMotionControlsEnabled = (s.exportMotionControls === '1' || s.exportMotionControls === true || s.exportMotionControls === 1);
        }
        if (s.autoUIAssist != null) {
            autoUIAssistEnabled = (s.autoUIAssist === '1' || s.autoUIAssist === true || s.autoUIAssist === 1);
        }
        if (s.exportCollapsedConfirm != null) {
            exportCollapsedConfirmEnabled = (s.exportCollapsedConfirm === '1' || s.exportCollapsedConfirm === true || s.exportCollapsedConfirm === 1);
        }
        if (s.uploadChoicePrompt != null) {
            uploadChoicePromptEnabled = (s.uploadChoicePrompt === '1' || s.uploadChoicePrompt === true || s.uploadChoicePrompt === 1);
        }
        if (s.uploadDefaultAction === 'add' || s.uploadDefaultAction === 'replace') {
            uploadDefaultAction = s.uploadDefaultAction;
        }
        if (exportGridEl) exportGridEl.checked = rulerLinesVisible;
        if (exportBuildPlateEl && s.exportBuildPlate == null) exportBuildPlateEl.checked = buildPlateEnabled;
        if (s.rulerUnit === 'imperial' || s.rulerUnit === 'i' || s.rulerUnit === 'in') rulerUnit = 'imperial';
        else if (s.rulerUnit === 'metric' || s.rulerUnit === 'm' || s.rulerUnit === 'mm') rulerUnit = 'metric';
        if (s.activeBgPreset) activeBgPreset = s.activeBgPreset;
        if (s.activeModelPreset) activeModelPreset = s.activeModelPreset;
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
        if (exportMotionControlsToggleEl) exportMotionControlsToggleEl.checked = exportMotionControlsEnabled;
        if (exportMotionControlsEl) exportMotionControlsEl.hidden = !exportMotionControlsEnabled;
        if (autoUIAssistToggleEl) autoUIAssistToggleEl.checked = autoUIAssistEnabled;
        if (exportCollapsedConfirmToggleEl) {
            exportCollapsedConfirmToggleEl.checked = exportCollapsedConfirmEnabled;
            exportCollapsedConfirmToggleEl.disabled = !autoUIAssistEnabled;
        }
        updateBuildPlateMaterial();
        updateAutoBgShadeControlVisibility();
        updateBuildPlateShadeControlVisibility();
        syncExportMotionControlsFromMain();
        syncAllRangeFillIndicators();
        if (bgOpacitySlider) updateBgShadeSliderVisual();
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
        buildPlate: g('bp'),
        buildPlatePreset: g('bpr'),
        buildPlateSyncPartIndex: g('bpsp'),
        buildPlateAutoBrightness: g('bpab'),
        buildPlateColor: g('bpc'),
        buildPlateShade: g('bps'),
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
        uploadDefaultAction: p.has('uam') ? (p.get('uam') === 'a' ? 'add' : 'replace') : null,
    };
}

function settingsToURL() {
    const p = new URLSearchParams();
    // Core appearance
    p.set('c', colorPick.value.replace('#', ''));
    p.set('b', bgPick.value.replace('#', ''));
    p.set('op', String(Math.round(getSliderEffectiveValue(opacitySlider)) || 0));
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
    const selectedPartSettings = getSelectedPartSettings();
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
    if (!buildPlateEnabled) p.set('bp', '0');
    p.set('bpr', activeBuildPlatePreset || 'modelcolor');
    if (buildPlateSyncPartIndex > 0) p.set('bpsp', String(buildPlateSyncPartIndex));
    p.set('bpab', buildPlateAutoBrightnessEnabled ? '1' : '0');
    if (buildPlateColor && /^#[0-9a-f]{6}$/i.test(buildPlateColor)) {
        p.set('bpc', buildPlateColor.replace('#', ''));
    }
    if (Number.isFinite(Number(buildPlateShade))) p.set('bps', String(buildPlateShade));
    p.set('bpf', buildPlateFinish || BUILD_PLATE_DEFAULTS.finish);
    if (buildPlateShape !== 'rectangle') p.set('bpsh', normalizeBuildPlateShape(buildPlateShape));
    if (buildPlateSizePreset && buildPlateSizePreset !== '220x220') p.set('bpp', buildPlateSizePreset);
    if (buildPlateWidth !== 220) p.set('bpw', String(buildPlateWidth));
    if (buildPlateDepth !== 220) p.set('bpd', String(buildPlateDepth));
    p.set('abp', activeBgPreset || 'modelcolor');
    p.set('amp', activeModelPreset || 'custom');
    if (bgSyncPartIndex > 0) p.set('bsp', String(bgSyncPartIndex));
    if (!uploadChoicePromptEnabled) p.set('uap', '0');
    if (uploadDefaultAction === 'add') p.set('uam', 'a');
    // Re-inject passthrough params captured at startup (e.g. debug=1)
    _passthroughParams.forEach((v, k) => { if (!p.has(k)) p.set(k, v); });
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
    if (compactBtnLabel) compactBtnLabel.textContent = 'Upload STL';
    updateCropHintUI();

    if (DEV_LOG) console.log(`[rotater] restoreSession: calling restoreSettings at ${Date.now()}`);
    restoreSettings();
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
            const loaded = await loadBenchyModel({ clearStoredModel: false });
            if (!loaded) {
                dismissStartupSplash();
                return;
            }
            saveSettings();
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

function openUploadFilePicker(action = 'replace') {
    pendingUploadAction = (action === 'add' || action === 'import') ? action : 'replace';
    if (fileInput) fileInput.click();
}

async function requestUploadFlowFromButtons() {
    suppressAutoDemoModelLoad();
    dismissStartupSplash();

    if (!mesh) {
        openUploadFilePicker('replace');
        return;
    }

    const requestedAction = await promptUploadChoice(null);
    if (requestedAction === 'import') {
        openUploadFilePicker('import');
        return;
    }
    if (requestedAction !== 'add' && requestedAction !== 'replace') return;
    openUploadFilePicker(requestedAction);
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

    const stlActionOverride = (requestedActionOverride === 'add' || requestedActionOverride === 'replace')
        ? requestedActionOverride
        : (requestedActionOverride === 'import' ? 'replace' : null);

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

    let requestedAction = (requestedActionOverride === 'add' || requestedActionOverride === 'replace')
        ? requestedActionOverride
        : 'replace';

    if (mesh && !requestedActionOverride) {
        requestedAction = await promptUploadChoice(files);
        if (requestedAction !== 'add' && requestedAction !== 'replace') {
            return;
        }
    }

    if (!mesh) requestedAction = 'replace';

    if (mesh && requestedAction === 'add') {
        try {
            await appendSTLPartsToCurrentModel(files);
        } catch (err) {
            setStatus('Error: ' + (err?.message || 'Failed to add STL part(s).'));
            console.error(err);
            setTimeout(() => setStatus(''), 5000);
        }
        return;
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

async function appendSTLPartsToCurrentModel(fileList) {
    const files = Array.from(fileList || []).filter((f) => f?.name?.toLowerCase?.().endsWith('.stl'));
    if (!files.length) return;
    if (!mesh) {
        await handleFiles(files);
        return;
    }

    const incoming = await Promise.all(files.map(async (file) => {
        const color = colorPick.value;
        return {
            name: file.name,
            buffer: await readFileAsArrayBuffer(file),
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
    loadMultipartSTLBuffers(nextFiles.map((part) => part.buffer), nextNames, nextColors, nextSettings);
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
        if (Number.isFinite(expectedSize) && expectedSize > IMPORT_ZIP_LIMITS.maxSingleEntryBytes) {
            throw new Error(`File is too large in package: ${safePath}`);
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
    for (let idx = 0; idx < packageEntries.length; idx++) {
        const item = packageEntries[idx];
        const buffer = await item.entry.async('arraybuffer');
        const size = buffer?.byteLength || 0;
        if (size > IMPORT_ZIP_LIMITS.maxSingleEntryBytes) {
            throw new Error(`File is too large in package: ${item.safePath}`);
        }
        totalExtractedBytes += size;
        if (totalExtractedBytes > IMPORT_ZIP_LIMITS.maxTotalExtractedBytes) {
            throw new Error('Package extract size is too large.');
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
        loadMultipartSTLBuffers(
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
        loadSTLBuffer(parts[0].buffer, parts[0].name);
    }

    saveSettings();
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

    if (nextFiles.length === 1) {
        await saveFileToIDB(nextFiles[0].name, nextFiles[0].buffer);
        currentFileName = stemFromFileName(nextFiles[0].name);
        setDisplayedFileName(nextFiles[0].name);
        modelPartFiles = null;
        loadSTLBuffer(nextFiles[0].buffer, nextFiles[0].name);
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
        pendingModelPartSelected = Math.max(0, Math.min(modelPartSelected, nextFiles.length - 1));
        setDisplayedFileName(displayName);
        currentFileName = buildMultipartFileBase(nextNames);
        loadMultipartSTLBuffers(nextFiles.map((part) => part.buffer), nextNames, nextColors, nextSettings);
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
    const requestedAction = pendingUploadAction;
    pendingUploadAction = null;
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

function updateExportPauseButtonUI() {
    const btn = document.getElementById('btnExportPause');
    if (!btn) return;
    btn.classList.toggle('is-paused', isPaused);
    btn.setAttribute('aria-label', isPaused ? 'Resume rotation' : 'Pause rotation');
    btn.title = isPaused ? 'Resume rotation' : 'Pause rotation';
}

function togglePause() {
    if (rotateModeEl.value === 'off') return;
    isPaused = !isPaused;
    controls.autoRotate = !isPaused && (rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360));
    document.documentElement.classList.toggle('rotation-paused', isPaused);
    iconPause.style.display = isPaused ? 'none' : '';
    iconPlay.style.display = isPaused ? '' : 'none';
    btnPause.setAttribute('aria-label', isPaused ? 'Resume rotation' : 'Pause rotation');
    btnPause.title = isPaused ? 'Resume rotation' : 'Pause rotation';
    updateExportPauseButtonUI();
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
document.getElementById('btnExportPause')?.addEventListener('click', togglePause);
updateExportPauseButtonUI();

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

function persistCurrentMultipartParts({ immediate = false } = {}) {
    if (!isMultipartModel() || !modelPartFiles || modelPartFiles.length !== modelPartNames.length) return;
    const commit = () => {
        multipartPersistTimer = 0;
        const displayName = getMultipartDisplayName(modelPartNames);
        saveFilesToIDB(modelPartFiles.map((part, idx) => ({
            name: part.name,
            buffer: part.buffer,
            color: modelPartBaseColors[idx] || colorPick.value,
            settings: modelPartSettings[idx] ? { ...modelPartSettings[idx] } : createPartSettings(modelPartBaseColors[idx] || colorPick.value),
        })), displayName);
    };
    if (immediate) {
        if (multipartPersistTimer) {
            clearTimeout(multipartPersistTimer);
            multipartPersistTimer = 0;
        }
        commit();
        return;
    }
    if (multipartPersistTimer) clearTimeout(multipartPersistTimer);
    multipartPersistTimer = setTimeout(commit, 140);
}

let colorCommitTimer = 0;
let pendingColorThumbTargets = null;

function flushColorCommit() {
    if (colorCommitTimer) {
        clearTimeout(colorCommitTimer);
        colorCommitTimer = 0;
    }
    const thumbTargets = pendingColorThumbTargets;
    pendingColorThumbTargets = null;
    persistCurrentMultipartParts({ immediate: true });
    saveSettings();
    if (thumbTargets !== null) queueModelPartThumbsRender(thumbTargets);
}

function scheduleColorCommit(thumbTargets = null) {
    pendingColorThumbTargets = thumbTargets;
    if (colorCommitTimer) clearTimeout(colorCommitTimer);
    colorCommitTimer = setTimeout(flushColorCommit, 100);
}

colorPick.addEventListener('input', (ev) => {
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

    if (mesh) applyPartColorsToMesh();
    updateShadingThumbs();
    updateColorSwatches();
    updateShadeSliderVisual();
    if (activeBgPreset === 'modelcolor') {
        bgPick.value = getModelSyncSourceColor();
        if (isDynamicBg) updateDynamicBg();
        else applyBackgroundFromBaseColor(bgPick.value);
        updateBgShadeSliderVisual();
    }
});
colorPick.addEventListener('change', () => {
    flushColorCommit();
});
if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
        const toneVal = Math.round(getSliderEffectiveValue(opacitySlider));
        opacityVal.textContent = (toneVal >= 0 ? '+' : '') + toneVal;
        syncSliderTooltip(opacitySlider);
        const targets = applyToModelPartEditTargets((partSettings) => {
            partSettings.tone = toneVal;
        });
        if (mesh) applyPartColorsToMesh();
        updateShadingThumbs();
        persistCurrentMultipartParts();
        updateShadeSliderVisual();
        queueModelPartThumbsRender(targets);
        saveSettings();
    });
}

if (bgOpacitySlider) {
    bgOpacitySlider.addEventListener('input', () => {
        const bgTone = Math.round(getSliderEffectiveValue(bgOpacitySlider));
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
}


bgPick.addEventListener('input', () => {
    scene.background = null;

    {
        const tone = bgOpacitySlider ? Math.round(getSliderEffectiveValue(bgOpacitySlider)) : 0;
        const baseHex = getActiveBackgroundBaseColor();
        const c = computeSurfaceShadeColor(baseHex, tone);
        if (renderer) renderer.setClearColor(c, 1);
    }
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
    if (mesh) rebuildMeshMaterialsForCurrentShading();
    applyCurrentTextureTuning();
    persistCurrentMultipartParts();
    queueModelPartThumbsRender(targets);
    saveSettings();
});

textureTuneRoughnessSlider?.addEventListener('change', () => {
    updateFinishSliderVisual();
    const { targets } = applyFinishControlsToSelectedPart(true);
    if (mesh) rebuildMeshMaterialsForCurrentShading();
    applyCurrentTextureTuning();
    persistCurrentMultipartParts({ immediate: true });
    queueModelPartThumbsRender(targets);
    saveSettings();
});

finishModeButtons.forEach((btn) => btn.addEventListener('click', () => {
    const mode = btn.dataset.finishMode || 'satin';
    if (textureTuneRoughnessSlider) {
        textureTuneRoughnessSlider.value = String(modeStrengthToFinishSliderValue(mode, 2));
    }
    syncSliderTooltip(textureTuneRoughnessSlider);
    updateFinishSliderVisual();
    const { targets } = applyFinishControlsToSelectedPart(true);
    if (mesh) rebuildMeshMaterialsForCurrentShading();
    applyCurrentTextureTuning();
    persistCurrentMultipartParts({ immediate: true });
    queueModelPartThumbsRender(targets);
    saveSettings();
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
        partSettings.shading = shadingEl.value;
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
    rulerLinesVisible = !!exportGridEl.checked;
    updateRulerHUD();
    updateLiveRulerOverlay();
    refreshExportPreviewNow();
    saveSettings();
});
exportBuildPlateEl?.addEventListener('change', () => {
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
    gif: 'Export',
    mp4: 'Export',
    png: 'Export',
    jpg: 'Export',
};
const FORMAT_SHORT_LABELS = {
    gif: 'Export',
    mp4: 'Export',
    png: 'Export',
    jpg: 'Export',
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
    const panelWidth = exportPanelEl?.offsetWidth ?? 0;
    const useShortPrimaryLabel = !!exportPanelEl?.classList.contains('is-collapsed') || (panelWidth > 0 && panelWidth < 360);
    if (btnExportLabel) btnExportLabel.textContent = (useShortPrimaryLabel ? FORMAT_SHORT_LABELS[fmt] : FORMAT_LABELS[fmt]) ?? 'Export';
    if (btnExportCollapsedLabel) btnExportCollapsedLabel.textContent = FORMAT_SHORT_LABELS[fmt] ?? 'Export';
}

function syncExportFormatTabs(fmt) {
    exportFormatTabEls.forEach((tabEl) => {
        const active = tabEl.dataset.exportFormatTab === fmt;
        tabEl.classList.toggle('is-active', active);
        tabEl.setAttribute('aria-selected', active ? 'true' : 'false');
    });
}

function applyExportFormat(fmt) {
    if (exportFormatEl && exportFormatEl.value !== fmt) exportFormatEl.value = fmt;
    if (exportMiniFormatEl && exportMiniFormatEl.value !== fmt) exportMiniFormatEl.value = fmt;
    if (exportFormatCollapsedEl && exportFormatCollapsedEl.value !== fmt) exportFormatCollapsedEl.value = fmt;
    document.querySelectorAll('.export-format-opts').forEach(el => { el.hidden = true; });
    const opts = document.getElementById(`exportOpts-${fmt}`);
    if (opts) opts.hidden = false;
    applyExportQuickOptionsForFormat(fmt);
    handleExportFormatAutoPause(fmt);
    if (exportMotionControlsEl) exportMotionControlsEl.hidden = true;
    updateCropDimensionsDock();
    updateExportActionLabels(fmt);
    syncExportFormatTabs(fmt);
    updateEstimate();
    refreshExportPreviewNow();
    queueDesktopV2RailLayoutSync();
}

exportFormatTabEls.forEach((tabEl) => {
    tabEl.addEventListener('click', () => {
        const fmt = tabEl.dataset.exportFormatTab;
        if (!fmt) return;
        applyExportFormat(fmt);
        saveSettings();
    });
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

exportFormatEl?.addEventListener('change', function () {
    applyExportFormat(this.value);
    saveSettings();
});

exportMiniFormatEl?.addEventListener('change', function () {
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

function getExportFormatDisplay(fmt) {
    return ({ gif: 'Animated GIF', mp4: 'MP4 Video', png: 'PNG Image', jpg: 'JPEG Image' })[fmt] || 'Export';
}

function renderCollapsedExportSummary(fmt) {
    if (!exportCollapsedConfirmSummaryEl) return;
    const format = ({ gif: 'gif', mp4: 'mp4', png: 'png', jpg: 'jpg' })[fmt] || 'gif';
    const qualityValue = document.getElementById('exportQuality')?.value || 'std';
    const speedValue = String(parseInt(speedSlider?.value || String(SPEED_DEFAULT), 10) || SPEED_DEFAULT);
    const gridChecked = !!exportGridEl?.checked;
    const buildPlateChecked = !!(exportBuildPlateEl ? exportBuildPlateEl.checked : buildPlateEnabled);
    const bgChecked = !!exportBgColorEl?.checked;
    const gifLoopChecked = !!document.getElementById('gifLoop')?.checked;
    const gifDitherChecked = !!document.getElementById('gifDither')?.checked;
    const jpegQualityValue = document.getElementById('jpegQuality')?.value || '90';

    const formatOptions = ['gif', 'mp4', 'png', 'jpg']
        .map((key) => `<option value="${key}"${key === format ? ' selected' : ''}>${getExportFormatDisplay(key)}</option>`)
        .join('');

    const qualityOptions = EXPORT_QUALITY_ORDER
        .map((key) => `<option value="${key}"${key === qualityValue ? ' selected' : ''}>${EXPORT_QUALITY_LABELS[key] || key}</option>`)
        .join('');

    const speedOptions = [5, 10, 15, 20, 25, 30]
        .map((seconds) => {
            const value = String(seconds);
            return `<option value="${value}"${value === speedValue ? ' selected' : ''}>${seconds}s</option>`;
        })
        .join('');

    const gifExtras = format === 'gif'
        ? `<label class="export-collapsed-confirm-row export-collapsed-confirm-row--check"><span>Loop</span><input type="checkbox" data-export-review="gif-loop"${gifLoopChecked ? ' checked' : ''}></label><label class="export-collapsed-confirm-row export-collapsed-confirm-row--check"><span>Dither</span><input type="checkbox" data-export-review="gif-dither"${gifDitherChecked ? ' checked' : ''}></label>`
        : '';

    const jpgExtra = format === 'jpg'
        ? `<label class="export-collapsed-confirm-row"><span>JPEG Compression</span><input type="range" min="50" max="100" step="5" value="${jpegQualityValue}" data-export-review="jpg-quality"></label>`
        : '';

    exportCollapsedConfirmSummaryEl.innerHTML = `
        <label class="export-collapsed-confirm-row">
            <span>Format</span>
            <select class="export-select export-collapsed-confirm-control" data-export-review="format">${formatOptions}</select>
        </label>
        <label class="export-collapsed-confirm-row">
            <span>Quality</span>
            <select class="export-select export-collapsed-confirm-control" data-export-review="quality">${qualityOptions}</select>
        </label>
        ${(format === 'gif' || format === 'mp4') ? `<label class="export-collapsed-confirm-row"><span>Rotation Time</span><select class="export-select export-collapsed-confirm-control" data-export-review="speed">${speedOptions}</select></label>` : ''}
        <label class="export-collapsed-confirm-row export-collapsed-confirm-row--check">
            <span>Grid</span>
            <input type="checkbox" data-export-review="grid"${gridChecked ? ' checked' : ''}>
        </label>
        <label class="export-collapsed-confirm-row export-collapsed-confirm-row--check">
            <span>Background</span>
            <input type="checkbox" data-export-review="bg"${bgChecked ? ' checked' : ''}>
        </label>
        <label class="export-collapsed-confirm-row export-collapsed-confirm-row--check">
            <span>Build Plate</span>
            <input type="checkbox" data-export-review="build-plate"${buildPlateChecked ? ' checked' : ''}>
        </label>
        ${gifExtras}
        ${jpgExtra}
    `;

    const formatSelect = exportCollapsedConfirmSummaryEl.querySelector('[data-export-review="format"]');
    formatSelect?.addEventListener('change', () => {
        const nextFormat = formatSelect.value;
        applyExportFormat(nextFormat);
        renderCollapsedExportSummary(nextFormat);
        saveSettings();
    });

    const qualitySelect = exportCollapsedConfirmSummaryEl.querySelector('[data-export-review="quality"]');
    qualitySelect?.addEventListener('change', () => {
        setExportQualityValue(qualitySelect.value);
        updateEstimate();
        refreshExportPreviewNow();
        saveSettings();
    });

    const speedSelect = (format === 'gif' || format === 'mp4')
        ? exportCollapsedConfirmSummaryEl.querySelector('[data-export-review="speed"]')
        : null;
    speedSelect?.addEventListener('change', () => {
        if (!speedSlider) return;
        speedSlider.value = speedSelect.value;
        speedSlider.dispatchEvent(new Event('change'));
    });

    const gridCheck = exportCollapsedConfirmSummaryEl.querySelector('[data-export-review="grid"]');
    gridCheck?.addEventListener('change', () => {
        if (!exportGridEl) return;
        exportGridEl.checked = !!gridCheck.checked;
        exportGridEl.dispatchEvent(new Event('change'));
    });

    const bgCheck = exportCollapsedConfirmSummaryEl.querySelector('[data-export-review="bg"]');
    bgCheck?.addEventListener('change', () => {
        if (!exportBgColorEl) return;
        exportBgColorEl.checked = !!bgCheck.checked;
        exportBgColorEl.dispatchEvent(new Event('change'));
    });

    const buildPlateCheck = exportCollapsedConfirmSummaryEl.querySelector('[data-export-review="build-plate"]');
    buildPlateCheck?.addEventListener('change', () => {
        if (!exportBuildPlateEl) return;
        exportBuildPlateEl.checked = !!buildPlateCheck.checked;
        exportBuildPlateEl.dispatchEvent(new Event('change'));
    });

    const gifLoopCheck = exportCollapsedConfirmSummaryEl.querySelector('[data-export-review="gif-loop"]');
    gifLoopCheck?.addEventListener('change', () => {
        const loopEl = document.getElementById('gifLoop');
        if (!loopEl) return;
        loopEl.checked = !!gifLoopCheck.checked;
        loopEl.dispatchEvent(new Event('change'));
        refreshExportPreviewNow();
    });

    const gifDitherCheck = exportCollapsedConfirmSummaryEl.querySelector('[data-export-review="gif-dither"]');
    gifDitherCheck?.addEventListener('change', () => {
        const ditherEl = document.getElementById('gifDither');
        if (!ditherEl) return;
        ditherEl.checked = !!gifDitherCheck.checked;
        ditherEl.dispatchEvent(new Event('change'));
        refreshExportPreviewNow();
    });

    const jpgQualitySlider = exportCollapsedConfirmSummaryEl.querySelector('[data-export-review="jpg-quality"]');
    jpgQualitySlider?.addEventListener('input', () => {
        const qualitySlider = document.getElementById('jpegQuality');
        if (!qualitySlider) return;
        qualitySlider.value = jpgQualitySlider.value;
        qualitySlider.dispatchEvent(new Event('input'));
    });
}

function closeCollapsedExportConfirm(shouldContinue) {
    if (exportCollapsedConfirmOverlayEl) {
        exportCollapsedConfirmOverlayEl.hidden = true;
    }
    if (_exportCollapsedConfirmResolver) {
        const resolve = _exportCollapsedConfirmResolver;
        _exportCollapsedConfirmResolver = null;
        resolve(!!shouldContinue);
    }
}

function promptCollapsedExportConfirm(fmt) {
    if (!exportCollapsedConfirmOverlayEl || !exportCollapsedConfirmEnabled) return Promise.resolve(true);
    renderCollapsedExportSummary(fmt);
    if (exportCollapsedDontShowEl) exportCollapsedDontShowEl.checked = false;
    exportCollapsedConfirmOverlayEl.hidden = false;
    return new Promise((resolve) => {
        _exportCollapsedConfirmResolver = resolve;
    });
}

function getUploadIncomingLabel(files) {
    const arr = Array.from(files || []).filter(Boolean);
    if (!arr.length) return 'your STL or ZIP files';
    return arr.length > 1 ? `${arr.length} files` : `"${arr[0]?.name || 'file'}"`;
}

function closeUploadChoicePrompt(action = 'cancel') {
    if (uploadChoiceOverlayEl) uploadChoiceOverlayEl.hidden = true;
    uploadChoiceDropZoneEl?.classList.remove('is-dragover');
    if (_uploadChoiceResolver) {
        const resolve = _uploadChoiceResolver;
        _uploadChoiceResolver = null;
        resolve(action);
    }
}

function applyUploadChoicePreference(action) {
    if (!uploadChoiceDontShowEl?.checked) return;
    uploadChoicePromptEnabled = false;
    uploadDefaultAction = action === 'add' ? 'add' : 'replace';
    saveSettings();
}

function promptUploadChoice(files) {
    if (!mesh) return Promise.resolve('replace');
    if (!uploadChoicePromptEnabled || !uploadChoiceOverlayEl) return Promise.resolve(uploadDefaultAction || 'replace');

    if (uploadChoiceTextEl) {
        const incomingLabel = getUploadIncomingLabel(files);
        if (Array.from(files || []).length) {
            uploadChoiceTextEl.textContent = `Load ${incomingLabel}: add them to your current plate, or create a new plate and replace the current model.`;
        } else {
            uploadChoiceTextEl.textContent = `Drop STL/ZIP files below or choose an action to continue.`;
        }
    }
    if (uploadChoiceDontShowEl) uploadChoiceDontShowEl.checked = false;
    uploadChoiceDropZoneEl?.classList.remove('is-dragover');
    uploadChoiceOverlayEl.hidden = false;

    return new Promise((resolve) => {
        _uploadChoiceResolver = resolve;
    });
}

function resetAllWarnings() {
    exportCollapsedConfirmEnabled = true;
    uploadChoicePromptEnabled = true;
    uploadDefaultAction = 'replace';

    if (exportCollapsedConfirmToggleEl) {
        exportCollapsedConfirmToggleEl.checked = true;
        exportCollapsedConfirmToggleEl.disabled = !autoUIAssistEnabled;
    }
    if (uploadChoiceDontShowEl) uploadChoiceDontShowEl.checked = false;

    saveSettings();
    setStatus('Warning dialogs reset.');
    setTimeout(() => setStatus(''), 1800);
}

async function triggerExportWithAssist(fmt) {
    const format = fmt || exportFormatEl?.value || exportFormatCollapsedEl?.value || 'gif';
    const isCollapsed = !!exportPanelEl?.classList.contains('is-collapsed');

    if (isCollapsed && autoUIAssistEnabled) {
        applyExportFormat(format);
        applyExportPanelState(false);
        try { localStorage.setItem('rotater_exportPanelCollapsed', '0'); } catch (_) { }

        const proceed = await promptCollapsedExportConfirm(format);
        if (!proceed) return;
        if (exportCollapsedDontShowEl?.checked) {
            exportCollapsedConfirmEnabled = false;
            if (exportCollapsedConfirmToggleEl) exportCollapsedConfirmToggleEl.checked = false;
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
    const transparentEl = document.getElementById('exportTransparent');
    const transparentPngEl = document.getElementById('exportTransparentPng');
    const bgToggleEl = document.getElementById('exportBgColor');

    let transparent = false;
    if (sourceId === 'exportBgColor') {
        const hasBg = bgToggleEl?.checked ?? true;
        transparent = !hasBg;
    } else {
        transparent = document.getElementById(sourceId)?.checked ?? false;
    }

    if (transparentEl) transparentEl.checked = transparent;
    if (transparentPngEl) transparentPngEl.checked = transparent;
    if (bgToggleEl) bgToggleEl.checked = !transparent;

    // Update preview wrapper visual and refresh preview immediately
    const wrap = document.querySelector('.export-preview-wrap');
    if (wrap) {
        wrap.classList.toggle('is-transparent', transparent);
    }
    updateExportWorkspaceTransparencyPattern();
    updateEstimate(); saveSettings();
    refreshExportPreviewNow();
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
    syncExportMotionControlsFromMain();
    saveSettings();
});

tiltRangeSlider.addEventListener('input', () => {
    tiltRangeVal.textContent = tiltRangeSlider.value + '°';
    syncSliderTooltip(tiltRangeSlider);
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

    const lightingDirty = CARD_RESET_LIGHTING_SLIDERS.some((id) => !sliderMatchesResetMidpoint(id));

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

    pushModelUndoState({ showToast: targets.length > 1 });
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
    resetCardSlidersToMiddle(CARD_RESET_LIGHTING_SLIDERS);
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
    input?.addEventListener('input', updateCardResetButtonStates);
    input?.addEventListener('change', updateCardResetButtonStates);
});

document.getElementById('rulerToggle')?.addEventListener('change', updateCardResetButtonStates);
buildPlateToggleEl?.addEventListener('change', updateCardResetButtonStates);
buildPlateColorPickerEl?.addEventListener('input', updateCardResetButtonStates);
buildPlateAutoBrightnessEl?.addEventListener('change', updateCardResetButtonStates);
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
    input?.addEventListener('input', updateCardResetButtonStates);
    input?.addEventListener('change', updateCardResetButtonStates);
});

requestAnimationFrame(updateCardResetButtonStates);

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

document.getElementById('btnClearModel')?.addEventListener('click', handleClearModelRequest);
document.getElementById('btnClearModelQuick')?.addEventListener('click', handleClearModelRequest);

async function loadBenchyModel({ clearStoredModel = true } = {}) {
    try {
        const resp = await fetch('./benchy.stl');
        if (!resp.ok) return false;
        const buffer = await resp.arrayBuffer();
        if (clearStoredModel) await clearIDB();
        setDisplayedFileName('3dbenchy.stl');
        currentFileName = '3dbenchy';
        if (!renderer) initThree();
        controls.autoRotateSpeed = BASE_ROTATE_SPEED * getSpeed() * spinDir;
        loadSTLBuffer(buffer, '3dbenchy.stl');
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
    if (path) path.setAttribute('d', iconPathD);
    if (themeToggleRailIconPath) themeToggleRailIconPath.setAttribute('d', iconPathD);
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
        document.documentElement.classList.remove('sidebar-collapsed');
        try { localStorage.setItem('rotater_sidebarCollapsed', '0'); } catch (_) { }
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
        if (tabletTabs) {
            document.documentElement.classList.remove('sidebar-collapsed');
            try { localStorage.setItem('rotater_sidebarCollapsed', '0'); } catch (_) { }
        }
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

document.getElementById('btnAppSettingsCanvas')?.addEventListener('click', () => {
    const root = document.documentElement;
    if (root.classList.contains('layout-mobile-accordion')) applyMobileAccordionState('theme');
    else switchTab('theme');

    if (root.classList.contains('sidebar-collapsed')) {
        root.classList.remove('sidebar-collapsed');
        try { localStorage.setItem('rotater_sidebarCollapsed', '0'); } catch (_) { }
    }

    applyAppSettingsDockState(false);
    try { localStorage.setItem('rotater_appSettingsCollapsed', '0'); } catch (_) { }
});

document.getElementById('btnThemeToggleRail')?.addEventListener('click', () => {
    document.getElementById('btnThemeToggle')?.click();
});

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

    // Toggle step attribute so browser doesn't snap when fine tuning is on.
    document.querySelectorAll('input[type="range"][data-snap-count]').forEach(slider => {
        if (fineTuningMode) {
            if (!slider.dataset.originalStep) slider.dataset.originalStep = slider.step;
            slider.step = 'any';
        } else if (slider.dataset.originalStep) {
            slider.step = slider.dataset.originalStep;
        }
    });

    // In fine tuning mode, keep labels visible but disable clickable snap dots.
    document.querySelectorAll('.snap-dot-btn').forEach(el => {
        el.style.opacity = fineTuningMode ? '0.35' : '';
        el.style.pointerEvents = fineTuningMode ? 'none' : '';
    });
}

// Fine Tuning toggle
const fineTuningCheckEl = document.getElementById('fineTuningCheck');
if (fineTuningCheckEl) {
    applyFineTuningUIState(fineTuningCheckEl.checked);
    updateTextureTuneUI();
    syncAllRangeFillIndicators();
    fineTuningCheckEl.addEventListener('change', () => {
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
    });
}

if (exportMotionControlsToggleEl) {
    exportMotionControlsToggleEl.checked = exportMotionControlsEnabled;
    exportMotionControlsToggleEl.addEventListener('change', () => {
        exportMotionControlsEnabled = !!exportMotionControlsToggleEl.checked;
        if (exportMotionControlsEl) exportMotionControlsEl.hidden = !exportMotionControlsEnabled;
        saveSettings();
    });
}

if (buildPlateSizePresetEl) {
    buildPlateSizePresetEl.value = buildPlateSizePreset;
    buildPlateSizePresetEl.addEventListener('change', () => {
        applyBuildPlateSizePreset(buildPlateSizePresetEl.value);
        syncBuildPlateSizeUI();
        if (mesh) updateShadowCatcherPlacement();
        refreshExportPreviewNow();
        saveSettings();
    });
}

if (buildPlateCustomWidthEl) {
    buildPlateCustomWidthEl.addEventListener('input', () => {
        buildPlateSizePreset = 'custom';
        buildPlateWidth = clampBuildPlateSize(buildPlateCustomWidthEl.value, buildPlateWidth);
        syncBuildPlateSizeUI();
        if (mesh) updateShadowCatcherPlacement();
        refreshExportPreviewNow();
        saveSettings();
    });
}

if (buildPlateCustomDepthEl) {
    buildPlateCustomDepthEl.addEventListener('input', () => {
        buildPlateSizePreset = 'custom';
        buildPlateDepth = clampBuildPlateSize(buildPlateCustomDepthEl.value, buildPlateDepth);
        syncBuildPlateSizeUI();
        if (mesh) updateShadowCatcherPlacement();
        refreshExportPreviewNow();
        saveSettings();
    });
}

syncBuildPlateSizeUI();
syncExportMotionControlsFromMain();

if (autoUIAssistToggleEl) {
    autoUIAssistToggleEl.checked = autoUIAssistEnabled;
    autoUIAssistToggleEl.addEventListener('change', () => {
        autoUIAssistEnabled = !!autoUIAssistToggleEl.checked;
        if (exportCollapsedConfirmToggleEl) {
            exportCollapsedConfirmToggleEl.disabled = !autoUIAssistEnabled;
        }
        saveSettings();
    });
}

if (exportCollapsedConfirmToggleEl) {
    exportCollapsedConfirmToggleEl.checked = exportCollapsedConfirmEnabled;
    exportCollapsedConfirmToggleEl.disabled = !autoUIAssistEnabled;
    exportCollapsedConfirmToggleEl.addEventListener('change', () => {
        exportCollapsedConfirmEnabled = !!exportCollapsedConfirmToggleEl.checked;
        saveSettings();
    });
}

btnExportCollapsedConfirmClose?.addEventListener('click', () => closeCollapsedExportConfirm(false));
btnExportCollapsedConfirmCancel?.addEventListener('click', () => closeCollapsedExportConfirm(false));
btnExportCollapsedConfirmContinue?.addEventListener('click', () => closeCollapsedExportConfirm(true));
exportCollapsedConfirmOverlayEl?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCollapsedExportConfirm(false);
});

btnUploadChoiceClose?.addEventListener('click', () => closeUploadChoicePrompt('cancel'));
btnUploadChoiceCancel?.addEventListener('click', () => closeUploadChoicePrompt('cancel'));
btnUploadChoiceImport?.addEventListener('click', () => closeUploadChoicePrompt('import'));
btnUploadChoiceAdd?.addEventListener('click', () => {
    applyUploadChoicePreference('add');
    closeUploadChoicePrompt('add');
});
btnUploadChoiceReplace?.addEventListener('click', () => {
    applyUploadChoicePreference('replace');
    closeUploadChoicePrompt('replace');
});
uploadChoiceBrowseBtnEl?.addEventListener('click', () => {
    closeUploadChoicePrompt('cancel');
    pendingUploadAction = null;
    fileInput?.click();
});

async function handleUploadChoiceDroppedFiles(fileList) {
    closeUploadChoicePrompt('cancel');
    pendingUploadAction = null;
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
        pendingUploadAction = null;
        fileInput?.click();
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
    resetWarningsToggleEl.addEventListener('click', (e) => {
        e.preventDefault();
        resetAllWarnings();
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

document.getElementById('btnCopyLink')?.addEventListener('click', function () {
    saveSettings();
    settingsToURL();
    const url = location.href;
    const btn = this;
    const prev = btn.textContent;
    navigator.clipboard.writeText(url).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = prev; }, 1800);
    }).catch(() => {
        btn.textContent = 'Copy failed';
        setTimeout(() => { btn.textContent = prev; }, 1800);
    });
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

// ── Info overlay ──────────────────────────────────────────────────────────────
['btnInfoAppSettings'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', () => {
        document.getElementById('infoOverlay').hidden = false;
    });
});
document.getElementById('btnInfoClose').addEventListener('click', () => {
    document.getElementById('infoOverlay').hidden = true;
});
document.getElementById('infoOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('infoOverlay').hidden = true;
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

canvas?.addEventListener('click', (e) => {
    if (!exportWorkspaceActive || !exportFrameEnabled) return;
    if (isCanvasPointInsideCropFrame(e.clientX, e.clientY)) return;
    closeExportWorkspace();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && exportFrameEnabled) cancelCropMode();
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
    if (e.button === 2) endRightPanVerticalLock();
}, true);

window.addEventListener('pointercancel', () => {
    endRightPanVerticalLock();
}, true);

canvas?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
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
    // Also drive the in-viewport progress overlay
    updateExportProgressOverlay(msg, done, total);
};
let _lastExportUiPaintAt = 0;
async function maybePaintExportProgress(msg, done, total, force = false) {
    const now = performance.now();
    // Paint frequently at start (so early progress does not feel stuck), then throttle.
    if (!force && done != null && done > 24 && (now - _lastExportUiPaintAt) < 90) return;
    setAnimStatus(msg, done, total);
    _lastExportUiPaintAt = now;
    await new Promise((resolve) => requestAnimationFrame(resolve));
}
const _exportProgressOverlay = () => document.getElementById('exportProgressOverlay');
const _exportProgressLabel = () => document.getElementById('exportProgressOverlayLabel');
const _exportProgressFill = () => document.getElementById('exportProgressOverlayFill');

function showExportProgressOverlay(msg) {
    const el = _exportProgressOverlay();
    if (!el) return;
    const lbl = _exportProgressLabel();
    const fill = _exportProgressFill();
    if (lbl) lbl.textContent = msg || 'Preparing…';
    if (fill) fill.style.width = '0%';
    el.hidden = false;
}

function updateExportProgressOverlay(msg, done, total) {
    const lbl = _exportProgressLabel();
    const fill = _exportProgressFill();
    if (lbl && msg) lbl.textContent = msg;
    if (fill && done != null && total > 0) fill.style.width = `${Math.round(done / total * 100)}%`;
}

function hideExportProgressOverlay() {
    const el = _exportProgressOverlay();
    if (el) el.hidden = true;
}

const setExporting = v => {
    isExporting = v;
    btnGif.disabled = v;
    btnVideo.disabled = v;
    if (btnPng) btnPng.disabled = v;
    const jpegBtn = document.getElementById('btnExportJpeg');
    if (jpegBtn) jpegBtn.disabled = v;
    const mainBtn = document.getElementById('btnExport');
    if (mainBtn) mainBtn.disabled = v;
    if (v) showExportProgressOverlay('Preparing…');
    else hideExportProgressOverlay();
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
    // Yield one frame so the browser paints the freeze overlay before export
    // rendering begins — prevents the distorted canvas from ever being visible.
    await new Promise(r => requestAnimationFrame(r));
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

            await maybePaintExportProgress(`Encoding… ${i + 1} / ${frames.length}`, i + 1, frames.length);
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
    // Yield one frame so the browser paints the freeze overlay before export
    // rendering begins — prevents the distorted canvas from ever being visible.
    await new Promise(r => requestAnimationFrame(r));
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

        const waitForEncoderQueue = async (maxQueue = 8) => {
            if (!encoder || encoder.state === 'closed') return;
            if (typeof encoder.encodeQueueSize !== 'number') return;
            while (encoder.encodeQueueSize > maxQueue) {
                await new Promise((resolve) => {
                    let done = false;
                    let timeoutId = null;
                    const finish = () => {
                        if (done) return;
                        done = true;
                        if (timeoutId !== null) clearTimeout(timeoutId);
                        try { encoder.removeEventListener?.('dequeue', onDequeue); } catch (_) { }
                        resolve();
                    };
                    const onDequeue = () => {
                        if (encoder.encodeQueueSize <= maxQueue || encoder.state === 'closed') finish();
                    };
                    try { encoder.addEventListener?.('dequeue', onDequeue); } catch (_) { }
                    timeoutId = setTimeout(finish, 50);
                });
                if (encoderError) throw encoderError;
                if (encoder.state === 'closed') throw new Error('VideoEncoder closed unexpectedly — try a lower resolution or bitrate.');
            }
        };
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
        const transparentVideo = !(exportBgColorEl?.checked ?? true);
        const restoreExportScene = applyExportSceneForRender({ forceTransparent: transparentVideo });

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
                await waitForEncoderQueue(8);
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
        restoreSession().finally(finishRestoreSessionState);
    }, 0);
});

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
    { id: 'white', name: 'White', color: PALETTE.preset.white },
    { id: 'black', name: 'Black', color: PALETTE.preset.black },
    { id: 'modelcolor', name: 'Model', color: null }
];

const BUILD_PLATE_PRESETS = [
    { id: 'white', name: 'White', color: PALETTE.preset.white },
    { id: 'black', name: 'Black', color: PALETTE.preset.black },
    { id: 'modelcolor', name: 'Model Sync', color: null }
];

function getBgPresetDefaultTone(presetId) {
    // DEFAULT: Manual-mode slider position for each preset
    // At this position, the slider shows the unmodified preset color.
    if (presetId === 'white') return -100; // Far left: L=100% (pure white, no darkening)
    if (presetId === 'black') return 100;  // Far right: L=0% (pure black, no lightening)
    return 0;                              // Center: no lightness adjustment
}

function getBuildPlatePresetDefaultTone(presetId) {
    // DEFAULT: Manual-mode slider position for each preset
    // At this position, the slider shows the unmodified preset color.
    if (presetId === 'white') return -100; // Far left: L=100% (pure white, no darkening)
    if (presetId === 'black') return 100;  // Far right: L=0% (pure black, no lightening)
    return 0;                              // Center: no lightness adjustment
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
    renderer.setClearColor(computeSurfaceShadeColor(baseHex, getManualBgTone()), 1);
}

function computeAutoBrightnessColor(baseHex) {
    return computeSurfaceShadeColor(baseHex, AUTO_BRIGHTNESS_RULES.background.shade);
}

function computeBuildPlateAutoBrightnessColor(baseHex) {
    return computeBuildPlateShadeColor(baseHex, AUTO_BRIGHTNESS_RULES.buildPlate.shade);
}

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

    const targets = applyToModelPartEditTargets((partSettings, idx) => {
        applyPresetIntoPartSettings(partSettings, p);
        modelPartBaseColors[idx] = partSettings.color;
    });
    syncUIFromSelectedPart();

    if (mesh) rebuildMeshMaterialsForCurrentShading();
    persistCurrentMultipartParts({ immediate: true });

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
    queueModelPartThumbsRender(targets);
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
    const visible = activeBuildPlatePreset === 'modelcolor' && isMultipartModel();
    buildPlateModelSyncSourceWrap.hidden = !visible;
    buildPlateModelSyncSourceWrap.setAttribute('aria-hidden', String(!visible));
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
        const opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'thumb-select-option';
        if (idx === buildPlateSyncPartIndex) opt.classList.add('is-bg-sync-source');
        opt.dataset.partIndex = String(idx);
        opt.setAttribute('role', 'option');
        opt.innerHTML = `<canvas class="thumb-select-option-canvas js-part-thumb-preview" data-part-index="${idx}" width="68" height="68" aria-hidden="true"></canvas><span class="thumb-select-option-text">${name}</span><span class="thumb-select-sync-badge" aria-hidden="true">Sync</span>`;
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
    }
    if (buildPlateModelSyncSelectorText) {
        const selectedName = modelPartNames[buildPlateSyncPartIndex] || `Part ${buildPlateSyncPartIndex + 1}`;
        buildPlateModelSyncSelectorText.textContent = `Sync: ${selectedName}`;
        buildPlateModelSyncSelectorBtn.title = `Surface sync: ${selectedName}`;
    }
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
        const wasDynamicBg = isDynamicBg;
        isDynamicBg = autoBgCheckEl.checked;
        updateAutoBgShadeControlVisibility();
        if (isDynamicBg) updateDynamicBg();
        else {
            if (wasDynamicBg && bgOpacitySlider) {
                // When turning auto off, set slider to manual default (0 for normal, -40 for white, +40 for black)
                const manualDefault = getBgPresetDefaultTone(activeBgPreset);
                bgOpacitySlider.value = String(manualDefault);
                syncBgShadeReadout();
            }
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
    rulerToggleEl.checked = !!rulerEnabled;
    rulerToggleEl.addEventListener('change', () => {
        rulerEnabled = rulerToggleEl.checked;
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
        const wasAuto = buildPlateAutoBrightnessEnabled;
        buildPlateAutoBrightnessEnabled = !!buildPlateAutoBrightnessEl.checked;
        if (!buildPlateAutoBrightnessEnabled && wasAuto) {
            // When turning auto off, set slider to manual default (0 for normal, -40 for white, +40 for black)
            buildPlateShade = getBuildPlatePresetDefaultTone(activeBuildPlatePreset);
            if (buildPlateShadeSliderEl) {
                buildPlateShadeSliderEl.value = String(buildPlateShade);
                syncBuildPlateShadeReadout();
            }
        }
        syncBuildPlateShadeReadout();
        updateBuildPlateShadeControlVisibility();
        updateBuildPlateMaterial();
        refreshExportPreviewNow();
        saveSettings();
    });
}

updateBuildPlateShadeControlVisibility();

if (buildPlateShadeSliderEl) {
    buildPlateShadeSliderEl.addEventListener('input', () => {
        buildPlateShade = Math.max(-100, Math.min(100, Math.round(getSliderEffectiveValue(buildPlateShadeSliderEl)) || 0));
        updateBuildPlateMaterial();
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

const rulerUnitToggleEl = document.getElementById('rulerUnitToggle');
if (rulerUnitToggleEl) {
    const _toggleRulerUnit = () => {
        rulerUnit = (rulerUnit === 'metric') ? 'imperial' : 'metric';
        updateRulerHUD();
        updateLiveRulerOverlay();
        refreshExportPreviewNow();
        saveSettings();
    };
    rulerUnitToggleEl.addEventListener('click', _toggleRulerUnit);
    rulerUnitToggleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _toggleRulerUnit(); }
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
            : `<span class="shading-thumb" id="bg-preset-${preset.id}" style="border-radius:50%;width:44px;height:44px;position:relative;overflow:hidden;cursor:pointer;background-color:${preset.color};border:1.5px solid ${preset.id === 'white' ? PALETTE.preset.bgBorderLight : (preset.id === 'black' ? PALETTE.preset.bgBorderDark : 'transparent')};"></span>`;

        wrap.innerHTML = `
            <label class="shading-option preset-option" title="${preset.name} background">
                ${swatchInner}
            </label>
            <span class="thumb-label">${preset.name}</span>
        `;

        const actionArea = wrap.querySelector('.shading-option');
        actionArea.addEventListener('click', () => {
            if (preset.id === activeBgPreset) return;

            activeBgPreset = preset.id;
            if (preset.id !== 'modelcolor') lastNonModelBgPreset = preset.id;
            // Respect existing auto-adjust state
            const autoBg = document.getElementById('autoBgCheck');
            isDynamicBg = autoBg ? autoBg.checked : false;
            if (preset.id === 'modelcolor') {
                const syncColor = getModelSyncSourceColor();
                bgPick.value = syncColor;
                if (isDynamicBg) updateDynamicBg();
                else applyBackgroundFromBaseColor(syncColor);
            } else {
                if (isDynamicBg) applyBgPresetDefaultTone(preset.id);
                bgPick.value = preset.color;
                bgPick.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (isDynamicBg) updateDynamicBg();
            updateBgSelection();
            if (preset.id === 'modelcolor' && bgModelSyncSelectorMenu && bgModelSyncSelectorBtn) {
                requestAnimationFrame(() => {
                    syncBgModelSyncSourceUI();
                    bgModelSyncSelectorMenu.hidden = false;
                    positionThumbSelectMenu(bgModelSyncSelectorMenu, bgModelSyncSelectorBtn);
                    bgModelSyncSelectorBtn.setAttribute('aria-expanded', 'true');
                });
            }
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
            ? `<span class="shading-thumb" id="build-plate-preset-${preset.id}" style="border-radius:50%;width:44px;height:44px;position:relative;overflow:hidden;cursor:pointer;background-color:transparent;display:flex;align-items:center;justify-content:center;"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.2 12.05C7.2 12.65 7.308 13.246 7.524 13.838C7.74 14.43 8.072 14.979 8.52 15.485L8.565 15.53V14.815C8.565 14.476 8.685 14.186 8.925 13.945C9.165 13.705 9.455 13.585 9.795 13.585C10.135 13.585 10.425 13.705 10.665 13.945C10.905 14.186 11.025 14.476 11.025 14.815V18.695C11.025 19.034 10.905 19.324 10.665 19.565C10.425 19.805 10.135 19.925 9.795 19.925H5.91C5.57 19.925 5.28 19.805 5.04 19.565C4.8 19.324 4.68 19.034 4.68 18.695C4.68 18.355 4.8 18.065 5.04 17.825C5.28 17.584 5.57 17.464 5.91 17.464H7.08L7.035 17.419C6.249 16.633 5.671 15.783 5.301 14.869C4.931 13.955 4.746 13.015 4.746 12.05C4.746 10.515 5.145 9.106 5.943 7.823C6.741 6.539 7.816 5.575 9.168 4.931C9.445 4.793 9.722 4.808 10 4.978C10.277 5.147 10.469 5.393 10.577 5.715C10.669 6.023 10.657 6.331 10.542 6.639C10.426 6.947 10.223 7.186 9.93 7.355C9.1 7.832 8.435 8.485 7.935 9.315C7.435 10.146 7.2 11.057 7.2 12.05ZM16.8 12C16.8 11.4 16.692 10.804 16.476 10.212C16.26 9.62 15.928 9.071 15.48 8.565L15.435 8.52V9.235C15.435 9.575 15.315 9.864 15.075 10.105C14.835 10.345 14.545 10.465 14.205 10.465C13.865 10.465 13.575 10.345 13.335 10.105C13.095 9.864 12.975 9.575 12.975 9.235V5.35C12.975 5.01 13.095 4.72 13.335 4.48C13.575 4.239 13.865 4.12 14.205 4.12H18.09C18.43 4.12 18.72 4.239 18.96 4.48C19.2 4.72 19.32 5.01 19.32 5.35C19.32 5.689 19.2 5.979 18.96 6.22C18.72 6.46 18.43 6.58 18.09 6.58H16.92L16.965 6.625C17.751 7.411 18.329 8.261 18.699 9.175C19.069 10.089 19.254 11.03 19.254 12C19.254 13.535 18.855 14.944 18.057 16.227C17.259 17.511 16.184 18.475 14.832 19.119C14.555 19.257 14.277 19.242 14 19.073C13.723 18.903 13.531 18.657 13.423 18.335C13.331 18.028 13.343 17.72 13.458 17.412C13.574 17.104 13.777 16.864 14.07 16.695C14.9 16.218 15.565 15.565 16.065 14.735C16.565 13.905 16.8 12.993 16.8 12Z" fill="currentColor"/></svg></span>`
            : `<span class="shading-thumb" id="build-plate-preset-${preset.id}" style="border-radius:50%;width:44px;height:44px;position:relative;overflow:hidden;cursor:pointer;background-color:${preset.color};border:1.5px solid ${preset.id === 'white' ? PALETTE.preset.bgBorderLight : (preset.id === 'black' ? PALETTE.preset.bgBorderDark : 'transparent')};"></span>`;

        wrap.innerHTML = `
            <label class="shading-option preset-option" title="${preset.name} surface color">
                ${swatchInner}
            </label>
            <span class="thumb-label">${preset.name}</span>
        `;

        const actionArea = wrap.querySelector('.shading-option');
        actionArea.addEventListener('click', () => {
            if (preset.id === activeBuildPlatePreset) return;

            activeBuildPlatePreset = preset.id;
            if (preset.id !== 'modelcolor') lastNonModelBuildPlatePreset = preset.id;
            if (preset.id === 'modelcolor') {
                buildPlateShade = AUTO_BRIGHTNESS_RULES.buildPlate.shade;
                if (buildPlateShadeSliderEl) {
                    buildPlateShadeSliderEl.value = String(buildPlateShade);
                    syncBuildPlateShadeReadout();
                }
            }
            updateBuildPlateMaterial();
            updateBuildPlateSelection();
            refreshExportPreviewNow();
            saveSettings();
            if (preset.id === 'modelcolor' && buildPlateModelSyncSelectorMenu && buildPlateModelSyncSelectorBtn) {
                requestAnimationFrame(() => {
                    syncBuildPlateModelSyncSourceUI();
                    buildPlateModelSyncSelectorMenu.hidden = false;
                    positionThumbSelectMenu(buildPlateModelSyncSelectorMenu, buildPlateModelSyncSelectorBtn);
                    buildPlateModelSyncSelectorBtn.setAttribute('aria-expanded', 'true');
                });
            }
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
        const baseC = computeTonedColor(colorPick ? colorPick.value : PALETTE.preset.modelToneFallback, val);
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
    renderBuildPlatePresets();
    renderModelShadeSelector();
}
initPresetGallery();
