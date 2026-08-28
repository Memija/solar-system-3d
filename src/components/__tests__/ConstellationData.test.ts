import { describe, it, expect } from 'vitest';
import { MajorConstellations } from '../ConstellationData';

describe('ConstellationData', () => {
    it('should have constellation data', () => {
        expect(MajorConstellations.length).toBeGreaterThan(0);
        expect(MajorConstellations[0].name).toBeDefined();
        expect(MajorConstellations[0].stars).toBeDefined();
        expect(MajorConstellations[0].connections).toBeDefined();
    });
});
