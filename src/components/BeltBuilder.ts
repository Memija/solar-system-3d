import * as THREE from 'three';
import { MajorStarsData } from './MajorStarsData';
import { equatorialToEcliptic3D } from './MathUtils';

export interface StarfieldHandle {
    skybox: THREE.Mesh;
    starPoints: THREE.Points;
    starMeshes: THREE.Object3D[];
    update: (elapsedDelta: number) => void;
    dispose: () => void;
}

export function buildAsteroidBelt(scene: THREE.Scene, visible: boolean): THREE.InstancedMesh {
    const numAsteroids = 2000;
    const minDistance = 200;
    const maxDistance = 250;

    // OctahedronGeometry(0.5, 0) uses 8 triangles/rock instead of 36 (DodecahedronGeometry),
    // saving 56,000 triangles per frame across 2,000 sub-pixel belt rocks.
    const geometry = new THREE.OctahedronGeometry(0.5, 0);
    const material = new THREE.MeshStandardMaterial({
        roughness: 0.85,
        metalness: 0.15
    });

    const asteroidBelt = new THREE.InstancedMesh(geometry, material, numAsteroids);
    asteroidBelt.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 260);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const asteroidPalettes = [
        0x3d352e,
        0x4a4238,
        0x7d7265,
        0x918370,
        0xaba49a,
        0x5e564d
    ];

    for (let i = 0; i < numAsteroids; i++) {
        const angle = THREE.MathUtils.seededRandom() * Math.PI * 2;
        const distance = minDistance + THREE.MathUtils.seededRandom() * (maxDistance - minDistance);
        const yOffset = (THREE.MathUtils.seededRandom() - 0.5) * 10;

        dummy.position.set(Math.cos(angle) * distance, yOffset, Math.sin(angle) * distance);
        dummy.rotation.set(
            THREE.MathUtils.seededRandom() * Math.PI,
            THREE.MathUtils.seededRandom() * Math.PI,
            THREE.MathUtils.seededRandom() * Math.PI
        );
        const scale = 0.5 + THREE.MathUtils.seededRandom();
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        asteroidBelt.setMatrixAt(i, dummy.matrix);

        const hex = asteroidPalettes[Math.floor(THREE.MathUtils.seededRandom() * asteroidPalettes.length)];
        color.setHex(hex);
        asteroidBelt.setColorAt(i, color);
    }

    if (asteroidBelt.instanceColor) {
        asteroidBelt.instanceColor.needsUpdate = true;
    }

    asteroidBelt.visible = visible;
    scene.add(asteroidBelt);
    return asteroidBelt;
}

export function buildKuiperBelt(scene: THREE.Scene, visible: boolean): THREE.InstancedMesh {
    const numObjects = 2500;
    const minDistance = 670;
    const maxDistance = 850;

    // OctahedronGeometry(0.8, 0) uses 8 triangles/rock instead of 36 (DodecahedronGeometry),
    // saving 70,000 triangles per frame across 2,500 sub-pixel Kuiper belt bodies.
    const geometry = new THREE.OctahedronGeometry(0.8, 0);
    const material = new THREE.MeshStandardMaterial({
        roughness: 0.7,
        metalness: 0.1
    });

    const kuiperBelt = new THREE.InstancedMesh(geometry, material, numObjects);
    kuiperBelt.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 860);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const kuiperPalettes = [
        0xc4d4e0,
        0xdee8f0,
        0x825442,
        0x54585c,
        0x9faab3
    ];

    for (let i = 0; i < numObjects; i++) {
        const angle = THREE.MathUtils.seededRandom() * Math.PI * 2;
        const distance = minDistance + THREE.MathUtils.seededRandom() * (maxDistance - minDistance);
        const yOffset = (THREE.MathUtils.seededRandom() - 0.5) * 30;

        dummy.position.set(Math.cos(angle) * distance, yOffset, Math.sin(angle) * distance);
        dummy.rotation.set(
            THREE.MathUtils.seededRandom() * Math.PI,
            THREE.MathUtils.seededRandom() * Math.PI,
            THREE.MathUtils.seededRandom() * Math.PI
        );
        const scale = 0.3 + THREE.MathUtils.seededRandom() * 1.5;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        kuiperBelt.setMatrixAt(i, dummy.matrix);

        const hex = kuiperPalettes[Math.floor(THREE.MathUtils.seededRandom() * kuiperPalettes.length)];
        color.setHex(hex);
        kuiperBelt.setColorAt(i, color);
    }

    if (kuiperBelt.instanceColor) {
        kuiperBelt.instanceColor.needsUpdate = true;
    }

    kuiperBelt.visible = visible;
    scene.add(kuiperBelt);
    return kuiperBelt;
}

export function buildHabitableZone(scene: THREE.Scene, visible: boolean): THREE.Mesh {
    const innerRadius = 120;
    const outerRadius = 180;

    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            innerRadius: { value: innerRadius },
            outerRadius: { value: outerRadius },
            color: { value: new THREE.Color(0x10b981) },
            time: { value: 0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float innerRadius;
            uniform float outerRadius;
            uniform vec3 color;
            varying vec2 vUv;
            varying vec3 vPosition;

            void main() {
                float dist = length(vPosition.xy);
                float alpha = smoothstep(innerRadius, innerRadius + 10.0, dist) *
                              (1.0 - smoothstep(outerRadius - 10.0, outerRadius, dist));
                gl_FragColor = vec4(color, alpha * 0.15);
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.visible = visible;
    scene.add(mesh);
    return mesh;
}

export function buildEclipticGrid(scene: THREE.Scene, visible: boolean): THREE.PolarGridHelper {
    const radius = 1000;
    const radials = 16;
    const circles = 10;
    const divisions = 64;
    const color1 = new THREE.Color(0x1e4976);
    const color2 = new THREE.Color(0x0f2744);

    const grid = new THREE.PolarGridHelper(radius, radials, circles, divisions, color1, color2);
    grid.matrixAutoUpdate = false;
    grid.updateMatrix();
    grid.visible = visible;

    if (grid.material instanceof THREE.Material) {
        grid.material.transparent = true;
        grid.material.opacity = 0.3;
        grid.material.depthWrite = false;
    } else if (Array.isArray(grid.material)) {
        for (const mat of grid.material) {
            mat.transparent = true;
            mat.opacity = 0.3;
            mat.depthWrite = false;
        }
    }

    scene.add(grid);
    return grid;
}

export function buildStarfield(scene: THREE.Scene, renderer: THREE.WebGLRenderer): StarfieldHandle {
    // Opaque Milky Way WebP skybox (eliminates full-screen alpha blending overdraw).
    // 28x20 segments (1,120 tris vs 8,192 for 64x64) is curvature-free from the interior at r=50,000.
    const skyGeometry = new THREE.SphereGeometry(50000, 28, 20);
    const textureLoader = new THREE.TextureLoader();
    const textureUrl = `${import.meta.env.BASE_URL}textures/milky_way.webp`;
    const skyTexture = textureLoader.load(textureUrl);
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    skyTexture.anisotropy = renderer.capabilities?.getMaxAnisotropy?.() ?? 16;

    const skyMaterial = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide,
        transparent: false,
        depthWrite: false
    });

    const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    skybox.rotation.x = Math.PI / 3;
    skybox.renderOrder = -10;
    skybox.matrixAutoUpdate = false;
    skybox.updateMatrix();
    scene.add(skybox);

    // Soft circular anti-aliased multi-spectral background starfield with subtle scintillation
    const starCount = 3200;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starPhases = new Float32Array(starCount);

    const spectralColors = [
        [0.65, 0.80, 1.0],
        [0.86, 0.91, 1.0],
        [1.0, 1.0, 0.96],
        [1.0, 0.93, 0.72],
        [1.0, 0.76, 0.46],
        [1.0, 0.50, 0.38]
    ];

    for (let i = 0; i < starCount; i++) {
        const r = 45000 + THREE.MathUtils.seededRandom() * 4000;
        const theta = THREE.MathUtils.seededRandom() * Math.PI * 2;
        const phi = Math.acos(THREE.MathUtils.seededRandom() * 2 - 1);

        starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = r * Math.cos(phi);

        const color = spectralColors[Math.floor(THREE.MathUtils.seededRandom() * spectralColors.length)];
        const brightness = 0.62 + THREE.MathUtils.seededRandom() * 0.38;
        starColors[i * 3] = color[0] * brightness;
        starColors[i * 3 + 1] = color[1] * brightness;
        starColors[i * 3 + 2] = color[2] * brightness;

        starSizes[i] = 18.0 + Math.pow(THREE.MathUtils.seededRandom(), 2.2) * 34.0;
        starPhases[i] = THREE.MathUtils.seededRandom() * Math.PI * 2;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));

    const starMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            attribute vec3 color;
            attribute float aSize;
            attribute float aPhase;
            uniform float time;
            varying vec3 vColor;
            varying float vTwinkle;
            void main() {
                vColor = color;
                vTwinkle = 0.82 + 0.18 * sin(time * 1.4 + aPhase);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = clamp(aSize * (3000.0 / max(1.0, -mvPosition.z)), 1.4, 5.5);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vTwinkle;
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float d = length(coord) * 2.0;
                if (d > 1.0) discard;
                float core = exp(-d * d * 4.2);
                gl_FragColor = vec4(vColor, core * 0.92 * vTwinkle);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    starPoints.matrixAutoUpdate = false;
    starPoints.updateMatrix();
    scene.add(starPoints);

    // Major navigable catalog stars: rendered in a single InstancedMesh (1 draw call)
    // while keeping lightweight raycast/focus proxy meshes in starMeshes.
    const majorStarRadius = 48000;
    const sharedMajorGeo = new THREE.SphereGeometry(140, 8, 6);
    const sharedMajorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const instancedMajorStars = new THREE.InstancedMesh(sharedMajorGeo, sharedMajorMat, MajorStarsData.length);
    instancedMajorStars.frustumCulled = false;
    instancedMajorStars.matrixAutoUpdate = false;
    instancedMajorStars.updateMatrix();

    const starMeshes: THREE.Object3D[] = [];
    const tempColor = new THREE.Color();

    MajorStarsData.forEach((star, idx) => {
        const ecl = equatorialToEcliptic3D(star.ra, star.dec, majorStarRadius);

        const starMesh = new THREE.Mesh(sharedMajorGeo, sharedMajorMat);
        starMesh.position.set(ecl.x, ecl.y, ecl.z);
        starMesh.userData = star;
        starMesh.matrixAutoUpdate = false;
        starMesh.updateMatrix();
        starMesh.updateMatrixWorld(true);
        starMeshes.push(starMesh);

        instancedMajorStars.setMatrixAt(idx, starMesh.matrix);
        tempColor.setHex(star.color ?? 0xffffff);
        instancedMajorStars.setColorAt(idx, tempColor);
    });

    instancedMajorStars.instanceMatrix.needsUpdate = true;
    if (instancedMajorStars.instanceColor) {
        instancedMajorStars.instanceColor.needsUpdate = true;
    }
    scene.add(instancedMajorStars);

    return {
        skybox,
        starPoints,
        starMeshes,
        update: (elapsedDelta: number) => {
            if (elapsedDelta > 0) {
                starMaterial.uniforms.time.value += elapsedDelta;
            }
        },
        dispose: () => {
            scene.remove(skybox);
            skyGeometry.dispose();
            skyTexture.dispose();
            skyMaterial.dispose();

            scene.remove(starPoints);
            starGeometry.dispose();
            starMaterial.dispose();

            scene.remove(instancedMajorStars);
            instancedMajorStars.dispose();
            sharedMajorGeo.dispose();
            sharedMajorMat.dispose();
            starMeshes.length = 0;
        }
    };
}

