import { describe, it, expect } from 'vitest';
import { solveKepler } from '../MathUtils';

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
});
