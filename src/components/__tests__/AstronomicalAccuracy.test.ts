import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { SceneManager } from '../SceneManager';

vi.mock('../TextureGenerator', () => ({
    TextureGenerator: {
        setMaxAnisotropy: vi.fn(),
        dispose: vi.fn(),
        getPlanetTexture: vi.fn(() => new THREE.Texture()),
        getPlanetRoughnessMap: vi.fn(() => new THREE.Texture()),
        getPlanetBumpMap: vi.fn(() => new THREE.Texture()),
        getRingTexture: vi.fn(() => new THREE.Texture()),
        updateEarthRoughnessFromImage: vi.fn()
    }
}));

/**
 * Computes solar elevation angle (in degrees above the local horizon) at geographic
 * latitude `latDeg` (North positive) and East longitude `lonDeg` on Earth's rendered
 * Three.js SphereGeometry (`u = 0.5 + lon/360`, `v = 0.5 + lat/180` -> `u=0.5` at local `+X`,
 * `u=0.75` / `90 deg E` at local `-Z`).
 */
function getSolarElevationDeg(manager: SceneManager, latDeg: number, lonDeg: number): number {
    const earth = manager.planets.find(p => p.data.name === 'Earth')!;
    expect(earth).toBeDefined();
    expect(earth.mesh).not.toBeNull();

    manager.scene.updateMatrixWorld(true);

    const latRad = THREE.MathUtils.degToRad(latDeg);
    const lonRad = THREE.MathUtils.degToRad(lonDeg);

    // Local outward surface normal on Three.js SphereGeometry for (lat, lon_E)
    const localNormal = new THREE.Vector3(
        Math.cos(latRad) * Math.cos(lonRad),
        Math.sin(latRad),
        -Math.cos(latRad) * Math.sin(lonRad)
    );

    const worldNormal = localNormal.clone().transformDirection(earth.mesh!.matrixWorld).normalize();
    const earthWorldPos = new THREE.Vector3();
    earth.mesh!.getWorldPosition(earthWorldPos);

    // Sun is at world origin (0, 0, 0)
    const toSun = earthWorldPos.clone().negate().normalize();
    const sinElevation = THREE.MathUtils.clamp(worldNormal.dot(toSun), -1, 1);
    return THREE.MathUtils.radToDeg(Math.asin(sinElevation));
}

/**
 * Converts a Three.js J2000 Ecliptic vector (x = X_ecl, y = Z_ecl, z = -Y_ecl)
 * to J2000 Equatorial (RA in hours [0, 24), Dec in degrees [-90, 90], radial distance).
 */
function eclipticSceneVecToEquatorial(vec: THREE.Vector3): { raHours: number; decDeg: number; r: number } {
    const r = vec.length();
    const xEcl = vec.x;
    const yEcl = -vec.z;
    const zEcl = vec.y;
    const eps = THREE.MathUtils.degToRad(23.4392911);
    const xEq = xEcl;
    const yEq = yEcl * Math.cos(eps) - zEcl * Math.sin(eps);
    const zEq = yEcl * Math.sin(eps) + zEcl * Math.cos(eps);
    const raHours = ((THREE.MathUtils.radToDeg(Math.atan2(yEq, xEq)) / 15) + 24) % 24;
    const decDeg = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(zEq / r, -1, 1)));
    return { raHours, decDeg, r };
}

describe('Astronomical Ephemeris, Orbits & Real-Time Day/Night Accuracy', () => {
    let container: HTMLElement;
    let manager: SceneManager;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        manager = new SceneManager(container);
    });

    afterEach(() => {
        manager?.dispose();
        document.body.innerHTML = '';
    });

    it('illuminates Germany during daytime in 1:1 Real-Time mode (including 2026-11-01 16:31 CET) and darkens it at night', () => {
        expect(manager.timeScale).toBeCloseTo(SceneManager.SPEED_PRESETS.realTime, 10);

        // Frankfurt am Main, Germany (50.11 N, 8.68 E)
        const frankfurtLat = 50.11;
        const frankfurtLon = 8.68;

        // 1. Midday in Germany on Nov 1, 2026 (12:00 CET = 11:00 UTC): Sun high above southern horizon (~25 deg)
        manager.setSimDate(new Date('2026-11-01T12:00:00+01:00'));
        const noonElev = getSolarElevationDeg(manager, frankfurtLat, frankfurtLon);
        expect(noonElev).toBeGreaterThan(22);
        expect(noonElev).toBeLessThan(29);

        // 2. Late afternoon user report timestamp (2026-11-01T16:31:02+01:00 = 15:31:02 UTC): still DAYLIGHT (> 0 deg)
        manager.setSimDate(new Date('2026-11-01T16:31:02+01:00'));
        const afternoonElevSchematic = getSolarElevationDeg(manager, frankfurtLat, frankfurtLon);
        expect(afternoonElevSchematic).toBeGreaterThan(2.0);

        // Must match in True 1:1 Scale mode (realisticDistances = true) as well
        manager.toggleRealisticDistances(true);
        const afternoonElevRealistic = getSolarElevationDeg(manager, frankfurtLat, frankfurtLon);
        expect(afternoonElevRealistic).toBeCloseTo(afternoonElevSchematic, 2);

        // 3. Nighttime in Germany on Nov 1, 2026 (22:00 CET = 21:00 UTC): deep night (< -40 deg)
        manager.toggleRealisticDistances(false);
        manager.setSimDate(new Date('2026-11-01T22:00:00+01:00'));
        const nightElev = getSolarElevationDeg(manager, frankfurtLat, frankfurtLon);
        expect(nightElev).toBeLessThan(-40);
    });

    it('reproduces seasonal solstices, equinoxes, and Arctic Midnight Sun / Polar Night via Earth axial obliquity', () => {
        // Greenwich Observatory (51.48 N, 0.0 E)
        // June Solstice noon (2026-06-21T12:00:00Z): expected elevation ~ 90 - 51.48 + 23.44 = ~61.96 deg
        manager.setSimDate(new Date('2026-06-21T12:00:00Z'));
        const summerNoon = getSolarElevationDeg(manager, 51.48, 0);
        expect(summerNoon).toBeGreaterThan(59);
        expect(summerNoon).toBeLessThan(65);

        // Arctic Circle / Tromso latitude (70 N, 0 E) at midnight UTC on June Solstice: Midnight Sun (> 0 deg)
        manager.setSimDate(new Date('2026-06-21T00:00:00Z'));
        const arcticMidnightSun = getSolarElevationDeg(manager, 70, 0);
        expect(arcticMidnightSun).toBeGreaterThan(1.5);

        // December Solstice noon (2026-12-21T12:00:00Z): expected elevation ~ 90 - 51.48 - 23.44 = ~15.08 deg
        manager.setSimDate(new Date('2026-12-21T12:00:00Z'));
        const winterNoon = getSolarElevationDeg(manager, 51.48, 0);
        expect(winterNoon).toBeGreaterThan(12);
        expect(winterNoon).toBeLessThan(18);

        // 70 N at noon UTC on December Solstice: Polar Night (< 0 deg even at noon!)
        const arcticPolarNightNoon = getSolarElevationDeg(manager, 70, 0);
        expect(arcticPolarNightNoon).toBeLessThan(-1.5);
    });

    it('aligns Polaris (North Star) with Earth tilted North Pole in J2000 Ecliptic coordinates', () => {
        const earth = manager.planets.find(p => p.data.name === 'Earth')!;
        const polaris = manager.starMeshes.find(s => s.userData?.name === 'Polaris');
        expect(polaris).toBeDefined();

        manager.scene.updateMatrixWorld(true);
        const earthNorthAxis = new THREE.Vector3(0, 1, 0)
            .transformDirection(earth.mesh!.matrixWorld)
            .normalize();
        const polarisDir = polaris!.position.clone().normalize();

        // Polaris (Dec +89.26 deg) lies within < 1 deg of Earth's North Celestial Pole (cos(1 deg) = 0.99985)
        const angleDeg = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(earthNorthAxis.dot(polarisDir), -1, 1)));
        expect(angleDeg).toBeLessThan(1.2);
    });

    it('places planets and dwarf planets at accurate JPL J2000/SBDB heliocentric longitudes on 2026-11-01', () => {
        manager.setSimDate(new Date('2026-11-01T15:31:02Z'));

        const getHeliocentricLongitudeDeg = (name: string): number => {
            const vec = new THREE.Vector3();
            manager.getAstronomicalPositionAU({ name }, vec);
            // Three.js Ecliptic mapping: x = X_ecl, z = -Y_ecl => lambda = atan2(-z, x)
            const deg = THREE.MathUtils.radToDeg(Math.atan2(-vec.z, vec.x));
            return ((deg % 360) + 360) % 360;
        };

        // Reference NASA JPL Standish (1992) & JPL Small-Body Database (Epoch JD 2461200.5)
        // heliocentric ecliptic longitudes for 2026-11-01T15:31:02Z:
        const expectedJPLLongitudes: Record<string, { lon: number; tol: number }> = {
            Mercury: { lon: 24.83, tol: 1.0 },
            Venus: { lon: 43.92, tol: 1.0 },
            Earth: { lon: 38.85, tol: 1.0 },
            Mars: { lon: 100.73, tol: 1.0 },
            Jupiter: { lon: 133.68, tol: 1.0 },
            Saturn: { lon: 11.95, tol: 1.0 },
            Uranus: { lon: 63.01, tol: 1.0 },
            Neptune: { lon: 2.84, tol: 1.0 },
            Pluto: { lon: 304.93, tol: 1.0 },
            Ceres: { lon: 91.14, tol: 0.5 },
            Eris: { lon: 25.02, tol: 0.5 },
            Haumea: { lon: 213.41, tol: 0.5 },
            Makemake: { lon: 191.92, tol: 0.5 }
        };

        for (const [bodyName, { lon: expectedDeg, tol }] of Object.entries(expectedJPLLongitudes)) {
            const actualDeg = getHeliocentricLongitudeDeg(bodyName);
            let diff = Math.abs(actualDeg - expectedDeg) % 360;
            if (diff > 180) diff = 360 - diff;
            expect(diff, `${bodyName} longitude ${actualDeg.toFixed(2)} deg vs JPL ${expectedDeg} deg`).toBeLessThan(tol);
        }
    });

    it('reproduces Earth Moon Last Quarter phase on 2026-11-01 and tidally locks lunar near side toward Earth', () => {
        manager.setSimDate(new Date('2026-11-01T16:46:58Z'));

        const earthPos = new THREE.Vector3();
        const moonPos = new THREE.Vector3();
        manager.getAstronomicalPositionAU({ name: 'Earth' }, earthPos);
        manager.getAstronomicalPositionAU({ name: 'Moon' }, moonPos);

        const geocentricMoon = moonPos.clone().sub(earthPos);
        const geocentricSun = earthPos.clone().negate();

        const moonLon = ((THREE.MathUtils.radToDeg(Math.atan2(-geocentricMoon.z, geocentricMoon.x)) % 360) + 360) % 360;
        const sunLon = ((THREE.MathUtils.radToDeg(Math.atan2(-geocentricSun.z, geocentricSun.x)) % 360) + 360) % 360;
        const elongation = ((moonLon - sunLon) % 360 + 360) % 360;

        // Real Last Quarter Moon occurs on Nov 1, 2026 (elongation ~260-276 deg ahead of Sun = ~84-100 deg West of Sun)
        expect(elongation).toBeGreaterThan(258);
        expect(elongation).toBeLessThan(278);
    });

    it('positions Halley and Hale-Bopp comets in 3D J2000 Ecliptic space with ascending node and realistic period rate', () => {
        manager.setSimDate(new Date('2026-11-01T16:46:58Z'));
        manager.toggleRealisticDistances(true);
        manager.scene.updateMatrixWorld(true);

        // 1. Halley's Comet: just past Dec 2023 aphelion in Hydra (~34.9 AU, RA ~8.24h, Dec ~+3.1 deg)
        const halleyAU = new THREE.Vector3();
        manager.getAstronomicalPositionAU({ name: "Halley's Comet" }, halleyAU);
        const halleyEq = eclipticSceneVecToEquatorial(halleyAU);
        expect(halleyEq.r).toBeGreaterThan(34.5);
        expect(halleyEq.r).toBeLessThan(35.3);
        expect(halleyEq.raHours).toBeGreaterThan(7.9);
        expect(halleyEq.raHours).toBeLessThan(8.6);
        expect(halleyEq.decDeg).toBeGreaterThan(1.5);
        expect(halleyEq.decDeg).toBeLessThan(4.5);

        // Verify rendered Three.js world position of Halley's Comet matches getAstronomicalPositionAU * 130
        const halleyObj = manager.comets.find(c => c.data.name === "Halley's Comet")!;
        const halleyWorld = new THREE.Vector3();
        halleyObj.mesh.getWorldPosition(halleyWorld);
        expect(halleyWorld.distanceTo(halleyAU.clone().multiplyScalar(130))).toBeLessThan(1e-3);

        // 2. Comet Hale-Bopp: outbound at ~51.2 AU near South Celestial Pole in Octans (Dec < -80 deg)
        const haleBoppAU = new THREE.Vector3();
        manager.getAstronomicalPositionAU({ name: 'Hale-Bopp' }, haleBoppAU);
        const haleBoppEq = eclipticSceneVecToEquatorial(haleBoppAU);
        expect(haleBoppEq.r).toBeGreaterThan(49.5);
        expect(haleBoppEq.r).toBeLessThan(53.0);
        expect(haleBoppEq.decDeg).toBeLessThan(-80);
    });

    it('positions Voyager 1, Voyager 2, JWST (Sun-Earth L2), and Cassini mission lifecycle accurately', () => {
        manager.setSimDate(new Date('2026-11-01T16:46:58Z'));

        // 1. Voyager 1: ~172.2 AU in Ophiuchus (RA ~17.25h, Dec ~+12.1 deg)
        const v1AU = new THREE.Vector3();
        manager.getAstronomicalPositionAU({ name: 'Voyager 1' }, v1AU);
        const v1Eq = eclipticSceneVecToEquatorial(v1AU);
        expect(v1Eq.r).toBeGreaterThan(170.5);
        expect(v1Eq.r).toBeLessThan(174.0);
        expect(v1Eq.raHours).toBeCloseTo(17.25, 1);
        expect(v1Eq.decDeg).toBeCloseTo(12.1, 0);

        // 2. Voyager 2: ~144.4 AU in Pavo (RA ~20.16h, Dec ~-59.6 deg)
        const v2AU = new THREE.Vector3();
        manager.getAstronomicalPositionAU({ name: 'Voyager 2' }, v2AU);
        const v2Eq = eclipticSceneVecToEquatorial(v2AU);
        expect(v2Eq.r).toBeGreaterThan(142.5);
        expect(v2Eq.r).toBeLessThan(146.5);
        expect(v2Eq.raHours).toBeCloseTo(20.16, 1);
        expect(v2Eq.decDeg).toBeCloseTo(-59.6, 0);

        // 3. James Webb Space Telescope: stationed anti-sunward of Earth at Sun-Earth L2 (~0.01 AU beyond Earth)
        const earthAU = new THREE.Vector3();
        const jwstAU = new THREE.Vector3();
        manager.getAstronomicalPositionAU({ name: 'Earth' }, earthAU);
        manager.getAstronomicalPositionAU({ name: 'James Webb Space Telescope' }, jwstAU);
        const earthToJwst = jwstAU.clone().sub(earthAU);
        expect(earthToJwst.length()).toBeCloseTo(0.01, 4);
        const antiSunAngleDeg = THREE.MathUtils.radToDeg(
            Math.acos(THREE.MathUtils.clamp(earthAU.clone().normalize().dot(earthToJwst.clone().normalize()), -1, 1))
        );
        expect(antiSunAngleDeg).toBeLessThan(3.0);

        // 4. Cassini: ended mission on 2017-09-15 (inactive in 2026, active in 2010)
        const cassini = manager.spacecrafts.find(s => s.data.name === 'Cassini')!;
        expect(cassini.isActive).toBe(false);
        manager.setSimDate(new Date('2010-06-01T00:00:00Z'));
        expect(cassini.isActive).toBe(true);
    });
});
