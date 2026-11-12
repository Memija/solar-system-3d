import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { SceneManager } from '../SceneManager';
import { PreferencesManager } from '../PreferencesManager';

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
            constellationMeshes: any[] = [];
            isVisible: boolean = true;
            toggleVisibility = vi.fn();
            createConstellations = vi.fn();
            update = vi.fn();
            dispose = vi.fn();
        }
    }
});

describe('SceneManager', () => {
    let container: HTMLElement;

    beforeEach(() => {
        PreferencesManager.reset();
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
        expect(manager.measureMode).toBe(false);
    });

    it('should update simulation date correctly in update()', () => {
        const manager = new SceneManager(container);
        const initialDate = new Date(manager.simDate);

        // Fast forward by simulating an update with default timeScale (1)
        manager.update();

        expect(manager.simDate.getTime()).toBeGreaterThanOrEqual(initialDate.getTime());
    });

    it('should initialize with real-time simulation speed (1:1) by default', () => {
        const manager = new SceneManager(container);
        expect(manager.timeScale).toBeCloseTo(SceneManager.SPEED_PRESETS.realTime, 10);
        expect(manager.timeScale).toBeCloseTo(SceneManager.DEFAULT_TIME_SCALE, 10);
        expect(manager.getFormattedTimeSpeed()).toBe('Real-Time (1:1)');
        expect(SceneManager.timeScaleToDaysPerSecond(manager.timeScale)).toBeCloseTo(1 / 86400, 8);
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

        it('should toggle bloom post-processing pass and update preferences', () => {
            const manager = new SceneManager(container);
            expect(manager.bloomPass).toBeDefined();

            manager.bloomPass.enabled = true;
            const res1 = manager.toggleBloom();
            expect(res1).toBe(false);
            expect(manager.bloomPass.enabled).toBe(false);

            const res2 = manager.toggleBloom();
            expect(res2).toBe(true);
            expect(manager.bloomPass.enabled).toBe(true);

            expect((manager as any).outputPass?.needsSwap).toBe(false);
            const pinnedReadBuffer = manager.composer.readBuffer;
            for (let i = 0; i < 6; i++) {
                (manager as any).renderDirty = true;
                manager.update();
                expect(manager.composer.readBuffer).toBe(pinnedReadBuffer);
            }
            manager.toggleBloom(false);
            expect(manager.bloomPass.enabled).toBe(false);
        });

        it('should configure appropriate zoom limits for stars and constellations', () => {
            const manager = new SceneManager(container);
            const mockStarMesh = new THREE.Mesh();
            mockStarMesh.position.set(0, 0, 48000);

            manager.focusOnStar(mockStarMesh);
            expect(manager.controls.minDistance).toBe(200);
            expect(manager.controls.maxDistance).toBe(20000);
            expect(manager.focusedStar).toBe(mockStarMesh);

            manager.cameraTransition = null;
            manager.updateZoomLimits();
            expect(manager.controls.maxDistance).toBe(20000);
            expect(manager.controls.minDistance).toBe(200);
        });

        it('should focus completely on constellation, initiate camera transition, and maintain zoom limits', () => {
            const manager = new SceneManager(container);

            const constellationGroup = new THREE.Group();
            constellationGroup.userData.name = 'Orion';

            const geom = new THREE.BufferGeometry();
            const positions = new Float32Array([
                1000, 2000, 48000,
                2000, 3000, 48000,
                1500, 1500, 48000
            ]);
            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const points = new THREE.Points(geom);
            constellationGroup.add(points);

            manager.constellationManager.constellationMeshes = [constellationGroup];

            manager.focusOnConstellation('Orion');

            expect(manager.focusedConstellation).toBe('Orion');
            expect(manager.cameraTransition).not.toBeNull();
            expect(manager.controls.maxDistance).toBeGreaterThanOrEqual(100000);

            manager.cameraTransition = null;
            manager.updateZoomLimits();
            expect(manager.controls.maxDistance).toBeGreaterThanOrEqual(100000);

            manager.detachCamera();
            expect(manager.focusedConstellation).toBeNull();
            expect(manager.controls.maxDistance).toBe(5000);
        });

        it('should correctly set and reset surfaceViewBody on setSurfaceView', () => {
            const manager = new SceneManager(container);
            manager.planets[0].data.name = 'Earth';
            manager.planets[0].mesh = new THREE.Mesh();

            // Succeeded surface view
            const result1 = manager.setSurfaceView('Earth');
            expect(result1).toBe(true);
            expect(manager.surfaceViewBody).toBe(manager.planets[0]);
            expect(manager.focusedBody).toBeNull();
            expect(manager.cameraTransition).toBeNull();

            // Non-existent target surface view
            const result2 = manager.setSurfaceView('UnknownBody');
            expect(result2).toBe(false);
            expect(manager.surfaceViewBody).toBeNull();
        });

        it('should synchronize AU and Mkm calculations and update measurement on target selection', () => {
            const manager = new SceneManager(container);
            manager.measureMode = true;
            manager.planets[0].data = { name: 'Earth', distance: 130, distanceAU: 1, eccentricity: 0.0167 } as any;
            manager.planets[1].data = { name: 'Mars', distance: 170, distanceAU: 1.524, eccentricity: 0.0934 } as any;

            // Select Target A
            manager.setMeasureTarget('Earth');
            expect(manager.measureTargetA).toBe(manager.planets[0]);
            expect(manager.measureTargetB).toBeNull();
            expect(manager.currentMeasureDistance).toBeNull();

            // Select Target B
            manager.setMeasureTarget('Mars');
            expect(manager.measureTargetA).toBe(manager.planets[0]);
            expect(manager.measureTargetB).toBe(manager.planets[1]);
            expect(manager.currentMeasureDistance).not.toBeNull();

            // Mathematical sync: distanceAU * 149.6 should match distanceMkm
            const auStr = manager.currentMeasureDistance!.distanceAU;
            const mkmStr = manager.currentMeasureDistance!.distanceMkm;
            const parsedAU = parseFloat(auStr);
            const parsedMkm = parseFloat(mkmStr);
            const expectedMkm = parseFloat((parsedAU * 149.6).toFixed(2));
            expect(parsedMkm).toBeCloseTo(expectedMkm, 2);

            // Selecting a third body should reset to new target A and clear measureLine/label/distance
            if (manager.planets[2]) {
                manager.planets[2].data = { name: 'Jupiter', distance: 240, distanceAU: 5.2, eccentricity: 0.0485 } as any;
                manager.setMeasureTarget('Jupiter');
                expect(manager.measureTargetA).toBe(manager.planets[2]);
                expect(manager.measureTargetB).toBeNull();
                expect(manager.currentMeasureDistance).toBeNull();
                expect(manager.measureLine?.visible).toBe(false);
                expect(manager.measureLabel?.visible).toBe(false);
            }
        });

        it('computes accurate astronomical distances in non-realistic mode across planets, moons, comets, and spacecraft without enabling realisticDistances', () => {
            const manager = new SceneManager(container);
            expect(manager.realisticDistances).toBe(false);

            // Configure Sun, Earth, Moon
            const sun = manager.planets[0];
            sun.data = { name: 'Sun', distance: 0, distanceAU: 0, eccentricity: 0 } as any;
            sun.angle = 0;

            const earth = manager.planets[1];
            earth.data = { name: 'Earth', distance: 130, distanceAU: 1.0, eccentricity: 0.0167 } as any;
            earth.angle = 0.85;
            earth.mesh!.position.set(130, 0, 0); // Compressed non-realistic visual position

            const moon = {
                data: { name: 'Moon', distance: 5, distanceAU: 0.00257, eccentricity: 0.0549 },
                angle: 1.2,
                moons: [],
                mesh: new THREE.Mesh()
            } as any;
            moon.mesh.position.set(135, 0, 0); // Schematic 5-unit offset instead of 0.00257 * 130
            earth.moons = [moon];

            // Configure Apollo 11 orbiting Moon, ISS orbiting Earth, and Voyager 1 escaping heliocentrically
            const apollo = manager.spacecrafts[0] as any;
            apollo.data = {
                name: 'Apollo 11',
                targetBody: 'Moon',
                distance: 1.1,
                distanceAU: 0.000012,
                eccentricity: 0,
                inclination: 0
            };
            apollo.angle = 0.5;
            apollo.mesh.position.set(136.1, 0, 0); // Compressed schematic position

            const iss = manager.spacecrafts[1] as any;
            iss.data = {
                name: 'ISS (International Space Station)',
                targetBody: 'Earth',
                distance: 2.5,
                distanceAU: 0.000045,
                eccentricity: 0.0003,
                inclination: 51.6
            };
            iss.angle = 1.1;
            iss.mesh.position.set(132.5, 0, 0);

            const voyager1 = manager.spacecrafts[2] as any;
            voyager1.data = {
                name: 'Voyager 1',
                targetBody: 'Earth',
                launchDate: '1977-09-05T12:56:00Z',
                distance: 2.0,
                distanceAU: 0.000045,
                escaping: true,
                speed: 1.5
            };
            // Simulate compressed non-realistic Voyager visual coordinates (~7.2 AU if divided by 130)
            voyager1.mesh.position.set(600, 500, 480);

            // Configure Halley's Comet with 3D inclination + argumentOfPeriapsis
            const halley = manager.comets[0] as any;
            halley.data = {
                name: "Halley's Comet",
                distanceAU: 17.834,
                semiMajorAxis: 180,
                eccentricity: 0.967,
                inclination: 162.2,
                argumentOfPeriapsis: 111.3
            };
            halley.e = 0.967;
            halley.angle = Math.PI; // Aphelion: r = a * (1 + e) = 17.834 * 1.967 = 35.079478 AU
            halley.orbitGroup.position.set(-354, 0, 0); // Compressed schematic visual coordinates

            manager.simDate = new Date('2026-10-31T00:00:00Z');
            manager.toggleMeasureMode(true);

            // 1. Earth <-> Moon in non-realistic mode (~0.00257 AU, NOT schematic 5/130 = 0.0385 AU)
            manager.setMeasureTarget('Earth');
            manager.setMeasureTarget('Moon');
            expect(manager.realisticDistances).toBe(false);
            const earthMoonNonReal = manager.currentMeasureDistance!.distanceAUVal;
            expect(earthMoonNonReal).toBeGreaterThan(0.0024);
            expect(earthMoonNonReal).toBeLessThan(0.0028);
            expect(manager.currentMeasureDistance!.distanceAU).not.toBe('0.0000');

            // 2. Moon <-> Apollo 11 (~0.000012 AU = ~0.0018 Mkm, NOT schematic 1.1/130 AU)
            manager.clearMeasureTargets();
            manager.setMeasureTarget('Moon');
            manager.setMeasureTarget('Apollo 11');
            expect(manager.currentMeasureDistance!.distanceAUVal).toBeCloseTo(0.000012, 6);
            expect(manager.currentMeasureDistance!.distanceAU).toBe('0.000012');
            expect(manager.currentMeasureDistance!.distanceMkm).toBe('0.0018');

            // 3. Earth <-> ISS with 51.6 deg inclination (~0.000045 AU = ~0.0067 Mkm)
            manager.clearMeasureTargets();
            manager.setMeasureTarget('Earth');
            manager.setMeasureTarget('ISS (International Space Station)');
            expect(manager.currentMeasureDistance!.distanceAUVal).toBeCloseTo(0.000045, 5);
            expect(manager.currentMeasureDistance!.distanceMkm).toBe('0.0067');

            // 4. Sun <-> Voyager 1 (~176.5 AU in Oct 2026, NOT compressed ~7.2 AU)
            manager.clearMeasureTargets();
            manager.setMeasureTarget('Sun');
            manager.setMeasureTarget('Voyager 1');
            const sunVoyagerAU = manager.currentMeasureDistance!.distanceAUVal;
            expect(sunVoyagerAU).toBeGreaterThan(170);
            expect(sunVoyagerAU).toBeLessThan(185);

            // 5. Sun <-> Halley's Comet at aphelion (35.079 AU with exact 3D Euler orientation)
            manager.clearMeasureTargets();
            manager.setMeasureTarget('Sun');
            manager.setMeasureTarget("Halley's Comet");
            expect(manager.currentMeasureDistance!.distanceAUVal).toBeCloseTo(17.834 * 1.967, 3);

            // Verify 3D comet vector matches Three.js baseGroup (rotation.y = argPeri, rotation.x = inc)
            const cometPosAU = new THREE.Vector3();
            manager.getAstronomicalPositionAU(halley, cometPosAU);
            const expectedCometVec = new THREE.Vector3(-17.834 * 1.967, 0, 0).applyEuler(
                new THREE.Euler(
                    THREE.MathUtils.degToRad(162.2),
                    THREE.MathUtils.degToRad(111.3),
                    0,
                    'XYZ'
                )
            );
            expect(cometPosAU.distanceTo(expectedCometVec)).toBeLessThan(1e-6);

            // 6. Verify realisticDistances = true produces identical astronomical distance to non-realistic mode
            const nonRealHalleyEarth = (() => {
                manager.clearMeasureTargets();
                manager.setMeasureTarget('Earth');
                manager.setMeasureTarget("Halley's Comet");
                return manager.currentMeasureDistance!.distanceAUVal;
            })();
            manager.realisticDistances = true;
            manager.updateMeasurement();
            expect(manager.currentMeasureDistance!.distanceAUVal).toBeCloseTo(nonRealHalleyEarth, 8);
        });
    });
});
