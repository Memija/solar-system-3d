import * as THREE from 'three';

import { CelestialBodyData, MoonData } from './SolarSystemData.js';
import { vertexShader as sunVertexShader, fragmentShader as sunFragmentShader } from './SunShader';

export class CelestialBody {
    data: CelestialBodyData | MoonData;
    parent: THREE.Object3D;
    mesh: THREE.Mesh | null;
    orbitLine: THREE.LineLoop | null;
    angle: number;
    moons: CelestialBody[];
    orbitGroup: THREE.Group;
    cloudMesh?: THREE.Mesh;
    atmosphereMesh?: THREE.Mesh;
    shaderMaterial?: THREE.ShaderMaterial;

    constructor(data: CelestialBodyData | MoonData, parent: THREE.Object3D) {
        this.data = data;
        this.parent = parent;
        this.mesh = null;
        this.orbitLine = null;
        this.angle = Math.random() * Math.PI * 2;
        this.moons = [];
        this.orbitGroup = new THREE.Group(); // Initialize here to satisfy TS

        this.init();
    }
    init() {
        // Group to hold mesh and moons, positioned at orbit
        this.orbitGroup = new THREE.Group();
        this.parent.add(this.orbitGroup);

        // Geometry - Increase segments for larger planets
        let segments = 64;
        if (this.data.radius > 3) { // Gas giants
            segments = 128;
        }
        const geometry = new THREE.SphereGeometry(this.data.radius, segments, segments);

        // Material
        let material: THREE.Material;

        // Common Texture Loading
        const textureLoader = new THREE.TextureLoader();
        let texturePath = this.data.texture;

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
        } else {
            // Planets and Moons
            if (texturePath && this.data.name === 'Earth') {
                const texture = textureLoader.load(texturePath);
                texture.colorSpace = THREE.SRGBColorSpace;

                // Improve texture quality
                texture.anisotropy = 16;

                material = new THREE.MeshStandardMaterial({
                    map: texture,
                    roughness: 0.8,
                    metalness: 0.1,
                    color: 0xffffff
                });

                // Adjust for Gas Giants
                if (['Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(this.data.name)) {
                    (material as THREE.MeshStandardMaterial).roughness = 1.0;
                    (material as THREE.MeshStandardMaterial).metalness = 0.0;
                }
            } else {
                material = new THREE.MeshStandardMaterial({
                    color: this.data.color,
                    roughness: 0.8,
                    metalness: 0.1
                });
            }
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.orbitGroup.add(this.mesh);

        // --- EARTH SPECIFIC ADDITIONS ---
        if (this.data.name === 'Earth') {
            // 2. Cloud Sphere
            const cloudGeometry = new THREE.SphereGeometry(this.data.radius * 1.005, 64, 64);
            const cloudTexture = textureLoader.load('textures/earth_clouds.png');
            const cloudMaterial = new THREE.MeshStandardMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide,
                blending: THREE.NormalBlending,
                depthWrite: false
            });
            this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
            this.cloudMesh.castShadow = false;
            this.cloudMesh.receiveShadow = false;
            this.orbitGroup.add(this.cloudMesh);

            // 3. Atmosphere Glow (Fresnel)
            const atmosphereGeometry = new THREE.SphereGeometry(this.data.radius * 1.025, 64, 64);
            const atmosphereMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    c: { value: 0.3 },
                    p: { value: 5.0 },
                    glowColor: { value: new THREE.Color(0x00aaff) },
                    viewVector: { value: new THREE.Vector3() }
                },
                vertexShader: `
                    uniform vec3 viewVector;
                    uniform float c;
                    uniform float p;
                    varying float intensity;
                    void main() {
                        vec3 vNormal = normalize(normalMatrix * normal);
                        vec3 vNormel = normalize(normalMatrix * viewVector);
                        intensity = pow(c - dot(vNormal, vNormel), p);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                    }
                `,
                fragmentShader: `
                    uniform vec3 glowColor;
                    varying float intensity;
                    void main() {
                        vec3 glow = glowColor * intensity;
                        gl_FragColor = vec4( glow, 1.0 );
                    }
                `,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true
            });

            this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            this.orbitGroup.add(this.atmosphereMesh);
        }

        // Create Orbit Line
        this.createOrbit();

        // Create Moons
        if ('moons' in this.data && this.data.moons) {
            this.data.moons.forEach(moonData => {
                const moon = new CelestialBody(moonData, this.orbitGroup);
                this.moons.push(moon);
            });
        }
    }

    createOrbit() {
        if (this.data.distance === 0) return; // Sun or center

        const segments = 128;
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const x = Math.cos(theta) * this.data.distance;
            const z = Math.sin(theta) * this.data.distance;
            vertices.push(x, 0, z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 });

        this.orbitLine = new THREE.LineLoop(geometry, material);

        this.parent.add(this.orbitLine);
    }

    update(deltaTime: number) {
        // Update position
        const speedMultiplier = 0.5;
        const speed = (1 / this.data.period) * speedMultiplier;

        this.angle += speed * deltaTime;

        const x = Math.cos(this.angle) * this.data.distance;
        const z = Math.sin(this.angle) * this.data.distance;

        // Move the group
        this.orbitGroup.position.set(x, 0, z);

        // Rotate planet on its axis
        if (this.mesh) {
            this.mesh.rotation.y += 0.5 * deltaTime;
        }

        // Rotate Clouds independently
        if (this.cloudMesh) {
            this.cloudMesh.rotation.y += 0.55 * deltaTime; // Slightly faster than surface
        }

        // Update Atmosphere
        if (this.atmosphereMesh && this.parent.parent && (this.parent.parent as any).camera) {
            // We need access to camera for viewVector
            // Since we don't have direct access to camera here easily without passing it down,
            // we can try to find it or pass it in update.
            // For now, let's assume the camera position relative to the planet is what matters.
            // Actually, the shader needs viewVector = cameraPosition - planetPosition
            // We can update this if we pass camera to update.
        }

        // Update Shader Time
        if (this.shaderMaterial) {
            this.shaderMaterial.uniforms.time.value += deltaTime;
        }

        // Update moons
        this.moons.forEach(moon => moon.update(deltaTime));
    }

    toggleOrbit(visible: boolean) {
        if (this.orbitLine) {
            this.orbitLine.visible = visible;
        }
        this.moons.forEach(moon => moon.toggleOrbit(visible));
    }

    toggleMoons(visible: boolean) {
        this.moons.forEach(moon => {
            if (moon.mesh) moon.mesh.visible = visible;
            if (moon.orbitLine) moon.orbitLine.visible = visible;
            moon.toggleMoons(visible);
        });
    }
}
