import * as THREE from 'three';
import { CometData } from './SolarSystemData.js';

export class Comet {
    data: CometData;
    parent: THREE.Object3D;
    mesh: THREE.Mesh;
    orbitLine: THREE.LineLoop | null;
    orbitGroup: THREE.Group; // Group for actual comet mesh, tail, etc. Moves along orbit.
    baseGroup: THREE.Group; // Group rotated to inclination/argument of periapsis
    angle: number; // Current mean anomaly in radians
    tailParticles: THREE.Points | null;
    labelSprite: THREE.Sprite | null;

    // Orbit parameters
    a: number; // Semi-major axis
    e: number; // Eccentricity
    b: number; // Semi-minor axis

    constructor(data: CometData, parent: THREE.Object3D) {
        this.data = data;
        this.parent = parent;
        this.orbitLine = null;
        this.angle = Math.random() * Math.PI * 2; // Start at random position
        this.baseGroup = new THREE.Group();
        this.orbitGroup = new THREE.Group();
        this.tailParticles = null;
        this.labelSprite = null;

        // Calculate orbit parameters
        this.a = this.data.semiMajorAxis;
        this.e = this.data.eccentricity;
        this.b = this.a * Math.sqrt(1 - this.e * this.e);

        // Required to initialize mesh to satisfy TypeScript (will be reassigned in init)
        this.mesh = new THREE.Mesh();

        this.init();
    }

    init() {
        this.parent.add(this.baseGroup);

        // Apply orbital inclination and argument of periapsis to the base group
        // First rotate argument of periapsis (around Y), then inclination (around X)
        this.baseGroup.rotation.y = THREE.MathUtils.degToRad(this.data.argumentOfPeriapsis);
        this.baseGroup.rotation.x = THREE.MathUtils.degToRad(this.data.inclination);

        this.baseGroup.add(this.orbitGroup);

        // Create Comet Body
        const geometry = new THREE.SphereGeometry(this.data.radius, 32, 32);

        let material: THREE.Material;
        if (this.data.texture) {
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load(this.data.texture);
            texture.colorSpace = THREE.SRGBColorSpace;
            material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.9,
                color: 0xffffff
            });
        } else {
            // Rough, rocky icy body
            material = new THREE.MeshStandardMaterial({
                color: this.data.color,
                roughness: 0.9,
                metalness: 0.1
            });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.orbitGroup.add(this.mesh);

        // Create Comet Tail
        this.createTail();

        // Create Orbit
        this.createOrbit();

        // Create Label
        this.createLabel();
    }

    createTail() {
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Initialize near center
            positions[i * 3] = (Math.random() - 0.5) * this.data.radius;
            positions[i * 3 + 1] = (Math.random() - 0.5) * this.data.radius;
            positions[i * 3 + 2] = (Math.random() - 0.5) * this.data.radius;
            lifetimes[i] = Math.random(); // 0.0 to 1.0
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

        // Tail uses additive blending and points away from the sun
        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xaaddff) }, // Ice/dust blue-white
                sunDirection: { value: new THREE.Vector3(1, 0, 0) }, // Updated each frame
                time: { value: 0 },
                tailVisibility: { value: 1.0 }
            },
            vertexShader: `
                uniform vec3 sunDirection;
                uniform float time;
                attribute float lifetime;
                varying float vAlpha;

                void main() {
                    // Update lifetime based on time to animate particles moving down the tail
                    float currentLife = fract(lifetime + time);
                    vAlpha = 1.0 - currentLife; // Fade out as it moves away

                    // The tail points AWAY from the sun.
                    // currentLife goes from 0 to 1.
                    // We move the particle along sunDirection (away from sun)
                    // multiplied by some scale based on distance from sun (simulated in update)

                    // Base spread
                    vec3 offset = position;
                    // Move away from sun
                    vec3 tailMove = sunDirection * (currentLife * 80.0); // 80 is tail length scale

                    // Widen tail as it moves away
                    offset += normalize(offset) * (currentLife * 15.0);

                    vec4 mvPosition = modelViewMatrix * vec4(tailMove + offset, 1.0);
                    gl_PointSize = (10.0 * vAlpha) / -mvPosition.z; // Scale by distance and fade
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float tailVisibility;
                varying float vAlpha;

                void main() {
                    // Soft circle
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    if(length(coord) > 0.5) discard;

                    float intensity = 1.0 - (length(coord) * 2.0);
                    gl_FragColor = vec4(color, vAlpha * intensity * 0.5 * tailVisibility);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.tailParticles = new THREE.Points(geometry, material);
        this.orbitGroup.add(this.tailParticles);
    }

    createOrbit() {
        const segments = 256;
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for (let i = 0; i <= segments; i++) {
            const E = (i / segments) * Math.PI * 2; // Eccentric anomaly

            // Parametric equation for ellipse with focus at origin
            const x = this.a * (Math.cos(E) - this.e);
            const z = this.b * Math.sin(E);

            vertices.push(x, 0, z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.LineBasicMaterial({ color: 0x88bbff, transparent: true, opacity: 0.3 });

        this.orbitLine = new THREE.LineLoop(geometry, material);
        this.baseGroup.add(this.orbitLine);
    }

    createLabel() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = 256;
        canvas.height = 64;

        context.font = 'Bold 32px Arial';
        context.fillStyle = 'rgba(255, 255, 255, 1)';
        context.textAlign = 'center';
        context.fillText(this.data.name, 128, 48);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(material);

        sprite.scale.set(40, 10, 1);
        sprite.position.y = this.data.radius + 3;

        this.orbitGroup.add(sprite);
        this.labelSprite = sprite;
    }

    update(deltaTime: number) {
        // Simple Keplerian update
        // We use Mean Anomaly (M) and Eccentric Anomaly (E)

        // Mean motion n = 2pi / T
        const n = (Math.PI * 2) / this.data.period;

        // Update Mean Anomaly
        // speedMultiplier adjusts overall simulation speed similarly to planets
        const speedMultiplier = 0.5;
        this.angle += n * deltaTime * speedMultiplier;

        // Keep angle in 0-2PI range
        this.angle = this.angle % (Math.PI * 2);

        // Solve Kepler's equation M = E - e*sin(E) for E using Newton-Raphson
        let E = this.angle; // Initial guess
        for(let i=0; i<5; i++) {
            E = E - (E - this.e * Math.sin(E) - this.angle) / (1 - this.e * Math.cos(E));
        }

        // Calculate position in orbital plane
        const x = this.a * (Math.cos(E) - this.e);
        const z = this.b * Math.sin(E);

        this.orbitGroup.position.set(x, 0, z);

        // Update Tail
        if (this.tailParticles) {
            const material = this.tailParticles.material as THREE.ShaderMaterial;
            material.uniforms.time.value += deltaTime;

            // Tail direction points away from the Sun
            // In the orbitGroup's local space, the Sun is at -orbitGroup.position
            // Because orbitGroup is child of baseGroup which is rotated, we need to find
            // the vector from Sun(0,0,0 in world) to the Comet in world, and map it to local?
            // Actually, if we just want it pointing away from Sun, vector from Sun to Comet is just world position of Comet.
            const worldPos = new THREE.Vector3();
            this.orbitGroup.getWorldPosition(worldPos);

            // Convert sun direction back to local space of the orbit group so the particles move correctly
            // Sun is at 0,0,0. Direction away from sun in world space is normalize(worldPos - (0,0,0))
            const dirAwayFromSunWorld = worldPos.clone().normalize();

            // To get local direction, we inverse transform this vector by the orbitGroup's world rotation matrix
            // However, a simpler way: the tail particles are in orbitGroup space.
            // In baseGroup space, the sun is at (0,0,0) and comet is at (x,0,z).
            // So vector away from sun in baseGroup space is (x,0,z).
            // Since orbitGroup has no rotation relative to baseGroup, local direction is just normalize(x,0,z)!
            const localDirAwayFromSun = new THREE.Vector3(x, 0, z).normalize();

            material.uniforms.sunDirection.value.copy(localDirAwayFromSun);

            // Tail intensity based on distance to sun (closer = brighter/longer)
            // Distance squared = x*x + z*z
            const dist = Math.sqrt(x*x + z*z);
            // Example: max tail at perihelion (dist = a*(1-e)), min at aphelion (dist = a*(1+e))
            const perihelion = this.a * (1 - this.e);

            // Rough fade logic:
            const tailVisibility = Math.max(0, 1 - (dist - perihelion) / (this.a * 1.5));
            material.uniforms.tailVisibility.value = tailVisibility;
            // Also need to pass this to shader if we want length to change, but opacity fade is good enough for now
        }
    }

    toggleOrbit(visible: boolean) {
        if (this.orbitLine) {
            this.orbitLine.visible = visible;
        }
    }

    toggleLabels(visible: boolean) {
        if (this.labelSprite) {
            this.labelSprite.visible = visible;
        }
    }
}
