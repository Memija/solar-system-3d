import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CelestialBody } from './CelestialBody';
import { SolarSystemData, StarData, CometDataList, SpacecraftDataList } from './SolarSystemData';
import { ConstellationManager } from './ConstellationManager';
import { Comet } from './Comet';
import { Spacecraft } from './Spacecraft';
import { TextureGenerator } from './TextureGenerator';
import { EventBus } from './EventBus';

export class SceneManager {
    container: HTMLElement;
    scene: THREE.Scene;
    camera!: THREE.PerspectiveCamera;
    renderer!: THREE.WebGLRenderer;
    composer!: EffectComposer;
    bloomPass!: UnrealBloomPass;
    controls!: OrbitControls;
    clock: THREE.Clock;
    planets: CelestialBody[];
    comets: Comet[];
    spacecrafts: Spacecraft[];
    timeScale: number;
    showOrbits: boolean;
    showMoons: boolean;
    showComets: boolean;
    showSpacecrafts: boolean;
    showMeteors: boolean;
    showTrails: boolean;
    focusedBody: CelestialBody | Comet | Spacecraft | null;
    surfaceViewBody: CelestialBody | null;
    starMeshes: THREE.Object3D[];
    constellationManager: ConstellationManager;
    previousBodyPosition: THREE.Vector3 | null;
    asteroidBelt: THREE.InstancedMesh | null;
    kuiperBelt: THREE.InstancedMesh | null;
    showAsteroids: boolean;
    showKuiperBelt: boolean;
    showDwarfPlanets: boolean;
    showHabitableZone: boolean;
    showEclipticGrid: boolean;
    realisticLighting: boolean;
    showAxes: boolean;
    realisticDistances: boolean = false;
    realSizeRatio: number = 1.0;

    ambientLight: THREE.AmbientLight;
    pointLight: THREE.PointLight;
    private onResizeBound: () => void = () => {};
    private onOrientationChangeBound: () => void = () => {};

    habitableZoneMesh: THREE.Mesh | null;
    eclipticGridMesh: THREE.PolarGridHelper | null;

    simDate: Date;
    baseDate: Date;
    tourMode: boolean;
    tourTargets: string[];
    tourIndex: number;
    tourTimer: number;
    tourInterval: number;

    measureMode: boolean;
    measureTargetA: CelestialBody | Comet | Spacecraft | null;
    measureTargetB: CelestialBody | Comet | Spacecraft | null;
    measureLine: THREE.Line | null;
    measureLabel: THREE.Sprite | null;
    onTimeScaleChange?: (newScale: number) => void;
    onMeasureTargetsSet?: () => void;

    cameraTransition: {
        startPos: THREE.Vector3;
        endPos: THREE.Vector3;
        startTarget: THREE.Vector3;
        endTarget: THREE.Vector3;
        progress: number;
        duration: number;
    } | null = null;

    private static readonly _vPos = new THREE.Vector3();
    private static readonly _vDelta = new THREE.Vector3();
    private static readonly _vLocalPos = new THREE.Vector3();
    private static readonly _vCamPos = new THREE.Vector3();
    private static readonly _vPlanetPos = new THREE.Vector3();
    private static readonly _vLookTarget = new THREE.Vector3();
    private static readonly _vPosA = new THREE.Vector3();
    private static readonly _vPosB = new THREE.Vector3();
    private static readonly _vMid = new THREE.Vector3();
    private static readonly _vOffset = new THREE.Vector3();

    // Earth period is 1. speedMultiplier is 0.5.
    // 1 orbit = 2*PI radians. Speed = 0.5 rad/sec (sim time).
    // 1 Earth Year = (2*PI)/0.5 = 4*PI seconds of sim time (~12.566370614359172).
    public static readonly EARTH_YEAR_SIM_SECONDS = (2 * Math.PI) / 0.5;
    public static readonly DAYS_PER_YEAR = 365.25;

    // Time scale presets (scale factor applied to real clock delta)
    // Formula: timeScale = (daysPerSecond * EARTH_YEAR_SIM_SECONDS) / DAYS_PER_YEAR
    public static readonly SPEED_PRESETS = {
        realTime: (1 / 86400) * ((2 * Math.PI) / 0.5) / 365.25, // ~3.9817e-7 (1 sec = 1 sec)
        oneHour: (1 / 24) * ((2 * Math.PI) / 0.5) / 365.25,     // ~0.0014334 (1 sec = 1 hour)
        oneDay: 1.0 * ((2 * Math.PI) / 0.5) / 365.25,          // ~0.0344021 (1 sec = 1 day, calibrated realistic default)
        oneWeek: 7.0 * ((2 * Math.PI) / 0.5) / 365.25,         // ~0.2408149 (1 sec = 1 week)
        oneMonth: (365.25 / 12) * ((2 * Math.PI) / 0.5) / 365.25 // ~1.0471975 (1 sec = 1 month)
    };

    // Realistic observation default: 1 second = 1 Earth day
    public static readonly REALISTIC_TIME_SCALE = SceneManager.SPEED_PRESETS.oneDay;

    public static daysPerSecondToTimeScale(daysPerSec: number): number {
        return (daysPerSec * SceneManager.EARTH_YEAR_SIM_SECONDS) / SceneManager.DAYS_PER_YEAR;
    }

    public static timeScaleToDaysPerSecond(timeScale: number): number {
        return (timeScale * SceneManager.DAYS_PER_YEAR) / SceneManager.EARTH_YEAR_SIM_SECONDS;
    }

    public getFormattedTimeSpeed(scale: number = this.timeScale): string {
        if (scale === 0) return 'Paused';
        if (scale <= SceneManager.SPEED_PRESETS.realTime * 1.5) {
            return 'Real-Time (1:1)';
        }
        const daysPerSec = SceneManager.timeScaleToDaysPerSecond(scale);
        const hoursPerSec = daysPerSec * 24;
        if (daysPerSec < 0.9) {
            if (hoursPerSec < 0.1) {
                const minsPerSec = hoursPerSec * 60;
                return `${minsPerSec.toFixed(1)} min/s`;
            }
            return `${hoursPerSec.toFixed(1)} hr/s`;
        }
        if (daysPerSec >= 0.9 && daysPerSec < 6.5) {
            return `${daysPerSec.toFixed(1)} day/s`;
        }
        if (daysPerSec >= 6.5 && daysPerSec < 27) {
            const weeksPerSec = daysPerSec / 7;
            return `${weeksPerSec.toFixed(1)} wk/s`;
        }
        const monthsPerSec = daysPerSec / (SceneManager.DAYS_PER_YEAR / 12);
        return `${monthsPerSec.toFixed(1)} mo/s`;
    }

    constructor(container: HTMLElement) {
        this.container = container;
        // Initialize properties to satisfy TS strict initialization
        this.scene = new THREE.Scene();
        // Camera, renderer, composer and controls initialized in init()
        this.clock = new THREE.Clock();
        this.planets = [];
        this.comets = [];
        this.spacecrafts = [];
        this.timeScale = SceneManager.REALISTIC_TIME_SCALE;
        this.showOrbits = true;
        this.showMoons = true;
        this.showComets = true;
        this.showSpacecrafts = true;
        this.showMeteors = false;
        this.showTrails = true;
        this.focusedBody = null;
        this.surfaceViewBody = null;
        this.starMeshes = [];
        this.previousBodyPosition = null;
        this.asteroidBelt = null;
        this.kuiperBelt = null;
        this.showAsteroids = true;
        this.showKuiperBelt = true;
        this.showDwarfPlanets = true;
        this.showHabitableZone = false;
        this.showEclipticGrid = false;
        this.realisticLighting = false;
        this.showAxes = false;

        // Will be initialized in init()
        this.ambientLight = new THREE.AmbientLight();
        this.pointLight = new THREE.PointLight();

        this.habitableZoneMesh = null;
        this.eclipticGridMesh = null;

        this.simDate = new Date();
        this.baseDate = new Date(Date.UTC(2000, 0, 1, 12, 0, 0)); // J2000 epoch
        this.tourMode = false;
        this.tourTargets = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
        this.tourIndex = 0;
        this.tourTimer = 0;
        this.tourInterval = 12; // Maps to speed 5

        this.measureMode = false;
        this.measureTargetA = null;
        this.measureTargetB = null;
        this.measureLine = null;
        this.measureLabel = null;

        this.constellationManager = new ConstellationManager(this.scene);

        this.init();
    }

    setSimDate(newDate: Date) {
        this.simDate = newDate;
    }

    init() {
        // Scene
        this.scene.background = new THREE.Color(0x000000);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            100000
        );
        this.camera.position.set(0, 100, 400);

        // Renderer
        const isMobile = ('ontouchstart' in window) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) || window.innerWidth <= 768;
        const maxDPR = isMobile ? 1.75 : 2;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        this.container.appendChild(this.renderer.domElement);

        // Configure texture generator anisotropy based on GPU capabilities
        const maxAniso = this.renderer.capabilities?.getMaxAnisotropy?.() ?? 16;
        TextureGenerator.setMaxAnisotropy(maxAniso);

        // Post-processing
        const renderScene = new RenderPass(this.scene, this.camera);

        // Half-resolution Gaussian bloom: softer, more organic light dispersal and reduced fill-rate
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2)),
            0.9, // balanced cinematic strength
            0.5, // radius
            0.85 // threshold
        );

        // Hardware MSAA render target with HalfFloatType for high dynamic range & anti-aliased edges
        const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            samples: isMobile ? 2 : 4,
            type: THREE.HalfFloatType
        });

        this.composer = new EffectComposer(this.renderer, renderTarget);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true; // Enable damping for smooth movement
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = false;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;

        // Configure mouse buttons
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };
        this.controls.addEventListener('start', () => {
            this.cameraTransition = null;
            this.updateZoomLimits();
        });

        // Lighting (Sun)
        // Store ambient light to toggle realistic lighting later
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Balanced ambient light for space
        this.scene.add(this.ambientLight);

        this.pointLight = new THREE.PointLight(0xffffff, 2.0, 0, 0); // Balanced Sun light
        this.pointLight.castShadow = true;

        // Shadow map settings
        const shadowMapSize = isMobile ? 2048 : 4096;
        this.pointLight.shadow.mapSize.width = shadowMapSize;
        this.pointLight.shadow.mapSize.height = shadowMapSize;
        this.pointLight.shadow.camera.near = 10;
        this.pointLight.shadow.camera.far = 2000;
        this.pointLight.shadow.bias = -0.0001;
        this.pointLight.shadow.normalBias = 0.05; // Eliminates shadow acne and surface artifacts

        this.scene.add(this.pointLight);

        // Enable shadows on renderer
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Starfield
        this.createStarfield();

        // Constellations
        this.constellationManager.createConstellations();

        // Planets
        this.createPlanets();

        // Comets
        this.createComets();

        // Asteroids
        this.createAsteroidBelt();

        // Kuiper Belt
        this.createKuiperBelt();

        // Spacecrafts
        this.createSpacecrafts();

        // Environment Enhancements
        this.createHabitableZone();
        this.createEclipticGrid();

        // Resize and orientation handling
        this.onResizeBound = () => this.onWindowResize();
        this.onOrientationChangeBound = () => {
            setTimeout(() => this.onWindowResize(), 150);
        };
        window.addEventListener('resize', this.onResizeBound);
        window.addEventListener('orientationchange', this.onOrientationChangeBound);

        this.createMeasureTools();
        this.updateZoomLimits();
    }

    createMeasureTools() {
        const material = new THREE.LineDashedMaterial({
            color: 0x00ff00,
            linewidth: 2,
            scale: 1,
            dashSize: 10,
            gapSize: 5,
        });

        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1)]);
        this.measureLine = new THREE.Line(geometry, material);
        this.measureLine.computeLineDistances();
        this.measureLine.visible = false;
        this.measureLine.frustumCulled = false;
        this.scene.add(this.measureLine);

        // Label
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
        this.measureLabel = new THREE.Sprite(spriteMaterial);
        this.measureLabel.scale.set(60, 15, 1);
        this.measureLabel.visible = false;
        this.scene.add(this.measureLabel);
    }

    updateMeasureLabel(text: string) {
        if (!this.measureLabel || !this.measureLabel.material.map) return;

        // Check if text is same, avoid re-rendering
        if ((this.measureLabel as any).userData.lastText === text) return;
        (this.measureLabel as any).userData.lastText = text;

        const canvas = this.measureLabel.material.map.image as HTMLCanvasElement;
        const context = canvas.getContext('2d');
        if (!context) return;

        context.font = 'Bold 48px Arial';
        const textMetrics = context.measureText(text);
        const textWidth = textMetrics.width;

        // Add padding to the text width
        const newWidth = Math.max(512, textWidth + 80);

        if (canvas.width !== newWidth) {
            canvas.width = newWidth;
            // Updating canvas dimensions resets context state, so re-apply font
            context.font = 'Bold 48px Arial';
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.beginPath();
        context.roundRect(0, 0, canvas.width, canvas.height, 20);
        context.fill();
        context.strokeStyle = '#00ff00';
        context.lineWidth = 4;
        context.stroke();

        context.fillStyle = '#00ff00';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        this.measureLabel.material.map.needsUpdate = true;

        // Update the scale aspect ratio to match the new canvas dimensions
        // Previous static scale: scale.set(60, 15, 1) -> ratio of 4:1 for 512x128
        const currentScaleY = this.measureLabel.scale.y;
        this.measureLabel.scale.set(currentScaleY * (canvas.width / canvas.height), currentScaleY, 1);
    }

    createAsteroidBelt() {
        const numAsteroids = 2000;
        // Mars is at distance 170, Jupiter is at 280
        const minDistance = 200;
        const maxDistance = 250;

        const geometry = new THREE.DodecahedronGeometry(0.5, 0); // Low poly asteroid
        const material = new THREE.MeshStandardMaterial({
            roughness: 0.85,
            metalness: 0.15
        });

        this.asteroidBelt = new THREE.InstancedMesh(geometry, material, numAsteroids);

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        const asteroidPalettes = [
            0x3d352e, // C-type: Dark carbonaceous
            0x4a4238, // C-type: Deep charcoal
            0x7d7265, // S-type: Stony silicate grey
            0x918370, // S-type: Ochre-tinted silicate
            0xaba49a, // M-type: Metallic nickel-iron
            0x5e564d  // Mixed regolith
        ];

        for (let i = 0; i < numAsteroids; i++) {
            const angle = THREE.MathUtils.seededRandom() * Math.PI * 2;
            const distance = minDistance + THREE.MathUtils.seededRandom() * (maxDistance - minDistance);

            // Add some variation to Y
            const yOffset = (THREE.MathUtils.seededRandom() - 0.5) * 10;

            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            dummy.position.set(x, yOffset, z);

            // Random rotation
            dummy.rotation.x = THREE.MathUtils.seededRandom() * Math.PI;
            dummy.rotation.y = THREE.MathUtils.seededRandom() * Math.PI;
            dummy.rotation.z = THREE.MathUtils.seededRandom() * Math.PI;

            // Random scale
            const scale = 0.5 + THREE.MathUtils.seededRandom();
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            this.asteroidBelt.setMatrixAt(i, dummy.matrix);

            // Assign natural rock color
            const hex = asteroidPalettes[Math.floor(THREE.MathUtils.seededRandom() * asteroidPalettes.length)];
            color.setHex(hex);
            this.asteroidBelt.setColorAt(i, color);
        }

        if (this.asteroidBelt.instanceColor) {
            this.asteroidBelt.instanceColor.needsUpdate = true;
        }

        this.scene.add(this.asteroidBelt);
    }

    createHabitableZone() {
        // Habitable zone for Sun is roughly 0.95 to 1.37 AU
        // In our scale: Earth is at 130
        const innerRadius = 120;
        const outerRadius = 180;

        const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                innerRadius: { value: innerRadius },
                outerRadius: { value: outerRadius },
                color: { value: new THREE.Color(0x00ff00) },
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
                    // Smooth edges
                    float alpha = smoothstep(innerRadius, innerRadius + 10.0, dist) *
                                  (1.0 - smoothstep(outerRadius - 10.0, outerRadius, dist));

                    gl_FragColor = vec4(color, alpha * 0.15); // Very transparent green
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.habitableZoneMesh = new THREE.Mesh(geometry, material);
        this.habitableZoneMesh.rotation.x = -Math.PI / 2;
        this.habitableZoneMesh.visible = this.showHabitableZone;
        this.scene.add(this.habitableZoneMesh);
    }

    createEclipticGrid() {
        // Ecliptic plane grid
        const radius = 1000;
        const radials = 16;
        const circles = 10;
        const divisions = 64;
        const color1 = new THREE.Color(0x444444);
        const color2 = new THREE.Color(0x222222);

        this.eclipticGridMesh = new THREE.PolarGridHelper(radius, radials, circles, divisions, color1, color2);
        this.eclipticGridMesh.visible = this.showEclipticGrid;

        // Ensure the grid is transparent and non-obtrusive
        if (this.eclipticGridMesh.material instanceof THREE.Material) {
            this.eclipticGridMesh.material.transparent = true;
            this.eclipticGridMesh.material.opacity = 0.3;
            this.eclipticGridMesh.material.depthWrite = false;
        } else if (Array.isArray(this.eclipticGridMesh.material)) {
            for (const mat of this.eclipticGridMesh.material) {
                mat.transparent = true;
                mat.opacity = 0.3;
                mat.depthWrite = false;
            }
        }

        this.scene.add(this.eclipticGridMesh);
    }

    createKuiperBelt() {
        const numObjects = 2500;
        // Neptune is at 640
        const minDistance = 670;
        const maxDistance = 850;

        const geometry = new THREE.DodecahedronGeometry(0.8, 0); // Slightly larger
        const material = new THREE.MeshStandardMaterial({
            roughness: 0.7,
            metalness: 0.1
        });

        this.kuiperBelt = new THREE.InstancedMesh(geometry, material, numObjects);

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        const kuiperPalettes = [
            0xc4d4e0, // Icy methane/nitrogen frost (pale blue-white)
            0xdee8f0, // Bright water ice
            0x825442, // Tholin-rich organic reddish-brown
            0x54585c, // Dark frozen carbonaceous
            0x9faab3  // Silicate-ice mixture
        ];

        for (let i = 0; i < numObjects; i++) {
            const angle = THREE.MathUtils.seededRandom() * Math.PI * 2;
            const distance = minDistance + THREE.MathUtils.seededRandom() * (maxDistance - minDistance);

            // Add some variation to Y, slightly thicker than asteroid belt
            const yOffset = (THREE.MathUtils.seededRandom() - 0.5) * 30;

            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            dummy.position.set(x, yOffset, z);

            // Random rotation
            dummy.rotation.x = THREE.MathUtils.seededRandom() * Math.PI;
            dummy.rotation.y = THREE.MathUtils.seededRandom() * Math.PI;
            dummy.rotation.z = THREE.MathUtils.seededRandom() * Math.PI;

            // Random scale
            const scale = 0.3 + THREE.MathUtils.seededRandom() * 1.5;
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            this.kuiperBelt.setMatrixAt(i, dummy.matrix);

            // Assign natural icy/tholin color
            const hex = kuiperPalettes[Math.floor(THREE.MathUtils.seededRandom() * kuiperPalettes.length)];
            color.setHex(hex);
            this.kuiperBelt.setColorAt(i, color);
        }

        if (this.kuiperBelt.instanceColor) {
            this.kuiperBelt.instanceColor.needsUpdate = true;
        }

        this.scene.add(this.kuiperBelt);
    }

    createStarfield() {
        // Milky Way texture
        const geometry = new THREE.SphereGeometry(50000, 64, 64);
        const textureLoader = new THREE.TextureLoader();
        const textureUrl = `${import.meta.env.BASE_URL}textures/milky_way.jpg`;
        const texture = textureLoader.load(textureUrl);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities?.getMaxAnisotropy?.() ?? 16;

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.95
        });

        const skybox = new THREE.Mesh(geometry, material);
        skybox.rotation.x = Math.PI / 3;
        skybox.matrixAutoUpdate = false;
        skybox.updateMatrix();
        this.scene.add(skybox);

        // Twinkling multi-spectral background starfield
        const starCount = 3000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        const spectralColors = [
            [0.65, 0.78, 1.0], // Blue-white O/B
            [0.85, 0.90, 1.0], // White A
            [1.0, 1.0, 0.95],  // Yellow-white F
            [1.0, 0.92, 0.70], // Yellow G (Sun-like)
            [1.0, 0.75, 0.45], // Orange K
            [1.0, 0.45, 0.35]  // Red M
        ];

        for (let i = 0; i < starCount; i++) {
            const r = 45000 + THREE.MathUtils.seededRandom() * 4000;
            const theta = THREE.MathUtils.seededRandom() * Math.PI * 2;
            const phi = Math.acos(THREE.MathUtils.seededRandom() * 2 - 1);

            starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPositions[i * 3 + 2] = r * Math.cos(phi);

            const color = spectralColors[Math.floor(THREE.MathUtils.seededRandom() * spectralColors.length)];
            const brightness = 0.6 + THREE.MathUtils.seededRandom() * 0.4;
            starColors[i * 3] = color[0] * brightness;
            starColors[i * 3 + 1] = color[1] * brightness;
            starColors[i * 3 + 2] = color[2] * brightness;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 28,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            sizeAttenuation: true
        });
        const starPoints = new THREE.Points(starGeometry, starMaterial);
        starPoints.matrixAutoUpdate = false;
        starPoints.updateMatrix();
        this.scene.add(starPoints);

        this.createMajorStars();
    }

    createMajorStars() {
        const majorStars: StarData[] = [
            {
                name: "Sirius", ra: 6.75, dec: -16.72, color: 0xffffff,
                description: "The brightest star in the night sky. It is a binary star system consisting of a main-sequence star of spectral type A0 or A1, termed Sirius A, and a faint white dwarf companion of spectral type DA2, termed Sirius B.",
                imageUrl: "images/heic0516a.jpg",
                images: [
                    "images/heic0516a.jpg"
                ],
                links: [
                    { title: "Wikipedia: Sirius", url: "https://en.wikipedia.org/wiki/Sirius" },
                    { title: "NASA: Sirius", url: "https://science.nasa.gov/asset/hubble/the-dog-star-sirius-and-its-tiny-companion/" }
                ]
            },
            {
                name: "Canopus", ra: 6.4, dec: -52.7, color: 0xffffff,
                description: "The brightest star in the southern constellation of Carina and the second-brightest star in the night sky. It is essentially white when seen with the naked eye.",
                imageUrl: "images/heic0702a.jpg",
                images: ["images/heic0702a.jpg"],
                links: [{ title: "Wikipedia: Canopus", url: "https://en.wikipedia.org/wiki/Canopus" }]
            },
            {
                name: "Arcturus", ra: 14.26, dec: 19.18, color: 0xffd27d,
                description: "The brightest star in the northern constellation of Boötes. With an apparent visual magnitude of −0.05, it is the fourth-brightest star in the night sky and the brightest in the northern celestial hemisphere.",
                imageUrl: "images/heic1007a.jpg",
                images: ["images/heic1007a.jpg"],
                links: [{ title: "Wikipedia: Arcturus", url: "https://en.wikipedia.org/wiki/Arcturus" }]
            },
            {
                name: "Vega", ra: 18.62, dec: 38.78, color: 0xa3c2ff,
                description: "The brightest star in the northern constellation of Lyra. It is relatively close at only 25 light-years from the Sun, and one of the most luminous stars in the Sun's neighborhood.",
                imageUrl: "images/heic0516b.jpg",
                images: ["images/heic0516b.jpg"],
                links: [{ title: "Wikipedia: Vega", url: "https://en.wikipedia.org/wiki/Vega" }]
            },
            {
                name: "Capella", ra: 5.27, dec: 46, color: 0xfff5f5,
                description: "The brightest star in the constellation of Auriga, the sixth-brightest in the night sky, and the third-brightest in the Northern Celestial Hemisphere after Arcturus and Vega.",
                imageUrl: "images/heic0711a.jpg",
                images: ["images/heic0711a.jpg"],
                links: [{ title: "Wikipedia: Capella", url: "https://en.wikipedia.org/wiki/Capella" }]
            },
            {
                name: "Rigel", ra: 5.24, dec: -8.2, color: 0xa3c2ff,
                description: "A blue supergiant star in the constellation of Orion. It is the brightest star in Orion and the seventh-brightest star in the night sky.",
                imageUrl: "images/heic1509a.jpg",
                images: ["images/heic1509a.jpg"],
                links: [{ title: "Wikipedia: Rigel", url: "https://en.wikipedia.org/wiki/Rigel" }]
            },
            {
                name: "Procyon", ra: 7.65, dec: 5.22, color: 0xfff5f5,
                description: "The brightest star in the constellation of Canis Minor and usually the eighth-brightest star in the night sky.",
                imageUrl: "images/heic0516c.jpg",
                images: ["images/heic0516c.jpg"],
                links: [{ title: "Wikipedia: Procyon", url: "https://en.wikipedia.org/wiki/Procyon" }]
            },
            {
                name: "Betelgeuse", ra: 5.92, dec: 7.41, color: 0xff8c00,
                description: "A red supergiant of spectral type M1-2 and one of the largest stars visible to the naked eye. It is usually the tenth-brightest star in the night sky and, after Rigel, the second-brightest in the constellation of Orion.",
                imageUrl: "images/opo9604a.jpg",
                images: ["images/opo9604a.jpg"],
                links: [{ title: "Wikipedia: Betelgeuse", url: "https://en.wikipedia.org/wiki/Betelgeuse" }]
            },
            {
                name: "Altair", ra: 19.85, dec: 8.87, color: 0xffffff,
                description: "The brightest star in the constellation of Aquila and the twelfth-brightest star in the night sky. It is an A-type main-sequence star.",
                imageUrl: "images/heic0601a.jpg",
                images: ["images/heic0601a.jpg"],
                links: [{ title: "Wikipedia: Altair", url: "https://en.wikipedia.org/wiki/Altair" }]
            },
            {
                name: "Aldebaran", ra: 4.6, dec: 16.51, color: 0xff8c00,
                description: "A giant star located in the zodiac constellation Taurus. It is the brightest star in Taurus and generally the fourteenth-brightest star in the night sky.",
                imageUrl: "images/potw1726a.jpg",
                images: ["images/potw1726a.jpg"],
                links: [{ title: "Wikipedia: Aldebaran", url: "https://en.wikipedia.org/wiki/Aldebaran" }]
            },
            {
                name: "Antares", ra: 16.49, dec: -26.43, color: 0xff4500,
                description: "A red supergiant star in the constellation of Scorpius. It is the fifteenth-brightest star in the night sky.",
                imageUrl: "images/heic1209a.jpg",
                images: ["images/heic1209a.jpg"],
                links: [{ title: "Wikipedia: Antares", url: "https://en.wikipedia.org/wiki/Antares" }]
            },
            {
                name: "Spica", ra: 13.42, dec: -11.16, color: 0xa3c2ff,
                description: "The brightest object in the constellation of Virgo and one of the 20 brightest stars in the night sky.",
                imageUrl: "images/heic0206a.jpg",
                images: ["images/heic0206a.jpg"],
                links: [{ title: "Wikipedia: Spica", url: "https://en.wikipedia.org/wiki/Spica" }]
            },
            {
                name: "Pollux", ra: 7.76, dec: 28.03, color: 0xffd27d,
                description: "An orange-hued giant star in the constellation of Gemini. It is the brightest star in Gemini and the closest giant star to the Sun.",
                imageUrl: "images/heic1007b.jpg",
                images: ["images/heic1007b.jpg"],
                links: [{ title: "Wikipedia: Pollux", url: "https://en.wikipedia.org/wiki/Pollux_(star)" }]
            },
            {
                name: "Fomalhaut", ra: 22.96, dec: -29.62, color: 0xffffff,
                description: "The brightest star in the constellation of Piscis Austrinus. It is a class A main-sequence star approximately 25 light-years from the Sun.",
                imageUrl: "images/heic0821a.jpg",
                images: ["images/heic0821a.jpg"],
                links: [{ title: "Wikipedia: Fomalhaut", url: "https://en.wikipedia.org/wiki/Fomalhaut" }]
            },
            {
                name: "Deneb", ra: 20.69, dec: 45.28, color: 0xffffff,
                description: "A first-magnitude star in the constellation of Cygnus. It is one of the vertices of the Summer Triangle and is a blue-white supergiant.",
                imageUrl: "images/heic0910a.jpg",
                images: ["images/heic0910a.jpg"],
                links: [{ title: "Wikipedia: Deneb", url: "https://en.wikipedia.org/wiki/Deneb" }]
            },
            {
                name: "Regulus", ra: 10.14, dec: 11.97, color: 0xa3c2ff,
                description: "The brightest object in the constellation of Leo and one of the brightest stars in the night sky.",
                imageUrl: "images/heic0516d.jpg",
                images: ["images/heic0516d.jpg"],
                links: [{ title: "Wikipedia: Regulus", url: "https://en.wikipedia.org/wiki/Regulus" }]
            },
            {
                name: "Polaris", ra: 2.53, dec: 89.26, color: 0xfff5f5,
                description: "The North Star or Pole Star, is the brightest star in the constellation of Ursa Minor. It is very close to the north celestial pole.",
                imageUrl: "images/heic0704a.jpg",
                images: ["images/heic0704a.jpg"],
                links: [{ title: "Wikipedia: Polaris", url: "https://en.wikipedia.org/wiki/Polaris" }]
            }
        ];

        const radius = 48000;
        this.starMeshes = []; // Store for raycasting

        majorStars.forEach(star => {
            const raRad = (star.ra / 24) * Math.PI * 2;
            const decRad = (star.dec / 180) * Math.PI;

            const x = radius * Math.cos(decRad) * Math.cos(raRad);
            const z = -radius * Math.cos(decRad) * Math.sin(raRad);
            const y = radius * Math.sin(decRad);

            const starGeo = new THREE.SphereGeometry(150, 8, 8);
            const starMat = new THREE.MeshBasicMaterial({ color: star.color });
            const starMesh = new THREE.Mesh(starGeo, starMat);
            starMesh.position.set(x, y, z);
            starMesh.userData = star; // Pass full star object
            starMesh.matrixAutoUpdate = false;
            starMesh.updateMatrix();
            this.scene.add(starMesh);
            this.starMeshes.push(starMesh);


        });
    }



    createPlanets() {
        SolarSystemData.forEach(data => {
            const planet = new CelestialBody(data, this.scene);
            this.planets.push(planet);
        });
    }

    createComets() {
        CometDataList.forEach(data => {
            const comet = new Comet(data, this.scene);
            this.comets.push(comet);
        });
    }

    createSpacecrafts() {
        SpacecraftDataList.forEach(data => {
            let parentObject: THREE.Object3D = this.scene;

            if (data.targetBody) {
                // Find target planet to attach orbit to
                let targetBody = this.planets.find(p => p.data.name === data.targetBody);

                // If not found in planets, search in moons of planets
                if (!targetBody) {
                    for (const planet of this.planets) {
                        const moon = planet.moons.find(m => m.data.name === data.targetBody);
                        if (moon) {
                            targetBody = moon as any;
                            break;
                        }
                    }
                }

                if (targetBody) {
                    parentObject = targetBody.orbitGroup;
                }
            }

            const spacecraft = new Spacecraft(data, parentObject);
            this.spacecrafts.push(spacecraft);
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        if (this.bloomPass) {
            this.bloomPass.setSize(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2));
        }
    }

    update() {
        const rawDelta = Math.min(this.clock.getDelta(), 0.1);
        const deltaTime = rawDelta * this.timeScale;

        // Earth period is 1. speedMultiplier is 0.5.
        // 1 orbit = 2*PI radians. Speed = 0.5 rad/sec (sim time).
        // 1 Earth Year = (2*PI)/0.5 = 12.566 seconds of sim time.
        const earthYearInSimSeconds = (2 * Math.PI) / 0.5;
        const yearsPassed = deltaTime / earthYearInSimSeconds;
        const msPassed = yearsPassed * 365.25 * 24 * 60 * 60 * 1000;
        this.simDate.setTime(this.simDate.getTime() + msPassed);

        const yearsSince2000 = (this.simDate.getTime() - this.baseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        const simTimePassed = yearsSince2000 * earthYearInSimSeconds;

        if (this.tourMode) {
            this.tourTimer += rawDelta;
            if (this.tourTimer >= this.tourInterval) {
                this.tourTimer = 0;
                this.tourIndex = (this.tourIndex + 1) % this.tourTargets.length;
                const targetName = this.tourTargets[this.tourIndex];
                this.focusOnBody(targetName);
                EventBus.emit('tour-focus', targetName);
            }
        }

        const effectiveRawDelta = this.timeScale > 0 ? rawDelta : 0;

        this.planets.forEach(planet => {
            planet.update(deltaTime, simTimePassed, effectiveRawDelta);
        });

        if (this.habitableZoneMesh && this.showHabitableZone) {
            if (this.habitableZoneMesh.material instanceof THREE.ShaderMaterial) {
                this.habitableZoneMesh.material.uniforms.time.value += effectiveRawDelta * 0.3;
            }
        }

        if (this.showComets) {
            this.comets.forEach(comet => {
                comet.update(deltaTime, simTimePassed, effectiveRawDelta);
            });
        }

        if (this.showSpacecrafts) {
            this.spacecrafts.forEach(sc => {
                sc.update(deltaTime, simTimePassed, this.simDate, effectiveRawDelta);
            });
        }

        // Rotate asteroid belt slowly
        if (this.asteroidBelt && this.showAsteroids) {
            this.asteroidBelt.rotation.y -= 0.05 * deltaTime;
        }

        // Rotate Kuiper belt very slowly
        if (this.kuiperBelt && this.showKuiperBelt) {
            this.kuiperBelt.rotation.y -= 0.01 * deltaTime;
        }

        if (this.cameraTransition) {
            this.cameraTransition.progress += rawDelta / this.cameraTransition.duration;
            const p = Math.min(this.cameraTransition.progress, 1);
            // Cubic ease-in-out curve
            const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

            this.camera.position.lerpVectors(this.cameraTransition.startPos, this.cameraTransition.endPos, ease);
            this.controls.target.lerpVectors(this.cameraTransition.startTarget, this.cameraTransition.endTarget, ease);

            if (p >= 1) {
                this.cameraTransition = null;
                this.updateZoomLimits();
            }
        } else if (this.focusedBody?.mesh) {
            this.focusedBody.mesh.getWorldPosition(SceneManager._vPos);

            // Calculate delta movement of the body
            if (this.previousBodyPosition) {
                SceneManager._vDelta.copy(SceneManager._vPos).sub(this.previousBodyPosition);
                this.camera.position.add(SceneManager._vDelta);
                this.previousBodyPosition.copy(SceneManager._vPos);
            } else {
                this.previousBodyPosition = SceneManager._vPos.clone();
            }

            this.controls.target.copy(SceneManager._vPos);
            this.controls.enabled = true;
        } else {
            this.controls.enabled = true;
            this.previousBodyPosition = null;
            this.updateZoomLimits();
        }

        this.controls.update(); // Required for OrbitControls to work

        if (this.surfaceViewBody?.mesh) {
            // Force update matrix world so we don't lag behind the animation frame
            this.surfaceViewBody.mesh.updateMatrixWorld(true);
            const scale = this.surfaceViewBody.tiltGroup.scale.x;
            const actualRadius = this.surfaceViewBody.data.radius * scale;
            const worldMargin = Math.max(actualRadius * 0.1, 2);

            // To ensure we don't clip into clouds or atmosphere, we need the local distance
            const localDistance = this.surfaceViewBody.data.radius + (worldMargin / scale);

            // We place the camera on the +X equator of the planet in its local space
            SceneManager._vLocalPos.set(localDistance, 0, 0);

            // Get the world position of this point, rotating with the planet
            SceneManager._vCamPos.copy(SceneManager._vLocalPos).applyMatrix4(this.surfaceViewBody.mesh.matrixWorld);

            // The center of the planet in world space
            this.surfaceViewBody.mesh.getWorldPosition(SceneManager._vPlanetPos);

            this.camera.position.copy(SceneManager._vCamPos);

            // Look directly outwards from the surface (away from the center)
            SceneManager._vLookTarget.copy(SceneManager._vCamPos)
                .sub(SceneManager._vPlanetPos)
                .normalize()
                .multiplyScalar(100)
                .add(SceneManager._vCamPos);

            this.camera.lookAt(SceneManager._vLookTarget);
            this.controls.enabled = false;
        }

        // Update Measurement Tool after camera updates so labels don't lag
        this.updateMeasurement();

        this.composer.render();
    }

    toggleOrbits(visible: boolean) {
        this.showOrbits = visible;
        this.planets.forEach(planet => {
            if (planet.data.isDwarfPlanet) {
                planet.toggleOrbit(visible && this.showDwarfPlanets);
            } else {
                planet.toggleOrbit(visible);
            }
        });
        this.comets.forEach(comet => comet.toggleOrbit(visible));
        this.spacecrafts.forEach(sc => sc.toggleOrbit(visible));
    }

    toggleComets(visible: boolean) {
        this.showComets = visible;
        this.comets.forEach(comet => {
            comet.mesh.visible = visible;
            if (comet.orbitLine) comet.orbitLine.visible = visible && this.showOrbits;
            if (comet.tailParticles) comet.tailParticles.visible = visible;
        });
    }

    toggleMoons(visible: boolean) {
        this.showMoons = visible;
        this.planets.forEach(planet => planet.toggleMoons(visible));
    }

    toggleMeteors(visible: boolean) {
        this.showMeteors = visible;
        this.planets.forEach(planet => {
            if (planet.toggleMeteors) {
                planet.toggleMeteors(visible);
            }
        });
    }

    toggleTrails(visible: boolean) {
        this.showTrails = visible;
        this.planets.forEach(planet => {
            if (planet.toggleTrails) {
                planet.toggleTrails(visible);
            }
        });
    }

    toggleSpacecrafts(visible: boolean) {
        this.showSpacecrafts = visible;
        this.spacecrafts.forEach(sc => {
            sc.mesh.visible = visible;
            if (sc.orbitLine) sc.orbitLine.visible = visible && this.showOrbits;
        });
    }

    toggleAsteroids(visible: boolean) {
        this.showAsteroids = visible;
        if (this.asteroidBelt) {
            this.asteroidBelt.visible = visible;
        }
    }

    toggleKuiperBelt(visible: boolean) {
        this.showKuiperBelt = visible;
        if (this.kuiperBelt) {
            this.kuiperBelt.visible = visible;
        }
    }

    toggleDwarfPlanets(visible: boolean) {
        this.showDwarfPlanets = visible;
        this.planets.forEach(planet => {
            if (planet.data.isDwarfPlanet) {
                planet.orbitGroup.visible = visible;
                planet.toggleOrbit(visible && this.showOrbits);
            }
        });
    }



    toggleHabitableZone(visible: boolean) {
        this.showHabitableZone = visible;
        if (this.habitableZoneMesh) {
            this.habitableZoneMesh.visible = visible;
        }
    }

    toggleEclipticGrid(visible: boolean) {
        this.showEclipticGrid = visible;
        if (this.eclipticGridMesh) {
            this.eclipticGridMesh.visible = visible;
        }
    }

    toggleRealisticLighting(visible: boolean) {
        this.realisticLighting = visible;
        if (this.ambientLight) {
            // Realistic lighting has very low ambient light to show stark shadows
            this.ambientLight.intensity = visible ? 0.05 : 0.4;
        }
        if (this.pointLight) {
            this.pointLight.intensity = visible ? 2.8 : 2.0;
        }
    }

    toggleAxes(visible: boolean) {
        this.showAxes = visible;
        this.planets.forEach(planet => {
            if (planet.toggleAxes) {
                planet.toggleAxes(visible);
            }
        });
    }

    toggleRealisticDistances(visible: boolean) {
        this.realisticDistances = visible;
        this.updateRealisticSizes();
    }

    setRealSizeRatio(ratio: number) {
        this.realSizeRatio = ratio;
        this.updateRealisticSizes();
    }

    updateRealisticSizes() {
        const sun = this.planets.find(p => p.data.name === 'Sun');
        if (sun && sun.labelSprite) {
            sun.showLabel = this.realisticDistances;
            sun.labelSprite.visible = this.realisticDistances;
        }

        this.planets.forEach(planet => {
            if (planet.rebuildOrbit) {
                planet.rebuildOrbit(this.realisticDistances);
            }
            if (planet.labelSprite) {
                planet.showLabel = this.realisticDistances;
                planet.labelSprite.visible = this.realisticDistances;
                // Since sizeAttenuation is false, we don't need to dynamically adjust the scale based on the planet's radius
                // to make it visible. It will always maintain its on-screen percentage size.
            }
        });

        this.comets.forEach(comet => {
            if (comet.rebuildOrbit) {
                comet.rebuildOrbit(this.realisticDistances);
            }
        });

        this.spacecrafts.forEach(sc => {
            if (sc.rebuildOrbit) {
                sc.rebuildOrbit(this.realisticDistances);
            }
        });

        this.updateZoomLimits();
    }

    focusOnBody(name: string, smooth: boolean = true) {
        // Find planet or moon or comet or spacecraft
        let target: CelestialBody | Comet | Spacecraft | undefined;

        const findTarget = (body: CelestialBody) => {
            if (body.data.name === name) {
                target = body;
            }
            body.moons.forEach(findTarget);
        };

        this.planets.forEach(findTarget);

        target = target || this.comets.find((c: Comet) => c.data.name === name);
        target = target || this.spacecrafts.find((s: Spacecraft) => s.data.name === name);

        if (target && target.mesh) {
            target.mesh.getWorldPosition(SceneManager._vPos);

            // Adjust camera distance based on radius (Spacecraft have smaller 'models')
            const radius = 'radius' in target.data ? target.data.radius : 0.5;
            let distance = radius * 5;

            // Comets need a larger distance to see the tail
            if ('tailParticles' in target) {
                distance = Math.max(distance, 40);
            }

            const targetCamPos = new THREE.Vector3(
                SceneManager._vPos.x + distance,
                SceneManager._vPos.y + distance * 0.5,
                SceneManager._vPos.z + distance
            );

            if (smooth && this.focusedBody !== target) {
                this.cameraTransition = {
                    startPos: this.camera.position.clone(),
                    endPos: targetCamPos,
                    startTarget: this.controls.target.clone(),
                    endTarget: SceneManager._vPos.clone(),
                    progress: 0,
                    duration: 1.2
                };
            } else {
                this.camera.position.copy(targetCamPos);
                this.controls.target.copy(SceneManager._vPos);
                this.cameraTransition = null;
            }

            this.focusedBody = target;
            this.surfaceViewBody = null;

            // Initialize previous position for tracking
            this.previousBodyPosition = SceneManager._vPos.clone();

            // Enable auto-rotation for dynamic background
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 0.5;

            this.updateZoomLimits();
        }
    }

    focusOnStar(starMesh: THREE.Object3D) {
        // Disable planet following
        this.focusedBody = null;
        this.surfaceViewBody = null;
        this.previousBodyPosition = null;
        this.controls.autoRotate = false;

        const starPos = starMesh.position.clone();

        // Look at the star
        this.controls.target.copy(starPos);

        // Move camera closer to the star, but not too close (it's a background object)
        // Star is at radius ~48000. Let's move to ~40000 along the same vector
        const cameraPos = starPos.clone().normalize().multiplyScalar(40000);

        this.camera.position.copy(cameraPos);
        this.controls.enabled = true;
        this.cameraTransition = null;
        this.controls.minDistance = 200;
        this.controls.maxDistance = 20000;
    }

    focusOnConstellation(name: string) {
        const group = this.constellationManager.constellationMeshes.find(g => g.userData.name === name);
        if (!group) return;

        const box = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);

        this.focusedBody = null;
        this.surfaceViewBody = null;
        this.previousBodyPosition = null;
        this.controls.autoRotate = false;

        this.controls.target.copy(center);

        // Move camera to view the constellation
        // Calculate distance based on bounding sphere radius and camera fov
        const vFov = this.camera.fov * (Math.PI / 180);
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
        const minFov = Math.min(vFov, hFov);

        // Add 20% padding to radius to ensure it fits well
        const distance = (sphere.radius * 1.2) / Math.sin(minFov / 2);

        // Constellations are on a sphere of radius ~49000
        // We move the camera along the vector from origin to center
        // and place it at (center.length() - distance) from origin
        let camDistFromOrigin = center.length() - distance;

        // Ensure the camera doesn't go too close to origin (e.g. into the sun)
        // or too far outside the constellation sphere
        if (camDistFromOrigin < 1000) camDistFromOrigin = 1000;

        const cameraPos = center.clone().normalize().multiplyScalar(camDistFromOrigin);
        this.camera.position.copy(cameraPos);
        this.controls.enabled = true;
        this.cameraTransition = null;
        this.controls.minDistance = Math.max(distance * 0.1, 100);
        this.controls.maxDistance = Math.max(distance * 3, 20000);
    }

    updateZoomLimits(): void {
        if (!this.controls) return;

        // If camera is undergoing smooth transition, do not clamp bounds until arrival
        // (unless user manually starts interacting, which cancels the transition)
        if (this.cameraTransition) {
            this.controls.minDistance = 0.1;
            this.controls.maxDistance = 100000;
            return;
        }

        if (this.focusedBody && this.focusedBody.mesh) {
            const target = this.focusedBody;
            const isSun = target.data?.name === 'Sun';
            const scale = ('tiltGroup' in target && target.tiltGroup) ? target.tiltGroup.scale.x : 1.0;
            const rawRadius = ('data' in target && target.data && 'radius' in target.data) ? target.data.radius : 0.5;
            const visualRadius = rawRadius * scale;

            // Ensure camera near plane (0.1) never slices into planet geometry or atmosphere
            const nearPlane = this.camera?.near ?? 0.1;
            const surfaceMargin = Math.max(visualRadius * 0.25, nearPlane * 2, 0.4);
            const minDistance = visualRadius + surfaceMargin;

            let maxDistance: number;
            if (isSun) {
                // Sun is at center of solar system; allow zooming out to full system overview
                maxDistance = this.realisticDistances ? 25000 : 5000;
            } else if ('tailParticles' in target) {
                // Comet: allow viewing nucleus up to full tail span
                maxDistance = this.realisticDistances ? 4000 : 1000;
            } else if ('targetBody' in target.data && target.data.targetBody) {
                // Spacecraft / satellite orbiting a planet: allow seeing parent planet context
                maxDistance = this.realisticDistances ? 2500 : 600;
            } else if ('isMoon' in target && target.isMoon) {
                // Moon orbiting a planet: allow seeing moon and parent planet
                maxDistance = this.realisticDistances ? 3000 : 800;
            } else {
                // Major planet / dwarf planet: allow seeing planet, all moons, and local orbit
                maxDistance = this.realisticDistances ? 8000 : 1800;
            }

            this.controls.minDistance = Math.max(minDistance, 0.1);
            this.controls.maxDistance = Math.max(maxDistance, this.controls.minDistance * 1.5);
        } else {
            // Free Camera / Overview mode
            const sun = this.planets.find(p => p.data.name === 'Sun');
            const sunScale = (sun && sun.tiltGroup) ? sun.tiltGroup.scale.x : 1.0;
            const sunRadius = (sun ? sun.data.radius : 25) * sunScale;

            // Check if current target is near the Sun or another celestial body
            const targetPos = this.controls.target;
            const distFromSun = targetPos.length();

            if (distFromSun < sunRadius * 2) {
                // Target is at or near the Sun: prevent zooming through surface into the core
                this.controls.minDistance = Math.max(sunRadius * 1.25, 30);
            } else {
                // Target is panned elsewhere: prevent camera from reaching zero distance / inverted orientation
                const closestRadius = this.getClosestBodyRadiusAt(targetPos);
                this.controls.minDistance = Math.max(closestRadius * 1.25, 1.0);
            }

            // Max distance: prevent zooming beyond the solar system into empty black space
            this.controls.maxDistance = this.realisticDistances ? 25000 : 5000;
        }
    }

    private getClosestBodyRadiusAt(pos: THREE.Vector3): number {
        let closestRadius = 0;
        let minDistanceSq = 10000; // within 100 units

        const checkBody = (body: CelestialBody) => {
            if (body.mesh) {
                body.mesh.getWorldPosition(SceneManager._vPos);
                const dSq = pos.distanceToSquared(SceneManager._vPos);
                if (dSq < minDistanceSq) {
                    minDistanceSq = dSq;
                    const scale = body.tiltGroup ? body.tiltGroup.scale.x : 1.0;
                    closestRadius = body.data.radius * scale;
                }
            }
            body.moons.forEach(checkBody);
        };

        this.planets.forEach(checkBody);
        return closestRadius;
    }

    updateMeasurement() {
        if (!this.measureMode || !this.measureLine || !this.measureLabel) {
            if (this.measureLine) this.measureLine.visible = false;
            if (this.measureLabel) this.measureLabel.visible = false;
            return;
        }

        if (this.measureTargetA && this.measureTargetA.mesh && this.measureTargetB && this.measureTargetB.mesh) {
            // When 'realistic distances' is off, a planet's 'mesh' might be moving on an orbit but we need its actual position in the world.
            this.scene.updateMatrixWorld(true);

            if (this.measureTargetA && 'orbitGroup' in this.measureTargetA) {
                (this.measureTargetA as any).orbitGroup.getWorldPosition(SceneManager._vPosA);
            } else if (this.measureTargetA && 'mesh' in this.measureTargetA) {
                (this.measureTargetA as any).mesh.getWorldPosition(SceneManager._vPosA);
            }

            if (this.measureTargetB && 'orbitGroup' in this.measureTargetB) {
                (this.measureTargetB as any).orbitGroup.getWorldPosition(SceneManager._vPosB);
            } else if (this.measureTargetB && 'mesh' in this.measureTargetB) {
                (this.measureTargetB as any).mesh.getWorldPosition(SceneManager._vPosB);
            }

            // Update line
            this.measureLine.geometry.setFromPoints([SceneManager._vPosA, SceneManager._vPosB]);
            this.measureLine.geometry.attributes.position.needsUpdate = true;
            this.measureLine.computeLineDistances();
            this.measureLine.visible = true;

            // Update label position (midpoint)
            SceneManager._vMid.copy(SceneManager._vPosA).add(SceneManager._vPosB).multiplyScalar(0.5);

            // Offset label slightly towards camera so it's readable
            SceneManager._vOffset.subVectors(this.camera.position, SceneManager._vMid).normalize().multiplyScalar(10);
            this.measureLabel.position.copy(SceneManager._vMid).add(SceneManager._vOffset);

            // Calculate distance
            const distanceScale = SceneManager._vPosA.distanceTo(SceneManager._vPosB);

            // Update text (distance)
            // Note: Earth is at 130 in simulation. 1 AU = 130 units roughly.
            const distanceAU = (distanceScale / 130).toFixed(2);
            const distanceMkm = (parseFloat(distanceAU) * 149.6).toFixed(1);
            this.updateMeasureLabel(`Dist: ${distanceAU} AU / ${distanceMkm} Mkm`);

            // Scale label size based on camera distance so it's readable
            const camDist = this.camera.position.distanceTo(this.measureLabel.position);
            const scaleY = Math.max(camDist * 0.05, 10);

            // The texture image (canvas) might have changed width, so we need to maintain aspect ratio
            const canvas = this.measureLabel.material.map?.image as HTMLCanvasElement;
            if (canvas) {
                const ratio = canvas.width / canvas.height;
                this.measureLabel.scale.set(scaleY * ratio, scaleY, 1);
            } else {
                this.measureLabel.scale.set(scaleY * 4, scaleY, 1); // Fallback
            }

            this.measureLabel.visible = true;
        } else {
            this.measureLine.visible = false;
            this.measureLabel.visible = false;
        }
    }

    toggleMeasureMode(visible: boolean) {
        this.measureMode = visible;
        if (!visible) {
            this.measureTargetA = null;
            this.measureTargetB = null;
            if (this.measureLine) this.measureLine.visible = false;
            if (this.measureLabel) this.measureLabel.visible = false;
        }
    }

    setMeasureTarget(name: string) {
        let target: CelestialBody | Comet | Spacecraft | undefined;

        const findTarget = (body: CelestialBody) => {
            if (body.data.name === name) {
                target = body;
            }
            body.moons.forEach(findTarget);
        };

        this.planets.forEach(findTarget);
        target = target || this.comets.find((c: Comet) => c.data.name === name);
        target = target || this.spacecrafts.find((s: Spacecraft) => s.data.name === name);

        if (target) {
            if (!this.measureTargetA) {
                this.measureTargetA = target;
            } else if (!this.measureTargetB && target !== this.measureTargetA) {
                this.measureTargetB = target;
                if (this.onMeasureTargetsSet) {
                    this.onMeasureTargetsSet();
                }
            } else {
                // If both set, reset A to new target, B to null
                this.measureTargetA = target;
                this.measureTargetB = null;
            }
        }
    }

    detachCamera() {
        this.focusedBody = null;
        this.surfaceViewBody = null;
        this.previousBodyPosition = null;
        this.controls.enabled = true;
        this.controls.autoRotate = false;
        this.cameraTransition = null;
        this.updateZoomLimits();
    }

    setSurfaceView(name: string) {
        let target: CelestialBody | undefined;

        const findTarget = (body: CelestialBody) => {
            if (body.data.name === name) {
                target = body;
            }
            body.moons.forEach(findTarget);
        };

        this.planets.forEach(findTarget);

        if (target && target.mesh) {
            this.surfaceViewBody = target;
            this.focusedBody = null;
            this.previousBodyPosition = null;
        }
    }

    captureScreenshot(targetName?: string): void {
        if (!this.renderer) return;

        // Render current scene
        this.composer.render();
        const srcCanvas = this.renderer.domElement;

        // Create export canvas matching source dimensions
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = srcCanvas.width;
        exportCanvas.height = srcCanvas.height;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;

        // Draw the WebGL scene
        ctx.drawImage(srcCanvas, 0, 0);

        // Watermark badge in bottom-right corner
        const w = exportCanvas.width;
        const h = exportCanvas.height;
        const badgeWidth = Math.min(360, w * 0.45);
        const badgeHeight = 52;
        const badgeX = w - badgeWidth - 24;
        const badgeY = h - badgeHeight - 24;

        ctx.save();
        ctx.fillStyle = 'rgba(8, 14, 30, 0.78)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 10);
        } else {
            ctx.rect(badgeX, badgeY, badgeWidth, badgeHeight);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('SOLAR SYSTEM 3D OBSERVATORY', badgeX + 16, badgeY + 22);

        const targetLabel = targetName || (this.focusedBody as any)?.data?.name || 'Solar System';
        const dateLabel = this.simDate ? this.simDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11px sans-serif';
        ctx.fillText(`Target: ${targetLabel}  •  Epoch: ${dateLabel}`, badgeX + 16, badgeY + 40);
        ctx.restore();

        try {
            exportCanvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const cleanName = (targetLabel || 'solar-system').toLowerCase().replace(/\s+/g, '-');
                a.download = `${cleanName}-${dateLabel}.png`;
                a.href = url;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }, 'image/png');
        } catch (e) {
            console.warn('Screenshot capture failed:', e);
        }
    }

    dispose() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', this.onResizeBound);
            window.removeEventListener('orientationchange', this.onOrientationChangeBound);
        }

        this.comets.forEach(comet => comet.dispose());
        this.comets = [];

        this.spacecrafts.forEach(sc => sc.dispose());
        this.spacecrafts = [];

        this.planets.forEach(planet => planet.dispose());
        this.planets = [];

        this.constellationManager.dispose();

        if (this.asteroidBelt) {
            this.asteroidBelt.geometry.dispose();
            if (Array.isArray(this.asteroidBelt.material)) {
                this.asteroidBelt.material.forEach(m => m.dispose());
            } else {
                this.asteroidBelt.material.dispose();
            }
            this.scene.remove(this.asteroidBelt);
            this.asteroidBelt = null;
        }

        if (this.kuiperBelt) {
            this.kuiperBelt.geometry.dispose();
            if (Array.isArray(this.kuiperBelt.material)) {
                this.kuiperBelt.material.forEach(m => m.dispose());
            } else {
                this.kuiperBelt.material.dispose();
            }
            this.scene.remove(this.kuiperBelt);
            this.kuiperBelt = null;
        }

        if (this.habitableZoneMesh) {
            this.habitableZoneMesh.geometry.dispose();
            if (Array.isArray(this.habitableZoneMesh.material)) {
                this.habitableZoneMesh.material.forEach(m => m.dispose());
            } else {
                this.habitableZoneMesh.material.dispose();
            }
            this.scene.remove(this.habitableZoneMesh);
            this.habitableZoneMesh = null;
        }

        if (this.eclipticGridMesh) {
            this.eclipticGridMesh.geometry.dispose();
            if (Array.isArray(this.eclipticGridMesh.material)) {
                this.eclipticGridMesh.material.forEach(m => m.dispose());
            } else {
                this.eclipticGridMesh.material.dispose();
            }
            this.scene.remove(this.eclipticGridMesh);
            this.eclipticGridMesh = null;
        }

        if (this.measureLine) {
            this.measureLine.geometry.dispose();
            if (Array.isArray(this.measureLine.material)) {
                this.measureLine.material.forEach(m => m.dispose());
            } else {
                this.measureLine.material.dispose();
            }
            this.scene.remove(this.measureLine);
            this.measureLine = null;
        }

        if (this.measureLabel) {
            this.measureLabel.material.dispose();
            this.scene.remove(this.measureLabel);
            this.measureLabel = null;
        }

        this.starMeshes.forEach(mesh => {
            if (mesh instanceof THREE.Points) {
                mesh.geometry.dispose();
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
            this.scene.remove(mesh);
        });
        this.starMeshes = [];

        if (this.controls) {
            this.controls.dispose();
        }

        if (this.composer) {
            this.composer.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentElement) {
                this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
            }
        }

        TextureGenerator.dispose();
    }
}
