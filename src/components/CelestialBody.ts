import * as THREE from 'three';

import { CelestialBodyData, MoonData } from './SolarSystemData.js';
import { vertexShader as sunVertexShader, fragmentShader as sunFragmentShader } from './SunShader';
import { createSpriteLabel, createInfoLabel, updateInfoLabel } from './LabelHelper.js';

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
    labelSprite: THREE.Sprite | null;
    infoSprite: THREE.Sprite | null;
    lastUpdate?: number;

    meteorParticles: THREE.LineSegments | null;
    meteorVelocities: THREE.Vector3[];
    showMeteors: boolean;

    trailLine: THREE.Line | null;
    trailPositions: THREE.Vector3[];
    showTrails: boolean;

    constructor(data: CelestialBodyData | MoonData, parent: THREE.Object3D) {
        this.data = data;
        this.parent = parent;
        this.mesh = null;
        this.orbitLine = null;
        this.angle = THREE.MathUtils.seededRandom() * Math.PI * 2;
        this.moons = [];
        this.orbitGroup = new THREE.Group(); // Initialize here to satisfy TS
        this.tiltGroup = new THREE.Group();
        this.ringMeshes = [];
        this.labelSprite = null;
        this.infoSprite = null;
        this.meteorParticles = null;
        this.meteorVelocities = [];
        this.showMeteors = false;

        this.trailLine = null;
        this.trailPositions = [];
        this.showTrails = false;

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
        } else if (texturePath && this.data.name === 'Earth') {
            // Planets and Moons
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
                (material as THREE.MeshStandardMaterial).roughness = 1;
                (material as THREE.MeshStandardMaterial).metalness = 0;
            }
        } else {
            material = new THREE.MeshStandardMaterial({
                color: this.data.color,
                roughness: 0.8,
                metalness: 0.1
            });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        if (this.data.name !== 'Sun') {
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
        }
        this.tiltGroup.add(this.mesh);

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
            this.cloudMesh.castShadow = true;
            this.cloudMesh.receiveShadow = true;
            this.tiltGroup.add(this.cloudMesh);

            // 3. Atmosphere Glow (Fresnel)
            const atmosphereGeometry = new THREE.SphereGeometry(this.data.radius * 1.025, 64, 64);
            const atmosphereMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    c: { value: 0.3 },
                    p: { value: 5 },
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
            this.tiltGroup.add(this.atmosphereMesh);

            // 4. Meteor Shower
            this.createMeteors();
        }

        // Create Orbit Line
        this.createOrbit();

        // Create Trail
        this.createTrail();

        // Create Rings
        if ('rings' in this.data && this.data.rings) {
            this.createRings();
        }

        // Create Labels
        this.createLabel();
        this.createInfoLabel();

        // Create Moons
        if ('moons' in this.data && this.data.moons) {
            this.data.moons.forEach(moonData => {
                const moon = new CelestialBody(moonData, this.orbitGroup);
                this.moons.push(moon);
            });
        }
    }

    createLabel() {
        if (this.data.name === 'Sun') return;

        const sprite = createSpriteLabel(this.data.name);
        if (!sprite) return;

        // Scale label size based on planet radius to be visible
        // Base scale + offset based on radius
        const labelScale = Math.max(this.data.radius * 3, 5);
        sprite.scale.set(labelScale * 4, labelScale, 1);

        // Position above the planet
        sprite.position.y = this.data.radius + labelScale / 2 + 1;

        this.orbitGroup.add(sprite);
        this.labelSprite = sprite;
    }

    createInfoLabel() {
        if (this.data.name === 'Sun') return;

        const speedMultiplier = 0.5;
        const speed = this.data.period === 0 ? 0 : (1 / this.data.period) * speedMultiplier;
        const speedText = speed.toFixed(2) + ' km/s'; // Dummy formatting, representing speed
        const distText = this.data.distance + ' Mkm'; // Dummy formatting for distance

        const sprite = createInfoLabel(speedText, distText);
        if (!sprite) return;

        const labelScale = Math.max(this.data.radius * 3, 5);
        sprite.scale.set(labelScale * 4, labelScale, 1);

        // Position it below the planet name label
        sprite.position.y = this.data.radius + labelScale / 2 - 1.5;

        this.orbitGroup.add(sprite);
        this.infoSprite = sprite;
    }

    createRings() {
        if (!('rings' in this.data) || !this.data.rings) return;

        this.data.rings.forEach(ringData => {
            const geometry = new THREE.RingGeometry(ringData.innerRadius, ringData.outerRadius, 64);
            const material = new THREE.MeshBasicMaterial({
                color: ringData.color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: ringData.opacity !== undefined ? ringData.opacity : 0.8
            });
            const ringMesh = new THREE.Mesh(geometry, material);

            // Shadows for rings
            ringMesh.castShadow = true;
            ringMesh.receiveShadow = true;

            // Rings are typically aligned with the planet's equator
            // By default, RingGeometry is in the XY plane. We need it in the XZ plane for typical orbit.
            ringMesh.rotation.x = Math.PI / 2;

            // Since we applied tilt to tiltGroup, the rings will inherit this.
            // We just need to attach them to tiltGroup or mesh. Let's attach to tiltGroup.

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
        const posVec = new THREE.Vector3(x, y, z);
        const dir = posVec.clone().normalize().negate();

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

    updateMeteors(deltaTime: number) {
        if (!this.meteorParticles || !this.showMeteors) return;

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
            const nx = hx + vel.x * deltaTime * 10;
            const ny = hy + vel.y * deltaTime * 10;
            const nz = hz + vel.z * deltaTime * 10;

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
        this.parent.add(this.trailLine);
    }

    updateTrail() {
        if (!this.trailLine || !this.showTrails) return;

        const maxTrailLength = 100;
        const currentPos = this.orbitGroup.position.clone();

        // Only add a point if we've moved a certain distance to avoid too many points when slow
        if (this.trailPositions.length === 0 || currentPos.distanceTo(this.trailPositions[this.trailPositions.length - 1]) > 0.5) {
            this.trailPositions.push(currentPos);
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
        const material = new THREE.LineBasicMaterial({ color: this.data.color || 0x444444, transparent: true, opacity: 0.3 });

        this.orbitLine = new THREE.LineLoop(geometry, material);

        this.parent.add(this.orbitLine);
    }

    update(deltaTime: number) {
        // Update position
        const speedMultiplier = 0.5;
        const speed = this.data.period === 0 ? 0 : (1 / this.data.period) * speedMultiplier;

        this.angle += speed * deltaTime;

        const x = Math.cos(this.angle) * this.data.distance;
        const z = Math.sin(this.angle) * this.data.distance;

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

        // Rotate Clouds independently
        if (this.cloudMesh) {
            this.cloudMesh.rotation.y += 0.55 * deltaTime; // Slightly faster than surface
        }

        // Update Shader Time
        if (this.shaderMaterial) {
            this.shaderMaterial.uniforms.time.value += deltaTime;
        }

        if (this.infoSprite && this.infoSprite.visible) {
            // Rate limit updates to ~4 times per second to prevent severe performance drop
            if (!this.lastUpdate || performance.now() - this.lastUpdate > 250) {
                // Recompute stats
                const speedText = speed.toFixed(2) + ' km/s';
                // Current actual distance from center (Sun/parent)
                const currentDist = this.orbitGroup.position.length();
                const distText = currentDist.toFixed(1) + ' Mkm';

                updateInfoLabel(this.infoSprite, speedText, distText);
                this.lastUpdate = performance.now();
            }
        }

        this.updateMeteors(deltaTime);
        this.updateTrail();

        // Update moons
        this.moons.forEach(moon => moon.update(deltaTime));
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
        this.moons.forEach(moon => moon.toggleOrbit(visible));
    }

    toggleMoons(visible: boolean) {
        this.moons.forEach(moon => {
            if (moon.mesh) moon.mesh.visible = visible;
            if (moon.orbitLine) moon.orbitLine.visible = visible;
            if (moon.labelSprite) moon.labelSprite.visible = visible;
            moon.toggleMoons(visible);
        });
    }

    toggleLabels(visible: boolean) {
        if (this.labelSprite) {
            this.labelSprite.visible = visible;
        }
        this.moons.forEach(moon => moon.toggleLabels(visible));
    }

    toggleInfo(visible: boolean) {
        if (this.infoSprite) {
            this.infoSprite.visible = visible;
        }
        this.moons.forEach(moon => moon.toggleInfo(visible));
    }
}
