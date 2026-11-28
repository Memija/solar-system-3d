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

        // Check astronomical obliquity tilt around Vernal Equinox X axis toward -Z June Solstice
        expect(body.tiltGroup.rotation.x).toBeCloseTo(-(23.5 * Math.PI) / 180);
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

    it('orbits prograde planets counter-clockwise from North (+Y) and keeps tidally locked Moon near-side facing Earth', () => {
        const earthData = SolarSystemData.find(b => b.name === 'Earth')!;
        const earth = new CelestialBody(earthData, parentGroup);
        const moon = earth.moons[0];
        expect(moon).toBeDefined();
        expect(moon.data.tidallyLocked).toBe(true);

        // Advance Earth by 1/8 year (simTimePassed = 0 -> PI/2): counter-clockwise means (r0 x r1).y = z0 * x1 - x0 * z1 > 0
        earth.update(0, 0, 0);
        const p0 = earth.orbitGroup.position.clone();
        earth.update(0, Math.PI * 0.5, 0);
        const p1 = earth.orbitGroup.position.clone();
        const crossY = p0.z * p1.x - p0.x * p1.z;
        expect(crossY).toBeGreaterThan(0);

        // Check tidally locked Moon across 4 orbital quadrants: local +X (u = 0.5 lunar near-side center) faces Earth
        for (const frac of [0, 0.25, 0.5, 0.75]) {
            earth.update(0, frac * 4 * Math.PI * moon.data.period, 0);
            parentGroup.updateMatrixWorld(true);

            const earthPos = new THREE.Vector3();
            const moonPos = new THREE.Vector3();
            earth.mesh!.getWorldPosition(earthPos);
            moon.mesh!.getWorldPosition(moonPos);

            const toEarth = earthPos.clone().sub(moonPos).normalize();
            const moonNearSideNormal = new THREE.Vector3(1, 0, 0)
                .transformDirection(moon.mesh!.matrixWorld)
                .normalize();

            // Accounting for Moon's 6.68 deg axial tilt & 5.145 deg inclination (optical libration),
            // the near-side prime meridian always points toward Earth (dot > 0.97)
            expect(moonNearSideNormal.dot(toEarth)).toBeGreaterThan(0.97);
        }
    });

    it('clears planet and moon motion trails on clearTrail() and updates culled moons when forceTransform is true', () => {
        const earthData = SolarSystemData.find(b => b.name === 'Earth')!;
        const earth = new CelestialBody(earthData, parentGroup);
        const moon = earth.moons[0];

        earth.toggleTrails(true);
        for (let step = 0; step < 6; step++) {
            earth.update(0, step * 0.5, 0);
        }
        expect(earth.trailPositions.length).toBeGreaterThan(2);
        expect(moon.trailPositions.length).toBeGreaterThan(2);

        earth.clearTrail();
        expect(earth.trailPositions.length).toBe(0);
        expect(moon.trailPositions.length).toBe(0);
        expect(earth.trailLine!.geometry.drawRange.count).toBe(0);
        expect(moon.trailLine!.geometry.drawRange.count).toBe(0);

        // Simulate LOD-culled moon when trails are disabled
        earth.toggleTrails(false);
        moon.isCulled = true;
        moon.orbitGroup.matrixAutoUpdate = false;
        const beforeJumpPos = moon.orbitGroup.position.clone();

        // Forced transform sync (used by setSimDate / syncEphemeris) updates culled moons too
        earth.update(0, 1.25, 0, true);
        expect(moon.orbitGroup.position.distanceTo(beforeJumpPos)).toBeGreaterThan(0.1);
    });

    it('keeps the Sun surface opaque with depth writing enabled and includes logarithmic depth chunks across custom shaders', () => {
        const sunData = SolarSystemData.find(b => b.name === 'Sun')!;
        const sun = new CelestialBody(sunData, parentGroup);

        expect(sun.shaderMaterial).toBeInstanceOf(THREE.ShaderMaterial);
        expect(sun.shaderMaterial!.transparent).toBe(false);
        expect(sun.shaderMaterial!.depthWrite).toBe(true);
        expect(sun.shaderMaterial!.depthTest).toBe(true);
        expect(sun.shaderMaterial!.side).toBe(THREE.FrontSide);

        const coronaMat = sun.coronaMesh?.material as THREE.ShaderMaterial;
        expect(coronaMat).toBeInstanceOf(THREE.ShaderMaterial);
        expect(coronaMat.vertexShader).toContain('#include <logdepthbuf_vertex>');
        expect(coronaMat.fragmentShader).toContain('#include <logdepthbuf_fragment>');

        const earthData = SolarSystemData.find(b => b.name === 'Earth')!;
        const earth = new CelestialBody(earthData, parentGroup);
        const atmoMat = earth.atmosphereMesh?.material as THREE.ShaderMaterial;
        expect(atmoMat).toBeInstanceOf(THREE.ShaderMaterial);
        expect(atmoMat.vertexShader).toContain('#include <logdepthbuf_vertex>');
        expect(atmoMat.fragmentShader).toContain('#include <logdepthbuf_fragment>');
        expect(earth.auroraMaterial?.vertexShader).toContain('#include <logdepthbuf_vertex>');
        expect(earth.auroraMaterial?.fragmentShader).toContain('#include <logdepthbuf_fragment>');

        // Planet labels use depthTest: true so labels behind the Sun are properly occluded
        expect(earth.labelSprite?.material.depthTest).toBe(true);
        expect(earth.labelSprite?.material.depthWrite).toBe(false);
    });

    it('enhances Earth surface and cloud shaders with crisp day-night terminator, Minnaert daylight lift, and nighttime city lights', () => {
        const earthData = SolarSystemData.find(b => b.name === 'Earth')!;
        const earth = new CelestialBody(earthData, parentGroup);

        const earthMat = earth.mesh?.material as THREE.MeshStandardMaterial;
        expect(earthMat).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect(earthMat.customProgramCacheKey?.()).toBe('earth-day-night-v2');

        const mockEarthShader: any = {
            uniforms: {},
            vertexShader: THREE.ShaderLib.standard.vertexShader,
            fragmentShader: THREE.ShaderLib.standard.fragmentShader
        };
        earthMat.onBeforeCompile(mockEarthShader, {} as any);

        expect(mockEarthShader.uniforms.tNightLights?.value).toBeInstanceOf(THREE.Texture);
        expect(mockEarthShader.vertexShader).toContain('vEarthWorldNormal');
        expect(mockEarthShader.fragmentShader).toContain('terminatorGlow');
        expect(mockEarthShader.fragmentShader).toContain('nightLightsSample');
        expect(mockEarthShader.fragmentShader).toContain('limbTransmit');
        expect(mockEarthShader.fragmentShader).toContain('cityEmission');
        expect(mockEarthShader.fragmentShader).toContain('oceanDayScatter');

        const cloudMat = earth.cloudMesh?.material as THREE.MeshStandardMaterial;
        expect(cloudMat).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect(cloudMat.customProgramCacheKey?.()).toBe('earth-clouds-day-night-v1');

        const mockCloudShader: any = {
            uniforms: {},
            vertexShader: THREE.ShaderLib.standard.vertexShader,
            fragmentShader: THREE.ShaderLib.standard.fragmentShader
        };
        cloudMat.onBeforeCompile(mockCloudShader, {} as any);
        expect(mockCloudShader.fragmentShader).toContain('cloudSunsetTint');
        expect(mockCloudShader.fragmentShader).toContain('cloudDayMask');
    });

    it('adds Earthshine and bump-shaded dark-side relief to the Moon material so lunar craters remain visible in shadow', () => {
        const earthData = SolarSystemData.find(b => b.name === 'Earth')!;
        const earth = new CelestialBody(earthData, parentGroup);
        const moon = earth.moons.find(m => m.data.name === 'Moon')!;
        expect(moon).toBeDefined();

        const moonMat = moon.mesh?.material as THREE.MeshStandardMaterial;
        expect(moonMat).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect(moonMat.customProgramCacheKey?.()).toBe('moon-earthshine-v1');

        const mockMoonShader: any = {
            uniforms: {},
            vertexShader: THREE.ShaderLib.standard.vertexShader,
            fragmentShader: THREE.ShaderLib.standard.fragmentShader
        };
        moonMat.onBeforeCompile(mockMoonShader, {} as any);

        expect(mockMoonShader.vertexShader).toContain('vMoonEarthDirView');
        expect(mockMoonShader.fragmentShader).toContain('earthshineColor');
        expect(mockMoonShader.fragmentShader).toContain('starlightFill');
        expect(mockMoonShader.fragmentShader).toContain('lunarDarkSideFill');
    });

    it('keeps all other planets, moons, and planetary rings legible when observed from their dark side toward the Sun', () => {
        for (const name of ['Mercury', 'Mars', 'Jupiter', 'Saturn', 'Neptune', 'Pluto']) {
            const raw = SolarSystemData.find(b => b.name === name)!;
            const body = new CelestialBody({ ...raw, moons: [] }, parentGroup);
            const mat = body.mesh?.material as THREE.MeshStandardMaterial;
            expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);
            expect(mat.customProgramCacheKey?.()).toBe('celestial-darkside-v1');

            const mockShader: any = {
                uniforms: {},
                vertexShader: THREE.ShaderLib.standard.vertexShader,
                fragmentShader: THREE.ShaderLib.standard.fragmentShader
            };
            mat.onBeforeCompile(mockShader, {} as any);
            expect(mockShader.vertexShader).toContain('vBodyWorldNormal');
            expect(mockShader.fragmentShader).toContain('bodyStarlight');
            expect(mockShader.fragmentShader).toContain('darkSideFill');

            if (name === 'Saturn') {
                expect(body.ringMeshes.length).toBeGreaterThan(0);
                const ringMat = body.ringMeshes[0].material as THREE.MeshStandardMaterial;
                expect(ringMat.emissiveIntensity).toBeGreaterThan(0.05);
            }
        }
    });
});
