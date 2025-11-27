import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CelestialBody } from './CelestialBody.js';
import { SolarSystemData, StarData } from './SolarSystemData.js';
import { vertexShader, fragmentShader } from './SunShader.js';
import { ConstellationManager } from './ConstellationManager.js';

export class SceneManager {
    container: HTMLElement;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls!: OrbitControls;
    clock: THREE.Clock;
    planets: CelestialBody[];
    timeScale: number;
    showOrbits: boolean;
    showMoons: boolean;
    focusedBody: CelestialBody | null;
    surfaceViewBody: CelestialBody | null;
    sunMaterial: THREE.ShaderMaterial | null;
    starMeshes: THREE.Object3D[];
    constellationManager: ConstellationManager;
    previousBodyPosition: THREE.Vector3 | null;

    constructor(container: HTMLElement) {
        this.container = container;
        // Initialize properties to satisfy TS strict initialization
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera();
        this.renderer = new THREE.WebGLRenderer();
        // Controls initialized in init()
        this.clock = new THREE.Clock();
        this.planets = [];
        this.timeScale = 1.0;
        this.showOrbits = true;
        this.showMoons = true;
        this.focusedBody = null;
        this.surfaceViewBody = null;
        this.sunMaterial = null;
        this.starMeshes = [];
        this.previousBodyPosition = null;

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
        const ambientLight = new THREE.AmbientLight(0xffffff, 2.5); // Very bright ambient light to ensure visibility
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 2.5, 0, 0); // Stronger Sun light
        this.scene.add(pointLight);

        // Sun Mesh
        const sunGeometry = new THREE.SphereGeometry(25, 64, 64); // Reduced from 109 to 25 to match data
        const sunMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
        this.sunMaterial = sunMaterial;
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(sun);

        // Starfield
        this.createStarfield();

        // Constellations
        this.constellationManager.createConstellations();

        // Planets
        this.createPlanets();

        // Resize handling
        window.addEventListener('resize', () => this.onWindowResize());
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
            opacity: 1.0
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
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0516a.jpg",
                images: [
                    "https://cdn.esahubble.org/archives/images/screen/heic0516a.jpg"
                ],
                links: [
                    { title: "Wikipedia: Sirius", url: "https://en.wikipedia.org/wiki/Sirius" },
                    { title: "NASA: Sirius", url: "https://www.nasa.gov/image-feature/goddard/2017/hubble-views-sirius-b" }
                ]
            },
            {
                name: "Canopus", ra: 6.40, dec: -52.70, color: 0xffffff,
                description: "The brightest star in the southern constellation of Carina and the second-brightest star in the night sky. It is essentially white when seen with the naked eye.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0702a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic0702a.jpg"],
                links: [{ title: "Wikipedia: Canopus", url: "https://en.wikipedia.org/wiki/Canopus" }]
            },
            {
                name: "Arcturus", ra: 14.26, dec: 19.18, color: 0xffd27d,
                description: "The brightest star in the northern constellation of Boötes. With an apparent visual magnitude of −0.05, it is the fourth-brightest star in the night sky and the brightest in the northern celestial hemisphere.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1007a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic1007a.jpg"],
                links: [{ title: "Wikipedia: Arcturus", url: "https://en.wikipedia.org/wiki/Arcturus" }]
            },
            {
                name: "Vega", ra: 18.62, dec: 38.78, color: 0xa3c2ff,
                description: "The brightest star in the northern constellation of Lyra. It is relatively close at only 25 light-years from the Sun, and one of the most luminous stars in the Sun's neighborhood.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0516b.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic0516b.jpg"],
                links: [{ title: "Wikipedia: Vega", url: "https://en.wikipedia.org/wiki/Vega" }]
            },
            {
                name: "Capella", ra: 5.27, dec: 46.00, color: 0xfff5f5,
                description: "The brightest star in the constellation of Auriga, the sixth-brightest in the night sky, and the third-brightest in the Northern Celestial Hemisphere after Arcturus and Vega.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0711a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic0711a.jpg"],
                links: [{ title: "Wikipedia: Capella", url: "https://en.wikipedia.org/wiki/Capella" }]
            },
            {
                name: "Rigel", ra: 5.24, dec: -8.20, color: 0xa3c2ff,
                description: "A blue supergiant star in the constellation of Orion. It is the brightest star in Orion and the seventh-brightest star in the night sky.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1509a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic1509a.jpg"],
                links: [{ title: "Wikipedia: Rigel", url: "https://en.wikipedia.org/wiki/Rigel" }]
            },
            {
                name: "Procyon", ra: 7.65, dec: 5.22, color: 0xfff5f5,
                description: "The brightest star in the constellation of Canis Minor and usually the eighth-brightest star in the night sky.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0516c.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic0516c.jpg"],
                links: [{ title: "Wikipedia: Procyon", url: "https://en.wikipedia.org/wiki/Procyon" }]
            },
            {
                name: "Betelgeuse", ra: 5.92, dec: 7.41, color: 0xff8c00,
                description: "A red supergiant of spectral type M1-2 and one of the largest stars visible to the naked eye. It is usually the tenth-brightest star in the night sky and, after Rigel, the second-brightest in the constellation of Orion.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/opo9604a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/opo9604a.jpg"],
                links: [{ title: "Wikipedia: Betelgeuse", url: "https://en.wikipedia.org/wiki/Betelgeuse" }]
            },
            {
                name: "Altair", ra: 19.85, dec: 8.87, color: 0xffffff,
                description: "The brightest star in the constellation of Aquila and the twelfth-brightest star in the night sky. It is an A-type main-sequence star.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0601a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic0601a.jpg"],
                links: [{ title: "Wikipedia: Altair", url: "https://en.wikipedia.org/wiki/Altair" }]
            },
            {
                name: "Aldebaran", ra: 4.60, dec: 16.51, color: 0xff8c00,
                description: "A giant star located in the zodiac constellation Taurus. It is the brightest star in Taurus and generally the fourteenth-brightest star in the night sky.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/potw1726a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/potw1726a.jpg"],
                links: [{ title: "Wikipedia: Aldebaran", url: "https://en.wikipedia.org/wiki/Aldebaran" }]
            },
            {
                name: "Antares", ra: 16.49, dec: -26.43, color: 0xff4500,
                description: "A red supergiant star in the constellation of Scorpius. It is the fifteenth-brightest star in the night sky.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1209a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic1209a.jpg"],
                links: [{ title: "Wikipedia: Antares", url: "https://en.wikipedia.org/wiki/Antares" }]
            },
            {
                name: "Spica", ra: 13.42, dec: -11.16, color: 0xa3c2ff,
                description: "The brightest object in the constellation of Virgo and one of the 20 brightest stars in the night sky.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0206a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic0206a.jpg"],
                links: [{ title: "Wikipedia: Spica", url: "https://en.wikipedia.org/wiki/Spica" }]
            },
            {
                name: "Pollux", ra: 7.76, dec: 28.03, color: 0xffd27d,
                description: "An orange-hued giant star in the constellation of Gemini. It is the brightest star in Gemini and the closest giant star to the Sun.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1007b.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic1007b.jpg"],
                links: [{ title: "Wikipedia: Pollux", url: "https://en.wikipedia.org/wiki/Pollux" }]
            },
            {
                name: "Fomalhaut", ra: 22.96, dec: -29.62, color: 0xffffff,
                description: "The brightest star in the constellation of Piscis Austrinus. It is a class A main-sequence star approximately 25 light-years from the Sun.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0821a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic0821a.jpg"],
                links: [{ title: "Wikipedia: Fomalhaut", url: "https://en.wikipedia.org/wiki/Fomalhaut" }]
            },
            {
                name: "Deneb", ra: 20.69, dec: 45.28, color: 0xffffff,
                description: "A first-magnitude star in the constellation of Cygnus. It is one of the vertices of the Summer Triangle and is a blue-white supergiant.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0910a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic0910a.jpg"],
                links: [{ title: "Wikipedia: Deneb", url: "https://en.wikipedia.org/wiki/Deneb" }]
            },
            {
                name: "Regulus", ra: 10.14, dec: 11.97, color: 0xa3c2ff,
                description: "The brightest object in the constellation of Leo and one of the brightest stars in the night sky.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0516d.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic0516d.jpg"],
                links: [{ title: "Wikipedia: Regulus", url: "https://en.wikipedia.org/wiki/Regulus" }]
            },
            {
                name: "Polaris", ra: 2.53, dec: 89.26, color: 0xfff5f5,
                description: "The North Star or Pole Star, is the brightest star in the constellation of Ursa Minor. It is very close to the north celestial pole.",
                imageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0704a.jpg",
                images: ["https://cdn.esahubble.org/archives/images/screen/heic0704a.jpg"],
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

            const label = this.createLabel(star.name);
            label.position.set(x, y - 200, z);
            this.scene.add(label);
        });
    }

    createLabel(text: string) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error("Could not get 2D context");

        canvas.width = 256;
        canvas.height = 64;

        context.font = 'Bold 32px Arial';
        context.fillStyle = 'rgba(255, 255, 255, 1.0)';
        context.textAlign = 'center';
        context.fillText(text, 128, 48);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2000, 500, 1);

        return sprite;
    }

    createPlanets() {
        // Add Sun manually to planets array for UI interaction
        const sunData = SolarSystemData.find(d => d.name === "Sun");
        if (sunData) {
            // We already created the Sun mesh manually in init(), so we just wrap it
            const sunMesh = this.scene.children.find(c => (c as THREE.Mesh).geometry && (c as THREE.Mesh).geometry.type === 'SphereGeometry' && (c as THREE.Mesh).material === this.sunMaterial) as THREE.Mesh;
            if (sunMesh) {
                sunMesh.userData = sunData; // Attach data
                // Create a mock CelestialBody for the Sun
                const sunBody = new CelestialBody(sunData, this.scene);
                sunBody.mesh = sunMesh;
                // Override update to do nothing for Sun (it's static)
                sunBody.update = () => { };
                this.planets.push(sunBody);
            }
        }

        SolarSystemData.forEach(data => {
            if (data.name === "Sun") return; // Skip Sun as it's created manually
            const planet = new CelestialBody(data, this.scene);
            this.planets.push(planet);
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        const deltaTime = this.clock.getDelta() * this.timeScale;

        this.planets.forEach(planet => {
            planet.update(deltaTime);
            // Update atmosphere view vector if it exists
            if (planet.atmosphereMesh && planet.orbitGroup) {
                (planet.atmosphereMesh.material as THREE.ShaderMaterial).uniforms.viewVector.value.subVectors(this.camera.position, planet.orbitGroup.position);
            }
        });

        if (this.sunMaterial) {
            this.sunMaterial.uniforms.time.value = this.clock.getElapsedTime();
        }

        if (this.surfaceViewBody && this.surfaceViewBody.mesh) {
            const planetPos = new THREE.Vector3();
            this.surfaceViewBody.mesh.getWorldPosition(planetPos);

            const sunToPlanet = planetPos.clone().normalize();
            const offset = sunToPlanet.multiplyScalar(this.surfaceViewBody.data.radius + 2);
            const camPos = planetPos.clone().sub(offset);

            this.camera.position.copy(camPos);
            this.camera.lookAt(0, 0, 0);
            this.controls.enabled = false;
        } else if (this.focusedBody && this.focusedBody.mesh) {
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
        this.renderer.render(this.scene, this.camera);
    }

    toggleOrbits(visible: boolean) {
        this.showOrbits = visible;
        this.planets.forEach(planet => planet.toggleOrbit(visible));
    }

    toggleMoons(visible: boolean) {
        this.showMoons = visible;
        this.planets.forEach(planet => planet.toggleMoons(visible));
    }

    focusOnBody(name: string) {
        // Check planets
        let target = this.planets.find(p => p.data.name === name);



        if (target && target.mesh) {
            this.focusedBody = target;
            this.surfaceViewBody = null;

            const pos = new THREE.Vector3();
            target.mesh.getWorldPosition(pos);
            this.controls.target.copy(pos);

            // Adjust camera distance based on radius
            const distance = target.data.radius * 5;
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

    detachCamera() {
        this.focusedBody = null;
        this.surfaceViewBody = null;
        this.previousBodyPosition = null;
        this.controls.enabled = true;
        this.controls.autoRotate = false;
    }

    setSurfaceView(name: string) {
        const target = this.planets.find(p => p.data.name === name);
        if (target && target.mesh) {
            this.surfaceViewBody = target;
            this.focusedBody = null;
            this.previousBodyPosition = null;
        }
    }
}
