import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SceneManager } from '../SceneManager';

describe('Measurement', () => {
    it('should update distance as planets rotate', () => {
        const dom = document.createElement('div');
        const sm = new SceneManager(dom);

        // Find Earth and Mars
        const earth = sm.planets.find(p => p.data.name === 'Earth');
        const mars = sm.planets.find(p => p.data.name === 'Mars');

        sm.measureMode = true;
        sm.measureTargetA = earth!;
        sm.measureTargetB = mars!;

        // Mock the internal updateMeasureLabel to avoid canvas roundRect
        sm.updateMeasureLabel = vi.fn(function(this: any, text: string) {
            if (!this.measureLabel) return;
            (this.measureLabel as any).userData.lastText = text;
        });

        sm.updateMeasurement();
        const text1 = (sm.measureLabel as any).userData.lastText;

        // Speed up time
        sm.timeScale = 100000;

        // Rotate
        for(let i=0; i<100; i++) {
            sm.update();
        }

        const text2 = (sm.measureLabel as any).userData.lastText;

        console.log("Text 1:", text1);
        console.log("Text 2:", text2);

        expect(text1).not.toEqual(text2);
    });
});
