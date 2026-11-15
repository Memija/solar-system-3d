import * as THREE from 'three';

export interface EnvironmentMapHandle {
    texture: THREE.Texture | null;
    dispose: () => void;
}

/**
 * Generates a lightweight procedural cosmic + warm solar equirectangular environment map
 * processed through PMREMGenerator so metallic spacecraft foil (JWST, Cassini, Voyager, ISS)
 * exhibits realistic specular reflections in deep space without external HDR network assets
 * and without forcing CUBEUV IBL shader math onto matte planetary surfaces.
 */
export function createSpaceEnvironmentMap(
    renderer: THREE.WebGLRenderer
): EnvironmentMapHandle {
    let envDataTexture: THREE.DataTexture | null = null;
    let pmremTarget: THREE.WebGLRenderTarget | null = null;
    let pmremGenerator: THREE.PMREMGenerator | null = null;
    let envTexture: THREE.Texture | null = null;

    try {
        const width = 64;
        const height = 32;
        const data = new Uint8Array(width * height * 4);

        for (let y = 0; y < height; y++) {
            const v = y / (height - 1); // 0 = zenith, 0.5 = ecliptic horizon, 1 = nadir
            const lat = (0.5 - v) * Math.PI;
            const cosLat = Math.cos(lat);
            const sinLat = Math.sin(lat);

            for (let x = 0; x < width; x++) {
                const u = x / width;
                const lon = (u - 0.5) * Math.PI * 2;

                // Direction vector
                const dx = cosLat * Math.cos(lon);
                const dy = sinLat;
                const dz = cosLat * Math.sin(lon);

                // Warm solar radiance lobe centered around +X + Galactic starlight band + cool planetary albedo fill
                const solarLobe = Math.pow(Math.max(0, dx), 5);
                const solarHalo = Math.pow(Math.max(0, dx * 0.65 + 0.35), 2);
                const galacticBand = Math.exp(-Math.pow((dy * 0.8 + dz * 0.4) * 2.6, 2));
                const earthshine = Math.max(0, -dy) * 0.45 + 0.55;

                const r = Math.min(255, Math.round(52 * earthshine + galacticBand * 48 + solarHalo * 68 + solarLobe * 175));
                const g = Math.min(255, Math.round(64 * earthshine + galacticBand * 62 + solarHalo * 60 + solarLobe * 160));
                const b = Math.min(255, Math.round(92 * earthshine + galacticBand * 86 + solarHalo * 46 + solarLobe * 130));

                const idx = (y * width + x) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255;
            }
        }

        envDataTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
        envDataTexture.mapping = THREE.EquirectangularReflectionMapping;
        envDataTexture.colorSpace = THREE.SRGBColorSpace;
        envDataTexture.needsUpdate = true;

        if (typeof THREE.PMREMGenerator === 'function') {
            pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremTarget = pmremGenerator.fromEquirectangular(envDataTexture);
            envTexture = pmremTarget?.texture ?? envDataTexture;
            if (pmremTarget?.texture) {
                envDataTexture.dispose();
                envDataTexture = null;
            }
            pmremGenerator.dispose();
            pmremGenerator = null;
        } else {
            envTexture = envDataTexture;
        }
    } catch {
        // Safe fallback in headless unit test environments
    }

    return {
        texture: envTexture,
        dispose: () => {
            pmremTarget?.dispose?.();
            pmremGenerator?.dispose?.();
            envDataTexture?.dispose?.();
            pmremTarget = null;
            pmremGenerator = null;
            envDataTexture = null;
            envTexture = null;
        }
    };
}

export function applySpaceEnvironmentMap(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer
): EnvironmentMapHandle {
    const handle = createSpaceEnvironmentMap(renderer);
    if (handle.texture) {
        scene.environment = handle.texture;
        if ('environmentIntensity' in scene) {
            (scene as any).environmentIntensity = 0.55;
        }
    }
    return {
        texture: handle.texture,
        dispose: () => {
            if (scene.environment === handle.texture) {
                scene.environment = null;
            }
            handle.dispose();
        }
    };
}

