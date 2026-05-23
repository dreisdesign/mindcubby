import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/STLLoader.js';

const loader = new STLLoader();

function getTriangleCount(geo) {
    if (!geo) return 0;
    if (geo.index?.count) return Math.floor(geo.index.count / 3);
    const posCount = geo.attributes?.position?.count || 0;
    return Math.floor(posCount / 3);
}

function toVec3Object(vec) {
    return { x: vec.x, y: vec.y, z: vec.z };
}

function cloneTypedArray(array) {
    if (!array) return null;
    return new array.constructor(array);
}

function serializeGeometry(geo) {
    const position = cloneTypedArray(geo.attributes?.position?.array);
    const normal = cloneTypedArray(geo.attributes?.normal?.array);
    const indexArray = cloneTypedArray(geo.index?.array);
    const bbox = geo.boundingBox;
    return {
        position,
        normal,
        index: indexArray,
        indexType: indexArray?.constructor?.name || null,
        boundingBox: bbox ? {
            min: toVec3Object(bbox.min),
            max: toVec3Object(bbox.max),
        } : null,
    };
}

function parseSingleModel(item, limits) {
    const geo = loader.parse(item.buffer);
    const triangles = getTriangleCount(geo);
    if (!Number.isFinite(triangles) || triangles < 1) {
        throw new Error(`"${item.name}" has invalid geometry.`);
    }
    if (triangles > limits.maxTrianglesPerFile) {
        throw new Error(`"${item.name}" exceeds triangle limit (${limits.maxTrianglesPerFile.toLocaleString()}).`);
    }

    geo.computeBoundingBox();
    const center = new THREE.Vector3();
    geo.boundingBox?.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);
    geo.computeVertexNormals();
    geo.computeBoundingBox();

    const payload = {
        kind: 'single',
        geometry: serializeGeometry(geo),
        triangles,
    };

    geo.dispose?.();
    return payload;
}

function parseMultipartModels(items, limits) {
    const parsed = [];
    const unionBox = new THREE.Box3();
    let totalTriangles = 0;

    for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const geo = loader.parse(item.buffer);
        const triangles = getTriangleCount(geo);
        if (!Number.isFinite(triangles) || triangles < 1) {
            throw new Error(`"${item.name}" has invalid geometry.`);
        }
        if (triangles > limits.maxTrianglesPerFile) {
            throw new Error(`"${item.name}" exceeds triangle limit (${limits.maxTrianglesPerFile.toLocaleString()}).`);
        }

        totalTriangles += triangles;
        if (totalTriangles > limits.maxTrianglesTotal) {
            throw new Error(`Multipart triangle budget exceeded (${limits.maxTrianglesTotal.toLocaleString()}).`);
        }

        geo.computeBoundingBox();
        if (geo.boundingBox) unionBox.union(geo.boundingBox);
        parsed.push({ geo, triangles, name: item.name });
    }

    const center = unionBox.getCenter(new THREE.Vector3());
    const geometries = [];
    const partBounds = [];
    const partDimensions = [];
    const partBoxes = [];

    for (const part of parsed) {
        const geo = part.geo;
        geo.translate(-center.x, -center.y, -center.z);
        geo.computeBoundingBox();
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        const box = geo.boundingBox;
        if (box) {
            const boundsCenter = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            partBounds.push({
                center: toVec3Object(boundsCenter),
                radius: Math.max(size.length() * 0.5, 0.001),
            });
            partDimensions.push({ w: size.x, d: size.y, h: size.z });
            partBoxes.push({ min: toVec3Object(box.min), max: toVec3Object(box.max) });
        } else {
            partBounds.push({ center: { x: 0, y: 0, z: 0 }, radius: 0.001 });
            partDimensions.push({ w: 0, d: 0, h: 0 });
            partBoxes.push({ min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } });
        }
        geometries.push(serializeGeometry(geo));
        geo.dispose?.();
    }

    return {
        kind: 'multi',
        geometries,
        partBounds,
        partDimensions,
        partBoxes,
        totalTriangles,
    };
}

self.addEventListener('message', (event) => {
    const { id, mode, items, limits } = event.data || {};
    try {
        if (!Array.isArray(items) || !items.length) {
            throw new Error('No STL data supplied.');
        }
        const payload = mode === 'multi'
            ? parseMultipartModels(items, limits)
            : parseSingleModel(items[0], limits);

        const transfer = [];
        if (payload.kind === 'single') {
            if (payload.geometry.position) transfer.push(payload.geometry.position.buffer);
            if (payload.geometry.normal) transfer.push(payload.geometry.normal.buffer);
            if (payload.geometry.index) transfer.push(payload.geometry.index.buffer);
        } else {
            payload.geometries.forEach((geo) => {
                if (geo.position) transfer.push(geo.position.buffer);
                if (geo.normal) transfer.push(geo.normal.buffer);
                if (geo.index) transfer.push(geo.index.buffer);
            });
        }

        self.postMessage({ id, ok: true, payload }, transfer);
    } catch (error) {
        self.postMessage({
            id,
            ok: false,
            error: error?.message || 'STL worker failed.',
        });
    }
});