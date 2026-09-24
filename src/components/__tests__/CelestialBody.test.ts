import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CelestialBody } from '../CelestialBody';
import { CelestialBodyData, MoonData, SolarSystemData } from '../SolarSystemData';

vi.mock('../SunShader', () => ({
    vertexShader: 'mockVertexShader',
    fragmentShader: 'mockFragmentShader'
}));

describe('CelestialBody', () => {
    const mockPlanetData: CelestialBodyData = {
        name: 'Earth',
        radius: 1,
        distance: 1,
        period: 1,
        color: 0x0000ff,
        texture: 'earth.jpg',
        description: 'Mock Earth',
        imageUrl: 'earth.jpg',
        axialTilt: 23.5
    };

    const mockMoonData: MoonData = {
        name: 'Moon',
        radius: 0.27,
        distance: 0.0025,
        period: 0.074,
        color: 0x888888,
        description: 'Mock Moon'
    };

    let parentGroup: THREE.Group;
    let clock: THREE.Clock;

    beforeEach(() => {
        parentGroup = new THREE.Group();
        clock = new THREE.Clock();
        clock.start();
        vi.clearAllMocks();
    });

    it('should initialize a planet correctly', () => {
        const body = new CelestialBody(mockPlanetData, parentGroup);

        expect(body.data).toBe(mockPlanetData);
        expect(body.parent).toBe(parentGroup);
        expect(body.orbitGroup).toBeInstanceOf(THREE.Group);
        expect(body.tiltGroup).toBeInstanceOf(THREE.Group);
        expect(body.mesh).toBeInstanceOf(THREE.Mesh);
        expect(body.orbitLine).toBeInstanceOf(THREE.LineLoop);
        expect(body.moons).toHaveLength(0);

        // Check tilt logic (Tilt is on the Z axis)
        expect(body.tiltGroup.rotation.z).toBeCloseTo((23.5 * Math.PI) / 180);
    });

    it('should update orbit correctly', () => {
        const body = new CelestialBody(mockPlanetData, parentGroup);
        const initialAngle = body.angle;

        // Simulate 1 year of time
        body.update(clock.getElapsedTime() + 365.25 * 24 * 60 * 60);

        // The angle should have advanced
        expect(body.angle).not.toBe(initialAngle);
    });

    it('should add moons correctly', () => {
         const earth = new CelestialBody(mockPlanetData, parentGroup);
         const moon = new CelestialBody(mockMoonData, earth.orbitGroup, true);

         earth.moons.push(moon);

         expect(earth.moons).toHaveLength(1);
         expect(moon.parent).toBe(earth.orbitGroup);
         expect(earth.mesh?.castShadow).toBe(true);
         expect(earth.mesh?.receiveShadow).toBe(true);
         expect(earth.cloudMesh?.receiveShadow).toBe(true);
         expect(moon.mesh?.castShadow).toBe(true);
         expect(moon.mesh?.receiveShadow).toBe(true);
    });

    it('should initialize Earth with polar auroras, velocity vector, and dynamic clouds', () => {
        const earth = new CelestialBody(mockPlanetData, parentGroup);

        expect(earth.auroraMeshNorth).toBeDefined();
        expect(earth.auroraMeshSouth).toBeDefined();
        expect(earth.auroraMaterial).toBeDefined();
        expect(earth.velocityVectorGroup).toBeDefined();
        expect(earth.cloudMesh).toBeDefined();

        const initialCloudRotation = earth.cloudMesh!.rotation.y;
        const initialAuroraTime = earth.auroraMaterial!.uniforms.time.value;

        // Update in real-time mode (deltaTime ~ 0, rawDelta = 0.016)
        earth.update(0.000001, 0, 0.016);

        // Clouds should have drifted and aurora shader time advanced
        expect(earth.cloudMesh!.rotation.y).toBeGreaterThan(initialCloudRotation);
        expect(earth.auroraMaterial!.uniforms.time.value).toBeGreaterThan(initialAuroraTime);
    });

    it('should initialize holographic velocity vectors for other planets and moons', () => {
        const mockMarsData: CelestialBodyData = {
            name: 'Mars',
            radius: 0.53,
            distance: 1.52,
            period: 1.88,
            color: 0xff3300,
            texture: 'mars.jpg',
            description: 'Mock Mars',
            imageUrl: 'mars.jpg'
        };
        const mars = new CelestialBody(mockMarsData, parentGroup);
        expect(mars.velocityVectorGroup).toBeDefined();
        expect(mars.getOrbitalSpeed()).toBe(24.1);

        const mockJupiterData: CelestialBodyData = {
            name: 'Jupiter',
            radius: 11.2,
            distance: 5.2,
            period: 11.86,
            color: 0xcc9966,
            texture: 'jupiter.jpg',
            description: 'Mock Jupiter',
            imageUrl: 'jupiter.jpg'
        };
        const jupiter = new CelestialBody(mockJupiterData, parentGroup);
        expect(jupiter.velocityVectorGroup).toBeDefined();
        expect(jupiter.getOrbitalSpeed()).toBe(13.1);

        const moon = new CelestialBody(mockMoonData, mars.orbitGroup);
        expect(moon.velocityVectorGroup).toBeDefined();
        expect(moon.getOrbitalSpeed()).toBe(1.0);
    });

    it('should scale velocity vector marker proportionally for small dwarf planets like Ceres', () => {
        const mockCeresData: CelestialBodyData = {
            name: 'Ceres',
            radius: 0.14,
            distance: 2.77,
            period: 4.6,
            color: 0x888888,
            texture: 'ceres.jpg',
            description: 'Mock Ceres',
            imageUrl: 'ceres.jpg'
        };
        const ceres = new CelestialBody(mockCeresData, parentGroup);
        expect(ceres.velocityVectorGroup).toBeDefined();
        expect(ceres.getVelocityBodyScale()).toBeCloseTo(0.14);
        // The marker scale must not exceed the planet's diameter (2 * radius = 0.28)
        expect(ceres.getVelocityBodyScale()).toBeLessThanOrEqual(mockCeresData.radius * 2);
    });

    it('should initialize Haumea with an elongated triaxial ellipsoidal shape', () => {
        const mockHaumeaData: CelestialBodyData = {
            name: 'Haumea',
            radius: 0.3,
            distance: 43.3,
            period: 284,
            color: 0xaaaaaa,
            texture: 'haumea.jpg',
            description: 'Mock Haumea',
            imageUrl: 'haumea.jpg'
        };
        const haumea = new CelestialBody(mockHaumeaData, parentGroup);
        expect(haumea.mesh).toBeDefined();
        // Haumea's mesh should be an elongated ellipsoid (X > Z > Y)
        expect(haumea.mesh!.scale.x).toBeCloseTo(1.4);
        expect(haumea.mesh!.scale.y).toBeCloseTo(0.7);
        expect(haumea.mesh!.scale.z).toBeCloseTo(1.05);
        expect(haumea.mesh!.scale.x).toBeGreaterThan(haumea.mesh!.scale.z);
        expect(haumea.mesh!.scale.z).toBeGreaterThan(haumea.mesh!.scale.y);
    });

    it('should initialize Iapetus with an equatorial walnut ridge and oblate shape', () => {
        const mockIapetusData: MoonData = {
            name: 'Iapetus',
            radius: 0.25,
            distance: 45,
            period: 0.217,
            color: 0xaaaaaa,
            description: 'Mock Iapetus'
        };
        const iapetus = new CelestialBody(mockIapetusData, parentGroup, true);
        expect(iapetus.mesh).toBeDefined();

        const geom = iapetus.mesh!.geometry as THREE.BufferGeometry;
        const pos = geom.attributes.position;
        expect(pos).toBeDefined();

        // Check that equatorial vertices have been displaced outward by the ridge
        let foundEquatorialRidge = false;
        let foundPolarFlattening = false;
        const v = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            const r = v.length();
            const lat = Math.asin(v.y / r);

            // Exact equator vertex should be displaced above base radius (0.25)
            if (Math.abs(lat) < 0.02 && r > 0.25 * 1.04) {
                foundEquatorialRidge = true;
            }
            // Pole vertex should be flattened below base radius (0.25)
            if (Math.abs(lat) > 1.4 && r < 0.25 * 0.98) {
                foundPolarFlattening = true;
            }
        }

        expect(foundEquatorialRidge).toBe(true);
        expect(foundPolarFlattening).toBe(true);
    });

    it('should correctly propagate retrograde orbit for Triton', () => {
        const neptuneData = SolarSystemData.find(b => b.name === 'Neptune');
        expect(neptuneData).toBeDefined();
        const tritonData = neptuneData?.moons?.find(m => m.name === 'Triton');
        expect(tritonData).toBeDefined();
        expect(tritonData?.retrograde).toBe(true);
        expect(tritonData?.period).toBeCloseTo(0.0161);
        expect(tritonData?.distanceAU).toBeCloseTo(0.00237);

        const neptune = new CelestialBody(neptuneData!, parentGroup);
        const triton = new CelestialBody(tritonData!, neptune.orbitGroup, true);

        // Initial angle
        triton.angle = Math.PI;
        const initialAngle = triton.angle;

        // Advance simulation time
        triton.update(0.001);

        // For retrograde orbit, angular velocity is negative (angle decreases)
        expect(triton.angle).toBeLessThan(initialAngle);

        // Orbital speed should match known speed
        expect(triton.getOrbitalSpeed()).toBe(4.4);
    });

    it('should correctly propagate retrograde orbit for Charon around Pluto', () => {
        const plutoData = SolarSystemData.find(b => b.name === 'Pluto');
        expect(plutoData).toBeDefined();
        const charonData = plutoData?.moons?.find(m => m.name === 'Charon');
        expect(charonData).toBeDefined();
        expect(charonData?.retrograde).toBe(true);
        expect(charonData?.period).toBeCloseTo(0.0175);
        expect(charonData?.distanceAU).toBeCloseTo(0.000131);
        expect(charonData!.distance).toBeGreaterThan(plutoData!.radius);

        const pluto = new CelestialBody(plutoData!, parentGroup);
        const charon = new CelestialBody(charonData!, pluto.orbitGroup, true);

        // Initial angle
        charon.angle = Math.PI;
        const initialAngle = charon.angle;

        // Advance simulation time
        charon.update(0.001);

        // For retrograde orbit, angular velocity is negative (angle decreases)
        expect(charon.angle).toBeLessThan(initialAngle);

        // Orbital speed should match known speed (0.2 km/s)
        expect(charon.getOrbitalSpeed()).toBe(0.2);
    });
});
