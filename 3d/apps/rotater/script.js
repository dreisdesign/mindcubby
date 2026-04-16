import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

// ── Defaults ─────────────────────────────────────────────────────────────────
const EXPORT = { size: 720, fps: 24 };
const BASE_ROTATE_SPEED = 2.5; // OrbitControls units: 2.0 = 1 rev/60s at 60fps
const SPEED_DEFAULT = 1.0;
const ELEV_DEFAULT = 30; // Used by placeCamera() for initial camera height

// Returns frame count that gives 1 revolution matching the live rotation speed
function exportFrames() {
    const speed = controls ? controls.autoRotateSpeed : BASE_ROTATE_SPEED;
    const secsPerRev = 60 / speed;
    return Math.round(EXPORT.fps * secsPerRev);
}

function updateEstimate() {
    if (!btnGif) return;
    const n = exportFrames();
    const secs = n / EXPORT.fps;
    const gifMB = (n * 8.7 / 1024).toFixed(1);
    const mp4MB = (secs * 0.15).toFixed(1);
    btnGif.title = `~${gifMB} MB · ${n} frames`;
    btnVideo.title = `~${mp4MB} MB · ${secs.toFixed(1)}s`;
    const pngMB = (EXPORT.size * EXPORT.size * 4 * 0.25 / (1024 * 1024)).toFixed(1);
    if (btnPng) btnPng.title = `~${pngMB} MB · ${EXPORT.size}×${EXPORT.size}px`;
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
const statusEl = document.getElementById('exportStatus');
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


// ── Slider tooltip sync ───────────────────────────────────────────────────────
function syncSliderTooltip(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const pct = (parseFloat(slider.value) - min) / (max - min);
    const wrap = slider.parentElement;
    if (wrap && wrap.classList.contains('range-wrap')) wrap.style.setProperty('--pct', pct);
}

// ── State ─────────────────────────────────────────────────────────────────────
let renderer, scene, camera, controls, mesh;
let isExporting = false;
let isPaused = false;
let modelRadius = 1;
let currentFileName = 'model';
let tiltPhase = 0;
let swingBaseAz = 0, swingLastAz = 0;
let tiltBaseMeshRx = -Math.PI / 2;

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

    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
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
    scene.add(mesh);

    // Sync background color (matters when restoring settings before initThree)
    if (scene) scene.background.set(bgPick.value);

    const sz = new THREE.Vector3();
    geo.boundingBox.getSize(sz);
    modelRadius = Math.max(sz.x, sz.y, sz.z) / 2;

    placeCamera();
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
        document.querySelector('.orbit-hint-bar').classList.add('visible');
    }
    updateEstimate();
    requestAnimationFrame(syncCanvasSize);
}

function placeCamera() {
    const MAX_EL = Math.PI / 2 - 0.02;
    const el = Math.min(THREE.MathUtils.degToRad(ELEV_DEFAULT), MAX_EL);
    const dist = modelRadius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.1;
    camera.up.set(0, 1, 0);
    camera.position.set(0, dist * Math.sin(el), dist * Math.cos(el));
    camera.lookAt(0, 0, 0);
    controls.update();
}

// ── Render loop ───────────────────────────────────────────────────────────────
function loop() {
    requestAnimationFrame(loop);
    if (!isExporting) {
        if (!isPaused && rotateModeEl.value === 'tilt' && mesh) {
            // Tilt: pitch the mesh around its X axis — camera orbits freely
            controls.autoRotate = false;
            controls.update();
            tiltPhase += (2 * Math.PI / 3600) * BASE_ROTATE_SPEED * parseFloat(speedSlider.value);
            const swing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value));
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
            tiltPhase += (2 * Math.PI / 3600) * BASE_ROTATE_SPEED * parseFloat(speedSlider.value);
            const tiltSwing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value));
            mesh.rotation.x = tiltBaseMeshRx + Math.sin(tiltPhase) * tiltSwing;
            if (wobbleSpinRange < 360) {
                const MAX_EL = Math.PI / 2 - 0.05;
                const spinRange = THREE.MathUtils.degToRad(wobbleSpinRange);
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
            tiltPhase += (2 * Math.PI / 3600) * BASE_ROTATE_SPEED * parseFloat(speedSlider.value);
            const MAX_EL = Math.PI / 2 - 0.05;
            const swingRange = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value));
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
            gifLoop: document.getElementById('gifLoop')?.checked ? '1' : '0',
            rotationEnabled: document.getElementById('rotationEnabled')?.checked ? '1' : '0',
        }));
    } catch (e) { }
    settingsToURL();
}

function restoreSettings() {
    try {
        const urlS = getURLSettings();
        const s = urlS ?? JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (s) {
            if (s.color) colorPick.value = s.color;
            if (s.bg) bgPick.value = s.bg;
            if (s.shading) shadingEl.value = s.shading;
            if (s.speed != null) {
                speedSlider.value = s.speed;
                speedVal.textContent = parseFloat(s.speed).toFixed(1) + '×';
            }

            if (s.rotateMode === 'off') { if (s.rotationEnabled == null) s.rotationEnabled = '0'; s.rotateMode = null; }
            if (s.rotateMode) rotateModeEl.value = s.rotateMode;
            const m = rotateModeEl.value;
            if (s.tiltRange) tiltRangeSlider.value = s.tiltRange;
            if (s.wobbleSpinRange) wobbleSpinRangeSlider.value = s.wobbleSpinRange;
            if (m === 'tilt' || m === 'spin' || m === 'wobble') updateRangeSliderForMode(m);
            else tiltRangeVal.textContent = (s.tiltRange || tiltRangeSlider.value) + '°';
            document.documentElement.classList.toggle('tilt-mode', m === 'tilt' || m === 'spin' || m === 'wobble');
            document.documentElement.classList.toggle('wobble-mode', m === 'wobble');
            const rotEnabledEl = document.getElementById('rotationEnabled');
            if (s.rotationEnabled != null) rotEnabledEl.checked = s.rotationEnabled === '1' || s.rotationEnabled === true || s.rotationEnabled === 1;
            const isOff = !rotEnabledEl.checked;
            document.documentElement.classList.toggle('none-mode', isOff);
            btnGif.disabled = isOff;
            btnVideo.disabled = isOff;
            const gifLoopEl = document.getElementById('gifLoop');
            gifLoopEl.disabled = isOff;
            if (s.gifLoop != null) gifLoopEl.checked = (s.gifLoop === true || s.gifLoop === '1' || s.gifLoop === 1);
        }
        updateShadingThumbs();
        updateColorSwatches();
        syncSliderTooltip(speedSlider);
        syncSliderTooltip(tiltRangeSlider);
        syncSliderTooltip(wobbleSpinRangeSlider);
        speedResetBtn.classList.toggle('is-changed', parseFloat(speedSlider.value) !== SPEED_DEFAULT);
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
        gifLoop: p.has('gl') ? p.get('gl') === '1' : null,
        rotationEnabled: p.has('re') ? p.get('re') : null,
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
        gl: document.getElementById('gifLoop')?.checked ? '1' : '0',
        re: document.getElementById('rotationEnabled')?.checked ? '1' : '0',
    });
    history.replaceState(null, '', '?' + p.toString());
}

async function restoreSession() {
    restoreSettings();
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
            controls.autoRotateSpeed = BASE_ROTATE_SPEED * parseFloat(speedSlider.value);
            loadSTLBuffer(buffer, '3dbenchy.stl');
            saveSettings();
        } catch (e) { /* no demo available — stay on landing page */ }
        return;
    }
    fileNameEl.textContent = saved.name;
    fileNameEl.title = saved.name;
    currentFileName = saved.name.replace(/\.stl$/i, '');
    if (!renderer) initThree();
    controls.autoRotateSpeed = BASE_ROTATE_SPEED * parseFloat(speedSlider.value);
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

btnPause.addEventListener('click', togglePause);

// Re-clicking the already-active mode thumb toggles pause
document.querySelectorAll('input[name="rotateMode"]').forEach(input => {
    let wasChecked = false;
    input.addEventListener('mousedown', () => { wasChecked = input.checked; });
    input.addEventListener('click', () => { if (wasChecked) togglePause(); });
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
    if (e.code === 'ArrowUp') { e.preventDefault(); snapOrbit(0, 1); }
    if (e.code === 'ArrowDown') { e.preventDefault(); snapOrbit(0, -1); }
});

function snapCamera(azimuth, elevation) {
    if (!camera) return;
    const dist = camera.position.length();
    const el = THREE.MathUtils.clamp(elevation, -(Math.PI / 2 - 0.01), Math.PI / 2 - 0.01);
    camera.position.set(
        dist * Math.cos(el) * Math.sin(azimuth),
        dist * Math.sin(el),
        dist * Math.cos(el) * Math.cos(azimuth),
    );
    // Avoid gimbal lock on near-vertical views
    camera.up.set(0, Math.abs(elevation) > Math.PI / 4 ? 0 : 1, Math.abs(elevation) > Math.PI / 4 ? (elevation > 0 ? -1 : 1) : 0);
    camera.lookAt(0, 0, 0);
    controls.update();
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
document.getElementById('btnCamUp').addEventListener('click', () => snapOrbit(0, 1));
document.getElementById('btnCamDown').addEventListener('click', () => snapOrbit(0, -1));
document.getElementById('btnCamReset').addEventListener('click', () => {
    if (!camera) return;
    camera.up.set(0, 1, 0);
    placeCamera();
    tiltBaseMeshRx = -Math.PI / 2;
    tiltPhase = 0;
    if (mesh) mesh.rotation.x = tiltBaseMeshRx;
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

document.getElementById('btnExportPng').addEventListener('click', () => {
    if (!mesh) return;
    // Pause if not already paused
    if (!isPaused) {
        isPaused = true;
        controls.autoRotate = false;
        iconPause.style.display = 'none';
        iconPlay.style.display = '';
        btnPause.setAttribute('aria-label', 'Resume rotation');
        btnPause.title = 'Resume rotation';
    }
    // Render one fresh frame then export
    renderer.render(scene, camera);
    canvas.toBlob(blob => download(blob, currentFileName + '.png', 'image/png'), 'image/png');
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
        if (parseFloat(tiltRangeSlider.value) > 360 || parseFloat(tiltRangeSlider.value) < 45) tiltRangeSlider.value = '360';
        document.getElementById('tiltRangeTicks').innerHTML = '<span>45°</span><span>360°</span>';
    } else {  // tilt or wobble: tilt-amplitude range
        tiltRangeSlider.min = '10';
        tiltRangeSlider.max = '50';
        tiltRangeSlider.step = '10';
        if (parseFloat(tiltRangeSlider.value) > 50) tiltRangeSlider.value = '30';
        if (parseFloat(tiltRangeSlider.value) < 10) tiltRangeSlider.value = '10';
        document.getElementById('tiltRangeTicks').innerHTML = '<span>10°</span><span>50°</span>';
    }
    tiltRangeVal.textContent = tiltRangeSlider.value + '°';
    syncSliderTooltip(tiltRangeSlider);
    if (mode === 'wobble') {
        const wsv = parseFloat(wobbleSpinRangeSlider.value);
        if (isNaN(wsv) || wsv < 45 || wsv > 360) wobbleSpinRangeSlider.value = '360';
        document.getElementById('wobbleSpinRangeTicks').innerHTML = '<span>45°</span><span>360°</span>';
        wobbleSpinRangeVal.textContent = wobbleSpinRangeSlider.value + '°';
        syncSliderTooltip(wobbleSpinRangeSlider);
    }
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

document.getElementById('gifLoop').addEventListener('change', () => {
    saveSettings();
});

document.getElementById('rotationEnabled').addEventListener('change', function () {
    const isOff = !this.checked;
    document.documentElement.classList.toggle('none-mode', isOff);
    const m = rotateModeEl.value;
    if (isOff) {
        isPaused = true;
        if (controls) controls.autoRotate = false;
        iconPause.style.display = 'none';
        iconPlay.style.display = '';
        btnPause.setAttribute('aria-label', 'Resume rotation');
        btnPause.title = 'Resume rotation';
        document.documentElement.classList.add('rotation-paused');
        document.documentElement.classList.remove('tilt-mode');
    } else {
        isPaused = false;
        if (controls) controls.autoRotate = m === 'spin' || (m === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360);
        iconPause.style.display = '';
        iconPlay.style.display = 'none';
        btnPause.setAttribute('aria-label', 'Pause rotation');
        btnPause.title = 'Pause rotation';
        document.documentElement.classList.remove('rotation-paused');
        document.documentElement.classList.toggle('tilt-mode', m === 'tilt' || m === 'spin' || m === 'wobble');
    }
    btnGif.disabled = isOff;
    btnVideo.disabled = isOff;
    document.getElementById('gifLoop').disabled = isOff;
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
    saveSettings();
});

wobbleSpinRangeSlider.addEventListener('input', () => {
    wobbleSpinRangeVal.textContent = wobbleSpinRangeSlider.value + '°';
    syncSliderTooltip(wobbleSpinRangeSlider);
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

document.getElementById('btnResetSettings').addEventListener('click', () => {
    try { localStorage.removeItem(SETTINGS_KEY); localStorage.removeItem('rotater_hasSession'); localStorage.setItem('rotater_hintDismissed', '1'); } catch (e) { }
    history.replaceState(null, '', location.pathname);
    location.reload();
});

document.querySelector('.orbit-hint-dismiss')?.addEventListener('click', () => {
    document.querySelector('.orbit-hint-bar').classList.remove('visible');
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
        controls.autoRotateSpeed = BASE_ROTATE_SPEED * parseFloat(speedSlider.value);
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
    const v = parseFloat(speedSlider.value);
    speedVal.textContent = v.toFixed(1) + '×';
    syncSliderTooltip(speedSlider);
    if (controls) controls.autoRotateSpeed = BASE_ROTATE_SPEED * v;
    speedResetBtn.classList.toggle('is-changed', v !== SPEED_DEFAULT);
    updateEstimate();
    saveSettings();
});

speedResetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    speedSlider.value = SPEED_DEFAULT;
    speedSlider.dispatchEvent(new Event('input'));
});

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

// ── Export helpers ────────────────────────────────────────────────────────────
const setStatus = msg => { statusEl.textContent = msg; };
const setExporting = v => {
    isExporting = v;
    const isOff = !(document.getElementById('rotationEnabled')?.checked ?? true);
    btnGif.disabled = v || isOff;
    btnVideo.disabled = v || isOff;
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
async function captureFrames(n) {
    const S = EXPORT.size;
    const off = Object.assign(document.createElement('canvas'), { width: S, height: S });
    const ctx = off.getContext('2d', { willReadFrequently: true });
    const frames = [];

    // Resize renderer to square export resolution so camera FOV matches 1:1
    const prevW = renderer.domElement.width;
    const prevH = renderer.domElement.height;
    const prevAspect = camera.aspect;
    renderer.setSize(S, S, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();

    const dist = camera.position.length();
    const elev = Math.asin(Math.max(-1, Math.min(1, camera.position.y / dist)));
    const az = Math.atan2(camera.position.x, camera.position.z);
    const savedCamPos = camera.position.clone();
    const isTilt = rotateModeEl.value === 'tilt';
    const isWobble = rotateModeEl.value === 'wobble';
    const isSpinLimited = rotateModeEl.value === 'spin' && parseFloat(tiltRangeSlider.value) < 360;
    const isWobbleArc = isWobble && parseFloat(wobbleSpinRangeSlider.value) < 360;
    const baseEl = elev;
    const tiltSwing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value));
    const wobbleSpinSwing = THREE.MathUtils.degToRad(parseFloat(wobbleSpinRangeSlider.value));
    const MAX_EL = Math.PI / 2 - 0.05;
    const savedMeshRx = mesh ? mesh.rotation.x : 0;

    for (let i = 0; i < n; i++) {
        if (isTilt) {
            mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * i / n) * tiltSwing;
            camera.position.copy(savedCamPos);
        } else if (isWobbleArc) {
            // Wobble arc: mesh tilts AND camera arcs (< 360° spin range)
            mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * i / n) * tiltSwing;
            const el = Math.min(baseEl, MAX_EL);
            const azimuth = az + Math.sin(2 * Math.PI * i / n) * wobbleSpinSwing;
            camera.position.set(
                dist * Math.cos(el) * Math.sin(azimuth),
                dist * Math.sin(el),
                dist * Math.cos(el) * Math.cos(azimuth),
            );
        } else if (isWobble) {
            // Wobble full spin: mesh tilts AND camera spins 360°
            mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * i / n) * tiltSwing;
            const azimuth = -(2 * Math.PI * i) / n;
            camera.position.set(
                dist * Math.cos(elev) * Math.sin(azimuth),
                dist * Math.sin(elev),
                dist * Math.cos(elev) * Math.cos(azimuth),
            );
        } else if (isSpinLimited) {
            const el = Math.min(baseEl, MAX_EL);
            const azimuth = az + Math.sin(2 * Math.PI * i / n) * tiltSwing;
            camera.position.set(
                dist * Math.cos(el) * Math.sin(azimuth),
                dist * Math.sin(el),
                dist * Math.cos(el) * Math.cos(azimuth),
            );
        } else {
            const azimuth = -(2 * Math.PI * i) / n;
            camera.position.set(
                dist * Math.cos(elev) * Math.sin(azimuth),
                dist * Math.sin(elev),
                dist * Math.cos(elev) * Math.cos(azimuth),
            );
        }
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        ctx.drawImage(renderer.domElement, 0, 0, S, S);
        frames.push(new Uint8ClampedArray(ctx.getImageData(0, 0, S, S).data));

        if (i % 12 === 0) {
            setStatus(`Capturing… ${i + 1} / ${n}`);
            await new Promise(r => setTimeout(r, 0));
        }
    }

    if (mesh) mesh.rotation.x = savedMeshRx;
    camera.position.copy(savedCamPos);
    camera.lookAt(0, 0, 0);
    // Restore renderer and camera to preview dimensions
    renderer.setSize(prevW, prevH, false);
    camera.aspect = prevAspect;
    camera.updateProjectionMatrix();
    controls.update();
    return frames;
}

// ── GIF export ────────────────────────────────────────────────────────────────
btnGif.addEventListener('click', async () => {
    if (!mesh) return;
    setExporting(true);
    controls.autoRotate = false;

    try {
        const frames = await captureFrames(exportFrames());
        const delay = Math.round(1000 / EXPORT.fps);
        const S = EXPORT.size;

        setStatus('Encoding GIF…');
        await new Promise(r => setTimeout(r, 0));

        const repeat = document.getElementById('gifLoop').checked ? 0 : -1;
        const gif = GIFEncoder();
        for (let i = 0; i < frames.length; i++) {
            const palette = quantize(frames[i], 256);
            const index = applyPalette(frames[i], palette);
            // repeat is a Netscape header written once before the first frame
            gif.writeFrame(index, S, S, { palette, delay, ...(i === 0 && { repeat }) });

            if (i % 16 === 0) {
                setStatus(`Encoding… ${i + 1} / ${frames.length}`);
                await new Promise(r => setTimeout(r, 0));
            }
        }

        gif.finish();
        download(gif.bytes(), currentFileName + '.gif', 'image/gif');
        setStatus('GIF saved ✓');
    } catch (err) {
        setStatus('Error: ' + err.message);
        console.error(err);
    } finally {
        setExporting(false);
        controls.autoRotate = !isPaused && (rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360));
        setTimeout(() => setStatus(''), 5000);
    }
});

// ── Video export (H.264 MP4 via WebCodecs + mp4-muxer) ───────────────────────
btnVideo.addEventListener('click', async () => {
    if (!mesh) return;
    if (typeof VideoEncoder === 'undefined') {
        setStatus('Error: WebCodecs not supported in this browser (use Chrome/Edge/Safari 16.4+).');
        return;
    }
    setExporting(true);
    controls.autoRotate = false;

    try {
        const { fps } = EXPORT;
        const n = exportFrames();
        const S = EXPORT.size;

        // Off-screen canvas at export resolution
        const off = Object.assign(document.createElement('canvas'), { width: S, height: S });
        const ctx = off.getContext('2d');

        // Resize renderer to square export resolution so camera FOV matches 1:1
        const prevW = renderer.domElement.width;
        const prevH = renderer.domElement.height;
        const prevAspect = camera.aspect;
        renderer.setSize(S, S, false);
        camera.aspect = 1;
        camera.updateProjectionMatrix();

        const muxer = new Muxer({
            target: new ArrayBufferTarget(),
            video: { codec: 'avc', width: S, height: S },
            fastStart: 'in-memory',
        });

        const encoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: e => { throw e; },
        });
        encoder.configure({
            codec: 'avc1.42001f',   // H.264 Baseline
            width: S,
            height: S,
            bitrate: 8_000_000,
            framerate: fps,
        });

        const dist = camera.position.length();
        const elev = Math.asin(Math.max(-1, Math.min(1, camera.position.y / dist)));
        const az = Math.atan2(camera.position.x, camera.position.z);
        const savedCamPos = camera.position.clone();
        const isTilt = rotateModeEl.value === 'tilt';
        const isWobble = rotateModeEl.value === 'wobble';
        const isSpinLimited = rotateModeEl.value === 'spin' && parseFloat(tiltRangeSlider.value) < 360;
        const isWobbleArc = isWobble && parseFloat(wobbleSpinRangeSlider.value) < 360;
        const baseEl = elev;
        const tiltSwing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value));
        const wobbleSpinSwing = THREE.MathUtils.degToRad(parseFloat(wobbleSpinRangeSlider.value));
        const MAX_EL = Math.PI / 2 - 0.05;
        const savedMeshRx = mesh ? mesh.rotation.x : 0;

        for (let f = 0; f < n; f++) {
            if (isTilt) {
                mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * f / n) * tiltSwing;
                camera.position.copy(savedCamPos);
            } else if (isWobbleArc) {
                // Wobble arc: mesh tilts AND camera arcs
                mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * f / n) * tiltSwing;
                const el = Math.min(baseEl, MAX_EL);
                const azimuth = az + Math.sin(2 * Math.PI * f / n) * wobbleSpinSwing;
                camera.position.set(
                    dist * Math.cos(el) * Math.sin(azimuth),
                    dist * Math.sin(el),
                    dist * Math.cos(el) * Math.cos(azimuth),
                );
            } else if (isWobble) {
                // Wobble full spin: mesh tilts AND camera spins 360°
                mesh.rotation.x = tiltBaseMeshRx + Math.sin(2 * Math.PI * f / n) * tiltSwing;
                const azimuth = -(2 * Math.PI * f) / n;
                camera.position.set(
                    dist * Math.cos(elev) * Math.sin(azimuth),
                    dist * Math.sin(elev),
                    dist * Math.cos(elev) * Math.cos(azimuth),
                );
            } else if (isSpinLimited) {
                const el = Math.min(baseEl, MAX_EL);
                const azimuth = az + Math.sin(2 * Math.PI * f / n) * tiltSwing;
                camera.position.set(
                    dist * Math.cos(el) * Math.sin(azimuth),
                    dist * Math.sin(el),
                    dist * Math.cos(el) * Math.cos(azimuth),
                );
            } else {
                const azimuth = -(2 * Math.PI * f) / n;
                camera.position.set(
                    dist * Math.cos(elev) * Math.sin(azimuth),
                    dist * Math.sin(elev),
                    dist * Math.cos(elev) * Math.cos(azimuth),
                );
            }
            camera.lookAt(0, 0, 0);
            renderer.render(scene, camera);
            ctx.drawImage(renderer.domElement, 0, 0, S, S);

            const timestamp = Math.round(f * (1_000_000 / fps));
            const frame = new VideoFrame(off, { timestamp });
            encoder.encode(frame, { keyFrame: f % 30 === 0 });
            frame.close();

            if (f % 12 === 0) {
                setStatus(`Encoding… ${f + 1} / ${n}`);
                await new Promise(r => setTimeout(r, 0));
            }
        }

        await encoder.flush();
        muxer.finalize();

        if (mesh) mesh.rotation.x = savedMeshRx;
        camera.position.copy(savedCamPos);
        camera.lookAt(0, 0, 0);
        // Restore renderer and camera to preview dimensions
        renderer.setSize(prevW, prevH, false);
        camera.aspect = prevAspect;
        camera.updateProjectionMatrix();
        controls.update();

        download(muxer.target.buffer, currentFileName + '.mp4', 'video/mp4');
        setStatus('MP4 saved ✓');
    } catch (err) {
        setStatus('Error: ' + err.message);
        console.error(err);
        // Ensure renderer is restored if export failed mid-way
        if (typeof prevW !== 'undefined') {
            renderer.setSize(prevW, prevH, false);
            camera.aspect = prevAspect;
            camera.updateProjectionMatrix();
        }
    } finally {
        setExporting(false);
        controls.autoRotate = !isPaused && (rotateModeEl.value === 'spin' || (rotateModeEl.value === 'wobble' && parseFloat(wobbleSpinRangeSlider.value) >= 360));
        setTimeout(() => setStatus(''), 5000);
    }
});

// ── Restore on load ───────────────────────────────────────────────────────────
restoreSession().finally(() => {
    // Remove anti-FOUC guard once session restore attempt is complete,
    // whether it succeeded (html.loaded is set) or not.
    document.documentElement.classList.remove('has-session');
});
