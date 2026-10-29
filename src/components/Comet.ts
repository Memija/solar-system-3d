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
    private static readonly _tempLateral = new THREE.Vector3();

    constructor(data: CometData, parent: THREE.Object3D) {
        this.data = data;
        this.parent = parent;
        this.orbitLine = null;
        this.angle = THREE.MathUtils.seededRandom() * Math.PI * 2;
        this.baseGroup = new THREE.Group();
        this.orbitGroup = new THREE.Group();
        this.tailParticles = null;

        this.a = this.data.semiMajorAxis;
        this.e = this.data.eccentricity;
        this.b = this.a * Math.sqrt(1 - this.e * this.e);

        this.mesh = new THREE.Mesh();

        this.init();
    }

    init() {
        this.parent.add(this.baseGroup);

        // Apply orbital inclination and argument of periapsis to the base group
        this.baseGroup.rotation.y = THREE.MathUtils.degToRad(this.data.argumentOfPeriapsis);
        this.baseGroup.rotation.x = THREE.MathUtils.degToRad(this.data.inclination);

        this.baseGroup.add(this.orbitGroup);

        // Create Comet Body (Coma)
        const visualRadius = Math.max(this.data.radius * 3.0, 0.6);
        const geometry = new THREE.SphereGeometry(visualRadius, 32, 32);

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
                    float intensity = pow(max(dot(normal, viewDir), 0.0), 1.5);
                    gl_FragColor = vec4(color, intensity);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.renderOrder = 1;
        this.mesh.frustumCulled = false;
        this.orbitGroup.add(this.mesh);

        // Create Dual Ion + Dust Comet Tail
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
        const particleCount = isMobile ? 4000 : 10000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        const tailKinds = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Guarantee non-zero initial spread vector
            const rx = (THREE.MathUtils.seededRandom() - 0.5) * this.data.radius;
            const ry = (THREE.MathUtils.seededRandom() - 0.5) * this.data.radius;
            const rz = (THREE.MathUtils.seededRandom() - 0.5) * this.data.radius;
            positions[i * 3] = Math.abs(rx) < 1e-4 && Math.abs(ry) < 1e-4 && Math.abs(rz) < 1e-4 ? 1e-3 : rx;
            positions[i * 3 + 1] = ry;
            positions[i * 3 + 2] = rz;
            lifetimes[i] = THREE.MathUtils.seededRandom();
            // 42% Type-I narrow blue-cyan ion tail, 58% Type-II curved warm-white dust tail
            tailKinds[i] = i % 12 < 5 ? 0.0 : 1.0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('tailKind', new THREE.BufferAttribute(tailKinds, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x7dd3fc) },      // Ion tail plasma blue-cyan
                dustColor: { value: new THREE.Color(0xfef3c7) },  // Dust tail warm solar-reflected cream
                sunDirection: { value: new THREE.Vector3(1, 0, 0) },
                orbitLateral: { value: new THREE.Vector3(0, 0, 1) },
                time: { value: 0 },
                tailVisibility: { value: 1 }
            },
            vertexShader: `
                uniform vec3 sunDirection;
                uniform vec3 orbitLateral;
                uniform float time;
                attribute float lifetime;
                attribute float tailKind;
                varying float vAlpha;
                varying float vKind;

                void main() {
                    vKind = tailKind;
                    // Ion stream travels faster in solar wind than heavier dust grains
                    float speedScale = mix(1.25, 0.72, tailKind);
                    float currentLife = fract(lifetime + time * speedScale);
                    vAlpha = 1.0 - currentLife;

                    vec3 offset = position;
                    float offsetLen = length(offset);
                    vec3 radialDir = offsetLen > 0.0001 ? (offset / offsetLen) : vec3(0.0, 1.0, 0.0);

                    // Ion tail is straight & narrow (anti-sunward); dust tail curves gently behind orbital velocity
                    float tailLen = mix(92.0, 74.0, tailKind);
                    float coneSpread = mix(6.5, 17.5, tailKind);
                    vec3 curveDrift = orbitLateral * (tailKind * currentLife * currentLife * 22.0);
                    vec3 tailMove = sunDirection * (currentLife * tailLen) + curveDrift;

                    offset += radialDir * (currentLife * coneSpread);

                    vec4 mvPosition = modelViewMatrix * vec4(tailMove + offset, 1.0);
                    float size = mix(240.0, 320.0, tailKind) * vAlpha;
                    gl_PointSize = max(1.5, size / max(0.1, -mvPosition.z));
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform vec3 dustColor;
                uniform float tailVisibility;
                varying float vAlpha;
                varying float vKind;

                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float r = length(coord);
                    if (r > 0.5) discard;

                    float intensity = pow(1.0 - (r * 2.0), 1.35);
                    vec3 particleColor = mix(color, dustColor, vKind);
                    gl_FragColor = vec4(particleColor, vAlpha * intensity * 0.48 * tailVisibility);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.tailParticles = new THREE.Points(geometry, material);
        this.tailParticles.renderOrder = 1;
        this.tailParticles.frustumCulled = false;
        this.orbitGroup.add(this.tailParticles);
    }

    rebuildOrbit(realistic: boolean, sizeRatio: number = 1.0) {
        this.realisticDistances = realistic;

        const displayRadius = this.data.displayRadius ?? this.data.radius;
        const realisticRadius = displayRadius * 0.005536 * sizeRatio;
        // Comas & gas/dust tails expand tens of thousands of km even around a small nucleus,
        // so preserve a physically reasonable coma/tail visibility floor in realistic scale.
        const comaScale = realistic ? Math.max(realisticRadius / this.data.radius, 0.12 * sizeRatio) : 1.0;
        const tailScale = realistic ? Math.max(comaScale, 0.35 * sizeRatio) : 1.0;
        this.mesh.scale.setScalar(comaScale);
        if (this.tailParticles) this.tailParticles.scale.setScalar(tailScale);

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
            const E = (i / segments) * Math.PI * 2;
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
        const n = (Math.PI * 2) / this.data.period;
        const speedMultiplier = 0.5;

        if (simTimePassed !== undefined) {
            const baseAngle = this.data.baseLongitude || 0;
            this.angle = (baseAngle + n * simTimePassed * speedMultiplier) % (Math.PI * 2);
        } else {
            this.angle += n * deltaTime * speedMultiplier;
            this.angle = this.angle % (Math.PI * 2);
        }

        const M = this.angle;
        const E = solveKepler(M, this.e);

        const x = this.a * (Math.cos(E) - this.e);
        const z = this.b * Math.sin(E);

        this.orbitGroup.position.set(x, 0, z);

        if (this.tailParticles) {
            const material = this.tailParticles.material as THREE.ShaderMaterial;
            const flowDelta = (rawDelta !== undefined && rawDelta > 0) ? rawDelta * 1.15 : deltaTime;
            material.uniforms.time.value += flowDelta;

            // Anti-sunward vector in baseGroup orbital plane
            const dist = Math.sqrt((x * x) + (z * z));
            if (dist > 1e-5) {
                Comet._tempDir.set(x / dist, 0, z / dist);
            } else {
                Comet._tempDir.set(1, 0, 0);
            }
            material.uniforms.sunDirection.value.copy(Comet._tempDir);

            // Trailing orbital lateral vector (opposite instantaneous velocity tangent) for dust-tail curvature
            Comet._tempLateral.set(this.a * Math.sin(E), 0, -this.b * Math.cos(E));
            if (Comet._tempLateral.lengthSq() > 1e-6) {
                Comet._tempLateral.normalize();
            } else {
                Comet._tempLateral.set(0, 0, 1);
            }
            if (material.uniforms.orbitLateral) {
                material.uniforms.orbitLateral.value.copy(Comet._tempLateral);
            }

            const perihelion = this.a * (1 - this.e);
            const tailVisibility = Math.max(0.15, 1 - ((dist - perihelion) / (this.a * 2.5)));
            material.uniforms.tailVisibility.value = tailVisibility;
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
