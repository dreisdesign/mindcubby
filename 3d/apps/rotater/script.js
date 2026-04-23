import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GIFEncoder, quantize, applyPalette, nearestColorIndex } from 'gifenc';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

// ── Defaults ─────────────────────────────────────────────────────────────────
// Export quality presets — size+fps+bitrate in one pick (always square output)
const QUALITY_PRESETS = {
    web: { size: 480, fps: 15, bitrate: 4_000_000 },
    std: { size: 720, fps: 24, bitrate: 8_000_000 },
    high: { size: 1080, fps: 30, bitrate: 16_000_000 },
};

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
        return {
            quality: parseInt(document.getElementById('jpegQuality')?.value ?? 92, 10) / 100,
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

    // Image — based on actual canvas pixel size
    const imgEstPng = document.getElementById('imgEstPng');
    const imgEstJpg = document.getElementById('imgEstJpg');
    if ((imgEstPng || imgEstJpg) && renderer) {
        const pw = renderer.domElement.width, ph = renderer.domElement.height;
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
const bgPick = document.getElementById('bgPicker');
const shadingEl = {
    get value() { return document.querySelector('input[name="shading"]:checked')?.value ?? 'phong'; },
    set value(v) { const el = document.querySelector(`input[name="shading"][value="${v}"]`); if (el) el.checked = true; },
    addEventListener(type, fn) { document.querySelectorAll('input[name="shading"]').forEach(el => el.addEventListener(type, fn)); },
};
const speedSlider = document.getElementById('speedSlider');
const speedVal = document.getElementById('speedVal');

const btnGif = document.getElementById('btnExportGif');
const btnVideo = document.getElementById('btnExportVideo');
const btnPng = document.getElementById('btnExportPng');
const exportFormatEl = document.getElementById('exportFormat');
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
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const step = parseFloat(slider.step) || 1;
    const n = Math.round((max - min) / step) + 1;
    if (n < 2 || n > 24) return;
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

// Add snap dots to all range sliders at startup
document.querySelectorAll('input[type="range"]').forEach(addSnapDots);

// ── State ─────────────────────────────────────────────────────────────────────
let renderer, scene, camera, controls, mesh;
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
let _cropSx = 0, _cropSy = 0, _cropSq = 0; // crop box pixel coords, updated each frame
let _cropLiveSyncArmed = false; // becomes true only after user adjusts camera during crop mode
let _hasRestoredExportFrame = false; // startup-only flag for applying persisted export framing

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

function getCropFrameVerticalScale() {
    const wrap = canvas?.parentElement;
    if (!wrap) return CROP_FRAME_UI_SCALE;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return CROP_FRAME_UI_SCALE;
    const sq = _cropSq > 0 ? _cropSq : Math.round(Math.min(w, h) * CROP_FRAME_UI_SCALE);
    return Math.max(1e-6, sq / h);
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
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.75;

    // RoomEnvironment provides neutral IBL so MeshStandardMaterial (metal
    // shading) has environment reflections — without it metalness hides the
    // diffuse and the model renders near-black.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = pmrem.fromScene(new RoomEnvironment(renderer)).texture;
    pmrem.dispose();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(bgPick.value);
    scene.environment = roomEnv; // IBL for metallic shading

    camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1e6);

    // Three-point lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(1.5, 2.0, 1.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-2, 0.5, -1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(0.5, -1, -2);
    scene.add(rim);

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
        if (exportFrameEnabled) fitToFrame();
    }
    updateEstimate();
    // Re-render immediately after setSize clears the buffer so the browser
    // never composites a blank canvas (prevents the dark-flash during resize).
    if (scene && camera && !isExporting) renderer.render(scene, camera);
}

// ── Material ─────────────────────────────────────────────────────────────────
function getMaterial(shading, color) {
    const base = { color, side: THREE.DoubleSide };
    if (shading === 'flat') return new THREE.MeshBasicMaterial(base);
    // Phong: PBR non-metal with moderate roughness. Using MeshStandardMaterial
    // so the RoomEnvironment IBL provides indirect specular — this makes dark/
    // black models readable via env reflections regardless of albedo.
    if (shading === 'phong') return new THREE.MeshStandardMaterial({ ...base, metalness: 0, roughness: 0.62, envMapIntensity: 0.4 });
    // metallic
    return new THREE.MeshStandardMaterial({ ...base, metalness: 0.65, roughness: 0.3 });
}

// ── STL Loading ───────────────────────────────────────────────────────────────
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

    mesh = new THREE.Mesh(geo, getMaterial(shadingEl.value, colorPick.value));
    mesh.rotation.x = -Math.PI / 2; // Z-up → Y-up
    tiltBaseMeshRx = -Math.PI / 2;
    tiltPhase = 0;
    scene.add(mesh);

    // Sync background color (matters when restoring settings before initThree)
    if (scene) scene.background.set(bgPick.value);

    const sz = new THREE.Vector3();
    geo.boundingBox.getSize(sz);
    modelRadius = Math.max(sz.x, sz.y, sz.z) / 2;
    modelDims = { w: sz.x, d: sz.y, h: sz.z };
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
        if (!savedCamPos) { placeCamera(); renderer.render(scene, camera); }
        if (_hasRestoredExportFrame && Number.isFinite(exportCamDist) && exportCamDist > 0) {
            const { target, az } = getOrbitFrameState();
            setCameraFromOrbitState(camera, target, exportCamDist, exportCamElev, az);
            camera.zoom = exportCamZoom || 1;
            camera.updateProjectionMatrix();
            controls.target.copy(target);
            controls.update();
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
    const dist = modelRadius * Math.max(1, 1 / aspect) / tanHalfFov * 1.8;
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
    const sq = Math.round(Math.min(w, h) * CROP_FRAME_UI_SCALE);
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // dist so model fills ~88% of the export square: world half-extent = (sq/h)*tan*dist
    const dist = modelRadius * h / (0.88 * sq * tanHalfFov);
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
        renderer.render(scene, camera);
        drawExportFrame();
        updateExportPreview();
    }
}

// ── Export preview thumbnail ──────────────────────────────────────────────────
let _previewTick = 0;
let _previewRt = null;
let _previewRtSize = 0;
let _previewCam = null;

function updateExportPreview() {
    if (++_previewTick % 4 !== 0) return; // update every 4th frame
    const pv = document.getElementById('exportPreview');
    if (!pv || !renderer || !camera || !scene) return;
    if (exportCamDist === null) return; // not ready yet

    const cssW = pv.offsetWidth || 160;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(cssW * dpr);
    if (pv.width !== px || pv.height !== px) { pv.width = px; pv.height = px; }

    if (!_previewRt || _previewRtSize !== px) {
        if (_previewRt) _previewRt.dispose();
        _previewRtSize = px;
        _previewRt = new THREE.WebGLRenderTarget(px, px, {
            samples: renderer.capabilities.isWebGL2 ? 4 : 0,
        });
        _previewRt.texture.colorSpace = THREE.SRGBColorSpace;
    }

    if (!_previewCam) {
        _previewCam = new THREE.PerspectiveCamera(45, 1, 0.01, 1e6);
    }
    _previewCam.fov = camera.fov;
    _previewCam.near = camera.near;
    _previewCam.far = camera.far;
    _previewCam.up.copy(camera.up);
    _previewCam.aspect = 1;
    _previewCam.updateProjectionMatrix();

    if (exportFrameEnabled) {
        // Crop mode: live-sync framing from the current viewport pose every preview tick.
        const { target, dist, elev, az } = getOrbitFrameState();
        const cropScale = getCropFrameVerticalScale();
        const exportZoom = (camera.zoom || 1) / cropScale;
        setCameraFromOrbitState(_previewCam, target, dist, elev, az);
        _previewCam.zoom = exportZoom;
        _previewCam.updateProjectionMatrix();
        exportCamDist = dist;
        exportCamElev = elev;
        exportCamZoom = exportZoom;
    } else {
        // Normal mode preview uses stored export distance/elevation/zoom.
        const { target, az } = getOrbitFrameState();
        setCameraFromOrbitState(_previewCam, target, exportCamDist, exportCamElev, az);
        _previewCam.zoom = exportCamZoom || (camera.zoom || 1);
        _previewCam.updateProjectionMatrix();
    }

    renderer.setRenderTarget(_previewRt);
    renderer.render(scene, _previewCam);
    renderer.setRenderTarget(null);

    // Read pixels and flip vertically (WebGL origin is bottom-left)
    const buf = new Uint8Array(px * px * 4);
    renderer.readRenderTargetPixels(_previewRt, 0, 0, px, px, buf);
    const imgData = pv.getContext('2d').createImageData(px, px);
    for (let row = 0; row < px; row++) {
        const srcRow = (px - 1 - row) * px * 4;
        imgData.data.set(buf.subarray(srcRow, srcRow + px * 4), row * px * 4);
    }
    pv.getContext('2d').putImageData(imgData, 0, 0);
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

function drawExportFrame() {
    const fc = document.getElementById('exportFrameCanvas');
    if (!fc) return;
    const wrap = fc.parentElement;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;
    if (fc.width !== w || fc.height !== h) { fc.width = w; fc.height = h; }

    const sq = Math.round(Math.min(w, h) * CROP_FRAME_UI_SCALE);
    const sx = Math.floor((w - sq) / 2);
    const sy = Math.floor((h - sq) / 2);
    const ctx = fc.getContext('2d');

    ctx.clearRect(0, 0, w, h);

    const cc = document.getElementById('cropControls');
    if (exportFrameEnabled) {
        // Draw dim overlay directly on canvas — avoids hard CSS edges from backdrop-filter divs
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, w, sy);                  // top
        ctx.fillRect(0, sy + sq, w, h - sy - sq);   // bottom
        ctx.fillRect(0, sy, sx, sq);                // left
        ctx.fillRect(sx + sq, sy, w - sx - sq, sq); // right

        // Corner bracket marks
        const cm = Math.round(sq * 0.07);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy + cm); ctx.lineTo(sx, sy); ctx.lineTo(sx + cm, sy);           // TL
        ctx.moveTo(sx + sq - cm, sy); ctx.lineTo(sx + sq, sy); ctx.lineTo(sx + sq, sy + cm);      // TR
        ctx.moveTo(sx, sy + sq - cm); ctx.lineTo(sx, sy + sq); ctx.lineTo(sx + cm, sy + sq);      // BL
        ctx.moveTo(sx + sq - cm, sy + sq); ctx.lineTo(sx + sq, sy + sq); ctx.lineTo(sx + sq, sy + sq - cm); // BR
        ctx.stroke();

        // Position the crop controls div to match the crop square
        if (cc) {
            cc.hidden = false;
            cc.removeAttribute('aria-hidden');
            cc.style.left = sx + 'px';
            cc.style.top = sy + 'px';
            cc.style.width = sq + 'px';
            cc.style.height = sq + 'px';
        }
        // Position the 4 transparent click-capture divs over the dim regions
        _cropSx = sx; _cropSy = sy; _cropSq = sq;
        [['frameDimTop', 0, 0, w, sy],
        ['frameDimBottom', 0, sy + sq, w, h - sy - sq],
        ['frameDimLeft', 0, sy, sx, sq],
        ['frameDimRight', sx + sq, sy, w - sx - sq, sq]
        ].forEach(([id, l, t, dw, dh]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.left = l + 'px'; el.style.top = t + 'px';
            el.style.width = dw + 'px'; el.style.height = dh + 'px';
        });
        document.documentElement.classList.add('crop-mode');
    } else {
        // Frame off: just clear — no hint brackets
        ctx.clearRect(0, 0, w, h);
        if (cc) { cc.hidden = true; cc.setAttribute('aria-hidden', 'true'); }
        document.documentElement.classList.remove('crop-mode');
    }
}

function clearExportFrame() {
    // Dim is drawn on canvas each frame; just force-clear immediately for instant feedback
    const fc = document.getElementById('exportFrameCanvas');
    if (fc) fc.getContext('2d').clearRect(0, 0, fc.width, fc.height);
    const cc = document.getElementById('cropControls');
    if (cc) { cc.hidden = true; cc.setAttribute('aria-hidden', 'true'); }
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
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
            color: colorPick.value,
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
            animBg: document.getElementById('animBg')?.checked ? '1' : '0',
            imageTransparent: document.getElementById('imageBg')?.checked ? '1' : '0',
            gifDither: document.getElementById('gifDither')?.checked ? '1' : '0',
            jpegQuality: document.getElementById('jpegQuality')?.value ?? '92',
            exportCamDist: exportCamDist,
            exportCamElev: exportCamElev,
            exportCamZoom: exportCamZoom,
        }));
    } catch (e) { }
    settingsToURL();
}

function restoreSettings() {
    try {
        const urlS = getURLSettings();
        const localS = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {};
        let s = localS;
        if (urlS) {
            s = { ...localS };
            Object.entries(urlS).forEach(([k, v]) => {
                if (v !== null && v !== undefined) s[k] = v;
            });
        }
        if (s) {
            if (s.color) colorPick.value = s.color;
            if (s.bg) bgPick.value = s.bg;
            if (s.shading) shadingEl.value = s.shading;
            if (s.speed != null) {
                speedSlider.value = s.speed; // browser quantizes to nearest step (0–4)
                speedVal.textContent = getSpeed() + '×';
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
            // Restore background checkboxes (checked = has background; legacy exportTransparentBg was inverted)
            if (s.animBg != null) { const el = document.getElementById('animBg'); if (el) el.checked = (s.animBg === true || s.animBg === '1'); }
            else if (s.exportTransparentBg != null) { const el = document.getElementById('animBg'); if (el) el.checked = !(s.exportTransparentBg === true || s.exportTransparentBg === '1'); }
            if (s.imageTransparent != null) {
                const el = document.getElementById('imageBg');
                if (el) el.checked = (s.imageTransparent === true || s.imageTransparent === '1');
            } else if (s.imageBg != null) {
                // Legacy: imageBg=1 meant "has background" (opaque), so transparent = !imageBg
                const el = document.getElementById('imageBg');
                if (el) el.checked = !(s.imageBg === true || s.imageBg === '1');
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
        // Always apply mode-based classes/slider setup — even when s is null (settings reset)
        const curMode = rotateModeEl.value;
        document.documentElement.classList.toggle('tilt-mode', curMode === 'tilt' || curMode === 'spin' || curMode === 'wobble');
        document.documentElement.classList.toggle('wobble-mode', curMode === 'wobble');
        if (curMode === 'tilt' || curMode === 'spin' || curMode === 'wobble') updateRangeSliderForMode(curMode);
        updateShadingThumbs();
        updateColorSwatches();
        syncSliderTooltip(speedSlider);
        syncSliderTooltip(tiltRangeSlider);
        syncSliderTooltip(wobbleSpinRangeSlider);
        updateTiltRangeReset();
        wobbleSpinRangeResetBtn.classList.toggle('is-changed', parseFloat(wobbleSpinRangeSlider.value) !== WOBBLE_SPIN_RANGE_DEFAULT);
        speedResetBtn.classList.toggle('is-changed', parseInt(speedSlider.value) !== SPEED_DEFAULT);
        // Init export format panel (if format wasn't restored above, default to gif)
        if (!exportFormatEl?.value || !document.getElementById(`exportOpts-${exportFormatEl.value}`)) {
            applyExportFormat('gif');
        }
    } catch (e) { }
}

// ── URL / shareable settings ─────────────────────────────────────────────────────────────
function getURLSettings() {
    const p = new URLSearchParams(location.search);
    if (!p.has('c') && !p.has('sh') && !p.has('rm') && !p.has('re')) return null;
    return {
        color: p.has('c') ? '#' + p.get('c') : null,
        bg: p.has('b') ? '#' + p.get('b') : null,
        shading: p.get('sh') || null,
        rotateMode: p.get('rm') || null,
        speed: p.get('sp') || null,

        tiltRange: p.get('tr') || null,
        wobbleSpinRange: p.get('wsr') || null,
        spinDir: p.has('sd') ? (p.get('sd') === '-1' ? -1 : 1) : null,
        gifLoop: p.has('gl') ? p.get('gl') === '1' : null,
    };
}

function settingsToURL() {
    const p = new URLSearchParams({
        c: colorPick.value.replace('#', ''),
        b: bgPick.value.replace('#', ''),
        sh: shadingEl.value,
        rm: rotateModeEl.value,
        sp: speedSlider.value,

        tr: tiltRangeSlider.value,
        wsr: wobbleSpinRangeSlider.value,
        sd: spinDir,
        gl: document.getElementById('gifLoop')?.checked ? '1' : '0',
    });
    history.replaceState(null, '', '?' + p.toString());
}

async function restoreSession() {
    restoreSettings();
    updateColorSwatches(); // guaranteed init even if restoreSettings throws
    const saved = await loadFileFromIDB();
    if (!saved) {
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
    // Level to 0° elevation, preserve azimuth, fit to full viewport with breathing room
    const az = Math.atan2(camera.position.x, camera.position.z);
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const aspect = camera.aspect > 0 ? camera.aspect : 1;
    const newDist = modelRadius * Math.max(1, 1 / aspect) / tanHalfFov * 1.8;
    camera.up.set(0, 1, 0);
    camera.position.set(newDist * Math.sin(az), 0, newDist * Math.cos(az));
    camera.lookAt(0, 0, 0);
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
    const { quality } = EXPORT.image;
    const isTransparent = document.getElementById('imageBg')?.checked ?? false;

    if (isTransparent) {
        // Render to offscreen target with null background → transparent PNG
        const pw = renderer.domElement.width, ph = renderer.domElement.height;
        const rt = new THREE.WebGLRenderTarget(pw, ph);
        const savedBg = scene.background;
        const savedClearColor = renderer.getClearColor(new THREE.Color());
        const savedClearAlpha = renderer.getClearAlpha();
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
        renderer.setRenderTarget(rt);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        const buf = new Uint8Array(pw * ph * 4);
        renderer.readRenderTargetPixels(rt, 0, 0, pw, ph, buf);
        rt.dispose();
        scene.background = savedBg;
        renderer.setClearColor(savedClearColor, savedClearAlpha);
        // Flip vertically (WebGL origin is bottom-left)
        const flipped = new Uint8ClampedArray(pw * ph * 4);
        for (let row = 0; row < ph; row++) {
            const src = (ph - 1 - row) * pw * 4;
            flipped.set(buf.subarray(src, src + pw * 4), row * pw * 4);
        }
        const oc = new OffscreenCanvas(pw, ph);
        oc.getContext('2d').putImageData(new ImageData(flipped, pw, ph), 0, 0);
        const blob = await oc.convertToBlob({ type: 'image/png' });
        download(blob, 'Rotater_' + currentFileName + '.png', 'image/png');
    } else {
        renderer.render(scene, camera);
        canvas.toBlob(blob => download(blob, 'Rotater_' + currentFileName + '.png', 'image/png'), 'image/png');
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
    renderer.render(scene, camera);
    canvas.toBlob(
        blob => download(blob, 'Rotater_' + currentFileName + '.jpg', 'image/jpeg'),
        'image/jpeg',
        quality
    );
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
    document.getElementById('colorSwatch').style.background = colorPick.value;
    document.getElementById('bgSwatch').style.background = bgPick.value;
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
    if (mesh) mesh.material.color.set(colorPick.value);
    updateShadingThumbs();
    updateColorSwatches();
    saveSettings();
});
bgPick.addEventListener('input', () => {
    if (scene) scene.background.set(bgPick.value);
    updateShadingThumbs();
    updateColorSwatches();
    saveSettings();
});

shadingEl.addEventListener('change', () => {
    if (!mesh) return;
    mesh.material.dispose();
    mesh.material = getMaterial(shadingEl.value, colorPick.value);
    saveSettings();
});

document.querySelectorAll('#gifLoop, #gifDither').forEach(el =>
    el.addEventListener('change', saveSettings)
);

document.getElementById('exportQuality')?.addEventListener('change', () => { updateEstimate(); saveSettings(); });

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
    const mainBtn = document.getElementById('btnExport');
    if (mainBtn) mainBtn.textContent = FORMAT_LABELS[fmt] ?? 'Export';
    updateEstimate();
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

// animBg / imageBg toggles: update estimate display hints
document.getElementById('animBg')?.addEventListener('change', () => { updateEstimate(); saveSettings(); });
document.getElementById('imageBg')?.addEventListener('change', () => { updateEstimate(); saveSettings(); });
document.getElementById('jpegQuality').addEventListener('input', function () {
    document.getElementById('jpegQualityVal').textContent = this.value + '%';
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
    try { localStorage.removeItem(SETTINGS_KEY); localStorage.removeItem('rotater_hasSession'); localStorage.setItem('rotater_hintDismissed', '1'); } catch (e) { }
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

// ── Sidebar collapse toggle ───────────────────────────────────────────────────
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
        // Entering crop mode: back up framing, then immediately sync to live viewport.
        _cropBackupDist = exportCamDist;
        _cropBackupElev = exportCamElev;
        _cropBackupZoom = exportCamZoom;
        _cropLiveSyncArmed = true;
        syncExportCameraFromViewport();
    }
    updateCropHintUI();
    updateFrameOverlayButtonUI();
    updateRulerHUD();
});

function cancelCropMode() {
    if (!exportFrameEnabled) return;
    // Restore saved export framing — viewport camera stays wherever it is.
    if (_cropBackupDist !== null) {
        exportCamDist = _cropBackupDist;
        exportCamElev = _cropBackupElev;
        exportCamZoom = _cropBackupZoom;
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
    exportFrameEnabled = false;
    updateCropHintUI();
    updateFrameOverlayButtonUI();
    _cropLiveSyncArmed = false;
    clearExportFrame();
    updateRulerHUD();
    saveSettings();
}

document.getElementById('btnCancelCrop').addEventListener('click', cancelCropMode);
updateFrameOverlayButtonUI();

// Click on any dim region (outside the crop box) cancels crop mode
['frameDimTop', 'frameDimBottom', 'frameDimLeft', 'frameDimRight'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', cancelCropMode);
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && exportFrameEnabled) cancelCropMode();
    if ((e.key === 'Enter' || e.key === 'Return') && exportFrameEnabled) confirmCropMode();
});

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

// Capture N frames by orbiting the camera, return array of Uint8ClampedArrays
async function captureFrames(n, size = EXPORT.gif.size, transparent = false) {
    const S = size;
    const frames = [];

    // Ensure export framing reflects the latest zoom/orbit right before capture.
    if (exportFrameEnabled) syncExportCameraFromViewport();

    // Render into an offscreen target — never touch the visible canvas or camera aspect
    const rt = new THREE.WebGLRenderTarget(S, S, { samples: renderer.capabilities.isWebGL2 ? 4 : 0 });
    rt.texture.colorSpace = THREE.SRGBColorSpace; // match screen canvas linear→sRGB encoding
    const savedAspect = camera.aspect;
    const savedZoom = camera.zoom;
    camera.aspect = 1;

    // Transparent BG: null scene background so render target fills with alpha=0
    const savedBg = scene.background;
    const savedClearColor = renderer.getClearColor(new THREE.Color());
    const savedClearAlpha = renderer.getClearAlpha();
    if (transparent) {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
    }

    const { target, dist, elev, az } = getOrbitFrameState();
    // Always prefer stored export framing when available (crop mode keeps it live-synced).
    const exportDist = (exportCamDist !== null) ? exportCamDist : dist;
    const exportElev = (exportCamDist !== null) ? exportCamElev : elev;
    const exportZoom = (exportCamDist !== null) ? (exportCamZoom || 1) : (camera.zoom || 1);
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
        renderer.setRenderTarget(rt);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        // Read pixels directly from the render target
        const buf = new Uint8Array(S * S * 4);
        renderer.readRenderTargetPixels(rt, 0, 0, S, S, buf);
        // WebGL origin is bottom-left; flip vertically for canvas convention
        const flipped = new Uint8ClampedArray(S * S * 4);
        for (let row = 0; row < S; row++) {
            const src = (S - 1 - row) * S * 4;
            flipped.set(buf.subarray(src, src + S * 4), row * S * 4);
        }
        frames.push(flipped);

        if (i % 12 === 0) {
            setAnimStatus(`Capturing… ${i + 1} / ${n}`, i + 1, n);
            await new Promise(r => setTimeout(r, 0));
        }
    }

    if (mesh) mesh.rotation.x = savedMeshRx;
    camera.position.copy(savedCamPos);
    camera.lookAt(target);
    // Restore camera aspect — renderer and visible canvas were never touched
    camera.aspect = savedAspect;
    camera.zoom = savedZoom;
    camera.updateProjectionMatrix();
    if (transparent) {
        scene.background = savedBg;
        renderer.setClearColor(savedClearColor, savedClearAlpha);
    }
    rt.dispose();
    controls.update();
    renderer.render(scene, camera); // Refresh visible canvas before encoding begins
    return frames;
}

// ── Floyd-Steinberg dithering ────────────────────────────────────────────────
function applyPaletteDithered(data, palette, width, height) {
    const errors = new Float32Array(data.length);
    const indices = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = Math.max(0, Math.min(255, data[i] + errors[i]));
            const g = Math.max(0, Math.min(255, data[i + 1] + errors[i + 1]));
            const b = Math.max(0, Math.min(255, data[i + 2] + errors[i + 2]));
            const idx = nearestColorIndex(palette, r, g, b);
            indices[y * width + x] = idx;
            const pr = palette[idx * 3], pg = palette[idx * 3 + 1], pb = palette[idx * 3 + 2];
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
        const { fps, size: S, loop, dither } = EXPORT.gif;
        const isTransparent = !(document.getElementById('animBg')?.checked ?? true);
        const frames = await captureFrames(exportFrames(fps), S, isTransparent);
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
                // Full 256-entry palette: entries 0..N-1 are real colors, 255 is transparent
                const fullPal = new Uint8Array(256 * 3);
                fullPal.set(pal);
                // Build index array — transparent (alpha < 128) pixels → index 255
                const indices = new Uint8Array(S * S);
                for (let px = 0; px < S * S; px++) {
                    if (frames[i][px * 4 + 3] < 128) {
                        indices[px] = 255;
                    } else {
                        indices[px] = nearestColorIndex(pal, frames[i][px * 4], frames[i][px * 4 + 1], frames[i][px * 4 + 2]);
                    }
                }
                gif.writeFrame(indices, S, S, { palette: fullPal, delay, transparent: true, transparentIndex: 255, ...(i === 0 && { repeat }) });
            } else {
                palette = quantize(frames[i], 256);
                index = dither
                    ? applyPaletteDithered(frames[i], palette, S, S)
                    : applyPalette(frames[i], palette);
                gif.writeFrame(index, S, S, { palette, delay, ...(i === 0 && { repeat }) });
            }

            if (i % 16 === 0) {
                setAnimStatus(`Encoding… ${i + 1} / ${frames.length}`, i + 1, frames.length);
                await new Promise(r => setTimeout(r, 0));
            }
        }

        gif.finish();
        download(gif.bytes(), 'Rotater_' + currentFileName + '.gif', 'image/gif');
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
        const S = EXPORT.mp4.size;
        const n = exportFrames(fps);
        const totalFrames = n * (loops + 1);

        // Render into an offscreen target — never touch the visible canvas or camera aspect
        const rt = new THREE.WebGLRenderTarget(S, S, { samples: renderer.capabilities.isWebGL2 ? 4 : 0 });
        rt.texture.colorSpace = THREE.SRGBColorSpace; // match screen canvas linear→sRGB encoding
        const savedAspect = camera.aspect;
        const savedZoom = camera.zoom;
        camera.aspect = 1;

        const muxer = new Muxer({
            target: new ArrayBufferTarget(),
            video: { codec: 'avc', width: S, height: S },
            fastStart: 'in-memory',
        });

        let encoderError = null;
        const encoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: e => { encoderError = e; },
        });
        encoder.configure({
            codec: 'avc1.42001f',   // H.264 Baseline
            width: S,
            height: S,
            bitrate: bitrate,
            framerate: fps,
        });

        const { target, dist, elev, az } = getOrbitFrameState();
        const exportDist = (exportCamDist !== null) ? exportCamDist : dist;
        const exportElev = (exportCamDist !== null) ? exportCamElev : elev;
        const exportZoom = (exportCamDist !== null) ? (exportCamZoom || 1) : (camera.zoom || 1);
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
            renderer.setRenderTarget(rt);
            renderer.render(scene, camera);
            renderer.setRenderTarget(null);

            // Read pixels from render target (WebGL origin bottom-left, VideoFrame expects top-left)
            const buf = new Uint8Array(S * S * 4);
            renderer.readRenderTargetPixels(rt, 0, 0, S, S, buf);
            const flipped = new Uint8ClampedArray(S * S * 4);
            for (let row = 0; row < S; row++) {
                const src = (S - 1 - row) * S * 4;
                flipped.set(buf.subarray(src, src + S * 4), row * S * 4);
            }
            const off = Object.assign(document.createElement('canvas'), { width: S, height: S });
            off.getContext('2d').putImageData(new ImageData(flipped, S, S), 0, 0);

            const timestamp = Math.round(f * (1_000_000 / fps));
            const frame = new VideoFrame(off, { timestamp });
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
        // Restore camera aspect — renderer and visible canvas were never touched
        camera.aspect = savedAspect;
        camera.zoom = savedZoom;
        camera.updateProjectionMatrix();
        rt.dispose();
        controls.update();
        renderer.render(scene, camera); // Refresh visible canvas before download

        download(muxer.target.buffer, 'Rotater_' + currentFileName + '.mp4', 'video/mp4');
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
restoreSession().finally(() => {
    // Remove anti-FOUC guard once session restore attempt is complete,
    // whether it succeeded (html.loaded is set) or not.
    document.documentElement.classList.remove('has-session');
});
