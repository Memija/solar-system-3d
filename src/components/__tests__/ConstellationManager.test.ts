import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { ConstellationManager } from '../ConstellationManager';

vi.mock('../ConstellationData.js', () => {
    return {
        MajorConstellations: [
            {
                name: 'TestConstellation',
                color: 0xff0000,
                stars: [
                    { ra: 0, dec: 0 },
                    { ra: 12, dec: 0 }
                ],
                connections: [[0, 1]]
            }
        ]
    };
});

describe('ConstellationManager', () => {
    let scene: THREE.Scene;

    beforeEach(() => {
        scene = new THREE.Scene();
    });

    it('should create constellations correctly', () => {
        const manager = new ConstellationManager(scene);
        manager.createConstellations();

        expect(manager.constellationMeshes.length).toBe(1);
        expect(manager.interactableObjects.length).toBe(2);

        const group = manager.constellationMeshes[0];
        expect(group.userData.name).toBe('TestConstellation');
        expect(scene.children).toContain(group);
    });

    it('should get constellation center', () => {
        const manager = new ConstellationManager(scene);
        manager.createConstellations();

        const center = manager.getConstellationCenter('TestConstellation');
        expect(center).toBeDefined();

        // Stars are at opposite sides, so center should be around 0,0,0
        expect(center?.x).toBeCloseTo(0, -1);
        expect(center?.y).toBeCloseTo(0, -1);
        expect(center?.z).toBeCloseTo(0, -1);
    });

    it('should return null for non-existent constellation', () => {
        const manager = new ConstellationManager(scene);
        manager.createConstellations();

        const center = manager.getConstellationCenter('NonExistent');
        expect(center).toBeNull();
    });

    it('should return interactable objects', () => {
        const manager = new ConstellationManager(scene);
        manager.createConstellations();

        const interactables = manager.getInteractableObjects();
        expect(interactables.length).toBe(2);
        expect(interactables[0].userData.type).toBe('ConstellationStar');
    });
});
