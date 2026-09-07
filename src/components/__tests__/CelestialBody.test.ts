import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CelestialBody } from '../CelestialBody';
import { CelestialBodyData, MoonData } from '../SolarSystemData';

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
         const moon = new CelestialBody(mockMoonData, earth.orbitGroup);

         earth.moons.push(moon);

         expect(earth.moons).toHaveLength(1);
         expect(moon.parent).toBe(earth.orbitGroup);
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
});
