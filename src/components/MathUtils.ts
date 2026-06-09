export function solveKepler(M: number, e: number): number {
    let E = M + e * Math.sin(M) + 0.5 * e * e * Math.sin(2 * M);
    for(let i = 0; i < 50; i++) {
        let f = E - e * Math.sin(E) - M;
        let df = 1 - e * Math.cos(E);
        let dE = f / df;

        // Clamp the change to prevent wild oscillation for extreme eccentricities
        if (dE > 0.5) dE = 0.5;
        if (dE < -0.5) dE = -0.5;

        E -= dE;
        if (Math.abs(dE) < 1e-6) break;
    }
    return E;
}
import * as THREE from 'three';

export function createOrbitLine(a: number, e: number, segments: number = 256): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const b = a * Math.sqrt(1 - e * e);

    for (let i = 0; i <= segments; i++) {
        const E = (i / segments) * Math.PI * 2;
        const x = a * (Math.cos(E) - e);
        const z = b * Math.sin(E);
        vertices.push(x, 0, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
}
