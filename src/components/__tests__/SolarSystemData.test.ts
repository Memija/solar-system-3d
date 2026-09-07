import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { SpacecraftDataList, CometDataList, SolarSystemData } from '../SolarSystemData';
import { MajorConstellations } from '../ConstellationData';

const publicDir = path.resolve(__dirname, '../../../public');

function verifyAssetExists(assetPath: string, context: string) {
    const cleanPath = assetPath.replace(/^\//, '');
    const fullPath = path.join(publicDir, cleanPath);
    const exists = fs.existsSync(fullPath);
    expect(exists, `Asset "${cleanPath}" for ${context} should exist at ${fullPath}`).toBe(true);
    if (exists) {
        const stat = fs.statSync(fullPath);
        expect(stat.size, `Asset "${cleanPath}" for ${context} should not be empty`).toBeGreaterThan(0);
    }
}

describe('SolarSystemData', () => {
    it('should have spacecraft data', () => {
        expect(SpacecraftDataList.length).toBeGreaterThan(0);
        expect(SpacecraftDataList[0].name).toBeDefined();
    });

    it('should have comet data', () => {
        expect(CometDataList.length).toBeGreaterThan(0);
        expect(CometDataList[0].name).toBeDefined();
    });

    it('should have solar system data with Sun as the central body', () => {
        expect(SolarSystemData.length).toBeGreaterThan(0);
        const sun = SolarSystemData.find(b => b.name === 'Sun');
        expect(sun).toBeDefined();
        expect(sun!.imageUrl).toBeDefined();
        expect(sun!.images).toBeDefined();
        expect(sun!.images!.length).toBe(3);

        // Verify Sun's images all exist and have non-zero file size
        verifyAssetExists(sun!.imageUrl!, 'Sun primary imageUrl');
        sun!.images!.forEach((img, idx) => {
            verifyAssetExists(img, `Sun image [${idx}]`);
        });
    });

    it('should have all valid images for Uranus', () => {
        const uranus = SolarSystemData.find(b => b.name === 'Uranus');
        expect(uranus).toBeDefined();
        expect(uranus!.imageUrl).toBeDefined();
        verifyAssetExists(uranus!.imageUrl!, 'Uranus primary imageUrl');
        uranus!.images?.forEach((img, idx) => {
            verifyAssetExists(img, `Uranus image [${idx}]`);
        });
    });

    it('should have existing images and textures for all celestial bodies and moons', () => {
        SolarSystemData.forEach(body => {
            if (body.imageUrl) {
                verifyAssetExists(body.imageUrl, `${body.name} imageUrl`);
            }
            if (body.images) {
                body.images.forEach((img, idx) => {
                    verifyAssetExists(img, `${body.name} image [${idx}]`);
                });
            }
            if (body.texture) {
                verifyAssetExists(body.texture, `${body.name} texture`);
            }

            if ('moons' in body && body.moons) {
                body.moons.forEach(moon => {
                    if (moon.imageUrl) {
                        verifyAssetExists(moon.imageUrl, `${body.name} Moon ${moon.name} imageUrl`);
                    }
                    if (moon.images) {
                        moon.images.forEach((img, idx) => {
                            verifyAssetExists(img, `${body.name} Moon ${moon.name} image [${idx}]`);
                        });
                    }
                    if (moon.texture) {
                        verifyAssetExists(moon.texture, `${body.name} Moon ${moon.name} texture`);
                    }
                });
            }
        });
    });

    it('should have existing images for all spacecraft', () => {
        SpacecraftDataList.forEach(craft => {
            if (craft.imageUrl) {
                verifyAssetExists(craft.imageUrl, `Spacecraft ${craft.name} imageUrl`);
            }
            if (craft.images) {
                craft.images.forEach((img, idx) => {
                    verifyAssetExists(img, `Spacecraft ${craft.name} image [${idx}]`);
                });
            }
        });
    });

    it('should have existing images for all comets', () => {
        CometDataList.forEach(comet => {
            if (comet.imageUrl) {
                verifyAssetExists(comet.imageUrl, `Comet ${comet.name} imageUrl`);
            }
            if (comet.images) {
                comet.images.forEach((img, idx) => {
                    verifyAssetExists(img, `Comet ${comet.name} image [${idx}]`);
                });
            }
        });
    });

    it('should have existing images for all major constellations', () => {
        MajorConstellations.forEach(constellation => {
            if (constellation.imageUrl) {
                verifyAssetExists(constellation.imageUrl, `Constellation ${constellation.name} imageUrl`);
            }
            if (constellation.images) {
                constellation.images.forEach((img, idx) => {
                    verifyAssetExists(img, `Constellation ${constellation.name} image [${idx}]`);
                });
            }
        });
    });
});
