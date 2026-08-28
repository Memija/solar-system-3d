import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Comet } from '../Comet';
import { CometData } from '../SolarSystemData';

describe('Comet', () => {
    let parentGroup: THREE.Group;

    beforeEach(() => {
        parentGroup = new THREE.Group();
    });

    it('should initialize a comet correctly', () => {
        const mockData: CometData = {
            name: 'Halley',
            distance: 10,
            eccentricity: 0.9,
            period: 75,
            color: 0xcccccc,
            description: 'Famous comet',
            semiMajorAxis: 10
        };

        const comet = new Comet(mockData, parentGroup);

        expect(comet.data).toBe(mockData);
        expect(comet.orbitGroup).toBeInstanceOf(THREE.Group);
        expect(comet.mesh).toBeInstanceOf(THREE.Mesh);
        expect(comet.tailParticles).toBeInstanceOf(THREE.Points);
        expect(comet.orbitLine).toBeInstanceOf(THREE.LineLoop);
        expect(comet.orbitGroup.parent).toBe(comet.baseGroup);
    });

    it('should update orbit correctly and update sun direction', () => {
        const mockData: CometData = {
            name: 'Halley',
            distance: 10,
            eccentricity: 0.9,
            period: 75,
            color: 0xcccccc,
            description: 'Famous comet',
            semiMajorAxis: 10
        };

        const comet = new Comet(mockData, parentGroup);

        // Ensure tail particles exist and material is valid
        const mat = comet.tailParticles!.material as THREE.ShaderMaterial;
        const initialSunDir = mat.uniforms.sunDirection.value.clone();

        // Update some time
        comet.update(1);

        // Sun direction should have been updated
        expect(mat.uniforms.sunDirection.value.equals(initialSunDir)).toBe(false);
    });

    it('should update tail visibility based on distance to sun', () => {
        const mockData: CometData = {
            name: 'Halley',
            distance: 10,
            eccentricity: 0.9,
            period: 10,
            color: 0xcccccc,
            description: 'Famous comet',
            semiMajorAxis: 10
        };

        const comet = new Comet(mockData, parentGroup);
        const mat = comet.tailParticles!.material as THREE.ShaderMaterial;

        comet.update(0); // Near perihelion theoretically
        const vis1 = mat.uniforms.tailVisibility.value;

        // Fast forward 5 time units
        comet.update(5);
        const vis2 = mat.uniforms.tailVisibility.value;

        // Visibilities should differ based on distance
        expect(vis1).not.toBe(vis2);
    });

    it('should rebuild orbit with realistic distances', () => {
        const mockData: CometData = {
            name: 'Halley',
            distance: 10,
            distanceAU: 17,
            eccentricity: 0.9,
            period: 75,
            color: 0xcccccc,
            description: 'Famous comet',
            semiMajorAxis: 10
        };

        const comet = new Comet(mockData, parentGroup);

        const removeSpy = vi.spyOn(comet.baseGroup, 'remove');

        comet.rebuildOrbit(true);

        expect(comet.realisticDistances).toBe(true);
        expect(removeSpy).toHaveBeenCalled();
        expect(comet.orbitLine).toBeDefined(); // Should have recreated it
    });
});
