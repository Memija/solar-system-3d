import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { SceneManager } from '../SceneManager';

vi.mock('../CelestialBody', () => {
    return {
        CelestialBody: class {
            data = { name: 'MockBody' };
            parent = new THREE.Group();
            orbitGroup = new THREE.Group();
            tiltGroup = new THREE.Group();
            mesh = new THREE.Mesh();
            orbitLine = new THREE.LineLoop();
            moons = [];
            update = vi.fn();
            angle = 0;
            trailLine = null;
            trailPositions = [];
            meteorParticles = null;
            meteorVelocities = [];
            showMeteors = false;
            showTrails = false;
        }
    }
});

vi.mock('../Spacecraft', () => {
    return {
        Spacecraft: class {
            mesh = new THREE.Mesh();
            update = vi.fn();
        }
    }
});

vi.mock('../Comet', () => {
    return {
        Comet: class {
            orbitGroup = new THREE.Group();
            update = vi.fn();
        }
    }
});

vi.mock('../ConstellationManager', () => {
    return {
        ConstellationManager: class {
            createConstellations = vi.fn();
            update = vi.fn();
            dispose = vi.fn();
        }
    }
});

describe('SceneManager', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        vi.clearAllMocks();
    });

    it('should initialize correctly', () => {
        const manager = new SceneManager(container);

        expect(manager.scene).toBeDefined();
        expect(manager.camera).toBeDefined();
        expect(manager.renderer).toBeDefined();

        // Should have created celestial bodies
        expect(manager.planets.length).toBeGreaterThan(0);
        expect(manager.comets.length).toBeGreaterThan(0);
        expect(manager.spacecrafts.length).toBeGreaterThan(0);

        // Check date initialization
        expect(manager.simDate).toBeInstanceOf(Date);
    });

    it('should update simulation date correctly in update()', () => {
        const manager = new SceneManager(container);
        const initialDate = new Date(manager.simDate);

        // Fast forward by simulating an update with default timeScale (1)
        manager.update();

        expect(manager.simDate.getTime()).toBeGreaterThanOrEqual(initialDate.getTime());
    });

    it('should focus on a body', () => {
        const manager = new SceneManager(container);
        // Since we mock CelestialBody in this file to just use data={name:'MockBody'},
        // the default initialization adds "MockBody" objects to `manager.planets`.
        // Let's modify one of them so focusOnBody finds it.
        manager.planets[0].data.name = 'Earth';
        manager.planets[0].orbitGroup = { position: new THREE.Vector3() } as any;

        manager.focusOnBody('Earth');

        expect(manager.focusedBody).toBeDefined();
        expect(manager.focusedBody?.data.name).toBe('Earth');
    });
});
