import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

// ── Defaults (mirrors Python CLI defaults) ────────────────────────────────────
const EXPORT = { size: 720, frames: 144, fps: 24 };

// ── DOM ───────────────────────────────────────────────────────────────────────
const canvas      = document.getElementById('canvas');
const fileInput   = document.getElementById('fileInput');
const dropZone    = document.getElementById('dropZone');
const viewerSec   = document.getElementById('viewerSection');
const colorPick   = document.getElementById('colorPicker');
const bgPick      = document.getElementById('bgPicker');
const shadingEl   = document.getElementById('shading');
const speedSlider = document.getElementById('speedSlider');
const speedVal    = document.getElementById('speedVal');
const elevSlider  = document.getElementById('elevationSlider');
const elevVal     = document.getElementById('elevVal');
const btnGif      = document.getElementById('btnExportGif');
const btnVideo    = document.getElementById('btnExportVideo');
const statusEl    = document.getElementById('exportStatus');
const fileNameEl  = document.getElementById('fileName');

// ── State ─────────────────────────────────────────────────────────────────────
let renderer, scene, camera, controls, mesh;
let isExporting = false;
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

    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    requestAnimationFrame(loop);
}

function syncCanvasSize() {
    const w = canvas.parentElement.clientWidth;
    if (w === 0) return;
    renderer.setSize(w, w, false); // false = don't touch CSS
}

// ── Material ─────────────────────────────────────────────────────────────────
function getMaterial(shading, color) {
    const base = { color, side: THREE.DoubleSide };
    if (shading === 'flat')   return new THREE.MeshBasicMaterial(base);
    if (shading === 'phong')  return new THREE.MeshPhongMaterial({ ...base, shininess: 64, specular: '#222233' });
    // metallic
    return new THREE.MeshStandardMaterial({ ...base, metalness: 0.75, roughness: 0.2 });
}

// ── STL Loading ───────────────────────────────────────────────────────────────
function loadSTL(file) {
    const url = URL.createObjectURL(file);
    new STLLoader().load(url, (geo) => {
        URL.revokeObjectURL(url);

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

        const sz = new THREE.Vector3();
        geo.boundingBox.getSize(sz);
        modelRadius = Math.max(sz.x, sz.y, sz.z) / 2;

        placeCamera();
        viewerSec.classList.remove('hidden');
        requestAnimationFrame(syncCanvasSize);
    });
}

function placeCamera() {
    const el   = THREE.MathUtils.degToRad(parseFloat(elevSlider.value));
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

// ── UI events ─────────────────────────────────────────────────────────────────
function handleFile(file) {
    if (!file?.name.toLowerCase().endsWith('.stl')) return;
    fileNameEl.textContent = file.name;
    if (!renderer) initThree();
    loadSTL(file);
}

fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
});

colorPick.addEventListener('input', () => { if (mesh) mesh.material.color.set(colorPick.value); });
bgPick.addEventListener('input',    () => { if (scene) scene.background.set(bgPick.value); });

shadingEl.addEventListener('change', () => {
    if (!mesh) return;
    mesh.material.dispose();
    mesh.material = getMaterial(shadingEl.value, colorPick.value);
});

speedSlider.addEventListener('input', () => {
    const v = parseFloat(speedSlider.value);
    speedVal.textContent = v.toFixed(1) + '×';
    if (controls) controls.autoRotateSpeed = 2.5 * v;
});

elevSlider.addEventListener('input', () => {
    elevVal.textContent = elevSlider.value + '°';
    if (mesh) placeCamera();
});

// ── Export helpers ────────────────────────────────────────────────────────────
const setStatus   = msg => { statusEl.textContent = msg; };
const setExporting = v  => {
    isExporting = v;
    btnGif.disabled   = v;
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

// Capture N frames by rotating the mesh, return array of Uint8ClampedArrays
async function captureFrames(n) {
    const S = EXPORT.size;
    const off = Object.assign(document.createElement('canvas'), { width: S, height: S });
    const ctx = off.getContext('2d', { willReadFrequently: true });
    const savedY = mesh.rotation.y;
    const frames = [];

    for (let i = 0; i < n; i++) {
        mesh.rotation.y = savedY + (2 * Math.PI * i) / n;
        renderer.render(scene, camera);
        ctx.drawImage(renderer.domElement, 0, 0, S, S);
        frames.push(new Uint8ClampedArray(ctx.getImageData(0, 0, S, S).data));

        // Yield every 12 frames so the status label updates
        if (i % 12 === 0) {
            setStatus(`Capturing… ${i + 1} / ${n}`);
            await new Promise(r => setTimeout(r, 0));
        }
    }

    mesh.rotation.y = savedY;
    return frames;
}

// ── GIF export ────────────────────────────────────────────────────────────────
btnGif.addEventListener('click', async () => {
    if (!mesh) return;
    setExporting(true);
    controls.autoRotate = false;

    try {
        const frames = await captureFrames(EXPORT.frames);
        const delay  = Math.round(1000 / EXPORT.fps);
        const S      = EXPORT.size;

        setStatus('Encoding GIF…');
        await new Promise(r => setTimeout(r, 0));

        const gif = GIFEncoder();
        for (let i = 0; i < frames.length; i++) {
            const palette = quantize(frames[i], 256);
            const index   = applyPalette(frames[i], palette);
            gif.writeFrame(index, S, S, { palette, delay });

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

// ── Video export ──────────────────────────────────────────────────────────────
btnVideo.addEventListener('click', async () => {
    if (!mesh) return;
    setExporting(true);
    controls.autoRotate = false;

    try {
        const { frames: n, fps } = EXPORT;

        const stream = renderer.domElement.captureStream(fps);
        const mime   = ['video/webm;codecs=vp9', 'video/webm']
            .find(t => MediaRecorder.isTypeSupported(t));
        if (!mime) throw new Error('MediaRecorder not supported in this browser.');

        const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
        const chunks   = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

        const savedY = mesh.rotation.y;

        await new Promise((res, rej) => {
            recorder.onstop  = res;
            recorder.onerror = rej;
            recorder.start();

            let f = 0;
            function tick() {
                if (f >= n) { recorder.stop(); return; }
                mesh.rotation.y = savedY + (2 * Math.PI * f) / n;
                renderer.render(scene, camera);
                setStatus(`Recording… ${f + 1} / ${n}`);
                f++;
                setTimeout(tick, 1000 / fps);
            }
            tick();
        });

        mesh.rotation.y = savedY;
        download(new Blob(chunks, { type: mime }), 'rotation.webm', mime);
        setStatus('Video saved ✓');
    } catch (err) {
        setStatus('Error: ' + err.message);
        console.error(err);
    } finally {
        setExporting(false);
        controls.autoRotate = true;
        setTimeout(() => setStatus(''), 5000);
    }
});
