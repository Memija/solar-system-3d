import { describe, it, expect, vi } from 'vitest';
import { SceneManager } from '../SceneManager';

describe('Measurement 2', () => {
    it('should update distance for moons', () => {
        const dom = document.createElement('div');
        const sm = new SceneManager(dom);

        sm.measureMode = true;
        const earth = sm.planets.find(p => p.data.name === 'Earth');
        const moon = earth!.moons.find(m => m.data.name === 'Moon');
        sm.measureTargetA = earth!;
        sm.measureTargetB = moon!;

        sm.updateMeasureLabel = vi.fn(function(this: any, text: string) {
            if (!this.measureLabel) return;
            (this.measureLabel as any).userData.lastText = text;
        });

        sm.updateMeasurement();
        const text1 = (sm.measureLabel as any).userData.lastText;

        sm.timeScale = 100000;

        for(let i=0; i<100; i++) {
            sm.update();
        }

        const text2 = (sm.measureLabel as any).userData.lastText;

        console.log("Earth-Moon Text 1:", text1);
        console.log("Earth-Moon Text 2:", text2);
    });
});
