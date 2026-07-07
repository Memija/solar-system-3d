import { describe, it, expect, vi } from 'vitest';
import { SceneManager } from '../SceneManager';

describe('Measure Bug 2', () => {
    it('check if updateMeasurement gets called every frame and matrices are updated', () => {
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

        // initial measure
        sm.updateMeasurement();
        const text1 = (sm.measureLabel as any).userData.lastText;

        // When user asks for rotation to update measurement...
        // the rotation refers to the planet's rotation around its axis!
        // wait, does distance change when planet rotates around its axis?
        // No, the distance between centers of two planets should not change with rotation around its axis.
        // Wait! What if they clicked on the surface of the planet?
        // But the target is a celestial body, not a specific point on the surface.
        // The measurement in SceneManager uses orbitGroup or mesh world position, which is the center.
        // Oh! Maybe they mean "rotation of the camera"? No, "value still does not get updated with the rotation"

        // Let's re-read the SceneManager.ts measure updates.
        // updateMeasurement is called in SceneManager.ts at the end of update()
    });
});
