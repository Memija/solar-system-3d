import * as THREE from 'three';

export interface EnvironmentMapHandle {
    texture: THREE.Texture | null;
    dispose: () => void;
}

/**
 * Generates a lightweight procedural cosmic + warm solar equirectangular environment map
 * processed through PMREMGenerator so metallic spacecraft foil (JWST, Cassini, Voyager, ISS)
 * exhibits realistic specular reflections in deep space without external HDR network assets.
 */
export function applySpaceEnvironmentMap(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer
): EnvironmentMapHandle {
    let envDataTexture: THREE.DataTexture | null = null;
    let pmremTarget: THREE.WebGLRenderTarget | null = null;
    let pmremGenerator: THREE.PMREMGenerator | null = null;

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

                // Warm solar radiance lobe centered around +X + Galactic plane cool starlight band
                const solarLobe = Math.pow(Math.max(0, dx), 6);
                const solarHalo = Math.pow(Math.max(0, dx * 0.7 + 0.3), 2);
                const galacticBand = Math.exp(-Math.pow((dy * 0.8 + dz * 0.4) * 3.2, 2));

                const r = Math.min(255, Math.round(14 + galacticBand * 26 + solarHalo * 48 + solarLobe * 165));
                const g = Math.min(255, Math.round(20 + galacticBand * 36 + solarHalo * 40 + solarLobe * 145));
                const b = Math.min(255, Math.round(36 + galacticBand * 58 + solarHalo * 28 + solarLobe * 110));

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
            pmremGenerator.compileEquirectangularShader?.();
            pmremTarget = pmremGenerator.fromEquirectangular(envDataTexture);
            if (pmremTarget?.texture) {
                scene.environment = pmremTarget.texture;
            } else {
                scene.environment = envDataTexture;
            }
        } else {
            scene.environment = envDataTexture;
        }

        if ('environmentIntensity' in scene) {
            (scene as any).environmentIntensity = 0.55;
        }
    } catch {
        // Safe fallback in headless unit test environments
    }

    return {
        texture: scene.environment,
        dispose: () => {
            if (scene.environment === pmremTarget?.texture || scene.environment === envDataTexture) {
                scene.environment = null;
            }
            pmremTarget?.dispose?.();
            pmremGenerator?.dispose?.();
            envDataTexture?.dispose?.();
            pmremTarget = null;
            pmremGenerator = null;
            envDataTexture = null;
        }
    };
}

