import * as THREE from 'three';

import { CelestialBodyData, MoonData } from './SolarSystemData';
import { vertexShader as sunVertexShader, fragmentShader as sunFragmentShader } from './SunShader';
import { solveKepler } from './MathUtils';
import { TextureGenerator } from './TextureGenerator';
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
    velocityPulseChevron: THREE.Mesh | null = null;
    private velocityPulseTimer: number = 0;
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

    constructor(data: CelestialBodyData | MoonData, parent: THREE.Object3D, isMoon: boolean = false) {
        this.data = data;
        this.parent = parent;
        this.isMoon = isMoon;
        this.mesh = null;
        this.orbitLine = null;
        this.angle = THREE.MathUtils.seededRandom() * Math.PI * 2;
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

        // Group to handle axial tilt
        this.tiltGroup = new THREE.Group();
        if (this.data.axialTilt !== undefined) {
            this.tiltGroup.rotation.z = THREE.MathUtils.degToRad(this.data.axialTilt); // Tilt on Z axis
        }
        this.orbitGroup.add(this.tiltGroup);

        // Geometry - Adaptive segments based on scale and moon status
        let segments = 64;
        if (this.isMoon) {
            segments = (this.data.name === 'Iapetus') ? 64 : (this.data.radius < 0.5 ? 24 : 32);
        } else if (this.data.radius > 3) { // Gas giants
            segments = 128;
        }
        const geometry = new THREE.SphereGeometry(this.data.radius, segments, segments);

        if (this.data.name === 'Iapetus') {
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
            // High-resolution NASA Blue Marble WebP satellite map of Earth
            const roughnessMap = TextureGenerator.getPlanetRoughnessMap('Earth');
            const textureUrl = `${import.meta.env.BASE_URL}textures/earth_equirectangular.webp`;
            const texture = new THREE.TextureLoader().load(textureUrl, (loadedTex) => {
                if (loadedTex?.image) {
                    TextureGenerator.updateEarthRoughnessFromImage(loadedTex.image);
                }
            });
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = TextureGenerator.maxAnisotropy;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;

            material = new THREE.MeshStandardMaterial({
                map: texture,
                roughnessMap: roughnessMap,
                roughness: 0.9,
                metalness: 0.05,
                color: 0xffffff
            });
        } else if (this.data.name === 'Moon') {
            // Real Lunar Reconnaissance Orbiter equirectangular map + surface crater relief
            const textureUrl = `${import.meta.env.BASE_URL}textures/moon.webp`;
            const texture = new THREE.TextureLoader().load(textureUrl);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = TextureGenerator.maxAnisotropy;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;

            material = new THREE.MeshStandardMaterial({
                map: texture,
                bumpMap: texture,
                bumpScale: 0.018,
                roughness: 0.92,
                metalness: 0.02,
                color: 0xffffff
            });
        } else {
            // Apply 2:1 equirectangular seamless texture + bump relief on rocky/icy cratered worlds
            const texture = TextureGenerator.getPlanetTexture(this.data.name);
            const bumpMap = TextureGenerator.getPlanetBumpMap(this.data.name);
            const isGasOrCloud = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Venus', 'Titan'].includes(this.data.name);

            material = new THREE.MeshStandardMaterial({
                map: texture,
                ...(bumpMap ? { bumpMap, bumpScale: 0.02 } : {}),
                roughness: isGasOrCloud ? 0.95 : 0.82,
                metalness: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(this.data.name) ? 0.0 : 0.05,
                color: 0xffffff
            });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        if (this.data.name === 'Sun') {
            this.mesh.frustumCulled = false;
        }
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
            // Earth Cloud Sphere - seamless 2:1 equirectangular crisp white cloud deck
            const cloudGeometry = new THREE.SphereGeometry(this.data.radius * 1.008, 64, 64);
            const cloudTexture = TextureGenerator.getPlanetTexture('EarthClouds');
            const cloudMaterial = new THREE.MeshStandardMaterial({
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
            this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
            this.cloudMesh.receiveShadow = true;
            this.tiltGroup.add(this.cloudMesh);

            // Meteor Shower
            this.createMeteors();

            // Polar Auroras (Northern and Southern Lights)
            this.createEarthAuroras();
        }

        // Real-Time Holographic Orbital Velocity Vector for all orbiting celestial bodies
        if (this.data.distance > 0 && this.data.name !== 'Sun') {
            this.createVelocityVector();
        }

        // Create Orbit Line
        this.createOrbit();

        // Create Trail
        this.createTrail();

        // Create Rings
        if ('rings' in this.data && this.data.rings) {
            this.createRings();
        }

        // Create Axis
        this.createAxis();

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
        const coronaGeo = new THREE.SphereGeometry(this.data.radius * 1.28, 64, 64);
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
        this.coronaMesh.frustumCulled = false;
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
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        this.renderLabelCanvas(canvas);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            sizeAttenuation: false
        });
        this.labelSprite = new THREE.Sprite(material);
        const aspect = canvas.width / canvas.height;
        this.labelSprite.scale.set(0.05 * aspect, 0.05, 1);
        this.labelSprite.position.set(0, this.data.radius * 1.2, 0);
        this.labelSprite.visible = this.showLabel;
        // Don't add it to tiltGroup so the label stays upright
        this.orbitGroup.add(this.labelSprite);
    }

    refreshLabel() {
        if (this.labelSprite && this.labelSprite.material?.map) {
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

        const segments = this.data.radius > 3 ? 128 : 64;
        const atmosphereGeometry = new THREE.SphereGeometry(this.data.radius * config.scale, segments, segments);
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

        this.data.rings.forEach(ringData => {
            const segments = 128;
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

            const material = new THREE.MeshStandardMaterial({
                map: ringTexture,
                side: THREE.DoubleSide,
                transparent: true,
                alphaTest: 0.04,
                roughness: 0.78,
                metalness: 0.0,
                depthWrite: false
            });
            const ringMesh = new THREE.Mesh(geometry, material);

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
        });
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
        const positions = this.meteorParticles.geometry.attributes.position.array as Float32Array;
        const colors = this.meteorParticles.geometry.attributes.color.array as Float32Array;
        const radius = this.data.radius;

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
            if (distSq < radius * radius * 1.05 || distSq > radius * radius * 25) {
                this.resetMeteor(i, positions, colors);
            }
        }

        this.meteorParticles.geometry.attributes.position.needsUpdate = true;
        this.meteorParticles.geometry.attributes.color.needsUpdate = true;
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

        // Direction shaft
        const shaftLength = 1.1 * bodyScale;
        const shaftRadius = 0.022 * bodyScale;
        const shaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 8);
        shaftGeo.rotateX(Math.PI / 2);
        const shaftMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.75
        });
        const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
        shaftMesh.position.z = shaftLength * 0.5;
        this.velocityVectorGroup.add(shaftMesh);

        // Arrow head
        const headRadius = 0.09 * bodyScale;
        const headHeight = 0.3 * bodyScale;
        const headGeo = new THREE.ConeGeometry(headRadius, headHeight, 12);
        headGeo.rotateX(Math.PI / 2);
        const headMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.95
        });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.z = shaftLength + headHeight * 0.5;
        this.velocityVectorGroup.add(headMesh);

        // Forward-pulsing chevron
        const pulseRadius = 0.065 * bodyScale;
        const pulseHeight = 0.18 * bodyScale;
        const pulseGeo = new THREE.ConeGeometry(pulseRadius, pulseHeight, 12);
        pulseGeo.rotateX(Math.PI / 2);
        const pulseMat = new THREE.MeshBasicMaterial({
            color: 0x7dd3fc,
            transparent: true,
            opacity: 0.85
        });
        this.velocityPulseChevron = new THREE.Mesh(pulseGeo, pulseMat);
        this.velocityPulseChevron.position.z = shaftLength * 0.5;
        this.velocityVectorGroup.add(this.velocityPulseChevron);

        // Telemetry readout sprite
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
        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: true,
            sizeAttenuation: true
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.4 * bodyScale, 0.35 * bodyScale, 1);
        sprite.position.set(0, 0.38 * bodyScale, 0.65 * bodyScale);
        this.velocityVectorGroup.add(sprite);

        // Inherit orbit visibility
        this.velocityVectorGroup.visible = this.orbitLine?.visible ?? true;

        this.orbitGroup.add(this.velocityVectorGroup);
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
        this.parent.add(this.trailLine);
    }

    updateTrail() {
        if (!this.trailLine || !this.showTrails) return;

        const maxTrailLength = 100;

        // Get the global position to accurately draw trails for moons and nested objects
        this.orbitGroup.getWorldPosition(CelestialBody._tempWorldPos);

        // Transform the global position into the parent's local space
        CelestialBody._tempLocalPos.copy(CelestialBody._tempWorldPos);
        this.parent.worldToLocal(CelestialBody._tempLocalPos);

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
        const vertices = [];

        const a = this.realisticDistances && this.data.distanceAU ? this.data.distanceAU * 130 : this.data.distance;
        const e = this.realisticDistances && this.data.eccentricity ? this.data.eccentricity : 0;
        const b = a * Math.sqrt(1 - e * e);

        for (let i = 0; i <= segments; i++) {
            const E = (i / segments) * Math.PI * 2;
            const x = a * (Math.cos(E) - e);
            const z = b * Math.sin(E);
            vertices.push(x, 0, z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.LineBasicMaterial({
            color: this.data.color || 0x38bdf8,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending
        });

        this.orbitLine = new THREE.LineLoop(geometry, material);

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

        let x = 0;
        let z = 0;

        if (this.data.distance !== 0) {
            const a = this.realisticDistances && this.data.distanceAU ? this.data.distanceAU * 130 : this.data.distance;
            const e = this.realisticDistances && this.data.eccentricity ? this.data.eccentricity : 0;
            const b = a * Math.sqrt(1 - e * e);

            if (e > 0) {
                let M = this.angle;
                let E = solveKepler(M, e);
                x = a * (Math.cos(E) - e);
                z = b * Math.sin(E);
            } else {
                x = Math.cos(this.angle) * a;
                z = Math.sin(this.angle) * a;
            }
        }

        // Move the group
        this.orbitGroup.position.set(x, 0, z);

        // Rotate planet on its axis
        if (this.mesh) {
            // Rotate around local Y axis (which is tilted via tiltGroup)
            // Haumea has an exceptionally rapid rotation period (~3.9 hours)
            const rotationSpeed = this.data.name === 'Haumea' ? 2.5 : 0.5;
            this.mesh.rotation.y += rotationSpeed * deltaTime;
        }

        // Rotate Clouds independently with real-time atmospheric circulation drift
        if (this.cloudMesh) {
            const atmosphericDrift = (rawDelta !== undefined && rawDelta > 0) ? rawDelta * 0.045 : 0;
            this.cloudMesh.rotation.y += 0.55 * deltaTime + atmosphericDrift;
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
        if (this.velocityVectorGroup && this.velocityVectorGroup.visible) {
            const tangent = CelestialBody._tempTangent.set(-Math.sin(this.angle) * dir, 0, Math.cos(this.angle) * dir).normalize();
            const visualScale = this.tiltGroup ? this.tiltGroup.scale.x : 1.0;
            const r = this.data.radius;
            const bodyScale = this.getVelocityBodyScale();
            const clearanceR = this.data.name === 'Haumea' ? r * 1.45 : r;
            const offsetDist = (clearanceR * 1.35 + bodyScale * 0.4) * visualScale;
            this.velocityVectorGroup.position.copy(tangent).multiplyScalar(offsetDist);
            this.velocityVectorGroup.quaternion.setFromUnitVectors(CelestialBody._unitZ, tangent);

            if (this.velocityPulseChevron && rawDelta !== undefined && rawDelta > 0) {
                this.velocityPulseTimer += rawDelta * 2.5;
                const cycle = (this.velocityPulseTimer % 1.0);
                this.velocityPulseChevron.position.z = (0.2 + cycle * 0.9) * bodyScale;
                (this.velocityPulseChevron.material as THREE.MeshBasicMaterial).opacity = Math.sin(cycle * Math.PI) * 0.9;
            }
        }

        this.updateMeteors(deltaTime, rawDelta);
        this.updateTrail();

        // Update moons
        this.moons.forEach(moon => moon.update(deltaTime, simTimePassed, rawDelta));
    }

    toggleTrails(visible: boolean) {
        this.showTrails = visible;
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
                if ((child as any).geometry) (child as any).geometry.dispose();
                if ((child as any).material) {
                    if ((child as any).material.map) (child as any).material.map.dispose();
                    (child as any).material.dispose();
                }
            });
            this.velocityVectorGroup = null;
        }

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
            this.atmosphereMesh.geometry?.dispose();
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
            this.labelSprite.material?.map?.dispose();
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
