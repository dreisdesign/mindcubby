import * as THREE from 'three';

export function createOrbitFrameStateStore() {
    return {
        state: {
            target: new THREE.Vector3(),
            dist: 1,
            elev: 0,
            az: 0,
        },
        offset: new THREE.Vector3(),
    };
}

export function getOrbitFrameStateFast(camera, controls, store) {
    const target = controls?.target || store.state.target.set(0, 0, 0);
    store.state.target.copy(target);
    store.offset.copy(camera.position).sub(target);
    const dist = Math.max(store.offset.length(), 1e-6);
    store.state.dist = dist;
    store.state.elev = Math.asin(Math.max(-1, Math.min(1, store.offset.y / dist)));
    store.state.az = Math.atan2(store.offset.x, store.offset.z);
    return store.state;
}

export function getOrbitFrameState(camera, controls, store) {
    const s = getOrbitFrameStateFast(camera, controls, store);
    return {
        target: s.target.clone(),
        dist: s.dist,
        elev: s.elev,
        az: s.az,
    };
}

export function setCameraFromOrbitState(camera, target, dist, elev, az) {
    camera.position.set(
        target.x + dist * Math.cos(elev) * Math.sin(az),
        target.y + dist * Math.sin(elev),
        target.z + dist * Math.cos(elev) * Math.cos(az)
    );
    camera.lookAt(target);
}
