import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
}

// ── DOM ───────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const viewerSec = document.getElementById('viewerSection');
const colorPick = document.getElementById('colorPicker');
const bgPick = document.getElementById('bgPicker');
const shadingEl = document.getElementById('shading');
const speedSlider = document.getElementById('speedSlider');
const speedVal = document.getElementById('speedVal');
const elevSlider = document.getElementById('elevationSlider');
const elevVal = document.getElementById('elevVal');
const btnGif = document.getElementById('btnExportGif');
const btnVideo = document.getElementById('btnExportVideo');
const statusEl = document.getElementById('exportStatus');
const estimateGif = document.getElementById('estimateGif');
const estimateMp4 = document.getElementById('estimateMp4');
const fileNameEl = document.getElementById('fileName');
const btnPause = document.getElementById('btnPause');
const iconPause = document.getElementById('iconPause');
const iconPlay = document.getElementById('iconPlay');

// ── State ─────────────────────────────────────────────────────────────────────
let renderer, scene, camera, controls, mesh;
let isExporting = false;
let isPaused = false;
let modelRadius = 1;

// ── Init ──────────────────────────────────────────────────────────────────────
function initThree() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(bgPick.value);

    camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1e6);

    // Three-point lighting to approximate the Python Blinn-Phong setup
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(1.5, 2.0, 1.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-2, 0.5, -1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.55);
    rim.position.set(0.5, -1, -2);
    scene.add(rim);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.5;
    controls.enableZoom = false; // zoom handled manually below

    // ── Scroll interception (Google Maps pattern) ──────────────────────
    // Plain scroll  → pass through to page, show hint
    // Ctrl/Cmd+scroll → zoom the model
    canvas.addEventListener('wheel', onCanvasWheel, { capture: true, passive: false });
    canvas.addEventListener('mouseleave', hideScrollHint);

    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    requestAnimationFrame(loop);
}

let scrollHintTimer = null;
const scrollHintEl = (() => {
    const el = document.createElement('div');
    el.className = 'scroll-hint';
    el.textContent = 'Use Ctrl + scroll to zoom';
    el.style.cssText = [
        'position:absolute', 'inset:0', 'display:none',
        'align-items:center', 'justify-content:center',
        'background:rgba(0,0,0,0.45)', 'color:#fff',
        'font-size:0.9rem', 'font-weight:600',
        'border-radius:8px', 'pointer-events:none',
        'transition:opacity 0.3s',
    ].join(';');
    // Inject into canvas-wrap once DOM is ready
    document.addEventListener('DOMContentLoaded', () => { }, { once: true });
    return el;
})();

function ensureHint() {
    const wrap = canvas.parentElement;
    if (!wrap.contains(scrollHintEl)) wrap.appendChild(scrollHintEl);
}

function showScrollHint() {
    ensureHint();
    clearTimeout(scrollHintTimer);
    scrollHintEl.style.display = 'flex';
    scrollHintEl.style.opacity = '1';
    scrollHintTimer = setTimeout(hideScrollHint, 1500);
}

function hideScrollHint() {
    scrollHintEl.style.opacity = '0';
    scrollHintTimer = setTimeout(() => { scrollHintEl.style.display = 'none'; }, 300);
}

function onCanvasWheel(e) {
    if (e.ctrlKey || e.metaKey) {
        // Zoom: prevent page scroll, let OrbitControls handle it
        e.preventDefault();
        // Manually dolly: positive deltaY = zoom out
        const zoomSpeed = 0.001;
        const factor = 1 + e.deltaY * zoomSpeed;
        camera.position.multiplyScalar(Math.max(0.1, Math.min(10, factor)));
        controls.update();
    } else {
        // Let page scroll — just show the hint
        showScrollHint();
    }
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
    if (shading === 'phong') return new THREE.MeshPhongMaterial({ ...base, shininess: 64, specular: '#222233' });
    // metallic
    return new THREE.MeshStandardMaterial({ ...base, metalness: 0.75, roughness: 0.2 });
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
    // Reset pause state on new load
    isPaused = false;
    controls.autoRotate = true;
    iconPause.style.display = '';
    iconPlay.style.display = 'none';
    viewerSec.classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('controlsBar').classList.remove('hidden');
    updateEstimate();
    requestAnimationFrame(syncCanvasSize);
}

function placeCamera() {
    const el = THREE.MathUtils.degToRad(parseFloat(elevSlider.value));
    const dist = modelRadius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.5;
    camera.position.set(0, dist * Math.sin(el), dist * Math.cos(el));
    camera.lookAt(0, 0, 0);
    controls.update();
}

// ── Render loop ───────────────────────────────────────────────────────────────
function loop() {
    requestAnimationFrame(loop);
    if (!isExporting) {
        controls.update();
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

const SETTINGS_KEY = 'rotater_settings';

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
            color: colorPick.value,
            bg: bgPick.value,
            shading: shadingEl.value,
            speed: speedSlider.value,
            elevation: elevSlider.value,
        }));
    } catch (e) { }
}

function restoreSettings() {
    try {
        const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (!s) return;
        colorPick.value = s.color;
        bgPick.value = s.bg;
        shadingEl.value = s.shading;
        speedSlider.value = s.speed;
        speedVal.textContent = parseFloat(s.speed).toFixed(1) + '×';
        elevSlider.value = s.elevation;
        elevVal.textContent = s.elevation + '°';
    } catch (e) { }
}

async function restoreSession() {
    restoreSettings();
    const saved = await loadFileFromIDB();
    if (!saved) return;
    fileNameEl.textContent = saved.name + ' ↩';
    if (!renderer) initThree();
    controls.autoRotateSpeed = BASE_ROTATE_SPEED * parseFloat(speedSlider.value);
    loadSTLBuffer(saved.buffer, saved.name);
}

// ── UI events ─────────────────────────────────────────────────────────────────
function handleFile(file) {
    if (!file?.name.toLowerCase().endsWith('.stl')) return;
    fileNameEl.textContent = file.name;
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

btnPause.addEventListener('click', () => {
    isPaused = !isPaused;
    controls.autoRotate = !isPaused;
    iconPause.style.display = isPaused ? 'none' : '';
    iconPlay.style.display = isPaused ? '' : 'none';
    btnPause.setAttribute('aria-label', isPaused ? 'Resume rotation' : 'Pause rotation');
    btnPause.title = isPaused ? 'Resume rotation' : 'Pause rotation';
});

document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !isExporting && mesh) {
        e.preventDefault();
        btnPause.click();
    }
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
    canvas.toBlob(blob => download(blob, 'model.png', 'image/png'), 'image/png');
});

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
});

colorPick.addEventListener('input', () => { if (mesh) mesh.material.color.set(colorPick.value); saveSettings(); });
bgPick.addEventListener('input', () => { if (scene) scene.background.set(bgPick.value); saveSettings(); });

shadingEl.addEventListener('change', () => {
    if (!mesh) return;
    mesh.material.dispose();
    mesh.material = getMaterial(shadingEl.value, colorPick.value);
    saveSettings();
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
    if (mesh) placeCamera();
    saveSettings();
});

// ── Export helpers ────────────────────────────────────────────────────────────
const setStatus = msg => { statusEl.textContent = msg; };
const setExporting = v => {
    isExporting = v;
    btnGif.disabled = v;
    btnVideo.disabled = v;
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
    const savedCamPos = camera.position.clone();

    for (let i = 0; i < n; i++) {
        const azimuth = -(2 * Math.PI * i) / n;
        camera.position.set(
            dist * Math.cos(elev) * Math.sin(azimuth),
            dist * Math.sin(elev),
            dist * Math.cos(elev) * Math.cos(azimuth),
        );
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

        const gif = GIFEncoder();
        const repeat = document.getElementById('gifLoop').checked ? 0 : -1;
        for (let i = 0; i < frames.length; i++) {
            const palette = quantize(frames[i], 256);
            const index = applyPalette(frames[i], palette);
            gif.writeFrame(index, S, S, { palette, delay, repeat });

            if (i % 16 === 0) {
                setStatus(`Encoding… ${i + 1} / ${frames.length}`);
                await new Promise(r => setTimeout(r, 0));
            }
        }

        gif.finish();
        download(gif.bytes(), 'rotation.gif', 'image/gif');
        setStatus('GIF saved ✓');
    } catch (err) {
        setStatus('Error: ' + err.message);
        console.error(err);
    } finally {
        setExporting(false);
        controls.autoRotate = true;
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
        const savedCamPos = camera.position.clone();

        for (let f = 0; f < n; f++) {
            const azimuth = -(2 * Math.PI * f) / n;
            camera.position.set(
                dist * Math.cos(elev) * Math.sin(azimuth),
                dist * Math.sin(elev),
                dist * Math.cos(elev) * Math.cos(azimuth),
            );
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

        download(muxer.target.buffer, 'rotation.mp4', 'video/mp4');
        setStatus('MP4 saved ✓');
    } catch (err) {
        setStatus('Error: ' + err.message);
        console.error(err);
    } finally {
        setExporting(false);
        controls.autoRotate = true;
        setTimeout(() => setStatus(''), 5000);
    }
});

// ── Restore on load ───────────────────────────────────────────────────────────
restoreSession();
