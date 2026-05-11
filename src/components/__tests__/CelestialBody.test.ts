import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CelestialBody } from '../CelestialBody';
import { CelestialBodyData, MoonData } from '../SolarSystemData';

vi.mock('../SunShader', () => ({
    vertexShader: 'mockVertexShader',
    fragmentShader: 'mockFragmentShader'
}));

vi.mock('../LabelUtils', () => ({
    createSpriteLabel: vi.fn(() => new THREE.Sprite()),
    createInfoLabel: vi.fn(() => new THREE.Sprite())
}));

describe('CelestialBody', () => {
    const mockPlanetData: CelestialBodyData = {
        name: 'Earth',
        radius: 1,
        distance: 1,
        period: 1,
        color: 0x0000ff,
        textureUrl: 'earth.jpg',
        description: 'Mock Earth',
        axialTilt: 23.5,
        type: 'Planet'
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
        const body = new CelestialBody(mockPlanetData, parentGroup, false);

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
        const body = new CelestialBody(mockPlanetData, parentGroup, false);
        const initialAngle = body.angle;

        // Simulate 1 year of time
        body.update(clock.getElapsedTime() + 365.25 * 24 * 60 * 60);

        // The angle should have advanced
        expect(body.angle).not.toBe(initialAngle);
    });

    it('should add moons correctly', () => {
         const earth = new CelestialBody(mockPlanetData, parentGroup, false);
         const moon = new CelestialBody(mockMoonData, earth.orbitGroup, true);

         earth.moons.push(moon);

         expect(earth.moons).toHaveLength(1);
         expect(moon.parent).toBe(earth.orbitGroup);
    });
});
