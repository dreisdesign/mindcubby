import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GIFEncoder, quantize, applyPalette, nearestColorIndex } from 'gifenc';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

// Paste any Rotater URL here to use it as the default settings for first-time visitors
const DEFAULT_SETTINGS_URL = 'https://dreisdesign.github.io/mindcubby/3d/apps/rotater/?c=b4aed6&b=8d8ab7&sh=matte&rm=spin&sp=1&tr=360&wsr=360&sd=1&gl=1&ef=gif&eq=std&ed=square&et=0&gd=0&jq=90&tto=1&tl=75&tc=340&thi=325&ts=100&tsa=0&tsh=115&tpr=100&tpe=125&tcr=100&tce=200&ecd=106.4679&ece=0.0000';

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
const bgPick = document.getElementById('bgPicker');
const bgOpacitySlider = document.getElementById('bgOpacitySlider');
const shadingEl = document.getElementById('shadingSelect');
const speedSlider = document.getElementById('speedSlider');
const speedVal = document.getElementById('speedVal');

const btnGif = document.getElementById('btnExportGif');
const btnVideo = document.getElementById('btnExportVideo');
const btnPng = document.getElementById('btnExportPng');
const exportFormatEl = document.getElementById('exportFormat');
const exportDimensionInputs = Array.from(document.querySelectorAll('input[name="exportDimensions"]'));
const cropDimensionsDock = document.getElementById('cropDimensionsDock');
const statusEl = document.getElementById('exportStatus');
const animStatusEl = document.getElementById('exportStatusAnim');
const fileNameEl = document.getElementById('fileName');
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
const textureTuneReflectionSlider = document.getElementById('textureTuneReflection');
const textureTuneMetalnessSlider = document.getElementById('textureTuneMetalness');
const textureTuneLightVal = document.getElementById('textureTuneLightVal');
const textureTuneContrastVal = document.getElementById('textureTuneContrastVal');
const textureTuneHighlightsVal = document.getElementById('textureTuneHighlightsVal');
const textureTuneShadowsVal = document.getElementById('textureTuneShadowsVal');
const textureTuneLightSourceVal = document.getElementById('textureTuneLightSourceVal');
const textureTuneLightHeightVal = document.getElementById('textureTuneLightHeightVal');
const textureTuneRoughnessVal = document.getElementById('textureTuneRoughnessVal');
const textureTuneReflectionVal = document.getElementById('textureTuneReflectionVal');
const textureTuneMetalnessVal = document.getElementById('textureTuneMetalnessVal');
const textureTuneContrastRow = document.getElementById('textureTuneContrastRow');
const textureTuneHighlightsRow = document.getElementById('textureTuneHighlightsRow');
const textureTuneShadowRow = document.getElementById('textureTuneShadowRow');
const textureTuneLightSourceRow = document.getElementById('textureTuneLightSourceRow');
const textureTuneLightHeightRow = document.getElementById('textureTuneLightHeightRow');
const textureTuneRoughnessRow = document.getElementById('textureTuneRoughnessRow');
const textureTuneReflectionRow = document.getElementById('textureTuneReflectionRow');
const textureTuneMetalnessRow = document.getElementById('textureTuneMetalnessRow');
// Dev logging and a flag used to suppress saveSettings() while programmatically
// applying restored settings so we don't overwrite localStorage/URL mid-restore.
// Capture passthrough URL params (e.g. debug=1) once at startup so they survive
// URL rewrites done by settingsToURL().
const APP_PARAM_KEYS = new Set([
    'c','b','op','sh','rm','sp','tr','wsr','sd','gl','ef','eq','ed','et','gd','jq',
    'tto','tl','tc','thi','ts','tsa','tll','tsh','tmr','tmm','tme','tpr','tpe','tcr','tce',
    'ecd','ece','ecz','aba','abp','amp'
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
const TEXTURE_NEWS_DISMISSED_KEY = 'rotater_textureNewsDismissed';


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
    dotsEl.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < n; i++) {
        const dot = document.createElement('span');
        dot.style.left = `calc(10px + ${(i / (n - 1))} * (100% - 20px))`;
        dotsEl.appendChild(dot);
    }
    wrap.appendChild(dotsEl);
}

// Add snap dots and enforce snap behavior on all range sliders
document.querySelectorAll('input[type="range"]').forEach(addSnapDots);

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
    const rounded = Math.round(closest);
    if (parseFloat(slider.value) !== rounded) slider.value = String(rounded);
}

// Attach snap in capture phase (runs before all bubble-phase input listeners)
document.querySelectorAll('input[type="range"][data-snap-count]').forEach(slider => {
    slider.addEventListener('input', () => snapToGrid(slider), true);
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
        const c = new THREE.Color(bgPick.value);
        let tone = bgOpacitySlider ? parseInt(bgOpacitySlider.value, 10) : 0;
        if (tone > 0) c.lerp(new THREE.Color(0x000000), tone / 100);
        else if (tone < 0) c.lerp(new THREE.Color(0xffffff), -tone / 100);
        if (renderer) renderer.setClearColor(c, 1);
    }
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
    if (!mesh || !mesh.material) return;
    const mode = getActiveShadingMode();
    const mat = mesh.material;
    if (!mat.isMeshStandardMaterial) return;
    if (mode === 'metallic') {
        mat.metalness = textureTuneState.metallicMetalness / 100;
        mat.roughness = (100 - textureTuneState.metallicRoughness) / 100;
        mat.envMapIntensity = (textureTuneState.metallicReflection / 100) * (textureTuneState.highlights / 100);
    } else if (mode === 'phong') {
        mat.metalness = 0;
        mat.roughness = (100 - textureTuneState.phongRoughness) / 100;
        mat.envMapIntensity = (textureTuneState.phongReflection / 100) * (textureTuneState.highlights / 100);
    } else {
        // Clay: matte non-metal baseline with faint environment response.
        mat.metalness = 0;
        mat.roughness = (100 - textureTuneState.matteRoughness) / 100;
        mat.envMapIntensity = (textureTuneState.matteReflection / 100) * (textureTuneState.highlights / 100);
    }
    mat.needsUpdate = true;
}

function getMaterial(shading, baseColor) {
    if (shading === "flat" || shading === "toon") shading = "matte"; // legacy value

    // Tone: -100 = full white, 0 = original color, +100 = full black
    const toneVal = parseInt(opacitySlider ? opacitySlider.value : 0, 10);
    const baseC = new THREE.Color(baseColor);
    if (toneVal !== 0) {
        const hsl = {};
        baseC.getHSL(hsl);
        if (toneVal > 0) {
            hsl.l = hsl.l * (1 - toneVal / 100);
        } else {
            hsl.l = hsl.l + (1.0 - hsl.l) * (-toneVal / 100);
        }
        baseC.setHSL(hsl.h, hsl.s, hsl.l);
    }

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
}// ── STL Loading ───────────────────────────────────────────────────────────────
function loadSTLBuffer(buffer, name) {
    const geo = new STLLoader().parse(buffer);

    // Preserve camera distance when replacing a model (maintain user's zoom level)
    let savedCamPos = null;
    if (mesh && camera) savedCamPos = camera.position.clone();

    if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    }

    // Center and orient (STL files from slicers are Z-up; Three.js is Y-up)
    geo.computeBoundingBox();
    const center = new THREE.Vector3();
    geo.boundingBox.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);
    geo.computeVertexNormals();

    const sz = new THREE.Vector3();
    geo.boundingBox.getSize(sz);
    modelRadius = Math.max(sz.x, sz.y, sz.z) / 2;
    modelDims = { w: sz.x, d: sz.y, h: sz.z };

    mesh = new THREE.Mesh(geo, getMaterial(shadingEl.value, colorPick.value));
    mesh.rotation.x = -Math.PI / 2; // Z-up → Y-up
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    tiltBaseMeshRx = -Math.PI / 2;
    tiltPhase = 0;
    scene.add(mesh);
    updateShadowCatcherPlacement();
    applyCurrentTextureTuning();

    // Sync background color (matters when restoring settings before initThree)
    scene.background = null;

    {
        const c = new THREE.Color(bgPick.value);
        let tone = bgOpacitySlider ? parseInt(bgOpacitySlider.value, 10) : 0;
        if (tone > 0) c.lerp(new THREE.Color(0x000000), tone / 100);
        else if (tone < 0) c.lerp(new THREE.Color(0xffffff), -tone / 100);
        if (renderer) renderer.setClearColor(c, 1);
    }
    updateRulerHUD();

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
    document.getElementById('compactBtnLabel').textContent = 'Replace STL';
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
    });

    const clearBtn = document.getElementById('btnClearModel');
    if (clearBtn) {
        const isDemo = (currentFileName === '3dbenchy');
        const clearLabel = isDemo ? 'Load your own model' : 'Reset to Benchy';
        clearBtn.title = clearLabel;
        clearBtn.setAttribute('aria-label', clearLabel);
    }
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
        drawExportFrame();
        updateExportPreview();
    }
}

// ── Export preview thumbnail ──────────────────────────────────────────────────
let _previewTick = 0;
let _previewRt = null;
let _previewRtWidth = 0;
let _previewRtHeight = 0;
let _previewCam = null;

function updateExportPreview(force = false) {
    if (force) _previewTick = 0;
    if (!force) {
        const stride = exportFrameEnabled ? 1 : 4;
        if (++_previewTick % stride !== 0) return;
    }
    const pv = document.getElementById('exportPreview');
    if (!pv || !renderer || !camera || !scene) return;
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
}

function refreshExportPreviewNow() {
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
            ? 'Zoom to crop'
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
    hud.hidden = !modelDims || !exportFrameEnabled;
    if (!modelDims) return;
    const fmt = v => v.toFixed(1);
    document.getElementById('rulerW').textContent = fmt(modelDims.w);
    document.getElementById('rulerD').textContent = fmt(modelDims.d);
    document.getElementById('rulerH').textContent = fmt(modelDims.h);
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
            activeBgPreset: activeBgPreset,
            activeModelPreset: activeModelPreset,
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
                // shading change handler; update mesh material directly when a
                // mesh is present so the preview no longer shows the wrong shader.
                if (mesh) {
                    try { if (mesh.material) mesh.material.dispose(); } catch (e) { }
                    mesh.material = getMaterial(shadingEl.value, colorPick.value);
                    applyCurrentTextureTuning();
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
            { const el = document.getElementById('exportQuality'); if (el) el.value = eq; }
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
        if (s.activeBgPreset) activeBgPreset = s.activeBgPreset;
        if (s.activeModelPreset) activeModelPreset = s.activeModelPreset;

        // Always apply mode-based classes/slider setup — even when s is null (settings reset)
        const curMode = rotateModeEl.value;
        document.documentElement.classList.toggle('tilt-mode', curMode === 'tilt' || curMode === 'spin' || curMode === 'wobble');
        document.documentElement.classList.toggle('wobble-mode', curMode === 'wobble');
        if (curMode === 'tilt' || curMode === 'spin' || curMode === 'wobble') updateRangeSliderForMode(curMode);
        updateShadingThumbs();
        updateColorSwatches();
        updateTextureTuneUI();
        applyTextureLighting();
        // Ensure preset/thumb UI reflects restored selections
        try { updateModelSelection(); } catch (e) { }
        try { updateBgSelection(); } catch (e) { }
        // Try to infer a matching quick preset now that settings have been restored
        try { reconcileModelPresetFromSettings(); } catch (e) { }
        try { updateModelSelection(); } catch (e) { }
        // If auto-bg was restored, ensure the dynamic background is applied
        try { if (isDynamicBg) updateDynamicBg(); } catch (e) { }
        syncSliderTooltip(speedSlider);
        syncSliderTooltip(tiltRangeSlider);
        syncSliderTooltip(wobbleSpinRangeSlider);
        if (opacitySlider) syncSliderTooltip(opacitySlider);
        if (bgOpacitySlider) syncSliderTooltip(bgOpacitySlider);
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
        activeBgPreset: g('abp'),
        activeModelPreset: g('amp'),
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
    if (activeBgPreset && activeBgPreset !== 'custom') p.set('abp', activeBgPreset);
    if (activeModelPreset && activeModelPreset !== 'custom') p.set('amp', activeModelPreset);
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
            fileNameEl.textContent = '3dbenchy.stl';
            fileNameEl.title = '3dbenchy.stl';
            currentFileName = '3dbenchy';
            if (!renderer) initThree();
            controls.autoRotateSpeed = BASE_ROTATE_SPEED * getSpeed() * spinDir;
            if (DEV_LOG) console.log(`[rotater] restoreSession: calling loadSTLBuffer for demo at ${Date.now()}`);
            loadSTLBuffer(buffer, '3dbenchy.stl');
            saveSettings();
        } catch (e) { /* no demo available — stay on landing page */ }
        return;
    }
    fileNameEl.textContent = saved.name;
    fileNameEl.title = saved.name;
    currentFileName = saved.name.replace(/\.stl$/i, '');
    if (!renderer) initThree();
    controls.autoRotateSpeed = BASE_ROTATE_SPEED * getSpeed() * spinDir;
    if (DEV_LOG) console.log(`[rotater] restoreSession: calling loadSTLBuffer for user file at ${Date.now()}`);
    loadSTLBuffer(saved.buffer, saved.name);
}

// ── UI events ─────────────────────────────────────────────────────────────────
function handleFile(file) {
    if (!file?.name.toLowerCase().endsWith('.stl')) return;
    fileNameEl.textContent = file.name;
    fileNameEl.title = file.name;
    currentFileName = file.name.replace(/\.stl$/i, '');
    if (!renderer) initThree();
    const reader = new FileReader();
    reader.onload = e => {
        const buffer = e.target.result;
        saveFileToIDB(file.name, buffer);
        saveSettings();
        loadSTLBuffer(buffer, file.name);
    };
    reader.readAsArrayBuffer(file);
}

fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

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
    handleFile(e.dataTransfer.files[0]);
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
    if (textureTuneReflectionRow) textureTuneReflectionRow.hidden = !isStandard;
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

    if (isStandard && textureTuneRoughnessSlider && textureTuneReflectionSlider) {
        let rough = textureTuneState.phongRoughness;
        let refl = textureTuneState.phongReflection;
        if (mode === 'metallic') {
            rough = textureTuneState.metallicRoughness;
            refl = textureTuneState.metallicReflection;
        } else if (mode === 'matte') {
            rough = textureTuneState.matteRoughness;
            refl = textureTuneState.matteReflection;
        }
        textureTuneRoughnessSlider.value = String(rough);
        textureTuneReflectionSlider.value = String(refl);
        if (textureTuneRoughnessVal) {
            textureTuneRoughnessVal.textContent = rough <= 10 ? 'Matte' : rough >= 90 ? 'Glossy' : '';
        }
        if (textureTuneReflectionVal) textureTuneReflectionVal.textContent = `${Math.round(refl)}%`;
        syncSliderTooltip(textureTuneRoughnessSlider);
        syncSliderTooltip(textureTuneReflectionSlider);
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

colorPick.addEventListener('input', () => {
    if (mesh) {
        const toneVal = parseInt(opacitySlider ? opacitySlider.value : 0, 10);
        const baseC = new THREE.Color(colorPick.value);
        if (toneVal !== 0) {
            const hsl = {};
            baseC.getHSL(hsl);
            if (toneVal > 0) {
                hsl.l = hsl.l * (1 - toneVal / 100);
            } else {
                hsl.l = hsl.l + (1.0 - hsl.l) * (-toneVal / 100);
            }
            baseC.setHSL(hsl.h, hsl.s, hsl.l);
        }
        mesh.material.color.set(baseC);
        mesh.material.needsUpdate = true;
    }
    updateShadingThumbs();
    updateColorSwatches();
    saveSettings();
});
if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
        const toneVal = parseInt(opacitySlider.value, 10);
        opacityVal.textContent = (toneVal >= 0 ? '+' : '') + toneVal;
        syncSliderTooltip(opacitySlider);
        if (mesh && mesh.material) {
            const baseC = new THREE.Color(colorPick.value);
            if (toneVal !== 0) {
                const hsl = {};
                baseC.getHSL(hsl);
                if (toneVal > 0) {
                    hsl.l = hsl.l * (1 - toneVal / 100);
                } else {
                    hsl.l = hsl.l + (1.0 - hsl.l) * (-toneVal / 100);
                }
                baseC.setHSL(hsl.h, hsl.s, hsl.l);
            }
            mesh.material.color.set(baseC);
            mesh.material.needsUpdate = true;
        }
        updateShadingThumbs();
        saveSettings();
    });
}

if (bgOpacitySlider) {
    bgOpacitySlider.addEventListener('input', () => {
        const bgTone = parseInt(bgOpacitySlider.value, 10);
        document.getElementById('bgOpacityVal').textContent = (bgTone >= 0 ? '+' : '') + bgTone;
        syncSliderTooltip(bgOpacitySlider);
        const c = new THREE.Color(bgPick.value);
        let tone = parseInt(bgOpacitySlider.value, 10);
        if (tone > 0) c.lerp(new THREE.Color(0x000000), tone / 100);
        else if (tone < 0) c.lerp(new THREE.Color(0xffffff), -tone / 100);
        if (renderer) renderer.setClearColor(c, 1);
        if (isDynamicBg) updateDynamicBg();
        saveSettings();
    });
}


bgPick.addEventListener('input', () => {
    scene.background = null;

    {
        const c = new THREE.Color(bgPick.value);
        let tone = bgOpacitySlider ? parseInt(bgOpacitySlider.value, 10) : 0;
        if (tone > 0) c.lerp(new THREE.Color(0x000000), tone / 100);
        else if (tone < 0) c.lerp(new THREE.Color(0xffffff), -tone / 100);
        if (renderer) renderer.setClearColor(c, 1);
    }
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
    const mode = getActiveShadingMode();
    const v = parseFloat(textureTuneRoughnessSlider.value);
    if (mode === 'metallic') textureTuneState.metallicRoughness = v;
    if (mode === 'phong') textureTuneState.phongRoughness = v;
    if (mode === 'matte') textureTuneState.matteRoughness = v;
    if (textureTuneRoughnessVal) {
        const roughLabel = v <= 10 ? 'Matte' : v >= 90 ? 'Glossy' : '';
        textureTuneRoughnessVal.textContent = roughLabel;
    }
    updateTextureTuneUI();
    applyCurrentTextureTuning();
    saveSettings();
});

textureTuneReflectionSlider?.addEventListener('input', () => {
    const mode = getActiveShadingMode();
    const v = parseFloat(textureTuneReflectionSlider.value);
    if (mode === 'metallic') textureTuneState.metallicReflection = v;
    if (mode === 'phong') textureTuneState.phongReflection = v;
    if (mode === 'matte') textureTuneState.matteReflection = v;
    updateTextureTuneUI();
    applyCurrentTextureTuning();
    saveSettings();
});

textureTuneMetalnessSlider?.addEventListener('input', () => {
    textureTuneState.metallicMetalness = parseFloat(textureTuneMetalnessSlider.value);
    updateTextureTuneUI();
    applyCurrentTextureTuning();
    saveSettings();
});

shadingEl.addEventListener('change', () => {
    if (shadingEl.value === 'flat' || shadingEl.value === 'toon') shadingEl.value = 'matte';
    updateTextureTuneUI();
    if (mesh) {
        mesh.material.dispose();
        mesh.material = getMaterial(shadingEl.value, colorPick.value);
        applyCurrentTextureTuning();
    }
    saveSettings();
});

document.querySelectorAll('#gifLoop, #gifDither').forEach(el =>
    el.addEventListener('change', saveSettings)
);

document.getElementById('exportQuality')?.addEventListener('change', () => {
    updateEstimate();
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
const FORMAT_BTNS = { gif: 'btnExportGif', mp4: 'btnExportVideo', png: 'btnExportPng', jpg: 'btnExportJpeg' };

function applyExportFormat(fmt) {
    document.querySelectorAll('.export-format-opts').forEach(el => { el.hidden = true; });
    const opts = document.getElementById(`exportOpts-${fmt}`);
    if (opts) opts.hidden = false;
    updateCropDimensionsDock();
    const mainBtn = document.getElementById('btnExport');
    if (mainBtn) mainBtn.textContent = FORMAT_LABELS[fmt] ?? 'Export';
    updateEstimate();
    refreshExportPreviewNow();
}

exportFormatEl?.addEventListener('change', function () {
    applyExportFormat(this.value);
    saveSettings();
});

// Main export button dispatches to hidden per-format button
document.getElementById('btnExport')?.addEventListener('click', () => {
    const fmt = exportFormatEl?.value ?? 'gif';
    document.getElementById(FORMAT_BTNS[fmt])?.click();
});

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
        fileNameEl.textContent = '3dbenchy.stl';
        fileNameEl.title = '3dbenchy.stl';
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

function switchTab(tab) {
    document.querySelectorAll('.sidebar-tab').forEach(btn => {
        const active = btn.dataset.tab === tab;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.hidden = panel.dataset.panel !== tab;
    });
    try { localStorage.setItem('rotater_activeTab', tab); } catch (_) { }
}

document.querySelectorAll('.sidebar-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Restore active tab
try {
    const savedTab = localStorage.getItem('rotater_activeTab');
    if (savedTab && document.querySelector(`.sidebar-tab[data-tab="${savedTab}"]`)) {
        switchTab(savedTab);
    }
} catch (_) { }

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

// Fine Tuning toggle
const fineTuningCheckEl = document.getElementById('fineTuningCheck');
if (fineTuningCheckEl) {
    fineTuningCheckEl.addEventListener('change', () => {
        fineTuningMode = fineTuningCheckEl.checked;
        // Toggle step attribute so browser doesn't snap when fine tuning is on
        document.querySelectorAll('input[type="range"][data-snap-count]').forEach(slider => {
            if (fineTuningMode) {
                if (!slider.dataset.originalStep) slider.dataset.originalStep = slider.step;
                slider.step = 'any';
            } else {
                if (slider.dataset.originalStep) slider.step = slider.dataset.originalStep;
            }
        });
        // Show/hide snap dots based on mode
        document.querySelectorAll('.snap-dots').forEach(el => {
            el.style.opacity = fineTuningMode ? '0' : '';
            el.style.pointerEvents = fineTuningMode ? 'none' : '';
        });
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

document.getElementById('btnCopyLink')?.addEventListener('click', () => {
    settingsToURL();
    navigator.clipboard.writeText(location.href).then(() => {
        const btn = document.getElementById('btnCopyLink');
        const prev = btn.innerHTML;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.innerHTML = prev; }, 1800);
    }).catch(() => { });
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

function reconcileModelPresetFromSettings() {
    // If presets aren't loaded yet or the user already has a non-custom active
    // preset, nothing to do.
    if (!QUICK_PRESETS || QUICK_PRESETS.length === 0) return;
    if (activeModelPreset && activeModelPreset !== 'custom') return;

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
    { id: 'modelcolor', name: 'Model Sync', color: null }  // syncs with model color
];

let isDynamicBg = false;

function updateDynamicBg() {
    if (!isDynamicBg || !renderer) return;
    let baseHex;
    if (activeBgPreset === 'modelcolor') {
        baseHex = colorPick.value;
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
    // Update Model BG preset swatch if visible
    const modelBgThumb = document.getElementById('bg-preset-modelcolor');
    if (modelBgThumb) {
        modelBgThumb.style.backgroundColor = colorPick.value;
        // Also update sphere overlay to match current active preset
        const activeTs = THUMB_STYLES[activeModelPreset] || null;
        const overlaySpan = modelBgThumb.querySelector('span');
        if (overlaySpan && activeTs) overlaySpan.style.background = activeTs.overlay;
    }
    // If Model bg preset is active, update the actual bg
    if (activeBgPreset === 'modelcolor') {
        bgPick.value = colorPick.value;
        // Only apply directly to renderer if auto-adjust is off
        // (updateDynamicBg above handles it when isDynamicBg is true)
        if (!isDynamicBg) {
            renderer && renderer.setClearColor(new THREE.Color(colorPick.value), 1);
        }
    }
});

// SVG rainbow ring for custom swatches — matches the provided design SVG
function rainbowRingSvg(svgId, fillColor) {
    const gid = `rr-${svgId}`;
    return `<svg id="${svgId}" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44" fill="none" style="display:block;cursor:pointer;"><circle cx="22" cy="22" r="19.5" fill="${fillColor}" stroke="url(#${gid})" stroke-width="3"/><defs><radialGradient id="${gid}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(43 18) rotate(156.894) scale(43.7)"><stop stop-color="#FF0909"/><stop offset="0.240385" stop-color="#FF9D00"/><stop offset="0.538462" stop-color="#FFF718"/><stop offset="0.740385" stop-color="#84FF00"/><stop offset="0.9375" stop-color="#8C00FF"/></radialGradient></defs></svg>`;
}

let activeModelPreset = 'custom';
let customModelSettings = null; // Stores last custom color/shading/opacity

function storeCustomSettings() {
    customModelSettings = {
        color: colorPick.value,
        tone: opacitySlider ? opacitySlider.value : 0,
        shading: shadingEl.value
    };
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
            if (activeModelPreset === 'custom') storeCustomSettings();

            if (preset.url) {
                const currentAuto = isDynamicBg ? '1' : '0';
                // Build the URL from the preset, injecting passthrough params (e.g. debug=1)
                let finalUrl = preset.url + '&amp=' + preset.id + '&aba=' + currentAuto;
                if (_passthroughParams.toString()) finalUrl += '&' + _passthroughParams.toString();
                history.replaceState(null, '', finalUrl);

                // Enforce state immediately so restore/save capture it
                activeModelPreset = preset.id;
                restoreSettings();

                // Enforce again in case restoreSettings overrides it fallback
                activeModelPreset = preset.id;
                saveSettings(); // This rewrites history with current UI state, using the preset ID

                colorPick.dispatchEvent(new Event('input', { bubbles: true }));
                if (opacitySlider) opacitySlider.dispatchEvent(new Event('input', { bubbles: true }));
                shadingEl.dispatchEvent(new Event('change', { bubbles: true }));
                if (bgPick) bgPick.dispatchEvent(new Event('input', { bubbles: true }));

                applyCurrentTextureTuning();
                updateDynamicBg();
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
        if (customModelSettings) {
            colorPick.value = customModelSettings.color;
            if (opacitySlider) opacitySlider.value = customModelSettings.tone ?? customModelSettings.opacity ?? 0;
            shadingEl.value = customModelSettings.shading;
            colorPick.dispatchEvent(new Event('input'));
            if (opacitySlider) opacitySlider.dispatchEvent(new Event('input'));
            shadingEl.dispatchEvent(new Event('change'));
        }
        updateModelSelection();
        // Open the model color picker
        colorPick.style.width = '1px';
        colorPick.style.height = '1px';
        colorPick.style.pointerEvents = 'auto';
        try { colorPick.showPicker(); } catch (e) { colorPick.click(); }
        setTimeout(() => {
            colorPick.style.width = '0';
            colorPick.style.height = '0';
            colorPick.style.pointerEvents = 'none';
        }, 200);
    });
    bar.appendChild(customWrap);

    // Initial call
    requestAnimationFrame(updateModelSelection);
}


let activeBgPreset = 'custom';

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
                renderer && renderer.setClearColor(new THREE.Color(colorPick.value), 1);
            } else if (activeBgPreset === 'custom') {
                bgPick.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                const preset = BG_PRESETS.find(p => p.id === activeBgPreset);
                if (preset && preset.color) bgPick.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
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

        let swatchInner;
        if (preset.id === 'modelcolor') {
            // No sphere styling, just the raw color and SVG
            swatchInner = `<span class="shading-thumb" id="bg-preset-${preset.id}" style="border-radius:8px;width:44px;height:44px;position:relative;overflow:hidden;cursor:pointer;background-color:transparent;display:flex;align-items:center;justify-content:center;"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.1752 12.025C6.1752 12.675 6.29186 13.3208 6.5252 13.9625C6.75853 14.6042 7.11686 15.2 7.6002 15.75L7.6502 15.8V15.025C7.6502 14.6583 7.77936 14.3458 8.0377 14.0875C8.29603 13.8292 8.60853 13.7 8.9752 13.7C9.34186 13.7 9.65436 13.8292 9.9127 14.0875C10.171 14.3458 10.3002 14.6583 10.3002 15.025V19.225C10.3002 19.5917 10.171 19.9042 9.9127 20.1625C9.65436 20.4208 9.34186 20.55 8.9752 20.55H4.7752C4.40853 20.55 4.09603 20.4208 3.8377 20.1625C3.57936 19.9042 3.4502 19.5917 3.4502 19.225C3.4502 18.8583 3.57936 18.5458 3.8377 18.2875C4.09603 18.0292 4.40853 17.9 4.7752 17.9H6.0502L6.0002 17.85C5.1502 17 4.5252 16.0792 4.1252 15.0875C3.7252 14.0958 3.5252 13.075 3.5252 12.025C3.5252 10.3583 3.95853 8.82918 4.8252 7.43751C5.69186 6.04585 6.85853 5.00001 8.3252 4.30001C8.6252 4.15001 8.9252 4.16668 9.2252 4.35001C9.5252 4.53335 9.73353 4.80001 9.8502 5.15001C9.9502 5.48335 9.9377 5.81668 9.8127 6.15001C9.6877 6.48335 9.46686 6.74168 9.1502 6.92501C8.2502 7.44168 7.52936 8.15001 6.9877 9.05001C6.44603 9.95001 6.1752 10.9417 6.1752 12.025ZM17.8252 11.975C17.8252 11.325 17.7085 10.6792 17.4752 10.0375C17.2419 9.39585 16.8835 8.80001 16.4002 8.25001L16.3502 8.20001V8.97501C16.3502 9.34168 16.221 9.65418 15.9627 9.91251C15.7044 10.1708 15.3919 10.3 15.0252 10.3C14.6585 10.3 14.346 10.1708 14.0877 9.91251C13.8294 9.65418 13.7002 9.34168 13.7002 8.97501V4.77501C13.7002 4.40835 13.8294 4.09585 14.0877 3.83751C14.346 3.57918 14.6585 3.45001 15.0252 3.45001H19.2252C19.5919 3.45001 19.9044 3.57918 20.1627 3.83751C20.421 4.09585 20.5502 4.40835 20.5502 4.77501C20.5502 5.14168 20.421 5.45418 20.1627 5.71251C19.9044 5.97085 19.5919 6.10001 19.2252 6.10001H17.9502L18.0002 6.15001C18.8502 7.00001 19.4752 7.92085 19.8752 8.91251C20.2752 9.90418 20.4752 10.925 20.4752 11.975C20.4752 13.6417 20.0419 15.1708 19.1752 16.5625C18.3085 17.9542 17.1419 19 15.6752 19.7C15.3752 19.85 15.0752 19.8333 14.7752 19.65C14.4752 19.4667 14.2669 19.2 14.1502 18.85C14.0502 18.5167 14.0627 18.1833 14.1877 17.85C14.3127 17.5167 14.5335 17.2583 14.8502 17.075C15.7502 16.5583 16.471 15.85 17.0127 14.95C17.5544 14.05 17.8252 13.0583 17.8252 11.975Z" fill="#1C1B1F"/>
</svg></span>`;
        } else {
            swatchInner = `<span class="shading-thumb" id="bg-preset-${preset.id}" style="border-radius:50%;width:44px;height:44px;position:relative;overflow:hidden;cursor:pointer;background-color:${preset.color};"></span>`;
        }

        wrap.innerHTML = `
            <label class="shading-option preset-option" title="${preset.name} background">
                ${swatchInner}
            </label>
            <span class="thumb-label">${preset.name}</span>
        `;

        const actionArea = wrap.querySelector('.shading-option');
        actionArea.addEventListener('click', () => {
            activeBgPreset = preset.id;
            // Respect existing auto-adjust state
            const autoBg = document.getElementById('autoBgCheck');
            isDynamicBg = autoBg ? autoBg.checked : false;
            if (preset.id === 'modelcolor') {
                bgPick.value = colorPick.value;
                bgPick.dispatchEvent(new Event('input', { bubbles: false }));
                if (isDynamicBg) updateDynamicBg();
                else renderer && renderer.setClearColor(new THREE.Color(colorPick.value), 1);
            } else {
                bgPick.value = preset.color;
                bgPick.dispatchEvent(new Event('input', { bubbles: true }));
                if (isDynamicBg) updateDynamicBg();
            }
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
            isDynamicBg = false;
            activeBgPreset = 'custom';
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
    // Tone dots: -100 (lightest/white) to +100 (darkest/black), 9 steps
    const values = [-100, -75, -50, -25, 0, 25, 50, 75, 100];
    const currentVal = parseInt(opacitySlider ? opacitySlider.value : 0, 10);
    values.forEach((val) => {
        const dot = document.createElement('div');
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.borderRadius = '50%';
        dot.style.cursor = 'pointer';
        // Show actual model color lerped toward white (negative) or black (positive)
        const baseC = new THREE.Color(colorPick ? colorPick.value : '#2e2b74');
        if (val > 0) baseC.lerp(new THREE.Color(0x000000), val / 100);
        else if (val < 0) baseC.lerp(new THREE.Color(0xffffff), -val / 100);
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




document.getElementById('btnDownloadArchive')?.addEventListener('click', async () => {
    if (!currentModel) {
        alert("Upload an STL to export first.");
        return;
    }

    // We already have STLExporter from THREE (loaded in index.html ideally, or we can use JS Blob if we retained original File)
    // Actually, what does "download settings that captures the settings plus the STL for re-upload" mean?
    // Probably a zip? We don't have JSZip. We could download a JSON file, or we just save the current `settings` as a json.
    // For now, let's just create a JSON export of all current variables.

    const settings = {
        modelColor: colorPick.value,
        modelTone: opacitySlider ? opacitySlider.value : 0,
        modelShading: shadingEl.value,
        bgColor: bgPick.value,
        bgTone: document.getElementById('bgOpacitySlider') ? document.getElementById('bgOpacitySlider').value : 0,
        isDynamicBg,
        rotSpeed: rotXSlider.value,
        rotType: document.querySelector('input[name="rot_type"]:checked')?.value || 'local',
        rotAxisX: document.getElementById('chkAxisX').checked,
        rotAxisY: document.getElementById('chkAxisY').checked,
        rotAxisZ: document.getElementById('chkAxisZ').checked,
        cameraPosZ: camera.position.z,
        lightIntensity: lightIntensitySlider.value,
        pointLightIntensity: pointLightIntensitySlider.value
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "rotater-theme-settings.json";
    a.click();
    URL.revokeObjectURL(url);
});
