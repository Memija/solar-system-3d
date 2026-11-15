import { describe, it, expect, beforeEach } from 'vitest';
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
            description: 'A test spacecraft'
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
            speed: 2
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
            launchDate: '2050-01-01'
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
            endDate: '2020-01-01'
        };

        const spacecraft = new Spacecraft(mockData, parentGroup);

        // Active
        spacecraft.update(1, 0, new Date('2019-01-01'));
        expect(spacecraft.isActive).toBe(true);

        // Inactive
        spacecraft.update(1, 0, new Date('2021-01-01'));
        expect(spacecraft.isActive).toBe(false);
    });

    it('should pulse beacon when active and update is called', () => {
        const mockData: SpacecraftData = {
            name: 'BeaconCraft',
            distance: 10,
            period: 1,
            color: 0xffffff,
            description: 'Beacon test'
        };

        const spacecraft = new Spacecraft(mockData, parentGroup);
        spacecraft.update(0.016, 0, new Date(), 0.016);
        const beacon = spacecraft.mesh.children.find(c => (c as any).isMesh && ((c as any).material as any)?.transparent);
        expect(beacon).toBeDefined();
        expect(beacon?.visible).toBe(true);
    });

    it('keeps lazy-built spacecraft geometry centered at local origin even when parent planet is offset in world space', () => {
        parentGroup.position.set(130, 0, -95);
        parentGroup.updateMatrixWorld(true);

        const issData: SpacecraftData = {
            name: 'ISS (International Space Station)',
            targetBody: 'Earth',
            distance: 2.5,
            period: 0.05,
            color: 0xffffff
        };

        const iss = new Spacecraft(issData, parentGroup, { lazyModel: true });
        iss.update(0, 12.5, new Date('2026-06-01T00:00:00Z'), 0);
        parentGroup.updateMatrixWorld(true);

        iss.ensureModelBuilt();

        const bodyMesh = iss.mesh.children.find(
            c => (c as THREE.Mesh).isMesh && ((c as THREE.Mesh).material as THREE.MeshStandardMaterial)?.isMeshStandardMaterial
        ) as THREE.Mesh | undefined;
        expect(bodyMesh).toBeDefined();
        bodyMesh!.geometry.computeBoundingSphere();
        expect(bodyMesh!.geometry.boundingSphere!.center.length()).toBeLessThan(0.25);

        const bodyMat = bodyMesh!.material as THREE.MeshStandardMaterial;
        expect(bodyMat.emissiveIntensity).toBeGreaterThan(0.2);
        expect(bodyMat.metalness).toBeLessThan(0.7);
    });

    it('shows distant markerSprite, Voyager escapeLine, and paused/inactive beacon while cross-fading marker up close', () => {
        const voyagerData: SpacecraftData = {
            name: 'Voyager 1',
            launchDate: '1977-09-05T12:56:00Z',
            distance: 2.0,
            period: 0,
            color: 0xaaaaaa,
            escaping: true,
            speed: 1.5
        };

        const voyager = new Spacecraft(voyagerData, parentGroup, { lazyModel: true });
        voyager.update(0, 100, new Date('2026-06-01T00:00:00Z'), 0);
        parentGroup.updateMatrixWorld(true);

        expect(voyager.orbitLine).toBeNull();
        expect(voyager.escapeLine).not.toBeNull();

        // Overview camera far from Voyager: markerSprite & escapeLine visible
        voyager.updateLOD(new THREE.Vector3(0, 100, 400), false);
        expect(voyager.markerSprite?.visible).toBe(true);
        expect(voyager.escapeLine?.visible).toBe(true);

        // Close-up focused camera: 3D model built & visible, markerSprite cross-fades out, beacon stays visible while paused
        const worldPos = new THREE.Vector3();
        voyager.orbitGroup.getWorldPosition(worldPos);
        const closeCam = worldPos.clone().add(new THREE.Vector3(0, 0, voyager.getVisualRadius() * 4.5));
        voyager.updateLOD(closeCam, true);
        voyager.update(0, 100, new Date('2026-06-01T00:00:00Z'), 0); // Paused (deltaTime = 0, rawDelta = 0)

        expect(voyager.mesh.visible).toBe(true);
        expect(voyager.markerSprite?.visible).toBe(false);
        const beacon = voyager.mesh.children.find(c => (c as any).isMesh && ((c as any).material as any)?.transparent);
        expect(beacon?.visible).toBe(true);

        // Toggling spacecraft layer off hides mesh, marker, beacon, and escape trajectory cleanly
        voyager.setSpacecraftVisible(false);
        expect(voyager.mesh.visible).toBe(false);
        expect(voyager.markerSprite?.visible).toBe(false);
        expect(voyager.escapeLine?.visible).toBe(false);
        expect(beacon?.visible).toBe(false);
    });
});
