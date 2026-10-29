import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CelestialBody } from './CelestialBody';
import { SolarSystemData, CometDataList, SpacecraftDataList } from './SolarSystemData';
import { ConstellationManager } from './ConstellationManager';
import { Comet } from './Comet';
import { Spacecraft } from './Spacecraft';
import { TextureGenerator } from './TextureGenerator';
import { EventBus } from './EventBus';
import { PreferencesManager } from './PreferencesManager';
import { solveKepler } from './MathUtils';
import { i18n } from '../i18n';
import {
    buildAsteroidBelt,
    buildKuiperBelt,
    buildHabitableZone,
    buildEclipticGrid,
    buildStarfield,
    StarfieldHandle
} from './BeltBuilder';
import { applySpaceEnvironmentMap, EnvironmentMapHandle } from './EnvironmentMapGenerator';
import { exportObservatoryScreenshot } from './ScreenshotExporter';

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
    focusedStar: THREE.Object3D | null = null;
    focusedConstellation: string | null = null;
    constellationDistance: number = 20000;
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
    showConstellations: boolean;
    realisticLighting: boolean;
    showAxes: boolean;
    realisticDistances: boolean = false;
    realSizeRatio: number = 1.0;

    ambientLight: THREE.AmbientLight;
    pointLight: THREE.PointLight;
    private onResizeBound: () => void = () => {};
    private onOrientationChangeBound: () => void = () => {};
    private onSurfacePointerDownBound: (e: PointerEvent) => void = () => {};
    private onSurfacePointerMoveBound: (e: PointerEvent) => void = () => {};
    private onSurfacePointerUpBound: () => void = () => {};
    private isSurfaceDragging: boolean = false;
    private surfaceLastX: number = 0;
    private surfaceLastY: number = 0;
    private surfaceYaw: number = 0;
    private surfacePitch: number = 0.22; // ~12.6 deg above local horizon

    habitableZoneMesh: THREE.Mesh | null;
    eclipticGridMesh: THREE.PolarGridHelper | null;
    private starfieldHandle: StarfieldHandle | null = null;
    private envMapHandle: EnvironmentMapHandle | null = null;
    private lastFreeZoomTarget = new THREE.Vector3(Infinity, Infinity, Infinity);

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
    currentMeasureDistance: {
        distanceScale: number;
        distanceAUVal: number;
        distanceMkmVal: number;
        distanceAU: string;
        distanceMkm: string;
        unitAU: string;
        unitMkm: string;
    } | null = null;
    onTimeScaleChange?: (newScale: number) => void;
    onMeasureTargetsSet?: () => void;
    private unregisterI18n?: () => void;

    cameraTransition: {
        startPos: THREE.Vector3;
        endPos: THREE.Vector3;
        startTarget: THREE.Vector3;
        endTarget: THREE.Vector3;
        targetBody?: CelestialBody | Comet | Spacecraft | null;
        endOffset?: THREE.Vector3;
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
    private static readonly _vLocalUp = new THREE.Vector3();
    private static readonly _vZenith = new THREE.Vector3();
    private static readonly _vEast = new THREE.Vector3();
    private static readonly _vNorthTangent = new THREE.Vector3();
    private static readonly _vAuA = new THREE.Vector3();
    private static readonly _vAuB = new THREE.Vector3();

    public static readonly EARTH_YEAR_SIM_SECONDS = (2 * Math.PI) / 0.5;
    public static readonly DAYS_PER_YEAR = 365.25;

    public static readonly SPEED_PRESETS = {
        realTime: (1 / 86400) * ((2 * Math.PI) / 0.5) / 365.25,
        oneHour: (1 / 24) * ((2 * Math.PI) / 0.5) / 365.25,
        oneDay: 1.0 * ((2 * Math.PI) / 0.5) / 365.25,
        oneWeek: 7.0 * ((2 * Math.PI) / 0.5) / 365.25,
        oneMonth: (365.25 / 12) * ((2 * Math.PI) / 0.5) / 365.25
    };

    public static readonly REALISTIC_TIME_SCALE = SceneManager.SPEED_PRESETS.oneDay;

    public static daysPerSecondToTimeScale(daysPerSec: number): number {
        return (daysPerSec * SceneManager.EARTH_YEAR_SIM_SECONDS) / SceneManager.DAYS_PER_YEAR;
    }

    public static timeScaleToDaysPerSecond(timeScale: number): number {
        return (timeScale * SceneManager.DAYS_PER_YEAR) / SceneManager.EARTH_YEAR_SIM_SECONDS;
    }

    public getFormattedTimeSpeed(scale: number = this.timeScale): string {
        const isEn = i18n.currentLanguage === 'en';
        if (scale === 0) {
            return isEn ? 'Paused' : (i18n.t('controls.speedPresets.paused') || 'Paused');
        }
        if (scale <= SceneManager.SPEED_PRESETS.realTime * 1.5) {
            return isEn ? 'Real-Time (1:1)' : (i18n.t('controls.speedPresets.realTime') || 'Real-Time (1:1)');
        }
        const fmt = (val: number) => isEn
            ? val.toFixed(1)
            : i18n.formatNumber(val, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

        const daysPerSec = SceneManager.timeScaleToDaysPerSecond(scale);
        const hoursPerSec = daysPerSec * 24;
        if (daysPerSec < 0.9) {
            if (hoursPerSec < 0.1) {
                const minsPerSec = hoursPerSec * 60;
                return `${fmt(minsPerSec)} min/s`;
            }
            const unit = isEn ? 'hr/s' : (i18n.t('controls.speedUnits.hrPerSec') || 'hr/s');
            return `${fmt(hoursPerSec)} ${unit}`;
        }
        if (daysPerSec >= 0.9 && daysPerSec < 6.5) {
            const unit = isEn ? 'day/s' : (i18n.t('controls.speedUnits.dayPerSec') || 'day/s');
            return `${fmt(daysPerSec)} ${unit}`;
        }
        if (daysPerSec >= 6.5 && daysPerSec < 27) {
            const weeksPerSec = daysPerSec / 7;
            const unit = isEn ? 'wk/s' : (i18n.t('controls.speedUnits.wkPerSec') || 'wk/s');
            return `${fmt(weeksPerSec)} ${unit}`;
        }
        const monthsPerSec = daysPerSec / (SceneManager.DAYS_PER_YEAR / 12);
        const unit = isEn ? 'mo/s' : (i18n.t('controls.speedUnits.moPerSec') || 'mo/s');
        return `${fmt(monthsPerSec)} ${unit}`;
    }

    constructor(container: HTMLElement) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.planets = [];
        this.comets = [];
        this.spacecrafts = [];
        this.timeScale = SceneManager.REALISTIC_TIME_SCALE;
        this.showOrbits = PreferencesManager.get('showOrbits');
        this.showMoons = PreferencesManager.get('showMoons');
        this.showComets = PreferencesManager.get('showComets');
        this.showSpacecrafts = PreferencesManager.get('showSpacecraft');
        this.showMeteors = PreferencesManager.get('showMeteors');
        this.showTrails = PreferencesManager.get('showTrails');
        this.focusedBody = null;
        this.surfaceViewBody = null;
        this.focusedStar = null;
        this.focusedConstellation = null;
        this.constellationDistance = 20000;
        this.starMeshes = [];
        this.previousBodyPosition = null;
        this.asteroidBelt = null;
        this.kuiperBelt = null;
        this.showAsteroids = PreferencesManager.get('showAsteroids');
        this.showKuiperBelt = PreferencesManager.get('showKuiperBelt');
        this.showDwarfPlanets = PreferencesManager.get('showDwarfPlanets');
        this.showHabitableZone = PreferencesManager.get('showHabitableZone');
        this.showEclipticGrid = PreferencesManager.get('showEclipticGrid');
        this.showConstellations = PreferencesManager.get('showConstellations');
        this.realisticLighting = PreferencesManager.get('realisticLighting');
        this.showAxes = PreferencesManager.get('showAxes');
        this.realisticDistances = PreferencesManager.get('realisticDistances');

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
        this.tourInterval = 12;

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
        this.scene.background = new THREE.Color(0x02050d);

        // Logarithmic depth buffer + 1e-4 near plane allows seamless zoom from 50,000-unit skybox
        // right down to 0.0055-unit realistic-scale planets and spacecraft without clipping or Z-fighting.
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.0001,
            100000
        );
        this.camera.position.set(0, 100, 400);

        const isMobile = ('ontouchstart' in window) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) || window.innerWidth <= 768;
        const maxDPR = isMobile ? 1.75 : 2;
        const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            logarithmicDepthBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(dpr);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        if (this.renderer.info) {
            this.renderer.info.autoReset = false;
        }
        this.container.appendChild(this.renderer.domElement);

        const maxAniso = this.renderer.capabilities?.getMaxAnisotropy?.() ?? 16;
        TextureGenerator.setMaxAnisotropy(maxAniso);

        // Procedural PMREM space environment map for realistic metallic spacecraft specular reflections
        this.envMapHandle = applySpaceEnvironmentMap(this.scene, this.renderer);

        // Post-processing pipeline: RenderPass -> UnrealBloomPass -> OutputPass (ACES tone mapping + sRGB)
        const renderScene = new RenderPass(this.scene, this.camera);
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.78, // balanced cinematic HDR bloom strength
            0.52, // soft organic radius
            0.85  // HDR threshold
        );

        const rtWidth = Math.max(1, Math.floor(window.innerWidth * dpr));
        const rtHeight = Math.max(1, Math.floor(window.innerHeight * dpr));
        const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
            samples: isMobile ? 2 : 4,
            type: THREE.HalfFloatType
        });

        this.composer = new EffectComposer(this.renderer, renderTarget);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(new OutputPass());
        this.bloomPass.enabled = PreferencesManager.get('enableBloom');

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = false;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };
        this.controls.addEventListener('start', () => {
            this.cameraTransition = null;
            this.updateZoomLimits();
        });

        // Surface View interactive horizon look-around listeners
        this.setupSurfaceLookControls();

        // Lighting (Sun)
        this.ambientLight = new THREE.AmbientLight(0xffffff, this.realisticLighting ? 0.05 : 0.36);
        this.scene.add(this.ambientLight);

        this.pointLight = new THREE.PointLight(0xfffcf5, this.realisticLighting ? 2.8 : 2.1, 0, 0);
        this.pointLight.castShadow = true;

        const shadowMapSize = isMobile ? 2048 : 4096;
        this.pointLight.shadow.mapSize.width = shadowMapSize;
        this.pointLight.shadow.mapSize.height = shadowMapSize;
        this.pointLight.shadow.camera.near = 10;
        this.pointLight.shadow.camera.far = 2000;
        this.pointLight.shadow.bias = -0.0001;
        this.pointLight.shadow.normalBias = 0.05;
        this.scene.add(this.pointLight);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Starfield & Major Catalog Stars
        this.starfieldHandle = buildStarfield(this.scene, this.renderer);
        this.starMeshes = this.starfieldHandle.starMeshes;

        // Constellations
        this.constellationManager.createConstellations();
        this.constellationManager.toggleVisibility(this.showConstellations);

        // Solar System Bodies & Belts
        this.createPlanets();
        this.createComets();
        this.asteroidBelt = buildAsteroidBelt(this.scene, this.showAsteroids);
        this.kuiperBelt = buildKuiperBelt(this.scene, this.showKuiperBelt);
        this.createSpacecrafts();
        this.habitableZoneMesh = buildHabitableZone(this.scene, this.showHabitableZone);
        this.eclipticGridMesh = buildEclipticGrid(this.scene, this.showEclipticGrid);

        // Resize and orientation handling
        this.onResizeBound = () => this.onWindowResize();
        this.onOrientationChangeBound = () => {
            setTimeout(() => this.onWindowResize(), 150);
        };
        window.addEventListener('resize', this.onResizeBound);
        window.addEventListener('orientationchange', this.onOrientationChangeBound);

        this.createMeasureTools();
        this.updateZoomLimits();

        this.unregisterI18n = i18n.onLanguageChange(() => {
            if (this.measureLabel) {
                (this.measureLabel as any).userData.lastText = null;
            }
            if (this.measureMode) {
                this.updateMeasurement();
            }
            this.planets.forEach(p => p.refreshLabel?.());
        });

        if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
            (document as any).fonts.ready.then(() => {
                this.planets.forEach(p => p.refreshLabel?.());
            }).catch(() => {});
        }

        // Apply all persisted layer & rendering preferences on boot so 3D scene matches UI toggles
        this.applyBootPreferences();
    }

    private setupSurfaceLookControls() {
        const dom = this.renderer?.domElement;
        if (!dom || typeof dom.addEventListener !== 'function') return;

        this.onSurfacePointerDownBound = (e: PointerEvent) => {
            if (!this.surfaceViewBody) return;
            this.isSurfaceDragging = true;
            this.surfaceLastX = e.clientX;
            this.surfaceLastY = e.clientY;
        };
        this.onSurfacePointerMoveBound = (e: PointerEvent) => {
            if (!this.surfaceViewBody || !this.isSurfaceDragging) return;
            const dx = e.clientX - this.surfaceLastX;
            const dy = e.clientY - this.surfaceLastY;
            this.surfaceLastX = e.clientX;
            this.surfaceLastY = e.clientY;
            this.surfaceYaw -= dx * 0.004;
            this.surfacePitch = THREE.MathUtils.clamp(this.surfacePitch + dy * 0.003, -0.35, 1.35);
        };
        this.onSurfacePointerUpBound = () => {
            this.isSurfaceDragging = false;
        };

        dom.addEventListener('pointerdown', this.onSurfacePointerDownBound);
        window.addEventListener('pointermove', this.onSurfacePointerMoveBound);
        window.addEventListener('pointerup', this.onSurfacePointerUpBound);
    }

    private applyBootPreferences() {
        if (!this.showOrbits) this.toggleOrbits(false);
        if (!this.showMoons) this.toggleMoons(false);
        if (!this.showDwarfPlanets) this.toggleDwarfPlanets(false);
        if (!this.showComets) this.toggleComets(false);
        if (!this.showSpacecrafts) this.toggleSpacecrafts(false);
        if (this.showTrails) this.toggleTrails(true);
        if (this.showMeteors) this.toggleMeteors(true);
        if (this.realisticLighting) this.toggleRealisticLighting(true);
        if (this.realisticDistances) this.toggleRealisticDistances(true);
        if (this.showAxes) this.toggleAxes(true);
    }

    createMeasureTools() {
        const material = new THREE.LineDashedMaterial({
            color: 0x34d399,
            linewidth: 2,
            scale: 1,
            dashSize: 10,
            gapSize: 5,
        });

        const geometry = new THREE.BufferGeometry();
        const linePositions = new Float32Array([0, 0, 0, 1, 1, 1]);
        geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        this.measureLine = new THREE.Line(geometry, material);
        this.measureLine.computeLineDistances();
        this.measureLine.visible = false;
        this.measureLine.frustumCulled = false;
        this.scene.add(this.measureLine);

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

        if ((this.measureLabel as any).userData.lastText === text) return;
        (this.measureLabel as any).userData.lastText = text;

        const canvas = this.measureLabel.material.map.image as HTMLCanvasElement;
        const context = canvas.getContext('2d');
        if (!context) return;

        const fontStyle = 'Bold 46px "Exo 2", "Space Grotesk", "Inter", -apple-system, Arial, sans-serif';
        context.font = fontStyle;
        const textMetrics = context.measureText(text);
        const newWidth = Math.max(512, Math.ceil(textMetrics.width + 80));

        if (canvas.width !== newWidth) {
            canvas.width = newWidth;
            context.font = fontStyle;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'rgba(8, 15, 32, 0.9)';
        context.beginPath();
        if (typeof (context as any).roundRect === 'function') {
            (context as any).roundRect(4, 4, canvas.width - 8, canvas.height - 8, 24);
        } else {
            context.rect(4, 4, canvas.width - 8, canvas.height - 8);
        }
        context.fill();
        context.strokeStyle = '#34d399';
        context.lineWidth = 4;
        context.stroke();

        context.fillStyle = '#6ee7b7';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        this.measureLabel.material.map.needsUpdate = true;

        const currentScaleY = this.measureLabel.scale.y;
        this.measureLabel.scale.set(currentScaleY * (canvas.width / canvas.height), currentScaleY, 1);
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

            // Escaping interstellar probes (Voyager 1 & 2) are parented heliocentrically to the scene
            // rather than remaining stuck orbiting schematic Earth.
            if (data.targetBody && !data.escaping) {
                let targetBody = this.planets.find(p => p.data.name === data.targetBody);

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
    }

    private updateSurfaceCamera(target: CelestialBody) {
        if (!target.mesh) return;

        if (typeof target.mesh.updateWorldMatrix === 'function') {
            target.mesh.updateWorldMatrix(true, false);
        } else if (typeof target.mesh.updateMatrixWorld === 'function') {
            target.mesh.updateMatrixWorld(true);
        }

        const scale = target.tiltGroup?.scale ? target.tiltGroup.scale.x : 1;
        const baseRadius = target.data?.radius || 1;
        const actualRadius = baseRadius * scale;
        // Scale margin proportionally in realistic mode so observer stands right above the surface/cloud deck
        const worldMargin = this.realisticDistances ? actualRadius * 0.08 : Math.max(actualRadius * 0.08, 0.35);
        const localDistance = baseRadius + (worldMargin / Math.max(1e-6, scale));

        SceneManager._vLocalPos.set(localDistance, 0, 0);
        SceneManager._vCamPos.copy(SceneManager._vLocalPos).applyMatrix4(target.mesh.matrixWorld);
        target.mesh.getWorldPosition(SceneManager._vPlanetPos);

        this.camera.position.copy(SceneManager._vCamPos);

        // Local surface coordinate frame: Zenith (surface normal), North, and East horizon tangents
        SceneManager._vZenith.copy(SceneManager._vCamPos).sub(SceneManager._vPlanetPos);
        if (SceneManager._vZenith.lengthSq() > 1e-10) {
            SceneManager._vZenith.normalize();
        } else {
            SceneManager._vZenith.set(1, 0, 0);
        }

        SceneManager._vLocalUp.set(0, 1, 0).transformDirection(target.mesh.matrixWorld).normalize();
        SceneManager._vEast.crossVectors(SceneManager._vLocalUp, SceneManager._vZenith);
        if (SceneManager._vEast.lengthSq() < 1e-8) {
            SceneManager._vEast.set(0, 0, 1);
        } else {
            SceneManager._vEast.normalize();
        }
        SceneManager._vNorthTangent.crossVectors(SceneManager._vZenith, SceneManager._vEast).normalize();

        // Look across the curved planetary horizon (interactive yaw + pitch) with Zenith as camera.up
        const cosPitch = Math.cos(this.surfacePitch);
        const sinPitch = Math.sin(this.surfacePitch);
        SceneManager._vLookTarget.set(0, 0, 0)
            .addScaledVector(SceneManager._vEast, Math.cos(this.surfaceYaw) * cosPitch)
            .addScaledVector(SceneManager._vNorthTangent, Math.sin(this.surfaceYaw) * cosPitch)
            .addScaledVector(SceneManager._vZenith, sinPitch)
            .multiplyScalar(Math.max(10, actualRadius * 20))
            .add(SceneManager._vCamPos);

        this.camera.up.copy(SceneManager._vZenith);
        this.camera.lookAt(SceneManager._vLookTarget);
        this.controls.target.copy(SceneManager._vPlanetPos);
    }

    update() {
        const rawDelta = Math.min(this.clock.getDelta(), 0.1);
        const deltaTime = rawDelta * this.timeScale;

        const earthYearInSimSeconds = SceneManager.EARTH_YEAR_SIM_SECONDS;
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

        this.starfieldHandle?.update(rawDelta);

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

        if (this.asteroidBelt && this.showAsteroids) {
            this.asteroidBelt.rotation.y -= 0.05 * deltaTime;
        }

        if (this.kuiperBelt && this.showKuiperBelt) {
            this.kuiperBelt.rotation.y -= 0.01 * deltaTime;
        }

        if (this.surfaceViewBody?.mesh) {
            this.controls.enabled = false;
            this.updateSurfaceCamera(this.surfaceViewBody);
        } else if (this.cameraTransition) {
            this.cameraTransition.progress += rawDelta / this.cameraTransition.duration;
            const p = Math.min(this.cameraTransition.progress, 1);
            const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

            // Track moving celestial bodies live throughout the 1.2s camera flight so high-speed orbits never snap on arrival
            if (this.cameraTransition.targetBody?.mesh && this.cameraTransition.endOffset) {
                this.cameraTransition.targetBody.mesh.updateWorldMatrix?.(true, false);
                this.cameraTransition.targetBody.mesh.getWorldPosition(this.cameraTransition.endTarget);
                this.cameraTransition.endPos.copy(this.cameraTransition.endTarget).add(this.cameraTransition.endOffset);
                if (this.previousBodyPosition) {
                    this.previousBodyPosition.copy(this.cameraTransition.endTarget);
                } else {
                    this.previousBodyPosition = this.cameraTransition.endTarget.clone();
                }
            }

            this.camera.position.lerpVectors(this.cameraTransition.startPos, this.cameraTransition.endPos, ease);
            this.controls.target.lerpVectors(this.cameraTransition.startTarget, this.cameraTransition.endTarget, ease);

            if (p >= 1) {
                this.cameraTransition = null;
                this.updateZoomLimits();
            }
            this.controls.update();
        } else if (this.focusedBody?.mesh) {
            this.focusedBody.mesh.updateWorldMatrix?.(true, false);
            this.focusedBody.mesh.getWorldPosition(SceneManager._vPos);

            if (this.previousBodyPosition) {
                SceneManager._vDelta.copy(SceneManager._vPos).sub(this.previousBodyPosition);
                this.camera.position.add(SceneManager._vDelta);
                this.previousBodyPosition.copy(SceneManager._vPos);
            } else {
                this.previousBodyPosition = SceneManager._vPos.clone();
            }

            this.controls.target.copy(SceneManager._vPos);
            this.controls.enabled = true;
            this.controls.update();
        } else {
            this.controls.enabled = true;
            this.previousBodyPosition = null;
            if (this.controls.target.distanceToSquared(this.lastFreeZoomTarget) > 0.25) {
                this.lastFreeZoomTarget.copy(this.controls.target);
                this.updateZoomLimits();
            }
            this.controls.update();
        }

        this.updateMeasurement();

        // Reset renderer stats manually before EffectComposer so PerformanceMonitor captures full scene calls & triangles
        this.renderer.info?.reset?.();
        this.composer.render();
    }

    toggleOrbits(visible: boolean) {
        this.showOrbits = visible;
        PreferencesManager.set('showOrbits', visible);
        this.planets.forEach(planet => {
            if (planet.data?.isDwarfPlanet) {
                planet.toggleOrbit?.(visible && this.showDwarfPlanets);
            } else {
                planet.toggleOrbit?.(visible);
            }
        });
        this.comets.forEach(comet => comet.toggleOrbit?.(visible));
        this.spacecrafts.forEach(sc => sc.toggleOrbit?.(visible));
    }

    toggleComets(visible: boolean) {
        this.showComets = visible;
        PreferencesManager.set('showComets', visible);
        this.comets.forEach(comet => {
            if (comet.mesh) comet.mesh.visible = visible;
            if (comet.orbitLine) comet.orbitLine.visible = visible && this.showOrbits;
            if (comet.tailParticles) comet.tailParticles.visible = visible;
        });
    }

    toggleMoons(visible: boolean) {
        this.showMoons = visible;
        PreferencesManager.set('showMoons', visible);
        this.planets.forEach(planet => planet.toggleMoons?.(visible));
    }

    toggleMeteors(visible: boolean) {
        this.showMeteors = visible;
        PreferencesManager.set('showMeteors', visible);
        this.planets.forEach(planet => planet.toggleMeteors?.(visible));
    }

    toggleTrails(visible: boolean) {
        this.showTrails = visible;
        PreferencesManager.set('showTrails', visible);
        this.planets.forEach(planet => planet.toggleTrails?.(visible));
    }

    toggleSpacecrafts(visible: boolean) {
        this.showSpacecrafts = visible;
        PreferencesManager.set('showSpacecraft', visible);
        this.spacecrafts.forEach(sc => {
            if (sc.mesh) sc.mesh.visible = visible;
            if (sc.orbitLine) sc.orbitLine.visible = visible && this.showOrbits;
        });
    }

    toggleAsteroids(visible: boolean) {
        this.showAsteroids = visible;
        PreferencesManager.set('showAsteroids', visible);
        if (this.asteroidBelt) {
            this.asteroidBelt.visible = visible;
        }
    }

    toggleKuiperBelt(visible: boolean) {
        this.showKuiperBelt = visible;
        PreferencesManager.set('showKuiperBelt', visible);
        if (this.kuiperBelt) {
            this.kuiperBelt.visible = visible;
        }
    }

    toggleDwarfPlanets(visible: boolean) {
        this.showDwarfPlanets = visible;
        PreferencesManager.set('showDwarfPlanets', visible);
        this.planets.forEach(planet => {
            if (planet.data?.isDwarfPlanet) {
                planet.orbitGroup.visible = visible;
                planet.toggleOrbit?.(visible && this.showOrbits);
            }
        });
    }

    toggleConstellations(visible?: boolean): boolean {
        const next = this.constellationManager.toggleVisibility(visible);
        this.showConstellations = next;
        PreferencesManager.set('showConstellations', next);
        return next;
    }

    toggleBloom(visible?: boolean): boolean {
        const next = visible !== undefined ? visible : (this.bloomPass ? !this.bloomPass.enabled : !PreferencesManager.get('enableBloom'));
        if (this.bloomPass) {
            this.bloomPass.enabled = next;
        }
        PreferencesManager.set('enableBloom', next);
        return next;
    }

    toggleHabitableZone(visible: boolean) {
        this.showHabitableZone = visible;
        PreferencesManager.set('showHabitableZone', visible);
        if (this.habitableZoneMesh) {
            this.habitableZoneMesh.visible = visible;
        }
    }

    toggleEclipticGrid(visible: boolean) {
        this.showEclipticGrid = visible;
        PreferencesManager.set('showEclipticGrid', visible);
        if (this.eclipticGridMesh) {
            this.eclipticGridMesh.visible = visible;
        }
    }

    toggleRealisticLighting(visible: boolean) {
        this.realisticLighting = visible;
        PreferencesManager.set('realisticLighting', visible);
        if (this.ambientLight) {
            this.ambientLight.intensity = visible ? 0.05 : 0.36;
        }
        if (this.pointLight) {
            this.pointLight.intensity = visible ? 2.8 : 2.1;
        }
    }

    toggleAxes(visible: boolean) {
        this.showAxes = visible;
        PreferencesManager.set('showAxes', visible);
        this.planets.forEach(planet => planet.toggleAxes?.(visible));
    }

    toggleRealisticDistances(visible: boolean) {
        this.realisticDistances = visible;
        PreferencesManager.set('realisticDistances', visible);
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
            planet.rebuildOrbit?.(this.realisticDistances, this.realSizeRatio);
            if (planet.labelSprite) {
                planet.showLabel = this.realisticDistances;
                planet.labelSprite.visible = this.realisticDistances;
            }
        });

        this.comets.forEach(comet => {
            comet.rebuildOrbit?.(this.realisticDistances, this.realSizeRatio);
        });

        this.spacecrafts.forEach(sc => {
            sc.rebuildOrbit?.(this.realisticDistances, this.realSizeRatio);
        });

        if (this.pointLight) {
            this.pointLight.shadow.camera.far = this.realisticDistances ? 10000 : 2000;
            this.pointLight.shadow.camera.updateProjectionMatrix();
        }

        // Re-frame currently focused body smoothly if scale changed drastically
        if (this.focusedBody && 'data' in this.focusedBody && this.focusedBody.data?.name) {
            this.focusOnBody(this.focusedBody.data.name, false);
        } else {
            this.updateZoomLimits();
        }
    }

    focusOnBody(name: string, smooth: boolean = true) {
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
            target.mesh.updateWorldMatrix?.(true, false);
            target.mesh.getWorldPosition(SceneManager._vPos);

            const hasRadius = 'radius' in target.data && typeof target.data.radius === 'number';
            const scale = ('tiltGroup' in target && target.tiltGroup)
                ? (target.tiltGroup.scale?.x || 1.0)
                : (target.mesh.scale?.x || 1.0);
            const rawRadius = hasRadius ? (target.data as any).radius : 0.5;
            const visualRadius = hasRadius ? rawRadius * scale : 0.5 * (this.realisticDistances ? 0.005 : 1.0);

            let distance = hasRadius ? visualRadius * 4.5 : (this.realisticDistances ? Math.max(0.012, scale * 2.5) : 2.5);

            // Ringed worlds get slightly wider framing so entire ring plane fits inside viewport
            if ('rings' in target.data && (target.data as any).rings) {
                distance = visualRadius * 5.6;
            }

            // Comets need wider framing to showcase ion & dust tails
            if ('tailParticles' in target) {
                distance = Math.max(distance, this.realisticDistances ? 16 : 40);
            }

            // Frame the sunlit 3/4 hemisphere rather than landing on the pitch-black night side!
            const endOffset = new THREE.Vector3();
            const isSun = target.data.name === 'Sun';
            const planarDistSq = SceneManager._vPos.x * SceneManager._vPos.x + SceneManager._vPos.z * SceneManager._vPos.z;

            if (!isSun && planarDistSq > 1e-4) {
                const invLen = 1 / Math.sqrt(planarDistSq);
                const toSunX = -SceneManager._vPos.x * invLen;
                const toSunZ = -SceneManager._vPos.z * invLen;
                // Rotate 34 deg in azimuth from sub-solar line for dramatic 3/4 terminator relief
                const angle = 0.59;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                const dirX = toSunX * cosA - toSunZ * sinA;
                const dirZ = toSunX * sinA + toSunZ * cosA;
                endOffset.set(dirX * distance, distance * 0.38, dirZ * distance);
            } else {
                endOffset.set(distance * 0.85, distance * 0.42, distance * 0.85);
            }

            const targetCamPos = SceneManager._vPos.clone().add(endOffset);

            if (smooth && this.focusedBody !== target) {
                this.cameraTransition = {
                    startPos: this.camera.position.clone(),
                    endPos: targetCamPos,
                    startTarget: this.controls.target.clone(),
                    endTarget: SceneManager._vPos.clone(),
                    targetBody: target,
                    endOffset,
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
            this.focusedStar = null;
            this.focusedConstellation = null;
            this.camera.up.set(0, 1, 0);

            this.previousBodyPosition = SceneManager._vPos.clone();

            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 0.5;

            this.updateZoomLimits();
        }
    }

    focusOnStar(starMesh: THREE.Object3D, smooth: boolean = true) {
        this.focusedBody = null;
        this.surfaceViewBody = null;
        this.previousBodyPosition = null;
        this.controls.autoRotate = false;
        this.focusedConstellation = null;
        this.focusedStar = starMesh;
        this.camera.up.set(0, 1, 0);

        const starPos = starMesh.position.clone();
        const cameraPos = starPos.clone().normalize().multiplyScalar(40000);

        if (smooth) {
            this.cameraTransition = {
                startPos: this.camera.position.clone(),
                endPos: cameraPos,
                startTarget: this.controls.target.clone(),
                endTarget: starPos.clone(),
                progress: 0,
                duration: 1.2
            };
        } else {
            this.camera.position.copy(cameraPos);
            this.controls.target.copy(starPos);
            this.cameraTransition = null;
        }

        this.controls.enabled = true;
        this.controls.minDistance = 200;
        this.controls.maxDistance = 20000;
    }

    focusOnConstellation(name: string, smooth: boolean = true) {
        const group = this.constellationManager.constellationMeshes.find(g => g.userData.name === name);
        if (!group) return;

        if (!this.constellationManager.isVisible) {
            this.toggleConstellations(true);
        }

        const box = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);

        this.focusedBody = null;
        this.surfaceViewBody = null;
        this.previousBodyPosition = null;
        this.controls.autoRotate = false;
        this.focusedStar = null;
        this.focusedConstellation = name;
        this.camera.up.set(0, 1, 0);

        const vFov = this.camera.fov * (Math.PI / 180);
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
        const minFov = Math.min(vFov, hFov);

        const padding = 1.7;
        const distance = (sphere.radius * padding) / Math.sin(minFov / 2);
        this.constellationDistance = distance;

        const dir = center.clone().normalize();
        const targetCamPos = center.clone().sub(dir.clone().multiplyScalar(distance));

        if (targetCamPos.length() < 50) {
            targetCamPos.add(new THREE.Vector3(60, 60, 0));
        }

        if (smooth) {
            this.cameraTransition = {
                startPos: this.camera.position.clone(),
                endPos: targetCamPos,
                startTarget: this.controls.target.clone(),
                endTarget: center.clone(),
                progress: 0,
                duration: 1.2
            };
        } else {
            this.camera.position.copy(targetCamPos);
            this.controls.target.copy(center);
            this.cameraTransition = null;
        }

        this.controls.enabled = true;
        this.controls.minDistance = Math.max(distance * 0.1, 100);
        this.controls.maxDistance = Math.max(distance * 3, 100000);
    }

    updateZoomLimits(): void {
        if (!this.controls) return;

        if (this.cameraTransition) {
            this.controls.minDistance = 0.0005;
            this.controls.maxDistance = 100000;
            return;
        }

        if (this.focusedConstellation) {
            this.controls.minDistance = Math.max(this.constellationDistance * 0.1, 100);
            this.controls.maxDistance = Math.max(this.constellationDistance * 3, 100000);
            return;
        }

        if (this.focusedStar) {
            this.controls.minDistance = 200;
            this.controls.maxDistance = 20000;
            return;
        }

        if (this.focusedBody && this.focusedBody.mesh) {
            const target = this.focusedBody;
            const isSun = target.data?.name === 'Sun';
            const scale = ('tiltGroup' in target && target.tiltGroup) ? target.tiltGroup.scale.x : 1.0;
            const rawRadius = ('data' in target && target.data && 'radius' in target.data) ? target.data.radius : 0.5;
            const visualRadius = rawRadius * scale;

            const nearPlane = this.camera?.near ?? 0.0001;
            const minFloor = this.realisticDistances ? nearPlane * 2.5 : 0.4;
            const surfaceMargin = Math.max(visualRadius * 0.25, nearPlane * 2, minFloor);
            const minDistance = visualRadius + surfaceMargin;

            let maxDistance: number;
            if (isSun) {
                maxDistance = this.realisticDistances ? 25000 : 5000;
            } else if ('tailParticles' in target) {
                maxDistance = this.realisticDistances ? 4000 : 1000;
            } else if ('targetBody' in target.data && target.data.targetBody) {
                maxDistance = this.realisticDistances ? 2500 : 600;
            } else if ('isMoon' in target && target.isMoon) {
                maxDistance = this.realisticDistances ? 3000 : 800;
            } else {
                maxDistance = this.realisticDistances ? 8000 : 1800;
            }

            this.controls.minDistance = Math.max(minDistance, nearPlane * 2);
            this.controls.maxDistance = Math.max(maxDistance, this.controls.minDistance * 1.5);
        } else {
            const sun = this.planets.find(p => p.data.name === 'Sun');
            const sunScale = (sun && sun.tiltGroup) ? sun.tiltGroup.scale.x : 1.0;
            const sunRadius = (sun ? sun.data.radius : 25) * sunScale;

            const targetPos = this.controls.target;
            const distFromSun = targetPos.length();

            if (distFromSun < sunRadius * 2) {
                const sunMinFloor = this.realisticDistances ? sunRadius * 1.25 : 30;
                this.controls.minDistance = Math.max(sunRadius * 1.25, sunMinFloor);
            } else {
                const closestRadius = this.getClosestBodyRadiusAt(targetPos);
                const freeFloor = this.realisticDistances ? 0.005 : 1.0;
                this.controls.minDistance = Math.max(closestRadius * 1.25, freeFloor);
            }

            this.controls.maxDistance = this.realisticDistances ? 25000 : 5000;
        }
    }

    private getClosestBodyRadiusAt(pos: THREE.Vector3): number {
        let closestRadius = 0;
        let minDistanceSq = 10000;

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

    public getAstronomicalPositionAU(target: any, outVec: THREE.Vector3): THREE.Vector3 {
        if (!target) return outVec.set(0, 0, 0);

        if (this.realisticDistances) {
            if (target.mesh) {
                target.mesh.getWorldPosition(outVec);
            } else if (target.orbitGroup) {
                target.orbitGroup.getWorldPosition(outVec);
            } else {
                outVec.set(0, 0, 0);
            }
            return outVec.divideScalar(130);
        }

        const rawName = target.data?.name || target.name || '';
        if (rawName === 'Sun') {
            return outVec.set(0, 0, 0);
        }

        const planet = this.planets.find(p => p.data.name === rawName);
        if (planet) {
            const a = planet.data.distanceAU ?? (planet.data.distance / 130);
            const e = planet.data.eccentricity ?? 0;
            const b = a * Math.sqrt(Math.max(0, 1 - e * e));
            if (e > 0) {
                const E = solveKepler(planet.angle, e);
                return outVec.set(a * (Math.cos(E) - e), 0, b * Math.sin(E));
            } else {
                return outVec.set(Math.cos(planet.angle) * a, 0, Math.sin(planet.angle) * a);
            }
        }

        for (const p of this.planets) {
            const moon = p.moons.find(m => m.data.name === rawName);
            if (moon) {
                this.getAstronomicalPositionAU(p, outVec);
                const parentX = outVec.x;
                const parentZ = outVec.z;
                const a = moon.data.distanceAU ?? 0.00257;
                const e = moon.data.eccentricity ?? 0;
                const b = a * Math.sqrt(Math.max(0, 1 - e * e));
                let moonRelX = 0;
                let moonRelZ = 0;
                if (e > 0) {
                    const E = solveKepler(moon.angle, e);
                    moonRelX = a * (Math.cos(E) - e);
                    moonRelZ = b * Math.sin(E);
                } else {
                    moonRelX = Math.cos(moon.angle) * a;
                    moonRelZ = Math.sin(moon.angle) * a;
                }
                return outVec.set(parentX + moonRelX, 0, parentZ + moonRelZ);
            }
        }

        const comet = this.comets.find(c => c.data.name === rawName);
        if (comet) {
            const a = comet.data.distanceAU ?? (comet.data.semiMajorAxis / 130);
            const e = comet.e ?? comet.data.eccentricity ?? 0;
            const b = a * Math.sqrt(Math.max(0, 1 - e * e));
            const E = solveKepler(comet.angle, e);
            const x = a * (Math.cos(E) - e);
            const z = b * Math.sin(E);
            const incRad = comet.data.inclination !== undefined ? THREE.MathUtils.degToRad(comet.data.inclination) : 0;
            if (incRad) {
                const y = -z * Math.sin(incRad);
                const zPrime = z * Math.cos(incRad);
                return outVec.set(x, y, zPrime);
            }
            return outVec.set(x, 0, z);
        }

        const sc = this.spacecrafts.find(s => s.data.name === rawName);
        if (sc) {
            if (sc.data.escaping) {
                if (sc.mesh) {
                    sc.mesh.getWorldPosition(outVec);
                    return outVec.divideScalar(130);
                }
            } else {
                const targetBodyName = sc.data.targetBody || 'Earth';
                const parentBody = this.planets.find(p => p.data.name === targetBodyName);
                if (parentBody) {
                    this.getAstronomicalPositionAU(parentBody, outVec);
                    const parentX = outVec.x;
                    const parentZ = outVec.z;
                    const scAU = sc.data.distanceAU ?? 0.000045;
                    const scX = Math.cos(sc.angle) * scAU;
                    const scZ = Math.sin(sc.angle) * scAU;
                    return outVec.set(parentX + scX, 0, parentZ + scZ);
                }
            }
        }

        if (target.mesh) {
            target.mesh.getWorldPosition(outVec);
        } else if (target.orbitGroup) {
            target.orbitGroup.getWorldPosition(outVec);
        } else {
            outVec.set(0, 0, 0);
        }
        return outVec.divideScalar(130);
    }

    updateMeasurement() {
        if (!this.measureMode || !this.measureLine || !this.measureLabel) {
            if (this.measureLine) this.measureLine.visible = false;
            if (this.measureLabel) this.measureLabel.visible = false;
            return;
        }

        if (this.measureTargetA && this.measureTargetB) {
            const resolvePos = (target: any, out: THREE.Vector3) => {
                if (target?.mesh) {
                    target.mesh.updateWorldMatrix?.(true, false);
                    target.mesh.getWorldPosition(out);
                } else if (target?.orbitGroup) {
                    target.orbitGroup.updateWorldMatrix?.(true, false);
                    target.orbitGroup.getWorldPosition(out);
                } else {
                    out.set(0, 0, 0);
                }
            };

            resolvePos(this.measureTargetA, SceneManager._vPosA);
            resolvePos(this.measureTargetB, SceneManager._vPosB);

            // Update 6-float BufferAttribute in-place (zero per-frame typed-array allocation)
            const posAttr = this.measureLine.geometry.attributes.position as THREE.BufferAttribute;
            const arr = posAttr.array as Float32Array;
            arr[0] = SceneManager._vPosA.x;
            arr[1] = SceneManager._vPosA.y;
            arr[2] = SceneManager._vPosA.z;
            arr[3] = SceneManager._vPosB.x;
            arr[4] = SceneManager._vPosB.y;
            arr[5] = SceneManager._vPosB.z;
            posAttr.needsUpdate = true;

            const distanceScale = SceneManager._vPosA.distanceTo(SceneManager._vPosB);
            const dashMat = this.measureLine.material as THREE.LineDashedMaterial;
            if (dashMat) {
                dashMat.dashSize = Math.max(0.4, distanceScale * 0.025);
                dashMat.gapSize = dashMat.dashSize * 0.5;
            }
            this.measureLine.computeLineDistances();
            this.measureLine.visible = true;

            SceneManager._vMid.copy(SceneManager._vPosA).add(SceneManager._vPosB).multiplyScalar(0.5);

            // Clamp camera offset to 25% of midpoint distance so label never pops behind the camera lens
            SceneManager._vOffset.subVectors(this.camera.position, SceneManager._vMid);
            const distToCam = SceneManager._vOffset.length();
            if (distToCam > 1e-4) {
                SceneManager._vOffset.divideScalar(distToCam).multiplyScalar(Math.min(10, distToCam * 0.25));
            }
            this.measureLabel.position.copy(SceneManager._vMid).add(SceneManager._vOffset);

            this.getAstronomicalPositionAU(this.measureTargetA, SceneManager._vAuA);
            this.getAstronomicalPositionAU(this.measureTargetB, SceneManager._vAuB);
            const distanceAUVal = SceneManager._vAuA.distanceTo(SceneManager._vAuB);
            const auPrecision = distanceAUVal < 0.1 ? 4 : 3;
            const mkmPrecision = 2;
            const roundedAU = Number(distanceAUVal.toFixed(auPrecision));
            const distanceMkmVal = roundedAU * 149.6;
            const distanceAU = i18n.formatNumber(distanceAUVal, { minimumFractionDigits: auPrecision, maximumFractionDigits: auPrecision });
            const distanceMkm = i18n.formatNumber(distanceMkmVal, { minimumFractionDigits: mkmPrecision, maximumFractionDigits: mkmPrecision });
            const unitAU = i18n.t('measurement.unitAU') || 'AU';
            const unitMkm = i18n.t('measurement.unitMkm') || 'Mkm';
            const labelText = i18n.t('measurement.distLabel', {
                au: distanceAU,
                mkm: distanceMkm,
                unitAU,
                unitMkm
            }) || `Dist: ${distanceAU} ${unitAU} / ${distanceMkm} ${unitMkm}`;
            this.updateMeasureLabel(labelText);

            this.currentMeasureDistance = {
                distanceScale,
                distanceAUVal,
                distanceMkmVal,
                distanceAU,
                distanceMkm,
                unitAU,
                unitMkm
            };

            const camDist = this.camera.position.distanceTo(this.measureLabel.position);
            const minLabelScale = this.realisticDistances ? 0.04 : 10;
            const scaleY = Math.max(camDist * 0.05, minLabelScale);

            const canvas = this.measureLabel.material.map?.image as HTMLCanvasElement;
            if (canvas) {
                const ratio = canvas.width / canvas.height;
                this.measureLabel.scale.set(scaleY * ratio, scaleY, 1);
            } else {
                this.measureLabel.scale.set(scaleY * 4, scaleY, 1);
            }

            this.measureLabel.visible = true;
        } else {
            this.currentMeasureDistance = null;
            this.measureLine.visible = false;
            this.measureLabel.visible = false;
        }
    }

    toggleMeasureMode(visible: boolean) {
        this.measureMode = visible;
        if (!visible) {
            this.measureTargetA = null;
            this.measureTargetB = null;
            this.currentMeasureDistance = null;
            if (this.measureLine) this.measureLine.visible = false;
            if (this.measureLabel) {
                this.measureLabel.visible = false;
                (this.measureLabel as any).userData.lastText = null;
            }
        }
        EventBus.emit('measure-mode-changed', {
            active: visible,
            targetA: this.measureTargetA,
            targetB: this.measureTargetB
        });
    }

    clearMeasureTargets() {
        this.measureTargetA = null;
        this.measureTargetB = null;
        this.currentMeasureDistance = null;
        if (this.measureLine) this.measureLine.visible = false;
        if (this.measureLabel) {
            this.measureLabel.visible = false;
            (this.measureLabel as any).userData.lastText = null;
        }
        EventBus.emit('measure-targets-changed', {
            targetA: null,
            targetB: null
        });
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
                this.currentMeasureDistance = null;
                if (this.measureLine) this.measureLine.visible = false;
                if (this.measureLabel) {
                    this.measureLabel.visible = false;
                    (this.measureLabel as any).userData.lastText = null;
                }
            } else if (!this.measureTargetB && target !== this.measureTargetA) {
                this.measureTargetB = target;
                if (this.measureLabel) {
                    (this.measureLabel as any).userData.lastText = null;
                }
                this.updateMeasurement();
                if (this.onMeasureTargetsSet) {
                    this.onMeasureTargetsSet();
                }
            } else {
                this.measureTargetA = target;
                this.measureTargetB = null;
                this.currentMeasureDistance = null;
                if (this.measureLine) this.measureLine.visible = false;
                if (this.measureLabel) {
                    this.measureLabel.visible = false;
                    (this.measureLabel as any).userData.lastText = null;
                }
            }
            EventBus.emit('measure-targets-changed', {
                targetA: this.measureTargetA,
                targetB: this.measureTargetB
            });
        }
    }

    detachCamera() {
        this.focusedBody = null;
        this.surfaceViewBody = null;
        this.isSurfaceDragging = false;
        this.previousBodyPosition = null;
        this.focusedStar = null;
        this.focusedConstellation = null;
        this.camera.up.set(0, 1, 0);
        this.controls.enabled = true;
        this.controls.autoRotate = false;
        this.cameraTransition = null;
        this.updateZoomLimits();
    }

    setSurfaceView(name: string): boolean {
        // Disallow surface landing on the Sun's gaseous photosphere
        if (!name || name === 'Sun') {
            this.surfaceViewBody = null;
            this.camera.up.set(0, 1, 0);
            return false;
        }

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
            this.surfaceYaw = 0;
            this.surfacePitch = 0.22;
            this.focusedBody = null;
            this.previousBodyPosition = null;
            this.focusedStar = null;
            this.focusedConstellation = null;
            this.cameraTransition = null;
            this.controls.enabled = false;
            this.controls.autoRotate = false;

            this.updateSurfaceCamera(target);
            return true;
        } else {
            this.surfaceViewBody = null;
            this.camera.up.set(0, 1, 0);
            return false;
        }
    }

    captureScreenshot(targetName?: string): void {
        const rawTarget = targetName || (this.focusedBody as any)?.data?.name || 'Solar System';
        exportObservatoryScreenshot(this.renderer, this.composer, rawTarget, this.simDate);
    }

    dispose() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', this.onResizeBound);
            window.removeEventListener('orientationchange', this.onOrientationChangeBound);
            window.removeEventListener('pointermove', this.onSurfacePointerMoveBound);
            window.removeEventListener('pointerup', this.onSurfacePointerUpBound);
        }
        this.renderer?.domElement?.removeEventListener?.('pointerdown', this.onSurfacePointerDownBound);

        this.comets.forEach(comet => (comet as any).dispose?.());
        this.comets = [];

        this.spacecrafts.forEach(sc => (sc as any).dispose?.());
        this.spacecrafts = [];

        this.planets.forEach(planet => (planet as any).dispose?.());
        this.planets = [];

        this.constellationManager.dispose();

        if (this.starfieldHandle) {
            this.starfieldHandle.dispose();
            this.starfieldHandle = null;
        }
        this.starMeshes = [];

        if (this.envMapHandle) {
            this.envMapHandle.dispose();
            this.envMapHandle = null;
        }

        const disposeMesh = (obj: THREE.Object3D | null) => {
            if (!obj) return;
            const anyObj = obj as any;
            anyObj.geometry?.dispose?.();
            if (Array.isArray(anyObj.material)) {
                anyObj.material.forEach((m: any) => m?.dispose?.());
            } else {
                anyObj.material?.map?.dispose?.();
                anyObj.material?.dispose?.();
            }
            this.scene.remove(obj);
        };

        disposeMesh(this.asteroidBelt);
        this.asteroidBelt = null;

        disposeMesh(this.kuiperBelt);
        this.kuiperBelt = null;

        disposeMesh(this.habitableZoneMesh);
        this.habitableZoneMesh = null;

        disposeMesh(this.eclipticGridMesh);
        this.eclipticGridMesh = null;

        disposeMesh(this.measureLine);
        this.measureLine = null;

        disposeMesh(this.measureLabel);
        this.measureLabel = null;

        this.controls?.dispose?.();
        this.composer?.dispose?.();

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentElement) {
                this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
            }
        }

        if (this.unregisterI18n) {
            this.unregisterI18n();
            this.unregisterI18n = undefined;
        }

        TextureGenerator.dispose();
    }
}
