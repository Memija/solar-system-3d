import * as THREE from 'three';
import { MajorStarsData } from './MajorStarsData';
import { equatorialToEcliptic3D } from './MathUtils';
import { TextureGenerator } from './TextureGenerator';

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

    // TetrahedronGeometry(0.55, 0) uses 4 triangles/rock instead of 36 (DodecahedronGeometry),
    // paired with Lambert diffuse solar lighting to eliminate GGX/PMREM PBR overhead across 2,000 sub-pixel rocks.
    const geometry = new THREE.TetrahedronGeometry(0.55, 0);
    const material = new THREE.MeshLambertMaterial();

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
    asteroidBelt.matrixAutoUpdate = false;
    asteroidBelt.updateMatrix();
    scene.add(asteroidBelt);
    asteroidBelt.updateMatrixWorld(true);
    asteroidBelt.matrixWorldAutoUpdate = false;
    return asteroidBelt;
}

export function buildKuiperBelt(scene: THREE.Scene, visible: boolean): THREE.InstancedMesh {
    const numObjects = 2500;
    const minDistance = 670;
    const maxDistance = 850;

    // TetrahedronGeometry(0.88, 0) uses 4 triangles/rock instead of 36 (DodecahedronGeometry),
    // paired with Lambert diffuse solar lighting across 2,500 sub-pixel Kuiper belt bodies.
    const geometry = new THREE.TetrahedronGeometry(0.88, 0);
    const material = new THREE.MeshLambertMaterial();

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
    kuiperBelt.matrixAutoUpdate = false;
    kuiperBelt.updateMatrix();
    scene.add(kuiperBelt);
    kuiperBelt.updateMatrixWorld(true);
    kuiperBelt.matrixWorldAutoUpdate = false;
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
    mesh.updateMatrixWorld(true);
    mesh.matrixWorldAutoUpdate = false;
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
    grid.updateMatrixWorld(true);
    grid.matrixWorldAutoUpdate = false;
    return grid;
}

export function buildStarfield(scene: THREE.Scene, _renderer: THREE.WebGLRenderer): StarfieldHandle {
    // Opaque Milky Way WebP skybox (2048x1024, eliminates full-screen alpha blending overdraw).
    // 28x20 segments (1,120 tris vs 8,192 for 64x64) is curvature-free from the interior at r=50,000,
    // and constant interior viewing distance + 60 deg FOV means mipmaps are never sampled.
    const skyGeometry = new THREE.SphereGeometry(50000, 28, 20);
    const textureUrl = `${import.meta.env.BASE_URL}textures/milky_way.webp`;
    const skyTexture = typeof TextureGenerator.loadStaticImageTexture === 'function'
        ? TextureGenerator.loadStaticImageTexture(textureUrl, {
            colorSpace: THREE.SRGBColorSpace,
            minFilter: THREE.LinearFilter,
            generateMipmaps: false
        })
        : (() => {
            const tex = new THREE.TextureLoader().load(textureUrl);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.minFilter = THREE.LinearFilter;
            tex.generateMipmaps = false;
            return tex;
        })();

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
    skybox.updateMatrixWorld(true);
    skybox.matrixWorldAutoUpdate = false;

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
    starPoints.updateMatrixWorld(true);
    starPoints.matrixWorldAutoUpdate = false;

    // Major navigable catalog stars: pre-merged into a single static vertex-colored Mesh
    // (1 draw call, shares the exact MeshBasicMaterial+USE_COLOR program with ConstellationManager)
    // while keeping lightweight raycast/focus proxy meshes in starMeshes.
    const majorStarRadius = 48000;
    const sharedMajorGeo = new THREE.SphereGeometry(140, 6, 4);
    const sharedMajorMat = new THREE.MeshBasicMaterial({ vertexColors: true });

    const basePosAttr = sharedMajorGeo.getAttribute('position') as THREE.BufferAttribute;
    const baseIndex = sharedMajorGeo.getIndex();
    const vertsPerStar = basePosAttr.count;
    const indicesPerStar = baseIndex ? baseIndex.count : vertsPerStar;
    const majorStarCount = MajorStarsData.length;

    const mergedPositions = new Float32Array(majorStarCount * vertsPerStar * 3);
    const mergedColors = new Float32Array(majorStarCount * vertsPerStar * 3);
    const mergedIndices = new Uint16Array(majorStarCount * indicesPerStar);

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

        tempColor.setHex(star.color ?? 0xffffff);
        const vOffset = idx * vertsPerStar;
        for (let v = 0; v < vertsPerStar; v++) {
            const dst = (vOffset + v) * 3;
            mergedPositions[dst] = basePosAttr.getX(v) + ecl.x;
            mergedPositions[dst + 1] = basePosAttr.getY(v) + ecl.y;
            mergedPositions[dst + 2] = basePosAttr.getZ(v) + ecl.z;
            mergedColors[dst] = tempColor.r;
            mergedColors[dst + 1] = tempColor.g;
            mergedColors[dst + 2] = tempColor.b;
        }

        const iOffset = idx * indicesPerStar;
        if (baseIndex) {
            for (let k = 0; k < indicesPerStar; k++) {
                mergedIndices[iOffset + k] = baseIndex.getX(k) + vOffset;
            }
        } else {
            for (let k = 0; k < indicesPerStar; k++) {
                mergedIndices[iOffset + k] = vOffset + k;
            }
        }
    });

    const batchedMajorGeo = new THREE.BufferGeometry();
    batchedMajorGeo.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
    batchedMajorGeo.setAttribute('color', new THREE.BufferAttribute(mergedColors, 3));
    batchedMajorGeo.setIndex(new THREE.BufferAttribute(mergedIndices, 1));

    const mergedMajorStars = new THREE.Mesh(batchedMajorGeo, sharedMajorMat);
    mergedMajorStars.frustumCulled = false;
    mergedMajorStars.matrixAutoUpdate = false;
    mergedMajorStars.updateMatrix();
    scene.add(mergedMajorStars);
    mergedMajorStars.updateMatrixWorld(true);
    mergedMajorStars.matrixWorldAutoUpdate = false;

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

            scene.remove(mergedMajorStars);
            batchedMajorGeo.dispose();
            sharedMajorGeo.dispose();
            sharedMajorMat.dispose();
            starMeshes.length = 0;
        }
    };
}

