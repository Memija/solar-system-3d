import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Spacecraft } from '../Spacecraft';
import { SpacecraftData } from '../SolarSystemData';

describe('Spacecraft', () => {
    let parentGroup: THREE.Group;

    beforeEach(() => {
        parentGroup = new THREE.Group();
    });

    it('should initialize a spacecraft correctly', () => {
        const mockData: SpacecraftData = {
            name: 'TestCraft',
            distance: 10,
            period: 1,
            color: 0xffffff,
            description: 'A test spacecraft',
            type: 'Satellite'
        };

        const spacecraft = new Spacecraft(mockData, parentGroup);

        expect(spacecraft.data).toBe(mockData);
        expect(spacecraft.baseGroup.parent).toBe(parentGroup);
        expect(spacecraft.orbitGroup.parent).toBe(spacecraft.baseGroup);
        expect(spacecraft.mesh.parent).toBe(spacecraft.orbitGroup);
        expect(spacecraft.orbitLine).toBeDefined();
    });

    it('should handle escaping spacecraft (like Voyager)', () => {
        const mockData: SpacecraftData = {
            name: 'Voyager',
            distance: 10,
            period: 1,
            color: 0xffffff,
            description: 'Escaping',
            escaping: true,
            speed: 2,
            type: 'Probe'
        };

        const spacecraft = new Spacecraft(mockData, parentGroup);

        // Should not create orbit line for escaping
        expect(spacecraft.orbitLine).toBeNull();

        // Update should move it outwards
        const initialX = spacecraft.orbitGroup.position.x;
        spacecraft.update(1);

        expect(spacecraft.orbitGroup.position.x).toBeGreaterThan(initialX);
    });

    it('should respect launch dates', () => {
        const mockData: SpacecraftData = {
            name: 'FutureCraft',
            distance: 10,
            period: 1,
            color: 0xffffff,
            description: 'Future',
            launchDate: '2050-01-01',
            type: 'Satellite'
        };

        const spacecraft = new Spacecraft(mockData, parentGroup);

        // Before launch
        spacecraft.update(1, 0, new Date('2020-01-01'));
        expect(spacecraft.baseGroup.visible).toBe(false);

        // After launch
        spacecraft.update(1, 0, new Date('2051-01-01'));
        expect(spacecraft.baseGroup.visible).toBe(true);
    });

    it('should change color when inactive (past end date)', () => {
        const mockData: SpacecraftData = {
            name: 'PastCraft',
            distance: 10,
            period: 1,
            color: 0xffffff,
            description: 'Past',
            endDate: '2020-01-01',
            type: 'Satellite'
        };

        const spacecraft = new Spacecraft(mockData, parentGroup);

        // Active
        spacecraft.update(1, 0, new Date('2019-01-01'));
        expect(spacecraft.isActive).toBe(true);

        // Inactive
        spacecraft.update(1, 0, new Date('2021-01-01'));
        expect(spacecraft.isActive).toBe(false);
    });
});
