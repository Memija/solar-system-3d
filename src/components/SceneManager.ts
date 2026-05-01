import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CelestialBody } from './CelestialBody.js';
import { SolarSystemData, StarData, CometDataList, SpacecraftDataList } from './SolarSystemData.js';
import { ConstellationManager } from './ConstellationManager.js';
import { Comet } from './Comet.js';
import { Spacecraft } from './Spacecraft.js';

export class SceneManager {
    container: HTMLElement;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
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

    ambientLight: THREE.AmbientLight;
    pointLight: THREE.PointLight;

    habitableZoneMesh: THREE.Mesh | null;
    eclipticGridMesh: THREE.PolarGridHelper | null;

    simDate: Date;
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

    constructor(container: HTMLElement) {
        this.container = container;
        // Initialize properties to satisfy TS strict initialization
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera();
        this.renderer = new THREE.WebGLRenderer();
        // Controls initialized in init()
        this.clock = new THREE.Clock();
        this.planets = [];
        this.comets = [];
        this.spacecrafts = [];
        this.timeScale = 1;
        this.showOrbits = true;
        this.showMoons = true;
        this.showComets = true;
        this.showSpacecrafts = true;
        this.showMeteors = false;
        this.showTrails = false;
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
        this.tourMode = false;
        this.tourTargets = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
        this.tourIndex = 0;
        this.tourTimer = 0;
        this.tourInterval = 5;

        this.measureMode = false;
        this.measureTargetA = null;
        this.measureTargetB = null;
        this.measureLine = null;
        this.measureLabel = null;

        this.constellationManager = new ConstellationManager(this.scene);

        this.init();
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
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Post-processing
        const renderScene = new RenderPass(this.scene, this.camera);

        // Resolution, strength, radius, threshold
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // strength
            0.4, // radius
            0.85 // threshold
        );

        this.composer = new EffectComposer(this.renderer);
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

        // Lighting (Sun)
        // Store ambient light to toggle realistic lighting later
        this.ambientLight = new THREE.AmbientLight(0xffffff, 2.5); // Default to bright ambient
        this.scene.add(this.ambientLight);

        this.pointLight = new THREE.PointLight(0xffffff, 3.0, 0, 0); // Stronger Sun light
        this.pointLight.castShadow = true;

        // Shadow map settings
        this.pointLight.shadow.mapSize.width = 4096;
        this.pointLight.shadow.mapSize.height = 4096;
        this.pointLight.shadow.camera.near = 10;
        this.pointLight.shadow.camera.far = 2000;
        this.pointLight.shadow.bias = -0.0005;

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

        // Resize handling
        window.addEventListener('resize', () => this.onWindowResize());

        this.createMeasureTools();
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
        const canvas = this.measureLabel.material.map.image;
        const context = canvas.getContext('2d');
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.beginPath();
        context.roundRect(0, 0, canvas.width, canvas.height, 20);
        context.fill();
        context.strokeStyle = '#00ff00';
        context.lineWidth = 4;
        context.stroke();

        context.font = 'Bold 48px Arial';
        context.fillStyle = '#00ff00';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        this.measureLabel.material.map.needsUpdate = true;
    }

    createAsteroidBelt() {
        const numAsteroids = 2000;
        // Mars is at distance 170, Jupiter is at 280
        const minDistance = 200;
        const maxDistance = 250;

        const geometry = new THREE.DodecahedronGeometry(0.5, 0); // Low poly asteroid
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9,
            metalness: 0.1
        });

        this.asteroidBelt = new THREE.InstancedMesh(geometry, material, numAsteroids);

        const dummy = new THREE.Object3D();

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
            color: 0xaaaaaa, // Icy color
            roughness: 0.6,
            metalness: 0.2
        });

        this.kuiperBelt = new THREE.InstancedMesh(geometry, material, numObjects);

        const dummy = new THREE.Object3D();

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
        }

        this.scene.add(this.kuiperBelt);
    }

    createStarfield() {
        // Milky Way texture
        const geometry = new THREE.SphereGeometry(50000, 64, 64);
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('textures/milky_way.jpg');
        texture.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            transparent: true,
            opacity: 1
        });

        const skybox = new THREE.Mesh(geometry, material);
        skybox.rotation.x = Math.PI / 3;
        this.scene.add(skybox);

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
                    { title: "NASA: Sirius", url: "https://hubblesite.org/contents/media/images/2005/36/1826-Image.html" }
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
                links: [{ title: "Wikipedia: Pollux", url: "https://en.wikipedia.org/wiki/Pollux" }]
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
                const targetPlanet = this.planets.find(p => p.data.name === data.targetBody);
                if (targetPlanet) {
                    parentObject = targetPlanet.orbitGroup;
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

    update() {
        const rawDelta = this.clock.getDelta();
        const deltaTime = rawDelta * this.timeScale;

        // Earth period is 1. speedMultiplier is 0.5.
        // 1 orbit = 2*PI radians. Speed = 0.5 rad/sec (sim time).
        // 1 Earth Year = (2*PI)/0.5 = 12.566 seconds of sim time.
        const earthYearInSimSeconds = (2 * Math.PI) / 0.5;
        const yearsPassed = deltaTime / earthYearInSimSeconds;
        const msPassed = yearsPassed * 365.25 * 24 * 60 * 60 * 1000;
        this.simDate = new Date(this.simDate.getTime() + msPassed);

        if (this.tourMode) {
            this.tourTimer += rawDelta;
            if (this.tourTimer >= this.tourInterval) {
                this.tourTimer = 0;
                this.tourIndex = (this.tourIndex + 1) % this.tourTargets.length;
                this.focusOnBody(this.tourTargets[this.tourIndex]);
            }
        }

        this.planets.forEach(planet => {
            planet.update(deltaTime);
            // Update atmosphere view vector if it exists
            if (planet.atmosphereMesh && planet.orbitGroup) {
                (planet.atmosphereMesh.material as THREE.ShaderMaterial).uniforms.viewVector.value.subVectors(this.camera.position, planet.orbitGroup.position);
            }
        });

        if (this.habitableZoneMesh && this.showHabitableZone) {
            if (this.habitableZoneMesh.material instanceof THREE.ShaderMaterial) {
                this.habitableZoneMesh.material.uniforms.time.value += deltaTime;
            }
        }

        if (this.showComets) {
            this.comets.forEach(comet => {
                comet.update(deltaTime);
            });
        }

        if (this.showSpacecrafts) {
            this.spacecrafts.forEach(spacecraft => {
                spacecraft.update(deltaTime);
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

        // Update Measurement Tool
        this.updateMeasurement();

        if (this.surfaceViewBody?.mesh) {
            const planetPos = new THREE.Vector3();
            this.surfaceViewBody.mesh.getWorldPosition(planetPos);

            const sunToPlanet = planetPos.clone().normalize();
            const offset = sunToPlanet.multiplyScalar(this.surfaceViewBody.data.radius + 2);
            const camPos = planetPos.clone().sub(offset);

            this.camera.position.copy(camPos);
            this.camera.lookAt(0, 0, 0);
            this.controls.enabled = false;
        } else if (this.focusedBody?.mesh) {
            const pos = new THREE.Vector3();
            this.focusedBody.mesh.getWorldPosition(pos);

            // Calculate delta movement of the body
            if (this.previousBodyPosition) {
                const delta = pos.clone().sub(this.previousBodyPosition);
                this.camera.position.add(delta);
            }

            this.controls.target.copy(pos);
            this.previousBodyPosition = pos.clone();

            this.controls.enabled = true;
        } else {
            this.controls.enabled = true;
            this.previousBodyPosition = null;
        }

        this.controls.update(); // Required for OrbitControls to work
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
            this.ambientLight.intensity = visible ? 0.05 : 2.5;
        }
        if (this.pointLight) {
            // Maybe tweak sun brightness slightly
            this.pointLight.intensity = visible ? 4.0 : 3.0;
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

    focusOnBody(name: string) {
        // Find planet or moon or comet or spacecraft
        let target: CelestialBody | Comet | Spacecraft | undefined;

        const findTarget = (body: CelestialBody) => {
            if (body.data.name === name) {
                target = body;
            }
            body.moons.forEach(findTarget);
        };

        this.planets.forEach(findTarget);

        target = target || this.comets.find(c => c.data.name === name);
        target = target || this.spacecrafts.find(s => s.data.name === name);

        if (target?.mesh) {
            this.focusedBody = target;
            this.surfaceViewBody = null;

            const pos = new THREE.Vector3();
            target.mesh.getWorldPosition(pos);
            this.controls.target.copy(pos);

            // Adjust camera distance based on radius (Spacecraft have smaller 'models')
            const radius = 'radius' in target.data ? target.data.radius : 0.5;
            const distance = radius * 5;
            this.camera.position.set(pos.x + distance, pos.y + distance * 0.5, pos.z + distance);

            // Initialize previous position for tracking
            this.previousBodyPosition = pos.clone();

            // Enable auto-rotation for dynamic background
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 0.5;
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
    }

    focusOnConstellation(name: string) {
        const center = this.constellationManager.getConstellationCenter(name);
        if (center) {
            this.focusedBody = null;
            this.surfaceViewBody = null;
            this.previousBodyPosition = null;
            this.controls.autoRotate = false;

            this.controls.target.copy(center);

            // Move camera to view the constellation
            // Radius is 49000, so move to ~40000
            const cameraPos = center.clone().normalize().multiplyScalar(40000);
            this.camera.position.copy(cameraPos);
            this.controls.enabled = true;
        }
    }

    updateMeasurement() {
        if (!this.measureMode || !this.measureLine || !this.measureLabel) {
            if (this.measureLine) this.measureLine.visible = false;
            if (this.measureLabel) this.measureLabel.visible = false;
            return;
        }

        if (this.measureTargetA && this.measureTargetA.mesh && this.measureTargetB && this.measureTargetB.mesh) {
            const posA = new THREE.Vector3();
            const posB = new THREE.Vector3();
            this.measureTargetA.mesh.getWorldPosition(posA);
            this.measureTargetB.mesh.getWorldPosition(posB);

            // Update line
            this.measureLine.geometry.setFromPoints([posA, posB]);
            this.measureLine.computeLineDistances();
            this.measureLine.visible = true;

            // Update label position (midpoint)
            const midPoint = posA.clone().add(posB).multiplyScalar(0.5);

            // Offset label slightly towards camera so it's readable
            const offset = new THREE.Vector3().subVectors(this.camera.position, midPoint).normalize().multiplyScalar(10);
            this.measureLabel.position.copy(midPoint).add(offset);

            // Calculate distance
            const distanceScale = posA.distanceTo(posB);

            // Scale label size based on camera distance so it's readable
            const camDist = this.camera.position.distanceTo(this.measureLabel.position);
            const scale = Math.max(camDist * 0.05, 10);
            this.measureLabel.scale.set(scale * 4, scale, 1);

            // Update text (distance)
            // Note: Earth is at 130 in simulation. 1 AU = 130 units roughly.
            const distanceAU = (distanceScale / 130).toFixed(2);
            const distanceMkm = (parseFloat(distanceAU) * 149.6).toFixed(1);
            this.updateMeasureLabel(`Dist: ${distanceAU} AU / ${distanceMkm} Mkm`);
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
        target = target || this.comets.find(c => c.data.name === name);
        target = target || this.spacecrafts.find(s => s.data.name === name);

        if (target) {
            if (!this.measureTargetA) {
                this.measureTargetA = target;
            } else if (!this.measureTargetB && target !== this.measureTargetA) {
                this.measureTargetB = target;
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

        if (target?.mesh) {
            this.surfaceViewBody = target;
            this.focusedBody = null;
            this.previousBodyPosition = null;
        }
    }
}
