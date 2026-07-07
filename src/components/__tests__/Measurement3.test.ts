import { describe, it, expect, vi } from 'vitest';
import { SceneManager } from '../SceneManager';

describe('Measurement 3', () => {
    it('should update distance for planets when rotating', () => {
        const dom = document.createElement('div');
        const sm = new SceneManager(dom);

        sm.measureMode = true;
        const earth = sm.planets.find(p => p.data.name === 'Earth');
        const mars = sm.planets.find(p => p.data.name === 'Mars');
        sm.measureTargetA = earth!;
        sm.measureTargetB = mars!;

        sm.updateMeasureLabel = vi.fn(function(this: any, text: string) {
            if (!this.measureLabel) return;
            (this.measureLabel as any).userData.lastText = text;
        });

        sm.updateMeasurement();
        const text1 = (sm.measureLabel as any).userData.lastText;

        sm.timeScale = 1; // realistic time scale to see if rotation works

        for(let i=0; i<100; i++) {
            // Earth period = 1. mars period = 1.88
            // 1 sim day?
            earth!.update(0.1);
            mars!.update(0.1);
            sm.updateMeasurement();
        }

        const text2 = (sm.measureLabel as any).userData.lastText;

        console.log("Earth-Mars Text 1:", text1);
        console.log("Earth-Mars Text 2:", text2);
    });
});
