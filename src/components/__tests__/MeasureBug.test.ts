import { describe, it, expect, vi } from 'vitest';
import { SceneManager } from '../SceneManager';

describe('Measure Bug', () => {
    it('check if updateMeasurement behaves differently with realistic distances', () => {
        const dom = document.createElement('div');
        const sm = new SceneManager(dom);

        // Turn on realistic distances
        sm.toggleRealisticDistances(true);

        sm.measureMode = true;
        const earth = sm.planets.find(p => p.data.name === 'Earth');
        const mars = sm.planets.find(p => p.data.name === 'Mars');
        sm.measureTargetA = earth!;
        sm.measureTargetB = mars!;

        sm.updateMeasureLabel = vi.fn(function(this: any, text: string) {
            if (!this.measureLabel) return;
            (this.measureLabel as any).userData.lastText = text;
        });

        // initial measure
        sm.updateMeasurement();
        const text1 = (sm.measureLabel as any).userData.lastText;

        // update a little bit, no realistic distance update happens here for planet mesh because earth.update updates orbitGroup not mesh rotation around sun... wait.
        // wait, CelestialBody.ts `update` method updates `orbitGroup.position.set(x, 0, z)`
        // So whether realisticDistances is true or false, `orbitGroup` moves!
        // But what if we measure between Earth and Mars, does the distance change? Let's see!

        for(let i=0; i<100; i++) {
            earth!.update(0.1);
            mars!.update(0.1);
            sm.updateMeasurement();
        }

        const text2 = (sm.measureLabel as any).userData.lastText;

        console.log("Earth-Mars (Realistic) Text 1:", text1);
        console.log("Earth-Mars (Realistic) Text 2:", text2);
    });
});
