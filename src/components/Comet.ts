import * as THREE from 'three';
import { CometData } from './SolarSystemData';
import { solveKepler } from './MathUtils';


export class Comet {
    data: CometData;
    parent: THREE.Object3D;
    mesh: THREE.Mesh;
    orbitLine: THREE.LineLoop | null;
    orbitGroup: THREE.Group; // Group for actual comet mesh, tail, etc. Moves along orbit.
    baseGroup: THREE.Group; // Group rotated to inclination/argument of periapsis
    angle: number; // Current mean anomaly in radians
    tailParticles: THREE.Points | null;

    // Orbit parameters
    a: number; // Semi-major axis
    e: number; // Eccentricity
    b: number; // Semi-minor axis
    realisticDistances: boolean = false;
    private static readonly _tempDir = new THREE.Vector3();

    constructor(data: CometData, parent: THREE.Object3D) {
        this.data = data;
        this.parent = parent;
        this.orbitLine = null;
        this.angle = THREE.MathUtils.seededRandom() * Math.PI * 2; // Start at random position
        this.baseGroup = new THREE.Group();
        this.orbitGroup = new THREE.Group();
        this.tailParticles = null;

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

        // Create Comet Body (Coma)
        const visualRadius = Math.max(this.data.radius * 3.0, 0.6);
        const geometry = new THREE.SphereGeometry(visualRadius, 32, 32);

        // A fuzzy, glowing coma material instead of a solid planet
        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(this.data.color) },
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(vViewPosition);
                    // Intensity is higher in the middle, fading out to edges
                    float intensity = pow(max(dot(normal, viewDir), 0.0), 1.5);
                    gl_FragColor = vec4(color, intensity);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.renderOrder = 1; // Ensures it renders after other transparent objects, preventing center-based depth sorting issues, but keeps depthTest to allow occlusion by planets
        this.mesh.frustumCulled = false;
        this.orbitGroup.add(this.mesh);

        // Create Comet Tail
        this.createTail();

        // Create Orbit
        this.createOrbit();


    }

    createTail() {
        const isMobile = typeof window !== 'undefined' && (
            ('ontouchstart' in window) ||
            (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
            window.innerWidth <= 768
        );
        const particleCount = isMobile ? 4000 : 12000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Initialize near center
            positions[i * 3] = (THREE.MathUtils.seededRandom() - 0.5) * this.data.radius;
            positions[i * 3 + 1] = (THREE.MathUtils.seededRandom() - 0.5) * this.data.radius;
            positions[i * 3 + 2] = (THREE.MathUtils.seededRandom() - 0.5) * this.data.radius;
            lifetimes[i] = THREE.MathUtils.seededRandom(); // 0.0 to 1.0
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

        // Tail uses additive blending and points away from the sun
        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xaaddff) }, // Ice/dust blue-white
                sunDirection: { value: new THREE.Vector3(1, 0, 0) }, // Updated each frame
                time: { value: 0 },
                tailVisibility: { value: 1 }
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
                    // Make particles larger and clamp minimum size so they don't vanish from side profile
                    float size = 300.0 * vAlpha;
                    gl_PointSize = max(1.5, size / -mvPosition.z);
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
        this.tailParticles.renderOrder = 1;
        this.tailParticles.frustumCulled = false; // Prevent tail from disappearing at certain angles
        this.orbitGroup.add(this.tailParticles);
    }

    rebuildOrbit(realistic: boolean, sizeRatio: number = 1.0) {
        this.realisticDistances = realistic;

        const displayRadius = this.data.displayRadius ?? this.data.radius;
        const realisticRadius = displayRadius * 0.005536 * sizeRatio;
        const scale = realistic ? (realisticRadius / this.data.radius) : 1.0;
        this.mesh.scale.setScalar(scale);
        if (this.tailParticles) this.tailParticles.scale.setScalar(scale);
        if (this.orbitLine) {
            this.baseGroup.remove(this.orbitLine);
            this.orbitLine.geometry.dispose();
            (this.orbitLine.material as THREE.Material).dispose();
            this.orbitLine = null;
        }

        const distanceAU = this.data.distanceAU || (this.data.semiMajorAxis / 13);
        this.a = this.realisticDistances ? distanceAU * 130 : this.data.semiMajorAxis;
        this.e = this.data.eccentricity;
        this.b = this.a * Math.sqrt(1 - this.e * this.e);

        this.createOrbit();
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



    update(deltaTime: number, simTimePassed?: number, rawDelta?: number) {
        // Simple Keplerian update
        // We use Mean Anomaly (M) and Eccentric Anomaly (E)

        // Mean motion n = 2pi / T
        const n = (Math.PI * 2) / this.data.period;

        // Update Mean Anomaly
        // speedMultiplier adjusts overall simulation speed similarly to planets
        const speedMultiplier = 0.5;

        if (simTimePassed !== undefined) {
            const baseAngle = this.data.baseLongitude || 0;
            this.angle = (baseAngle + n * simTimePassed * speedMultiplier) % (Math.PI * 2);
        } else {
            this.angle += n * deltaTime * speedMultiplier;
            this.angle = this.angle % (Math.PI * 2);
        }

        // Solve Kepler's equation M = E - e*sin(E) for E using Newton-Raphson
        let M = this.angle;
        let E = solveKepler(M, this.e);

        // Calculate position in orbital plane
        const x = this.a * (Math.cos(E) - this.e);
        const z = this.b * Math.sin(E);

        this.orbitGroup.position.set(x, 0, z);

        // Update Tail
        if (this.tailParticles) {
            const material = this.tailParticles.material as THREE.ShaderMaterial;
            // Solar wind continuously sweeps comet tail dust & ions away from the Sun in real time
            const flowDelta = (rawDelta !== undefined && rawDelta > 0) ? rawDelta * 1.5 : deltaTime;
            material.uniforms.time.value += flowDelta;

            // Tail direction points away from the Sun in baseGroup/orbitGroup space
            Comet._tempDir.set(x, 0, z).normalize();
            material.uniforms.sunDirection.value.copy(Comet._tempDir);

            // Tail intensity based on distance to sun (closer = brighter/longer)
            // Distance squared = x*x + z*z
            const dist = Math.sqrt((x * x) + (z * z));
            // Example: max tail at perihelion (dist = a*(1-e)), min at aphelion (dist = a*(1+e))
            const perihelion = this.a * (1 - this.e);

            // Rough fade logic:
            const tailVisibility = Math.max(0.15, 1 - ((dist - perihelion) / (this.a * 2.5)));
            material.uniforms.tailVisibility.value = tailVisibility;
            // Also need to pass this to shader if we want length to change, but opacity fade is good enough for now
        }
    }

    toggleOrbit(visible: boolean) {
        if (this.orbitLine) {
            this.orbitLine.visible = visible;
        }
    }

    dispose() {
        if (this.mesh) {
            this.mesh.geometry?.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(m => m.dispose());
            } else {
                (this.mesh.material as any)?.dispose?.();
            }
        }

        if (this.tailParticles) {
            this.tailParticles.geometry?.dispose();
            if (Array.isArray(this.tailParticles.material)) {
                this.tailParticles.material.forEach(m => m.dispose());
            } else {
                (this.tailParticles.material as any)?.dispose?.();
            }
        }

        if (this.orbitLine) {
            this.orbitLine.geometry?.dispose();
            if (Array.isArray(this.orbitLine.material)) {
                this.orbitLine.material.forEach(m => m.dispose());
            } else {
                (this.orbitLine.material as any)?.dispose?.();
            }
        }

        if (this.orbitGroup.parent) {
            this.orbitGroup.parent.remove(this.orbitGroup);
        }
        if (this.baseGroup.parent) {
            this.baseGroup.parent.remove(this.baseGroup);
        }
    }
}
