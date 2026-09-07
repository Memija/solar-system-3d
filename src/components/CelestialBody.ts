import * as THREE from 'three';

import { CelestialBodyData, MoonData } from './SolarSystemData';
import { vertexShader as sunVertexShader, fragmentShader as sunFragmentShader } from './SunShader';
import { solveKepler } from './MathUtils';
import { TextureGenerator } from './TextureGenerator';


const auroraVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
uniform float time;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;
    float angle = atan(pos.z, pos.x);
    float wave1 = sin(angle * 5.0 + time * 1.8) * 0.04;
    float wave2 = cos(angle * 9.0 - time * 2.3) * 0.025;
    float displacement = wave1 + wave2;

    vec2 dir = length(pos.xz) > 0.001 ? normalize(pos.xz) : vec2(1.0, 0.0);
    pos.x += dir.x * displacement;
    pos.z += dir.y * displacement;
    pos.y += displacement * 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const auroraFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
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

    float alpha = verticalFade * fluting * opacity;
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
            segments = this.data.radius < 0.5 ? 24 : 32;
        } else if (this.data.radius > 3) { // Gas giants
            segments = 128;
        }
        const geometry = new THREE.SphereGeometry(this.data.radius, segments, segments);

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
            // High-resolution real NASA Blue Marble satellite map of Earth
            const textureUrl = `${import.meta.env.BASE_URL}textures/earth_equirectangular.png`;
            const texture = new THREE.TextureLoader().load(textureUrl);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = TextureGenerator.maxAnisotropy;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;

            const roughnessMap = TextureGenerator.getPlanetRoughnessMap('Earth');

            material = new THREE.MeshStandardMaterial({
                map: texture,
                roughnessMap: roughnessMap,
                roughness: 0.9,
                metalness: 0.05,
                color: 0xffffff
            });
        } else {
            // Apply 2:1 equirectangular seamless texture
            const texture = TextureGenerator.getPlanetTexture(this.data.name);

            material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Venus'].includes(this.data.name) ? 0.95 : 0.8,
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
        this.tiltGroup.add(this.mesh);

        // --- ATMOSPHERE & SPECIAL FEATURES ---
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


    createLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(this.data.name, 128, 64);

            // Draw a Google Maps style pin
            ctx.fillStyle = '#ea4335';
            ctx.beginPath();
            ctx.arc(128, 128, 32, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(96, 128);
            ctx.lineTo(128, 192); // bottom point
            ctx.lineTo(160, 128);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(128, 128, 16, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            sizeAttenuation: false
        });
        this.labelSprite = new THREE.Sprite(material);
        // With sizeAttenuation: false, scale is in pixels/viewport relative units
        // Typically a small decimal value like 0.05
        this.labelSprite.scale.set(0.05, 0.05, 1);

        // When sizeAttenuation is false, position does not strictly scale up linearly in screen space,
        // but we keep the relative world position. We might want to offset it slightly or put it at the center.
        this.labelSprite.position.set(0, this.data.radius * 1.2, 0);
        this.labelSprite.visible = this.showLabel;
        // Don't add it to tiltGroup so the label stays upright
        this.orbitGroup.add(this.labelSprite);
    }

    createAtmosphere() {
        const atmosphereConfigs: Record<string, { color: number; scale: number; coefficient: number; power: number }> = {
            'Earth': { color: 0x38bdf8, scale: 1.018, coefficient: 0.35, power: 4.5 },
            'Venus': { color: 0xf59e0b, scale: 1.022, coefficient: 0.40, power: 3.8 },
            'Mars': { color: 0xf97316, scale: 1.012, coefficient: 0.25, power: 5.0 },
            'Jupiter': { color: 0xfde68a, scale: 1.012, coefficient: 0.25, power: 4.5 },
            'Saturn': { color: 0xfef08a, scale: 1.012, coefficient: 0.25, power: 4.5 },
            'Uranus': { color: 0x67e8f9, scale: 1.018, coefficient: 0.35, power: 4.0 },
            'Neptune': { color: 0x3b82f6, scale: 1.020, coefficient: 0.40, power: 4.0 },
            'Titan': { color: 0xd97706, scale: 1.025, coefficient: 0.30, power: 3.8 }
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
                void main() {
                    vNormal = normalize(normalMatrix * normal);
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
                void main() {
                    vec3 viewDir = normalize(-vPosition);
                    float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
                    float intensity = pow(fresnel, power) * coefficient;
                    gl_FragColor = vec4(glowColor, intensity);
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
        if (!('rings' in this.data) || !this.data.rings) return;

        this.data.rings.forEach(ringData => {
            const segments = 128;
            const geometry = new THREE.RingGeometry(ringData.innerRadius, ringData.outerRadius, segments);

            // Compute radial UV coordinates: u is radial distance (0 at inner to 1 at outer)
            const pos = geometry.attributes.position;
            const uvs = geometry.attributes.uv;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const r = Math.sqrt(x * x + y * y);
                const u = Math.max(0, Math.min(1, (r - ringData.innerRadius) / (ringData.outerRadius - ringData.innerRadius)));
                uvs.setXY(i, u, 0.5);
            }
            uvs.needsUpdate = true;

            const ringTexture = TextureGenerator.getRingTexture(this.data.name);
            const material = new THREE.MeshStandardMaterial({
                map: ringTexture,
                side: THREE.DoubleSide,
                transparent: true,
                roughness: 0.8,
                metalness: 0.0,
                depthWrite: false
            });
            const ringMesh = new THREE.Mesh(geometry, material);

            // Shadows for rings
            ringMesh.castShadow = true;
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
            const distSq = nx*nx + ny*ny + nz*nz;
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
            'Titan': 5.6
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

    createVelocityVector() {
        if (this.data.distance === 0 || this.data.name === 'Sun') return;
        // Include all major planets, dwarf planets, and major moons (Moon, etc.)
        if (this.isMoon && this.data.name !== 'Moon') return;

        this.velocityVectorGroup = new THREE.Group();

        // Responsive scaling based on celestial body radius
        const r = this.data.radius;
        const bodyScale = Math.max(0.55, Math.min(2.8, Math.pow(r, 0.65)));

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
        if (this.trailPositions.length === 0 || CelestialBody._tempLocalPos.distanceTo(this.trailPositions[this.trailPositions.length - 1]) > 0.01) {
            this.trailPositions.push(CelestialBody._tempLocalPos.clone());
            if (this.trailPositions.length > maxTrailLength) {
                this.trailPositions.shift();
            }

            const positions = this.trailLine.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < this.trailPositions.length; i++) {
                positions[i * 3] = this.trailPositions[i].x;
                positions[i * 3 + 1] = this.trailPositions[i].y;
                positions[i * 3 + 2] = this.trailPositions[i].z;
            }

            // If trail isn't full yet, set draw range
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

        if (this.labelSprite) {
            // Update the label position based on the new visual scale of the planet.
            // When realistic, we use the newly computed realisticRadius, otherwise default radius.
            // The labelSprite is not in the tiltGroup (so it stays upright), meaning it doesn't
            // inherit the tiltGroup's scale automatically. We must set its local Y position.
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
        const speedMultiplier = 0.5;
        const speed = this.data.period === 0 ? 0 : (1 / this.data.period) * speedMultiplier;

        if (simTimePassed !== undefined) {
            const baseAngle = ('baseLongitude' in this.data && typeof this.data.baseLongitude === 'number') ? this.data.baseLongitude : 0;
            this.angle = (baseAngle + speed * simTimePassed) % (Math.PI * 2);
        } else {
            this.angle += speed * deltaTime;
            this.angle = this.angle % (Math.PI * 2);
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
            this.mesh.rotation.y += 0.5 * deltaTime;
        }

        // Rotate Rings
        this.ringMeshes.forEach(ring => {
             // Rotate around local Z axis since they were rotated 90deg on X
             ring.rotation.z += 0.2 * deltaTime;
        });

        // Rotate Clouds independently with real-time atmospheric circulation drift
        if (this.cloudMesh) {
            const atmosphericDrift = (rawDelta !== undefined && rawDelta > 0) ? rawDelta * 0.045 : 0;
            this.cloudMesh.rotation.y += 0.55 * deltaTime + atmosphericDrift;
        }

        // Update Shader Time
        if (this.shaderMaterial) {
            // Solar surface plasma convection and coronal loops churn via wall-clock delta when running,
            // ensuring the Sun is dynamic and alive in real-time (1:1) scale without freezing static.
            const plasmaDelta = (rawDelta !== undefined && rawDelta > 0) ? rawDelta * 0.45 : deltaTime;
            this.shaderMaterial.uniforms.time.value += plasmaDelta;
        }

        // Update Earth Polar Auroras
        if (this.auroraMaterial && rawDelta !== undefined && rawDelta > 0) {
            this.auroraMaterial.uniforms.time.value += rawDelta * 1.8;
        }

        // Update Orbital Velocity Vector
        if (this.velocityVectorGroup) {
            // Tangent direction in orbital plane: (-sin(angle), 0, cos(angle))
            const tangent = new THREE.Vector3(-Math.sin(this.angle), 0, Math.cos(this.angle)).normalize();
            const r = this.data.radius;
            const bodyScale = Math.max(0.55, Math.min(2.8, Math.pow(r, 0.65)));
            const offsetDist = r * 1.35 + bodyScale * 0.4;
            this.velocityVectorGroup.position.copy(tangent).multiplyScalar(offsetDist);
            this.velocityVectorGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

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
