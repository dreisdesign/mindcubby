import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

// ── Defaults ─────────────────────────────────────────────────────────────────
const EXPORT = { size: 720, fps: 24 };
const BASE_ROTATE_SPEED = 2.5; // OrbitControls units: 2.0 = 1 rev/60s at 60fps

// Returns frame count that gives 1 revolution matching the live rotation speed
function exportFrames() {
    const speed = controls ? controls.autoRotateSpeed : BASE_ROTATE_SPEED;
    const secsPerRev = 60 / speed;
    return Math.round(EXPORT.fps * secsPerRev);
}

function updateEstimate() {
    if (!estimateGif) return;
    const n = exportFrames();
    const secs = n / EXPORT.fps;
    const gifMB = (n * 8.7 / 1024).toFixed(1);
    const mp4MB = (secs * 0.15).toFixed(1);
    estimateGif.textContent = `~${gifMB} MB · ${n} frames`;
    estimateMp4.textContent = `~${mp4MB} MB · ${secs.toFixed(1)}s`;
    const pngMB = (EXPORT.size * EXPORT.size * 4 * 0.25 / (1024 * 1024)).toFixed(1);
    if (estimatePng) estimatePng.textContent = `~${pngMB} MB · ${EXPORT.size}×${EXPORT.size}px`;
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
const elevSlider = document.getElementById('elevationSlider');
const elevVal = document.getElementById('elevVal');
const btnGif = document.getElementById('btnExportGif');
const btnVideo = document.getElementById('btnExportVideo');
const statusEl = document.getElementById('exportStatus');
const estimateGif = document.getElementById('estimateGif');
const estimateMp4 = document.getElementById('estimateMp4');
const estimatePng = document.getElementById('estimatePng');
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

// ── State ─────────────────────────────────────────────────────────────────────
let renderer, scene, camera, controls, mesh;
let isExporting = false;
let isPaused = false;
let modelRadius = 1;
let currentFileName = 'model';
let tiltPhase = 0;
let swingBaseAz = 0, swingLastAz = 0;
let tiltBaseEl = 0, tiltLastEl = 0;

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
    controls.autoRotate = rotateModeEl.value === 'spin';
    document.documentElement.classList.remove('rotation-paused');
    iconPause.style.display = '';
    iconPlay.style.display = 'none';
    viewerSec.classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('controlsBar').classList.remove('hidden');
    document.querySelector('.orbit-hint-bar').classList.add('visible');
    updateEstimate();
    requestAnimationFrame(syncCanvasSize);
}

function placeCamera() {
    const MAX_EL = Math.PI / 2 - 0.02;
    const el = Math.min(THREE.MathUtils.degToRad(parseFloat(elevSlider.value)), MAX_EL);
    const dist = modelRadius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.5;
    camera.position.set(0, dist * Math.sin(el), dist * Math.cos(el));
    camera.lookAt(0, 0, 0);
    controls.update();
}

// ── Render loop ───────────────────────────────────────────────────────────────
function loop() {
    requestAnimationFrame(loop);
    if (!isExporting) {
        if (!isPaused && rotateModeEl.value === 'tilt' && mesh) {
            // Tilt: elevation sine wave around a user-orbitable base; azimuth freely follows user
            controls.autoRotate = false;
            controls.update(); // apply user input first
            // Accumulate user-driven elevation delta on top of the base
            const dist = camera.position.length();
            const actualEl = Math.asin(Math.max(-1, Math.min(1, camera.position.y / dist)));
            let elDelta = actualEl - tiltLastEl;
            tiltBaseEl += elDelta;
            tiltPhase += (2 * Math.PI / 3600) * BASE_ROTATE_SPEED * parseFloat(speedSlider.value);
            const MAX_EL = Math.PI / 2 - 0.05;
            const swing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value));
            const el = THREE.MathUtils.clamp(tiltBaseEl + Math.sin(tiltPhase) * swing, -MAX_EL, MAX_EL);
            const az = Math.atan2(camera.position.x, camera.position.z);
            camera.position.set(
                dist * Math.cos(el) * Math.sin(az),
                dist * Math.sin(el),
                dist * Math.cos(el) * Math.cos(az),
            );
            camera.lookAt(0, 0, 0);
            tiltLastEl = el;
        } else if (!isPaused && rotateModeEl.value === 'swing' && mesh) {
            // Swing: azimuth oscillates ±swingRange around a user-orbitable base
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
            controls.autoRotate = !isPaused && (rotateModeEl.value === 'spin');
            controls.update();
            // Keep mode bases in sync while paused / in other modes so resume is seamless
            if (camera) {
                if (rotateModeEl.value === 'swing') {
                    swingBaseAz = Math.atan2(camera.position.x, camera.position.z);
                    swingLastAz = swingBaseAz;
                }
                if (rotateModeEl.value === 'tilt') {
                    const d = camera.position.length();
                    tiltBaseEl = Math.asin(Math.max(-1, Math.min(1, camera.position.y / d)));
                    tiltLastEl = tiltBaseEl;
                }
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
            elevation: elevSlider.value,
            rotateMode: rotateModeEl.value,
            tiltRange: tiltRangeSlider.value,
            gifLoop: document.getElementById('gifLoop')?.checked ? '1' : '0',
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
            if (s.elevation != null) {
                elevSlider.value = s.elevation;
                elevVal.textContent = elevSlider.value + '°';
            }
            if (s.rotateMode) rotateModeEl.value = s.rotateMode;
            const m = rotateModeEl.value;
            if (s.tiltRange) tiltRangeSlider.value = s.tiltRange;
            if (m === 'swing' || m === 'tilt') updateRangeSliderForMode(m);
            else tiltRangeVal.textContent = (s.tiltRange || tiltRangeSlider.value) + '°';
            document.documentElement.classList.toggle('tilt-mode', m === 'tilt' || m === 'swing');
            const isOff = m === 'off';
            document.documentElement.classList.toggle('none-mode', isOff);
            btnGif.disabled = isOff;
            btnVideo.disabled = isOff;
            const gifLoopEl = document.getElementById('gifLoop');
            gifLoopEl.disabled = isOff;
            if (s.gifLoop != null) gifLoopEl.checked = s.gifLoop === true || s.gifLoop === '1' || s.gifLoop === 1;
        }
        updateShadingThumbs();
        updateColorSwatches();
    } catch (e) { }
}

// ── URL / shareable settings ─────────────────────────────────────────────────────────────
function getURLSettings() {
    const p = new URLSearchParams(location.search);
    if (!p.has('c') && !p.has('sh') && !p.has('rm')) return null;
    return {
        color: p.has('c') ? '#' + p.get('c') : null,
        bg: p.has('b') ? '#' + p.get('b') : null,
        shading: p.get('sh') || null,
        rotateMode: p.get('rm') || null,
        speed: p.get('sp') || null,
        elevation: p.get('el') || null,
        tiltRange: p.get('tr') || null,
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
        el: elevSlider.value,
        tr: tiltRangeSlider.value,
        gl: document.getElementById('gifLoop')?.checked ? '1' : '0',
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
            currentFileName = '3dbenchy';
            if (!renderer) initThree();
            controls.autoRotateSpeed = BASE_ROTATE_SPEED * parseFloat(speedSlider.value);
            loadSTLBuffer(buffer, '3dbenchy.stl');
            saveSettings();
        } catch (e) { /* no demo available — stay on landing page */ }
        return;
    }
    fileNameEl.textContent = saved.name + ' ↩';
    currentFileName = saved.name.replace(/\.stl$/i, '');
    if (!renderer) initThree();
    controls.autoRotateSpeed = BASE_ROTATE_SPEED * parseFloat(speedSlider.value);
    loadSTLBuffer(saved.buffer, saved.name);
}

// ── UI events ─────────────────────────────────────────────────────────────────
function handleFile(file) {
    if (!file?.name.toLowerCase().endsWith('.stl')) return;
    fileNameEl.textContent = file.name;
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
    controls.autoRotate = !isPaused && rotateModeEl.value === 'spin';
    document.documentElement.classList.toggle('rotation-paused', isPaused);
    iconPause.style.display = isPaused ? 'none' : '';
    iconPlay.style.display = isPaused ? '' : 'none';
    btnPause.setAttribute('aria-label', isPaused ? 'Resume rotation' : 'Pause rotation');
    btnPause.title = isPaused ? 'Resume rotation' : 'Pause rotation';
}

btnPause.addEventListener('click', togglePause);
document.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        togglePause();
    }
});

function snapFace(rx, ry, rz) {
    if (!mesh) return;
    mesh.rotation.set(rx, ry, rz);
    camera.up.set(0, 1, 0);
    placeCamera();
    renderer.render(scene, camera);
}

document.getElementById('btnViewFront').addEventListener('click', () => snapFace(-Math.PI / 2, 0, -Math.PI / 2));
document.getElementById('btnViewBack').addEventListener('click', () => snapFace(-Math.PI / 2, 0, Math.PI / 2));
document.getElementById('btnViewLeft').addEventListener('click', () => snapFace(Math.PI / 2, Math.PI, 0));
document.getElementById('btnFrontView').addEventListener('click', () => snapFace(-Math.PI / 2, 0, 0));
document.getElementById('btnViewTop').addEventListener('click', () => snapFace(0, 0, 0));
document.getElementById('btnViewBottom').addEventListener('click', () => snapFace(-Math.PI, 0, 0));

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
    const c = new THREE.Color(colorPick.value);
    const bg = new THREE.Color(bgPick.value);
    // Phong/metallic shadows are darkened model color — bg-independent so
    // the gradient always reads correctly regardless of canvas background.
    const shadow = c.clone().multiplyScalar(0.5);   // phong/metallic midtone
    const deep = c.clone().multiplyScalar(0.28);  // metallic deep shadow
    // WCAG contrast: white text when bg luminance is below the 0.179 crossover
    // (the point where white and black have equal contrast ratios).
    // Use opaque values only — semi-transparent text fails on mid-range bgs.
    const lum = 0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b;
    const nameColor = lum < 0.179 ? '#ffffff' : '#2a2a30';
    const root = document.documentElement;
    root.style.setProperty('--sh-base', colorPick.value);
    root.style.setProperty('--sh-shadow', `#${shadow.getHexString()}`);
    root.style.setProperty('--sh-deep', `#${deep.getHexString()}`);
    root.style.setProperty('--sh-bg', bgPick.value);
    root.style.setProperty('--sh-name-color', nameColor);
}

function updateColorSwatches() {
    document.getElementById('colorSwatch').style.background = colorPick.value;
    document.getElementById('bgSwatch').style.background = bgPick.value;
}

function updateRangeSliderForMode(mode) {
    if (mode === 'swing') {
        tiltRangeSlider.min = '0';
        tiltRangeSlider.max = '180';
        tiltRangeSlider.step = '15';
        if (parseFloat(tiltRangeSlider.value) > 180) tiltRangeSlider.value = '90';
        if (parseFloat(tiltRangeSlider.value) < 0) tiltRangeSlider.value = '90';
        document.getElementById('tiltRangeTicks').innerHTML =
            '<span>0°</span><span>30°</span><span>60°</span><span>90°</span><span>120°</span><span>150°</span><span>180°</span>';
    } else {
        tiltRangeSlider.min = '10';
        tiltRangeSlider.max = '50';
        tiltRangeSlider.step = '10';
        if (parseFloat(tiltRangeSlider.value) > 50) tiltRangeSlider.value = '30';
        if (parseFloat(tiltRangeSlider.value) < 10) tiltRangeSlider.value = '10';
        document.getElementById('tiltRangeTicks').innerHTML =
            '<span>10°</span><span>20°</span><span>30°</span><span>40°</span><span>50°</span>';
    }
    tiltRangeVal.textContent = tiltRangeSlider.value + '°';
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

rotateModeEl.addEventListener('change', () => {
    const m = rotateModeEl.value;
    const isOff = m === 'off';
    // switching mode resumes rotation
    if (isPaused && !isOff) {
        isPaused = false;
        iconPause.style.display = '';
        iconPlay.style.display = 'none';
        document.documentElement.classList.remove('rotation-paused');
    }
    tiltPhase = 0;
    if (m === 'swing' && camera) {
        swingBaseAz = Math.atan2(camera.position.x, camera.position.z);
        swingLastAz = swingBaseAz;
    }
    if (m === 'tilt' && camera) {
        const d = camera.position.length();
        tiltBaseEl = Math.asin(Math.max(-1, Math.min(1, camera.position.y / d)));
        tiltLastEl = tiltBaseEl;
    }
    if (controls) controls.autoRotate = !isPaused && m === 'spin';
    document.documentElement.classList.toggle('tilt-mode', m === 'tilt' || m === 'swing');
    document.documentElement.classList.toggle('none-mode', isOff);
    btnGif.disabled = isOff;
    btnVideo.disabled = isOff;
    document.getElementById('gifLoop').disabled = isOff;
    if (m === 'swing' || m === 'tilt') updateRangeSliderForMode(m);
    saveSettings();
});

tiltRangeSlider.addEventListener('input', () => {
    tiltRangeVal.textContent = tiltRangeSlider.value + '°';
    saveSettings();
});

document.getElementById('menuResetSettings').addEventListener('click', () => {
    closeSettings();
    try { localStorage.removeItem(SETTINGS_KEY); localStorage.removeItem('rotater_hasSession'); } catch (e) { }
    history.replaceState(null, '', location.pathname);
    location.reload();
});

document.getElementById('menuBenchy').addEventListener('click', async () => {
    closeSettings();
    if (mesh && !confirm('Replace the current model with 3D Benchy?')) return;
    try {
        const resp = await fetch('./benchy.stl');
        if (!resp.ok) return;
        const buffer = await resp.arrayBuffer();
        await clearIDB();
        fileNameEl.textContent = '3dbenchy.stl';
        currentFileName = '3dbenchy';
        if (!renderer) initThree();
        controls.autoRotateSpeed = BASE_ROTATE_SPEED * parseFloat(speedSlider.value);
        loadSTLBuffer(buffer, '3dbenchy.stl');
    } catch (e) { }
});

// ── Settings overlay ──────────────────────────────────────────────────────────

const btnMenu = document.getElementById('btnMenu');
const settingsOverlay = document.getElementById('settingsOverlay');
const btnCloseSettings = document.getElementById('btnCloseSettings');

function openSettings() {
    settingsOverlay.hidden = false;
    btnMenu.setAttribute('aria-expanded', 'true');
    btnCloseSettings.focus();
}

function closeSettings() {
    settingsOverlay.hidden = true;
    btnMenu.setAttribute('aria-expanded', 'false');
}

btnMenu.addEventListener('click', e => { e.stopPropagation(); openSettings(); });
btnCloseSettings.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', e => { if (e.target === settingsOverlay) closeSettings(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !settingsOverlay.hidden) closeSettings(); });

// ── Theme toggle ──────────────────────────────────────────────────────────────

function applyTheme(theme) {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    try { localStorage.setItem('rotater-theme', theme); } catch (e) { }
    const isDark = theme === 'dark';
    const label = document.getElementById('themeToggleLabel');
    const path = document.getElementById('themeToggleIconPath');
    if (label) label.textContent = isDark ? 'Turn on light mode' : 'Turn on dark mode';
    if (path) path.setAttribute('d', isDark
        // Sun icon for "switch to light"
        ? 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z'
        // Moon icon for "switch to dark"
        : 'M9.5 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5.5 8.65C6.29 21.5 7.82 22 9.5 22 14.75 22 19 17.52 19 12S14.75 2 9.5 2z'
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
    if (controls) controls.autoRotateSpeed = BASE_ROTATE_SPEED * v;
    updateEstimate();
    saveSettings();
});

elevSlider.addEventListener('input', () => {
    elevVal.textContent = elevSlider.value + '°';
    if (mesh && camera) {
        const MAX_EL = Math.PI / 2 - 0.02;
        const el = Math.min(THREE.MathUtils.degToRad(parseFloat(elevSlider.value)), MAX_EL);
        const dist = camera.position.length();
        const az = Math.atan2(camera.position.x, camera.position.z);
        camera.position.set(
            dist * Math.cos(el) * Math.sin(az),
            dist * Math.sin(el),
            dist * Math.cos(el) * Math.cos(az),
        );
        camera.lookAt(0, 0, 0);
        controls.update();
    }
    saveSettings();
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

// ── Export helpers ────────────────────────────────────────────────────────────
const setStatus = msg => { statusEl.textContent = msg; };
const setExporting = v => {
    isExporting = v;
    const isOff = rotateModeEl.value === 'off';
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

    const dist = camera.position.length();
    const elev = Math.asin(Math.max(-1, Math.min(1, camera.position.y / dist)));
    const az = Math.atan2(camera.position.x, camera.position.z);
    const savedCamPos = camera.position.clone();
    const isTilt = rotateModeEl.value === 'tilt';
    const isSwing = rotateModeEl.value === 'swing';
    const baseEl = THREE.MathUtils.degToRad(parseFloat(elevSlider.value));
    const tiltSwing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value));
    const MAX_EL = Math.PI / 2 - 0.05;

    for (let i = 0; i < n; i++) {
        if (isTilt) {
            const el = THREE.MathUtils.clamp(baseEl + Math.sin(2 * Math.PI * i / n) * tiltSwing, -MAX_EL, MAX_EL);
            camera.position.set(
                dist * Math.cos(el) * Math.sin(az),
                dist * Math.sin(el),
                dist * Math.cos(el) * Math.cos(az),
            );
        } else if (isSwing) {
            const swingRange = tiltSwing;
            const el = Math.min(baseEl, MAX_EL);
            const azimuth = Math.sin(2 * Math.PI * i / n) * swingRange;
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

    camera.position.copy(savedCamPos);
    camera.lookAt(0, 0, 0);
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
        controls.autoRotate = !isPaused && rotateModeEl.value === 'spin';
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
        const isSwing = rotateModeEl.value === 'swing';
        const baseEl = THREE.MathUtils.degToRad(parseFloat(elevSlider.value));
        const tiltSwing = THREE.MathUtils.degToRad(parseFloat(tiltRangeSlider.value));
        const MAX_EL = Math.PI / 2 - 0.05;

        for (let f = 0; f < n; f++) {
            if (isTilt) {
                const el = THREE.MathUtils.clamp(baseEl + Math.sin(2 * Math.PI * f / n) * tiltSwing, -MAX_EL, MAX_EL);
                camera.position.set(
                    dist * Math.cos(el) * Math.sin(az),
                    dist * Math.sin(el),
                    dist * Math.cos(el) * Math.cos(az),
                );
            } else if (isSwing) {
                const swingRange = tiltSwing;
                const el = Math.min(baseEl, MAX_EL);
                const azimuth = Math.sin(2 * Math.PI * f / n) * swingRange;
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

        camera.position.copy(savedCamPos);
        camera.lookAt(0, 0, 0);
        controls.update();

        download(muxer.target.buffer, currentFileName + '.mp4', 'video/mp4');
        setStatus('MP4 saved ✓');
    } catch (err) {
        setStatus('Error: ' + err.message);
        console.error(err);
    } finally {
        setExporting(false);
        controls.autoRotate = !isPaused && rotateModeEl.value === 'spin';
        setTimeout(() => setStatus(''), 5000);
    }
});

// ── Restore on load ───────────────────────────────────────────────────────────
restoreSession().finally(() => {
    // Remove anti-FOUC guard once session restore attempt is complete,
    // whether it succeeded (html.loaded is set) or not.
    document.documentElement.classList.remove('has-session');
});
