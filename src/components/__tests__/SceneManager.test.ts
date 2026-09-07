import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { SceneManager } from '../SceneManager';

vi.mock('../CelestialBody', () => {
    return {
        CelestialBody: class {
            data: any = { name: 'MockBody', radius: 2.5 };
            parent = new THREE.Group();
            orbitGroup = new THREE.Group();
            tiltGroup = new THREE.Group();
            mesh = new THREE.Mesh();
            orbitLine = new THREE.LineLoop();
            moons: any[] = [];
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

    it('should initialize with realistic simulation speed (1 day/sec)', () => {
        const manager = new SceneManager(container);
        expect(manager.timeScale).toBeCloseTo(SceneManager.REALISTIC_TIME_SCALE, 5);
        expect(SceneManager.timeScaleToDaysPerSecond(manager.timeScale)).toBeCloseTo(1.0, 3);
    });

    it('should correctly convert between timeScale and days per second', () => {
        const scale1Day = SceneManager.daysPerSecondToTimeScale(1);
        expect(scale1Day).toBeCloseTo(SceneManager.REALISTIC_TIME_SCALE, 5);

        const scale7Days = SceneManager.daysPerSecondToTimeScale(7);
        expect(SceneManager.timeScaleToDaysPerSecond(scale7Days)).toBeCloseTo(7.0, 3);
    });

    it('should format time speed with human-readable astronomical units', () => {
        const manager = new SceneManager(container);
        expect(manager.getFormattedTimeSpeed(0)).toBe('Paused');
        expect(manager.getFormattedTimeSpeed(SceneManager.SPEED_PRESETS.realTime)).toBe('Real-Time (1:1)');
        expect(manager.getFormattedTimeSpeed(SceneManager.SPEED_PRESETS.oneHour)).toBe('1.0 hr/s');
        expect(manager.getFormattedTimeSpeed(SceneManager.SPEED_PRESETS.oneDay)).toBe('1.0 day/s');
        expect(manager.getFormattedTimeSpeed(SceneManager.SPEED_PRESETS.oneWeek)).toBe('1.0 wk/s');
        expect(manager.getFormattedTimeSpeed(SceneManager.SPEED_PRESETS.oneMonth)).toBe('1.0 mo/s');
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

    describe('Zoom Limits', () => {
        it('should initialize sensible zoom limits in overview mode', () => {
            const manager = new SceneManager(container);

            // In overview mode, minDistance prevents clipping into the Sun (radius 25)
            expect(manager.controls.minDistance).toBeGreaterThanOrEqual(30);
            // Max distance prevents frustum clipping and zooming out to infinite black void
            expect(manager.controls.maxDistance).toBe(5000);
        });

        it('should enforce safe minDistance and maxDistance when focused on Earth', () => {
            const manager = new SceneManager(container);
            manager.planets[0].data.name = 'Earth';
            manager.planets[0].data.radius = 2.5;
            manager.planets[0].orbitGroup = { position: new THREE.Vector3() } as any;

            manager.focusOnBody('Earth', false);

            // minDistance must be strictly greater than visual radius + camera near plane to prevent clipping
            expect(manager.controls.minDistance).toBeGreaterThan(2.5);
            expect(manager.controls.minDistance).toBeCloseTo(2.5 + Math.max(2.5 * 0.25, 0.4), 2);
            // maxDistance for major planet allows viewing moons and orbit without getting lost
            expect(manager.controls.maxDistance).toBe(1800);
        });

        it('should enforce safe minDistance and maxDistance when focused on the Sun', () => {
            const manager = new SceneManager(container);
            manager.planets[0].data.name = 'Sun';
            manager.planets[0].data.radius = 25;
            manager.planets[0].orbitGroup = { position: new THREE.Vector3() } as any;

            manager.focusOnBody('Sun', false);

            // minDistance prevents entering the Sun's core
            expect(manager.controls.minDistance).toBeGreaterThan(25);
            // Sun is at system center, so maxDistance allows full solar system overview
            expect(manager.controls.maxDistance).toBe(5000);
        });

        it('should restore overview limits when detaching camera', () => {
            const manager = new SceneManager(container);
            manager.planets[0].data.name = 'Earth';
            manager.planets[0].data.radius = 2.5;

            manager.focusOnBody('Earth', false);
            expect(manager.focusedBody).not.toBeNull();

            manager.detachCamera();
            expect(manager.focusedBody).toBeNull();
            expect(manager.controls.maxDistance).toBe(5000);
            expect(manager.controls.minDistance).toBeGreaterThanOrEqual(30);
        });

        it('should adjust zoom limits when switching to realistic distances mode', () => {
            const manager = new SceneManager(container);
            expect(manager.controls.maxDistance).toBe(5000);

            manager.toggleRealisticDistances(true);
            expect(manager.controls.maxDistance).toBe(25000);

            manager.toggleRealisticDistances(false);
            expect(manager.controls.maxDistance).toBe(5000);
        });

        it('should configure appropriate zoom limits for stars and constellations', () => {
            const manager = new SceneManager(container);
            const mockStarMesh = new THREE.Mesh();
            mockStarMesh.position.set(0, 0, 48000);

            manager.focusOnStar(mockStarMesh);
            expect(manager.controls.minDistance).toBe(200);
            expect(manager.controls.maxDistance).toBe(20000);
        });
    });
});
