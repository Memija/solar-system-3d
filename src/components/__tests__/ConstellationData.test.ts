import { describe, it, expect } from 'vitest';
import { MajorConstellations } from '../ConstellationData';
import { i18n } from '../../i18n';

describe('ConstellationData', () => {
    it('should have valid constellation data structures', () => {
        expect(MajorConstellations.length).toBeGreaterThan(0);
        MajorConstellations.forEach(c => {
            expect(c.name).toBeTruthy();
            expect(c.stars.length).toBeGreaterThan(0);
            expect(c.connections.length).toBeGreaterThan(0);
            expect(c.area).toBeGreaterThan(0);
            expect(c.brightestStar).toBeTruthy();
            expect(c.family).toBeTruthy();

            // All star coordinates must be astronomically valid
            c.stars.forEach(star => {
                expect(star.name).toBeTruthy();
                expect(star.ra).toBeGreaterThanOrEqual(0);
                expect(star.ra).toBeLessThan(24);
                expect(star.dec).toBeGreaterThanOrEqual(-90);
                expect(star.dec).toBeLessThanOrEqual(90);
            });

            // All connection indices must reference valid stars in the array
            c.connections.forEach(pair => {
                expect(pair).toHaveLength(2);
                expect(pair[0]).toBeGreaterThanOrEqual(0);
                expect(pair[0]).toBeLessThan(c.stars.length);
                expect(pair[1]).toBeGreaterThanOrEqual(0);
                expect(pair[1]).toBeLessThan(c.stars.length);
                expect(pair[0]).not.toBe(pair[1]);
            });
        });
    });

    it('should have astronomically correct Ursa Minor bowl connection', () => {
        const umi = MajorConstellations.find(c => c.name.startsWith('Ursa Minor'));
        expect(umi).toBeDefined();
        // Index 6 is Kochab, index 3 is Zeta UMi (attaches to the handle)
        const hasBowlClosingConnection = umi?.connections.some(
            pair => (pair[0] === 6 && pair[1] === 3) || (pair[0] === 3 && pair[1] === 6)
        );
        expect(hasBowlClosingConnection).toBe(true);

        // Kochab must NOT connect to Epsilon UMi (index 2)
        const hasErroneousHandleLine = umi?.connections.some(
            pair => (pair[0] === 6 && pair[1] === 2) || (pair[0] === 2 && pair[1] === 6)
        );
        expect(hasErroneousHandleLine).toBe(false);
    });

    it('should have symmetrical hourglass body connections for Orion', () => {
        const orion = MajorConstellations.find(c => c.name === 'Orion');
        expect(orion).toBeDefined();
        // 0: Betelgeuse, 1: Rigel, 2: Bellatrix, 3: Mintaka, 4: Alnilam, 5: Alnitak, 6: Saiph
        const connects = (a: number, b: number) =>
            orion?.connections.some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));

        expect(connects(0, 2)).toBe(true); // Shoulders: Betelgeuse - Bellatrix
        expect(connects(2, 3)).toBe(true); // Right torso: Bellatrix - Mintaka
        expect(connects(3, 1)).toBe(true); // Right leg: Mintaka - Rigel
        expect(connects(1, 6)).toBe(true); // Feet: Rigel - Saiph
        expect(connects(6, 5)).toBe(true); // Left leg: Saiph - Alnitak
        expect(connects(5, 0)).toBe(true); // Left torso: Alnitak - Betelgeuse
        expect(connects(3, 4)).toBe(true); // Belt: Mintaka - Alnilam
        expect(connects(4, 5)).toBe(true); // Belt: Alnilam - Alnitak

        // Must NOT have cross-body diagonal error lines
        expect(connects(1, 5)).toBe(false); // Rigel - Alnitak diagonal
        expect(connects(3, 0)).toBe(false); // Mintaka - Betelgeuse diagonal
    });

    it('should have correct Declination for Wei in Scorpius', () => {
        const scorpius = MajorConstellations.find(c => c.name === 'Scorpius');
        expect(scorpius).toBeDefined();
        const wei = scorpius?.stars.find(s => s.name === 'Wei');
        expect(wei).toBeDefined();
        // Actual dec of Wei (Epsilon Scorpii) is approx -34.29°
        expect(wei!.dec).toBeCloseTo(-34.29, 1);
        expect(wei!.dec).toBeLessThan(-30);
    });

    it('should have consistent Hercules family for Crux across i18n locales', () => {
        const crux = MajorConstellations.find(c => c.name.startsWith('Crux'));
        expect(crux?.family).toBe('Hercules');

        const enFamily = i18n.getConstellationFamily('Crux');
        expect(enFamily).toBe('Hercules');

        i18n.setLanguage('bs');
        expect(i18n.getConstellationFamily('Crux')).toBe('Herkul');

        i18n.setLanguage('de');
        expect(i18n.getConstellationFamily('Crux')).toBe('Herkules');

        i18n.setLanguage('en');
    });
});

