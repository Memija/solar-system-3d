import * as THREE from 'three';

import { CelestialBodyData, MoonData } from './SolarSystemData';
import { vertexShader as sunVertexShader, fragmentShader as sunFragmentShader } from './SunShader';
import {
    computeGMSTRadians,
    computeKeplerianOrbitPoint,
    computeKeplerianState,
    getOrbitalBasis,
    KeplerianState,
    OrbitalBasis
} from './MathUtils';
import { TextureGenerator } from './TextureGenerator';
import { markLineBatchable } from './LineBatcher';
import { i18n } from '../i18n';


const auroraVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
uniform float time;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    vec3 pos = position;
    float angle = atan(pos.z, pos.x);
    float wave1 = sin(angle * 5.0 + time * 1.8) * 0.04;
    float wave2 = cos(angle * 9.0 - time * 2.3) * 0.025;
    float displacement = wave1 + wave2;

    vec2 dir = length(pos.xz) > 0.001 ? normalize(pos.xz) : vec2(1.0, 0.0);
    pos.x += dir.x * displacement;
    pos.z += dir.y * displacement;
    pos.y += displacement * 0.5;

    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const auroraFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
uniform float time;
uniform vec3 colorBase;
uniform vec3 colorMid;
uniform vec3 colorTop;
uniform float opacity;

void main() {
    float verticalFade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.65, vUv.y);

    float rays = sin(vUv.x * 45.0 + time * 2.0) * 0.5 + 0.5;
    float raysDetail = sin(vUv.x * 90.0 - time * 1.5) * 0.5 + 0.5;
    float fluting = 0.55 + 0.45 * (rays * 0.65 + raysDetail * 0.35);

    vec3 col = mix(colorBase, colorMid, smoothstep(0.15, 0.6, vUv.y));
    col = mix(col, colorTop, smoothstep(0.6, 0.95, vUv.y));

    // Intensify auroral curtains across Earth's unlit night hemisphere
    vec3 sunDir = length(vWorldPos) > 0.0001 ? normalize(-vWorldPos) : vec3(1.0, 0.0, 0.0);
    float nightFactor = mix(1.18, 0.38, smoothstep(-0.25, 0.45, dot(normalize(vWorldNormal), sunDir)));

    float alpha = verticalFade * fluting * opacity * nightFactor;
    gl_FragColor = vec4(col, alpha);
}
`;

export class CelestialBody {
    data: CelestialBodyData | MoonData;
    parent: THREE.Object3D;
    mesh: THREE.Mesh | null;
    orbitLine: THREE.LineLoop | null;
    angle: number;
    moons: CelestialBody[];
    orbitGroup: THREE.Group;
    tiltGroup: THREE.Group;
    cloudMesh?: THREE.Mesh;
    atmosphereMesh?: THREE.Mesh;
    coronaMesh?: THREE.Mesh;
    shaderMaterial?: THREE.ShaderMaterial;
    ringMeshes: THREE.Mesh[];
    lastUpdate?: number;

    meteorParticles: THREE.LineSegments | null;
    meteorVelocities: THREE.Vector3[];
    auroraMeshNorth: THREE.Mesh | null = null;
    auroraMeshSouth: THREE.Mesh | null = null;
    auroraMaterial: THREE.ShaderMaterial | null = null;
    velocityVectorGroup: THREE.Group | null = null;
    velocityArrowMesh: THREE.Mesh | null = null;
    velocityPulseChevron: THREE.Mesh | null = null;
    velocityLabelSprite: THREE.Sprite | null = null;
    private velocityLabelRendered: boolean = false;
    private labelRendered: boolean = false;
    private highGeometry: THREE.BufferGeometry | null = null;
    private lowGeometry: THREE.BufferGeometry | null = null;
    private cloudDriftOffset: number = 0;
    private lastComputedAngle: number = NaN;
    private lastComputedRealistic: boolean = false;
    private cachedKeplerState: KeplerianState = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: -1 };
    private hasInitializedVelocityTransform: boolean = false;
    showMeteors: boolean;

    trailLine: THREE.Line | null;
    trailPositions: THREE.Vector3[];
    showTrails: boolean;

    axesHelper: THREE.AxesHelper | null;
    showAxes: boolean;
    labelSprite: THREE.Sprite | null = null;
    showLabel: boolean = false;
    realisticDistances: boolean = false;
    isMoon: boolean = false;

    private static _tempWorldPos = new THREE.Vector3();
    private static _tempLocalPos = new THREE.Vector3();
    private static _tempMeteorDir = new THREE.Vector3();
    private static _tempTangent = new THREE.Vector3();
    private static _unitZ = new THREE.Vector3(0, 0, 1);
    private static _sharedVelArrowGeo: THREE.BufferGeometry | null = null;
    private static _sharedVelPulseGeo: THREE.ConeGeometry | null = null;
    private static _sharedVelHeadMat: THREE.MeshBasicMaterial | null = null;
    private static _sharedVelPulseMat: THREE.MeshBasicMaterial | null = null;
    private static _sharedPlaceholderSpriteTex: THREE.CanvasTexture | null = null;
    private static _sharedAtmoLowGeo: THREE.SphereGeometry | null = null;
    private static _sharedAtmoHighGeo: THREE.SphereGeometry | null = null;
    private static _velocityPulseTimer = 0;
    private static _velocityPulseCycle = 0;

    private static getSharedAtmoLowGeo(): THREE.SphereGeometry {
        if (!CelestialBody._sharedAtmoLowGeo) {
            const geo = new THREE.SphereGeometry(1, 20, 20);
            geo.userData.shared = true;
            CelestialBody._sharedAtmoLowGeo = geo;
        }
        return CelestialBody._sharedAtmoLowGeo;
    }

    private static getSharedAtmoHighGeo(): THREE.SphereGeometry {
        if (!CelestialBody._sharedAtmoHighGeo) {
            const geo = new THREE.SphereGeometry(1, 48, 48);
            geo.userData.shared = true;
            CelestialBody._sharedAtmoHighGeo = geo;
        }
        return CelestialBody._sharedAtmoHighGeo;
    }

    private static applyIapetusShape(geometry: THREE.BufferGeometry): void {
        // Iapetus has an iconic walnut shape: polar flattening and a prominent equatorial mountain ridge
        const pos = geometry.attributes.position;
        const v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            const r = v.length();
            if (r > 0) {
                const lat = Math.asin(Math.max(-1, Math.min(1, v.y / r)));
                // Oblate polar flattening (polar radius ~0.955 of equatorial)
                const oblateness = 1.0 - 0.045 * Math.sin(lat) * Math.sin(lat);
                // Equatorial ridge: sharp triangular peak along the equator (|lat| < 0.11 rad ~ 6.3 deg)
                let ridge = 0;
                if (Math.abs(lat) < 0.11) {
                    const ridgeFactor = 1.0 - Math.abs(lat) / 0.11;
                    ridge = Math.pow(ridgeFactor, 1.8) * 0.06;
                }
                const newR = r * oblateness * (1.0 + ridge);
                v.setLength(newR);
                pos.setXYZ(i, v.x, v.y, v.z);
            }
        }
        geometry.computeVertexNormals();
    }

    private static getSharedPlaceholderSpriteTex(): THREE.CanvasTexture {
        if (!CelestialBody._sharedPlaceholderSpriteTex) {
            const canvas = document.createElement('canvas');
            canvas.width = 2;
            canvas.height = 2;
            const tex = new THREE.CanvasTexture(canvas);
            tex.userData = { shared: true };
            CelestialBody._sharedPlaceholderSpriteTex = tex;
        }
        return CelestialBody._sharedPlaceholderSpriteTex;
    }

    private static getSharedVelArrowGeo(): THREE.BufferGeometry {
        if (CelestialBody._sharedVelArrowGeo) return CelestialBody._sharedVelArrowGeo;

        const shaft = new THREE.CylinderGeometry(0.022, 0.022, 1.1, 8);
        shaft.rotateX(Math.PI / 2);
        shaft.translate(0, 0, 0.55);

        const head = new THREE.ConeGeometry(0.09, 0.3, 12);
        head.rotateX(Math.PI / 2);
        head.translate(0, 0, 1.25);

        const sPos = shaft.getAttribute('position') as THREE.BufferAttribute;
        const hPos = head.getAttribute('position') as THREE.BufferAttribute;
        const sNorm = shaft.getAttribute('normal') as THREE.BufferAttribute;
        const hNorm = head.getAttribute('normal') as THREE.BufferAttribute;
        const sIdx = shaft.getIndex();
        const hIdx = head.getIndex();

        const totalVerts = sPos.count + hPos.count;
        const positions = new Float32Array(totalVerts * 3);
        positions.set(sPos.array as Float32Array, 0);
        positions.set(hPos.array as Float32Array, sPos.count * 3);

        const normals = new Float32Array(totalVerts * 3);
        if (sNorm && hNorm) {
            normals.set(sNorm.array as Float32Array, 0);
            normals.set(hNorm.array as Float32Array, sNorm.count * 3);
        }

        const merged = new THREE.BufferGeometry();
        merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

        if (sIdx && hIdx) {
            const indices = new Uint16Array(sIdx.count + hIdx.count);
            for (let i = 0; i < sIdx.count; i++) indices[i] = sIdx.getX(i);
            const offset = sPos.count;
            for (let i = 0; i < hIdx.count; i++) indices[sIdx.count + i] = hIdx.getX(i) + offset;
            merged.setIndex(new THREE.BufferAttribute(indices, 1));
        }

        shaft.dispose();
        head.dispose();
        merged.userData.shared = true;
        CelestialBody._sharedVelArrowGeo = merged;
        return merged;
    }

    /**
     * Advance the shared velocity-arrow pulse animation. Call once per frame (not per body) with the
     * real-time delta; paused simulations pass 0 so the chevrons freeze like before.
     */
    static advanceVelocityPulse(rawDelta: number): void {
        if (!(rawDelta > 0)) return;
        CelestialBody._velocityPulseTimer += rawDelta * 2.5;
        CelestialBody._velocityPulseCycle = CelestialBody._velocityPulseTimer % 1.0;
        if (CelestialBody._sharedVelPulseMat) {
            CelestialBody._sharedVelPulseMat.opacity = Math.sin(CelestialBody._velocityPulseCycle * Math.PI) * 0.9;
        }
    }

    private orbitalBasis: OrbitalBasis;

    constructor(data: CelestialBodyData | MoonData, parent: THREE.Object3D, isMoon: boolean = false) {
        this.data = data;
        this.parent = parent;
        this.isMoon = isMoon;
        this.orbitalBasis = getOrbitalBasis(
            this.data.inclination ?? 0,
            this.data.longitudeOfPerihelion ?? 0,
            this.data.longitudeOfAscendingNode ?? 0,
            { px: 1, py: 0, pz: 0, qx: 0, qy: 0, qz: -1 }
        );
        this.mesh = null;
        this.orbitLine = null;
        this.angle = ('baseLongitude' in data && typeof data.baseLongitude === 'number')
            ? data.baseLongitude
            : THREE.MathUtils.seededRandom() * Math.PI * 2;
        this.moons = [];
        this.orbitGroup = new THREE.Group(); // Initialize here to satisfy TS
        this.tiltGroup = new THREE.Group();
        this.ringMeshes = [];
        this.meteorParticles = null;
        this.meteorVelocities = [];
        this.showMeteors = false;

        this.trailLine = null;
        this.trailPositions = [];
        this.showTrails = false;

        this.axesHelper = null;
        this.showAxes = false;

        this.init();
    }
    init() {
        // Group to hold mesh and moons, positioned at orbit
        this.orbitGroup = new THREE.Group();
        this.parent.add(this.orbitGroup);

        // Group to handle axial tilt in J2000 Ecliptic frame (+X = Vernal Equinox, -Z = June Solstice direction)
        this.tiltGroup = new THREE.Group();
        if (this.data.axialTilt !== undefined) {
            this.tiltGroup.rotation.x = -THREE.MathUtils.degToRad(this.data.axialTilt);
        }
        this.orbitGroup.add(this.tiltGroup);

        // Geometry - Start with low-poly LOD geometry at boot and lazily build high-res geometry only when approached
        // (even heightSegments=14 preserves exact lat=0 equatorial ring vertices for Iapetus's walnut ridge).
        const initSegments = this.data.name === 'Sun' ? 32 : (this.isMoon ? 14 : 20);
        const geometry = new THREE.SphereGeometry(this.data.radius, initSegments, initSegments);
        this.lowGeometry = geometry;
        this.highGeometry = null;

        if (this.data.name === 'Iapetus') {
            CelestialBody.applyIapetusShape(geometry);
        }

        // Material
        let material: THREE.Material;

        if (this.data.name === 'Sun') {
            const sunMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 }
                },
                vertexShader: sunVertexShader,
                fragmentShader: sunFragmentShader,
                side: THREE.DoubleSide
            });
            material = sunMaterial;
            this.shaderMaterial = sunMaterial;
        } else if (this.data.name === 'Earth') {
            // High-resolution NASA Blue Marble WebP satellite map of Earth (decoded off-thread)
            const roughnessMap = TextureGenerator.getPlanetRoughnessMap('Earth');
            const textureUrl = `${import.meta.env.BASE_URL}textures/earth_equirectangular.webp`;
            const texture = typeof TextureGenerator.loadStaticImageTexture === 'function'
                ? TextureGenerator.loadStaticImageTexture(textureUrl, {
                    colorSpace: THREE.SRGBColorSpace,
                    anisotropy: TextureGenerator.maxAnisotropy,
                    minFilter: THREE.LinearMipmapLinearFilter,
                    wrapS: THREE.RepeatWrapping,
                    wrapT: THREE.ClampToEdgeWrapping,
                    onImageReady: (img, isFlippedY) => {
                        TextureGenerator.updateEarthRoughnessFromImage(img, isFlippedY);
                    }
                })
                : new THREE.TextureLoader().load(textureUrl, (loadedTex) => {
                    if (loadedTex?.image) {
                        TextureGenerator.updateEarthRoughnessFromImage(loadedTex.image);
                    }
                });

            material = new THREE.MeshStandardMaterial({
                map: texture,
                roughnessMap: roughnessMap,
                roughness: 0.9,
                metalness: 0.05,
                color: 0xffffff
            });
        } else if (this.data.name === 'Moon') {
            // Real Lunar Reconnaissance Orbiter equirectangular map + surface crater relief (decoded off-thread)
            const textureUrl = `${import.meta.env.BASE_URL}textures/moon.webp`;
            const texture = typeof TextureGenerator.loadStaticImageTexture === 'function'
                ? TextureGenerator.loadStaticImageTexture(textureUrl, {
                    colorSpace: THREE.SRGBColorSpace,
                    anisotropy: TextureGenerator.maxAnisotropy,
                    minFilter: THREE.LinearMipmapLinearFilter,
                    wrapS: THREE.RepeatWrapping,
                    wrapT: THREE.ClampToEdgeWrapping
                })
                : new THREE.TextureLoader().load(textureUrl);

            material = new THREE.MeshStandardMaterial({
                map: texture,
                bumpMap: texture,
                bumpScale: 0.018,
                roughness: 0.92,
                metalness: 0.02,
                color: 0xffffff
            });
        } else {
            // Apply 2:1 equirectangular seamless texture + bump relief on rocky/icy cratered worlds.
            // Non-boot moons & outer dwarf planets use a lightweight placeholder during SceneManager
            // construction and swap in their full resolution maps asynchronously after boot.
            const isGasOrCloud = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Venus', 'Titan'].includes(this.data.name);
            const metalness = ['Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(this.data.name) ? 0.0 : 0.05;
            const roughness = isGasOrCloud ? 0.95 : 0.82;
            const buildMaterial = (texture: THREE.Texture, bumpMap: THREE.Texture | null) => new THREE.MeshStandardMaterial({
                map: texture,
                ...(bumpMap ? { bumpMap, bumpScale: 0.02 } : {}),
                roughness,
                metalness,
                color: 0xffffff
            });

            if (typeof TextureGenerator.getOrDeferPlanetSurface === 'function') {
                material = TextureGenerator.getOrDeferPlanetSurface(this.data.name, this.data.color, buildMaterial);
            } else {
                material = buildMaterial(
                    TextureGenerator.getPlanetTexture(this.data.name),
                    TextureGenerator.getPlanetBumpMap(this.data.name)
                );
            }
        }

        this.mesh = new THREE.Mesh(geometry, material);
        if (this.data.name !== 'Sun') {
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
        }
        if (this.data.name === 'Haumea') {
            // Haumea is a fast-spinning, triaxial Jacobi ellipsoid (approx 2,100 x 1,680 x 1,074 km)
            // Normalized scale: equatorial X (longest) = 1.4, polar Y (shortest) = 0.7, equatorial Z (intermediate) = 1.05
            this.mesh.scale.set(1.4, 0.7, 1.05);
        }
        this.tiltGroup.add(this.mesh);

        // --- ATMOSPHERE & SPECIAL FEATURES ---
        if (this.data.name === 'Sun') {
            this.createSolarCorona();
        }
        this.createAtmosphere();

        if (this.data.name === 'Earth') {
            // Earth Cloud Sphere - seamless 2:1 equirectangular crisp white cloud deck (deferred until close/focus)
            const cloudGeometry = new THREE.SphereGeometry(this.data.radius * 1.008, 32, 32);
            const buildCloudMaterial = (cloudTexture: THREE.Texture) => new THREE.MeshStandardMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: 0.88,
                roughness: 0.35,
                metalness: 0.0,
                color: 0xffffff,
                side: THREE.FrontSide,
                blending: THREE.NormalBlending,
                depthWrite: false
            });
            const cloudMaterial = typeof TextureGenerator.getOrDeferPlanetSurface === 'function'
                ? TextureGenerator.getOrDeferPlanetSurface('EarthClouds', 0xffffff, buildCloudMaterial)
                : buildCloudMaterial(TextureGenerator.getPlanetTexture('EarthClouds'));
            this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
            this.cloudMesh.receiveShadow = true;
            this.tiltGroup.add(this.cloudMesh);

            // Meteor Shower (lazily created when enabled)
            if (this.showMeteors) {
                this.createMeteors();
            }

            // Polar Auroras (Northern and Southern Lights)
            this.createEarthAuroras();
        }

        // Real-Time Holographic Orbital Velocity Vector for all orbiting celestial bodies
        if (this.data.distance > 0 && this.data.name !== 'Sun') {
            this.createVelocityVector();
        }

        // Create Orbit Line
        this.createOrbit();

        // Create Trail (lazily created when enabled)
        if (this.showTrails) {
            this.createTrail();
        }

        // Create Rings
        if ('rings' in this.data && this.data.rings) {
            this.createRings();
        }

        // Create Axis (lazily created when enabled)
        if (this.showAxes) {
            this.createAxis();
        }

        // Create Labels
        this.createLabel();



        // Create Moons
        if ('moons' in this.data && this.data.moons) {
            this.data.moons.forEach(moonData => {
                const moon = new CelestialBody(moonData, this.orbitGroup, true);
                this.moons.push(moon);
            });
        }
    }


    createSolarCorona() {
        const coronaGeo = new THREE.SphereGeometry(this.data.radius * 1.28, 24, 24);
        const coronaMat = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(1.0, 0.58, 0.14) },
                innerColor: { value: new THREE.Color(1.0, 0.88, 0.45) }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vViewPos;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPos = -mvPosition.xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform vec3 innerColor;
                varying vec3 vNormal;
                varying vec3 vViewPos;
                void main() {
                    // BackSide normal faces inward; dot(-vNormal, viewDir) peaks toward center and fades smoothly to 0 at outer corona edge
                    vec3 viewDir = normalize(vViewPos);
                    float radial = clamp(dot(-normalize(vNormal), viewDir), 0.0, 1.0);
                    float halo = pow(radial, 3.6) * 0.58;
                    vec3 col = mix(glowColor, innerColor, pow(radial, 2.0));
                    gl_FragColor = vec4(col, halo);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        this.coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
        this.tiltGroup.add(this.coronaMesh);
    }

    private renderLabelCanvas(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const localizedName = i18n.getBodyName(this.data.name) || this.data.name;
        const font = 'bold 34px "Exo 2", "Space Grotesk", "Outfit", Arial, sans-serif';
        ctx.font = font;
        const measuredWidth = typeof ctx.measureText === 'function' ? ctx.measureText(localizedName).width : localizedName.length * 20;
        const pillWidth = Math.max(224, Math.ceil(measuredWidth + 56));
        const canvasWidth = Math.max(256, pillWidth + 32);

        if (canvas.width !== canvasWidth) {
            canvas.width = canvasWidth;
        }
        canvas.height = 256;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const pillX = cx - pillWidth / 2;
        const accentHex = '#' + (this.data.color || 0x38bdf8).toString(16).padStart(6, '0');

        // Subtle dark glass pill behind text
        ctx.fillStyle = 'rgba(8, 14, 30, 0.82)';
        ctx.fillRect(pillX, 26, pillWidth, 54);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.lineWidth = 2;
        if (typeof ctx.strokeRect === 'function') {
            ctx.strokeRect(pillX, 26, pillWidth, 54);
        }

        ctx.font = font;
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(localizedName, cx, 64);

        // Observatory target reticle & pointer
        ctx.fillStyle = accentHex;
        ctx.beginPath();
        ctx.arc(cx, 132, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx - 24, 138);
        ctx.lineTo(cx, 190);
        ctx.lineTo(cx + 24, 138);
        ctx.fill();

        ctx.fillStyle = '#040917';
        ctx.beginPath();
        ctx.arc(cx, 132, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    createLabel() {
        const material = new THREE.SpriteMaterial({
            map: CelestialBody.getSharedPlaceholderSpriteTex(),
            transparent: true,
            depthTest: false,
            sizeAttenuation: false
        });
        this.labelSprite = new THREE.Sprite(material);
        this.labelSprite.scale.set(0.05, 0.05, 1);
        this.labelSprite.position.set(0, this.data.radius * 1.2, 0);
        this.labelSprite.visible = this.showLabel;
        if (this.showLabel) {
            this.ensureLabelRendered();
        }
        // Don't add it to tiltGroup so the label stays upright
        this.orbitGroup.add(this.labelSprite);
    }

    ensureLabelRendered() {
        if (this.labelRendered || !this.labelSprite) return;
        this.labelRendered = true;
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        this.renderLabelCanvas(canvas);
        const texture = new THREE.CanvasTexture(canvas);
        this.labelSprite.material.map = texture;
        this.labelSprite.material.needsUpdate = true;
        const aspect = canvas.width / canvas.height;
        this.labelSprite.scale.set(0.05 * aspect, 0.05, 1);
    }

    refreshLabel() {
        if (this.labelRendered && this.labelSprite && this.labelSprite.material?.map) {
            const canvas = this.labelSprite.material.map.image as HTMLCanvasElement | undefined;
            if (canvas && typeof canvas.getContext === 'function') {
                this.renderLabelCanvas(canvas);
                this.labelSprite.material.map.needsUpdate = true;
                const aspect = canvas.width / canvas.height;
                this.labelSprite.scale.set(0.05 * aspect, 0.05, 1);
            }
        }
        this.moons.forEach(moon => moon.refreshLabel());
    }

    createAtmosphere() {
        const atmosphereConfigs: Record<string, { color: number; scale: number; coefficient: number; power: number }> = {
            'Earth': { color: 0x38bdf8, scale: 1.018, coefficient: 0.42, power: 4.2 },
            'Venus': { color: 0xf59e0b, scale: 1.022, coefficient: 0.44, power: 3.6 },
            'Mars': { color: 0xf97316, scale: 1.012, coefficient: 0.28, power: 4.8 },
            'Jupiter': { color: 0xfde68a, scale: 1.012, coefficient: 0.28, power: 4.4 },
            'Saturn': { color: 0xfef08a, scale: 1.012, coefficient: 0.28, power: 4.4 },
            'Uranus': { color: 0x67e8f9, scale: 1.018, coefficient: 0.38, power: 3.9 },
            'Neptune': { color: 0x3b82f6, scale: 1.020, coefficient: 0.44, power: 3.9 },
            'Titan': { color: 0xd97706, scale: 1.025, coefficient: 0.34, power: 3.6 }
        };

        const config = atmosphereConfigs[this.data.name];
        if (!config) return;

        const atmosphereGeometry = CelestialBody.getSharedAtmoLowGeo();
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(config.color) },
                coefficient: { value: config.coefficient },
                power: { value: config.power }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPos;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vWorldNormal = normalize(mat3(modelMatrix) * normal);
                    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vPosition = mvPosition.xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float coefficient;
                uniform float power;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPos;
                void main() {
                    vec3 viewDir = normalize(-vPosition);
                    float fresnel = 1.0 - max(0.0, dot(normalize(vNormal), viewDir));

                    // Solar direction from world position toward Sun at (0, 0, 0)
                    vec3 sunDir = length(vWorldPos) > 0.0001 ? normalize(-vWorldPos) : vec3(0.0, 1.0, 0.0);
                    float sunDot = dot(normalize(vWorldNormal), sunDir);

                    // Day-side Rayleigh scattering + twilight terminator band, fading to 6% subtle airglow on night side
                    float dayScatter = mix(0.06, 1.0, smoothstep(-0.32, 0.42, sunDot));
                    float twilightBand = exp(-pow((sunDot + 0.04) * 3.6, 2.0)) * 0.32;
                    vec3 scatteredColor = mix(glowColor, glowColor * vec3(1.22, 0.86, 0.68), twilightBand);

                    float intensity = pow(fresnel, power) * coefficient * dayScatter;
                    gl_FragColor = vec4(scatteredColor, intensity);
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });

        this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.atmosphereMesh.scale.setScalar(this.data.radius * config.scale);
        this.tiltGroup.add(this.atmosphereMesh);
    }

    createAxis() {
        if (this.data.name === 'Sun') return;

        const axisLength = this.data.radius * 2.5;

        this.axesHelper = new THREE.AxesHelper(axisLength);
        this.axesHelper.visible = this.showAxes;

        // Add to tiltGroup so it shows the actual rotation axis
        this.tiltGroup.add(this.axesHelper);
    }

    createRings() {
        if (!('rings' in this.data) || !this.data.rings || this.data.rings.length === 0) return;

        // Compute global radial span across all sub-rings of this body so multi-part ring systems
        // (e.g. Saturn's inner C/B rings + outer A ring across the Cassini gap) sample their true
        // radial fraction of the ring texture rather than duplicating the entire C->A texture per sub-ring.
        const minInner = Math.min(...this.data.rings.map(r => r.innerRadius));
        const maxOuter = Math.max(...this.data.rings.map(r => r.outerRadius));
        const totalSpan = Math.max(0.0001, maxOuter - minInner);
        const ringTexture = TextureGenerator.getRingTexture(this.data.name);
        const segments = 96;

        const bandGeoms: THREE.BufferGeometry[] = [];
        let totalVerts = 0;
        let totalIndices = 0;

        this.data.rings.forEach(ringData => {
            const geometry = new THREE.RingGeometry(ringData.innerRadius, ringData.outerRadius, segments);

            // Compute normalized radial UV coordinate u across [minInner, maxOuter]
            const pos = geometry.attributes.position;
            const uvs = geometry.attributes.uv;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const r = Math.sqrt(x * x + y * y);
                const u = Math.max(0, Math.min(1, (r - minInner) / totalSpan));
                uvs.setXY(i, u, 0.5);
            }
            uvs.needsUpdate = true;

            bandGeoms.push(geometry);
            totalVerts += pos.count;
            const idx = geometry.getIndex();
            totalIndices += idx ? idx.count : pos.count;
        });

        let finalGeo: THREE.BufferGeometry;
        if (bandGeoms.length === 1) {
            finalGeo = bandGeoms[0];
        } else {
            const mergedPos = new Float32Array(totalVerts * 3);
            const mergedNorm = new Float32Array(totalVerts * 3);
            const mergedUvs = new Float32Array(totalVerts * 2);
            const mergedIndices = new Uint32Array(totalIndices);
            let vertOffset = 0;
            let idxOffset = 0;

            for (let b = 0; b < bandGeoms.length; b++) {
                const g = bandGeoms[b];
                const pos = g.getAttribute('position') as THREE.BufferAttribute;
                const norm = g.getAttribute('normal') as THREE.BufferAttribute;
                const uv = g.getAttribute('uv') as THREE.BufferAttribute;
                for (let v = 0; v < pos.count; v++) {
                    const pBase = (vertOffset + v) * 3;
                    mergedPos[pBase] = pos.getX(v);
                    mergedPos[pBase + 1] = pos.getY(v);
                    mergedPos[pBase + 2] = pos.getZ(v);
                    mergedNorm[pBase] = norm.getX(v);
                    mergedNorm[pBase + 1] = norm.getY(v);
                    mergedNorm[pBase + 2] = norm.getZ(v);
                    const uBase = (vertOffset + v) * 2;
                    mergedUvs[uBase] = uv.getX(v);
                    mergedUvs[uBase + 1] = uv.getY(v);
                }
                const idx = g.getIndex();
                if (idx) {
                    for (let k = 0; k < idx.count; k++) {
                        mergedIndices[idxOffset + k] = idx.getX(k) + vertOffset;
                    }
                    idxOffset += idx.count;
                } else {
                    for (let k = 0; k < pos.count; k++) {
                        mergedIndices[idxOffset + k] = vertOffset + k;
                    }
                    idxOffset += pos.count;
                }
                vertOffset += pos.count;
                g.dispose();
            }

            finalGeo = new THREE.BufferGeometry();
            finalGeo.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
            finalGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
            finalGeo.setAttribute('uv', new THREE.BufferAttribute(mergedUvs, 2));
            finalGeo.setIndex(new THREE.BufferAttribute(mergedIndices, 1));
        }

        const material = new THREE.MeshStandardMaterial({
            map: ringTexture,
            side: THREE.DoubleSide,
            transparent: true,
            alphaTest: 0.04,
            roughness: 0.78,
            metalness: 0.0,
            depthWrite: false
        });
        const ringMesh = new THREE.Mesh(finalGeo, material);

        // Planet casts spherical shadow onto rings; ring plane must not self-shadow in PointLight cubemap
        ringMesh.castShadow = false;
        ringMesh.receiveShadow = true;

        // Rings are aligned with the planet's equator in the XZ plane
        ringMesh.rotation.x = Math.PI / 2;

        // Attach to tiltGroup so rings inherit planet's axial tilt
        if (this.mesh) {
            this.tiltGroup.add(ringMesh);
        } else {
            this.orbitGroup.add(ringMesh);
        }
        this.ringMeshes.push(ringMesh);
    }

    createMeteors() {
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 6); // 2 points per line (start and end)
        const colors = new Float32Array(particleCount * 6);

        for (let i = 0; i < particleCount; i++) {
            this.meteorVelocities.push(new THREE.Vector3());
            this.resetMeteor(i, positions, colors);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });

        this.meteorParticles = new THREE.LineSegments(geometry, material);
        this.meteorParticles.visible = this.showMeteors;
        this.orbitGroup.add(this.meteorParticles);
    }

    resetMeteor(index: number, positions: Float32Array, colors: Float32Array) {
        // Spawn distance: 1.5 to 3 times Earth's radius
        const radius = this.data.radius;
        const spawnDist = radius * (1.5 + THREE.MathUtils.seededRandom() * 1.5);

        // Random direction from center
        const theta = THREE.MathUtils.seededRandom() * Math.PI * 2;
        const phi = Math.acos(THREE.MathUtils.seededRandom() * 2 - 1);

        const x = spawnDist * Math.sin(phi) * Math.cos(theta);
        const y = spawnDist * Math.sin(phi) * Math.sin(theta);
        const z = spawnDist * Math.cos(phi);

        // Initial position
        const i6 = index * 6;
        positions[i6] = x;
        positions[i6 + 1] = y;
        positions[i6 + 2] = z;

        // Velocity (towards the planet center + some randomness)
        const dir = CelestialBody._tempMeteorDir.set(x, y, z).normalize().negate();

        // Add random scatter to direction
        dir.x += (THREE.MathUtils.seededRandom() - 0.5) * 0.5;
        dir.y += (THREE.MathUtils.seededRandom() - 0.5) * 0.5;
        dir.z += (THREE.MathUtils.seededRandom() - 0.5) * 0.5;
        dir.normalize();

        // Speed: 2 to 5
        const speed = 2 + THREE.MathUtils.seededRandom() * 3;
        this.meteorVelocities[index].copy(dir.multiplyScalar(speed));

        // Tail position (initially same as head)
        positions[i6 + 3] = x;
        positions[i6 + 4] = y;
        positions[i6 + 5] = z;

        // Colors: Head is bright white/yellow, Tail is fading orange/red
        // Head
        colors[i6] = 1;
        colors[i6 + 1] = 1;
        colors[i6 + 2] = 0.8;
        // Tail
        colors[i6 + 3] = 1;
        colors[i6 + 4] = 0.4;
        colors[i6 + 5] = 0;
    }

    updateMeteors(deltaTime: number, rawDelta?: number) {
        if (!this.meteorParticles || !this.showMeteors) return;

        const effectiveStep = (rawDelta !== undefined && rawDelta > 0) ? rawDelta : deltaTime;
        if (effectiveStep <= 0) return;

        const positions = this.meteorParticles.geometry.attributes.position.array as Float32Array;
        const colors = this.meteorParticles.geometry.attributes.color.array as Float32Array;
        const radius = this.data.radius;
        const innerSq = radius * radius * 1.05;
        const outerSq = radius * radius * 25;
        let anyReset = false;

        for (let i = 0; i < this.meteorVelocities.length; i++) {
            const i6 = i * 6;

            // Current head position
            const hx = positions[i6];
            const hy = positions[i6 + 1];
            const hz = positions[i6 + 2];

            // Move head
            const vel = this.meteorVelocities[i];
            const nx = hx + vel.x * effectiveStep * 10;
            const ny = hy + vel.y * effectiveStep * 10;
            const nz = hz + vel.z * effectiveStep * 10;

            // Update positions
            // Tail becomes old head
            positions[i6 + 3] = hx;
            positions[i6 + 4] = hy;
            positions[i6 + 5] = hz;

            // New head
            positions[i6] = nx;
            positions[i6 + 1] = ny;
            positions[i6 + 2] = nz;

            // Check if it hit the atmosphere/planet or flew away
            const distSq = nx * nx + ny * ny + nz * nz;
            // Reset if inside planet or too far
            if (distSq < innerSq || distSq > outerSq) {
                this.resetMeteor(i, positions, colors);
                anyReset = true;
            }
        }

        this.meteorParticles.geometry.attributes.position.needsUpdate = true;
        if (anyReset) {
            this.meteorParticles.geometry.attributes.color.needsUpdate = true;
        }
    }

    createEarthAuroras() {
        if (this.data.name !== 'Earth') return;

        this.auroraMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorBase: { value: new THREE.Color(0.12, 0.95, 0.42) },
                colorMid: { value: new THREE.Color(0.08, 0.78, 0.95) },
                colorTop: { value: new THREE.Color(0.68, 0.18, 0.95) },
                opacity: { value: 0.85 }
            },
            vertexShader: auroraVertexShader,
            fragmentShader: auroraFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const r = this.data.radius;
        // Auroral ovals hover at geomagnetic polar caps (~70-75 deg latitude)
        const northGeo = new THREE.CylinderGeometry(r * 0.33, r * 0.28, r * 0.12, 48, 4, true);
        this.auroraMeshNorth = new THREE.Mesh(northGeo, this.auroraMaterial);
        this.auroraMeshNorth.position.set(0, r * 0.96, 0);
        this.tiltGroup.add(this.auroraMeshNorth);

        const southGeo = new THREE.CylinderGeometry(r * 0.28, r * 0.33, r * 0.12, 48, 4, true);
        this.auroraMeshSouth = new THREE.Mesh(southGeo, this.auroraMaterial);
        this.auroraMeshSouth.position.set(0, -r * 0.96, 0);
        this.tiltGroup.add(this.auroraMeshSouth);
    }

    getOrbitalSpeed(): number {
        const knownSpeeds: Record<string, number> = {
            'Mercury': 47.4,
            'Venus': 35.0,
            'Earth': 29.8,
            'Mars': 24.1,
            'Jupiter': 13.1,
            'Saturn': 9.7,
            'Uranus': 6.8,
            'Neptune': 5.4,
            'Pluto': 4.7,
            'Ceres': 17.9,
            'Haumea': 4.5,
            'Makemake': 4.4,
            'Eris': 3.4,
            'Moon': 1.0,
            'Io': 17.3,
            'Europa': 13.7,
            'Ganymede': 10.9,
            'Callisto': 8.2,
            'Titan': 5.6,
            'Triton': 4.4,
            'Charon': 0.2
        };
        if (knownSpeeds[this.data.name] !== undefined) {
            return knownSpeeds[this.data.name];
        }
        if (this.data.distance > 0 && this.data.period > 0) {
            const speed = 29.8 / Math.sqrt(Math.max(0.1, this.data.distance));
            return parseFloat(speed.toFixed(1));
        }
        return 20.0;
    }

    getVelocityBodyScale(): number {
        const r = this.data.radius;
        return r <= 1.0 ? Math.max(0.12, r) : Math.min(2.8, Math.pow(r, 0.65));
    }

    createVelocityVector() {
        if (this.data.distance === 0 || this.data.name === 'Sun') return;
        // Include all major planets, dwarf planets, and major moons (Moon, etc.)
        if (this.isMoon && this.data.name !== 'Moon') return;

        this.velocityVectorGroup = new THREE.Group();

        // Responsive scaling based on celestial body radius
        const bodyScale = this.getVelocityBodyScale();

        if (!CelestialBody._sharedVelHeadMat) {
            CelestialBody._sharedVelHeadMat = new THREE.MeshBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.9
            });
            CelestialBody._sharedVelHeadMat.userData.shared = true;
        }
        if (!CelestialBody._sharedVelPulseGeo) {
            CelestialBody._sharedVelPulseGeo = new THREE.ConeGeometry(0.065, 0.18, 12);
            CelestialBody._sharedVelPulseGeo.rotateX(Math.PI / 2);
            CelestialBody._sharedVelPulseGeo.userData.shared = true;
        }

        // Combined direction shaft + arrow head in a single shared BufferGeometry (1 draw call instead of 2)
        const shaftLength = 1.1 * bodyScale;
        const arrowMesh = new THREE.Mesh(CelestialBody.getSharedVelArrowGeo(), CelestialBody._sharedVelHeadMat);
        arrowMesh.scale.setScalar(bodyScale);
        this.velocityArrowMesh = arrowMesh;
        this.velocityVectorGroup.add(arrowMesh);

        // Forward-pulsing chevron: one material shared by every body (driven by a common clock, see
        // advanceVelocityPulse) so the arrows don't each force a separate material/uniform upload
        if (!CelestialBody._sharedVelPulseMat) {
            CelestialBody._sharedVelPulseMat = new THREE.MeshBasicMaterial({
                color: 0x7dd3fc,
                transparent: true,
                opacity: 0.85
            });
            CelestialBody._sharedVelPulseMat.userData.shared = true;
        }
        this.velocityPulseChevron = new THREE.Mesh(CelestialBody._sharedVelPulseGeo, CelestialBody._sharedVelPulseMat);
        this.velocityPulseChevron.scale.setScalar(bodyScale);
        this.velocityPulseChevron.position.z = shaftLength * 0.5;
        this.velocityVectorGroup.add(this.velocityPulseChevron);

        // Telemetry readout sprite (canvas texture rendered lazily when camera approaches within LOD range)
        const spriteMat = new THREE.SpriteMaterial({
            map: CelestialBody.getSharedPlaceholderSpriteTex(),
            transparent: true,
            depthTest: true,
            sizeAttenuation: true
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.4 * bodyScale, 0.35 * bodyScale, 1);
        sprite.position.set(0, 0.38 * bodyScale, 0.65 * bodyScale);
        this.velocityLabelSprite = sprite;
        this.velocityVectorGroup.add(sprite);

        // Inherit orbit visibility
        this.velocityVectorGroup.visible = this.orbitLine?.visible ?? true;

        this.orbitGroup.add(this.velocityVectorGroup);
    }

    private ensureVelocityLabelRendered() {
        if (this.velocityLabelRendered || !this.velocityLabelSprite) return;
        this.velocityLabelRendered = true;
        const speed = this.getOrbitalSpeed();
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.fillRect(0, 0, 256, 64);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            if (typeof ctx.strokeRect === 'function') {
                ctx.strokeRect(2, 2, 252, 60);
            }

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`➜ ${speed} km/s`, 128, 32);
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.velocityLabelSprite.material.map = texture;
        this.velocityLabelSprite.material.needsUpdate = true;
    }

    createTrail() {
        if (this.data.distance === 0) return; // Sun or center

        const maxTrailLength = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(maxTrailLength * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.LineBasicMaterial({
            color: this.data.color || 0xffffff,
            transparent: true,
            opacity: 0.5
        });

        this.trailLine = new THREE.Line(geometry, material);
        // Do not add to orbitGroup as it's local space, add to parent so it traces global/parent path
        this.trailLine.visible = this.showTrails;
        this.trailLine.frustumCulled = false;
        markLineBatchable(this.trailLine);
        this.parent.add(this.trailLine);
    }

    updateTrail() {
        if (!this.trailLine || !this.showTrails) return;

        const maxTrailLength = 100;

        // orbitGroup is a direct child of this.parent, so its local position in parent space is orbitGroup.position
        CelestialBody._tempLocalPos.copy(this.orbitGroup.position);

        // Only add a point if we've moved a certain distance to avoid too many points when slow
        const minStep = this.realisticDistances ? 0.002 : 0.01;
        if (this.trailPositions.length === 0 || CelestialBody._tempLocalPos.distanceTo(this.trailPositions[this.trailPositions.length - 1]) > minStep) {
            if (this.trailPositions.length >= maxTrailLength) {
                // Recycle oldest Vector3 instance to eliminate per-frame GC churn
                const recycled = this.trailPositions.shift()!;
                recycled.copy(CelestialBody._tempLocalPos);
                this.trailPositions.push(recycled);
            } else {
                this.trailPositions.push(CelestialBody._tempLocalPos.clone());
            }

            const positions = this.trailLine.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < this.trailPositions.length; i++) {
                positions[i * 3] = this.trailPositions[i].x;
                positions[i * 3 + 1] = this.trailPositions[i].y;
                positions[i * 3 + 2] = this.trailPositions[i].z;
            }

            this.trailLine.geometry.setDrawRange(0, this.trailPositions.length);
            this.trailLine.geometry.attributes.position.needsUpdate = true;
        }
    }

    rebuildOrbit(realistic: boolean, sizeRatio: number = 1.0) {
        this.realisticDistances = realistic;
        this.lastComputedAngle = NaN;
        this.hasInitializedVelocityTransform = false;

        const displayRadius = this.data.displayRadius ?? this.data.radius;
        // 1 displayRadius (Earth) = 6371 km. 1 AU = 149597870 km. 1 AU in scene = 130 units.
        const realisticRadius = displayRadius * 0.005536 * sizeRatio;
        const scale = realistic ? (realisticRadius / this.data.radius) : 1.0;
        this.tiltGroup.scale.setScalar(scale);

        if (this.velocityVectorGroup) {
            this.velocityVectorGroup.scale.setScalar(scale);
        }

        // Clear stale trail vertices when switching between schematic and true 1:1 scale
        if (this.trailLine) {
            this.trailPositions.length = 0;
            this.trailLine.geometry.setDrawRange(0, 0);
        }

        if (this.labelSprite) {
            const currentRadius = realistic ? realisticRadius : this.data.radius;
            this.labelSprite.position.set(0, currentRadius * 1.2, 0);
        }

        if (this.orbitLine) {
            this.parent.remove(this.orbitLine);
            this.orbitLine.geometry.dispose();
            (this.orbitLine.material as THREE.Material).dispose();
            this.orbitLine = null;
        }

        if (this.data.distance !== 0) {
            this.createOrbit();
        }

        this.moons.forEach(moon => moon.rebuildOrbit(realistic, sizeRatio));
    }

    createOrbit() {
        if (this.data.distance === 0) return; // Sun or center

        const segments = 256;
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array((segments + 1) * 3);

        const a = this.realisticDistances && this.data.distanceAU ? this.data.distanceAU * 130 : this.data.distance;
        const e = this.realisticDistances && this.data.eccentricity ? this.data.eccentricity : 0;
        const inc = this.data.inclination ?? 0;
        const varpi = this.data.longitudeOfPerihelion ?? 0;
        const bigOmega = this.data.longitudeOfAscendingNode ?? 0;

        for (let i = 0; i <= segments; i++) {
            const E = (i / segments) * Math.PI * 2;
            const pt = computeKeplerianOrbitPoint(E, a, e, inc, varpi, bigOmega, this.orbitalBasis);
            const idx = i * 3;
            vertices[idx] = pt.x;
            vertices[idx + 1] = pt.y;
            vertices[idx + 2] = pt.z;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const material = new THREE.LineBasicMaterial({
            color: this.data.color || 0x38bdf8,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending
        });

        this.orbitLine = new THREE.LineLoop(geometry, material);
        this.orbitLine.matrixAutoUpdate = false;
        this.orbitLine.updateMatrix?.();
        markLineBatchable(this.orbitLine);

        this.parent.add(this.orbitLine);
    }

    update(deltaTime: number, simTimePassed?: number, rawDelta?: number) {
        // Update position
        const isRetrograde = 'retrograde' in this.data && Boolean(this.data.retrograde);
        const dir = isRetrograde ? -1 : 1;
        const speedMultiplier = 0.5;
        const speed = this.data.period === 0 ? 0 : (dir / this.data.period) * speedMultiplier;

        if (simTimePassed !== undefined) {
            const baseAngle = ('baseLongitude' in this.data && typeof this.data.baseLongitude === 'number') ? this.data.baseLongitude : 0;
            this.angle = (((baseAngle + speed * simTimePassed) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        } else {
            this.angle = (((this.angle + speed * deltaTime) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        }

        const st = this.cachedKeplerState;
        const needsKeplerUpdate =
            this.realisticDistances !== this.lastComputedRealistic ||
            !(Math.abs(this.angle - this.lastComputedAngle) < 1e-7);

        if (needsKeplerUpdate) {
            this.lastComputedAngle = this.angle;
            this.lastComputedRealistic = this.realisticDistances;

            if (this.data.distance !== 0) {
                const a = this.realisticDistances && this.data.distanceAU ? this.data.distanceAU * 130 : this.data.distance;
                computeKeplerianState(
                    this.angle,
                    a,
                    this.data.eccentricity ?? 0,
                    !this.realisticDistances,
                    this.data.inclination ?? 0,
                    this.data.longitudeOfPerihelion ?? 0,
                    this.data.longitudeOfAscendingNode ?? 0,
                    dir,
                    st,
                    this.orbitalBasis
                );
                this.orbitGroup.position.set(st.x, st.y, st.z);
            } else {
                st.x = 0;
                st.y = 0;
                st.z = 0;
                st.tx = 0;
                st.ty = 0;
                st.tz = -1;
                this.orbitGroup.position.set(0, 0, 0);
            }
        }

        // Rotate planet or moon on its axis (around local Y axis, tilted via tiltGroup)
        if (this.mesh) {
            if ('tidallyLocked' in this.data && this.data.tidallyLocked && this.data.distance !== 0) {
                // Keep local +X (u = 0.5 prime meridian / lunar near-side center) facing parent body at (0, 0, 0)
                if (needsKeplerUpdate) {
                    this.mesh.rotation.y = Math.atan2(st.z, -st.x);
                }
            } else if (simTimePassed !== undefined) {
                const daysSinceJ2000 = (simTimePassed * 365.25) / (Math.PI * 4);
                if (this.data.name === 'Earth') {
                    this.mesh.rotation.y = computeGMSTRadians(daysSinceJ2000);
                } else {
                    const rotationDays = ('rotationPeriodDays' in this.data && this.data.rotationPeriodDays)
                        ? this.data.rotationPeriodDays
                        : (this.data.name === 'Haumea' ? 0.16314 : 1.0);
                    const baseRot = ('baseRotation' in this.data && typeof this.data.baseRotation === 'number')
                        ? this.data.baseRotation
                        : 0;
                    const turns = (((daysSinceJ2000 / rotationDays) % 1) + 1) % 1;
                    this.mesh.rotation.y = (baseRot + turns * Math.PI * 2) % (Math.PI * 2);
                }
            } else {
                const rotationDays = ('rotationPeriodDays' in this.data && this.data.rotationPeriodDays)
                    ? this.data.rotationPeriodDays
                    : (this.data.name === 'Haumea' ? 0.16314 : 1.0);
                const daysDelta = (deltaTime * 365.25) / (Math.PI * 4);
                this.mesh.rotation.y = (this.mesh.rotation.y + (daysDelta / rotationDays) * Math.PI * 2) % (Math.PI * 2);
            }
        }

        // Rotate Clouds coupled to planetary surface spin plus subtle real-time atmospheric drift
        if (this.cloudMesh) {
            const atmosphericDrift = (rawDelta !== undefined && rawDelta > 0) ? rawDelta * 0.004 : 0;
            this.cloudDriftOffset = (this.cloudDriftOffset + atmosphericDrift + deltaTime * 0.6) % (Math.PI * 2);
            this.cloudMesh.rotation.y = (this.mesh ? this.mesh.rotation.y : 0) + this.cloudDriftOffset;
        }

        // Update Shader Time
        if (this.shaderMaterial) {
            const plasmaDelta = (rawDelta !== undefined && rawDelta > 0) ? rawDelta * 0.45 : deltaTime;
            this.shaderMaterial.uniforms.time.value += plasmaDelta;
        }

        // Update Earth Polar Auroras
        if (this.auroraMaterial && rawDelta !== undefined && rawDelta > 0) {
            this.auroraMaterial.uniforms.time.value += rawDelta * 1.8;
        }

        // Update Orbital Velocity Vector (zero per-frame heap allocations)
        if (this.velocityVectorGroup && this.velocityVectorGroup.visible && this.data.distance !== 0) {
            const bodyScale = this.getVelocityBodyScale();
            if (needsKeplerUpdate || !this.hasInitializedVelocityTransform) {
                this.hasInitializedVelocityTransform = true;
                const tangent = CelestialBody._tempTangent.set(st.tx, st.ty, st.tz).normalize();
                const visualScale = this.tiltGroup ? this.tiltGroup.scale.x : 1.0;
                const r = this.data.radius;
                const clearanceR = this.data.name === 'Haumea' ? r * 1.45 : r;
                const offsetDist = (clearanceR * 1.35 + bodyScale * 0.4) * visualScale;
                this.velocityVectorGroup.position.copy(tangent).multiplyScalar(offsetDist);
                this.velocityVectorGroup.quaternion.setFromUnitVectors(CelestialBody._unitZ, tangent);
            }

            if (this.velocityPulseChevron && this.velocityPulseChevron.visible) {
                this.velocityPulseChevron.position.z = (0.2 + CelestialBody._velocityPulseCycle * 0.9) * bodyScale;
            }
        }

        this.updateMeteors(deltaTime, rawDelta);
        this.updateTrail();

        // Update moons
        this.moons.forEach(moon => moon.update(deltaTime, simTimePassed, rawDelta));
    }

    private getOrCreateHighGeometry(): THREE.BufferGeometry {
        if (!this.highGeometry) {
            let segments = 48;
            if (this.data.name === 'Iapetus') {
                segments = 64;
            } else if (this.isMoon) {
                segments = this.data.radius < 0.5 ? 24 : 32;
            } else if (this.data.radius > 3 || this.data.name === 'Earth') {
                segments = 64;
            }
            this.highGeometry = new THREE.SphereGeometry(this.data.radius, segments, segments);
            if (this.data.name === 'Iapetus') {
                CelestialBody.applyIapetusShape(this.highGeometry);
            }
        }
        return this.highGeometry;
    }

    updateLOD(cameraWorldPos: THREE.Vector3, isFocused: boolean = false) {
        const worldPos = CelestialBody._tempWorldPos;
        this.orbitGroup.getWorldPosition(worldPos);
        const distSq = cameraWorldPos.distanceToSquared(worldPos);
        const scale = this.tiltGroup ? this.tiltGroup.scale.x : 1.0;
        const effectiveRadius = Math.max(0.05, this.data.radius * scale);

        const geomLodMaxDist = this.data.name === 'Sun'
            ? effectiveRadius * 12
            : Math.max(140, effectiveRadius * 42);
        const useHighGeom = isFocused || distSq <= geomLodMaxDist * geomLodMaxDist;

        if (this.auroraMeshNorth && this.auroraMeshSouth) {
            const auroraMaxDist = effectiveRadius * 65;
            const showAurora = isFocused || distSq <= auroraMaxDist * auroraMaxDist;
            this.auroraMeshNorth.visible = showAurora;
            this.auroraMeshSouth.visible = showAurora;
        }

        if (this.cloudMesh) {
            const cloudMaxDist = effectiveRadius * 95;
            const showClouds = isFocused || distSq <= cloudMaxDist * cloudMaxDist;
            this.cloudMesh.visible = showClouds;
            if (showClouds) {
                TextureGenerator.ensureDeferredLoaded?.('EarthClouds');
            }
        }

        if (this.atmosphereMesh) {
            const atmoMaxDist = effectiveRadius * 180;
            const showAtmo = isFocused || distSq <= atmoMaxDist * atmoMaxDist;
            this.atmosphereMesh.visible = showAtmo;
            if (showAtmo) {
                const targetAtmoGeo = useHighGeom ? CelestialBody.getSharedAtmoHighGeo() : CelestialBody.getSharedAtmoLowGeo();
                if (this.atmosphereMesh.geometry !== targetAtmoGeo) {
                    this.atmosphereMesh.geometry = targetAtmoGeo;
                }
            }
        }

        const moonShadowMaxDist = Math.max(140, effectiveRadius * 22);
        const enableMoonShadows = isFocused || distSq <= moonShadowMaxDist * moonShadowMaxDist;
        const detailTexMaxDist = Math.max(60, effectiveRadius * 18);
        const loadDetailTextures = isFocused || distSq <= detailTexMaxDist * detailTexMaxDist;
        if (loadDetailTextures) {
            TextureGenerator.ensureDeferredLoaded?.(this.data.name);
        }

        if (this.labelSprite?.visible) {
            this.ensureLabelRendered();
        }

        const velArrowMaxDist = Math.max(190, effectiveRadius * 115);
        const showVelArrow = isFocused || distSq <= velArrowMaxDist * velArrowMaxDist;
        if (this.velocityArrowMesh) {
            this.velocityArrowMesh.visible = showVelArrow;
        }

        const velDetailMaxDist = Math.max(95, effectiveRadius * 45);
        const showVelDetail = isFocused || distSq <= velDetailMaxDist * velDetailMaxDist;
        if (this.velocityPulseChevron) {
            this.velocityPulseChevron.visible = showVelDetail;
        }
        if (this.velocityLabelSprite) {
            this.velocityLabelSprite.visible = showVelDetail;
            if (showVelDetail) {
                this.ensureVelocityLabelRendered();
            }
        }

        if (this.mesh && this.lowGeometry) {
            const targetGeom = useHighGeom ? this.getOrCreateHighGeometry() : this.lowGeometry;
            if (this.mesh.geometry !== targetGeom) {
                this.mesh.geometry = targetGeom;
            }
        }

        if (this.mesh && !this.isMoon && this.data.name !== 'Sun') {
            this.mesh.castShadow = this.ringMeshes.length > 0 || (this.moons.length > 0 && enableMoonShadows);
        }

        for (let i = 0; i < this.moons.length; i++) {
            const moon = this.moons[i];
            const moonRadius = Math.max(0.02, moon.data.radius * scale);
            const moonVisMaxDist = Math.max(180, moonRadius * 1500);
            const showMoonMesh = isFocused || distSq <= moonVisMaxDist * moonVisMaxDist;
            if (moon.mesh) {
                moon.mesh.visible = showMoonMesh;
                moon.mesh.castShadow = showMoonMesh && enableMoonShadows;
                if (showMoonMesh && moon.lowGeometry) {
                    const targetMoonGeom = useHighGeom ? moon.getOrCreateHighGeometry() : moon.lowGeometry;
                    if (moon.mesh.geometry !== targetMoonGeom) {
                        moon.mesh.geometry = targetMoonGeom;
                    }
                }
            }
            if (moon.atmosphereMesh) {
                const moonAtmoMaxDist = moonRadius * 180;
                const showMoonAtmo = showMoonMesh && (isFocused || distSq <= moonAtmoMaxDist * moonAtmoMaxDist);
                moon.atmosphereMesh.visible = showMoonAtmo;
                if (showMoonAtmo) {
                    const targetAtmoGeo = useHighGeom ? CelestialBody.getSharedAtmoHighGeo() : CelestialBody.getSharedAtmoLowGeo();
                    if (moon.atmosphereMesh.geometry !== targetAtmoGeo) {
                        moon.atmosphereMesh.geometry = targetAtmoGeo;
                    }
                }
            }
            if (moon.labelSprite?.visible) {
                moon.ensureLabelRendered();
            }
            if (moon.velocityArrowMesh) {
                moon.velocityArrowMesh.visible = showVelDetail;
            }
            if (moon.velocityPulseChevron) {
                moon.velocityPulseChevron.visible = showVelDetail;
            }
            if (moon.velocityLabelSprite) {
                moon.velocityLabelSprite.visible = showVelDetail;
                if (showVelDetail) {
                    moon.ensureVelocityLabelRendered();
                }
            }
            if (loadDetailTextures) {
                TextureGenerator.ensureDeferredLoaded?.(moon.data.name);
            }
        }
    }

    toggleTrails(visible: boolean) {
        this.showTrails = visible;
        if (visible && !this.trailLine && this.data.distance > 0) {
            this.createTrail();
        }
        if (this.trailLine) {
            this.trailLine.visible = visible;
            if (!visible) {
                // Clear trail when disabled
                this.trailPositions = [];
                if (this.trailLine) {
                    this.trailLine.geometry.setDrawRange(0, 0);
                }
            }
        }
        this.moons.forEach(moon => moon.toggleTrails(visible));
    }

    toggleMeteors(visible: boolean) {
        this.showMeteors = visible;
        if (visible && !this.meteorParticles && this.data.name === 'Earth') {
            this.createMeteors();
        }
        if (this.meteorParticles) {
            this.meteorParticles.visible = visible;
        }
        this.moons.forEach(moon => moon.toggleMeteors(visible));
    }

    toggleOrbit(visible: boolean) {
        if (this.orbitLine) {
            this.orbitLine.visible = visible;
        }
        if (this.velocityVectorGroup) {
            this.velocityVectorGroup.visible = visible;
        }
        this.moons.forEach(moon => moon.toggleOrbit(visible));
    }

    toggleMoons(visible: boolean) {
        this.moons.forEach(moon => {
            moon.tiltGroup.visible = visible;
            if (moon.orbitLine) moon.orbitLine.visible = visible;
            moon.toggleMoons(visible);
        });
    }



    toggleAxes(visible: boolean) {
        this.showAxes = visible;
        if (visible && !this.axesHelper && this.data.name !== 'Sun') {
            this.createAxis();
        }
        if (this.axesHelper) {
            this.axesHelper.visible = visible;
        }
        this.moons.forEach(moon => moon.toggleAxes(visible));
    }

    dispose() {
        if (this.auroraMeshNorth) {
            this.auroraMeshNorth.geometry.dispose();
            this.auroraMeshNorth = null;
        }
        if (this.auroraMeshSouth) {
            this.auroraMeshSouth.geometry.dispose();
            this.auroraMeshSouth = null;
        }
        if (this.auroraMaterial) {
            this.auroraMaterial.dispose();
            this.auroraMaterial = null;
        }
        if (this.velocityVectorGroup) {
            this.velocityVectorGroup.traverse((child) => {
                const geom = (child as any).geometry;
                if (geom && !geom.userData?.shared) geom.dispose();
                const mat = (child as any).material;
                if (mat && !mat.userData?.shared) {
                    if (mat.map && !mat.map.userData?.shared) mat.map.dispose();
                    mat.dispose();
                }
            });
            this.velocityVectorGroup = null;
        }
        this.velocityArrowMesh = null;
        this.velocityPulseChevron = null;
        this.velocityLabelSprite = null;

        this.moons.forEach(moon => moon.dispose());
        this.moons = [];

        if (this.mesh) {
            this.mesh.geometry?.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(m => m.dispose());
            } else {
                this.mesh.material?.dispose();
            }
        }
        if (this.highGeometry && this.highGeometry !== this.mesh?.geometry) {
            this.highGeometry.dispose();
        }
        if (this.lowGeometry && this.lowGeometry !== this.mesh?.geometry) {
            this.lowGeometry.dispose();
        }
        this.highGeometry = null;
        this.lowGeometry = null;

        if (this.cloudMesh) {
            this.cloudMesh.geometry?.dispose();
            if (Array.isArray(this.cloudMesh.material)) {
                this.cloudMesh.material.forEach(m => m.dispose());
            } else {
                this.cloudMesh.material?.dispose();
            }
            this.cloudMesh = undefined;
        }

        if (this.atmosphereMesh) {
            if (!this.atmosphereMesh.geometry?.userData?.shared) {
                this.atmosphereMesh.geometry?.dispose();
            }
            if (Array.isArray(this.atmosphereMesh.material)) {
                this.atmosphereMesh.material.forEach(m => m.dispose());
            } else {
                this.atmosphereMesh.material?.dispose();
            }
        }

        if (this.coronaMesh) {
            this.coronaMesh.geometry?.dispose();
            if (Array.isArray(this.coronaMesh.material)) {
                this.coronaMesh.material.forEach(m => m.dispose());
            } else {
                this.coronaMesh.material?.dispose();
            }
            this.coronaMesh = undefined;
        }

        this.ringMeshes.forEach(ring => {
            ring.geometry?.dispose();
            if (Array.isArray(ring.material)) {
                ring.material.forEach(m => m.dispose());
            } else {
                ring.material?.dispose();
            }
        });
        this.ringMeshes = [];

        if (this.meteorParticles) {
            this.meteorParticles.geometry?.dispose();
            if (Array.isArray(this.meteorParticles.material)) {
                this.meteorParticles.material.forEach(m => m.dispose());
            } else {
                this.meteorParticles.material?.dispose();
            }
        }

        if (this.trailLine) {
            this.trailLine.geometry?.dispose();
            if (Array.isArray(this.trailLine.material)) {
                this.trailLine.material.forEach(m => m.dispose());
            } else {
                this.trailLine.material?.dispose();
            }
        }

        if (this.orbitLine) {
            this.orbitLine.geometry?.dispose();
            if (Array.isArray(this.orbitLine.material)) {
                this.orbitLine.material.forEach(m => m.dispose());
            } else {
                this.orbitLine.material?.dispose();
            }
        }

        if (this.axesHelper) {
            this.axesHelper.geometry?.dispose();
            if (Array.isArray(this.axesHelper.material)) {
                this.axesHelper.material.forEach(m => m.dispose());
            } else {
                this.axesHelper.material?.dispose();
            }
        }

        if (this.labelSprite) {
            if (this.labelSprite.material?.map && !this.labelSprite.material.map.userData?.shared) {
                this.labelSprite.material.map.dispose();
            }
            this.labelSprite.material?.dispose();
        }

        if (this.shaderMaterial) {
            this.shaderMaterial.dispose();
        }

        if (this.orbitGroup.parent) {
            this.orbitGroup.parent.remove(this.orbitGroup);
        }
        if (this.tiltGroup.parent) {
            this.tiltGroup.parent.remove(this.tiltGroup);
        }
    }
}
