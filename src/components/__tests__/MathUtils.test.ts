import { describe, it, expect } from 'vitest';
import {
    J2000_OBLIQUITY_RAD,
    computeGMSTRadians,
    computeKeplerianOrbitPoint,
    computeKeplerianState,
    equatorialToEcliptic3D,
    solveKepler
} from '../MathUtils';

describe('MathUtils', () => {
    describe('solveKepler', () => {
        it('should correctly solve E for circular orbits (e=0)', () => {
            const E = solveKepler(Math.PI, 0);
            expect(E).toBeCloseTo(Math.PI, 5);
        });

        it('should correctly solve E for elliptical orbits (0 < e < 1)', () => {
            const e = 0.5;
            const M = Math.PI / 4;
            const E = solveKepler(M, e);
            // Validate that the solution satisfies E - e * sin(E) - M = 0
            const f = E - e * Math.sin(E) - M;
            expect(f).toBeCloseTo(0, 5);
        });

        it('should correctly solve E and handle clamping for extreme eccentricities (e close to 1)', () => {
            // High eccentricity and M close to 0 causes large dE
            const e = 0.99;
            const M = 0.1;
            const E = solveKepler(M, e);

            // Validate that the solution satisfies E - e * sin(E) - M = 0
            const f = E - e * Math.sin(E) - M;
            expect(f).toBeCloseTo(0, 5);
        });

        it('should correctly handle clamping for negative extreme eccentricities', () => {
            // Forcing negative clamping by picking specific values
            const e = 0.99;
            const M = -0.1;
            const E = solveKepler(M, e);
            const f = E - e * Math.sin(E) - M;
            expect(f).toBeCloseTo(0, 5);
        });
    });

    describe('computeGMSTRadians', () => {
        it('returns J2000.0 Greenwich Mean Sidereal Time (280.4606 deg) at daysSinceJ2000 = 0', () => {
            const gmst0 = computeGMSTRadians(0);
            expect(gmst0).toBeCloseTo((280.46061837 * Math.PI) / 180, 6);
        });

        it('advances by ~360.9856 deg per solar day (one extra sidereal rotation per year)', () => {
            const gmst0 = computeGMSTRadians(0);
            const gmst1Day = computeGMSTRadians(1);
            const expected1Day = (((280.46061837 + 360.98564736629) % 360) * Math.PI) / 180;
            expect(gmst1Day).toBeCloseTo(expected1Day, 6);
            expect(gmst1Day).toBeGreaterThan(gmst0);
        });
    });

    describe('equatorialToEcliptic3D', () => {
        it('maps Vernal Equinox (RA = 0h, Dec = 0 deg) to (+R, 0, 0)', () => {
            const pt = equatorialToEcliptic3D(0, 0, 100);
            expect(pt.x).toBeCloseTo(100, 6);
            expect(pt.y).toBeCloseTo(0, 6);
            expect(pt.z).toBeCloseTo(0, 6);
        });

        it('maps North Celestial Pole (Dec = +90 deg) to Earth tilted North Pole (0, R cos eps, -R sin eps)', () => {
            const pt = equatorialToEcliptic3D(0, 90, 100);
            expect(pt.x).toBeCloseTo(0, 6);
            expect(pt.y).toBeCloseTo(100 * Math.cos(J2000_OBLIQUITY_RAD), 6);
            expect(pt.z).toBeCloseTo(-100 * Math.sin(J2000_OBLIQUITY_RAD), 6);
        });
    });

    describe('computeKeplerianState', () => {
        it('produces counter-clockwise prograde motion and sits strictly on schematic orbit circle', () => {
            const st = computeKeplerianState(Math.PI / 2, 130, 0.0934, true, 1.85, 336.06, 49.56, 1);
            expect(Math.hypot(st.x, st.y, st.z)).toBeCloseTo(130, 6);
            // Angular momentum (r x v).y = z * tx - x * tz > 0 (prograde counter-clockwise from +Y)
            const angMomY = st.z * st.tx - st.x * st.tz;
            expect(angMomY).toBeGreaterThan(0);
        });

        it('places perihelion at r = a * (1 - e) along longitudeOfPerihelion in realistic elliptical mode', () => {
            const varpiDeg = 102.937682;
            const varpiRad = (varpiDeg * Math.PI) / 180;
            const a = 1.0;
            const e = 0.01671123;
            const st = computeKeplerianState(varpiRad, a, e, false, 0, varpiDeg, 0, 1);
            expect(Math.hypot(st.x, st.y, st.z)).toBeCloseTo(a * (1 - e), 7);
            expect(st.x).toBeCloseTo(a * (1 - e) * Math.cos(varpiRad), 7);
            expect(st.z).toBeCloseTo(-a * (1 - e) * Math.sin(varpiRad), 7);

            const orbitPt0 = computeKeplerianOrbitPoint(0, a, e, 0, varpiDeg, 0);
            expect(st.x).toBeCloseTo(orbitPt0.x, 7);
            expect(st.z).toBeCloseTo(orbitPt0.z, 7);
        });
    });
});
