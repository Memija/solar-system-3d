import { describe, it, expect } from 'vitest';
import { SpacecraftDataList, CometDataList, SolarSystemData } from '../SolarSystemData';

describe('SolarSystemData', () => {
    it('should have spacecraft data', () => {
        expect(SpacecraftDataList.length).toBeGreaterThan(0);
        expect(SpacecraftDataList[0].name).toBeDefined();
    });

    it('should have comet data', () => {
        expect(CometDataList.length).toBeGreaterThan(0);
        expect(CometDataList[0].name).toBeDefined();
    });

    it('should have solar system data', () => {
        expect(SolarSystemData.length).toBeGreaterThan(0);
        expect(SolarSystemData[0].name).toBe('Sun');
    });
});
